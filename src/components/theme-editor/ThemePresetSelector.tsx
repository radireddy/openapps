import React from 'react';
import { GlobalTheme } from '@/types';
import { presetThemes } from '@/theme-presets';

interface ThemePresetSelectorProps {
  onSelectPreset: (preset: GlobalTheme) => void;
  currentType?: 'light' | 'dark';
}

export const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({ onSelectPreset, currentType }) => {
  const filteredPresets = currentType
    ? presetThemes.filter(p => p.type === currentType)
    : presetThemes;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-xs font-semibold text-ed-text-secondary uppercase tracking-wider">Presets</h4>
        {currentType && (
          <span className="text-[10px] text-ed-text-tertiary px-1.5 py-0.5 bg-ed-bg-secondary rounded">
            {currentType}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className="group relative flex flex-col items-start p-2.5 rounded-lg border border-ed-border bg-ed-bg hover:border-ed-accent hover:shadow-sm transition-all text-left"
            title={preset.description}
          >
            <div className="flex gap-1 mb-1.5 w-full">
              {[
                preset.theme.colors.primary,
                preset.theme.colors.secondary,
                preset.theme.colors.background,
                preset.theme.colors.surface,
              ].map((color, i) => (
                <div
                  key={i}
                  className="h-4 flex-1 rounded-sm border border-black/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-ed-text truncate w-full">{preset.name}</span>
            <span className="text-[9px] text-ed-text-tertiary truncate w-full">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
