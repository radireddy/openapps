import { describe, it, expect } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useJavaScriptRenderer } from '@/property-renderers/useJavaScriptRenderer';

describe('useJavaScriptRenderer', () => {
  const scope = {
    name: 'World',
    count: 10,
    isActive: true,
  };

  it('should return literal values as they are', () => {
    const { result: strResult } = renderHook(() => useJavaScriptRenderer('Hello', scope, ''));
    expect(strResult.current).toBe('Hello');

    const { result: numResult } = renderHook(() => useJavaScriptRenderer(123, scope, 0));
    expect(numResult.current).toBe(123);

    const { result: boolResult } = renderHook(() => useJavaScriptRenderer(false, scope, true));
    expect(boolResult.current).toBe(false);
  });

  it('should evaluate a pure expression', () => {
    const { result } = renderHook(() => useJavaScriptRenderer('{{ count * 2 }}', scope, 0));
    expect(result.current).toBe(20);
  });
  
  it('should evaluate a boolean expression', () => {
    const { result } = renderHook(() => useJavaScriptRenderer('{{ count > 5 && isActive }}', scope, false));
    expect(result.current).toBe(true);
  });

  it('should evaluate a template literal with a single expression', () => {
    const { result } = renderHook(() => useJavaScriptRenderer('Hello, {{ name }}!', scope, ''));
    expect(result.current).toBe('Hello, World!');
  });

  it('should evaluate a template literal with multiple expressions', () => {
    const { result } = renderHook(() => useJavaScriptRenderer('Name: {{ name }}, Count: {{ count }}', scope, ''));
    expect(result.current).toBe('Name: World, Count: 10');
  });

  it('should return the default value for an invalid pure expression', () => {
    const { result } = renderHook(() => useJavaScriptRenderer('{{ count + undefinedVar }}', scope, 'Default'));
    expect(result.current).toBe('Default');
  });

  it('should return the default value for an empty pure expression', () => {
    const { result } = renderHook(() => useJavaScriptRenderer('{{ }}', scope, 'Default'));
    expect(result.current).toBe('Default');
  });

  it('should replace invalid expressions in a template literal with an empty string', () => {
    const { result } = renderHook(() => useJavaScriptRenderer('Hello, {{ nonExistentVar }}!', scope, ''));
    expect(result.current).toBe('Hello, !');
  });

  it('should re-evaluate when the scope changes', () => {
    const initialScope = { value: 5 };
    const { result, rerender } = renderHook(({ scope }) => useJavaScriptRenderer('{{ value * 2 }}', scope, 0), {
      initialProps: { scope: initialScope },
    });

    expect(result.current).toBe(10);

    const newScope = { value: 10 };
    rerender({ scope: newScope });

    expect(result.current).toBe(20);
  });
});