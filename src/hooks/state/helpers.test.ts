import {
  parsePaddingValue,
  parsePaddingLeftTop,
  parseSizeToNumber,
  getAbsolutePosition,
  isDescendant,
} from '@/hooks/state/helpers';
import { AppComponent, ComponentType } from '@/types';

function makeComponent(
  overrides: Partial<AppComponent> & { id: string; type: ComponentType }
): AppComponent {
  return {
    pageId: 'page1',
    props: { x: 0, y: 0, width: 100, height: 50 } as any,
    ...overrides,
  } as AppComponent;
}

describe('parsePaddingValue', () => {
  it('returns all zeros when padding is undefined', () => {
    expect(parsePaddingValue(undefined)).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
  });

  it('returns all zeros when called with no arguments', () => {
    expect(parsePaddingValue()).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
  });

  it('applies a number uniformly to all sides', () => {
    expect(parsePaddingValue(10)).toEqual({ left: 10, top: 10, right: 10, bottom: 10 });
  });

  it('handles zero as a number', () => {
    expect(parsePaddingValue(0)).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
  });

  it('parses a single-value string uniformly to all sides', () => {
    expect(parsePaddingValue('16')).toEqual({ left: 16, top: 16, right: 16, bottom: 16 });
  });

  it('parses a single-value string with whitespace', () => {
    expect(parsePaddingValue('  8  ')).toEqual({ left: 8, top: 8, right: 8, bottom: 8 });
  });

  it('parses a 2-value string (top/bottom, right/left)', () => {
    expect(parsePaddingValue('10 20')).toEqual({ top: 10, right: 20, bottom: 10, left: 20 });
  });

  it('parses a 4-value string (top, right, bottom, left)', () => {
    expect(parsePaddingValue('1 2 3 4')).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
  });

  it('handles floating point values in a 4-value string', () => {
    expect(parsePaddingValue('1.5 2.5 3.5 4.5')).toEqual({ top: 1.5, right: 2.5, bottom: 3.5, left: 4.5 });
  });

  it('returns all zeros for a 3-value string (unsupported)', () => {
    expect(parsePaddingValue('10 20 30')).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
  });

  it('returns all zeros for a 5-value string (unsupported)', () => {
    expect(parsePaddingValue('1 2 3 4 5')).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
  });

  it('returns all zeros when a single-value string is NaN', () => {
    expect(parsePaddingValue('abc')).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
  });

  it('handles NaN values within a 2-value string', () => {
    expect(parsePaddingValue('abc 20')).toEqual({ top: 0, right: 20, bottom: 0, left: 20 });
  });

  it('handles empty string', () => {
    expect(parsePaddingValue('')).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
  });

  it('handles negative numbers', () => {
    expect(parsePaddingValue(-5)).toEqual({ left: -5, top: -5, right: -5, bottom: -5 });
  });

  it('handles extra internal whitespace', () => {
    expect(parsePaddingValue('10   20')).toEqual({ top: 10, right: 20, bottom: 10, left: 20 });
  });
});

describe('parsePaddingLeftTop', () => {
  it('returns zeros when padding is undefined', () => {
    expect(parsePaddingLeftTop(undefined)).toEqual({ left: 0, top: 0 });
  });

  it('returns zeros when called with no arguments', () => {
    expect(parsePaddingLeftTop()).toEqual({ left: 0, top: 0 });
  });

  it('applies a number uniformly to left and top', () => {
    expect(parsePaddingLeftTop(12)).toEqual({ left: 12, top: 12 });
  });

  it('handles zero as a number', () => {
    expect(parsePaddingLeftTop(0)).toEqual({ left: 0, top: 0 });
  });

  it('parses a single-value string', () => {
    expect(parsePaddingLeftTop('8')).toEqual({ left: 8, top: 8 });
  });

  it('parses a 2-value string (top, left)', () => {
    expect(parsePaddingLeftTop('10 20')).toEqual({ top: 10, left: 20 });
  });

  it('parses a 4-value string, extracting top and left', () => {
    expect(parsePaddingLeftTop('1 2 3 4')).toEqual({ top: 1, left: 4 });
  });

  it('returns zeros for a 3-value string (unsupported)', () => {
    expect(parsePaddingLeftTop('10 20 30')).toEqual({ left: 0, top: 0 });
  });

  it('returns zeros when a single-value string is NaN', () => {
    expect(parsePaddingLeftTop('abc')).toEqual({ left: 0, top: 0 });
  });

  it('handles empty string', () => {
    expect(parsePaddingLeftTop('')).toEqual({ left: 0, top: 0 });
  });

  it('handles floating point values in a 4-value string', () => {
    expect(parsePaddingLeftTop('1.5 2.5 3.5 4.5')).toEqual({ top: 1.5, left: 4.5 });
  });
});

