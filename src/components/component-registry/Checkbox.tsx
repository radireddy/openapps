import React, { useEffect, useRef } from 'react';
import { ComponentType, CheckboxProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import { coerceToBoolean } from './form-utils';
import FormFieldWrapper from './FormFieldWrapper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const CheckboxRenderer: React.FC<{
  component: { id: string; props: CheckboxProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const checkboxRef = useRef<HTMLInputElement>(null);

  const {
    isDisabled,
    isDisabledInPreview,
    isReadOnly,
    isRequired,
    currentValue: isChecked,
    setLocalValue: setIsChecked,
    validationError,
    validateOnChange,
    finalOpacity,
    helpText,
    boxShadowValue,
    pointerEventsStyle,
    focusBlurRefs,
    eventHandlers,
  } = useFormField({
    component,
    mode,
    dataStore,
    onUpdateDataStore,
    evaluationScope,
    actions,
    valueType: 'boolean',
  });

  // Evaluate description and indeterminate (component-specific props)
  const descriptionValue = useJavaScriptRenderer(p.description, evaluationScope, '');
  const indeterminateValue = useJavaScriptRenderer(p.indeterminate, evaluationScope, false);

  // Checkbox size class
  const checkboxSizeClass = (() => {
    switch (p.size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      case 'md':
      default: return 'h-4 w-4';
    }
  })();

  // Indeterminate effect
  useEffect(() => {
    if (checkboxRef.current) {
      const isIndeterminate = coerceToBoolean(indeterminateValue);
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [indeterminateValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // When readOnly in preview mode, prevent changes but still allow focus
    if (mode === 'preview' && isReadOnly) {
      return;
    }

    const newValue = e.target.checked;

    // Update local state for interactivity
    if (mode === 'preview') {
      setIsChecked(newValue);
      // Also update dataStore using component ID as key
      if (onUpdateDataStore) {
        onUpdateDataStore(component.id, newValue);
      }
    }

    // Record click time to prevent focus/blur from firing during click
    focusBlurRefs.lastClickTimeRef.current = Date.now();

    // Validate on change
    validateOnChange(newValue);

    // Use shared event handler with custom event object for checkbox
    const customEvent = {
      ...e,
      target: { ...e.target, value: newValue, checked: newValue },
    } as React.ChangeEvent<HTMLInputElement>;

    handleChangeEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
      },
      customEvent,
      newValue
    );
  };

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const accentColorVal = useJavaScriptRenderer(p.accentColor, evaluationScope, themeColors?.primary || '#4f46e5');

  return (
    <FormFieldWrapper
      componentId={component.id}
      mode={mode}
      helpText={String(helpText || '')}
      errorMessage={validationError}
      textColor={themeTextColor}
      errorColor={themeColors?.error}
    >
      <div className="flex items-center w-full h-full" style={{ ...pointerEventsStyle, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }}>
        <input
          type="checkbox"
          id={component.id}
          ref={checkboxRef}
          checked={isChecked}
          onChange={handleChange}
          onFocus={mode === 'preview' ? eventHandlers.handleFocus : undefined}
          onBlur={mode === 'preview' ? eventHandlers.handleBlur : undefined}
          onKeyDown={mode === 'preview' ? eventHandlers.handleKeyDown : undefined}
          className={`mr-2 ${checkboxSizeClass} rounded theme-focus ${isDisabledInPreview ? 'pointer-events-none' : ''}`}
          style={{ accentColor: String(accentColorVal) }}
          disabled={isDisabledInPreview}
          aria-disabled={isDisabledInPreview}
          aria-readonly={isReadOnly}
          aria-required={isRequired}
        />
        <div>
          <label htmlFor={component.id} className={`${isDisabledInPreview ? 'pointer-events-none' : ''} ${isDisabled ? 'opacity-60' : ''}`} style={{ color: themeTextColor || '#1f2937' }}>
            {p.label}{isRequired && <span style={{ color: themeColors?.error || '#dc2626' }}> *</span>}
          </label>
          {p.description && !(p.hideDescriptionWhenChecked && isChecked) && (
            <span style={{ display: 'block', fontSize: '11px', color: themeTextColor ? `${themeTextColor}99` : '#6b7280' }}>
              {String(descriptionValue || '')}
            </span>
          )}
        </div>
      </div>
    </FormFieldWrapper>
  );
};

export const CheckboxPlugin: ComponentPlugin = {
  type: ComponentType.CHECKBOX,
  paletteConfig: {
    label: 'Checkbox',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M9 12L11 14L15 10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), React.createElement('rect', { x: "4", y: "4", width: "16", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "2" })),
    defaultProps: {
      label: 'Accept terms',
      width: '100%',
      height: 'auto',
      opacity: 1,
      boxShadow: '',
      disabled: false,
      accentColor: '{{theme.colors.primary}}',
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
      validationTiming: 'onBlur' as const,
      readOnly: false,
      size: 'md' as const,
      helpText: '',
      description: '',
      indeterminate: false,
    },
  },
  renderer: CheckboxRenderer,
  properties: () => null,
};
