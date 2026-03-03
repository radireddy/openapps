import { useRuntimeStore, validateVariableType } from './runtimeStore';
import { AppVariableType } from '@/types';

// ─── Helper to reset store between tests ─────────────────────────

function resetStore() {
  useRuntimeStore.getState().reset();
}

beforeEach(() => {
  resetStore();
  jest.restoreAllMocks();
});

// ─── validateVariableType (pure function) ────────────────────────

describe('validateVariableType', () => {
  it('returns true for null/undefined regardless of expected type', () => {
    expect(validateVariableType('x', null, AppVariableType.STRING)).toBe(true);
    expect(validateVariableType('x', undefined, AppVariableType.NUMBER)).toBe(true);
  });

  it('validates STRING type', () => {
    expect(validateVariableType('x', 'hello', AppVariableType.STRING)).toBe(true);
    expect(validateVariableType('x', '', AppVariableType.STRING)).toBe(true);
    expect(validateVariableType('x', 42, AppVariableType.STRING)).toBe(false);
    expect(validateVariableType('x', true, AppVariableType.STRING)).toBe(false);
  });

  it('validates NUMBER type', () => {
    expect(validateVariableType('x', 42, AppVariableType.NUMBER)).toBe(true);
    expect(validateVariableType('x', 0, AppVariableType.NUMBER)).toBe(true);
    expect(validateVariableType('x', -3.14, AppVariableType.NUMBER)).toBe(true);
    expect(validateVariableType('x', NaN, AppVariableType.NUMBER)).toBe(false);
    expect(validateVariableType('x', '42', AppVariableType.NUMBER)).toBe(false);
  });

  it('validates BOOLEAN type', () => {
    expect(validateVariableType('x', true, AppVariableType.BOOLEAN)).toBe(true);
    expect(validateVariableType('x', false, AppVariableType.BOOLEAN)).toBe(true);
    expect(validateVariableType('x', 0, AppVariableType.BOOLEAN)).toBe(false);
    expect(validateVariableType('x', 'true', AppVariableType.BOOLEAN)).toBe(false);
  });

  it('validates OBJECT type', () => {
    expect(validateVariableType('x', { a: 1 }, AppVariableType.OBJECT)).toBe(true);
    expect(validateVariableType('x', {}, AppVariableType.OBJECT)).toBe(true);
    expect(validateVariableType('x', [1, 2], AppVariableType.OBJECT)).toBe(false);
    expect(validateVariableType('x', 'object', AppVariableType.OBJECT)).toBe(false);
  });

  it('validates ARRAY type', () => {
    expect(validateVariableType('x', [1, 2, 3], AppVariableType.ARRAY)).toBe(true);
    expect(validateVariableType('x', [], AppVariableType.ARRAY)).toBe(true);
    expect(validateVariableType('x', { length: 0 }, AppVariableType.ARRAY)).toBe(false);
    expect(validateVariableType('x', 'array', AppVariableType.ARRAY)).toBe(false);
  });

  it('validates ARRAY_OF_OBJECTS type', () => {
    expect(validateVariableType('x', [{ a: 1 }, { b: 2 }], AppVariableType.ARRAY_OF_OBJECTS)).toBe(true);
    expect(validateVariableType('x', [], AppVariableType.ARRAY_OF_OBJECTS)).toBe(true);
    expect(validateVariableType('x', [1, 2], AppVariableType.ARRAY_OF_OBJECTS)).toBe(false);
    expect(validateVariableType('x', [{ a: 1 }, null], AppVariableType.ARRAY_OF_OBJECTS)).toBe(false);
    expect(validateVariableType('x', [{ a: 1 }, [1]], AppVariableType.ARRAY_OF_OBJECTS)).toBe(false);
  });

  it('issues console.warn on type mismatch', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    validateVariableType('count', 'not a number', AppVariableType.NUMBER);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Variable "count"'),
      expect.anything(),
      expect.anything()
    );
  });

  it('returns true for unknown type (default case)', () => {
    expect(validateVariableType('x', 'anything', 'UNKNOWN' as AppVariableType)).toBe(true);
  });
});

// ─── Component Values ────────────────────────────────────────────

