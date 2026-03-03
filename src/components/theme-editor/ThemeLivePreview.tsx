import React from 'react';
import { Theme } from '@/types';

interface ThemeLivePreviewProps {
  theme: Theme;
}

export const ThemeLivePreview: React.FC<ThemeLivePreviewProps> = ({ theme }) => {
  if (!theme?.colors || !theme?.typography) {
    return (
      <div>
        <h4 className="text-xs font-semibold text-ed-text-secondary mb-2 uppercase tracking-wider">Live Preview</h4>
        <div className="rounded-lg border border-ed-border p-6 text-center text-ed-text-tertiary text-xs">
          Theme data loading...
        </div>
      </div>
    );
  }

  const c = theme.colors;
  const t = theme.typography;

  return (
    <div>
      <h4 className="text-xs font-semibold text-ed-text-secondary mb-2 uppercase tracking-wider">Live Preview</h4>
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: c.background,
          borderColor: c.border,
          fontFamily: t.fontFamily,
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ backgroundColor: c.primary }}
        >
          <span style={{ color: c.onPrimary, fontSize: t.fontSizeSm, fontWeight: t.fontWeightSemibold }}>
            App Header
          </span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.onPrimary, opacity: 0.5 }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.onPrimary, opacity: 0.5 }} />
          </div>
        </div>

        {/* Content area */}
        <div className="p-3 space-y-2.5" style={{ color: c.text }}>
          {/* Card */}
          <div
            className="rounded p-2.5"
            style={{
              backgroundColor: c.surface,
              borderRadius: theme.radius.md,
              boxShadow: theme.shadow.sm,
            }}
          >
            <div style={{ fontSize: t.fontSizeMd, fontWeight: t.fontWeightSemibold, marginBottom: '4px' }}>
              Card Title
            </div>
            <div style={{ fontSize: t.fontSizeXs, color: c.onSurface, opacity: 0.7 }}>
              Surface content with text
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              className="px-2.5 py-1 text-[10px] font-medium"
              style={{
                backgroundColor: c.primary,
                color: c.onPrimary,
                borderRadius: theme.radius.sm,
              }}
            >
              Primary
            </button>
            <button
              className="px-2.5 py-1 text-[10px] font-medium"
              style={{
                backgroundColor: c.secondary,
                color: c.onSecondary,
                borderRadius: theme.radius.sm,
              }}
            >
              Secondary
            </button>
            <button
              className="px-2.5 py-1 text-[10px] font-medium border"
              style={{
                backgroundColor: 'transparent',
                color: c.text,
                borderColor: c.border,
                borderRadius: theme.radius.sm,
              }}
            >
              Outline
            </button>
          </div>

          {/* Input */}
          <div
            className="px-2 py-1.5 text-[10px]"
            style={{
              backgroundColor: c.surface,
              color: c.onSurface,
              border: `${theme.border.width} ${theme.border.style} ${c.border}`,
              borderRadius: theme.radius.default,
              opacity: 0.8,
            }}
          >
            Input field placeholder...
          </div>

          {/* Status badges */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { bg: c.error, fg: c.onError, label: 'Error' },
              { bg: c.warning, fg: c.onWarning, label: 'Warning' },
              { bg: c.success, fg: c.onSuccess, label: 'Success' },
              { bg: c.info, fg: c.onInfo, label: 'Info' },
            ].map(({ bg, fg, label }) => (
              <span
                key={label}
                className="px-1.5 py-0.5 text-[9px] font-medium"
                style={{
                  backgroundColor: bg,
                  color: fg,
                  borderRadius: theme.radius.full,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${c.border}` }} />

          {/* Toggle and disabled */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-4 rounded-full relative"
              style={{ backgroundColor: c.primary }}
            >
              <div
                className="w-3 h-3 rounded-full absolute top-0.5"
                style={{ backgroundColor: c.onPrimary, right: '2px' }}
              />
            </div>
            <span style={{ fontSize: t.fontSizeXs }}>Active</span>
            <div
              className="w-8 h-4 rounded-full relative ml-2"
              style={{ backgroundColor: c.disabled }}
            >
              <div
                className="w-3 h-3 rounded-full absolute top-0.5"
                style={{ backgroundColor: c.onDisabled, left: '2px' }}
              />
            </div>
            <span style={{ fontSize: t.fontSizeXs, color: c.onDisabled }}>Disabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
