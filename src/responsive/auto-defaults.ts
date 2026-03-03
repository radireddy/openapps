/**
 * Auto-Responsive Defaults
 *
 * Mobile-first heuristic engine that generates responsive overrides for components.
 * Base props represent the mobile layout; overrides scale UP for tablet/desktop/large.
 *
 * Heuristics:
 * | Pattern                                | Mobile (base)         | Tablet          | Desktop         |
 * |----------------------------------------|-----------------------|-----------------|-----------------|
 * | Container flexDirection: 'row'         | → column (stack)      | → column        | → row (restore) |
 * | Fixed width > 300px                    | → 100%                | → 100% if >600  | → original px   |
 * | flexGrow + width: 'auto' (row child)  | → width: 100%         | —               | → width: auto   |
 * | fontSize > 32px                        | → 60% of original     | → 80%           | → original      |
 * | fontSize 20-32px                       | → 85% of original     | —               | → original      |
 * | gap > 16px                             | → 8px                 | → 12px          | → original      |
 * | gap 8-16px                             | → 8px                 | —               | → original      |
 * | padding > 16px (px only)              | → 50% of original     | → 75%           | → original      |
 */

import { AppComponent, ComponentType, ResponsiveOverrides, BreakpointOverride } from '@/types';

/**
 * Result from auto-responsive generation.
 * - `responsive`: tablet/desktop/large overrides (appended to existing responsive prop)
 * - `baseOverrides`: modifications to the mobile base props (merged into component props)
 */
export interface AutoResponsiveResult {
  responsive?: ResponsiveOverrides;
  baseOverrides?: Record<string, any>;
}

/**
 * Parse a CSS dimension value to a number in pixels.
 * Returns null if the value is not a pixel-based number.
 */
function parsePxValue(value: any): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('px')) {
      const num = parseFloat(trimmed);
      return isNaN(num) ? null : num;
    }
    // Plain numeric string
    const num = parseFloat(trimmed);
    if (!isNaN(num) && String(num) === trimmed) return num;
  }
  return null;
}

/**
 * Check if a value is a percentage string.
 */
function isPercentage(value: any): boolean {
  return typeof value === 'string' && value.trim().endsWith('%');
}

/**
 * Check if a value is an expression (e.g. {{theme.spacing.md}}).
 */
function isExpression(value: any): boolean {
  return typeof value === 'string' && value.includes('{{');
}

/**
 * Generate auto-responsive defaults for a single component.
 *
 * Mobile-first: base props = mobile. Overrides scale up for tablet/desktop.
 */
