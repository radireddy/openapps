import { useMemo } from 'react';
import { safeEval } from '@/expressions/engine';

/**
 * Whether debug logging is enabled for expression evaluation.
 * Can be toggled at runtime for development/troubleshooting.
 */
let debugMode = false;

/**
 * Enable or disable debug logging for expression evaluation.
 * When enabled, every evaluation logs the expression, scope keys, and result.
 */
export function setExpressionDebug(enabled: boolean): void {
  debugMode = enabled;
}

/**
 * Returns the current debug-mode state.
 */
export function getExpressionDebug(): boolean {
  return debugMode;
}

/**
 * A React hook that evaluates a `{{ }}` expression string against a scope.
 *
 * Features:
 * - Handles pure expressions (`{{ expr }}`), template strings (`text {{ expr }} text`),
 *   and plain literal values (no `{{ }}`).
 * - Catches errors per expression so one bad expression never breaks sibling evaluations.
 * - Accepts an optional `defaultValue` returned when the expression is undefined,
 *   null, or throws an error.
 * - Supports a global debug mode (via `setExpressionDebug`) that logs every evaluation
 *   for troubleshooting.
 * - Easily mockable in tests – just mock `@/expressions/useExpressionEvaluator`.
 *
 * @param expression - The raw property value. May be `undefined`, a non-string primitive,
 *                     a pure expression like `"{{ count + 1 }}"`, or a template string
 *                     like `"Hello {{ name }}"`.
 * @param scope      - The evaluation scope (data store, variables, theme, etc.).
 * @param defaultValue - Fallback returned when the evaluated result is `undefined`
 *                       or when evaluation throws.
 * @returns The evaluated result, or `defaultValue` on error/undefined.
 */
export function useExpressionEvaluator(
  expression: string | undefined,
  scope: Record<string, any>,
  defaultValue?: any,
): any {
  return useMemo(() => {
    // Undefined / null / non-string → return defaultValue (or the raw value if non-string)
    if (expression === undefined || expression === null) {
      return defaultValue;
    }

    if (typeof expression !== 'string') {
      return expression;
    }

    try {
      const isPureExpression = expression.startsWith('{{') && expression.endsWith('}}');

      // ---- Case 1: Pure expression `{{ ... }}` ----
      if (isPureExpression) {
        const inner = expression.substring(2, expression.length - 2).trim();
        if (!inner) {
          if (debugMode) {
            console.log('[ExpressionEvaluator] Empty expression, returning default');
          }
          return defaultValue;
        }

        const result = safeEval(inner, scope);

        if (debugMode) {
          console.log('[ExpressionEvaluator]', {
            expression: inner,
            scopeKeys: Object.keys(scope),
            result,
          });
        }

        return result !== undefined ? result : defaultValue;
      }

      // ---- Case 2: Template string with embedded `{{ }}` ----
      if (expression.includes('{{') && expression.includes('}}')) {
        const processed = expression.replace(/{{\s*(.*?)\s*}}/g, (_match, expr) => {
          try {
            const result = safeEval(expr, scope);

            if (debugMode) {
              console.log('[ExpressionEvaluator] template part', {
                expression: expr,
                result,
              });
            }

            if (result === undefined || result === null) return '';
            // If safeEval returned the raw identifier string (typing-aid behaviour),
            // treat it as unresolved and replace with empty string.
            if (typeof result === 'string' && result.trim() === expr.trim()) return '';
            return String(result);
          } catch {
            // Per-expression error isolation – one broken fragment does not
            // break the whole template string.
            return '';
          }
        });
        return processed;
      }

      // ---- Case 3: Plain literal ----
      return expression;
    } catch (error) {
      // Top-level catch – should rarely trigger because safeEval already
      // catches internally, but this ensures the hook never throws.
      if (debugMode) {
        console.error('[ExpressionEvaluator] Unhandled error', {
          expression,
          error,
        });
      }
      return defaultValue;
    }
  }, [expression, scope, defaultValue]);
}
