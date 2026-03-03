import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  parseInitialValue,
  addVariableToState,
  updateVariableInState,
  deleteVariableFromState,
  initializeVariableState,
} from '@/hooks/state/variableOperations';
import { AppDefinition, AppVariable } from '@/types';

const mockTheme = {
  colors: { primary: '#000', onPrimary: '#fff', secondary: '#000', onSecondary: '#fff', background: '#fff', surface: '#fff', text: '#000', border: '#e5e5e5' },
  font: { family: 'Arial' },
  border: { width: '1px', style: 'solid' },
  radius: { default: '4px' },
  spacing: { sm: '4px', md: '8px', lg: '16px' },
};

const makeState = (variables: AppVariable[] = []): AppDefinition => ({
  id: 'app1',
  name: 'Test App',
  createdAt: '',
  lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: [],
  dataStore: {},
  variables,
  theme: mockTheme,
});

const makeVariable = (overrides: Partial<AppVariable> = {}): AppVariable => ({
  id: 'var_1',
  name: 'testVar',
  type: 'string',
  initialValue: '',
  ...overrides,
});

describe('variableOperations', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // ─── parseInitialValue ───────────────────────────────────────────────────────

  describe('parseInitialValue', () => {

    // ── string type ──────────────────────────────────────────────────────────

    describe('string type', () => {
      it('returns the string as-is for a normal string value', () => {
        expect(parseInitialValue('hello', 'string')).toBe('hello');
      });

      it('returns an empty string for an empty string', () => {
        expect(parseInitialValue('', 'string')).toBe('');
      });

      it('converts null to empty string', () => {
        expect(parseInitialValue(null, 'string')).toBe('');
      });

      it('converts undefined to empty string', () => {
        expect(parseInitialValue(undefined, 'string')).toBe('');
      });

      it('converts a number to its string representation', () => {
        expect(parseInitialValue(42, 'string')).toBe('42');
      });

      it('converts boolean true to "true"', () => {
        expect(parseInitialValue(true, 'string')).toBe('true');
      });

      it('converts boolean false to "false"', () => {
        expect(parseInitialValue(false, 'string')).toBe('false');
      });

      it('converts zero to "0"', () => {
        expect(parseInitialValue(0, 'string')).toBe('0');
      });
    });

    // ── number type ──────────────────────────────────────────────────────────

    describe('number type', () => {
      it('returns a number value directly', () => {
        expect(parseInitialValue(42, 'number')).toBe(42);
      });

      it('parses a numeric string', () => {
        expect(parseInitialValue('123', 'number')).toBe(123);
      });

      it('parses a floating point string', () => {
        expect(parseInitialValue('3.14', 'number')).toBe(3.14);
      });

      it('returns 0 for null', () => {
        expect(parseInitialValue(null, 'number')).toBe(0);
      });

      it('returns 0 for undefined', () => {
        expect(parseInitialValue(undefined, 'number')).toBe(0);
      });

      it('returns NaN for a non-numeric string', () => {
        expect(parseInitialValue('abc', 'number')).toBeNaN();
      });

      it('returns 0 for zero value', () => {
        expect(parseInitialValue(0, 'number')).toBe(0);
      });

      it('handles negative numbers', () => {
        expect(parseInitialValue(-5, 'number')).toBe(-5);
      });

      it('parses a negative numeric string', () => {
        expect(parseInitialValue('-10', 'number')).toBe(-10);
      });
    });

    // ── boolean type ─────────────────────────────────────────────────────────

    describe('boolean type', () => {
      it('returns true for string "true"', () => {
        expect(parseInitialValue('true', 'boolean')).toBe(true);
      });

      it('returns true for boolean true', () => {
        expect(parseInitialValue(true, 'boolean')).toBe(true);
      });

      it('returns true for string "True"', () => {
        expect(parseInitialValue('True', 'boolean')).toBe(true);
      });

      it('returns false for string "false"', () => {
        expect(parseInitialValue('false', 'boolean')).toBe(false);
      });

      it('returns false for boolean false', () => {
        expect(parseInitialValue(false, 'boolean')).toBe(false);
      });

      it('returns false for numeric 0', () => {
        expect(parseInitialValue(0, 'boolean')).toBe(false);
      });

      it('returns false for numeric 1 (only exact matches are truthy)', () => {
        expect(parseInitialValue(1, 'boolean')).toBe(false);
      });

      it('returns false for null', () => {
        expect(parseInitialValue(null, 'boolean')).toBe(false);
      });

      it('returns false for undefined', () => {
        expect(parseInitialValue(undefined, 'boolean')).toBe(false);
      });

      it('returns false for an arbitrary string', () => {
        expect(parseInitialValue('yes', 'boolean')).toBe(false);
      });

      it('returns false for string "TRUE" (only "true" and "True" match)', () => {
        expect(parseInitialValue('TRUE', 'boolean')).toBe(false);
      });
    });

    // ── object type ──────────────────────────────────────────────────────────

    describe('object type', () => {
      it('returns an already-plain-object value directly', () => {
        const obj = { key: 'value' };
        expect(parseInitialValue(obj, 'object')).toBe(obj);
      });

      it('returns a nested object directly', () => {
        const obj = { a: { b: 1 }, c: [1, 2] };
        expect(parseInitialValue(obj, 'object')).toBe(obj);
      });

      it('parses a valid JSON object string', () => {
        expect(parseInitialValue('{"key":"value"}', 'object')).toEqual({ key: 'value' });
      });

      it('parses a JSON object string with whitespace', () => {
        expect(parseInitialValue('  { "key": "value" }  ', 'object')).toEqual({ key: 'value' });
      });

      it('returns {} for an empty string', () => {
        expect(parseInitialValue('', 'object')).toEqual({});
      });

      it('returns {} for a whitespace-only string', () => {
        expect(parseInitialValue('   ', 'object')).toEqual({});
      });

      it('returns {} for invalid JSON string (falls to error handler)', () => {
        expect(parseInitialValue('not json', 'object')).toEqual({});
      });

      it('returns {} for null', () => {
        expect(parseInitialValue(null, 'object')).toEqual({});
      });

      it('returns {} for undefined', () => {
        expect(parseInitialValue(undefined, 'object')).toEqual({});
      });

      it('returns {} for a number value', () => {
        expect(parseInitialValue(42, 'object')).toEqual({});
      });

      it('returns {} for boolean value', () => {
        expect(parseInitialValue(true, 'object')).toEqual({});
      });

      it('does not treat an array as an object', () => {
        expect(parseInitialValue([1, 2], 'object')).toEqual({});
      });

      it('extracts JSON object from dirty string with leading/trailing whitespace', () => {
        const dirty = '\n  {"name": "test"}\n';
        expect(parseInitialValue(dirty, 'object')).toEqual({ name: 'test' });
      });

      it('extracts JSON from string with extra content via regex match', () => {
        const dirty = '  {"a":1}  ;';
        expect(parseInitialValue(dirty, 'object')).toEqual({ a: 1 });
      });
    });

    // ── array type ───────────────────────────────────────────────────────────

    describe('array type', () => {
      it('returns an already-array value directly', () => {
        const arr = [1, 2, 3];
        expect(parseInitialValue(arr, 'array')).toBe(arr);
      });

      it('returns a nested array directly', () => {
        const arr = [[1, 2], [3, 4]];
        expect(parseInitialValue(arr, 'array')).toBe(arr);
      });

      it('parses a valid JSON array string', () => {
        expect(parseInitialValue('[1, 2, 3]', 'array')).toEqual([1, 2, 3]);
      });

      it('parses a JSON array of strings', () => {
        expect(parseInitialValue('["a", "b"]', 'array')).toEqual(['a', 'b']);
      });

      it('parses a JSON array string with surrounding whitespace', () => {
        expect(parseInitialValue('  [1, 2, 3]  ', 'array')).toEqual([1, 2, 3]);
      });

      it('returns [] for an empty string', () => {
        expect(parseInitialValue('', 'array')).toEqual([]);
      });

      it('returns [] for a whitespace-only string', () => {
        expect(parseInitialValue('   ', 'array')).toEqual([]);
      });

      it('returns [] for invalid JSON string (falls to error handler)', () => {
        expect(parseInitialValue('not json', 'array')).toEqual([]);
      });

      it('returns [] for null', () => {
        expect(parseInitialValue(null, 'array')).toEqual([]);
      });

      it('returns [] for undefined', () => {
        expect(parseInitialValue(undefined, 'array')).toEqual([]);
      });

      it('returns [] for a number value', () => {
        expect(parseInitialValue(42, 'array')).toEqual([]);
      });

      it('returns [] for boolean value', () => {
        expect(parseInitialValue(true, 'array')).toEqual([]);
      });

      it('extracts array from dirty string with trailing semicolon via bracket matching', () => {
        const dirty = '[1, 2, 3];';
        expect(parseInitialValue(dirty, 'array')).toEqual([1, 2, 3]);
      });

      it('extracts array from string with leading text via bracket matching', () => {
        const dirty = 'var x = [1, 2, 3]';
        expect(parseInitialValue(dirty, 'array')).toEqual([1, 2, 3]);
      });

      it('handles nested arrays in bracket matching extraction', () => {
        const dirty = 'data: [[1, 2], [3, 4]];';
        expect(parseInitialValue(dirty, 'array')).toEqual([[1, 2], [3, 4]]);
      });

      it('handles array with nested objects in bracket matching extraction', () => {
        const dirty = 'items = [{"a": 1}, {"b": 2}];';
        expect(parseInitialValue(dirty, 'array')).toEqual([{ a: 1 }, { b: 2 }]);
      });

      it('returns [] when bracket matching finds no brackets', () => {
        expect(parseInitialValue('just some text', 'array')).toEqual([]);
      });
    });

    // ── array_of_objects type ────────────────────────────────────────────────

    describe('array_of_objects type', () => {
      it('returns a valid array of objects directly', () => {
        const arr = [{ a: 1 }, { b: 2 }];
        expect(parseInitialValue(arr, 'array_of_objects')).toBe(arr);
      });

      it('returns [] when array contains non-object items (numbers)', () => {
        expect(parseInitialValue([1, 2, 3], 'array_of_objects')).toEqual([]);
      });

      it('returns [] when array contains mixed object and non-object items', () => {
        expect(parseInitialValue([{ a: 1 }, 'string', 3], 'array_of_objects')).toEqual([]);
      });

      it('returns [] when array contains nested arrays (arrays are not plain objects)', () => {
        expect(parseInitialValue([[1], [2]], 'array_of_objects')).toEqual([]);
      });

      it('returns [] when array contains null items', () => {
        expect(parseInitialValue([null, { a: 1 }], 'array_of_objects')).toEqual([]);
      });

      it('returns an empty array when given an empty array', () => {
        expect(parseInitialValue([], 'array_of_objects')).toEqual([]);
      });

      it('parses a valid JSON string of array of objects', () => {
        const json = '[{"name": "Alice"}, {"name": "Bob"}]';
        expect(parseInitialValue(json, 'array_of_objects')).toEqual([
          { name: 'Alice' },
          { name: 'Bob' },
        ]);
      });

      it('returns [] when JSON string parses to a non-array value', () => {
        expect(parseInitialValue('{"key": "value"}', 'array_of_objects')).toEqual([]);
      });

      it('returns [] when JSON string parses to array with non-object items', () => {
        expect(parseInitialValue('[1, 2, 3]', 'array_of_objects')).toEqual([]);
      });

      it('returns [] for an empty string', () => {
        expect(parseInitialValue('', 'array_of_objects')).toEqual([]);
      });

      it('returns [] for null', () => {
        expect(parseInitialValue(null, 'array_of_objects')).toEqual([]);
      });

      it('returns [] for undefined', () => {
        expect(parseInitialValue(undefined, 'array_of_objects')).toEqual([]);
      });

      it('extracts valid array of objects from dirty string via bracket matching', () => {
        const dirty = 'data = [{"id": 1}, {"id": 2}];';
        expect(parseInitialValue(dirty, 'array_of_objects')).toEqual([
          { id: 1 },
          { id: 2 },
        ]);
      });

      it('returns [] when bracket-extracted array contains non-object items', () => {
        const dirty = 'data = [1, 2, 3];';
        expect(parseInitialValue(dirty, 'array_of_objects')).toEqual([]);
      });

      it('returns [] when no brackets found in dirty string', () => {
        const dirty = 'not valid at all';
        expect(parseInitialValue(dirty, 'array_of_objects')).toEqual([]);
      });
    });

    // ── default / unknown type ───────────────────────────────────────────────

    describe('default/unknown type', () => {
      it('returns value as-is for an unknown type', () => {
        expect(parseInitialValue('hello', 'unknown' as any)).toBe('hello');
      });

      it('returns null as-is for an unknown type', () => {
        expect(parseInitialValue(null, 'unknown' as any)).toBe(null);
      });
    });

    // ── error handling (safe defaults) ───────────────────────────────────────

    describe('error handling returns safe defaults', () => {
      it('returns {} for object type when regex extraction also fails', () => {
        const problematic = '{ broken json {{{ }}}';
        const result = parseInitialValue(problematic, 'object');
        expect(result).toEqual({});
      });

      it('returns [] for array type when bracket extraction produces invalid JSON', () => {
        const problematic = '[ broken [ array';
        const result = parseInitialValue(problematic, 'array');
        expect(result).toEqual([]);
      });

      it('returns [] for array_of_objects type when bracket extraction produces invalid JSON', () => {
        const problematic = '[ broken [ array';
        const result = parseInitialValue(problematic, 'array_of_objects');
        expect(result).toEqual([]);
      });
    });
  });

  // ─── addVariableToState ──────────────────────────────────────────────────────

  describe('addVariableToState', () => {
    it('adds a variable to a state with no existing variables', () => {
      const state = makeState();
      const variable = makeVariable({ id: 'var_1', name: 'username', type: 'string', initialValue: 'admin' });
      const result = addVariableToState(state, variable);

      expect(result).not.toBeNull();
      expect(result!.variables).toHaveLength(1);
      expect(result!.variables[0]).toEqual(variable);
    });

    it('adds a variable alongside existing variables', () => {
      const existing = makeVariable({ id: 'var_1', name: 'username', type: 'string' });
      const state = makeState([existing]);
      const newVar = makeVariable({ id: 'var_2', name: 'count', type: 'number', initialValue: 0 });
      const result = addVariableToState(state, newVar);

      expect(result).not.toBeNull();
      expect(result!.variables).toHaveLength(2);
      expect(result!.variables[1]).toEqual(newVar);
    });

    it('returns null when adding a variable with a duplicate name', () => {
      const existing = makeVariable({ id: 'var_1', name: 'username', type: 'string' });
      const state = makeState([existing]);
      const duplicate = makeVariable({ id: 'var_2', name: 'username', type: 'number' });
      const result = addVariableToState(state, duplicate);

      expect(result).toBeNull();
    });

    it('does not mutate the original state', () => {
      const state = makeState();
      const variable = makeVariable();
      const originalVariables = state.variables;
      addVariableToState(state, variable);

      expect(state.variables).toBe(originalVariables);
    });

    it('handles state where variables property is undefined', () => {
      const state = makeState();
      delete (state as any).variables;
      const variable = makeVariable({ id: 'var_1', name: 'counter', type: 'number' });
      const result = addVariableToState(state, variable);

      expect(result).not.toBeNull();
      expect(result!.variables).toHaveLength(1);
      expect(result!.variables[0]).toEqual(variable);
    });

    it('preserves existing variables when adding a new one', () => {
      const var1 = makeVariable({ id: 'var_1', name: 'first', type: 'string', initialValue: 'a' });
      const var2 = makeVariable({ id: 'var_2', name: 'second', type: 'number', initialValue: 5 });
      const state = makeState([var1]);
      const result = addVariableToState(state, var2);

      expect(result).not.toBeNull();
      expect(result!.variables[0]).toEqual(var1);
      expect(result!.variables[1]).toEqual(var2);
    });
  });

  // ─── updateVariableInState ───────────────────────────────────────────────────

  describe('updateVariableInState', () => {
    it('updates an existing variable by ID', () => {
      const variable = makeVariable({ id: 'var_1', name: 'username', type: 'string', initialValue: '' });
      const state = makeState([variable]);
      const result = updateVariableInState(state, 'var_1', { initialValue: 'newValue' });

      expect(result.variables[0].initialValue).toBe('newValue');
      expect(result.variables[0].name).toBe('username');
    });

    it('updates multiple fields at once', () => {
      const variable = makeVariable({ id: 'var_1', name: 'count', type: 'number', initialValue: 0 });
      const state = makeState([variable]);
      const result = updateVariableInState(state, 'var_1', { name: 'total', type: 'string', initialValue: '0' });

      expect(result.variables[0].name).toBe('total');
      expect(result.variables[0].type).toBe('string');
      expect(result.variables[0].initialValue).toBe('0');
    });

    it('leaves other variables untouched', () => {
      const var1 = makeVariable({ id: 'var_1', name: 'first', type: 'string', initialValue: 'a' });
      const var2 = makeVariable({ id: 'var_2', name: 'second', type: 'number', initialValue: 10 });
      const state = makeState([var1, var2]);
      const result = updateVariableInState(state, 'var_1', { initialValue: 'updated' });

      expect(result.variables[0].initialValue).toBe('updated');
      expect(result.variables[1]).toEqual(var2);
    });

    it('returns state unchanged when variable ID does not exist', () => {
      const variable = makeVariable({ id: 'var_1', name: 'username', type: 'string' });
      const state = makeState([variable]);
      const result = updateVariableInState(state, 'nonexistent', { initialValue: 'test' });

      expect(result.variables).toHaveLength(1);
      expect(result.variables[0]).toEqual(variable);
    });

    it('does not mutate the original state', () => {
      const variable = makeVariable({ id: 'var_1', name: 'username', type: 'string', initialValue: '' });
      const state = makeState([variable]);
      const originalVariable = state.variables[0];
      updateVariableInState(state, 'var_1', { initialValue: 'changed' });

      expect(state.variables[0].initialValue).toBe('');
      expect(state.variables[0]).toBe(originalVariable);
    });

    it('handles state with undefined variables (produces empty array from map)', () => {
      const state = makeState();
      delete (state as any).variables;
      const result = updateVariableInState(state, 'var_1', { name: 'test' });

      expect(result.variables).toEqual([]);
    });
  });

  // ─── deleteVariableFromState ─────────────────────────────────────────────────

  describe('deleteVariableFromState', () => {
    it('deletes a variable by ID', () => {
      const variable = makeVariable({ id: 'var_1', name: 'username', type: 'string' });
      const state = makeState([variable]);
      const result = deleteVariableFromState(state, 'var_1');

      expect(result.variables).toHaveLength(0);
    });

    it('only removes the targeted variable, leaving others intact', () => {
      const var1 = makeVariable({ id: 'var_1', name: 'first', type: 'string' });
      const var2 = makeVariable({ id: 'var_2', name: 'second', type: 'number' });
      const var3 = makeVariable({ id: 'var_3', name: 'third', type: 'boolean' });
      const state = makeState([var1, var2, var3]);
      const result = deleteVariableFromState(state, 'var_2');

      expect(result.variables).toHaveLength(2);
      expect(result.variables.map(v => v.id)).toEqual(['var_1', 'var_3']);
    });

    it('returns state unchanged when variable ID does not exist', () => {
      const variable = makeVariable({ id: 'var_1', name: 'username', type: 'string' });
      const state = makeState([variable]);
      const result = deleteVariableFromState(state, 'nonexistent');

      expect(result.variables).toHaveLength(1);
      expect(result.variables[0]).toEqual(variable);
    });

    it('does not mutate the original state', () => {
      const variable = makeVariable({ id: 'var_1', name: 'username', type: 'string' });
      const state = makeState([variable]);
      const originalVariables = state.variables;
      deleteVariableFromState(state, 'var_1');

      expect(state.variables).toBe(originalVariables);
      expect(state.variables).toHaveLength(1);
    });

    it('handles state with undefined variables', () => {
      const state = makeState();
      delete (state as any).variables;
      const result = deleteVariableFromState(state, 'var_1');

      expect(result.variables).toEqual([]);
    });
  });

  // ─── initializeVariableState ─────────────────────────────────────────────────

  describe('initializeVariableState', () => {
    it('returns an empty object for an empty variables array', () => {
      expect(initializeVariableState([])).toEqual({});
    });

    it('initializes a single string variable', () => {
      const vars: AppVariable[] = [
        makeVariable({ id: 'v1', name: 'greeting', type: 'string', initialValue: 'hello' }),
      ];
      expect(initializeVariableState(vars)).toEqual({ greeting: 'hello' });
    });

    it('initializes a single number variable', () => {
      const vars: AppVariable[] = [
        makeVariable({ id: 'v1', name: 'count', type: 'number', initialValue: 42 }),
      ];
      expect(initializeVariableState(vars)).toEqual({ count: 42 });
    });

    it('initializes a single boolean variable', () => {
      const vars: AppVariable[] = [
        makeVariable({ id: 'v1', name: 'isActive', type: 'boolean', initialValue: true }),
      ];
      expect(initializeVariableState(vars)).toEqual({ isActive: true });
    });

    it('initializes multiple variables of different types', () => {
      const vars: AppVariable[] = [
        makeVariable({ id: 'v1', name: 'username', type: 'string', initialValue: 'admin' }),
        makeVariable({ id: 'v2', name: 'age', type: 'number', initialValue: 25 }),
        makeVariable({ id: 'v3', name: 'isAdmin', type: 'boolean', initialValue: 'true' }),
        makeVariable({ id: 'v4', name: 'settings', type: 'object', initialValue: '{"theme":"dark"}' }),
        makeVariable({ id: 'v5', name: 'tags', type: 'array', initialValue: '["a","b"]' }),
        makeVariable({
          id: 'v6',
          name: 'users',
          type: 'array_of_objects',
          initialValue: '[{"name":"Alice"}]',
        }),
      ];

      const result = initializeVariableState(vars);

      expect(result).toEqual({
        username: 'admin',
        age: 25,
        isAdmin: true,
        settings: { theme: 'dark' },
        tags: ['a', 'b'],
        users: [{ name: 'Alice' }],
      });
    });

    it('uses parseInitialValue to coerce types correctly', () => {
      const vars: AppVariable[] = [
        makeVariable({ id: 'v1', name: 'count', type: 'number', initialValue: '99' }),
        makeVariable({ id: 'v2', name: 'flag', type: 'boolean', initialValue: 'True' }),
      ];

      const result = initializeVariableState(vars);

      expect(result.count).toBe(99);
      expect(result.flag).toBe(true);
    });

    it('uses variable name as the key in the returned record', () => {
      const vars: AppVariable[] = [
        makeVariable({ id: 'v1', name: 'myVar', type: 'string', initialValue: 'test' }),
      ];
      const result = initializeVariableState(vars);

      expect(result).toHaveProperty('myVar');
      expect(result.myVar).toBe('test');
    });

    it('handles variables with undefined initialValue using safe defaults', () => {
      const vars: AppVariable[] = [
        makeVariable({ id: 'v1', name: 'str', type: 'string', initialValue: undefined }),
        makeVariable({ id: 'v2', name: 'num', type: 'number', initialValue: undefined }),
        makeVariable({ id: 'v3', name: 'bool', type: 'boolean', initialValue: undefined }),
        makeVariable({ id: 'v4', name: 'obj', type: 'object', initialValue: undefined }),
        makeVariable({ id: 'v5', name: 'arr', type: 'array', initialValue: undefined }),
      ];

      const result = initializeVariableState(vars);

      expect(result.str).toBe('');
      expect(result.num).toBe(0);
      expect(result.bool).toBe(false);
      expect(result.obj).toEqual({});
      expect(result.arr).toEqual([]);
    });

    it('later variable with same name overwrites earlier one', () => {
      const vars: AppVariable[] = [
        makeVariable({ id: 'v1', name: 'duplicate', type: 'string', initialValue: 'first' }),
        makeVariable({ id: 'v2', name: 'duplicate', type: 'string', initialValue: 'second' }),
      ];
      const result = initializeVariableState(vars);

      expect(result.duplicate).toBe('second');
    });
  });
});
