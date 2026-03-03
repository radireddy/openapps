import {
  resolvePropertyAtBreakpoint,
  hasExplicitOverride,
  getBreakpointForWidth,
  BREAKPOINT_ORDER,
  BREAKPOINTS,
} from '../breakpoints';
import { ResponsiveOverrides } from '@/types';

describe('resolvePropertyAtBreakpoint', () => {
  it('returns base value for mobile breakpoint', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { width: '100%' },
    };
    expect(resolvePropertyAtBreakpoint(responsive, 200, 'width', 'mobile')).toBe(200);
  });

  it('returns base value when responsive is undefined', () => {
    expect(resolvePropertyAtBreakpoint(undefined, 200, 'width', 'desktop')).toBe(200);
  });

  it('returns tablet override when breakpoint is tablet', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { width: '100%' },
    };
    expect(resolvePropertyAtBreakpoint(responsive, 200, 'width', 'tablet')).toBe('100%');
  });

  it('cascades tablet override to desktop when desktop has no override', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { width: '100%' },
    };
    expect(resolvePropertyAtBreakpoint(responsive, 200, 'width', 'desktop')).toBe('100%');
  });

  it('desktop override wins over tablet override', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { width: '100%' },
      desktop: { width: '50%' },
    };
    expect(resolvePropertyAtBreakpoint(responsive, 200, 'width', 'desktop')).toBe('50%');
  });

  it('cascades through all breakpoints to large', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { fontSize: 18 },
    };
    expect(resolvePropertyAtBreakpoint(responsive, 14, 'fontSize', 'large')).toBe(18);
  });

  it('large override wins over all previous', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { fontSize: 18 },
      desktop: { fontSize: 22 },
      large: { fontSize: 28 },
    };
    expect(resolvePropertyAtBreakpoint(responsive, 14, 'fontSize', 'large')).toBe(28);
  });

  it('returns base value when property is not in any override', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { width: '100%' },
    };
    expect(resolvePropertyAtBreakpoint(responsive, 'red', 'color', 'desktop')).toBe('red');
  });

  it('handles partial overrides correctly', () => {
    const responsive: ResponsiveOverrides = {
      desktop: { gap: 16 },
    };
    // tablet has no override, should get base
    expect(resolvePropertyAtBreakpoint(responsive, 8, 'gap', 'tablet')).toBe(8);
    // desktop has override
    expect(resolvePropertyAtBreakpoint(responsive, 8, 'gap', 'desktop')).toBe(16);
  });
});

describe('hasExplicitOverride', () => {
  it('returns false for mobile breakpoint', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { width: '100%' },
    };
    expect(hasExplicitOverride(responsive, 'width', 'mobile')).toBe(false);
  });

  it('returns true when property has explicit override at breakpoint', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { width: '100%' },
    };
    expect(hasExplicitOverride(responsive, 'width', 'tablet')).toBe(true);
  });

  it('returns false when property is not overridden at breakpoint', () => {
    const responsive: ResponsiveOverrides = {
      tablet: { width: '100%' },
    };
    expect(hasExplicitOverride(responsive, 'width', 'desktop')).toBe(false);
  });

  it('returns false when responsive is undefined', () => {
    expect(hasExplicitOverride(undefined, 'width', 'tablet')).toBe(false);
  });
});

describe('getBreakpointForWidth', () => {
  it('returns mobile for small viewports', () => {
    expect(getBreakpointForWidth(375)).toBe('mobile');
    expect(getBreakpointForWidth(0)).toBe('mobile');
    expect(getBreakpointForWidth(767)).toBe('mobile');
  });

  it('returns tablet for medium viewports', () => {
    expect(getBreakpointForWidth(768)).toBe('tablet');
    expect(getBreakpointForWidth(1024)).toBe('tablet');
    expect(getBreakpointForWidth(1279)).toBe('tablet');
  });

  it('returns desktop for large viewports', () => {
    expect(getBreakpointForWidth(1280)).toBe('desktop');
    expect(getBreakpointForWidth(1535)).toBe('desktop');
  });

  it('returns large for extra large viewports', () => {
    expect(getBreakpointForWidth(1536)).toBe('large');
    expect(getBreakpointForWidth(1920)).toBe('large');
  });
});

describe('BREAKPOINT_ORDER', () => {
  it('is ordered from smallest to largest', () => {
    for (let i = 1; i < BREAKPOINT_ORDER.length; i++) {
      const prev = BREAKPOINTS[BREAKPOINT_ORDER[i - 1]].minWidth;
      const curr = BREAKPOINTS[BREAKPOINT_ORDER[i]].minWidth;
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it('contains all four breakpoints', () => {
    expect(BREAKPOINT_ORDER).toEqual(['mobile', 'tablet', 'desktop', 'large']);
  });
});
