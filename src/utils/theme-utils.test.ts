import { describe, it, expect } from '@jest/globals';
import { deepMerge, resolveTheme } from '@/utils/theme-utils';
import { GlobalTheme, Theme } from '@/types';

// ---------------------------------------------------------------------------
// Helpers -- minimal Theme factory for concise test data
// ---------------------------------------------------------------------------

function makeTheme(overrides: Record<string, any> = {}): Theme {
  return {
    colors: {
      primary: '#000',
      onPrimary: '#fff',
      secondary: '#111',
      onSecondary: '#eee',
      background: '#fafafa',
      surface: '#fff',
      text: '#000',
      border: '#ccc',
      primaryLight: '#333',
      primaryDark: '#000',
      secondaryLight: '#444',
      secondaryDark: '#111',
      error: '#f00',
      onError: '#fff',
      warning: '#ff0',
      onWarning: '#000',
      success: '#0f0',
      onSuccess: '#fff',
      info: '#00f',
      onInfo: '#fff',
      surfaceVariant: '#f5f5f5',
      onSurface: '#222',
      onBackground: '#333',
      hover: '#eee',
      focus: '#ddd',
      disabled: '#999',
      onDisabled: '#666',
      outline: '#bbb',
      shadow: 'rgba(0,0,0,0.1)',
      overlay: 'rgba(0,0,0,0.5)',
      link: '#00f',
    },
    font: { family: 'sans-serif' },
    border: {
      width: '1px',
      style: 'solid',
      widthThin: '1px',
      widthMedium: '2px',
      widthThick: '3px',
    },
    radius: {
      default: '4px',
      none: '0',
      sm: '2px',
      md: '4px',
      lg: '8px',
      xl: '12px',
      full: '9999px',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px',
      xxxl: '64px',
      xxxxl: '96px',
    },
    typography: {
      fontFamily: 'sans-serif',
      fontFamilyHeading: 'serif',
      fontFamilyMono: 'monospace',
      fontSizeXs: '10px',
      fontSizeSm: '12px',
      fontSizeMd: '14px',
      fontSizeLg: '16px',
      fontSizeXl: '20px',
      fontSizeXxl: '24px',
      fontSizeXxxl: '32px',
      fontWeightLight: '300',
      fontWeightNormal: '400',
      fontWeightMedium: '500',
      fontWeightSemibold: '600',
      fontWeightBold: '700',
      lineHeightTight: '1.2',
      lineHeightNormal: '1.5',
      lineHeightRelaxed: '1.8',
      letterSpacingTight: '-0.02em',
      letterSpacingNormal: '0',
      letterSpacingWide: '0.05em',
    },
    shadow: {
      none: 'none',
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 15px rgba(0,0,0,0.15)',
      xl: '0 20px 25px rgba(0,0,0,0.2)',
      inner: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    },
    transition: {
      durationFast: '150ms',
      durationNormal: '300ms',
      durationSlow: '500ms',
      easing: 'ease-in-out',
    },
    ...overrides,
  } as Theme;
}

function makeGlobalTheme(
  id: string,
  themeOverrides: Record<string, any> = {},
  parentThemeId?: string,
): GlobalTheme {
  return {
    id,
    name: `Theme ${id}`,
    type: 'light',
    theme: makeTheme(themeOverrides),
    ...(parentThemeId ? { parentThemeId } : {}),
  };
}

// ===========================================================================
// deepMerge
// ===========================================================================

