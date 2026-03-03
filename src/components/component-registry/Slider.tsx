import React, { useCallback } from 'react';
import { ComponentType, SliderProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const SliderRenderer: React.FC<{
  component: { id: string; props: SliderProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;

  const min = p.min ?? 0;
  const max = p.max ?? 100;
  const step = p.step ?? 1;
  const showValue = p.showValue !== false;
  const showMinMax = p.showMinMax ?? false;

  const trackColor = useJavaScriptRenderer(p.trackColor, evaluationScope, undefined);
  const trackColorInactive = useJavaScriptRenderer(p.trackColorInactive, evaluationScope, undefined);
  const thumbColor = useJavaScriptRenderer(p.thumbColor, evaluationScope, undefined);

  const validateSlider = useCallback((value: any): string => {
    const num = Number(value);
    if (isNaN(num)) return String(p.errorMessage || '') || 'Invalid number';
    if (num < min) return String(p.errorMessage || '') || `Value must be at least ${min}`;
    if (num > max) return String(p.errorMessage || '') || `Value must be at most ${max}`;
    return '';
  }, [min, max, p.errorMessage]);

  const {
    isDisabledInPreview, isReadOnly, isRequired,
    currentValue, setLocalValue,
    validationError, validateOnChange,
    finalOpacity, helpText, labelText, boxShadowValue,
    pointerEventsStyle, eventHandlers,
  } = useFormField({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions, validate: validateSlider });

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const primaryColor = themeColors?.primary || '#4f46e5';

  const raw = Number(currentValue);
  const numericValue = currentValue === '' || currentValue == null || isNaN(raw) ? min : raw;
  const percentage = ((numericValue - min) / (max - min)) * 100;

  const activeTrackColor = trackColor || primaryColor;
  const inactiveTrackColor = trackColorInactive || (themeColors?.disabled || '#e5e7eb');
  const resolvedThumbColor = thumbColor || primaryColor;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const newValue = Number(e.target.value);
    if (mode === 'preview') {
      setLocalValue(newValue);
      if (onUpdateDataStore) onUpdateDataStore(component.id, newValue);
      validateOnChange(newValue);
    }
    handleChangeEvent(p, { mode, evaluationScope, actions, onUpdateDataStore }, e);
  };

  // Size-dependent track height
  const trackHeight = p.size === 'sm' ? 4 : p.size === 'lg' ? 8 : 6;
  const thumbSize = p.size === 'sm' ? 14 : p.size === 'lg' ? 22 : 18;

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
        <div style={{ ...pointerEventsStyle, opacity: finalOpacity, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            {showMinMax && (
              <span style={{ fontSize: '12px', color: themeTextColor ? `${themeTextColor}80` : '#6b7280', flexShrink: 0 }}>{min}</span>
            )}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                id={component.id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={numericValue}
                onChange={mode === 'preview' ? handleChange : () => {}}
                onFocus={mode === 'preview' ? eventHandlers.handleFocus : undefined}
                onBlur={mode === 'preview' ? eventHandlers.handleBlur : undefined}
                disabled={isDisabledInPreview}
                readOnly={mode === 'edit' || (mode === 'preview' && isReadOnly)}
                aria-label={p.accessibilityLabel || p.label || 'Slider'}
                aria-valuenow={numericValue}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-required={isRequired || undefined}
                aria-invalid={validationError ? 'true' : undefined}
                style={{
                  width: '100%',
                  height: `${trackHeight}px`,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: `linear-gradient(to right, ${activeTrackColor} ${percentage}%, ${inactiveTrackColor} ${percentage}%)`,
                  borderRadius: `${trackHeight}px`,
                  outline: 'none',
                  cursor: isDisabledInPreview ? 'not-allowed' : 'pointer',
                  accentColor: activeTrackColor,
                }}
              />
              <style>{`
                #${CSS.escape(component.id)}::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: ${thumbSize}px;
                  height: ${thumbSize}px;
                  border-radius: 50%;
                  background: ${resolvedThumbColor};
                  cursor: ${isDisabledInPreview ? 'not-allowed' : 'pointer'};
                  border: 2px solid white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                #${CSS.escape(component.id)}::-moz-range-thumb {
                  width: ${thumbSize}px;
                  height: ${thumbSize}px;
                  border-radius: 50%;
                  background: ${resolvedThumbColor};
                  cursor: ${isDisabledInPreview ? 'not-allowed' : 'pointer'};
                  border: 2px solid white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                #${CSS.escape(component.id)}:focus::-webkit-slider-thumb {
                  box-shadow: 0 0 0 3px rgba(79,70,229,0.3);
                }
              `}</style>
            </div>
            {showMinMax && (
              <span style={{ fontSize: '12px', color: themeTextColor ? `${themeTextColor}80` : '#6b7280', flexShrink: 0 }}>{max}</span>
            )}
            {showValue && (
              <span data-testid="slider-value" style={{
                fontSize: '13px', fontWeight: 600,
                color: primaryColor,
                minWidth: '36px', textAlign: 'center', flexShrink: 0,
                backgroundColor: themeColors?.background || '#f3f4f6',
                borderRadius: '4px', padding: '2px 6px',
              }}>
                {numericValue}
              </span>
            )}
          </div>
        </div>
      </FormFieldWrapper>
    </div>
  );
};

export const SliderPlugin: ComponentPlugin = {
  type: ComponentType.SLIDER,
  paletteConfig: {
    label: 'Slider',
    icon: React.createElement('svg', { style: iconStyle, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('line', { x1: '4', y1: '12', x2: '20', y2: '12', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round' }),
      React.createElement('circle', { cx: '14', cy: '12', r: '3', stroke: 'currentColor', strokeWidth: '2', fill: 'none' }),
    ),
    defaultProps: {
      label: '',
      width: '100%',
      height: 'auto',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      showValue: true,
      showMinMax: false,
      trackColor: '{{theme.colors.primary}}',
      trackColorInactive: '{{theme.colors.disabled}}',
      thumbColor: '{{theme.colors.primary}}',
      disabled: false,
      required: false,
      validationTiming: 'onBlur',
      readOnly: false,
      size: 'md',
      helpText: '',
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
    },
  },
  renderer: SliderRenderer,
  properties: () => null,
};
