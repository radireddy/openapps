import { renderHook, act } from '@testing-library/react';
import { useFormField } from '../useFormField';
import { InputActionType } from '@/types';

// Mock useJavaScriptRenderer to return value or default
jest.mock('@/property-renderers/useJavaScriptRenderer', () => ({
  useJavaScriptRenderer: (value: any, _scope: any, defaultValue: any) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    return value;
  },
}));

const baseProps = {
  disabled: false,
  readOnly: false,
  required: false,
  errorMessage: '',
  validationTiming: 'onBlur' as const,
  helpText: '',
  size: 'md' as const,
  value: undefined as string | undefined,
  defaultValue: '' as string | boolean,
  onChangeActionType: 'none' as InputActionType,
  onFocusActionType: 'none' as InputActionType,
  onBlurActionType: 'none' as InputActionType,
  onEnterActionType: 'none' as InputActionType,
  width: 200,
  height: 40,
  label: '',
  opacity: 1,
  boxShadow: '',
};

const defaultOptions = {
  component: { id: 'comp-1', props: baseProps },
  mode: 'preview' as const,
  dataStore: {},
  onUpdateDataStore: jest.fn(),
  evaluationScope: {},
  actions: undefined,
};

describe('useFormField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correct defaults for a string field', () => {
    const { result } = renderHook(() => useFormField(defaultOptions));

    expect(result.current.isDisabled).toBe(false);
    expect(result.current.isDisabledInPreview).toBe(false);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.isRequired).toBe(false);
    expect(result.current.currentValue).toBe('');
    expect(result.current.validationError).toBe('');
    expect(result.current.finalOpacity).toBe(1);
  });

  it('respects disabled=true and reduces opacity', () => {
    const opts = {
      ...defaultOptions,
      component: { id: 'comp-1', props: { ...baseProps, disabled: true } },
    };
    const { result } = renderHook(() => useFormField(opts));

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.isDisabledInPreview).toBe(true);
    expect(result.current.finalOpacity).toBe(0.6);
  });

  it('coerces disabled="true" string to boolean true', () => {
    const opts = {
      ...defaultOptions,
      component: { id: 'comp-1', props: { ...baseProps, disabled: 'true' } },
    };
    const { result } = renderHook(() => useFormField(opts));
    expect(result.current.isDisabled).toBe(true);
  });

  it('uses dataStore value over defaultValue', () => {
    const opts = {
      ...defaultOptions,
      component: { id: 'comp-1', props: { ...baseProps, defaultValue: 'default' } },
      dataStore: { 'comp-1': 'stored' },
    };
    const { result } = renderHook(() => useFormField(opts));
    expect(result.current.currentValue).toBe('stored');
  });

  it('uses defaultValue when dataStore is empty', () => {
    const opts = {
      ...defaultOptions,
      component: { id: 'comp-1', props: { ...baseProps, defaultValue: 'hello' } },
    };
    const { result } = renderHook(() => useFormField(opts));
    expect(result.current.currentValue).toBe('hello');
  });

  it('runs required validation on blur', () => {
    const opts = {
      ...defaultOptions,
      component: { id: 'comp-1', props: { ...baseProps, required: true } },
    };
    const { result } = renderHook(() => useFormField(opts));

    act(() => {
      result.current.validateOnBlur('');
    });

    expect(result.current.validationError).toBe('This field is required');
  });

  it('runs component-specific validation', () => {
    const componentValidator = (value: any) => {
      if (value === 'bad') return 'Not allowed';
      return '';
    };

    const opts = {
      ...defaultOptions,
      validate: componentValidator,
      component: { id: 'comp-1', props: { ...baseProps, defaultValue: 'bad' } },
    };
    const { result } = renderHook(() => useFormField(opts));

    act(() => {
      result.current.validateOnBlur('bad');
    });

    expect(result.current.validationError).toBe('Not allowed');
  });

  it('handles boolean valueType for switch/checkbox', () => {
    const opts = {
      ...defaultOptions,
      valueType: 'boolean' as const,
      component: { id: 'comp-1', props: { ...baseProps, defaultValue: true } },
    };
    const { result } = renderHook(() => useFormField(opts));
    expect(result.current.currentValue).toBe(true);
  });

  it('sets pointerEventsStyle in edit mode when disabled', () => {
    const opts = {
      ...defaultOptions,
      mode: 'edit' as const,
      component: { id: 'comp-1', props: { ...baseProps, disabled: true } },
    };
    const { result } = renderHook(() => useFormField(opts));
    expect(result.current.pointerEventsStyle).toEqual({ pointerEvents: 'none' });
  });

  it('computes ariaDescribedBy from validation error and help text', () => {
    const opts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, required: true, helpText: 'Enter a name' },
      },
    };
    const { result } = renderHook(() => useFormField(opts));

    // Before validation - only help text
    expect(result.current.ariaDescribedBy).toBe('comp-1-help');

    // After validation - error + help
    act(() => {
      result.current.validateOnBlur('');
    });
    expect(result.current.ariaDescribedBy).toContain('comp-1-error');
    expect(result.current.ariaDescribedBy).toContain('comp-1-help');
  });

  it('provides event handler functions', () => {
    const { result } = renderHook(() => useFormField(defaultOptions));
    expect(typeof result.current.eventHandlers.handleFocus).toBe('function');
    expect(typeof result.current.eventHandlers.handleBlur).toBe('function');
    expect(typeof result.current.eventHandlers.handleKeyDown).toBe('function');
  });

  it('provides focus/blur refs', () => {
    const { result } = renderHook(() => useFormField(defaultOptions));
    expect(result.current.focusBlurRefs.lastFocusTimeRef.current).toBe(0);
    expect(result.current.focusBlurRefs.lastClickTimeRef.current).toBe(0);
  });

  // ── Value binding priority regression tests ─────────────
  // Regression: expression-bound value prop was ignored when dataStore had a stored value.
  // The fix ensures valueProp > stored > defaultValue.

  it('uses value prop over stored dataStore value when both exist', () => {
    const opts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'expression-result' },
      },
      dataStore: { 'comp-1': 'stale-stored' },
    };
    const { result } = renderHook(() => useFormField(opts));
    expect(result.current.currentValue).toBe('expression-result');
  });

  it('updates localValue when value prop changes even if dataStore has stored value', () => {
    const initialOpts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'initial' },
      },
      dataStore: { 'comp-1': 'stale-stored' },
    };

    const { result, rerender } = renderHook(
      (opts) => useFormField(opts),
      { initialProps: initialOpts }
    );
    expect(result.current.currentValue).toBe('initial');

    // Simulate variable change: valueProp updates to new value
    const updatedOpts = {
      ...initialOpts,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'updated-from-slider' },
      },
      dataStore: { 'comp-1': 'stale-stored' },
    };
    rerender(updatedOpts);
    expect(result.current.currentValue).toBe('updated-from-slider');
  });

  it('falls back to stored dataStore value when no value prop binding exists', () => {
    const opts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: undefined },
      },
      dataStore: { 'comp-1': 'stored-value' },
    };
    const { result } = renderHook(() => useFormField(opts));
    expect(result.current.currentValue).toBe('stored-value');
  });

  it('uses value prop over defaultValue when no stored value exists', () => {
    const opts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'bound-value', defaultValue: 'fallback' },
      },
      dataStore: {},
    };
    const { result } = renderHook(() => useFormField(opts));
    expect(result.current.currentValue).toBe('bound-value');
  });

  // ── Ref-based change detection regression tests ─────────
  // Regression: valueProp always winning over stored values caused user typing
  // to be overwritten. The fix uses a ref to detect when valueProp actually changed.

  it('preserves user-typed value when value prop binding has not changed', () => {
    const initialOpts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'bound-100' },
      },
      dataStore: {} as Record<string, any>,
    };

    const { result, rerender } = renderHook(
      (opts) => useFormField(opts),
      { initialProps: initialOpts }
    );
    // Initial render: valueProp wins (first time, ref was undefined)
    expect(result.current.currentValue).toBe('bound-100');

    // User types — dataStore updated, but valueProp unchanged
    rerender({
      ...initialOpts,
      dataStore: { 'comp-1': 'user-typed-500' },
    });
    // Stored value should win because valueProp hasn't changed
    expect(result.current.currentValue).toBe('user-typed-500');
  });

  it('external variable change overrides user-typed stored value', () => {
    const initialOpts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'bound-100' },
      },
      dataStore: {} as Record<string, any>,
    };

    const { result, rerender } = renderHook(
      (opts) => useFormField(opts),
      { initialProps: initialOpts }
    );
    expect(result.current.currentValue).toBe('bound-100');

    // User types
    rerender({
      ...initialOpts,
      dataStore: { 'comp-1': 'user-typed-500' },
    });
    expect(result.current.currentValue).toBe('user-typed-500');

    // External variable changes (e.g., slider moved) → valueProp changes
    rerender({
      ...initialOpts,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'bound-200' },
      },
      dataStore: { 'comp-1': 'user-typed-500' },
    });
    // valueProp changed → it should win
    expect(result.current.currentValue).toBe('bound-200');
  });

  it('uses stored value over unchanged valueProp after multiple rerenders', () => {
    const initialOpts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'bound-100' },
      },
      dataStore: {} as Record<string, any>,
    };

    const { result, rerender } = renderHook(
      (opts) => useFormField(opts),
      { initialProps: initialOpts }
    );
    expect(result.current.currentValue).toBe('bound-100');

    // Simulate multiple keystrokes — each rerender has same valueProp
    rerender({
      ...initialOpts,
      dataStore: { 'comp-1': '5' },
    });
    expect(result.current.currentValue).toBe('5');

    rerender({
      ...initialOpts,
      dataStore: { 'comp-1': '50' },
    });
    expect(result.current.currentValue).toBe('50');

    rerender({
      ...initialOpts,
      dataStore: { 'comp-1': '500' },
    });
    expect(result.current.currentValue).toBe('500');
  });

  it('handles valueProp changing to same value as stored gracefully', () => {
    const initialOpts = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'bound-100' },
      },
      dataStore: {} as Record<string, any>,
    };

    const { result, rerender } = renderHook(
      (opts) => useFormField(opts),
      { initialProps: initialOpts }
    );
    expect(result.current.currentValue).toBe('bound-100');

    // User types "200", stored becomes "200"
    rerender({
      ...initialOpts,
      dataStore: { 'comp-1': '200' },
    });
    expect(result.current.currentValue).toBe('200');

    // Now valueProp changes to "200" (matches stored) — change is detected
    rerender({
      ...initialOpts,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: '200' },
      },
      dataStore: { 'comp-1': '200' },
    });
    // valueProp changed (bound-100 → 200), so it wins
    expect(result.current.currentValue).toBe('200');
  });

  // ── dataStore sync on preview mount ─────────────────────
  // Fix: form validation was failing because default/initial values only existed
  // in component-local state and were never written back to dataStore.

  it('syncs defaultValue to dataStore on preview mount when dataStore is empty', () => {
    const mockUpdate = jest.fn();
    const opts = {
      ...defaultOptions,
      mode: 'preview' as const,
      component: { id: 'comp-1', props: { ...baseProps, defaultValue: 'hello' } },
      dataStore: {},
      onUpdateDataStore: mockUpdate,
    };
    renderHook(() => useFormField(opts));

    expect(mockUpdate).toHaveBeenCalledWith('comp-1', 'hello');
  });

  it('syncs numeric defaultValue to dataStore on preview mount', () => {
    const mockUpdate = jest.fn();
    const opts = {
      ...defaultOptions,
      mode: 'preview' as const,
      component: { id: 'slider-1', props: { ...baseProps, defaultValue: 50 } },
      dataStore: {},
      onUpdateDataStore: mockUpdate,
    };
    renderHook(() => useFormField(opts));

    expect(mockUpdate).toHaveBeenCalledWith('slider-1', 50);
  });

  it('does NOT sync defaultValue to dataStore in edit mode', () => {
    const mockUpdate = jest.fn();
    const opts = {
      ...defaultOptions,
      mode: 'edit' as const,
      component: { id: 'comp-1', props: { ...baseProps, defaultValue: 'hello' } },
      dataStore: {},
      onUpdateDataStore: mockUpdate,
    };
    renderHook(() => useFormField(opts));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does NOT overwrite existing dataStore value on preview mount', () => {
    const mockUpdate = jest.fn();
    const opts = {
      ...defaultOptions,
      mode: 'preview' as const,
      component: { id: 'comp-1', props: { ...baseProps, defaultValue: 'hello' } },
      dataStore: { 'comp-1': 'existing' },
      onUpdateDataStore: mockUpdate,
    };
    renderHook(() => useFormField(opts));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does NOT sync empty string defaultValue to dataStore', () => {
    const mockUpdate = jest.fn();
    const opts = {
      ...defaultOptions,
      mode: 'preview' as const,
      component: { id: 'comp-1', props: { ...baseProps, defaultValue: '' } },
      dataStore: {},
      onUpdateDataStore: mockUpdate,
    };
    renderHook(() => useFormField(opts));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('syncs boolean true defaultValue to dataStore on preview mount', () => {
    const mockUpdate = jest.fn();
    const opts = {
      ...defaultOptions,
      mode: 'preview' as const,
      valueType: 'boolean' as const,
      component: { id: 'switch-1', props: { ...baseProps, defaultValue: true } },
      dataStore: {},
      onUpdateDataStore: mockUpdate,
    };
    renderHook(() => useFormField(opts));

    expect(mockUpdate).toHaveBeenCalledWith('switch-1', true);
  });

  it('does NOT sync boolean false defaultValue to dataStore (not meaningful)', () => {
    const mockUpdate = jest.fn();
    const opts = {
      ...defaultOptions,
      mode: 'preview' as const,
      valueType: 'boolean' as const,
      component: { id: 'switch-1', props: { ...baseProps, defaultValue: false } },
      dataStore: {},
      onUpdateDataStore: mockUpdate,
    };
    renderHook(() => useFormField(opts));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ── BUG-003: Blur validation false positive with expression values ──

  it('does not show required error on blur when field has expression-evaluated default value', () => {
    // Simulates: required=true, defaultValue={{userName}} where userName="John Doe"
    // On first blur, localValue may still be empty due to sync timing,
    // but evaluatedDefaultValue should be used as the authoritative source.
    const opts = {
      ...defaultOptions,
      mode: 'preview' as const,
      component: {
        id: 'comp-1',
        props: { ...baseProps, required: true, defaultValue: 'John Doe' },
      },
      dataStore: {},
    };
    const { result } = renderHook(() => useFormField(opts));

    // Trigger blur via the event handler
    act(() => {
      result.current.eventHandlers.handleBlur({
        target: {},
        currentTarget: {},
      } as React.FocusEvent<any>);
    });

    // Should NOT show validation error — the field has a non-empty evaluated default value
    expect(result.current.validationError).toBe('');
  });

  it('does not show required error on blur when field has expression-evaluated value prop', () => {
    // Simulates: required=true, value={{userName}} where userName="Jane Smith"
    // The explicit value binding should be used as the authoritative validation source.
    const opts = {
      ...defaultOptions,
      mode: 'preview' as const,
      component: {
        id: 'comp-1',
        props: { ...baseProps, required: true, value: 'Jane Smith' },
      },
      dataStore: {},
    };
    const { result } = renderHook(() => useFormField(opts));

    // Trigger blur via the event handler
    act(() => {
      result.current.eventHandlers.handleBlur({
        target: {},
        currentTarget: {},
      } as React.FocusEvent<any>);
    });

    // Should NOT show validation error — the field has a non-empty evaluated value prop
    expect(result.current.validationError).toBe('');
  });

  it('respects full priority chain: valueProp > stored > defaultValue', () => {
    // All three present → valueProp wins
    const allThree = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: 'from-binding', defaultValue: 'from-default' },
      },
      dataStore: { 'comp-1': 'from-store' },
    };
    const { result: r1 } = renderHook(() => useFormField(allThree));
    expect(r1.current.currentValue).toBe('from-binding');

    // No valueProp → stored wins over default
    const noValue = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: undefined, defaultValue: 'from-default' },
      },
      dataStore: { 'comp-1': 'from-store' },
    };
    const { result: r2 } = renderHook(() => useFormField(noValue));
    expect(r2.current.currentValue).toBe('from-store');

    // No valueProp, no stored → default wins
    const onlyDefault = {
      ...defaultOptions,
      component: {
        id: 'comp-1',
        props: { ...baseProps, value: undefined, defaultValue: 'from-default' },
      },
      dataStore: {},
    };
    const { result: r3 } = renderHook(() => useFormField(onlyDefault));
    expect(r3.current.currentValue).toBe('from-default');
  });
});
