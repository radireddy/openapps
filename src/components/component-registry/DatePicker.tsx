import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ComponentType, DatePickerProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonInputStylingProps } from '../../constants';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/** Format a Date object to the specified display format */
function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  switch (format) {
    case 'MM/DD/YYYY': return `${m}/${d}/${y}`;
    case 'DD/MM/YYYY': return `${d}/${m}/${y}`;
    case 'DD-MM-YYYY': return `${d}-${m}-${y}`;
    case 'YYYY-MM-DD':
    default: return `${y}-${m}-${d}`;
  }
}

/** Parse a formatted date string back to ISO YYYY-MM-DD */
function parseToISO(value: string, format: string): string {
  if (!value) return '';
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.split(/[-/]/);
  if (parts.length !== 3) return value;
  switch (format) {
    case 'MM/DD/YYYY': return `${parts[2]}-${parts[0]}-${parts[1]}`;
    case 'DD/MM/YYYY':
    case 'DD-MM-YYYY': return `${parts[2]}-${parts[1]}-${parts[0]}`;
    default: return value;
  }
}

/** Get days in a month */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Get the day of week for the first day of the month (0=Sun) */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePickerRenderer: React.FC<{
  component: { id: string; props: DatePickerProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [pickerView, setPickerView] = useState<'days' | 'month' | 'year'>('days');
  const yearListRef = useRef<HTMLDivElement>(null);

  const dateFormat = p.dateFormat || 'YYYY-MM-DD';
  const minDate = useJavaScriptRenderer(p.minDate, evaluationScope, '');
  const maxDate = useJavaScriptRenderer(p.maxDate, evaluationScope, '');

  const validateDate = useCallback((value: any): string => {
    if (!value) return '';
    const iso = parseToISO(String(value), dateFormat);
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(p.errorMessage || '') || 'Invalid date';
    if (minDate && iso < String(minDate)) return String(p.errorMessage || '') || `Date must be on or after ${minDate}`;
    if (maxDate && iso > String(maxDate)) return String(p.errorMessage || '') || `Date must be on or before ${maxDate}`;
    return '';
  }, [dateFormat, minDate, maxDate, p.errorMessage]);

  const {
    isDisabledInPreview, isReadOnly, isRequired,
    currentValue, setLocalValue,
    validationError, validateOnChange, validateOnBlur,
    sizeVariant, finalOpacity, helpText, labelText, boxShadowValue,
    pointerEventsStyle, eventHandlers, ariaDescribedBy,
  } = useFormField({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions, validate: validateDate });

  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff');
  const fontSize = useJavaScriptRenderer(p.fontSize, evaluationScope, undefined);

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;

  // Close calendar on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPickerView('days');
        // Deferred validation after calendar closes without selection
        validateOnBlur(currentValue);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close calendar on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setPickerView('days');
        inputRef.current?.focus();
        // Deferred validation after calendar dismissed without selection
        validateOnBlur(currentValue);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-scroll year list to current viewYear when year picker opens
  useEffect(() => {
    if (pickerView === 'year' && yearListRef.current) {
      const activeButton = yearListRef.current.querySelector('[data-active-year="true"]');
      if (activeButton && typeof activeButton.scrollIntoView === 'function') {
        activeButton.scrollIntoView({ block: 'center' });
      }
    }
  }, [pickerView, viewYear]);

  // Sync view month/year when value changes
  useEffect(() => {
    if (currentValue) {
      const iso = parseToISO(String(currentValue), dateFormat);
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [currentValue, dateFormat]);

  const handleDateSelect = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    const isoStr = formatDate(selected, 'YYYY-MM-DD');
    const displayStr = formatDate(selected, dateFormat);
    setLocalValue(displayStr);
    if (onUpdateDataStore) onUpdateDataStore(component.id, isoStr);
    validateOnChange(displayStr);
    setIsOpen(false);
    setPickerView('days');

    handleChangeEvent(p, { mode, evaluationScope, actions, onUpdateDataStore },
      { target: { value: isoStr } } as any);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const newValue = e.target.value;
    if (mode === 'preview') {
      setLocalValue(newValue);
      if (onUpdateDataStore) onUpdateDataStore(component.id, parseToISO(newValue, dateFormat));
      validateOnChange(newValue);
    }
  };

  const displayValue = currentValue ? String(currentValue) : '';

  const isDateDisabled = (day: number): boolean => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (minDate && iso < String(minDate)) return true;
    if (maxDate && iso > String(maxDate)) return true;
    return false;
  };

  const isISODateDisabled = (isoStr: string): boolean => {
    if (minDate && isoStr < String(minDate)) return true;
    if (maxDate && isoStr > String(maxDate)) return true;
    return false;
  };

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const isToday = (day: number): boolean => {
    const today = new Date();
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  };

  const isSelected = (day: number): boolean => {
    if (!currentValue) return false;
    const iso = parseToISO(String(currentValue), dateFormat);
    const selectedIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return iso === selectedIso;
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

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

  // Compute year range for year picker
  const currentYear = new Date().getFullYear();
  const yearStart = minDate ? new Date(String(minDate)).getFullYear() : currentYear - 100;
  const yearEnd = maxDate ? new Date(String(maxDate)).getFullYear() : currentYear + 10;
  const yearRange: number[] = [];
  for (let y = yearStart; y <= yearEnd; y++) yearRange.push(y);

  const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
            value={displayValue}
            placeholder={p.placeholder || `Select date (${dateFormat})`}
            onChange={mode === 'preview' ? handleInputChange : () => {}}
            onFocus={(e) => {
              if (mode === 'preview' && !isReadOnly && !isDisabledInPreview) setIsOpen(true);
              if (mode === 'preview') eventHandlers.handleFocus(e);
            }}
            onBlur={(e) => {
              if (mode !== 'preview') return;
              // Suppress validation when calendar is open — blur is caused by
              // focus moving to the calendar popup, not the user leaving the field.
              if (isOpen) return;
              eventHandlers.handleBlur(e);
            }}
            readOnly={mode === 'edit'}
            disabled={isDisabledInPreview}
            aria-label={p.accessibilityLabel || 'Date picker'}
            aria-invalid={validationError ? 'true' : undefined}
            aria-describedby={ariaDescribedBy || undefined}
            aria-required={isRequired || undefined}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            style={inputStyle}
            className="focus:outline-none theme-focus"
          />
          {/* Calendar icon */}
          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: themeTextColor ? `${themeTextColor}80` : '#9ca3af' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>

          {/* Calendar popup */}
          {isOpen && mode === 'preview' && (
            <div
              ref={calendarRef}
              role="dialog"
              aria-label="Calendar"
              style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 9999,
                backgroundColor: themeColors?.surface || '#fff',
                border: `1px solid ${themeColors?.border || '#e5e7eb'}`,
                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '12px', width: '280px', marginTop: '4px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                {pickerView === 'days' && (
                  <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: themeTextColor || '#374151' }} aria-label="Previous month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                )}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: pickerView !== 'days' ? 1 : undefined, justifyContent: pickerView !== 'days' ? 'center' : undefined }}>
                  <button
                    type="button"
                    onClick={() => setPickerView(pickerView === 'month' ? 'days' : 'month')}
                    aria-label="Select month"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                      fontWeight: 600, fontSize: '14px', color: themeTextColor || '#111827',
                      borderRadius: '4px',
                    }}
                  >
                    {MONTH_NAMES[viewMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerView(pickerView === 'year' ? 'days' : 'year')}
                    aria-label="Select year"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                      fontWeight: 600, fontSize: '14px', color: themeTextColor || '#111827',
                      borderRadius: '4px',
                    }}
                  >
                    {viewYear}
                  </button>
                </div>
                {pickerView === 'days' && (
                  <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: themeTextColor || '#374151' }} aria-label="Next month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}
              </div>

              {/* Month picker grid */}
              {pickerView === 'month' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }} role="listbox" aria-label="Month picker">
                  {MONTH_NAMES_SHORT.map((monthName, idx) => (
                    <button
                      key={monthName}
                      type="button"
                      role="option"
                      aria-selected={idx === viewMonth}
                      onClick={() => { setViewMonth(idx); setPickerView('days'); }}
                      style={{
                        padding: '8px 4px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: idx === viewMonth ? 600 : 400,
                        backgroundColor: idx === viewMonth ? primaryColor : 'transparent',
                        color: idx === viewMonth ? (themeColors?.onPrimary || '#fff') : (themeTextColor || '#111827'),
                      }}
                    >
                      {monthName}
                    </button>
                  ))}
                </div>
              )}

              {/* Year picker list */}
              {pickerView === 'year' && (
                <div
                  ref={yearListRef}
                  role="listbox"
                  aria-label="Year picker"
                  style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}
                >
                  {yearRange.map(yr => (
                    <button
                      key={yr}
                      type="button"
                      role="option"
                      aria-selected={yr === viewYear}
                      data-active-year={yr === viewYear ? 'true' : undefined}
                      onClick={() => { setViewYear(yr); setPickerView('days'); }}
                      style={{
                        padding: '6px 4px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: yr === viewYear ? 600 : 400,
                        backgroundColor: yr === viewYear ? primaryColor : 'transparent',
                        color: yr === viewYear ? (themeColors?.onPrimary || '#fff') : (themeTextColor || '#111827'),
                      }}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}

              {/* Day headers */}
              {pickerView === 'days' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                  {DAY_NAMES.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: themeTextColor ? `${themeTextColor}80` : '#9ca3af', padding: '4px 0' }}>{d}</div>
                  ))}
                </div>
              )}

              {/* Calendar grid */}
              {pickerView === 'days' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                  {calendarDays.map((day, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      {day ? (
                        <button type="button"
                          disabled={isDateDisabled(day)}
                          onClick={() => handleDateSelect(day)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                            cursor: isDateDisabled(day) ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            backgroundColor: isSelected(day) ? primaryColor : 'transparent',
                            color: isSelected(day) ? (themeColors?.onPrimary || '#fff')
                              : isDateDisabled(day) ? (themeColors?.disabled || '#d1d5db')
                              : isToday(day) ? primaryColor
                              : (themeTextColor || '#111827'),
                            fontWeight: isToday(day) ? 700 : 400,
                            opacity: isDateDisabled(day) ? 0.4 : 1,
                          }}
                          aria-label={`${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}`}
                          aria-selected={isSelected(day)}
                        >
                          {day}
                        </button>
                      ) : <span />}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick date presets */}
              <div style={{ marginTop: '8px', textAlign: 'center', borderTop: `1px solid ${themeColors?.border || '#e5e7eb'}`, paddingTop: '8px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button type="button"
                  disabled={isISODateDisabled(todayISO)}
                  onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); handleDateSelect(today.getDate()); }}
                  style={{ background: 'none', border: 'none', cursor: isISODateDisabled(todayISO) ? 'not-allowed' : 'pointer', color: primaryColor, fontSize: '12px', fontWeight: 500, opacity: isISODateDisabled(todayISO) ? 0.4 : 1 }}>
                  Today
                </button>
                <button type="button"
                  disabled={isISODateDisabled(yesterdayISO)}
                  onClick={() => { setViewYear(yesterday.getFullYear()); setViewMonth(yesterday.getMonth()); handleDateSelect(yesterday.getDate()); }}
                  style={{ background: 'none', border: 'none', cursor: isISODateDisabled(yesterdayISO) ? 'not-allowed' : 'pointer', color: primaryColor, fontSize: '12px', fontWeight: 500, opacity: isISODateDisabled(yesterdayISO) ? 0.4 : 1 }}>
                  Yesterday
                </button>
              </div>
            </div>
          )}
        </div>
      </FormFieldWrapper>
    </div>
  );
};

export const DatePickerPlugin: ComponentPlugin = {
  type: ComponentType.DATE_PICKER,
  paletteConfig: {
    label: 'Date Picker',
    icon: React.createElement('svg', { style: iconStyle, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', stroke: 'currentColor', strokeWidth: '2' }),
      React.createElement('line', { x1: '16', y1: '2', x2: '16', y2: '6', stroke: 'currentColor', strokeWidth: '2' }),
      React.createElement('line', { x1: '8', y1: '2', x2: '8', y2: '6', stroke: 'currentColor', strokeWidth: '2' }),
      React.createElement('line', { x1: '3', y1: '10', x2: '21', y2: '10', stroke: 'currentColor', strokeWidth: '2' }),
    ),
    defaultProps: {
      ...commonInputStylingProps,
      label: '',
      placeholder: '',
      dateFormat: 'YYYY-MM-DD',
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
  renderer: DatePickerRenderer,
  properties: () => null,
};
