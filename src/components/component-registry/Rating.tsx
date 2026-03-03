import React, { useState, useCallback } from 'react';
import { ComponentType, RatingProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/** Star SVG component */
const Star: React.FC<{
  filled: number; // 0 = empty, 0.5 = half, 1 = full
  size: number;
  activeColor: string;
  inactiveColor: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  disabled?: boolean;
  index: number;
}> = ({ filled, size, activeColor, inactiveColor, onClick, onMouseEnter, disabled, index }) => {
  const starPath = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      style={{ cursor: disabled ? 'default' : 'pointer', transition: 'transform 0.1s' }}
      role="radio"
      aria-checked={filled === 1}
      aria-label={`${index + 1} star${index !== 0 ? 's' : ''}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } }}
    >
      {/* Background (inactive) star */}
      <path d={starPath} fill={inactiveColor} stroke={inactiveColor} strokeWidth="0.5" />
      {/* Filled portion */}
      {filled > 0 && (
        <clipPath id={`star-clip-${index}-${Math.random().toString(36).substr(2, 5)}`}>
          <rect x="0" y="0" width={filled === 1 ? '24' : '12'} height="24" />
        </clipPath>
      )}
      {filled > 0 && (
        <path d={starPath} fill={activeColor} stroke={activeColor} strokeWidth="0.5"
          clipPath={filled < 1 ? `url(#star-clip-${index}-half)` : undefined}
          style={filled < 1 ? { clipPath: `inset(0 ${(1 - filled) * 100}% 0 0)` } : undefined}
        />
      )}
    </svg>
  );
};