export function generateAutoResponsiveDefaults(
  component: AppComponent
): AutoResponsiveResult | undefined {
  const props = component.props as any;
  const baseOverrides: Record<string, any> = {};
  const tabletOverrides: BreakpointOverride = {};
  const desktopOverrides: BreakpointOverride = {};
  let hasBaseOverrides = false;
  let hasTabletOverrides = false;
  let hasDesktopOverrides = false;

  // 1. Container flexDirection: 'row' → stack on mobile/tablet, restore on desktop
  if (component.type === ComponentType.CONTAINER && props.flexDirection === 'row') {
    baseOverrides.flexDirection = 'column';
    tabletOverrides.flexDirection = 'column';
    desktopOverrides.flexDirection = 'row';
    hasBaseOverrides = true;
    hasTabletOverrides = true;
    hasDesktopOverrides = true;
  }

  // 2. Fixed width > 300px → 100% on mobile, conditional tablet, restore on desktop
  const widthPx = parsePxValue(props.width);
  if (widthPx !== null && widthPx > 300 && !isPercentage(props.width) && !isExpression(props.width)) {
    baseOverrides.width = '100%';
    hasBaseOverrides = true;

    if (widthPx > 600) {
      tabletOverrides.width = '100%';
      hasTabletOverrides = true;
    } else {
      tabletOverrides.width = `${widthPx}px`;
      hasTabletOverrides = true;
    }

    desktopOverrides.width = `${widthPx}px`;
    hasDesktopOverrides = true;
  }

  // 3. flexGrow + width: 'auto' (row child pattern) → full width on mobile, auto on desktop
  if (props.flexGrow && props.flexGrow > 0 && props.width === 'auto') {
    baseOverrides.width = '100%';
    hasBaseOverrides = true;

    desktopOverrides.width = 'auto';
    hasDesktopOverrides = true;
  }

  // 4. Large font sizes → scale down for mobile
  const fontSizePx = parsePxValue(props.fontSize);
  if (fontSizePx !== null && !isExpression(props.fontSize)) {
    if (fontSizePx > 32) {
      // Very large: 60% on mobile, 80% on tablet, original on desktop
      const mobileSize = Math.round(fontSizePx * 0.6);
      const tabletSize = Math.round(fontSizePx * 0.8);
      baseOverrides.fontSize = `${mobileSize}px`;
      tabletOverrides.fontSize = `${tabletSize}px`;
      desktopOverrides.fontSize = `${fontSizePx}px`;
      hasBaseOverrides = true;
      hasTabletOverrides = true;
      hasDesktopOverrides = true;
    } else if (fontSizePx > 20) {
      // Medium-large: 85% on mobile, original on desktop
      const mobileSize = Math.round(fontSizePx * 0.85);
      baseOverrides.fontSize = `${mobileSize}px`;
      desktopOverrides.fontSize = `${fontSizePx}px`;
      hasBaseOverrides = true;
      hasDesktopOverrides = true;
    }
  }

  // 5. Gap scaling
  const gapPx = parsePxValue(props.gap);
  if (gapPx !== null && !isExpression(props.gap)) {
    if (gapPx > 16) {
      // Large gap: 8px on mobile, 12px on tablet, original on desktop
      baseOverrides.gap = '8px';
      tabletOverrides.gap = '12px';
      desktopOverrides.gap = `${gapPx}px`;
      hasBaseOverrides = true;
      hasTabletOverrides = true;
      hasDesktopOverrides = true;
    } else if (gapPx > 8) {
      // Medium gap: 8px on mobile, original on desktop
      baseOverrides.gap = '8px';
      desktopOverrides.gap = `${gapPx}px`;
      hasBaseOverrides = true;
      hasDesktopOverrides = true;
    }
  }

  // 6. Padding scaling (px values only)
  const paddingPx = parsePxValue(props.padding);
  if (paddingPx !== null && paddingPx > 16 && !isExpression(props.padding)) {
    const mobilePadding = Math.round(paddingPx * 0.5);
    const tabletPadding = Math.round(paddingPx * 0.75);
    baseOverrides.padding = `${mobilePadding}px`;
    tabletOverrides.padding = `${tabletPadding}px`;
    desktopOverrides.padding = `${paddingPx}px`;
    hasBaseOverrides = true;
    hasTabletOverrides = true;
    hasDesktopOverrides = true;
  }

  if (!hasBaseOverrides && !hasTabletOverrides && !hasDesktopOverrides) {
    return undefined;
  }

  const result: AutoResponsiveResult = {};

  if (hasBaseOverrides) {
    result.baseOverrides = baseOverrides;
  }

  if (hasTabletOverrides || hasDesktopOverrides) {
    result.responsive = {};
    if (hasTabletOverrides) {
      result.responsive.tablet = tabletOverrides;
    }
    if (hasDesktopOverrides) {
      result.responsive.desktop = desktopOverrides;
    }
  }

  return result;
}

/**
 * Generate auto-responsive defaults for multiple components.
 * Returns a map of component ID → AutoResponsiveResult.
 */
export function generateBatchAutoDefaults(
  components: AppComponent[]
): Map<string, AutoResponsiveResult> {
  const results = new Map<string, AutoResponsiveResult>();

  for (const component of components) {
    const defaults = generateAutoResponsiveDefaults(component);
    if (defaults) {
      results.set(component.id, defaults);
    }
  }

  return results;
}
