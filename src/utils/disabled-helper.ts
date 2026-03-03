import { safeEval } from '../expressions/engine';

/**
 * Properly evaluates a disabled value to a boolean.
 * Only returns true if the value is explicitly true (boolean) or evaluates to true.
 * Handles:
 * - boolean values: true → true, false → false
 * - string values: "true" → true, "false" → false, "{{ expression }}" → evaluated
 * - expressions: evaluates and converts result to boolean
 * 
 * @param value - The disabled value (boolean, string, or expression)
 * @param evaluationScope - The evaluation scope for expressions
 * @returns true only if the value explicitly indicates disabled, false otherwise
 */
export function evaluateDisabled(
  value: boolean | string | undefined,
  evaluationScope: Record<string, any>
): boolean {
  // If undefined, not disabled
  if (value === undefined) {
    return false;
  }

  // If it's already a boolean, return it
  if (typeof value === 'boolean') {
    return value;
  }

  // If it's a string, check if it's an expression or a literal string
  if (typeof value === 'string') {
    // Handle pure expression: "{{ ... }}"
    if (value.startsWith('{{') && value.endsWith('}}')) {
      const expression = value.substring(2, value.length - 2).trim();
      if (!expression) {
        return false;
      }
      const evaluated = safeEval(expression, evaluationScope);
      // Convert evaluated result to boolean
      return Boolean(evaluated);
    }

    // Handle literal string values: "true", "false"
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === 'true') {
      return true;
    }
    if (lowerValue === 'false') {
      return false;
    }

    // For any other string (including empty string), treat as not disabled
    return false;
  }

  // Fallback: convert to boolean
  return Boolean(value);
}

/**
 * Properly evaluates a hidden value to a boolean.
 * Only returns true if the value is explicitly true (boolean) or evaluates to true.
 * Handles:
 * - boolean values: true → true, false → false
 * - string values: "true" → true, "false" → false, "{{ expression }}" → evaluated
 * - expressions: evaluates and converts result to boolean
 * 
 * @param value - The hidden value (boolean, string, or expression)
 * @param evaluationScope - The evaluation scope for expressions
 * @returns true only if the value explicitly indicates hidden, false otherwise
 */
export function evaluateHidden(
  value: boolean | string | undefined,
  evaluationScope: Record<string, any>
): boolean {
  // If undefined, not hidden
  if (value === undefined) {
    return false;
  }

  // If it's already a boolean, return it
  if (typeof value === 'boolean') {
    return value;
  }

  // If it's a string, check if it's an expression or a literal string
  if (typeof value === 'string') {
    // Handle pure expression: "{{ ... }}"
    if (value.startsWith('{{') && value.endsWith('}}')) {
      const expression = value.substring(2, value.length - 2).trim();
      if (!expression) {
        return false;
      }
      const evaluated = safeEval(expression, evaluationScope);
      // Convert evaluated result to boolean
      return Boolean(evaluated);
    }

    // Handle literal string values: "true", "false"
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === 'true') {
      return true;
    }
    if (lowerValue === 'false') {
      return false;
    }

    // For any other string (including empty string), treat as not hidden
    return false;
  }

  // Fallback: only true if explicitly true
  return value === true;
}

