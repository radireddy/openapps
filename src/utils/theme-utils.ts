import { Theme, GlobalTheme } from '@/types';

/**
 * Deep merges two objects. The override values take precedence.
 * Only merges plain objects — arrays and primitives are replaced entirely.
 */
export function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(override) as Array<keyof T>) {
    const overrideVal = override[key];
    const baseVal = base[key];
    if (
      overrideVal !== undefined &&
      typeof overrideVal === 'object' &&
      overrideVal !== null &&
      !Array.isArray(overrideVal) &&
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal as any, overrideVal as any);
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as T[keyof T];
    }
  }
  return result;
}

/**
 * Resolves a theme with inheritance.
 * When `theme.parentThemeId` is set, the theme stores only overridden values.
 * This function walks up the parent chain and merges accordingly.
 */
export function resolveTheme(theme: GlobalTheme, allThemes: GlobalTheme[]): Theme {
  if (!theme.parentThemeId) return theme.theme;
  const parent = allThemes.find((t) => t.id === theme.parentThemeId);
  if (!parent) return theme.theme;
  const resolvedParent = resolveTheme(parent, allThemes);
  return deepMerge(resolvedParent, theme.theme);
}
