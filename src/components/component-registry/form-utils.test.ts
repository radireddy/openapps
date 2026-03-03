import { coerceToBoolean, parseOpacity, evaluateCustomValidator } from '@/components/component-registry/form-utils';
import { safeEval } from '@/expressions/engine';

jest.mock('@/expressions/engine', () => ({
  safeEval: jest.fn(),
}));

const mockedSafeEval = safeEval as jest.MockedFunction<typeof safeEval>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('coerceToBoolean', () => {
  it('returns true for string "true"', () => {
    expect(coerceToBoolean('true')).toBe(true);
  });

  it('returns true for string "True"', () => {
    expect(coerceToBoolean('True')).toBe(true);
  });

  it('returns true for string "TRUE"', () => {
    expect(coerceToBoolean('TRUE')).toBe(true);
  });

  it('returns true for string "1"', () => {
    expect(coerceToBoolean('1')).toBe(true);
  });

  it('returns false for string "false"', () => {
    expect(coerceToBoolean('false')).toBe(false);
  });

  it('returns false for string "0"', () => {
    expect(coerceToBoolean('0')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(coerceToBoolean('')).toBe(false);
  });

  it('returns false for random string', () => {
    expect(coerceToBoolean('yes')).toBe(false);
  });

  it('returns true for boolean true', () => {
    expect(coerceToBoolean(true)).toBe(true);
  });

  it('returns false for boolean false', () => {
    expect(coerceToBoolean(false)).toBe(false);
  });

  it('returns false for null', () => {
    expect(coerceToBoolean(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(coerceToBoolean(undefined)).toBe(false);
  });

  it('returns true for non-zero number', () => {
    expect(coerceToBoolean(42)).toBe(true);
  });

  it('returns false for 0', () => {
    expect(coerceToBoolean(0)).toBe(false);
  });

  it('returns true for non-empty object', () => {
    expect(coerceToBoolean({})).toBe(true);
  });

  it('returns true for non-empty array', () => {
    expect(coerceToBoolean([1])).toBe(true);
  });

  it('handles string with whitespace "  true  "', () => {
    expect(coerceToBoolean('  true  ')).toBe(true);
  });

  it('handles string with whitespace "  1  "', () => {
    expect(coerceToBoolean('  1  ')).toBe(true);
  });
});

describe('parseOpacity', () => {
  it('returns 0.6 when component is disabled', () => {
    expect(parseOpacity(1, true)).toBe(0.6);
    expect(parseOpacity(0, true)).toBe(0.6);
    expect(parseOpacity(undefined, true)).toBe(0.6);
  });

  it('returns number value directly when not disabled', () => {
    expect(parseOpacity(0.5, false)).toBe(0.5);
    expect(parseOpacity(1, false)).toBe(1);
    expect(parseOpacity(0, false)).toBe(0);
  });

  it('parses numeric string', () => {
    expect(parseOpacity('0.5', false)).toBe(0.5);
    expect(parseOpacity('1', false)).toBe(1);
  });

  it('returns 1 for empty string', () => {
    expect(parseOpacity('', false)).toBe(1);
  });

  it('returns 1 for whitespace-only string', () => {
    expect(parseOpacity('   ', false)).toBe(1);
  });

  it('returns 1 for non-numeric string', () => {
    expect(parseOpacity('abc', false)).toBe(1);
  });

  it('returns 1 for null', () => {
    expect(parseOpacity(null, false)).toBe(1);
  });

  it('returns 1 for undefined', () => {
    expect(parseOpacity(undefined, false)).toBe(1);
  });

  it('returns 1 for boolean', () => {
    expect(parseOpacity(true, false)).toBe(1);
    expect(parseOpacity(false, false)).toBe(1);
  });

  it('parses string with trailing text (e.g. "0.5px")', () => {
    expect(parseOpacity('0.5px', false)).toBe(0.5);
  });
});

describe('evaluateCustomValidator', () => {
  it('returns empty string for undefined expression', () => {
    expect(evaluateCustomValidator(undefined, 'test', {})).toBe('');
  });

  it('returns empty string for empty string expression', () => {
    expect(evaluateCustomValidator('', 'test', {})).toBe('');
  });

  it('returns empty string for non-string expression', () => {
    expect(evaluateCustomValidator(42 as any, 'test', {})).toBe('');
  });

  it('strips {{ }} wrapper and evaluates', () => {
    mockedSafeEval.mockReturnValue('Error message');
    const result = evaluateCustomValidator('{{validate(value)}}', 'test', { dataStore: {} });
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'validate(value)',
      expect.objectContaining({ value: 'test', dataStore: {} })
    );
    expect(result).toBe('Error message');
  });

  it('evaluates raw expression without {{ }}', () => {
    mockedSafeEval.mockReturnValue('Required');
    const result = evaluateCustomValidator('validate(value)', 'test', {});
    expect(mockedSafeEval).toHaveBeenCalledWith('validate(value)', expect.objectContaining({ value: 'test' }));
    expect(result).toBe('Required');
  });

  it('returns empty string for empty {{ }}', () => {
    const result = evaluateCustomValidator('{{}}', 'test', {});
    expect(result).toBe('');
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('returns empty string when safeEval returns non-string', () => {
    mockedSafeEval.mockReturnValue(42);
    const result = evaluateCustomValidator('{{validate()}}', 'test', {});
    expect(result).toBe('');
  });

  it('returns empty string when safeEval returns null', () => {
    mockedSafeEval.mockReturnValue(null);
    const result = evaluateCustomValidator('{{validate()}}', 'test', {});
    expect(result).toBe('');
  });

  it('returns empty string when safeEval throws', () => {
    mockedSafeEval.mockImplementation(() => { throw new Error('eval error'); });
    const result = evaluateCustomValidator('{{badCode}}', 'test', {});
    expect(result).toBe('');
  });

  it('passes value into the evaluation scope', () => {
    mockedSafeEval.mockReturnValue('');
    evaluateCustomValidator('{{check(value)}}', 'myValue', { custom: 'scope' });
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'check(value)',
      expect.objectContaining({ value: 'myValue', custom: 'scope' })
    );
  });

  it('returns empty string when safeEval returns empty string', () => {
    mockedSafeEval.mockReturnValue('');
    const result = evaluateCustomValidator('{{validate()}}', 'test', {});
    expect(result).toBe('');
  });

  it('returns error string when safeEval returns error string', () => {
    mockedSafeEval.mockReturnValue('This field is required');
    const result = evaluateCustomValidator('{{validate()}}', '', {});
    expect(result).toBe('This field is required');
  });
});
