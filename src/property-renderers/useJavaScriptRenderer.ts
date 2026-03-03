

import { useMemo, useEffect } from 'react';
import { safeEval, parseDependencies } from '../expressions/engine';
import { dependencyGraph } from '../expressions/dependency-graph';

/**
 * A custom hook to evaluate a string value, which might be a literal, a pure JS expression, or a template literal.
 * It intelligently re-evaluates the expression only when its dependencies change.
 *
 * When `expressionKey` is provided, the hook registers dependencies with the global
 * DependencyGraph and uses result caching to skip redundant safeEval calls.
 * Without `expressionKey`, behavior is identical to before (no regression risk).
 *
 * @param value - The raw value from component props (e.g., "Hello" or "{{Input1.value}}" or "Value: {{counter}}").
 * @param scope - The entire evaluation scope containing all app state.
 * @param defaultValue - A fallback value if the expression is invalid or returns undefined.
 * @param expressionKey - Optional unique key for dependency tracking (e.g., "Input1:disabled").
 * @returns The evaluated result.
 */
export function useJavaScriptRenderer<T>(value: T, scope: Record<string, any>, defaultValue: T, expressionKey?: string): T {
  // Register/unregister with dependency graph when expressionKey is provided
  useEffect(() => {
    if (!expressionKey || typeof value !== 'string') return;

    // Extract all expressions from the value and collect their dependencies
    const allDeps: string[] = [];
    const expressionPattern = /{{\s*(.*?)\s*}}/g;
    let match;
    while ((match = expressionPattern.exec(value)) !== null) {
      allDeps.push(...parseDependencies(match[1]));
    }

    if (allDeps.length > 0) {
      dependencyGraph.register(expressionKey, '', allDeps);
    }

    return () => {
      if (expressionKey) {
        dependencyGraph.unregister(expressionKey);
      }
    };
  }, [expressionKey, value]);

  const result = useMemo(() => {
    if (typeof value !== 'string') {
        return value; // Not a string, return as is.
    }

    const scopeVersion: number = scope.__scopeVersion ?? 0;

    // Check dependency graph cache when expressionKey is provided
    if (expressionKey) {
      const cached = dependencyGraph.getCachedResult(expressionKey, scopeVersion);
      if (cached.hit) {
        return cached.result;
      }
    }

    let evaluated: any;

    const isPureExpression = value.startsWith('{{') && value.endsWith('}}');

    // Case 1: Pure Expression like "{{ Input1.value }}"
    if (isPureExpression) {
        const expression = value.substring(2, value.length - 2).trim();
        if (!expression) {
            evaluated = defaultValue;
        } else {
            const result = safeEval(expression, scope);
            evaluated = result !== undefined ? result : defaultValue;
        }
    }
    // Case 2: Template Literal like "Hello, {{ name }}"
    else if (value.includes('{{') && value.includes('}}')) {
        const processedString = value.replace(/{{\s*(.*?)\s*}}/g, (_match, expression) => {
            const result = safeEval(expression, scope);
            if (result === undefined || result === null) return '';
            if (typeof result === 'string' && result.trim() === expression.trim()) return '';
            return String(result);
        });
        evaluated = processedString as any;
    }
    // Case 3: It's just a literal string.
    else {
        evaluated = value;
    }

    // Cache the result in the dependency graph
    if (expressionKey) {
      dependencyGraph.cacheResult(expressionKey, evaluated, scopeVersion);
    }

    return evaluated;

  }, [value, scope, defaultValue, expressionKey]);

  return result;
}