describe('parseSizeToNumber', () => {
  it('returns the number directly', () => {
    expect(parseSizeToNumber(400)).toBe(400);
  });

  it('returns 0 for the number 0', () => {
    expect(parseSizeToNumber(0)).toBe(0);
  });

  it('handles negative numbers', () => {
    expect(parseSizeToNumber(-10)).toBe(-10);
  });

  it('handles floating point numbers', () => {
    expect(parseSizeToNumber(3.14)).toBe(3.14);
  });

  it('parses "400px"', () => {
    expect(parseSizeToNumber('400px')).toBe(400);
  });

  it('parses "50%"', () => {
    expect(parseSizeToNumber('50%')).toBe(50);
  });

  it('parses plain numeric string "400"', () => {
    expect(parseSizeToNumber('400')).toBe(400);
  });

  it('parses "12.5em"', () => {
    expect(parseSizeToNumber('12.5em')).toBe(12.5);
  });

  it('returns 0 for empty string', () => {
    expect(parseSizeToNumber('')).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(parseSizeToNumber('   ')).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(parseSizeToNumber(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(parseSizeToNumber(undefined)).toBe(0);
  });

  it('returns 0 for "auto"', () => {
    expect(parseSizeToNumber('auto')).toBe(0);
  });

  it('returns 0 for a boolean', () => {
    expect(parseSizeToNumber(true)).toBe(0);
  });

  it('returns 0 for an object', () => {
    expect(parseSizeToNumber({})).toBe(0);
  });

  it('returns NaN directly when given NaN', () => {
    expect(parseSizeToNumber(NaN)).toBeNaN();
  });

  it('parses leading numeric value from "100vh"', () => {
    expect(parseSizeToNumber('100vh')).toBe(100);
  });

  it('handles leading whitespace in "  200px"', () => {
    expect(parseSizeToNumber('  200px')).toBe(200);
  });
});

describe('getAbsolutePosition', () => {
  it('returns component own position when no parent', () => {
    const components = [
      makeComponent({ id: 'a', type: ComponentType.BUTTON, props: { x: 50, y: 60, width: 100, height: 40 } as any }),
    ];
    expect(getAbsolutePosition('a', components)).toEqual({ x: 50, y: 60 });
  });

  it('returns {0,0} when component not found', () => {
    expect(getAbsolutePosition('missing', [])).toEqual({ x: 0, y: 0 });
  });

  it('accumulates parent position for nested component', () => {
    const components = [
      makeComponent({ id: 'parent', type: ComponentType.BUTTON, props: { x: 100, y: 200, width: 300, height: 300 } as any }),
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'parent', props: { x: 10, y: 20, width: 80, height: 40 } as any }),
    ];
    expect(getAbsolutePosition('child', components)).toEqual({ x: 110, y: 220 });
  });

  it('accumulates through deeply nested components', () => {
    const components = [
      makeComponent({ id: 'gp', type: ComponentType.BUTTON, props: { x: 10, y: 10, width: 500, height: 500 } as any }),
      makeComponent({ id: 'p', type: ComponentType.BUTTON, parentId: 'gp', props: { x: 20, y: 20, width: 400, height: 400 } as any }),
      makeComponent({ id: 'c', type: ComponentType.BUTTON, parentId: 'p', props: { x: 5, y: 5, width: 50, height: 50 } as any }),
    ];
    expect(getAbsolutePosition('c', components)).toEqual({ x: 35, y: 35 });
  });

  it('adds CONTAINER parent padding to absolute position', () => {
    const components = [
      makeComponent({ id: 'container', type: ComponentType.CONTAINER, props: { x: 100, y: 100, width: 400, height: 400, padding: '10 20 30 40' } as any }),
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'container', props: { x: 5, y: 5, width: 80, height: 40 } as any }),
    ];
    // child(5,5) + container(100,100) + padding(left=40, top=10)
    expect(getAbsolutePosition('child', components)).toEqual({ x: 145, y: 115 });
  });

  it('adds LIST parent padding to absolute position', () => {
    const components = [
      makeComponent({ id: 'list', type: ComponentType.LIST, props: { x: 50, y: 50, width: 300, height: 300, padding: 15 } as any }),
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'list', props: { x: 10, y: 10, width: 80, height: 40 } as any }),
    ];
    expect(getAbsolutePosition('child', components)).toEqual({ x: 75, y: 75 });
  });

  it('does not add padding for non-container parent types', () => {
    const components = [
      makeComponent({ id: 'parent', type: ComponentType.BUTTON, props: { x: 100, y: 100, width: 200, height: 200, padding: '20' } as any }),
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'parent', props: { x: 5, y: 5, width: 80, height: 40 } as any }),
    ];
    expect(getAbsolutePosition('child', components)).toEqual({ x: 105, y: 105 });
  });

  it('handles nested containers each with padding', () => {
    const components = [
      makeComponent({ id: 'outer', type: ComponentType.CONTAINER, props: { x: 10, y: 10, width: 500, height: 500, padding: '5' } as any }),
      makeComponent({ id: 'inner', type: ComponentType.CONTAINER, parentId: 'outer', props: { x: 20, y: 20, width: 300, height: 300, padding: '10' } as any }),
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'inner', props: { x: 3, y: 3, width: 80, height: 40 } as any }),
    ];
    expect(getAbsolutePosition('child', components)).toEqual({ x: 48, y: 48 });
  });

  it('detects circular reference when component is its own parent', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const components = [
      makeComponent({ id: 'a', type: ComponentType.BUTTON, parentId: 'a', props: { x: 10, y: 20, width: 80, height: 40 } as any }),
    ];
    const result = getAbsolutePosition('a', components);
    expect(result).toEqual({ x: 10, y: 20 });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Circular parent reference'));
    warnSpy.mockRestore();
  });

  it('detects circular reference in parent cycle', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const components = [
      makeComponent({ id: 'a', type: ComponentType.BUTTON, parentId: 'b', props: { x: 10, y: 10, width: 80, height: 40 } as any }),
      makeComponent({ id: 'b', type: ComponentType.BUTTON, parentId: 'a', props: { x: 20, y: 20, width: 100, height: 50 } as any }),
    ];
    const result = getAbsolutePosition('a', components);
    expect(result).toEqual({ x: 30, y: 30 });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Circular parent reference'));
    warnSpy.mockRestore();
  });

  it('breaks when parent not found in array', () => {
    const components = [
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'nonexistent', props: { x: 10, y: 20, width: 80, height: 40 } as any }),
    ];
    expect(getAbsolutePosition('child', components)).toEqual({ x: 10, y: 20 });
  });
});

