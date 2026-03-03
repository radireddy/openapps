import React, { useState } from 'react';
import { Theme, GlobalTheme } from '@/types';
import { ThemePresetSelector } from './ThemePresetSelector';
import { ThemeSectionColors } from './ThemeSectionColors';
import { ThemeSectionTypography } from './ThemeSectionTypography';
import { ThemeSectionSpacing } from './ThemeSectionSpacing';
import { ThemeSectionEffects } from './ThemeSectionEffects';
import { ThemeSectionBorders } from './ThemeSectionBorders';
import { ThemeLivePreview } from './ThemeLivePreview';
import { ThemeTokenSearch } from './ThemeTokenSearch';
import { ThemeImportExport } from './ThemeImportExport';
import { generateTheme } from '@/services/ai/themeGenerationService';

type TabId = 'presets' | 'colors' | 'typography' | 'effects' | 'spacing';

interface ThemeEditorPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: Theme;
  onUpdateTheme: (category: keyof Theme, prop: string, value: string) => void;
  globalThemes: GlobalTheme[];
  onApplyGlobalTheme: (theme: Theme) => void;
}

const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  {
    id: 'presets',
    label: 'Presets',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'colors',
    label: 'Colors',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    id: 'typography',
    label: 'Type',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    ),
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: 'spacing',
    label: 'Space',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
  },
];

export const ThemeEditorPanel: React.FC<ThemeEditorPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  theme,
  onUpdateTheme,
  globalThemes,
  onApplyGlobalTheme,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('presets');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedGlobalThemeId, setSelectedGlobalThemeId] = useState<string>('');
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIGenerateTheme = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const result = await generateTheme(aiPrompt.trim());
      onApplyGlobalTheme(result.theme);
      setAiPrompt('');
      setShowAIPrompt(false);
    } catch (err) {
      console.error('AI theme generation failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyTheme = () => {
    const globalThemeToApply = globalThemes.find((t) => t.id === selectedGlobalThemeId);
    if (globalThemeToApply) {
      onApplyGlobalTheme(globalThemeToApply.theme);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-md hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-text"
          aria-label="Expand Theme Panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-ed-text-secondary uppercase tracking-wider">App Theme</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowAIPrompt(!showAIPrompt); setShowSearch(false); }}
              className={`p-1 rounded hover:bg-ed-bg-hover ${showAIPrompt ? 'text-ed-accent' : 'text-ed-text-tertiary'}`}
              title="Generate theme with AI"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </button>
            <button
              onClick={() => { setShowSearch(!showSearch); setShowAIPrompt(false); }}
              className={`p-1 rounded hover:bg-ed-bg-hover ${showSearch ? 'text-ed-accent' : 'text-ed-text-tertiary'}`}
              title="Search tokens"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <ThemeImportExport theme={theme} onImport={onApplyGlobalTheme} />
          </div>
        </div>

        {/* AI Theme Generator */}
        {showAIPrompt && (
          <div className="mb-2 p-2 bg-ed-bg-secondary border border-ed-border rounded-md">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAIGenerateTheme(); }}
                placeholder="e.g., Dark cyberpunk theme"
                disabled={aiLoading}
                className="flex-1 p-1.5 text-[11px] bg-ed-bg border border-ed-border rounded text-ed-text placeholder-ed-text-tertiary focus:outline-none focus:ring-1 focus:ring-ed-accent/40 disabled:opacity-50"
              />
              <button
                onClick={handleAIGenerateTheme}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-2 py-1.5 text-[10px] font-semibold bg-ed-accent text-ed-text-inverse rounded hover:bg-ed-accent-hover disabled:opacity-50"
              >
                {aiLoading ? '...' : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0.5 p-0.5 bg-ed-bg-secondary rounded-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowSearch(false); }}
              className={`flex items-center gap-1 flex-1 justify-center py-1.5 px-1 rounded text-[10px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-ed-bg text-ed-text shadow-sm'
                  : 'text-ed-text-tertiary hover:text-ed-text-secondary'
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span className="hidden xl:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {showSearch ? (
          <ThemeTokenSearch theme={theme} onUpdate={onUpdateTheme} />
        ) : (
          <>
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <ThemePresetSelector
                  onSelectPreset={(preset) => onApplyGlobalTheme(preset.theme)}
                />
                {/* Global theme selector */}
                {globalThemes.length > 0 && (
                  <div className="p-2.5 bg-ed-bg-secondary border border-ed-border rounded-md">
                    <h4 className="text-[11px] font-semibold text-ed-text-secondary mb-1.5">Custom Themes</h4>
                    <select
                      value={selectedGlobalThemeId}
                      onChange={(e) => setSelectedGlobalThemeId(e.target.value)}
                      className="w-full mb-1.5 p-1.5 border border-ed-border rounded text-[11px] bg-ed-bg text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent"
                    >
                      <option value="">Select a theme...</option>
                      {globalThemes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.type})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleApplyTheme}
                      disabled={!selectedGlobalThemeId}
                      className="w-full bg-ed-accent text-ed-text-inverse text-[11px] font-semibold py-1.5 rounded hover:bg-ed-accent-hover disabled:opacity-50"
                    >
                      Apply Theme
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'colors' && (
              <ThemeSectionColors theme={theme} onUpdate={onUpdateTheme} />
            )}

            {activeTab === 'typography' && (
              <ThemeSectionTypography theme={theme} onUpdate={onUpdateTheme} />
            )}

            {activeTab === 'effects' && (
              <ThemeSectionEffects theme={theme} onUpdate={onUpdateTheme} />
            )}

            {activeTab === 'spacing' && (
              <div className="space-y-4">
                <ThemeSectionSpacing theme={theme} onUpdate={onUpdateTheme} />
                <ThemeSectionBorders theme={theme} onUpdate={onUpdateTheme} />
              </div>
            )}

            {/* Live preview always visible at bottom */}
            <div className="mt-4 pt-3 border-t border-ed-border">
              <ThemeLivePreview theme={theme} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
