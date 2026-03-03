import React from 'react';
import { Theme } from '@/types';

interface ThemeSectionTypographyProps {
  theme: Theme;
  onUpdate: (category: keyof Theme, prop: string, value: string) => void;
}

const fontSizeTokens = [
  { key: 'fontSizeXxxl', label: '3xl' },
  { key: 'fontSizeXxl', label: '2xl' },
  { key: 'fontSizeXl', label: 'xl' },
  { key: 'fontSizeLg', label: 'lg' },
  { key: 'fontSizeMd', label: 'md' },
  { key: 'fontSizeSm', label: 'sm' },
  { key: 'fontSizeXs', label: 'xs' },
] as const;

const TextInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div className="mb-2.5">
    <label className="block text-[11px] font-medium text-ed-text-secondary mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-ed-bg-secondary border border-ed-border rounded p-1.5 text-[11px] text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent"
      placeholder={placeholder}
    />
  </div>
);

export const ThemeSectionTypography: React.FC<ThemeSectionTypographyProps> = ({ theme, onUpdate }) => {
  const t = theme.typography;
  const update = (prop: string, value: string) => onUpdate('typography', prop, value);

  return (
    <div className="space-y-4">
      {/* Font Families */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Font Families</h4>
        <TextInput label="Body" value={t.fontFamily} onChange={(v) => update('fontFamily', v)} placeholder="Inter, system-ui, sans-serif" />
        <TextInput label="Heading" value={t.fontFamilyHeading} onChange={(v) => update('fontFamilyHeading', v)} placeholder="Inter, system-ui, sans-serif" />
        <TextInput label="Monospace" value={t.fontFamilyMono} onChange={(v) => update('fontFamilyMono', v)} placeholder="JetBrains Mono, monospace" />
      </div>

      {/* Font Size Scale Preview */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Size Scale</h4>
        <div className="space-y-1.5 p-2 bg-ed-bg-secondary rounded border border-ed-border">
          {fontSizeTokens.map(({ key, label }) => {
            const size = (t as any)[key] as string;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-ed-text-tertiary w-6 text-right font-mono">{label}</span>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => update(key, e.target.value)}
                  className="w-14 bg-ed-bg border border-ed-border rounded px-1.5 py-0.5 text-[10px] text-ed-text font-mono focus:outline-none focus:ring-1 focus:ring-ed-accent"
                />
                <span
                  className="text-ed-text truncate flex-1"
                  style={{ fontSize: size, fontFamily: t.fontFamily, lineHeight: 1.3 }}
                >
                  The quick brown fox
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Font Weights */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Font Weights</h4>
        <div className="grid grid-cols-2 gap-x-2">
          <TextInput label="Light" value={t.fontWeightLight} onChange={(v) => update('fontWeightLight', v)} />
          <TextInput label="Normal" value={t.fontWeightNormal} onChange={(v) => update('fontWeightNormal', v)} />
          <TextInput label="Medium" value={t.fontWeightMedium} onChange={(v) => update('fontWeightMedium', v)} />
          <TextInput label="Semibold" value={t.fontWeightSemibold} onChange={(v) => update('fontWeightSemibold', v)} />
          <TextInput label="Bold" value={t.fontWeightBold} onChange={(v) => update('fontWeightBold', v)} />
        </div>
      </div>

      {/* Line Heights & Letter Spacing */}
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2">Line Height & Spacing</h4>
        <div className="grid grid-cols-2 gap-x-2">
          <TextInput label="Line Height Tight" value={t.lineHeightTight} onChange={(v) => update('lineHeightTight', v)} />
          <TextInput label="Line Height Normal" value={t.lineHeightNormal} onChange={(v) => update('lineHeightNormal', v)} />
          <TextInput label="Line Height Relaxed" value={t.lineHeightRelaxed} onChange={(v) => update('lineHeightRelaxed', v)} />
          <TextInput label="Letter Sp. Tight" value={t.letterSpacingTight} onChange={(v) => update('letterSpacingTight', v)} />
          <TextInput label="Letter Sp. Normal" value={t.letterSpacingNormal} onChange={(v) => update('letterSpacingNormal', v)} />
          <TextInput label="Letter Sp. Wide" value={t.letterSpacingWide} onChange={(v) => update('letterSpacingWide', v)} />
        </div>
      </div>
    </div>
  );
};
