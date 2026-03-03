import { Theme } from '@/types';
import { lightenColor, darkenColor, isColorDark } from './color-utils';
import { defaultLightTheme, defaultDarkTheme } from '@/theme-presets';

/**
 * Migrates a v1 theme (pre-typography/shadow/transition) to v2 format.
 * If the theme already has the `typography` key, it's returned as-is.
 * All existing v1 values are preserved exactly.
 */
export function migrateTheme(oldTheme: any): Theme {
  // Already v2 — return as-is
  if (oldTheme && oldTheme.typography) {
    return oldTheme as Theme;
  }

  if (!oldTheme || !oldTheme.colors) {
    return defaultLightTheme;
  }

  const isDark = isColorDark(oldTheme.colors.background || '#FFFFFF');
  const base = isDark ? defaultDarkTheme : defaultLightTheme;

  // Derive palette variants from existing colors
  const primary = oldTheme.colors.primary || base.colors.primary;
  const secondary = oldTheme.colors.secondary || base.colors.secondary;

  const derivedColors = {
    // Preserve all v1 colors exactly
    primary: oldTheme.colors.primary ?? base.colors.primary,
    onPrimary: oldTheme.colors.onPrimary ?? base.colors.onPrimary,
    secondary: oldTheme.colors.secondary ?? base.colors.secondary,
    onSecondary: oldTheme.colors.onSecondary ?? base.colors.onSecondary,
    background: oldTheme.colors.background ?? base.colors.background,
    surface: oldTheme.colors.surface ?? base.colors.surface,
    text: oldTheme.colors.text ?? base.colors.text,
    border: oldTheme.colors.border ?? base.colors.border,

    // Derived new colors
    primaryLight: safeColor(() => lightenColor(primary, 15), base.colors.primaryLight),
    primaryDark: safeColor(() => darkenColor(primary, 15), base.colors.primaryDark),
    secondaryLight: safeColor(() => lightenColor(secondary, 15), base.colors.secondaryLight),
    secondaryDark: safeColor(() => darkenColor(secondary, 15), base.colors.secondaryDark),

    // Status colors from defaults
    error: base.colors.error,
    onError: base.colors.onError,
    warning: base.colors.warning,
    onWarning: base.colors.onWarning,
    success: base.colors.success,
    onSuccess: base.colors.onSuccess,
    info: base.colors.info,
    onInfo: base.colors.onInfo,

    // Surface variants
    surfaceVariant: base.colors.surfaceVariant,
    onSurface: base.colors.onSurface,
    onBackground: oldTheme.colors.text ?? base.colors.onBackground,

    // Interaction states
    hover: base.colors.hover,
    focus: primary,
    disabled: base.colors.disabled,
    onDisabled: base.colors.onDisabled,

    // Utility
    outline: base.colors.outline,
    shadow: base.colors.shadow,
    overlay: base.colors.overlay,
    link: primary,
  };

  const fontFamily = oldTheme.font?.family || base.font.family;

  return {
    colors: derivedColors,
    font: {
      family: fontFamily,
    },
    border: {
      width: oldTheme.border?.width ?? base.border.width,
      style: oldTheme.border?.style ?? base.border.style,
      widthThin: base.border.widthThin,
      widthMedium: base.border.widthMedium,
      widthThick: base.border.widthThick,
    },
    radius: {
      default: oldTheme.radius?.default ?? base.radius.default,
      none: base.radius.none,
      sm: base.radius.sm,
      md: oldTheme.radius?.default ?? base.radius.md,
      lg: base.radius.lg,
      xl: base.radius.xl,
      full: base.radius.full,
    },
    spacing: {
      xs: base.spacing.xs,
      sm: oldTheme.spacing?.sm ?? base.spacing.sm,
      md: oldTheme.spacing?.md ?? base.spacing.md,
      lg: oldTheme.spacing?.lg ?? base.spacing.lg,
      xl: base.spacing.xl,
      xxl: base.spacing.xxl,
      xxxl: base.spacing.xxxl,
      xxxxl: base.spacing.xxxxl,
    },
    typography: {
      fontFamily: fontFamily,
      fontFamilyHeading: fontFamily,
      fontFamilyMono: base.typography.fontFamilyMono,
      fontSizeXs: base.typography.fontSizeXs,
      fontSizeSm: base.typography.fontSizeSm,
      fontSizeMd: base.typography.fontSizeMd,
      fontSizeLg: base.typography.fontSizeLg,
      fontSizeXl: base.typography.fontSizeXl,
      fontSizeXxl: base.typography.fontSizeXxl,
      fontSizeXxxl: base.typography.fontSizeXxxl,
      fontWeightLight: base.typography.fontWeightLight,
      fontWeightNormal: base.typography.fontWeightNormal,
      fontWeightMedium: base.typography.fontWeightMedium,
      fontWeightSemibold: base.typography.fontWeightSemibold,
      fontWeightBold: base.typography.fontWeightBold,
      lineHeightTight: base.typography.lineHeightTight,
      lineHeightNormal: base.typography.lineHeightNormal,
      lineHeightRelaxed: base.typography.lineHeightRelaxed,
      letterSpacingTight: base.typography.letterSpacingTight,
      letterSpacingNormal: base.typography.letterSpacingNormal,
      letterSpacingWide: base.typography.letterSpacingWide,
    },
    shadow: isDark ? defaultDarkTheme.shadow : defaultLightTheme.shadow,
    transition: base.transition,
  };
}

/** Safely attempt a color operation, falling back to a default */
function safeColor(fn: () => string, fallback: string): string {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
