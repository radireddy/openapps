import { describe, it, expect, beforeEach } from '@jest/globals';
import { safeEval, clearExpressionCache, getExpressionCacheSize } from '@/expressions/engine';

describe('Expression caching (LRU)', () => {
  beforeEach(() => {
    clearExpressionCache();
  });

  it('should cache compiled functions for repeated expressions', () => {
    const scope = { a: 10, b: 5 };

    // First call compiles, second should use cache
    const result1 = safeEval('a + b', scope);
    const cacheAfterFirst = getExpressionCacheSize();

    const result2 = safeEval('a + b', scope);
    const cacheAfterSecond = getExpressionCacheSize();

    expect(result1).toBe(15);
    expect(result2).toBe(15);
    // Cache size should be 1 for both calls (same expression)
    expect(cacheAfterFirst).toBe(1);
    expect(cacheAfterSecond).toBe(1);
  });

  it('should produce correct results with different scopes for same expression', () => {
    const scope1 = { x: 10 };
    const scope2 = { x: 99 };

    const result1 = safeEval('x * 2', scope1);
    const result2 = safeEval('x * 2', scope2);

    expect(result1).toBe(20);
    expect(result2).toBe(198);
    // Only 1 cache entry since the expression string is the same
    expect(getExpressionCacheSize()).toBe(1);
  });

  it('should cache different expressions separately', () => {
    const scope = { a: 1, b: 2 };

    safeEval('a + b', scope);
    safeEval('a * b', scope);
    safeEval('a - b', scope);

    expect(getExpressionCacheSize()).toBe(3);
  });

  it('should clear cache when clearExpressionCache is called', () => {
    const scope = { x: 5 };

    safeEval('x + 1', scope);
    safeEval('x + 2', scope);
    expect(getExpressionCacheSize()).toBe(2);

    clearExpressionCache();
    expect(getExpressionCacheSize()).toBe(0);
  });

  it('should not cache empty/whitespace expressions', () => {
    const scope = { a: 1 };

    safeEval('', scope);
    safeEval('   ', scope);

    expect(getExpressionCacheSize()).toBe(0);
  });

  it('should not cache expressions that hit forbidden globals check', () => {
    const scope = {};

    expect(() => safeEval('window.alert("hi")', scope)).toThrow();
    expect(getExpressionCacheSize()).toBe(0);
  });

  it('should handle expressions that throw runtime errors without breaking cache', () => {
    const scope = { a: 1 };

    // This expression accesses undefined property chain — won't cache break
    safeEval('a.b.c.d', scope);
    expect(getExpressionCacheSize()).toBe(1);

    // Should still work for valid expressions
    expect(safeEval('a + 1', scope)).toBe(2);
    expect(getExpressionCacheSize()).toBe(2);
  });

  it('should maintain correct behavior after many cache entries', () => {
    const scope = { n: 1 };

    // Add many unique expressions
    for (let i = 0; i < 100; i++) {
      safeEval(`n + ${i}`, scope);
    }

    expect(getExpressionCacheSize()).toBe(100);

    // All should still evaluate correctly
    expect(safeEval('n + 0', scope)).toBe(1);
    expect(safeEval('n + 99', scope)).toBe(100);
  });
});
