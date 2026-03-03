import React, { useState, useEffect } from 'react';
import { GlobalTheme, Theme } from '@/types';
import { defaultLightTheme, defaultDarkTheme } from '@/theme-presets';
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

type SidebarSection = 'ai' | 'presets' | 'colors' | 'typography' | 'spacing' | 'effects' | 'borders' | 'search';

const sidebarItems: Array<{ id: SidebarSection; label: string; icon?: string }> = [
  { id: 'ai', label: 'AI Generate', icon: 'sparkle' },
  { id: 'presets', label: 'Presets' },
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing & Radius' },
  { id: 'effects', label: 'Shadows & Transitions' },
  { id: 'borders', label: 'Borders' },
  { id: 'search', label: 'Search Tokens' },
];

export const ThemeEditorModalNew: React.FC<{
  theme: GlobalTheme | null;
  onClose: () => void;
  onSave: (theme: GlobalTheme) => void;
}> = ({ theme, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'light' | 'dark'>('light');
  const [themeData, setThemeData] = useState<Theme>(defaultLightTheme);
  const [activeSection, setActiveSection] = useState<SidebarSection>('presets');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const result = await generateTheme(aiPrompt.trim());
      setThemeData(result.theme);
      setType(result.type);
      if (!name.trim()) setName(result.name);
      setAiPrompt('');
    } catch (err) {
      console.error('AI theme generation failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (theme) {
      setName(theme.name);
      setType(theme.type);
      setThemeData(theme.theme);
    } else {
      setName('');
      setType('light');
      setThemeData(defaultLightTheme);
    }
  }, [theme]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Theme name cannot be empty.');
      return;
    }
    const newGlobalTheme: GlobalTheme = {
      id: theme?.id || `theme_${Date.now()}`,
      name: name.trim(),
      type,
      theme: themeData,
      createdAt: theme?.createdAt || new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    onSave(newGlobalTheme);
  };

  const handleThemeChange = (category: keyof Theme, prop: string, value: string) => {
    setThemeData((prev) => {
      const newTheme = JSON.parse(JSON.stringify(prev));
      (newTheme[category] as any)[prop] = value;
      return newTheme;
    });
  };

  const handleTypeChange = (newType: 'light' | 'dark') => {
    setType(newType);
    if (!theme) {
      setThemeData(newType === 'dark' ? defaultDarkTheme : defaultLightTheme);
    }
  };

  const handlePresetSelect = (preset: GlobalTheme) => {
    setThemeData(preset.theme);
    setType(preset.type);
    if (!name.trim()) setName(preset.name);
  };

  return (
    <div className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-[900px] h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-ed-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-ed-text">
              {theme ? 'Edit Theme' : 'Create New Theme'}
            </h2>
            <ThemeImportExport theme={themeData} onImport={(t) => setThemeData(t)} />
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-ed-text-tertiary hover:bg-ed-bg-surface" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Body: 3-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar — navigation */}
          <div className="w-48 border-r border-ed-border bg-ed-bg-secondary p-3 overflow-y-auto">
            {/* Name & Type */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-ed-text-secondary mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-ed-bg border border-ed-border rounded p-1.5 text-[11px] text-ed-text mb-2"
                placeholder="e.g., Brand Default"
              />
              <label className="block text-[11px] font-medium text-ed-text-secondary mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as 'light' | 'dark')}
                className="w-full p-1.5 border border-ed-border rounded text-[11px] bg-ed-bg text-ed-text"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Nav items */}
            <nav className="space-y-0.5">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                    activeSection === item.id
                      ? 'bg-ed-accent/10 text-ed-accent'
                      : 'text-ed-text-secondary hover:bg-ed-bg-hover hover:text-ed-text'
                  }`}
                >
                  {item.icon === 'sparkle' && (
                    <svg className="w-3.5 h-3.5 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  )}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Center — editing controls */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeSection === 'ai' && (
              <div className="max-w-lg mx-auto py-4">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#a855f7]/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-ed-text mb-1">Generate Theme with AI</h3>
                  <p className="text-[11px] text-ed-text-secondary">Describe the look and feel you want. AI will generate a complete set of theme tokens.</p>
                </div>

                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAIGenerate(); } }}
                  placeholder="e.g., A modern dark theme with deep navy background, electric blue accents, subtle shadows, and rounded corners..."
                  disabled={aiLoading}
                  rows={5}
                  className="w-full px-3.5 py-3 text-sm bg-ed-bg-secondary border border-ed-border rounded-lg text-ed-text placeholder-ed-text-tertiary focus:outline-none focus:ring-2 focus:ring-[#a855f7]/30 focus:border-[#a855f7]/50 resize-none disabled:opacity-50"
                />

                <div className="flex flex-wrap gap-1.5 mt-3 mb-5">
                  <span className="text-[10px] text-ed-text-tertiary self-center mr-1">Try:</span>
                  {['Dark cyberpunk with neon accents', 'Warm sunset tones', 'Clean minimalist monochrome', 'Ocean blues with soft gradients'].map(example => (
                    <button
                      key={example}
                      onClick={() => setAiPrompt(example)}
                      className="px-2.5 py-1 text-[10px] bg-ed-bg-tertiary text-ed-text-secondary rounded-full hover:bg-ed-bg-hover hover:text-ed-text transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full py-2.5 text-xs font-semibold bg-ed-accent text-ed-text-inverse rounded-lg hover:bg-ed-accent-hover disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {aiLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  )}
                  {aiLoading ? 'Generating Theme...' : 'Generate Theme'}
                </button>

                <p className="text-[10px] text-ed-text-tertiary text-center mt-3">
                  Press Enter to generate &middot; Shift+Enter for new line &middot; Generated tokens will populate all sections
                </p>
              </div>
            )}
            {activeSection === 'presets' && (
              <ThemePresetSelector onSelectPreset={handlePresetSelect} currentType={type} />
            )}
            {activeSection === 'colors' && (
              <ThemeSectionColors theme={themeData} onUpdate={handleThemeChange} />
            )}
            {activeSection === 'typography' && (
              <ThemeSectionTypography theme={themeData} onUpdate={handleThemeChange} />
            )}
            {activeSection === 'spacing' && (
              <ThemeSectionSpacing theme={themeData} onUpdate={handleThemeChange} />
            )}
            {activeSection === 'effects' && (
              <ThemeSectionEffects theme={themeData} onUpdate={handleThemeChange} />
            )}
            {activeSection === 'borders' && (
              <ThemeSectionBorders theme={themeData} onUpdate={handleThemeChange} />
            )}
            {activeSection === 'search' && (
              <ThemeTokenSearch theme={themeData} onUpdate={handleThemeChange} />
            )}
          </div>

          {/* Right — live preview */}
          <div className="w-72 border-l border-ed-border bg-ed-bg-secondary p-3 overflow-y-auto">
            <ThemeLivePreview theme={themeData} />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-end gap-3 px-5 py-3 bg-ed-bg-secondary border-t border-ed-border">
          <button onClick={onClose} className="px-4 py-1.5 text-[11px] font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded hover:bg-ed-bg-tertiary">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-1.5 text-[11px] font-semibold text-ed-text-inverse bg-ed-accent rounded hover:bg-ed-accent-hover">
            Save Theme
          </button>
        </footer>
      </div>
    </div>
  );
};
