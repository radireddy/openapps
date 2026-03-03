import React from 'react';
import { Theme } from '@/types';

interface ThemeSectionSpacingProps {
  theme: Theme;
  onUpdate: (category: keyof Theme, prop: string, value: string) => void;
}

const TokenInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  preview?: React.ReactNode;
}> = ({ label, value, onChange, preview }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-[10px] text-ed-text-tertiary w-10 text-right font-mono">{label}</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 bg-ed-bg-secondary border border-ed-border rounded px-1.5 py-0.5 text-[10px] text-ed-text font-mono focus:outline-none focus:ring-1 focus:ring-ed-accent"
    />
    {preview}
  </div>
);

export const ThemeSectionSpacing: React.FC<ThemeSectionSpacingProps> = ({ theme, onUpdate }) => {
  return (
    <div className="space-y-4">
      {/* Spacing */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Spacing Scale</h4>
        <div className="p-2 bg-ed-bg-secondary rounded border border-ed-border">
          {(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl'] as const).map((key) => (
            <TokenInput
              key={key}
              label={key}
              value={theme.spacing[key]}
              onChange={(v) => onUpdate('spacing', key, v)}
              preview={
                <div
                  className="h-3 bg-ed-accent/30 rounded-sm border border-ed-accent/50"
                  style={{ width: theme.spacing[key] }}
                />
              }
            />
          ))}
        </div>
      </div>

      {/* Radius */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Border Radius</h4>
        <div className="p-2 bg-ed-bg-secondary rounded border border-ed-border">
          {(['none', 'sm', 'default', 'md', 'lg', 'xl', 'full'] as const).map((key) => (
            <TokenInput
              key={key}
              label={key === 'default' ? 'def' : key}
              value={theme.radius[key]}
              onChange={(v) => onUpdate('radius', key, v)}
              preview={
                <div
                  className="w-8 h-8 border-2 border-ed-accent/50 bg-ed-accent/10"
                  style={{ borderRadius: theme.radius[key] }}
                />
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
