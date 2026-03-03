import React from 'react';
import { ComponentType, ProgressProps, ComponentPlugin } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { useDisplayStyle } from './useDisplayStyle';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const ProgressRenderer: React.FC<{
  component: { id: string; props: ProgressProps };
  mode: 'edit' | 'preview';
  evaluationScope: Record<string, any>;
}> = ({ component, mode, evaluationScope }) => {
  const p = component.props;

  const rawValue = useJavaScriptRenderer(p.value, evaluationScope, 0);
  const value = Math.min(Math.max(Number(rawValue) || 0, 0), p.max || 100);
  const maxVal = p.max || 100;
  const percentage = (value / maxVal) * 100;

  const barColor = useJavaScriptRenderer(p.barColor, evaluationScope, undefined);
  const trackColor = useJavaScriptRenderer(p.trackColor, evaluationScope, undefined);
  const labelColor = useJavaScriptRenderer(p.labelColor, evaluationScope, undefined);
  const fontSize = useJavaScriptRenderer(p.fontSize, evaluationScope, undefined);

  const { finalOpacity, borderShadowStyle } = useDisplayStyle(p, evaluationScope);

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const primaryColor = themeColors?.primary || '#4f46e5';

  // Status-based colors
  const getStatusColor = (): string => {
    if (barColor) return barColor;
    switch (p.status) {
      case 'success': return themeColors?.success || '#22c55e';
      case 'warning': return themeColors?.warning || '#f59e0b';
      case 'error': return themeColors?.error || '#ef4444';
      default: return primaryColor;
    }
  };

  const resolvedBarColor = getStatusColor();
  const resolvedTrackColor = trackColor || (themeColors?.disabled || '#e5e7eb');
  const resolvedLabelColor = labelColor || (themeTextColor || '#374151');
  const barHeight = p.barHeight || 8;
  const showLabel = p.showLabel !== false;
  const variant = p.variant || 'linear';

  // Format label
  const labelText = p.labelFormat
    ? String(p.labelFormat)
        .replace(/\{\{value\}\}/g, String(Math.round(value)))
        .replace(/\{\{max\}\}/g, String(maxVal))
        .replace(/\{\{percentage\}\}/g, String(Math.round(percentage)))
    : `${Math.round(percentage)}%`;

  if (variant === 'circular') {
    const size = Math.min(Number(p.width) || 60, Number(p.height) || 60);
    const strokeWidth = typeof barHeight === 'number' ? barHeight : 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: finalOpacity }}
        role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={maxVal} aria-label={`Progress: ${Math.round(percentage)}%`}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={resolvedTrackColor} strokeWidth={strokeWidth} />
            {/* Progress */}
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={resolvedBarColor} strokeWidth={strokeWidth}
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
          </svg>
          {showLabel && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontSize: fontSize || `${Math.max(size / 4, 10)}px`, fontWeight: 600, color: resolvedLabelColor,
            }}>
              {labelText}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Linear progress bar
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: finalOpacity }}
      role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={maxVal} aria-label={`Progress: ${Math.round(percentage)}%`}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: fontSize || '12px', fontWeight: 500, color: resolvedLabelColor }}>{labelText}</span>
        </div>
      )}
      <div style={{
        width: '100%', height: typeof barHeight === 'number' ? `${barHeight}px` : barHeight,
        backgroundColor: resolvedTrackColor,
        borderRadius: `${Number(barHeight) || 8}px`,
        overflow: 'hidden', position: 'relative',
        ...borderShadowStyle,
      }}>
        <div
          data-testid="progress-bar"
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: resolvedBarColor,
            borderRadius: `${Number(barHeight) || 8}px`,
            transition: 'width 0.3s ease',
            position: 'relative',
            ...(p.striped ? {
              backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)`,
              backgroundSize: `${Number(barHeight) * 2 || 16}px ${Number(barHeight) * 2 || 16}px`,
              ...(p.animated ? { animation: 'progress-stripes 1s linear infinite' } : {}),
            } : {}),
          }}
        />
        {p.striped && p.animated && (
          <style>{`@keyframes progress-stripes { from { background-position: ${Number(barHeight) * 2 || 16}px 0; } to { background-position: 0 0; } }`}</style>
        )}
      </div>
    </div>
  );
};

export const ProgressPlugin: ComponentPlugin = {
  type: ComponentType.PROGRESS,
  paletteConfig: {
    label: 'Progress',
    icon: React.createElement('svg', { style: iconStyle, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('rect', { x: '2', y: '9', width: '20', height: '6', rx: '3', stroke: 'currentColor', strokeWidth: '2' }),
      React.createElement('rect', { x: '2', y: '9', width: '12', height: '6', rx: '3', fill: 'currentColor', opacity: '0.4' }),
    ),
    defaultProps: {
      ...commonStylingProps,
      value: 60,
      max: 100,
      barColor: '{{theme.colors.primary}}',
      trackColor: '{{theme.colors.disabled}}',
      showLabel: true,
      barHeight: 8,
      striped: false,
      animated: false,
      variant: 'linear',
      labelColor: '{{theme.colors.text}}',
      fontSize: '{{theme.typography.fontSizeXs}}',
      status: 'default',
      width: '100%',
      height: 'auto',
      disabled: false,
      borderStyle: 'none',
    },
  },
  renderer: ProgressRenderer,
  properties: () => null,
};
