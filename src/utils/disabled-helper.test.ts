import { describe, it, expect } from '@jest/globals';
import { evaluateDisabled } from './disabled-helper';

describe('evaluateDisabled', () => {
  const mockScope = { someValue: true, otherValue: false };

  describe('boolean values', () => {
    it('should return true when value is boolean true', () => {
      expect(evaluateDisabled(true, mockScope)).toBe(true);
    });

    it('should return false when value is boolean false', () => {
      expect(evaluateDisabled(false, mockScope)).toBe(false);
    });
  });

  describe('undefined values', () => {
    it('should return false when value is undefined', () => {
      expect(evaluateDisabled(undefined, mockScope)).toBe(false);
    });
  });

  describe('string literal values', () => {
    it('should return true when value is string "true"', () => {
      expect(evaluateDisabled('true', mockScope)).toBe(true);
    });

    it('should return true when value is string "TRUE" (case insensitive)', () => {
      expect(evaluateDisabled('TRUE', mockScope)).toBe(true);
    });

    it('should return false when value is string "false"', () => {
      expect(evaluateDisabled('false', mockScope)).toBe(false);
    });

    it('should return false when value is string "FALSE" (case insensitive)', () => {
      expect(evaluateDisabled('FALSE', mockScope)).toBe(false);
    });

    it('should return false when value is string "false" with whitespace', () => {
      expect(evaluateDisabled(' false ', mockScope)).toBe(false);
    });

    it('should return false for any other string value', () => {
      expect(evaluateDisabled('random string', mockScope)).toBe(false);
      expect(evaluateDisabled('', mockScope)).toBe(false);
      expect(evaluateDisabled('1', mockScope)).toBe(false);
      expect(evaluateDisabled('0', mockScope)).toBe(false);
    });
  });

  describe('expression values', () => {
    it('should evaluate expression that returns true', () => {
      expect(evaluateDisabled('{{ true }}', mockScope)).toBe(true);
      expect(evaluateDisabled('{{ someValue }}', mockScope)).toBe(true);
    });

    it('should evaluate expression that returns false', () => {
      expect(evaluateDisabled('{{ false }}', mockScope)).toBe(false);
      expect(evaluateDisabled('{{ otherValue }}', mockScope)).toBe(false);
    });

    it('should evaluate expression that returns truthy values as true', () => {
      expect(evaluateDisabled('{{ 1 }}', mockScope)).toBe(true);
      expect(evaluateDisabled('{{ "non-empty" }}', mockScope)).toBe(true);
      expect(evaluateDisabled('{{ [1, 2, 3] }}', mockScope)).toBe(true);
    });

    it('should evaluate expression that returns falsy values as false', () => {
      expect(evaluateDisabled('{{ 0 }}', mockScope)).toBe(false);
      expect(evaluateDisabled('{{ "" }}', mockScope)).toBe(false);
      expect(evaluateDisabled('{{ null }}', mockScope)).toBe(false);
      expect(evaluateDisabled('{{ undefined }}', mockScope)).toBe(false);
    });

    it('should return false for empty expression', () => {
      expect(evaluateDisabled('{{ }}', mockScope)).toBe(false);
      expect(evaluateDisabled('{{}}', mockScope)).toBe(false);
    });
  });
});



