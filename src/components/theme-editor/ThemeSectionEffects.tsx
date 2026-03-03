import React from 'react';
import { Theme } from '@/types';

interface ThemeSectionEffectsProps {
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

export const ThemeSectionEffects: React.FC<ThemeSectionEffectsProps> = ({ theme, onUpdate }) => {
  return (
    <div className="space-y-4">
      {/* Shadows */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Shadows</h4>
        {(['none', 'sm', 'md', 'lg', 'xl', 'inner'] as const).map((key) => (
          <div key={key} className="mb-3">
            <TokenInput
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={theme.shadow[key]}
              onChange={(v) => onUpdate('shadow', key, v)}
            />
            <div className="flex justify-center px-2">
              <div
                className="w-20 h-10 rounded bg-ed-bg border border-ed-border"
                style={{ boxShadow: theme.shadow[key] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Transitions */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Transitions</h4>
        <TokenInput label="Duration Fast" value={theme.transition.durationFast} onChange={(v) => onUpdate('transition', 'durationFast', v)} />
        <TokenInput label="Duration Normal" value={theme.transition.durationNormal} onChange={(v) => onUpdate('transition', 'durationNormal', v)} />
        <TokenInput label="Duration Slow" value={theme.transition.durationSlow} onChange={(v) => onUpdate('transition', 'durationSlow', v)} />
        <TokenInput label="Easing" value={theme.transition.easing} onChange={(v) => onUpdate('transition', 'easing', v)} />
      </div>
    </div>
  );
};
