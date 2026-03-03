import React from 'react';
import { InputActionType, CheckboxProps, RadioGroupProps, SelectProps, SwitchProps, TextareaProps, InputProps } from '../../../types';
import { PropertyGroup, PropertyMetadata, PropertyContext } from '../metadata';
import { PropFxInput, PropSelect } from '../../component-registry/common';

const actionOptions = [
  { value: 'none', label: 'None' },
  { value: 'alert', label: 'Alert' },
  { value: 'executeCode', label: 'Execute Code' },
];

export const SharedEventsGroupRenderer: React.FC<{
  group: PropertyGroup;
  properties: PropertyMetadata[];
  context: PropertyContext;
  onUpdate: (propertyId: string, value: any) => void;
  onOpenExpressionEditor?: (
    initialValue: string, 
    onSave: (newValue: string) => void,
    propertyContext?: {
      propertyId?: string;
      propertyLabel?: string;
      propertyType?: string;
      componentType?: string;
      tab?: string;
      group?: string;
    }
  ) => void;
  getValue: (propertyId: string) => any;
  getError: (propertyId: string) => string | undefined;
  isMixed: (propertyId: string) => boolean;
}> = ({ properties, context, onUpdate, onOpenExpressionEditor, getValue, getError, isMixed }) => {
  const component = context.component;
  const componentProps = component?.props as InputProps | CheckboxProps | RadioGroupProps | SelectProps | SwitchProps | TextareaProps | undefined;
  const onChangeActionType = (componentProps && 'onChangeActionType' in componentProps) ? componentProps.onChangeActionType : 'none';
  const onFocusActionType = (componentProps && 'onFocusActionType' in componentProps) ? componentProps.onFocusActionType : 'none';
  const onBlurActionType = (componentProps && 'onBlurActionType' in componentProps) ? componentProps.onBlurActionType : 'none';
  const onEnterActionType = (componentProps && 'onEnterActionType' in componentProps) ? componentProps.onEnterActionType : 'none';

  // Filter and organize properties by event type
  const onChangeProps = properties.filter(p => 
    ['onChangeActionType', 'onChangeAlertMessage', 'onChangeCodeToExecute'].includes(p.id)
  );
  const onFocusProps = properties.filter(p => 
    ['onFocusActionType', 'onFocusAlertMessage', 'onFocusCodeToExecute'].includes(p.id)
  );
  const onBlurProps = properties.filter(p => 
    ['onBlurActionType', 'onBlurAlertMessage', 'onBlurCodeToExecute'].includes(p.id)
  );
  const onEnterProps = properties.filter(p => 
    ['onEnterActionType', 'onEnterAlertMessage', 'onEnterCodeToExecute'].includes(p.id)
  );

  // Sort properties by propertyOrder
  const sortProps = (props: PropertyMetadata[]) => 
    [...props].sort((a, b) => (a.propertyOrder ?? 999) - (b.propertyOrder ?? 999));

  // Render property using the same components as General/Styles tabs
  const renderProperty = (prop: PropertyMetadata) => {
    const value = getValue(prop.id);
    const error = getError(prop.id);
    const mixed = isMixed(prop.id);
    const displayValue = mixed ? '— Mixed —' : (value ?? prop.defaultValue ?? '');

    switch (prop.type) {
      case 'string':
      case 'expression':
      case 'code':
        const supportsExpression = prop.supportsExpression ?? (prop.type === 'expression' || prop.type === 'code');
        const isExpression = typeof value === 'string' && value.startsWith('{{');
        
        return (
          <PropFxInput
            key={prop.id}
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type={prop.type === 'expression' || prop.type === 'code' ? 'text' : undefined}
            placeholder={prop.placeholder}
            onOpenEditor={supportsExpression && onOpenExpressionEditor ? (val) => {
              const currentValue = isExpression ? String(value || '') : String(value || '');
              const component = context.component;
              onOpenExpressionEditor(
                currentValue, 
                (newVal) => onUpdate(prop.id, newVal),
                {
                  propertyId: prop.id,
                  propertyLabel: prop.label,
                  propertyType: prop.type,
                  componentType: component?.type,
                  tab: 'Events',
                  group: 'Events'
                }
              );
            } : undefined}
            propertyKey={prop.id}
            className="mb-2.5"
          />
        );

      case 'dropdown':
        const options = prop.options
          ? (typeof prop.options === 'function' ? prop.options(context) : prop.options)
          : actionOptions; // Default to action options for action type selects
        
        return (
          <PropSelect
            key={prop.id}
            label={prop.label}
            value={mixed ? '' : (value ?? prop.defaultValue ?? (options[0]?.value || 'none'))}
            onChange={(val) => onUpdate(prop.id, val)}
            options={options.map((opt: any) => ({ 
              value: opt.value || opt, 
              label: opt.label || opt 
            }))}
            className="mb-2.5"
          />
        );

      default:
        return null;
    }
  };

  // Render properties in the same style as General tab (no custom headings, just dividers)
  const elements: React.ReactNode[] = [];

  // On Change section header
  if (onChangeProps.length > 0) {
    elements.push(
      <h5 key="onChange-header" className="text-xs font-semibold text-ed-text-secondary mb-2">On Change</h5>
    );
  }

  // On Change properties
  sortProps(onChangeProps).forEach((prop) => {
    // Only show onChangeCodeToExecute if executeCode is selected
    if (prop.id === 'onChangeCodeToExecute' && onChangeActionType !== 'executeCode') {
      return;
    }
    // Only show onChangeAlertMessage if alert is selected
    if (prop.id === 'onChangeAlertMessage' && onChangeActionType !== 'alert') {
      return;
    }
    const rendered = renderProperty(prop);
    if (rendered) {
      elements.push(rendered);
    }
  });

  // Divider before On Focus
  if (onFocusProps.length > 0 && elements.length > 0) {
    elements.push(<div key="divider-1" className="border-t border-ed-border my-2"></div>);
  }

  // On Focus section header
  if (onFocusProps.length > 0) {
    elements.push(
      <h5 key="onFocus-header" className="text-xs font-semibold text-ed-text-secondary mb-2">On Focus</h5>
    );
  }

  // On Focus properties
  sortProps(onFocusProps).forEach((prop) => {
    // Only show onFocusCodeToExecute if executeCode is selected
    if (prop.id === 'onFocusCodeToExecute' && onFocusActionType !== 'executeCode') {
      return;
    }
    // Only show onFocusAlertMessage if alert is selected
    if (prop.id === 'onFocusAlertMessage' && onFocusActionType !== 'alert') {
      return;
    }
    const rendered = renderProperty(prop);
    if (rendered) {
      elements.push(rendered);
    }
  });

  // Divider before On Blur
  if (onBlurProps.length > 0 && elements.length > 0) {
    elements.push(<div key="divider-2" className="border-t border-ed-border my-2"></div>);
  }

  // On Blur section header
  if (onBlurProps.length > 0) {
    elements.push(
      <h5 key="onBlur-header" className="text-xs font-semibold text-ed-text-secondary mb-2">On Blur</h5>
    );
  }

  // On Blur properties
  sortProps(onBlurProps).forEach((prop) => {
    // Only show onBlurCodeToExecute if executeCode is selected
    if (prop.id === 'onBlurCodeToExecute' && onBlurActionType !== 'executeCode') {
      return;
    }
    // Only show onBlurAlertMessage if alert is selected
    if (prop.id === 'onBlurAlertMessage' && onBlurActionType !== 'alert') {
      return;
    }
    const rendered = renderProperty(prop);
    if (rendered) {
      elements.push(rendered);
    }
  });

  // Divider before On Enter Key Press
  if (onEnterProps.length > 0 && elements.length > 0) {
    elements.push(<div key="divider-3" className="border-t border-ed-border my-2"></div>);
  }

  // On Enter section header
  if (onEnterProps.length > 0) {
    elements.push(
      <h5 key="onEnter-header" className="text-xs font-semibold text-ed-text-secondary mb-2">On Enter Key Press</h5>
    );
  }

  // On Enter properties
  sortProps(onEnterProps).forEach((prop) => {
    // Only show onEnterCodeToExecute if executeCode is selected
    if (prop.id === 'onEnterCodeToExecute' && onEnterActionType !== 'executeCode') {
      return;
    }
    // Only show onEnterAlertMessage if alert is selected
    if (prop.id === 'onEnterAlertMessage' && onEnterActionType !== 'alert') {
      return;
    }
    const rendered = renderProperty(prop);
    if (rendered) {
      elements.push(rendered);
    }
  });

  return <div className="space-y-4">{elements}</div>;
};