describe('isDescendant', () => {
  it('returns true for a direct child', () => {
    const components = [
      makeComponent({ id: 'parent', type: ComponentType.CONTAINER }),
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'parent' }),
    ];
    expect(isDescendant('child', 'parent', components)).toBe(true);
  });

  it('returns true for a grandchild', () => {
    const components = [
      makeComponent({ id: 'gp', type: ComponentType.CONTAINER }),
      makeComponent({ id: 'p', type: ComponentType.CONTAINER, parentId: 'gp' }),
      makeComponent({ id: 'c', type: ComponentType.BUTTON, parentId: 'p' }),
    ];
    expect(isDescendant('c', 'gp', components)).toBe(true);
  });

  it('returns true for deeply nested descendant', () => {
    const components = [
      makeComponent({ id: 'a', type: ComponentType.CONTAINER }),
      makeComponent({ id: 'b', type: ComponentType.CONTAINER, parentId: 'a' }),
      makeComponent({ id: 'c', type: ComponentType.CONTAINER, parentId: 'b' }),
      makeComponent({ id: 'd', type: ComponentType.BUTTON, parentId: 'c' }),
    ];
    expect(isDescendant('d', 'a', components)).toBe(true);
  });

  it('returns false when not a descendant', () => {
    const components = [
      makeComponent({ id: 'containerA', type: ComponentType.CONTAINER }),
      makeComponent({ id: 'containerB', type: ComponentType.CONTAINER }),
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'containerA' }),
    ];
    expect(isDescendant('child', 'containerB', components)).toBe(false);
  });

  it('returns false when childId not found', () => {
    const components = [makeComponent({ id: 'parent', type: ComponentType.CONTAINER })];
    expect(isDescendant('nonexistent', 'parent', components)).toBe(false);
  });

  it('returns false when child has no parentId', () => {
    const components = [
      makeComponent({ id: 'a', type: ComponentType.CONTAINER }),
      makeComponent({ id: 'b', type: ComponentType.BUTTON }),
    ];
    expect(isDescendant('b', 'a', components)).toBe(false);
  });

  it('returns false for same component', () => {
    const components = [makeComponent({ id: 'a', type: ComponentType.CONTAINER })];
    expect(isDescendant('a', 'a', components)).toBe(false);
  });

  it('handles circular references without infinite recursion', () => {
    const components = [
      makeComponent({ id: 'a', type: ComponentType.CONTAINER, parentId: 'b' }),
      makeComponent({ id: 'b', type: ComponentType.CONTAINER, parentId: 'a' }),
    ];
    expect(isDescendant('a', 'c', components)).toBe(false);
  });

  it('handles circular reference where target parent is in cycle', () => {
    const components = [
      makeComponent({ id: 'a', type: ComponentType.CONTAINER, parentId: 'b' }),
      makeComponent({ id: 'b', type: ComponentType.CONTAINER, parentId: 'a' }),
    ];
    expect(isDescendant('a', 'b', components)).toBe(true);
  });

  it('returns false when parent chain leads to missing component', () => {
    const components = [
      makeComponent({ id: 'child', type: ComponentType.BUTTON, parentId: 'missing' }),
    ];
    expect(isDescendant('child', 'target', components)).toBe(false);
  });

  it('returns false with empty components array', () => {
    expect(isDescendant('a', 'b', [])).toBe(false);
  });
});
