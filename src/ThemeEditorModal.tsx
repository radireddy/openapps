import React, { useState, useEffect } from 'react';
import { GlobalTheme, Theme } from './types';
import { defaultLightTheme, defaultDarkTheme } from '@/theme-presets';


export const ThemeEditorModal: React.FC<{
  theme: GlobalTheme | null;
  onClose: () => void;
  onSave: (theme: GlobalTheme) => void;
}> = ({ theme, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'light' | 'dark'>('light');
  const [themeData, setThemeData] = useState<Theme>(defaultLightTheme);

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
      alert("Theme name cannot be empty.");
      return;
    }
    const newGlobalTheme: GlobalTheme = {
      id: theme?.id || `theme_${Date.now()}`,
      name: name.trim(),
      type: type,
      theme: themeData,
    };
    onSave(newGlobalTheme);
  };
  
  const handleThemeChange = (category: keyof Theme, prop: string, value: string) => {
    setThemeData(prev => {
        const newTheme = { ...prev };
        (newTheme[category] as any)[prop] = value;
        return newTheme;
    });
  };

  const handleTypeChange = (newType: 'light' | 'dark') => {
      setType(newType);
      // Pre-fill with defaults when type is changed
      if (!theme) { // Only on creation
          setThemeData(newType === 'dark' ? defaultDarkTheme : defaultLightTheme);
      }
  }
  
  const ColorInput: React.FC<{label: string, value: string, prop: keyof Theme['colors']}> = ({label, value, prop}) => (
      <div className="mb-3">
        <label className="block text-xs font-medium text-ed-text-secondary mb-1">{label}</label>
        <div className="flex items-center">
          <input type="color" value={value} onChange={e => handleThemeChange('colors', prop, e.target.value)} className="p-1 h-8 w-8 block bg-ed-bg border border-r-0 border-ed-border cursor-pointer rounded-l-md" />
          <input type="text" value={value} onChange={e => handleThemeChange('colors', prop, e.target.value)} className="w-full bg-ed-bg-secondary border-t border-b border-r border-ed-border rounded-r-md p-2 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent" />
        </div>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-3xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-ed-border">
          <h2 className="text-lg font-semibold text-ed-text">{theme ? 'Edit Theme' : 'Create New Theme'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-ed-text-tertiary hover:bg-ed-bg-surface" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mb-4">
            <div>
                <label className="block text-sm font-medium text-ed-text-secondary mb-1">Theme Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text" placeholder="e.g., Brand Default" />
            </div>
            <div>
                <label className="block text-sm font-medium text-ed-text-secondary mb-1">Theme Type</label>
                 <select value={type} onChange={e => handleTypeChange(e.target.value as 'light' | 'dark')} className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg-secondary">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <div>
              <h3 className="font-semibold text-ed-text-secondary mb-2">Colors</h3>
              <ColorInput label="Primary" value={themeData.colors.primary} prop="primary" />
              <ColorInput label="On Primary" value={themeData.colors.onPrimary} prop="onPrimary" />
              <ColorInput label="Secondary" value={themeData.colors.secondary} prop="secondary" />
              <ColorInput label="On Secondary" value={themeData.colors.onSecondary} prop="onSecondary" />
              <ColorInput label="Background" value={themeData.colors.background} prop="background" />
              <ColorInput label="Surface" value={themeData.colors.surface} prop="surface" />
              <ColorInput label="Text" value={themeData.colors.text} prop="text" />
              <ColorInput label="Border" value={themeData.colors.border} prop="border" />
            </div>
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-ed-text-secondary mb-2">Fonts</h3>
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-ed-text-secondary mb-1">Family</label>
                        <input type="text" value={themeData.font.family} onChange={e => handleThemeChange('font', 'family', e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text" placeholder="e.g., Inter, sans-serif" />
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold text-ed-text-secondary mb-2">Borders</h3>
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-ed-text-secondary mb-1">Width</label>
                        <input type="text" value={themeData.border.width} onChange={e => handleThemeChange('border', 'width', e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text" placeholder="e.g., 1px" />
                    </div>
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-ed-text-secondary mb-1">Style</label>
                        <select value={themeData.border.style} onChange={e => handleThemeChange('border', 'style', e.target.value)} className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg-secondary">
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                 <div>
                    <h3 className="font-semibold text-ed-text-secondary mb-2">Radius</h3>
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-ed-text-secondary mb-1">Default</label>
                        <input type="text" value={themeData.radius.default} onChange={e => handleThemeChange('radius', 'default', e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text" placeholder="e.g., 4px" />
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold text-ed-text-secondary mb-2">Spacing</h3>
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-ed-text-secondary mb-1">Small (sm)</label>
                        <input type="text" value={themeData.spacing.sm} onChange={e => handleThemeChange('spacing', 'sm', e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text" placeholder="e.g., 4px" />
                    </div>
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-ed-text-secondary mb-1">Medium (md)</label>
                        <input type="text" value={themeData.spacing.md} onChange={e => handleThemeChange('spacing', 'md', e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text" placeholder="e.g., 8px" />
                    </div>
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-ed-text-secondary mb-1">Large (lg)</label>
                        <input type="text" value={themeData.spacing.lg} onChange={e => handleThemeChange('spacing', 'lg', e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text" placeholder="e.g., 16px" />
                    </div>
                </div>
            </div>
          </div>
        </main>
        <footer className="flex justify-end gap-3 p-4 bg-ed-bg-secondary border-t border-ed-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-tertiary">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover">Save Theme</button>
        </footer>
      </div>
    </div>
  );
};