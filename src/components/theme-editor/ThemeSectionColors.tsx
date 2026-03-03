import React, { useState } from 'react';
import { Theme, ThemeColors } from '@/types';
import { ColorPickerEnhanced } from './ColorPickerEnhanced';
import { ContrastChecker } from './ContrastChecker';

interface ThemeSectionColorsProps {
  theme: Theme;
  onUpdate: (category: keyof Theme, prop: string, value: string) => void;
}

type ColorGroup = {
  title: string;
  pairs: Array<{
    key: keyof ThemeColors;
    label: string;
    contrastWith?: keyof ThemeColors;
  }>;
};

const colorGroups: ColorGroup[] = [
  {
    title: 'Brand Colors',
    pairs: [
      { key: 'primary', label: 'Primary', contrastWith: 'onPrimary' },
      { key: 'onPrimary', label: 'On Primary' },
      { key: 'primaryLight', label: 'Primary Light' },
      { key: 'primaryDark', label: 'Primary Dark' },
      { key: 'secondary', label: 'Secondary', contrastWith: 'onSecondary' },
      { key: 'onSecondary', label: 'On Secondary' },
      { key: 'secondaryLight', label: 'Secondary Light' },
      { key: 'secondaryDark', label: 'Secondary Dark' },
    ],
  },
  {
    title: 'Status Colors',
    pairs: [
      { key: 'error', label: 'Error', contrastWith: 'onError' },
      { key: 'onError', label: 'On Error' },
      { key: 'warning', label: 'Warning', contrastWith: 'onWarning' },
      { key: 'onWarning', label: 'On Warning' },
      { key: 'success', label: 'Success', contrastWith: 'onSuccess' },
      { key: 'onSuccess', label: 'On Success' },
      { key: 'info', label: 'Info', contrastWith: 'onInfo' },
      { key: 'onInfo', label: 'On Info' },
    ],
  },
  {
    title: 'Surface & Background',
    pairs: [
      { key: 'background', label: 'Background', contrastWith: 'text' },
      { key: 'onBackground', label: 'On Background' },
      { key: 'surface', label: 'Surface', contrastWith: 'onSurface' },
      { key: 'onSurface', label: 'On Surface' },
      { key: 'surfaceVariant', label: 'Surface Variant' },
      { key: 'text', label: 'Text' },
      { key: 'border', label: 'Border' },
    ],
  },
  {
    title: 'Interaction States',
    pairs: [
      { key: 'hover', label: 'Hover' },
      { key: 'focus', label: 'Focus' },
      { key: 'disabled', label: 'Disabled', contrastWith: 'onDisabled' },
      { key: 'onDisabled', label: 'On Disabled' },
    ],
  },
  {
    title: 'Utility',
    pairs: [
      { key: 'outline', label: 'Outline' },
      { key: 'shadow', label: 'Shadow' },
      { key: 'overlay', label: 'Overlay' },
      { key: 'link', label: 'Link' },
    ],
  },
];

export const ThemeSectionColors: React.FC<ThemeSectionColorsProps> = ({ theme, onUpdate }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Brand Colors']));

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {colorGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.title);
        return (
          <div key={group.title}>
            <button
              onClick={() => toggleGroup(group.title)}
              className="flex items-center gap-1.5 w-full py-1.5 text-xs font-semibold text-ed-text-secondary hover:text-ed-text"
            >
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {group.title}
            </button>
            {isExpanded && (
              <div className="pl-2 pb-2">
                {group.pairs.map(({ key, label, contrastWith }) => (
                  <div key={key} className="flex items-start gap-1">
                    <div className="flex-1">
                      <ColorPickerEnhanced
                        label={label}
                        value={theme.colors[key]}
                        onChange={(v) => onUpdate('colors', key, v)}
                      />
                    </div>
                    {contrastWith && (
                      <div className="pt-5">
                        <ContrastChecker
                          foreground={theme.colors[contrastWith]}
                          background={theme.colors[key]}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
