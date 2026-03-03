import React from 'react';
import { useFormContext } from './FormContext';

interface FormFieldWrapperProps {
  componentId: string;
  mode: 'edit' | 'preview';
  label?: string;
  required?: boolean;
  helpText?: string;
  errorMessage?: string;
  showCharacterCount?: boolean;
  currentLength?: number;
  maxLength?: number;
  /** Theme text color for labels and secondary text */
  textColor?: string;
  /** Theme error/danger color */
  errorColor?: string;
  children: React.ReactNode;
}

/**
 * Shared wrapper for form components that renders labels, help text, error messages,
 * and character count around the form control.
 * Labels are rendered in both edit and preview modes so designers see them on canvas.
 * Help text / error messages are only shown in preview mode.
 */
const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  componentId,
  mode,
  label,
  required,
  helpText,
  errorMessage,
  showCharacterCount,
  currentLength = 0,
  maxLength,
  textColor,
  errorColor,
  children,
}) => {
  const formContext = useFormContext();
  const labelPlacement = formContext?.labelPlacement || 'top';
  const isLeftLabel = labelPlacement === 'left';

  const labelColor = textColor || '#374151';
  const mutedColor = textColor ? `${textColor}99` : 'rgba(107, 114, 128, 0.8)';
  const errColor = errorColor || '#dc2626';
  const showLabel = label && label.trim() !== '';
  const showHelp = mode === 'preview' && helpText;
  const showError = mode === 'preview' && errorMessage;
  const showCount = mode === 'preview' && showCharacterCount && maxLength && maxLength > 0;
  const hasFooter = showHelp || showError || showCount;

  // In edit mode, if there's no label, render children directly (no footer needed).
  if (!showLabel && mode === 'edit') {
    return <>{children}</>;
  }

  const labelElement = showLabel ? (
    <label
      htmlFor={componentId}
      style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: labelColor,
        marginBottom: isLeftLabel ? 0 : '4px',
        marginRight: isLeftLabel ? '12px' : 0,
        lineHeight: 1.2,
        minWidth: isLeftLabel ? '120px' : undefined,
        flexShrink: isLeftLabel ? 0 : undefined,
        paddingTop: isLeftLabel ? '8px' : undefined,
      }}
    >
      {label}
      {required && (
        <span style={{ color: errColor, marginLeft: '2px' }} aria-hidden="true">*</span>
      )}
    </label>
  ) : null;

  const footerElement = hasFooter ? (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1,
      marginLeft: isLeftLabel && showLabel ? '132px' : undefined,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {showError && (
          <div
            id={`${componentId}-error`}
            role="alert"
            aria-live="polite"
            style={{
              fontSize: '12px',
              lineHeight: 1.3,
              color: errColor,
            }}
          >
            {errorMessage}
          </div>
        )}
        {!showError && showHelp && (
          <div
            id={`${componentId}-help`}
            style={{
              fontSize: '12px',
              lineHeight: 1.3,
              color: mutedColor,
            }}
          >
            {helpText}
          </div>
        )}
      </div>
      {showCount && (
        <div style={{ fontSize: '11px', color: mutedColor, marginLeft: '8px', flexShrink: 0 }}>
          {currentLength}/{maxLength}
        </div>
      )}
    </div>
  ) : null;

  // In preview mode, ALWAYS render the stable div wrapper so that the DOM structure
  // doesn't change when validation errors appear/disappear. Switching between a Fragment
  // and a <div> causes React to unmount/remount children, which clears uncontrolled
  // input values and loses focus.
  if (isLeftLabel && showLabel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
          {labelElement}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {children}
          </div>
        </div>
        {footerElement}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {labelElement}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {children}
      </div>
      {footerElement}
    </div>
  );
};

export default FormFieldWrapper;