describe('runtimeStore: componentValues', () => {
  it('starts with empty componentValues', () => {
    expect(useRuntimeStore.getState().componentValues).toEqual({});
  });

  it('sets a single component value', () => {
    useRuntimeStore.getState().setComponentValue('input1', 'hello');
    expect(useRuntimeStore.getState().componentValues).toEqual({ input1: 'hello' });
  });

  it('sets multiple component values in batch', () => {
    useRuntimeStore.getState().setComponentValues({
      input1: 'hello',
      input2: 'world',
      select1: 'option-a',
    });
    const cv = useRuntimeStore.getState().componentValues;
    expect(cv.input1).toBe('hello');
    expect(cv.input2).toBe('world');
    expect(cv.select1).toBe('option-a');
  });

  it('overwrites existing value on set', () => {
    useRuntimeStore.getState().setComponentValue('input1', 'first');
    useRuntimeStore.getState().setComponentValue('input1', 'second');
    expect(useRuntimeStore.getState().componentValues.input1).toBe('second');
  });

  it('clears a single component value', () => {
    useRuntimeStore.getState().setComponentValue('input1', 'hello');
    useRuntimeStore.getState().clearComponentValue('input1');
    expect(useRuntimeStore.getState().componentValues.input1).toBeUndefined();
  });

  it('clears all component values', () => {
    useRuntimeStore.getState().setComponentValues({ a: 1, b: 2, c: 3 });
    useRuntimeStore.getState().clearAllComponentValues();
    expect(useRuntimeStore.getState().componentValues).toEqual({});
  });
});

// ─── Variable State ──────────────────────────────────────────────

describe('runtimeStore: variableState', () => {
  it('starts with empty variableState', () => {
    expect(useRuntimeStore.getState().variableState).toEqual({});
  });

  it('sets a variable value', () => {
    useRuntimeStore.getState().setVariable('count', 42);
    expect(useRuntimeStore.getState().variableState.count).toBe(42);
  });

  it('validates type when definitions exist', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    useRuntimeStore.getState().initializeVariables(
      [{ id: 'v1', name: 'count', type: AppVariableType.NUMBER, initialValue: 0 }],
      { count: 0 }
    );
    // This should warn — setting string where number expected
    useRuntimeStore.getState().setVariable('count', 'not a number');
    expect(warnSpy).toHaveBeenCalled();
    // Value is still set (warn, not block)
    expect(useRuntimeStore.getState().variableState.count).toBe('not a number');
  });

  it('does not warn when type matches', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    useRuntimeStore.getState().initializeVariables(
      [{ id: 'v1', name: 'count', type: AppVariableType.NUMBER, initialValue: 0 }],
      { count: 0 }
    );
    useRuntimeStore.getState().setVariable('count', 99);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('initializes variables from definitions', () => {
    useRuntimeStore.getState().initializeVariables(
      [
        { id: 'v1', name: 'name', type: AppVariableType.STRING, initialValue: 'Alice' },
        { id: 'v2', name: 'age', type: AppVariableType.NUMBER, initialValue: 30 },
      ],
      { name: 'Alice', age: 30 }
    );
    expect(useRuntimeStore.getState().variableState).toEqual({ name: 'Alice', age: 30 });
    expect(useRuntimeStore.getState()._variableDefinitions).toHaveLength(2);
  });

  it('clears a variable', () => {
    useRuntimeStore.getState().setVariable('count', 5);
    useRuntimeStore.getState().clearVariable('count');
    expect(useRuntimeStore.getState().variableState.count).toBeUndefined();
  });

  it('sets multiple variables atomically via setVariables', () => {
    useRuntimeStore.getState().setVariable('a', 1);
    useRuntimeStore.getState().setVariables({ b: 'hello', c: true });
    const state = useRuntimeStore.getState().variableState;
    expect(state.a).toBe(1);
    expect(state.b).toBe('hello');
    expect(state.c).toBe(true);
  });

  it('preserves existing variables when batch-setting new ones', () => {
    useRuntimeStore.getState().setVariable('existing', 'keep');
    useRuntimeStore.getState().setVariables({ new1: 'a', new2: 'b' });
    const state = useRuntimeStore.getState().variableState;
    expect(state.existing).toBe('keep');
    expect(state.new1).toBe('a');
    expect(state.new2).toBe('b');
  });
});

// ─── Form State ──────────────────────────────────────────────────

