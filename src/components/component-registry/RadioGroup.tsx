import React, { useRef } from 'react';
import { ComponentType, RadioGroupProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const RadioGroupRenderer: React.FC<{
  component: { id: string; props: RadioGroupProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const options = p.options.split(',').map(opt => opt.trim());
  const radioRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const {
    isDisabledInPreview,
    isReadOnly,
    isRequired,
    currentValue: selectedValue,
    setLocalValue: setSelectedValue,
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
  });

  // Determine radio size class based on size prop
  const radioSizeClass = (() => {
    switch (p.size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  })();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === 'preview' && isReadOnly) return;

    const newValue = e.target.value;

    if (mode === 'preview') {
      setSelectedValue(newValue);
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

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const accentColor = useJavaScriptRenderer(p.accentColor, evaluationScope, themeColors?.primary || '#4f46e5');

  return (
    <FormFieldWrapper
      componentId={component.id}
      mode={mode}
      helpText={helpText ? String(helpText) : undefined}
      errorMessage={validationError || undefined}
      textColor={themeTextColor}
      errorColor={themeColors?.error}
    >
      <fieldset
          className="w-full h-full flex flex-col p-2 border-0"
          style={{ ...pointerEventsStyle, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }}
          disabled={isDisabledInPreview}
          aria-disabled={isDisabledInPreview}
      >
        {p.groupLabel && (
          <legend className="text-sm font-medium mb-2 px-0 block w-full" style={{ color: themeTextColor || '#374151' }}>
            {p.groupLabel}{isRequired && <span style={{color: themeColors?.error || '#dc2626'}}> *</span>}
          </legend>
        )}
        <div className={p.layout === 'horizontal' ? 'flex flex-row gap-4 flex-wrap' : 'flex flex-col'}>
          {options.map(option => (
            <div key={option} className="flex items-center mb-2">
              <input
                type="radio"
                id={`${component.id}-${option}`}
                name={component.id}
                value={option}
                checked={selectedValue === option}
                onChange={mode === 'preview' ? handleChange : () => {}}
                onFocus={mode === 'preview' ? eventHandlers.handleFocus : undefined}
                onBlur={mode === 'preview' ? eventHandlers.handleBlur : undefined}
                onKeyDown={mode === 'preview' ? eventHandlers.handleKeyDown : undefined}
                ref={(el) => { radioRefs.current[option] = el; }}
                className={`mr-2 ${radioSizeClass} theme-focus ${isDisabledInPreview ? 'pointer-events-none' : ''}`}
                style={{ accentColor: String(accentColor) }}
                disabled={isDisabledInPreview}
                aria-required={isRequired || undefined}
              />
              <label htmlFor={`${component.id}-${option}`} className={`${isDisabledInPreview ? 'pointer-events-none' : ''}`} style={{ color: themeTextColor || '#1f2937' }}>{option}</label>
            </div>
          ))}
        </div>
      </fieldset>
    </FormFieldWrapper>
  );
};

export const RadioGroupPlugin: ComponentPlugin = {
  type: ComponentType.RADIO_GROUP,
  paletteConfig: {
    label: 'Radio Group',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg"}, React.createElement('path', {d:"M12 16a4 4 0 100-8 4 4 0 000 8z", stroke:"currentColor", strokeWidth:"2"}), React.createElement('path', {d:"M12 4v2m0 12v2m8-10h-2M6 12H4", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round"})),
    defaultProps: {
      options: 'Option 1,Option 2',
      groupLabel: 'Choose an option',
      width: '100%',
      height: 'auto',
      disabled: false,
      accentColor: '{{theme.colors.primary}}',
      validationTiming: 'onBlur',
      readOnly: false,
      size: 'md',
      helpText: '',
      layout: 'vertical',
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
    },
  },
  renderer: RadioGroupRenderer,
  properties: () => null,
};