const RatingRenderer: React.FC<{
  component: { id: string; props: RatingProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const maxStars = p.maxStars || 5;
  const allowHalf = p.allowHalf || false;
  const showValueLabel = p.showValue ?? false;

  const activeColor = useJavaScriptRenderer(p.activeColor, evaluationScope, undefined);
  const inactiveColor = useJavaScriptRenderer(p.inactiveColor, evaluationScope, undefined);

  const validateRating = useCallback((value: any): string => {
    const num = Number(value);
    if (isNaN(num) && value) return String(p.errorMessage || '') || 'Invalid rating';
    if (num < 0) return String(p.errorMessage || '') || 'Rating cannot be negative';
    if (num > maxStars) return String(p.errorMessage || '') || `Rating cannot exceed ${maxStars}`;
    return '';
  }, [maxStars, p.errorMessage]);

  const {
    isDisabledInPreview, isReadOnly, isRequired,
    currentValue, setLocalValue,
    validationError, validateOnChange, forceValidate,
    finalOpacity, helpText, labelText,
    pointerEventsStyle,
  } = useFormField({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions, validate: validateRating });

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const primaryColor = themeColors?.primary || '#4f46e5';

  const numericValue = Number(currentValue) || 0;
  const displayValue = hoverValue !== null ? hoverValue : numericValue;

  const resolvedActiveColor = activeColor || '#f59e0b'; // amber-500
  const resolvedInactiveColor = inactiveColor || (themeColors?.disabled || '#e5e7eb');

  const starSize = p.starSize || (p.size === 'sm' ? 20 : p.size === 'lg' ? 32 : 24);

  const handleStarClick = (starIndex: number) => {
    if (isReadOnly || isDisabledInPreview || mode === 'edit') return;
    const newValue = starIndex + 1;
    // Toggle off if clicking same value
    const finalValue = newValue === numericValue ? 0 : newValue;
    setLocalValue(finalValue);
    if (onUpdateDataStore) onUpdateDataStore(component.id, finalValue);
    // Force validate when clearing (toggling off), otherwise normal onChange
    finalValue === 0 ? forceValidate(finalValue) : validateOnChange(finalValue);
    handleChangeEvent(p, { mode, evaluationScope, actions, onUpdateDataStore }, { target: { value: finalValue } } as any);
  };

  const handleHalfStarClick = (starIndex: number) => {
    if (isReadOnly || isDisabledInPreview || mode === 'edit') return;
    const newValue = starIndex + 0.5;
    const finalValue = newValue === numericValue ? 0 : newValue;
    setLocalValue(finalValue);
    if (onUpdateDataStore) onUpdateDataStore(component.id, finalValue);
    finalValue === 0 ? forceValidate(finalValue) : validateOnChange(finalValue);
    handleChangeEvent(p, { mode, evaluationScope, actions, onUpdateDataStore }, { target: { value: finalValue } } as any);
  };

  const isInteractive = mode === 'preview' && !isReadOnly && !isDisabledInPreview;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <FormFieldWrapper
        componentId={component.id} mode={mode}
        label={labelText ? String(labelText) : undefined}
        required={isRequired}
        helpText={helpText ? String(helpText) : undefined}
        errorMessage={validationError || undefined}
        textColor={themeTextColor} errorColor={themeColors?.error}
      >
        <div
          style={{ ...pointerEventsStyle, opacity: finalOpacity, display: 'flex', alignItems: 'center', gap: '4px', width: '100%', height: '100%' }}
          role="radiogroup"
          aria-label={p.accessibilityLabel || p.label || 'Rating'}
          onMouseLeave={() => isInteractive && setHoverValue(null)}
        >
          {Array.from({ length: maxStars }, (_, i) => {
            const starValue = i + 1;
            let filled = 0;
            if (displayValue >= starValue) filled = 1;
            else if (allowHalf && displayValue >= starValue - 0.5) filled = 0.5;

            if (allowHalf) {
              return (
                <div key={i} style={{ position: 'relative', display: 'inline-block', width: starSize, height: starSize }}>
                  {/* Left half (click for half star) */}
                  <div
                    style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 1, cursor: isInteractive ? 'pointer' : 'default' }}
                    onClick={() => handleHalfStarClick(i)}
                    onMouseEnter={() => isInteractive && setHoverValue(i + 0.5)}
                  />
                  {/* Right half (click for full star) */}
                  <div
                    style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 1, cursor: isInteractive ? 'pointer' : 'default' }}
                    onClick={() => handleStarClick(i)}
                    onMouseEnter={() => isInteractive && setHoverValue(i + 1)}
                  />
                  <Star filled={filled} size={starSize} activeColor={resolvedActiveColor} inactiveColor={resolvedInactiveColor}
                    disabled={!isInteractive} index={i} />
                </div>
              );
            }

            return (
              <Star key={i} filled={filled} size={starSize}
                activeColor={resolvedActiveColor} inactiveColor={resolvedInactiveColor}
                onClick={() => handleStarClick(i)}
                onMouseEnter={() => isInteractive && setHoverValue(i + 1)}
                disabled={!isInteractive} index={i} />
            );
          })}
          {showValueLabel && (
            <span data-testid="rating-value" style={{ fontSize: '14px', fontWeight: 600, color: themeTextColor || '#374151', marginLeft: '4px' }}>
              {numericValue}/{maxStars}
            </span>
          )}
        </div>
      </FormFieldWrapper>
    </div>
  );
};

export const RatingPlugin: ComponentPlugin = {
  type: ComponentType.RATING,
  paletteConfig: {
    label: 'Rating',
    icon: React.createElement('svg', { style: iconStyle, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
    ),
    defaultProps: {
      label: '',
      width: '100%',
      height: 'auto',
      maxStars: 5,
      allowHalf: false,
      defaultValue: 0,
      showValue: false,
      activeColor: '#f59e0b',
      inactiveColor: '{{theme.colors.disabled}}',
      disabled: false,
      required: false,
      validationTiming: 'onBlur',
      readOnly: false,
      size: 'md',
      helpText: '',
      onChangeActionType: 'none' as InputActionType,
    },
  },
  renderer: RatingRenderer,
  properties: () => null,
};