describe('runtimeStore: formState', () => {
  it('starts with initial form state', () => {
    const fs = useRuntimeStore.getState().formState;
    expect(fs.validationTrigger).toBe(0);
    expect(fs.fieldErrors).toEqual({});
    expect(fs.submitting).toBe(false);
  });

  it('triggers form validation with timestamp', () => {
    const before = Date.now();
    useRuntimeStore.getState().triggerFormValidation();
    const after = Date.now();
    const trigger = useRuntimeStore.getState().formState.validationTrigger;
    expect(trigger).toBeGreaterThanOrEqual(before);
    expect(trigger).toBeLessThanOrEqual(after);
  });

  it('triggers produce new timestamps on each call', () => {
    useRuntimeStore.getState().triggerFormValidation();
    const first = useRuntimeStore.getState().formState.validationTrigger;

    // Small delay to ensure different timestamp
    const later = Date.now() + 1;
    jest.spyOn(Date, 'now').mockReturnValue(later);
    useRuntimeStore.getState().triggerFormValidation();
    const second = useRuntimeStore.getState().formState.validationTrigger;

    expect(second).toBeGreaterThanOrEqual(first);
  });

  it('sets a field error', () => {
    useRuntimeStore.getState().setFieldError('input1', 'This field is required');
    expect(useRuntimeStore.getState().formState.fieldErrors.input1).toBe('This field is required');
  });

  it('clears a field error', () => {
    useRuntimeStore.getState().setFieldError('input1', 'Required');
    useRuntimeStore.getState().clearFieldError('input1');
    expect(useRuntimeStore.getState().formState.fieldErrors.input1).toBeUndefined();
  });

  it('sets form submitting state', () => {
    useRuntimeStore.getState().setFormSubmitting(true);
    expect(useRuntimeStore.getState().formState.submitting).toBe(true);
    useRuntimeStore.getState().setFormSubmitting(false);
    expect(useRuntimeStore.getState().formState.submitting).toBe(false);
  });
});

// ─── Query Results ───────────────────────────────────────────────

describe('runtimeStore: queryResults', () => {
  it('starts with empty queryResults', () => {
    expect(useRuntimeStore.getState().queryResults).toEqual({});
  });

  it('sets a query result', () => {
    useRuntimeStore.getState().setQueryResult('users', {
      data: [{ id: 1, name: 'Alice' }],
      loading: false,
      error: null,
    });
    const qr = useRuntimeStore.getState().queryResults.users;
    expect(qr.data).toHaveLength(1);
    expect(qr.loading).toBe(false);
    expect(qr.error).toBeNull();
  });

  it('overwrites query result on update', () => {
    useRuntimeStore.getState().setQueryResult('users', {
      data: [],
      loading: true,
      error: null,
    });
    useRuntimeStore.getState().setQueryResult('users', {
      data: [{ id: 1 }],
      loading: false,
      error: null,
    });
    expect(useRuntimeStore.getState().queryResults.users.loading).toBe(false);
    expect(useRuntimeStore.getState().queryResults.users.data).toHaveLength(1);
  });
});

// ─── Reset ───────────────────────────────────────────────────────

describe('runtimeStore: reset', () => {
  it('resets all state to initial values', () => {
    // Populate everything
    useRuntimeStore.getState().setComponentValue('input1', 'hello');
    useRuntimeStore.getState().setVariable('count', 5);
    useRuntimeStore.getState().triggerFormValidation();
    useRuntimeStore.getState().setFieldError('input1', 'error');
    useRuntimeStore.getState().setQueryResult('users', { data: [], loading: false, error: null });
    useRuntimeStore.getState().initializeVariables(
      [{ id: 'v1', name: 'count', type: AppVariableType.NUMBER, initialValue: 0 }],
      { count: 5 }
    );

    // Reset
    useRuntimeStore.getState().reset();

    const state = useRuntimeStore.getState();
    expect(state.componentValues).toEqual({});
    expect(state.variableState).toEqual({});
    expect(state.formState.validationTrigger).toBe(0);
    expect(state.formState.fieldErrors).toEqual({});
    expect(state.formState.submitting).toBe(false);
    expect(state.queryResults).toEqual({});
    expect(state._variableDefinitions).toEqual([]);
  });
});
