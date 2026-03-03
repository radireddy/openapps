import { useState, useCallback } from 'react';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { formSizeVariants } from '../../constants';
import { safeEval } from '../../expressions/engine';

/**
 * Coerce a value (often from useJavaScriptRenderer) to a boolean.
 * Handles string "true"/"1" as truthy, everything else follows JS truthiness.
 */
export function coerceToBoolean(value: unknown): boolean {
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1';
  }
  return !!value;
}

/**
 * Parse an opacity value, returning 0.6 if the component is disabled.
 * Accepts numbers, numeric strings, or falls back to 1.
 */
export function parseOpacity(opacityValue: unknown, isDisabled: boolean): number {
  if (isDisabled) return 0.6;
  if (typeof opacityValue === 'number') return opacityValue;
  if (typeof opacityValue === 'string' && opacityValue.trim()) {
    return parseFloat(opacityValue) || 1;
  }
  return 1;
}

/**
 * Evaluate a user-defined custom validator expression.
 * The expression receives `value` and `dataStore` in scope.
 * Should return an error string or '' for valid.
 */
export function evaluateCustomValidator(
  expression: string | undefined,
  value: any,
  evaluationScope: Record<string, any>
): string {
  if (!expression || typeof expression !== 'string') return '';
  try {
    const expr = expression.startsWith('{{') && expression.endsWith('}}')
      ? expression.substring(2, expression.length - 2).trim()
      : expression;
    if (!expr) return '';
    const result = safeEval(expr, { ...evaluationScope, value });
    return typeof result === 'string' ? result : '';
  } catch {
    return '';
  }
}


/**
 * Hook that resolves size variant to concrete style values
 */
export function useSizeVariant(
  size: 'sm' | 'md' | 'lg' | undefined,
  evaluationScope: Record<string, any>
): { fontSize: string; padding: string; height: number } {
  const variant = formSizeVariants[size || 'md'];
  const fontSize = useJavaScriptRenderer(variant.fontSize, evaluationScope, '14px');
  const padding = useJavaScriptRenderer(variant.padding, evaluationScope, '8px');
  return {
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : String(fontSize),
    padding: String(padding),
    height: variant.height,
  };
}

/**
 * Hook encapsulating validation state and timing logic
 */
export function useFormValidation(
  validationTiming: 'onBlur' | 'onChange' | 'onSubmit' | undefined,
  validateFn: (value: any) => string
) {
  const [validationError, setValidationError] = useState<string>('');
  const [hasBlurred, setHasBlurred] = useState(false);
  const timing = validationTiming || 'onBlur';

  const validateOnBlur = useCallback(
    (value: any) => {
      setHasBlurred(true);
      if (timing === 'onBlur' || timing === 'onChange') {
        const error = validateFn(value);
        setValidationError(error);
      }
    },
    [timing, validateFn]
  );

  const validateOnChange = useCallback(
    (value: any) => {
      if (timing === 'onChange') {
        const error = validateFn(value);
        setValidationError(error);
      } else if (timing === 'onBlur' && hasBlurred) {
        const error = validateFn(value);
        setValidationError(error);
      }
    },
    [timing, hasBlurred, validateFn]
  );

  /**
   * Force-validate regardless of timing or blur state.
   * Used by form submit to show all errors immediately.
   * Returns the error string (or '') for the caller to check.
   */
  const forceValidate = useCallback(
    (value: any): string => {
      setHasBlurred(true);
      const error = validateFn(value);
      setValidationError(error);
      return error;
    },
    [validateFn]
  );

  return {
    validationError,
    setValidationError,
    hasBlurred,
    setHasBlurred,
    validateOnBlur,
    validateOnChange,
    forceValidate,
  };
}
