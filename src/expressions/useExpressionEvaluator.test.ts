import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  useExpressionEvaluator,
  setExpressionDebug,
  getExpressionDebug,
} from '@/expressions/useExpressionEvaluator';

describe('useExpressionEvaluator', () => {
  const scope = {
    name: 'World',
    count: 10,
    isActive: true,
    items: [1, 2, 3],
    user: {
      profile: { name: 'Alice' },
    },
  };

  // ---------------------------------------------------------------------------
  // Basic evaluation
  // ---------------------------------------------------------------------------
  describe('basic evaluation', () => {
    it('should evaluate a pure expression', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('{{ count * 2 }}', scope),
      );
      expect(result.current).toBe(20);
    });

    it('should evaluate a boolean expression', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('{{ isActive && count > 5 }}', scope),
      );
      expect(result.current).toBe(true);
    });

    it('should evaluate a nested property expression', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('{{ user.profile.name }}', scope),
      );
      expect(result.current).toBe('Alice');
    });

    it('should evaluate array methods', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('{{ items.filter(x => x > 1) }}', scope),
      );
      expect(result.current).toEqual([2, 3]);
    });
  });

  // ---------------------------------------------------------------------------
  // Template strings
  // ---------------------------------------------------------------------------
  describe('template strings', () => {
    it('should interpolate a single expression', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('Hello {{ name }}!', scope),
      );
      expect(result.current).toBe('Hello World!');
    });

    it('should interpolate multiple expressions', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('{{ name }} has {{ count }} items', scope),
      );
      expect(result.current).toBe('World has 10 items');
    });

    it('should replace unresolved expressions with empty string in template', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('Hello {{ nonExistent }}!', scope),
      );
      expect(result.current).toBe('Hello !');
    });
  });

  // ---------------------------------------------------------------------------
  // Literal / non-expression values
  // ---------------------------------------------------------------------------
  describe('literal values', () => {
    it('should return a plain string as-is', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('Just text', scope),
      );
      expect(result.current).toBe('Just text');
    });

    it('should return undefined expression as defaultValue', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator(undefined, scope, 'fallback'),
      );
      expect(result.current).toBe('fallback');
    });

    it('should return defaultValue when expression is undefined and no default provided', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator(undefined, scope),
      );
      expect(result.current).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Default value / error handling
  // ---------------------------------------------------------------------------
  describe('default value and error handling', () => {
    it('should return defaultValue when expression result is undefined', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('{{ undefinedVar.deepProp }}', scope, 'default'),
      );
      expect(result.current).toBe('default');
    });

    it('should return defaultValue for an empty pure expression', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator('{{ }}', scope, 'empty'),
      );
      expect(result.current).toBe('empty');
    });

    it('should not throw on a forbidden global access – returns default', () => {
      // safeEval throws for window access; the hook should catch and return default.
      const { result } = renderHook(() =>
        useExpressionEvaluator('{{ window.location }}', scope, 'blocked'),
      );
      expect(result.current).toBe('blocked');
    });

    it('should isolate errors per template fragment', () => {
      // First fragment throws, second is valid.
      const { result } = renderHook(() =>
        useExpressionEvaluator(
          'A:{{ window.location }} B:{{ count }}',
          scope,
        ),
      );
      // The "window.location" fragment should be replaced with ''
      // "count" should resolve to 10
      expect(result.current).toBe('A: B:10');
    });

    it('should handle null expression by returning defaultValue', () => {
      const { result } = renderHook(() =>
        useExpressionEvaluator(null as any, scope, 'null-default'),
      );
      expect(result.current).toBe('null-default');
    });
  });

  // ---------------------------------------------------------------------------
  // Re-evaluation on scope change
  // ---------------------------------------------------------------------------
  describe('reactivity', () => {
    it('should re-evaluate when scope changes', () => {
      const initialScope = { value: 5 };
      const { result, rerender } = renderHook(
        ({ s }) => useExpressionEvaluator('{{ value * 3 }}', s),
        { initialProps: { s: initialScope } },
      );
      expect(result.current).toBe(15);

      rerender({ s: { value: 10 } });
      expect(result.current).toBe(30);
    });

    it('should re-evaluate when expression changes', () => {
      const { result, rerender } = renderHook(
        ({ expr }) => useExpressionEvaluator(expr, scope),
        { initialProps: { expr: '{{ count }}' } },
      );
      expect(result.current).toBe(10);

      rerender({ expr: '{{ count + 1 }}' });
      expect(result.current).toBe(11);
    });
  });

  // ---------------------------------------------------------------------------
  // Debug mode
  // ---------------------------------------------------------------------------
  describe('debug mode', () => {
    let consoleSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      setExpressionDebug(true);
    });

    afterEach(() => {
      setExpressionDebug(false);
      consoleSpy.mockRestore();
    });

    it('should log evaluation when debug is enabled', () => {
      renderHook(() => useExpressionEvaluator('{{ count }}', scope));
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ExpressionEvaluator]',
        expect.objectContaining({
          expression: 'count',
          result: 10,
        }),
      );
    });

    it('should log for template parts in debug mode', () => {
      renderHook(() =>
        useExpressionEvaluator('Hello {{ name }}', scope),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ExpressionEvaluator] template part',
        expect.objectContaining({
          expression: 'name',
          result: 'World',
        }),
      );
    });

    it('should log for empty expressions in debug mode', () => {
      renderHook(() =>
        useExpressionEvaluator('{{ }}', scope, 'default'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ExpressionEvaluator] Empty expression, returning default',
      );
    });

    it('getExpressionDebug should reflect current state', () => {
      expect(getExpressionDebug()).toBe(true);
      setExpressionDebug(false);
      expect(getExpressionDebug()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // setExpressionDebug / getExpressionDebug
  // ---------------------------------------------------------------------------
  describe('setExpressionDebug / getExpressionDebug', () => {
    afterEach(() => setExpressionDebug(false));

    it('defaults to false', () => {
      // After the afterEach cleanup above, it should be false.
      expect(getExpressionDebug()).toBe(false);
    });

    it('can be toggled on and off', () => {
      setExpressionDebug(true);
      expect(getExpressionDebug()).toBe(true);
      setExpressionDebug(false);
      expect(getExpressionDebug()).toBe(false);
    });
  });
});
