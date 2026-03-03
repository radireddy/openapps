import React from 'react';
import { Theme } from '@/types';

interface ThemeSectionBordersProps {
  theme: Theme;
  onUpdate: (category: keyof Theme, prop: string, value: string) => void;
}

const TokenInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="mb-2.5">
    <label className="block text-[11px] font-medium text-ed-text-secondary mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-ed-bg-secondary border border-ed-border rounded p-1.5 text-[11px] text-ed-text font-mono focus:outline-none focus:ring-1 focus:ring-ed-accent"
    />
  </div>
);

export const ThemeSectionBorders: React.FC<ThemeSectionBordersProps> = ({ theme, onUpdate }) => {
  return (
    <div className="space-y-4">
      {/* Border Widths */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Border Widths</h4>
        <TokenInput label="Default" value={theme.border.width} onChange={(v) => onUpdate('border', 'width', v)} />
        <TokenInput label="Thin" value={theme.border.widthThin} onChange={(v) => onUpdate('border', 'widthThin', v)} />
        <TokenInput label="Medium" value={theme.border.widthMedium} onChange={(v) => onUpdate('border', 'widthMedium', v)} />
        <TokenInput label="Thick" value={theme.border.widthThick} onChange={(v) => onUpdate('border', 'widthThick', v)} />
      </div>

      {/* Border Style */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Border Style</h4>
        <div className="mb-2.5">
          <label className="block text-[11px] font-medium text-ed-text-secondary mb-1">Style</label>
          <select
            value={theme.border.style}
            onChange={(e) => onUpdate('border', 'style', e.target.value)}
            className="w-full p-1.5 border border-ed-border rounded text-[11px] bg-ed-bg-secondary text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Preview</h4>
        <div className="space-y-2 p-2 bg-ed-bg-secondary rounded">
          {(['widthThin', 'width', 'widthMedium', 'widthThick'] as const).map((key) => {
            const label = key === 'width' ? 'Default' : key.replace('width', '');
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-ed-text-tertiary w-14 text-right">{label}</span>
                <div
                  className="flex-1 h-0"
                  style={{
                    borderTopWidth: theme.border[key],
                    borderTopStyle: theme.border.style as any,
                    borderTopColor: theme.colors.border,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
