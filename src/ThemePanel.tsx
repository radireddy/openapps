import React, { useState } from 'react';
import { Theme, GlobalTheme } from './types';

interface ThemePanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: Theme;
  onUpdateTheme: (category: keyof Theme, prop: string, value: string) => void;
  globalThemes: GlobalTheme[];
  onApplyGlobalTheme: (theme: Theme) => void;
}

const ThemePropInput: React.FC<{ 
  label: string; 
  value: string; 
  type?: 'text' | 'color';
  category: keyof Theme;
  prop: string;
  onUpdate: ThemePanelProps['onUpdateTheme'];
}> = ({ label, value, type = 'text', category, prop, onUpdate }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium text-ed-text-secondary mb-1">{label}</label>
    <div className="flex items-center">
      {type === 'color' && <input type="color" value={value} onChange={e => onUpdate(category, prop, e.target.value)} className="p-1 h-8 w-8 block bg-ed-bg border border-r-0 border-ed-border cursor-pointer rounded-l-md" title={`Select ${label} color`} />}
      <input
        type="text"
        value={value}
        onChange={e => onUpdate(category, prop, e.target.value)}
        className={`w-full bg-ed-bg-secondary border border-ed-border p-2 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-border-focus ${type === 'color' ? 'rounded-r-md' : 'rounded-md'}`}
      />
    </div>
  </div>
);


export const ThemePanel: React.FC<ThemePanelProps> = ({ isCollapsed, onToggleCollapse, theme, onUpdateTheme, globalThemes, onApplyGlobalTheme }) => {
  const [selectedGlobalThemeId, setSelectedGlobalThemeId] = useState<string>('');
  
  const handleApplyTheme = () => {
    const globalThemeToApply = globalThemes.find(t => t.id === selectedGlobalThemeId);
    if(globalThemeToApply) {
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
        <div className="p-3 overflow-y-auto">
            <h3 className="text-sm font-bold text-ed-text-secondary uppercase tracking-wider mb-4">App Theme</h3>

            <div className="p-3 mb-4 bg-ed-bg-secondary border border-ed-border rounded-md">
                <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Apply Global Theme</h4>
                <select
                    value={selectedGlobalThemeId}
                    onChange={e => setSelectedGlobalThemeId(e.target.value)}
                    className="w-full mb-2 p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                >
                    <option value="">Select a global theme...</option>
                    {globalThemes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                </select>
                <button
                    onClick={handleApplyTheme}
                    disabled={!selectedGlobalThemeId}
                    className="w-full bg-ed-accent text-ed-text-inverse text-sm font-semibold py-2 rounded-md hover:bg-ed-accent-hover disabled:opacity-50"
                >
                    Apply Theme
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Colors (App Specific)</h4>
                    <ThemePropInput label="Primary" type="color" value={theme.colors.primary} category="colors" prop="primary" onUpdate={onUpdateTheme} />
                    <ThemePropInput label="On Primary" type="color" value={theme.colors.onPrimary} category="colors" prop="onPrimary" onUpdate={onUpdateTheme} />
                    <ThemePropInput label="Secondary" type="color" value={theme.colors.secondary} category="colors" prop="secondary" onUpdate={onUpdateTheme} />
                    <ThemePropInput label="On Secondary" type="color" value={theme.colors.onSecondary} category="colors" prop="onSecondary" onUpdate={onUpdateTheme} />
                    <ThemePropInput label="Background" type="color" value={theme.colors.background} category="colors" prop="background" onUpdate={onUpdateTheme} />
                    <ThemePropInput label="Surface" type="color" value={theme.colors.surface} category="colors" prop="surface" onUpdate={onUpdateTheme} />
                    <ThemePropInput label="Text" type="color" value={theme.colors.text} category="colors" prop="text" onUpdate={onUpdateTheme} />
                    <ThemePropInput label="Border" type="color" value={theme.colors.border} category="colors" prop="border" onUpdate={onUpdateTheme} />
                </div>
                 <div>
                    <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Fonts</h4>
                    <ThemePropInput label="Family" value={theme.font.family} category="font" prop="family" onUpdate={onUpdateTheme} />
                </div>
                <div>
                    <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Borders</h4>
                    <ThemePropInput label="Width" value={theme.border.width} category="border" prop="width" onUpdate={onUpdateTheme} />
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-ed-text-secondary mb-1">Style</label>
                        <select value={theme.border.style} onChange={e => onUpdateTheme('border', 'style', e.target.value)} className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus">
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Radius</h4>
                    <ThemePropInput label="Default" value={theme.radius.default} category="radius" prop="default" onUpdate={onUpdateTheme} />
                </div>
            </div>
        </div>
    </div>
  );
};