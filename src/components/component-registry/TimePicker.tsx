import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ComponentType, TimePickerProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonInputStylingProps } from '../../constants';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/** Format time for display */
function formatTime(h: number, m: number, s: number, format: '12h' | '24h', showSeconds: boolean): string {
  if (format === '12h') {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const base = `${h12}:${String(m).padStart(2, '0')}`;
    return showSeconds ? `${base}:${String(s).padStart(2, '0')} ${period}` : `${base} ${period}`;
  }
  const base = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return showSeconds ? `${base}:${String(s).padStart(2, '0')}` : base;
}

/** Parse a time string to hours, minutes, seconds */
function parseTime(value: string): { h: number; m: number; s: number } | null {
  if (!value) return null;
  const cleaned = value.trim().toUpperCase();
  // 12h format: "1:30 PM" or "01:30:00 PM"
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match12) {
    let h = parseInt(match12[1]);
    const m = parseInt(match12[2]);
    const s = match12[3] ? parseInt(match12[3]) : 0;
    if (match12[4] === 'PM' && h !== 12) h += 12;
    if (match12[4] === 'AM' && h === 12) h = 0;
    return { h, m, s };
  }
  // 24h format: "13:30" or "13:30:00"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    return { h: parseInt(match24[1]), m: parseInt(match24[2]), s: match24[3] ? parseInt(match24[3]) : 0 };
  }
  return null;
}

const TimePickerRenderer: React.FC<{
  component: { id: string; props: TimePickerProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const timeFormat = p.timeFormat || '24h';
  const minuteStep = p.minuteStep || 15;
  const showSeconds = p.showSeconds || false;

  const validateTime = useCallback((value: any): string => {
    if (!value) return '';
    const parsed = parseTime(String(value));
    if (!parsed) return String(p.errorMessage || '') || 'Invalid time format';
    if (parsed.h < 0 || parsed.h > 23) return String(p.errorMessage || '') || 'Hours must be 0-23';
    if (parsed.m < 0 || parsed.m > 59) return String(p.errorMessage || '') || 'Minutes must be 0-59';
    return '';
  }, [p.errorMessage]);

  const {
    isDisabledInPreview, isReadOnly, isRequired,
    currentValue, setLocalValue,
    validationError, validateOnChange,
    sizeVariant, finalOpacity, helpText, labelText, boxShadowValue,
    pointerEventsStyle, eventHandlers, ariaDescribedBy,
  } = useFormField({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions, validate: validateTime });

  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff');
  const fontSize = useJavaScriptRenderer(p.fontSize, evaluationScope, undefined);

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Generate time options
  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += minuteStep) {
      timeOptions.push(formatTime(h, m, 0, timeFormat, showSeconds));
    }
  }

  const handleTimeSelect = (timeStr: string) => {
    setLocalValue(timeStr);
    const parsed = parseTime(timeStr);
    const isoValue = parsed
      ? showSeconds
        ? `${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}:${String(parsed.s).padStart(2, '0')}`
        : `${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}`
      : timeStr;
    if (onUpdateDataStore) onUpdateDataStore(component.id, isoValue);
    validateOnChange(timeStr);
    setIsOpen(false);
    handleChangeEvent(p, { mode, evaluationScope, actions, onUpdateDataStore }, { target: { value: isoValue } } as any);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const newValue = e.target.value;
    if (mode === 'preview') {
      setLocalValue(newValue);
      // Strip seconds if showSeconds is false
      const storeValue = !showSeconds && newValue.match(/^\d{2}:\d{2}:\d{2}$/)
        ? newValue.substring(0, 5)
        : newValue;
      if (onUpdateDataStore) onUpdateDataStore(component.id, storeValue);
      validateOnChange(newValue);
    }
  };

  const inputStyle: React.CSSProperties = {
    borderRadius, borderWidth, borderColor,
    borderStyle: p.borderStyle || 'solid',
    color, backgroundColor,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    fontSize: fontSize || sizeVariant.fontSize,
    padding: sizeVariant.padding,
    width: '100%', height: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    ...pointerEventsStyle,
  };

  const primaryColor = themeColors?.primary || '#4f46e5';

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
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <input
            id={component.id} ref={inputRef}
            type="text"
            value={currentValue ? (!showSeconds ? String(currentValue).replace(/^(\d{1,2}:\d{2}):\d{2}$/, '$1') : String(currentValue)) : ''}
            placeholder={p.placeholder || `Select time (${timeFormat})`}
            onChange={mode === 'preview' ? handleInputChange : () => {}}
            onFocus={(e) => {
              if (mode === 'preview' && !isReadOnly && !isDisabledInPreview) setIsOpen(true);
              if (mode === 'preview') eventHandlers.handleFocus(e);
            }}
            onBlur={mode === 'preview' ? eventHandlers.handleBlur : undefined}
            readOnly={mode === 'edit'}
            disabled={isDisabledInPreview}
            aria-label={p.accessibilityLabel || 'Time picker'}
            aria-invalid={validationError ? 'true' : undefined}
            aria-describedby={ariaDescribedBy || undefined}
            aria-required={isRequired || undefined}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            style={inputStyle}
            className="focus:outline-none theme-focus"
          />
          {/* Clock icon */}
          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: themeTextColor ? `${themeTextColor}80` : '#9ca3af' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </span>

          {/* Time dropdown */}
          {isOpen && mode === 'preview' && (
            <div
              ref={dropdownRef}
              role="listbox"
              aria-label="Time options"
              style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 9999,
                backgroundColor: themeColors?.surface || '#fff',
                border: `1px solid ${themeColors?.border || '#e5e7eb'}`,
                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxHeight: '200px', overflowY: 'auto', width: '100%',
                marginTop: '4px',
              }}
            >
              {timeOptions.map(time => {
                const isSelected = String(currentValue) === time;
                return (
                  <div
                    key={time}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleTimeSelect(time)}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      padding: '8px 12px', cursor: 'pointer',
                      fontSize: sizeVariant.fontSize,
                      backgroundColor: isSelected ? (themeColors?.hover || '#eff6ff') : 'transparent',
                      color: isSelected ? primaryColor : (themeTextColor || '#111827'),
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = themeColors?.hover || '#f3f4f6'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = isSelected ? (themeColors?.hover || '#eff6ff') : 'transparent'; }}
                  >
                    {time}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FormFieldWrapper>
    </div>
  );
};

export const TimePickerPlugin: ComponentPlugin = {
  type: ComponentType.TIME_PICKER,
  paletteConfig: {
    label: 'Time Picker',
    icon: React.createElement('svg', { style: iconStyle, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('circle', { cx: '12', cy: '12', r: '10', stroke: 'currentColor', strokeWidth: '2' }),
      React.createElement('polyline', { points: '12 6 12 12 16 14', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
    ),
    defaultProps: {
      ...commonInputStylingProps,
      label: '',
      placeholder: '',
      timeFormat: '24h',
      minuteStep: 15,
      showSeconds: false,
      width: '100%',
      height: 'auto',
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
  renderer: TimePickerRenderer,
  properties: () => null,
};
