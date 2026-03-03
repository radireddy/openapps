

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ComponentType, SelectProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonInputStylingProps } from '../../constants';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';
import { useInheritedStyles } from '../InheritedStylesContext';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const SelectRenderer: React.FC<{
  component: { id: string; props: SelectProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const selectRef = useRef<HTMLSelectElement>(null);
  const p = component.props;
  const options = p.options.split(',').map(opt => opt.trim());

  const {
    isDisabled, isDisabledInPreview, isReadOnly, isRequired,
    currentValue, setLocalValue,
    validationError, validateOnBlur, validateOnChange, forceValidate,
    sizeVariant, finalOpacity, helpText, labelText, boxShadowValue,
    pointerEventsStyle, focusBlurRefs, eventHandlers, ariaDescribedBy,
  } = useFormField({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions });

  // Cascading text styles: use inherited values as fallbacks for font properties
  const inherited = useInheritedStyles();

  // Evaluate styling properties
  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff');
  const effectiveFontSize = p.fontSize || inherited.textFontSize;
  const fontSize = useJavaScriptRenderer(effectiveFontSize, evaluationScope, undefined);
  const effectiveFontFamily = p.fontFamily || inherited.textFontFamily;
  const fontFamily = useJavaScriptRenderer(effectiveFontFamily, evaluationScope, undefined);

  const style: React.CSSProperties = {
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: p.borderStyle,
    color,
    backgroundColor,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    pointerEvents: (mode === 'edit' && isDisabled ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
  };

  // Clear button handler
  const handleClear = () => {
    if (mode === 'preview') {
      setLocalValue('');
      if (onUpdateDataStore) onUpdateDataStore(component.id, '');
      forceValidate('');
      focusBlurRefs.lastClickTimeRef.current = Date.now();
      if (selectRef.current) selectRef.current.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // If readOnly in preview, return early
    if (isReadOnly) return;

    const newValue = e.target.value;

    // Update local state for interactivity
    if (mode === 'preview') {
      setLocalValue(newValue);
      // Also update dataStore using component ID as key
      if (onUpdateDataStore) {
        onUpdateDataStore(component.id, newValue);
      }
      validateOnChange(newValue);
    }

    // Record click time to prevent focus/blur from firing during click
    focusBlurRefs.lastClickTimeRef.current = Date.now();

    handleChangeEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
      },
      e
    );
  };

  // Adjust height for multiple select
  style.height = p.multiple ? 'auto' : '100%';
  style.padding = sizeVariant.padding;
  style.fontSize = fontSize
    ? (typeof fontSize === 'number' ? `${fontSize}px` : fontSize)
    : sizeVariant.fontSize;
  if (fontFamily) {
    style.fontFamily = String(fontFamily);
  }

  // --- Searchable Combobox state ---
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const comboInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const comboWrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lower));
  }, [options, searchTerm]);

  // Click outside handler for searchable dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (comboWrapperRef.current && !comboWrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleComboSelect = (value: string) => {
    setLocalValue(value);
    if (onUpdateDataStore) onUpdateDataStore(component.id, value);
    validateOnChange(value);
    setIsOpen(false);
    setSearchTerm('');
    setActiveIndex(-1);
  };

  const handleComboKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filteredOptions.length) {
      e.preventDefault();
      handleComboSelect(filteredOptions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[activeIndex] as HTMLElement;
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const themeSurfaceColor = themeColors?.surface;
  const themeBorderColor = themeColors?.border;

  const useSearchable = p.searchable;

  // Render searchable combobox for preview mode when searchable is enabled
  if (useSearchable) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <FormFieldWrapper
          componentId={component.id}
          mode={mode}
          label={labelText ? String(labelText) : undefined}
          required={isRequired}
          helpText={helpText ? String(helpText) : undefined}
          errorMessage={validationError || undefined}
          textColor={themeTextColor}
          errorColor={themeColors?.error}
        >
          <div ref={comboWrapperRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
            <input
              id={component.id}
              role="combobox"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-controls={`${component.id}-listbox`}
              aria-activedescendant={activeIndex >= 0 ? `${component.id}-opt-${activeIndex}` : undefined}
              aria-label={p.accessibilityLabel || p.placeholder}
              aria-required={isRequired || undefined}
              aria-invalid={validationError ? 'true' : undefined}
              aria-describedby={ariaDescribedBy || undefined}
              ref={comboInputRef}
              value={isOpen ? searchTerm : (currentValue || '')}
              placeholder={currentValue || p.placeholder}
              disabled={isDisabledInPreview}
              readOnly={mode === 'edit' || isReadOnly}
              onChange={(e) => {
                if (mode === 'edit') return;
                setSearchTerm(e.target.value);
                setActiveIndex(-1);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => { if (mode === 'preview' && !isReadOnly && !isDisabledInPreview) setIsOpen(true); }}
              onKeyDown={handleComboKeyDown}
              style={{
                ...style,
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
              className="w-full h-full p-2 focus:outline-none theme-focus"
              autoComplete="off"
            />
            {/* Dropdown arrow */}
            <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: themeTextColor ? `${themeTextColor}80` : '#9ca3af' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
            </span>
            {isOpen && (
              <ul
                ref={listboxRef}
                id={`${component.id}-listbox`}
                role="listbox"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: themeSurfaceColor || '#fff',
                  border: `1px solid ${themeBorderColor || '#e5e7eb'}`,
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                }}
              >
                {filteredOptions.length === 0 ? (
                  <li style={{ padding: '8px 12px', color: themeTextColor ? `${themeTextColor}80` : '#9ca3af', fontSize: sizeVariant.fontSize }}>No matches</li>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const isActive = idx === activeIndex;
                    // Highlight matching text
                    let content: React.ReactNode = opt;
                    if (searchTerm) {
                      const matchIdx = opt.toLowerCase().indexOf(searchTerm.toLowerCase());
                      if (matchIdx >= 0) {
                        content = (
                          <>
                            {opt.slice(0, matchIdx)}
                            <strong>{opt.slice(matchIdx, matchIdx + searchTerm.length)}</strong>
                            {opt.slice(matchIdx + searchTerm.length)}
                          </>
                        );
                      }
                    }
                    return (
                      <li
                        key={opt}
                        id={`${component.id}-opt-${idx}`}
                        role="option"
                        aria-selected={currentValue === opt}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: sizeVariant.fontSize,
                          backgroundColor: isActive
                            ? (themeColors?.hover || '#eff6ff')
                            : (currentValue === opt ? (themeColors?.background || '#f3f4f6') : (themeSurfaceColor || '#fff')),
                          color: themeTextColor || '#111827',
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur
                          handleComboSelect(opt);
                        }}
                      >
                        {content}
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>
          {p.clearable && currentValue && !isReadOnly && !isDisabledInPreview && (
            <button
              type="button"
              onClick={handleClear}
              style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: themeTextColor ? `${themeTextColor}80` : '#9ca3af', fontSize: '16px' }}
              aria-label="Clear selection"
              tabIndex={-1}
            >
              &times;
            </button>
          )}
        </FormFieldWrapper>
      </div>
    );
  }

  // Default: native <select>
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <FormFieldWrapper
        componentId={component.id}
        mode={mode}
        label={labelText ? String(labelText) : undefined}
        required={isRequired}
        helpText={helpText ? String(helpText) : undefined}
        errorMessage={validationError || undefined}
        textColor={themeTextColor}
        errorColor={themeColors?.error}
      >
        <select
          id={component.id}
          ref={selectRef}
          value={currentValue}
          onChange={mode === 'edit' ? () => {} : handleChange}
          readOnly={mode === 'edit'}
          onFocus={mode === 'preview' ? eventHandlers.handleFocus : undefined}
          onBlur={mode === 'preview' ? eventHandlers.handleBlur : undefined}
          onKeyDown={mode === 'preview' ? eventHandlers.handleKeyDown : undefined}
          style={style}
          className={`w-full h-full p-2 focus:outline-none theme-focus ${mode === 'edit' ? 'pointer-events-none' : ''}`}
          disabled={isDisabledInPreview}
          aria-disabled={isDisabledInPreview}
          aria-label={p.accessibilityLabel || p.placeholder}
          aria-required={isRequired || undefined}
          aria-invalid={validationError ? 'true' : undefined}
          aria-describedby={ariaDescribedBy || undefined}
          multiple={p.multiple || undefined}
          size={p.multiple ? Math.min(options.length + 1, 6) : undefined}
        >
          <option value="" disabled>{p.placeholder}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {p.clearable && currentValue && mode === 'preview' && !isReadOnly && !isDisabledInPreview && (
          <button
            type="button"
            onClick={handleClear}
            style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px' }}
            aria-label="Clear selection"
            tabIndex={-1}
          >
            &times;
          </button>
        )}
      </FormFieldWrapper>
    </div>
  );
};

export const SelectPlugin: ComponentPlugin = {
  type: ComponentType.SELECT,
  paletteConfig: {
    label: 'Select',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 9H20", stroke: "currentColor", strokeWidth: "2" }), React.createElement('path', { d: "M7 14L10 17L13 14", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })),
    defaultProps: {
      ...commonInputStylingProps,
      label: '',
      placeholder: 'Select an option',
      options: 'Option 1,Option 2,Option 3',
      accessibilityLabel: 'Dropdown select',
      width: '100%',
      height: 'auto',
      disabled: false,
      validationTiming: 'onBlur',
      readOnly: false,
      size: 'md',
      helpText: '',
      multiple: false,
      searchable: false,
      clearable: false,
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
    },
  },
  renderer: SelectRenderer,
  properties: () => null,
};
