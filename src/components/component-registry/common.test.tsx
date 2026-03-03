import { buildSpacingStyles, parsePadding, buildBorderStyles } from '@/components/component-registry/common';
import { BorderProps } from '@/types';

describe('buildSpacingStyles', () => {
  it('returns empty object when no padding or margin provided', () => {
    expect(buildSpacingStyles()).toEqual({});
  });

  it('converts numeric padding to px string', () => {
    expect(buildSpacingStyles(10)).toEqual({ padding: '10px' });
  });

  it('passes string padding through directly', () => {
    expect(buildSpacingStyles('8px 16px')).toEqual({ padding: '8px 16px' });
  });

  it('converts numeric margin to px string', () => {
    expect(buildSpacingStyles(undefined, 20)).toEqual({ margin: '20px' });
  });

  it('passes string margin through directly', () => {
    expect(buildSpacingStyles(undefined, '4px 8px 12px 16px')).toEqual({ margin: '4px 8px 12px 16px' });
  });

  it('handles both padding and margin together', () => {
    expect(buildSpacingStyles(10, 20)).toEqual({ padding: '10px', margin: '20px' });
  });

  it('handles zero padding (falsy but defined)', () => {
    // 0 converts to "0px" which is falsy string "" -> no, "0px" is truthy
    expect(buildSpacingStyles(0)).toEqual({ padding: '0px' });
  });

  it('handles empty string padding (falsy)', () => {
    expect(buildSpacingStyles('')).toEqual({});
  });

  it('handles empty string margin (falsy)', () => {
    expect(buildSpacingStyles(undefined, '')).toEqual({});
  });
});

describe('parsePadding', () => {
  it('returns {left: 0, top: 0} for undefined', () => {
    expect(parsePadding()).toEqual({ left: 0, top: 0 });
  });

  it('returns equal values for numeric input', () => {
    expect(parsePadding(10)).toEqual({ left: 10, top: 10 });
  });

  it('parses single value string (e.g. "10px")', () => {
    expect(parsePadding('10px')).toEqual({ left: 10, top: 10 });
  });

  it('parses single value string without unit', () => {
    expect(parsePadding('15')).toEqual({ left: 15, top: 15 });
  });

  it('parses two-value string (vertical horizontal)', () => {
    expect(parsePadding('10px 20px')).toEqual({ top: 10, left: 20 });
  });

  it('parses four-value string (top right bottom left)', () => {
    expect(parsePadding('10px 20px 30px 40px')).toEqual({ top: 10, left: 40 });
  });

  it('handles three-value string with fallback to {0,0}', () => {
    expect(parsePadding('10px 20px 30px')).toEqual({ left: 0, top: 0 });
  });

  it('handles NaN values gracefully', () => {
    expect(parsePadding('abc')).toEqual({ left: 0, top: 0 });
  });

  it('handles zero padding', () => {
    expect(parsePadding(0)).toEqual({ left: 0, top: 0 });
  });
});

describe('buildBorderStyles', () => {
  it('returns empty styles for empty borderProps', () => {
    const result = buildBorderStyles({} as BorderProps);
    expect(result).toEqual({});
  });

  it('returns only borderStyle:none when borderStyle is none', () => {
    const result = buildBorderStyles({ borderStyle: 'none' } as BorderProps);
    expect(result).toEqual({ borderStyle: 'none' });
  });

  it('applies borderRadius even when borderStyle is none', () => {
    const result = buildBorderStyles(
      { borderStyle: 'none' } as BorderProps,
      8
    );
    expect(result).toEqual({ borderRadius: '8px', borderStyle: 'none' });
  });

  it('converts numeric borderRadius to px', () => {
    const result = buildBorderStyles({} as BorderProps, 12);
    expect(result).toEqual({ borderRadius: '12px' });
  });

  it('passes string borderRadius through', () => {
    const result = buildBorderStyles({} as BorderProps, '50%');
    expect(result).toEqual({ borderRadius: '50%' });
  });

  it('applies borderStyle and borderColor', () => {
    const result = buildBorderStyles(
      { borderStyle: 'solid' } as BorderProps,
      undefined,
      undefined,
      '#ff0000'
    );
    expect(result).toEqual({
      borderStyle: 'solid',
      borderColor: '#ff0000',
    });
  });

  it('applies unified borderWidth when no individual sides set', () => {
    const result = buildBorderStyles(
      { borderStyle: 'solid' } as BorderProps,
      undefined,
      2,
      '#000'
    );
    expect(result).toEqual({
      borderStyle: 'solid',
      borderColor: '#000',
      borderWidth: '2px',
    });
  });

  it('applies string borderWidth directly', () => {
    const result = buildBorderStyles(
      { borderStyle: 'dashed' } as BorderProps,
      undefined,
      '3px',
    );
    expect(result).toEqual({
      borderStyle: 'dashed',
      borderWidth: '3px',
    });
  });

  it('applies individual border sides overriding unified width', () => {
    const result = buildBorderStyles(
      { borderStyle: 'solid' } as BorderProps,
      undefined,
      2,
      '#000',
      1,        // borderTop
      undefined,
      3,        // borderBottom
      undefined
    );
    expect(result.borderTop).toBe('1px');
    expect(result.borderBottom).toBe('3px');
    expect(result.borderWidth).toBeUndefined();
  });

  it('sets default borderStyle solid when individual sides used without explicit style', () => {
    const result = buildBorderStyles(
      {} as BorderProps,
      undefined,
      undefined,
      undefined,
      1
    );
    expect(result.borderStyle).toBe('solid');
    expect(result.borderColor).toBe('#e5e7eb');
    expect(result.borderTop).toBe('1px');
  });

  it('passes string individual border values through', () => {
    const result = buildBorderStyles(
      { borderStyle: 'solid' } as BorderProps,
      undefined,
      undefined,
      '#000',
      '2px solid red',
      undefined,
      undefined,
      '1px dashed blue'
    );
    expect(result.borderTop).toBe('2px solid red');
    expect(result.borderLeft).toBe('1px dashed blue');
  });

  it('handles all individual sides together', () => {
    const result = buildBorderStyles(
      { borderStyle: 'solid' } as BorderProps,
      4,
      undefined,
      '#333',
      1, 2, 3, 4
    );
    expect(result.borderRadius).toBe('4px');
    expect(result.borderStyle).toBe('solid');
    expect(result.borderColor).toBe('#333');
    expect(result.borderTop).toBe('1px');
    expect(result.borderRight).toBe('2px');
    expect(result.borderBottom).toBe('3px');
    expect(result.borderLeft).toBe('4px');
  });
});
