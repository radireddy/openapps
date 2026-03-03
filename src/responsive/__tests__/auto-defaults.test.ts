import { generateAutoResponsiveDefaults, generateBatchAutoDefaults, AutoResponsiveResult } from '../auto-defaults';
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

describe('generateAutoResponsiveDefaults', () => {
  it('returns undefined when no heuristics match', () => {
    const comp = makeComponent({ props: { width: '100%', height: 40, fontSize: 16 } });
    expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
  });

  it('returns undefined for small fixed width (<= 300px)', () => {
    const comp = makeComponent({ props: { width: 200, height: 40 } });
    expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
  });

  describe('container flexDirection row → mobile stacking', () => {
    it('stacks row containers to column on mobile/tablet, restores on desktop', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 'auto', flexDirection: 'row', gap: 8 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.flexDirection).toBe('column');
      expect(result!.responsive?.tablet?.flexDirection).toBe('column');
      expect(result!.responsive?.desktop?.flexDirection).toBe('row');
    });

    it('does not override column containers', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 'auto', flexDirection: 'column' },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });

    it('does not apply to non-container components', () => {
      const comp = makeComponent({
        type: ComponentType.LABEL,
        props: { width: '100%', height: 40, flexDirection: 'row' },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });
  });

  describe('fixed width > 300px → mobile 100%', () => {
    it('sets mobile to 100%, tablet to original for width 301-600px, desktop restores', () => {
      const comp = makeComponent({ props: { width: 400, height: 40 } });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.width).toBe('100%');
      expect(result!.responsive?.tablet?.width).toBe('400px');
      expect(result!.responsive?.desktop?.width).toBe('400px');
    });

    it('sets mobile and tablet to 100% for width > 600px, desktop restores', () => {
      const comp = makeComponent({ props: { width: 800, height: 40 } });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.width).toBe('100%');
      expect(result!.responsive?.tablet?.width).toBe('100%');
      expect(result!.responsive?.desktop?.width).toBe('800px');
    });

    it('handles string px width > 600', () => {
      const comp = makeComponent({ props: { width: '900px', height: 40 } });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.width).toBe('100%');
      expect(result!.responsive?.tablet?.width).toBe('100%');
      expect(result!.responsive?.desktop?.width).toBe('900px');
    });

    it('does not override percentage width', () => {
      const comp = makeComponent({ props: { width: '50%', height: 40 } });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });

    it('does not override expression width', () => {
      const comp = makeComponent({ props: { width: '{{theme.spacing.lg}}', height: 40 } });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });
  });

  describe('flexGrow + width auto → mobile full width', () => {
    it('sets mobile width to 100%, restores auto on desktop', () => {
      const comp = makeComponent({
        props: { width: 'auto', height: 40, flexGrow: 1 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.width).toBe('100%');
      expect(result!.responsive?.desktop?.width).toBe('auto');
    });

    it('does not trigger when flexGrow is 0', () => {
      const comp = makeComponent({
        props: { width: 'auto', height: 40, flexGrow: 0 },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });

    it('does not trigger when width is not auto', () => {
      const comp = makeComponent({
        props: { width: '100%', height: 40, flexGrow: 1 },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });
  });

  describe('font size scaling', () => {
    it('scales very large font (> 32px) to 60% mobile, 80% tablet, original desktop', () => {
      const comp = makeComponent({
        props: { width: '100%', height: 40, fontSize: 40 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.fontSize).toBe('24px'); // 40 * 0.6
      expect(result!.responsive?.tablet?.fontSize).toBe('32px'); // 40 * 0.8
      expect(result!.responsive?.desktop?.fontSize).toBe('40px');
    });

    it('scales medium-large font (20-32px) to 85% mobile, original desktop', () => {
      const comp = makeComponent({
        props: { width: '100%', height: 40, fontSize: 24 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.fontSize).toBe('20px'); // 24 * 0.85 = 20.4 → 20
      expect(result!.responsive?.tablet?.fontSize).toBeUndefined();
      expect(result!.responsive?.desktop?.fontSize).toBe('24px');
    });

    it('does not scale font size <= 20', () => {
      const comp = makeComponent({
        props: { width: '100%', height: 40, fontSize: 20 },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });

    it('does not scale expression-based font size', () => {
      const comp = makeComponent({
        props: { width: '100%', height: 40, fontSize: '{{theme.typography.fontSizeLg}}' },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });
  });

  describe('gap scaling', () => {
    it('scales large gap (> 16px) to 8px mobile, 12px tablet, original desktop', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, gap: 24 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.gap).toBe('8px');
      expect(result!.responsive?.tablet?.gap).toBe('12px');
      expect(result!.responsive?.desktop?.gap).toBe('24px');
    });

    it('scales medium gap (8-16px) to 8px mobile, original desktop', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, gap: 12 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.gap).toBe('8px');
      expect(result!.responsive?.tablet?.gap).toBeUndefined();
      expect(result!.responsive?.desktop?.gap).toBe('12px');
    });

    it('scales string gap > 16px', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, gap: '20px' },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.gap).toBe('8px');
      expect(result!.responsive?.tablet?.gap).toBe('12px');
      expect(result!.responsive?.desktop?.gap).toBe('20px');
    });

    it('does not scale gap <= 8px', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, gap: 8 },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });

    it('does not scale expression gap', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, gap: '{{theme.spacing.md}}' },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });
  });

  describe('padding scaling', () => {
    it('scales large padding (> 16px) to 50% mobile, 75% tablet, original desktop', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, padding: 32 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.padding).toBe('16px'); // 32 * 0.5
      expect(result!.responsive?.tablet?.padding).toBe('24px'); // 32 * 0.75
      expect(result!.responsive?.desktop?.padding).toBe('32px');
    });

    it('scales string px padding', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, padding: '24px' },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.padding).toBe('12px'); // 24 * 0.5
      expect(result!.responsive?.tablet?.padding).toBe('18px'); // 24 * 0.75
      expect(result!.responsive?.desktop?.padding).toBe('24px');
    });

    it('does not scale padding <= 16px', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, padding: 16 },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });

    it('does not scale expression padding', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 200, padding: '{{theme.spacing.lg}}' },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });
  });

  describe('combined heuristics', () => {
    it('combines container stacking with gap and padding scaling', () => {
      const comp = makeComponent({
        type: ComponentType.CONTAINER,
        props: { width: '100%', height: 400, flexDirection: 'row', gap: 24, padding: 32 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();

      // Base: stack + smaller gap + smaller padding
      expect(result!.baseOverrides?.flexDirection).toBe('column');
      expect(result!.baseOverrides?.gap).toBe('8px');
      expect(result!.baseOverrides?.padding).toBe('16px');

      // Tablet: still stacked, medium gap, medium padding
      expect(result!.responsive?.tablet?.flexDirection).toBe('column');
      expect(result!.responsive?.tablet?.gap).toBe('12px');
      expect(result!.responsive?.tablet?.padding).toBe('24px');

      // Desktop: row restored, original gap + padding
      expect(result!.responsive?.desktop?.flexDirection).toBe('row');
      expect(result!.responsive?.desktop?.gap).toBe('24px');
      expect(result!.responsive?.desktop?.padding).toBe('32px');
    });

    it('combines large fixed width with large font size', () => {
      const comp = makeComponent({
        props: { width: 800, height: 60, fontSize: 48 },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();

      expect(result!.baseOverrides?.width).toBe('100%');
      expect(result!.baseOverrides?.fontSize).toBe('29px'); // 48 * 0.6 = 28.8 → 29

      expect(result!.responsive?.tablet?.width).toBe('100%');
      expect(result!.responsive?.tablet?.fontSize).toBe('38px'); // 48 * 0.8 = 38.4 → 38

      expect(result!.responsive?.desktop?.width).toBe('800px');
      expect(result!.responsive?.desktop?.fontSize).toBe('48px');
    });
  });

  describe('images and tables', () => {
    it('does not generate overrides for images with 100% width', () => {
      const comp = makeComponent({
        type: ComponentType.IMAGE,
        props: { width: '100%', height: 200, src: 'test.png' },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });

    it('generates overrides for images with large fixed px width', () => {
      const comp = makeComponent({
        type: ComponentType.IMAGE,
        props: { width: 800, height: 300, src: 'test.png' },
      });
      const result = generateAutoResponsiveDefaults(comp);
      expect(result).toBeDefined();
      expect(result!.baseOverrides?.width).toBe('100%');
      expect(result!.responsive?.desktop?.width).toBe('800px');
    });

    it('does not generate overrides for tables with 100% width', () => {
      const comp = makeComponent({
        type: ComponentType.TABLE,
        props: { width: '100%', height: 300 },
      });
      expect(generateAutoResponsiveDefaults(comp)).toBeUndefined();
    });
  });
});

describe('generateBatchAutoDefaults', () => {
  it('returns a map of component ID to AutoResponsiveResult', () => {
    const comps = [
      makeComponent({ id: 'row1', type: ComponentType.CONTAINER, props: { width: '100%', height: 200, flexDirection: 'row' } }),
      makeComponent({ id: 'small1', props: { width: '100%', height: 40 } }),
      makeComponent({ id: 'bigfont1', props: { width: '100%', height: 40, fontSize: 40 } }),
    ];
    const result = generateBatchAutoDefaults(comps);
    expect(result.size).toBe(2); // row1 and bigfont1
    expect(result.has('row1')).toBe(true);
    expect(result.has('small1')).toBe(false);
    expect(result.has('bigfont1')).toBe(true);

    // Verify result structure
    const rowResult = result.get('row1')!;
    expect(rowResult.baseOverrides?.flexDirection).toBe('column');
    expect(rowResult.responsive?.desktop?.flexDirection).toBe('row');
  });

  it('returns empty map when no heuristics match', () => {
    const comps = [
      makeComponent({ id: 'a', props: { width: '100%', height: 40 } }),
    ];
    const result = generateBatchAutoDefaults(comps);
    expect(result.size).toBe(0);
  });
});
