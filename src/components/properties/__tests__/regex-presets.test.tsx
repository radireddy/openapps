/**
 * Regex Presets Tests (IMP-005)
 *
 * Tests that the input schema includes regex presets for the pattern property,
 * and that the presets field is correctly typed in the PropertyMetadata interface.
 */

import { describe, it, expect } from '@jest/globals';
import { inputSchema } from '../schemas/input';

describe('Regex presets in Input schema (IMP-005)', () => {
  it('pattern property includes preset definitions', () => {
    const patternProp = inputSchema.properties.find(p => p.id === 'pattern');
    expect(patternProp).toBeDefined();
    expect(patternProp!.presets).toBeDefined();
    expect(Array.isArray(patternProp!.presets)).toBe(true);
    expect(patternProp!.presets!.length).toBeGreaterThan(0);
  });

  it('includes Email, Phone, URL, Alphanumeric, Numbers only, and Letters only presets', () => {
    const patternProp = inputSchema.properties.find(p => p.id === 'pattern');
    const presetLabels = patternProp!.presets!.map(p => p.label);
    expect(presetLabels).toContain('Email');
    expect(presetLabels).toContain('Phone');
    expect(presetLabels).toContain('URL');
    expect(presetLabels).toContain('Alphanumeric');
    expect(presetLabels).toContain('Numbers only');
    expect(presetLabels).toContain('Letters only');
  });

  it('each preset has a non-empty label and value', () => {
    const patternProp = inputSchema.properties.find(p => p.id === 'pattern');
    patternProp!.presets!.forEach(preset => {
      expect(preset.label).toBeTruthy();
      expect(preset.value).toBeTruthy();
      expect(typeof preset.label).toBe('string');
      expect(typeof preset.value).toBe('string');
    });
  });

  it('preset regex values are valid regular expressions', () => {
    const patternProp = inputSchema.properties.find(p => p.id === 'pattern');
    patternProp!.presets!.forEach(preset => {
      expect(() => new RegExp(preset.value)).not.toThrow();
    });
  });

  it('Email preset regex validates typical email addresses', () => {
    const patternProp = inputSchema.properties.find(p => p.id === 'pattern');
    const emailPreset = patternProp!.presets!.find(p => p.label === 'Email');
    const regex = new RegExp(emailPreset!.value);
    expect(regex.test('user@example.com')).toBe(true);
    expect(regex.test('not-an-email')).toBe(false);
  });

  it('Numbers only preset regex validates digit strings', () => {
    const patternProp = inputSchema.properties.find(p => p.id === 'pattern');
    const numbersPreset = patternProp!.presets!.find(p => p.label === 'Numbers only');
    const regex = new RegExp(numbersPreset!.value);
    expect(regex.test('12345')).toBe(true);
    expect(regex.test('abc')).toBe(false);
  });

  it('Phone preset matches formatted phone numbers including long US format', () => {
    const patternProp = inputSchema.properties.find(p => p.id === 'pattern');
    const phonePreset = patternProp!.presets!.find(p => p.label === 'Phone');
    const regex = new RegExp(phonePreset!.value);
    expect(regex.test('+1 (415) 555-0198')).toBe(true);   // 18 chars — BUG-F001
    expect(regex.test('555-0198')).toBe(true);              // 8 chars
    expect(regex.test('+44 20 7946 0958')).toBe(true);     // 16 chars
    expect(regex.test('1234567')).toBe(true);               // minimum 7 chars
    expect(regex.test('12345')).toBe(false);                // too short
    expect(regex.test('')).toBe(false);                     // empty
  });

  it('properties without presets do not have the presets field', () => {
    const valueProp = inputSchema.properties.find(p => p.id === 'value');
    expect(valueProp).toBeDefined();
    expect(valueProp!.presets).toBeUndefined();
  });
});
