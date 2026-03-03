/**
 * Form Component
 *
 * A scoped form container that collects and validates only its child form fields.
 * Wraps children in a semantic <form> element with noValidate for custom validation.
 * Supports: formId scoping, onSubmit handler, resetOnSubmit, showValidationSummary,
 * labelPlacement context, and configurable spacing.
 */

import React, { useCallback, useMemo } from 'react';
import { ComponentType, FormProps, ComponentRendererProps } from '../../types';
import { createBaseContainerRenderer } from './base-container';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { useRuntimeStore } from '../../stores/runtimeStore';
import { FormContextProvider } from './FormContext';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };
const EMPTY_ERRORS: string[] = [];

// We don't bake onSubmit into the static wrapperProps because it needs to be dynamic.
// Instead, we use the onSubmitCapture pattern on a parent wrapper.
const BaseRenderer = createBaseContainerRenderer({
  wrapperElement: 'form',
  wrapperProps: { noValidate: true },
});

/** Validation summary banner displayed above form fields when errors exist */
const ValidationSummary: React.FC<{ errors: string[] }> = ({ errors }) => {
  if (errors.length === 0) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        padding: '12px 16px',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: errors.length > 1 ? '8px' : 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.5" />
          <path d="M8 4.5v4" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.75" fill="#dc2626" />
        </svg>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>
          {errors.length === 1 ? '1 validation error' : `${errors.length} validation errors`}
        </span>
      </div>
      {errors.length > 1 && (
        <ul style={{ margin: 0, paddingLeft: '32px', listStyleType: 'disc' }}>
          {errors.map((error, i) => (
            <li key={i} style={{ fontSize: '12px', color: '#b91c1c', lineHeight: 1.5 }}>
              {error}
            </li>
          ))}
        </ul>
      )}
      {errors.length === 1 && (
        <span style={{ fontSize: '12px', color: '#b91c1c', marginLeft: '24px' }}>
          {errors[0]}
        </span>
      )}
    </div>
  );
};

const FormRenderer: React.FC<ComponentRendererProps> = ({
  component,
  children,
  mode,
  actions,
  evaluationScope,
}) => {
  const p = component.props as FormProps;
  const formId = useJavaScriptRenderer(p.formId, evaluationScope || {}, component.id);
  const spacing = p.spacing || 'normal';
  const labelPlacement = p.labelPlacement || 'top';

  // Read form-level validation errors from runtime store
  // Fallback to module-level stable empty array to avoid infinite re-renders
  const formErrors = useRuntimeStore(s => s.formState.formErrors[component.id]) || EMPTY_ERRORS;

  const spacingGap = useMemo(() => {
    switch (spacing) {
      case 'compact': return '8px';
      case 'spacious': return '24px';
      default: return '16px';
    }
  }, [spacing]);

  // Handle native <form> submit event (e.g. Enter key in text fields)
  const handleNativeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'preview' || !actions?.submitForm) return;
    // Trigger submit scoped to this form — pass component.id as triggerComponentId
    // The submitForm handler will detect this Form as the ancestor
    actions.submitForm(undefined, evaluationScope || {}, undefined, component.id);
  }, [mode, actions, evaluationScope, component.id]);

  // Override gap based on spacing prop
  const formComponent = useMemo(() => ({
    ...component,
    props: {
      ...component.props,
      gap: spacingGap,
      flexDirection: 'column' as const,
    },
  }), [component, spacingGap]);

  // Form context value for labelPlacement propagation to child FormFieldWrappers
  const formContextValue = useMemo(() => ({
    labelPlacement,
  }), [labelPlacement]);

  const showValidationSummary = p.showValidationSummary && mode === 'preview';

  // Use onSubmitCapture on wrapper to intercept the native form submit event
  // (e.g. pressing Enter in a text field) before it reaches the <form> element
  return (
    <FormContextProvider value={formContextValue}>
      <div
        onSubmitCapture={mode === 'preview' ? handleNativeSubmit : undefined}
        style={{ display: 'contents' }}
      >
        <BaseRenderer
          component={formComponent as any}
          mode={mode || 'edit'}
          actions={actions}
          evaluationScope={evaluationScope || {}}
        >
          {showValidationSummary && <ValidationSummary errors={formErrors} />}
          {children}
        </BaseRenderer>
      </div>
    </FormContextProvider>
  );
};

export const FormPlugin = {
  type: ComponentType.FORM,
  isContainer: true,
  paletteConfig: {
    label: 'Form',
    icon: React.createElement('svg', {
      style: iconStyle,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    },
      React.createElement('rect', {
        x: '3', y: '3', width: '18', height: '18', rx: '2',
        stroke: 'currentColor', strokeWidth: '2',
      }),
      React.createElement('line', {
        x1: '7', y1: '8', x2: '17', y2: '8',
        stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round',
      }),
      React.createElement('line', {
        x1: '7', y1: '12', x2: '17', y2: '12',
        stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round',
      }),
      React.createElement('line', {
        x1: '7', y1: '16', x2: '13', y2: '16',
        stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round',
      }),
    ),
    defaultProps: {
      width: '100%',
      height: 'auto',
      minHeight: 60,
      backgroundColor: '{{theme.colors.surface}}',
      borderWidth: '{{theme.border.width}}',
      borderColor: '{{theme.colors.border}}',
      borderRadius: '{{theme.radius.default}}',
      padding: '{{theme.spacing.md}}',
      flexDirection: 'column',
      flexWrap: 'nowrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      gap: '16px',
      formId: '',
      onSubmit: '',
      resetOnSubmit: false,
      showValidationSummary: false,
      spacing: 'normal',
      labelPlacement: 'top',
    },
  },
  renderer: FormRenderer,
  properties: () => null,
};
