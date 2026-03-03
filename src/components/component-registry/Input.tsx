
import React, { useRef, useCallback } from 'react';
import { ComponentType, InputProps, ComponentPlugin, InputActionType } from '../../types';
import { InlineTextEditor, buildSpacingStyles } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonInputStylingProps } from '../../constants';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';
import { useInheritedStyles } from '../InheritedStylesContext';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const InputRenderer: React.FC<{
  component: { id: string; props: InputProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  isEditingInline?: boolean;
  onCommitInlineEdit?: (newValue: string) => void;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, isEditingInline, onCommitInlineEdit, actions }) => {
  const p = component.props;
  const inputRef = useRef<HTMLInputElement>(null);
  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;

  // Cascading text styles: use inherited values as fallbacks for font properties
  const inherited = useInheritedStyles();

  // Evaluate styling properties
  const placeholder = useJavaScriptRenderer(p.placeholder, evaluationScope, '');
  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');
  const effectiveFontSize = p.fontSize || inherited.textFontSize;
  const fontSize = useJavaScriptRenderer(effectiveFontSize, evaluationScope, 14);
  const effectiveFontFamily = p.fontFamily || inherited.textFontFamily;
  const fontFamily = useJavaScriptRenderer(effectiveFontFamily, evaluationScope, undefined);
  const fontWeight = useJavaScriptRenderer(p.fontWeight, evaluationScope, 'normal');
  const fontStyle = p.fontStyle || 'normal';
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff');
  const zIndex = p.zIndex;
  const prefixText = useJavaScriptRenderer(p.prefixText, evaluationScope, '');
  const suffixText = useJavaScriptRenderer(p.suffixText, evaluationScope, '');
  const paddingValue = useJavaScriptRenderer(p.padding, evaluationScope, undefined);
  const marginValue = useJavaScriptRenderer(p.margin, evaluationScope, undefined);

  // Evaluate maxValue before useFormField so it can be used in the validate callback
  const maxValue = useJavaScriptRenderer(p.max, evaluationScope, undefined);

  // Component-specific validation (runs after required check in useFormField)
  const validateInput = useCallback((value: any): string => {
    const stringValue = String(value || '');
    const errorMsg = p.errorMessage || '';
    const inputType = p.inputType || 'text';

    if (inputType === 'number') {
      const numValue = parseFloat(stringValue);
      if (stringValue && isNaN(numValue)) return 'Please enter a valid number';
      if (maxValue !== undefined) {
        const maxNum = typeof maxValue === 'number' ? maxValue : parseFloat(String(maxValue || 0));
        if (!isNaN(maxNum) && numValue > maxNum) return errorMsg || `Value must be at most ${maxNum}`;
      }
    }

    if (inputType === 'email' && stringValue) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) return errorMsg || 'Please enter a valid email address';
    }

    if (inputType === 'url' && stringValue) {
      try { new URL(stringValue); } catch { return errorMsg || 'Please enter a valid URL'; }
    }

    if (p.pattern && stringValue) {
      try {
        if (!new RegExp(p.pattern).test(stringValue)) return errorMsg || 'Value does not match the required pattern';
      } catch { /* invalid regex */ }
    }

    return '';
  }, [maxValue, p.inputType, p.pattern, p.errorMessage]);

  // Use the shared form field hook for all common boilerplate
  const {
    isDisabled, isDisabledInPreview, isReadOnly, isRequired,
    currentValue, setLocalValue,
    validationError, validateOnChange, forceValidate,
    sizeVariant, finalOpacity, helpText, labelText, boxShadowValue,
    pointerEventsStyle, eventHandlers, ariaDescribedBy,
  } = useFormField({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions, validate: validateInput });

  // Build style object
  const style: React.CSSProperties = {
    borderRadius: (prefixText || suffixText) ? 0 : borderRadius,
    borderWidth: (prefixText || suffixText) ? 0 : borderWidth,
    borderColor: (prefixText || suffixText) ? 'transparent' : borderColor,
    borderStyle: (prefixText || suffixText) ? 'none' : (p.borderStyle || 'solid'),
    opacity: finalOpacity,
    boxShadow: (prefixText || suffixText) ? undefined : (boxShadowValue || undefined),
    ...buildSpacingStyles(paddingValue, marginValue),
    padding: paddingValue !== undefined ? undefined : sizeVariant.padding,
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    color,
    textAlign: p.textAlign || 'left',
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    fontFamily: fontFamily || undefined,
    fontWeight,
    fontStyle,
    textTransform: (p.textTransform && p.textTransform !== 'none') ? p.textTransform : undefined,
    zIndex: zIndex !== undefined ? zIndex : undefined,
    ...pointerEventsStyle,
    width: '100%',
    height: '100%',
    flex: 1,
    minWidth: 0,
    outline: 'none',
  };

  // Wrapper style for prefix/suffix container
  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: p.borderStyle || 'solid',
    backgroundColor,
    boxShadow: boxShadowValue || undefined,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  // Handle value change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const newValue = e.target.value;

    if (mode === 'preview') {
      setLocalValue(newValue);
      if (onUpdateDataStore) onUpdateDataStore(component.id, newValue);
      validateOnChange(newValue);
    }

    handleChangeEvent(p, { mode, evaluationScope, actions, onUpdateDataStore }, e);
  };

  // Clear button handler — force-validate immediately since clearing is a deliberate action
  const handleClear = () => {
    if (mode === 'preview') {
      setLocalValue('');
      if (onUpdateDataStore) onUpdateDataStore(component.id, '');
      forceValidate('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Handle inline editing in canvas mode
  if (mode === 'edit' && isEditingInline && onCommitInlineEdit) {
    return (
      <div style={{ ...wrapperStyle, ...style }}>
        <InlineTextEditor value={p.placeholder} onCommit={onCommitInlineEdit} style={{ color: themeTextColor ? `${themeTextColor}80` : '#9ca3af' }} />
      </div>
    );
  }

  // Build input props
  const inputType = p.inputType || 'text';
  const inputProps: any = {
    type: inputType,
    placeholder,
    disabled: isDisabledInPreview,
    readOnly: mode === 'edit' || (mode === 'preview' && isReadOnly),
    'aria-disabled': isDisabledInPreview || undefined,
    'aria-readonly': (mode === 'preview' && isReadOnly) || undefined,
    'aria-label': p.accessibilityLabel || placeholder,
    'aria-invalid': validationError ? 'true' : undefined,
    'aria-describedby': ariaDescribedBy || undefined,
    'aria-required': isRequired || undefined,
    style,
    className: 'focus:outline-none theme-focus',
    ref: inputRef,
    autoComplete: p.autoComplete || undefined,
  };

  // Validation attributes
  if (maxValue !== undefined) {
    inputProps.max = typeof maxValue === 'number' ? maxValue : parseFloat(String(maxValue)) || undefined;
  }
  if (p.maxLength !== undefined && p.maxLength > 0) inputProps.maxLength = p.maxLength;
  if (p.pattern) inputProps.pattern = p.pattern;
  if (isRequired) inputProps.required = true;

  // Event handlers
  if (mode === 'edit') {
    inputProps.onChange = () => {};
  } else {
    inputProps.onChange = handleChange;
    inputProps.onFocus = eventHandlers.handleFocus;
    inputProps.onBlur = eventHandlers.handleBlur;
    inputProps.onKeyDown = eventHandlers.handleKeyDown;
  }

  // Always controlled — in edit mode the input is readOnly so controlled is safe,
  // and it ensures defaultValue changes in the properties panel are reflected immediately.
  inputProps.value = currentValue;

  const affixStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', padding: '0 8px',
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    color: themeTextColor ? `${themeTextColor}99` : '#6b7280',
    backgroundColor: themeColors?.background || '#f9fafb',
    flexShrink: 0,
    borderColor, whiteSpace: 'nowrap',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <FormFieldWrapper
        componentId={component.id}
        mode={mode}
        label={labelText ? String(labelText) : undefined}
        required={isRequired}
        helpText={helpText ? String(helpText) : undefined}
        errorMessage={validationError || undefined}
        showCharacterCount={p.showCharacterCount}
        currentLength={String(currentValue || '').length}
        maxLength={p.maxLength}
        textColor={themeTextColor}
        errorColor={themeColors?.error}
      >
        <div style={wrapperStyle}>
          {prefixText && (
            <span data-testid="input-prefix" style={{ ...affixStyle, borderRight: `${borderWidth} solid ${borderColor}` }}>
              {prefixText}
            </span>
          )}
          <input id={component.id} {...inputProps} />
          {p.clearButton && mode === 'preview' && currentValue && !isReadOnly && !isDisabledInPreview && (
            <button
              type="button"
              onClick={handleClear}
              style={{ position: 'absolute', right: suffixText ? undefined : '8px', background: 'none', border: 'none', cursor: 'pointer', color: themeTextColor ? `${themeTextColor}80` : '#9ca3af', padding: '0 4px', fontSize: '16px', lineHeight: 1 }}
              aria-label="Clear input"
              tabIndex={-1}
            >
              ×
            </button>
          )}
          {suffixText && (
            <span data-testid="input-suffix" style={{ ...affixStyle, borderLeft: `${borderWidth} solid ${borderColor}` }}>
              {suffixText}
            </span>
          )}
        </div>
      </FormFieldWrapper>
    </div>
  );
};

export const InputPlugin: ComponentPlugin = {
  type: ComponentType.INPUT,
  paletteConfig: {
    label: 'Input',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('rect', { x: "4", y: "8", width: "16", height: "8", rx: "1", stroke: "currentColor", strokeWidth: "2" }), React.createElement('path', { d: "M9 12V12.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonInputStylingProps,
      label: '',
      placeholder: 'Enter text...',
      accessibilityLabel: 'Text input field',
      inputType: 'text',
      width: '100%',
      height: 'auto',
      disabled: false,
      required: false,
      fontStyle: 'normal',
      validationTiming: 'onBlur',
      readOnly: false,
      size: 'md',
      helpText: '',
      prefixText: '',
      suffixText: '',
      clearButton: false,
      autoComplete: 'off',
      textTransform: 'none',
      showCharacterCount: false,
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
    },
  },
  renderer: InputRenderer,
  properties: () => null,
};
