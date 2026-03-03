import React from 'react';
import { getContrastRatio, meetsContrastAA } from '@/utils/color-utils';

interface ContrastCheckerProps {
  foreground: string;
  background: string;
  compact?: boolean;
}

export const ContrastChecker: React.FC<ContrastCheckerProps> = ({ foreground, background, compact = true }) => {
  // Only evaluate hex colors (skip expression strings)
  const isColor = (v: string) => /^#[0-9a-fA-F]{3,8}$/.test(v);
  if (!isColor(foreground) || !isColor(background)) {
    return null;
  }

  const ratio = getContrastRatio(foreground, background);
  const passesAA = meetsContrastAA(foreground, background);
  const passesAALarge = meetsContrastAA(foreground, background, true);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
          passesAA
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : passesAALarge
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
        title={`Contrast ratio: ${ratio.toFixed(1)}:1 — ${passesAA ? 'AA pass' : passesAALarge ? 'AA large text only' : 'Fail'}`}
      >
        {ratio.toFixed(1)}:1 {passesAA ? 'AA' : passesAALarge ? 'Lg' : ''}
        {passesAA ? ' \u2713' : passesAALarge ? ' \u2713' : ' \u2717'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className="w-6 h-6 rounded border border-ed-border flex items-center justify-center text-[10px] font-bold"
        style={{ backgroundColor: background, color: foreground }}
      >
        Aa
      </div>
      <span className="text-ed-text-secondary">{ratio.toFixed(1)}:1</span>
      <span className={passesAA ? 'text-green-600' : passesAALarge ? 'text-yellow-600' : 'text-red-600'}>
        {passesAA ? 'AA \u2713' : passesAALarge ? 'AA Large \u2713' : 'Fail \u2717'}
      </span>
    </div>
  );
};
