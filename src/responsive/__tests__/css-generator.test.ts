import {
  generateResponsiveStyles,
  generateMediaQueryCSS,
  generateFluidFontSize,
  generateGlobalBaseStyles,
} from '../css-generator';
import { AppComponent, ComponentType } from '@/types';

function makeComponent(overrides: Partial<AppComponent> = {}): AppComponent {
  return {
    id: 'comp1',
    type: ComponentType.LABEL,
    pageId: 'page1',
    parentId: null,
    props: { width: 200, height: 40 },
    ...overrides,
  } as AppComponent;
}

describe('generateResponsiveStyles', () => {
  it('returns base styles for mobile breakpoint', () => {
    const comp = makeComponent({
      props: { width: 300, height: 50, padding: '8px' } as any,
    });
    const styles = generateResponsiveStyles(comp, 'mobile');
    expect(styles.width).toBe(300);
    expect(styles.height).toBe(50);
    expect(styles.padding).toBe('8px');
  });

  it('applies tablet overrides at tablet breakpoint', () => {
    const comp = makeComponent({
      props: {
        width: 800,
        height: 50,
        responsive: {
          tablet: { width: '100%' },
        },
      } as any,
    });
    const styles = generateResponsiveStyles(comp, 'tablet');
    expect(styles.width).toBe('100%');
    expect(styles.height).toBe(50);
  });

  it('cascades tablet overrides to desktop if no desktop override', () => {
    const comp = makeComponent({
      props: {
        width: 800,
        height: 50,
        responsive: {
          tablet: { width: '100%' },
        },
      } as any,
    });
    const styles = generateResponsiveStyles(comp, 'desktop');
    expect(styles.width).toBe('100%');
  });

  it('desktop overrides take precedence over tablet', () => {
    const comp = makeComponent({
      props: {
        width: 800,
        height: 50,
        responsive: {
          tablet: { width: '100%' },
          desktop: { width: '50%' },
        },
      } as any,
    });
    const styles = generateResponsiveStyles(comp, 'desktop');
    expect(styles.width).toBe('50%');
  });

  it('returns base styles when no responsive overrides', () => {
    const comp = makeComponent({
      props: { width: 400, height: 200 } as any,
    });
    const styles = generateResponsiveStyles(comp, 'desktop');
    expect(styles.width).toBe(400);
  });
});

describe('generateMediaQueryCSS', () => {
  it('returns empty string when no components have responsive overrides', () => {
    const comps = [makeComponent()];
    expect(generateMediaQueryCSS(comps)).toBe('');
  });

  it('generates tablet media query for tablet overrides', () => {
    const comps = [
      makeComponent({
        id: 'btn1',
        props: {
          width: 800,
          responsive: {
            tablet: { width: '100%' },
          },
        } as any,
      }),
    ];
    const css = generateMediaQueryCSS(comps);
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('[data-component-id="btn1"]');
    expect(css).toContain('width: 100%');
  });

  it('generates multiple breakpoint queries', () => {
    const comps = [
      makeComponent({
        id: 'c1',
        props: {
          width: 200,
          responsive: {
            tablet: { width: '100%' },
            desktop: { width: '50%' },
          },
        } as any,
      }),
    ];
    const css = generateMediaQueryCSS(comps);
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('@media (min-width: 1280px)');
  });

  it('converts camelCase properties to kebab-case', () => {
    const comps = [
      makeComponent({
        id: 'c1',
        props: {
          width: 200,
          responsive: {
            tablet: { flexDirection: 'column', justifyContent: 'center' },
          },
        } as any,
      }),
    ];
    const css = generateMediaQueryCSS(comps);
    expect(css).toContain('flex-direction: column');
    expect(css).toContain('justify-content: center');
  });

  it('adds px units to numeric values', () => {
    const comps = [
      makeComponent({
        id: 'c1',
        props: {
          width: 200,
          responsive: {
            tablet: { gap: 16, padding: 8 },
          },
        } as any,
      }),
    ];
    const css = generateMediaQueryCSS(comps);
    expect(css).toContain('gap: 16px');
    expect(css).toContain('padding: 8px');
  });

  it('handles multiple components', () => {
    const comps = [
      makeComponent({
        id: 'a',
        props: { width: 200, responsive: { tablet: { width: '100%' } } } as any,
      }),
      makeComponent({
        id: 'b',
        props: { width: 200, responsive: { tablet: { gap: 8 } } } as any,
      }),
    ];
    const css = generateMediaQueryCSS(comps);
    expect(css).toContain('[data-component-id="a"]');
    expect(css).toContain('[data-component-id="b"]');
  });
});

describe('generateFluidFontSize', () => {
  it('generates a clamp() value', () => {
    const result = generateFluidFontSize(16, 24);
    expect(result).toMatch(/^clamp\(16px,/);
    expect(result).toMatch(/24px\)$/);
  });

  it('includes vw unit in preferred value', () => {
    const result = generateFluidFontSize(14, 28);
    expect(result).toContain('vw');
  });

  it('min equals mobile size', () => {
    const result = generateFluidFontSize(12, 20);
    expect(result).toContain('clamp(12px,');
  });

  it('max equals desktop size', () => {
    const result = generateFluidFontSize(12, 20);
    expect(result).toContain('20px)');
  });
});

describe('generateGlobalBaseStyles', () => {
  it('includes box-sizing rule', () => {
    const css = generateGlobalBaseStyles();
    expect(css).toContain('box-sizing: border-box');
  });

  it('includes responsive image rule', () => {
    const css = generateGlobalBaseStyles();
    expect(css).toContain('max-width: 100%');
  });

  it('includes body margin reset', () => {
    const css = generateGlobalBaseStyles();
    expect(css).toContain('margin: 0');
  });

  it('includes min-height for body', () => {
    const css = generateGlobalBaseStyles();
    expect(css).toContain('min-height: 100dvh');
  });
});
