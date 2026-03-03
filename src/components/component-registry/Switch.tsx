import React, { useRef } from 'react';
import { ComponentType, SwitchProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const SwitchRenderer: React.FC<{
  component: { id: string; props: SwitchProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const switchRef = useRef<HTMLButtonElement>(null);

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

  // Switch size mappings
  const switchSizes = {
    sm: { track: 'h-5 w-9', knob: 'w-3 h-3', translateOn: 'translate-x-4', translateOff: 'translate-x-1' },
    md: { track: 'h-6 w-11', knob: 'w-4 h-4', translateOn: 'translate-x-6', translateOff: 'translate-x-1' },
    lg: { track: 'h-7 w-14', knob: 'w-5 h-5', translateOn: 'translate-x-8', translateOff: 'translate-x-1' },
  };
  const switchSize = switchSizes[p.size || 'md'];

  const handleClick = () => {
    if (mode === 'preview' && isReadOnly) return;

    const newValue = !isChecked;

    if (mode === 'preview') {
      setIsChecked(newValue);
      if (onUpdateDataStore) onUpdateDataStore(component.id, newValue);
    }

    focusBlurRefs.lastClickTimeRef.current = Date.now();
    validateOnChange(newValue);

    handleChangeEvent(
      p,
      { mode, evaluationScope, actions, onUpdateDataStore },
      { target: { value: newValue, checked: newValue } } as any,
      newValue
    );
  };

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const primaryColor = themeColors?.primary || '#4f46e5';

  // Evaluate track colors from props (which default to theme expressions)
  const trackColorOn = useJavaScriptRenderer(p.trackColor, evaluationScope, primaryColor);
  const trackColorOff = useJavaScriptRenderer(p.trackColorOff, evaluationScope, themeColors?.disabled || '#d1d5db');

  return (
    <FormFieldWrapper componentId={component.id} mode={mode} helpText={helpText} errorMessage={validationError} textColor={themeTextColor} errorColor={themeColors?.error}>
      <div className="flex items-center w-full h-full" style={{ ...pointerEventsStyle, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }}>
        <label id={`${component.id}-label`} className={`mr-3 flex-shrink-0 ${isDisabledInPreview ? 'pointer-events-none' : ''}`} style={{ color: themeTextColor || '#1f2937' }}>{p.label}{isRequired && <span style={{color: themeColors?.error || '#dc2626'}}> *</span>}</label>
        <button
          type="button"
          role="switch"
          ref={switchRef}
          aria-checked={isChecked}
          aria-labelledby={`${component.id}-label`}
          aria-disabled={isDisabledInPreview}
          aria-required={isRequired}
          onClick={mode === 'preview' ? handleClick : undefined}
          onFocus={mode === 'preview' ? eventHandlers.handleFocus : undefined}
          onBlur={mode === 'preview' ? eventHandlers.handleBlur : undefined}
          onKeyDown={mode === 'preview' ? eventHandlers.handleKeyDown : undefined}
          className={`relative inline-flex items-center ${switchSize.track} rounded-full transition-colors theme-focus ${isDisabledInPreview ? 'pointer-events-none' : ''}`}
          style={{ backgroundColor: isChecked ? String(trackColorOn) : String(trackColorOff) }}
          disabled={isDisabledInPreview}
        >
          {p.onLabel && (
            <span style={{ position: 'absolute', left: '6px', fontSize: '9px', fontWeight: 600, color: themeColors?.onPrimary || 'white', opacity: isChecked ? 1 : 0, transition: 'opacity 0.15s' }}>{p.onLabel}</span>
          )}
          {p.offLabel && (
            <span style={{ position: 'absolute', right: '6px', fontSize: '9px', fontWeight: 600, color: themeTextColor ? `${themeTextColor}80` : '#6b7280', opacity: isChecked ? 0 : 1, transition: 'opacity 0.15s' }}>{p.offLabel}</span>
          )}
          <span className={`${isChecked ? switchSize.translateOn : switchSize.translateOff} inline-block ${switchSize.knob} transform rounded-full transition-transform`} style={{ backgroundColor: themeColors?.surface || '#fff' }} aria-hidden="true"/>
        </button>
      </div>
    </FormFieldWrapper>
  );
};

export const SwitchPlugin: ComponentPlugin = {
  type: ComponentType.SWITCH,
  paletteConfig: {
    label: 'Switch',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg"}, React.createElement('rect', {x:"4", y:"9", width:"16", height:"6", rx:"3", stroke:"currentColor", strokeWidth:"2"}), React.createElement('circle', {cx:"10", cy:"12", r:"2", stroke:"currentColor", strokeWidth:"2"})),
    defaultProps: {
      label: 'Enable Feature',
      width: '100%',
      height: 'auto',
      disabled: false,
      trackColor: '{{theme.colors.primary}}',
      trackColorOff: '{{theme.colors.disabled}}',
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
      validationTiming: 'onBlur',
      readOnly: false,
      size: 'md',
      helpText: '',
      onLabel: '',
      offLabel: '',
    },
  },
  renderer: SwitchRenderer,
  properties: () => null,
};