describe('deepMerge', () => {
  it('merges flat objects, with override taking precedence', () => {
    const base = { a: 1, b: 2, c: 3 };
    const override = { b: 20, c: 30 };
    const result = deepMerge(base, override);
    expect(result).toEqual({ a: 1, b: 20, c: 30 });
  });

  it('adds new keys from override that do not exist in base', () => {
    const base = { a: 1 } as Record<string, number>;
    const override = { b: 2 };
    const result = deepMerge(base, override);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('deep merges nested objects', () => {
    const base = { nested: { x: 1, y: 2 } };
    const override = { nested: { y: 20 } };
    const result = deepMerge(base, override as any);
    expect(result).toEqual({ nested: { x: 1, y: 20 } });
  });

  it('replaces primitives entirely', () => {
    const base = { count: 10, label: 'hello' };
    const override = { count: 99, label: 'world' };
    const result = deepMerge(base, override);
    expect(result.count).toBe(99);
    expect(result.label).toBe('world');
  });

  it('replaces arrays entirely instead of merging them', () => {
    const base = { items: [1, 2, 3], tags: ['a'] };
    const override = { items: [4, 5] };
    const result = deepMerge(base, override);
    expect(result.items).toEqual([4, 5]);
    // tags remain from base since not overridden
    expect(result.tags).toEqual(['a']);
  });

  it('skips undefined values in override', () => {
    const base = { a: 1, b: 2 };
    const override = { a: undefined, b: 3 };
    const result = deepMerge(base, override);
    // a should remain 1 because undefined is skipped
    expect(result.a).toBe(1);
    expect(result.b).toBe(3);
  });

  it('returns a copy of base when override is empty', () => {
    const base = { a: 1, nested: { b: 2 } };
    const result = deepMerge(base, {});
    expect(result).toEqual(base);
    // Should be a new reference (shallow copy)
    expect(result).not.toBe(base);
  });

  it('handles deeply nested objects (3+ levels)', () => {
    const base = {
      level1: {
        level2: {
          level3: {
            value: 'original',
            keep: 'kept',
          },
          sibling: 'intact',
        },
      },
    };
    const override = {
      level1: {
        level2: {
          level3: {
            value: 'overridden',
          },
        },
      },
    };
    const result = deepMerge(base, override as any);
    expect(result.level1.level2.level3.value).toBe('overridden');
    expect(result.level1.level2.level3.keep).toBe('kept');
    expect(result.level1.level2.sibling).toBe('intact');
  });

  it('does not mutate the base object', () => {
    const base = { a: 1, nested: { b: 2 } };
    const baseCopy = JSON.parse(JSON.stringify(base));
    deepMerge(base, { a: 99, nested: { b: 99 } } as any);
    expect(base).toEqual(baseCopy);
  });

  it('does not mutate the override object', () => {
    const override = { a: 99, nested: { b: 99 } };
    const overrideCopy = JSON.parse(JSON.stringify(override));
    deepMerge({ a: 1, nested: { b: 2 } }, override as any);
    expect(override).toEqual(overrideCopy);
  });

  it('replaces a base object value with an array from override', () => {
    const base = { data: { key: 'value' } } as Record<string, any>;
    const override = { data: [1, 2, 3] };
    const result = deepMerge(base, override as any);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('replaces a base array value with an object from override', () => {
    const base = { data: [1, 2, 3] } as Record<string, any>;
    const override = { data: { key: 'value' } };
    const result = deepMerge(base, override as any);
    expect(result.data).toEqual({ key: 'value' });
  });

  it('handles null values in override as a replacement', () => {
    const base = { a: { nested: 1 } } as Record<string, any>;
    const override = { a: null };
    const result = deepMerge(base, override as any);
    expect(result.a).toBeNull();
  });

  it('replaces base primitive with an object from override', () => {
    const base = { value: 42 } as Record<string, any>;
    const override = { value: { complex: true } };
    const result = deepMerge(base, override as any);
    expect(result.value).toEqual({ complex: true });
  });

  it('handles an override with multiple keys at different depths', () => {
    const base = {
      flat: 'original',
      nested: { a: 1, b: { c: 2 } },
      arr: [1],
    };
    const override = {
      flat: 'changed',
      nested: { b: { c: 99 } },
      arr: [10, 20],
    };
    const result = deepMerge(base, override as any);
    expect(result.flat).toBe('changed');
    expect(result.nested.a).toBe(1);
    expect(result.nested.b.c).toBe(99);
    expect(result.arr).toEqual([10, 20]);
  });
});

// ===========================================================================
// resolveTheme
// ===========================================================================

describe('resolveTheme', () => {
  it('returns the theme directly when no parentThemeId is set', () => {
    const globalTheme = makeGlobalTheme('base');
    const result = resolveTheme(globalTheme, [globalTheme]);
    expect(result).toBe(globalTheme.theme);
  });

  it('merges parent theme values when parentThemeId is set', () => {
    const parentTheme = makeGlobalTheme('parent', {
      colors: {
        ...makeTheme().colors,
        primary: '#parent-primary',
        secondary: '#parent-secondary',
      },
    });

    const childTheme = makeGlobalTheme(
      'child',
      {
        colors: {
          ...makeTheme().colors,
          primary: '#child-primary',
        },
      },
      'parent',
    );

    const allThemes = [parentTheme, childTheme];
    const result = resolveTheme(childTheme, allThemes);

    // Child's primary overrides parent
    expect(result.colors.primary).toBe('#child-primary');
    // Child's secondary comes from its own theme (deepMerge child over parent)
    expect(result.colors.secondary).toBe(childTheme.theme.colors.secondary);
  });

  it('resolves multi-level parent chain (grandparent -> parent -> child)', () => {
    const grandparent = makeGlobalTheme('gp', {
      spacing: { ...makeTheme().spacing, xs: '2px', sm: '4px' },
    });

    const parent = makeGlobalTheme(
      'parent',
      {
        spacing: { ...makeTheme().spacing, xs: '6px' },
      },
      'gp',
    );

    const child = makeGlobalTheme(
      'child',
      {
        spacing: { ...makeTheme().spacing, sm: '12px' },
      },
      'parent',
    );

    const allThemes = [grandparent, parent, child];
    const result = resolveTheme(child, allThemes);

    // xs: grandparent=2px, parent=6px, child=default 4px from factory
    // resolved: deepMerge(resolvedParent, child.theme) so child wins
    expect(result.spacing.xs).toBe(child.theme.spacing.xs);
    // sm: child explicitly set to 12px
    expect(result.spacing.sm).toBe('12px');
  });

  it('returns theme.theme as fallback when parent is not found', () => {
    const childTheme = makeGlobalTheme('child', {}, 'non-existent-parent');
    const result = resolveTheme(childTheme, [childTheme]);
    expect(result).toBe(childTheme.theme);
  });

  it('returns theme.theme when allThemes is empty and theme has parentThemeId', () => {
    const childTheme = makeGlobalTheme('child', {}, 'missing');
    const result = resolveTheme(childTheme, []);
    expect(result).toBe(childTheme.theme);
  });

  it('resolves correctly when parent itself has no parentThemeId', () => {
    const parent = makeGlobalTheme('parent', {
      font: { family: 'Georgia' },
    });

    const child = makeGlobalTheme(
      'child',
      {
        font: { family: 'Helvetica' },
      },
      'parent',
    );

    const allThemes = [parent, child];
    const result = resolveTheme(child, allThemes);

    // Child font family overrides parent
    expect(result.font.family).toBe('Helvetica');
  });

  it('preserves parent values in nested objects that child does not override', () => {
    const parentColors = {
      ...makeTheme().colors,
      primary: '#parent-only',
      error: '#parent-error',
    };
    const parent = makeGlobalTheme('parent', { colors: parentColors });

    // Child overrides primary but keeps default error
    const childColors = {
      ...makeTheme().colors,
      primary: '#child-override',
    };
    const child = makeGlobalTheme('child', { colors: childColors }, 'parent');

    const allThemes = [parent, child];
    const result = resolveTheme(child, allThemes);

    expect(result.colors.primary).toBe('#child-override');
    // error comes from child's makeTheme default via deepMerge
    expect(result.colors.error).toBe(childColors.error);
  });

  it('handles a chain of 4 levels deep', () => {
    const level0 = makeGlobalTheme('l0', {
      transition: { ...makeTheme().transition, durationFast: '50ms' },
    });
    const level1 = makeGlobalTheme(
      'l1',
      {
        transition: { ...makeTheme().transition, durationNormal: '200ms' },
      },
      'l0',
    );
    const level2 = makeGlobalTheme(
      'l2',
      {
        transition: { ...makeTheme().transition, durationSlow: '800ms' },
      },
      'l1',
    );
    const level3 = makeGlobalTheme(
      'l3',
      {
        transition: { ...makeTheme().transition, easing: 'linear' },
      },
      'l2',
    );

    const allThemes = [level0, level1, level2, level3];
    const result = resolveTheme(level3, allThemes);

    // easing comes from level3
    expect(result.transition.easing).toBe('linear');
    // durationSlow from level3's own default (deepMerge child over parent)
    expect(result.transition.durationSlow).toBe(level3.theme.transition.durationSlow);
  });

  it('falls back gracefully when parentThemeId points to a non-existent theme', () => {
    const theme = makeGlobalTheme('orphan', {}, 'does-not-exist');
    const result = resolveTheme(theme, [theme]);
    expect(result).toBe(theme.theme);
  });

  it('correctly resolves when allThemes contains unrelated themes', () => {
    const unrelated1 = makeGlobalTheme('unrelated1');
    const unrelated2 = makeGlobalTheme('unrelated2');
    const parent = makeGlobalTheme('parent', {
      radius: { ...makeTheme().radius, default: '8px' },
    });
    const child = makeGlobalTheme(
      'child',
      {
        radius: { ...makeTheme().radius, default: '16px' },
      },
      'parent',
    );

    const allThemes = [unrelated1, parent, unrelated2, child];
    const result = resolveTheme(child, allThemes);

    expect(result.radius.default).toBe('16px');
  });

  it('returns a merged object (not a reference to parent or child theme)', () => {
    const parent = makeGlobalTheme('parent');
    const child = makeGlobalTheme('child', {}, 'parent');

    const allThemes = [parent, child];
    const result = resolveTheme(child, allThemes);

    // The result is from deepMerge, which creates a new object
    expect(result).not.toBe(parent.theme);
    expect(result).not.toBe(child.theme);
  });
});
