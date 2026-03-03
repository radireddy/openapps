import { describe, it, expect } from '@jest/globals';
import { safeEval } from '@/expressions/engine';

describe('safeEval', () => {
  const scope = {
    a: 1,
    b: { value: 2 },
    c: 'hello',
    myFunc: (x: number) => x * 2,
    isTrue: true,
  };

  // Test simple literals and expressions
  it('should evaluate numeric literals', () => {
    expect(safeEval('123', scope)).toBe(123);
  });

  it('should evaluate string literals', () => {
    expect(safeEval("'world'", scope)).toBe('world');
  });

  it('should evaluate boolean literals', () => {
    expect(safeEval('true', scope)).toBe(true);
  });

  it('should handle simple arithmetic', () => {
    expect(safeEval('1 + 2 * 3', scope)).toBe(7);
  });

  // Test scope access
  it('should access top-level properties from scope', () => {
    expect(safeEval('a', scope)).toBe(1);
  });

  it('should access nested properties from scope', () => {
    expect(safeEval('b.value', scope)).toBe(2);
  });
  
  it('should access string properties', () => {
    expect(safeEval('c', scope)).toBe('hello');
  });

  it('should handle expressions combining scope variables and literals', () => {
    expect(safeEval('a + b.value', scope)).toBe(3);
  });

  // Test function calls
  it('should call functions from the scope', () => {
    expect(safeEval('myFunc(5)', scope)).toBe(10);
  });

  it('should handle complex expressions with function calls', () => {
    expect(safeEval('myFunc(a + b.value)', scope)).toBe(6);
  });

  // Test security and sandboxing
  it('should NOT have access to the global window object', () => {
    expect(() => safeEval('window.alert("pwned")', scope)).toThrow();
  });

  it('should NOT have access to the global document object', () => {
    expect(() => safeEval('document.getElementById("root")', scope)).toThrow();
  });

  it('should NOT be able to define global variables', () => {
    // Assignment guard catches top-level assignments and returns undefined
    expect(safeEval('myGlobal = 10', scope)).toBeUndefined();
  });

  // Test error handling
  it('should return undefined for invalid syntax', () => {
    expect(safeEval('1 +', scope)).toBeUndefined();
  });

  it('should return undefined for references to non-existent variables', () => {
    expect(safeEval('x.y.z', scope)).toBeUndefined();
  });
  
  it('should return undefined for empty or whitespace expressions', () => {
    expect(safeEval('', scope)).toBeUndefined();
    expect(safeEval('  ', scope)).toBeUndefined();
  });
  
  it('should gracefully handle partially typed identifiers by returning them as a string', () => {
    // This is a special case to improve UX while typing
    expect(safeEval('myVa', scope)).toBe('myVa');
  });

  it('should not treat keywords as partially typed identifiers', () => {
    expect(safeEval('true', scope)).toBe(true);
    expect(safeEval('console', scope)).toBeDefined();
  });

  it('should return undefined for incomplete operators without throwing', () => {
    expect(safeEval('a >', scope)).toBeUndefined();
    expect(safeEval('a ===', scope)).toBeUndefined();
  });
});