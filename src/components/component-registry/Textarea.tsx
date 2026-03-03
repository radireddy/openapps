

import React, { useEffect, useRef, useCallback } from 'react';
import { ComponentType, TextareaProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonInputStylingProps } from '../../constants';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';
import { useInheritedStyles } from '../InheritedStylesContext';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const TextareaRenderer: React.FC<{
  component: { id: string; props: TextareaProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const p = component.props;

  // Component-specific validation (pattern + maxLength)
  // Required check is handled by useFormField internally.
  const validateTextarea = useCallback((value: any): string => {
    const stringValue = String(value ?? '');
    if (p.pattern && stringValue) {
      try {
        if (!new RegExp(p.pattern).test(stringValue)) {
          return String(p.errorMessage || '') || 'Value does not match the required pattern';
        }
      } catch { /* invalid regex */ }
    }
    if (p.maxLength && p.maxLength > 0 && stringValue.length > p.maxLength) {
      return String(p.errorMessage || '') || `Maximum ${p.maxLength} characters allowed`;
    }
    return '';
  }, [p.pattern, p.maxLength, p.errorMessage]);

  const {
    isDisabled,
    isDisabledInPreview,
    isReadOnly,
    isRequired,
    currentValue,
    setLocalValue,
    validationError,
    validateOnChange,
    sizeVariant,
    finalOpacity,
    helpText,
    labelText,
    boxShadowValue,
    errorMessageValue,
    pointerEventsStyle,
    focusBlurRefs,
    eventHandlers,
    ariaDescribedBy,
  } = useFormField({
    component,
    mode,
    dataStore,
    onUpdateDataStore,
    evaluationScope,
    actions,
    validate: validateTextarea,
  });

  // Cascading text styles: use inherited values as fallbacks for font properties
  const inherited = useInheritedStyles();

  // Evaluate typography / color props (component-specific styling)
  const effectiveFontSize = p.fontSize || inherited.textFontSize;
  const fontSize = useJavaScriptRenderer(effectiveFontSize, evaluationScope, 14);
  const effectiveFontFamily = p.fontFamily || inherited.textFontFamily;
  const fontFamily = useJavaScriptRenderer(effectiveFontFamily, evaluationScope, undefined);
  const fontWeight = useJavaScriptRenderer(p.fontWeight, evaluationScope, 'normal');
  const fontStyle = p.fontStyle || 'normal';
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff');

  // Evaluate border props (component-specific styling)
  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');

  const style: React.CSSProperties = {
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: p.borderStyle,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    textAlign: p.textAlign || 'left',
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    fontFamily: fontFamily || undefined,
    fontWeight,
    fontStyle,
    color,
    backgroundColor,
    resize: (p.resize || 'vertical') as React.CSSProperties['resize'],
    pointerEvents: (mode === 'edit' && isDisabled ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
  };

  // Auto-grow support: adjust textarea height based on content
  useEffect(() => {
    if (p.autoGrow && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentValue, p.autoGrow]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isReadOnly) return;
    const newValue = e.target.value;

    if (mode === 'preview') {
      setLocalValue(newValue);
      if (onUpdateDataStore) {
        onUpdateDataStore(component.id, newValue);
      }
      validateOnChange(newValue);
    }

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

  const themeColors = evaluationScope?.theme?.colors;

  return (
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
      textColor={themeColors?.text}
      errorColor={themeColors?.error}
    >
      <textarea
        id={component.id}
        ref={textareaRef}
        placeholder={p.placeholder}
        value={currentValue}
        rows={p.rows || 4}
        onChange={mode === 'edit' ? () => {} : handleChange}
        readOnly={mode === 'edit' || (mode === 'preview' && isReadOnly)}
        onFocus={mode === 'preview' ? eventHandlers.handleFocus : undefined}
        onBlur={mode === 'preview' ? eventHandlers.handleBlur : undefined}
        onKeyDown={mode === 'preview' ? eventHandlers.handleKeyDown : undefined}
        style={style}
        className={`w-full h-full p-2 focus:outline-none theme-focus`}
        disabled={isDisabledInPreview}
        aria-disabled={isDisabledInPreview}
        aria-readonly={(mode === 'preview' && isReadOnly) || undefined}
        aria-invalid={validationError ? 'true' : undefined}
        aria-required={isRequired || undefined}
        aria-describedby={ariaDescribedBy || undefined}
        aria-label={p.accessibilityLabel || p.placeholder}
      />
    </FormFieldWrapper>
  );
};

export const TextareaPlugin: ComponentPlugin = {
  type: ComponentType.TEXTAREA,
  paletteConfig: {
    label: 'Textarea',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 6H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 10H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 14H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 18H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonInputStylingProps,
      label: '',
      placeholder: 'Enter long text...',
      accessibilityLabel: 'Text area for long text',
      width: '100%',
      height: 'auto',
      disabled: false,
      validationTiming: 'onBlur',
      readOnly: false,
      size: 'md',
      helpText: '',
      rows: 4,
      resize: 'vertical',
      showCharacterCount: false,
      autoGrow: false,
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
    },
  },
  renderer: TextareaRenderer,
  properties: () => null,
};
