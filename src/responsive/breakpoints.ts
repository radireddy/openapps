/**
 * Breakpoint System for Responsive Layout
 *
 * Defines breakpoints and provides cascading resolution logic.
 * Mobile-first: base props are the mobile values.
 * Cascade order: mobile (base) → tablet → desktop → large
 */

import { BreakpointKey, ResponsiveOverrides } from '@/types';

export const BREAKPOINTS: Record<BreakpointKey, { label: string; minWidth: number; icon: string }> = {
  mobile: { label: 'Mobile', minWidth: 0, icon: 'smartphone' },
  tablet: { label: 'Tablet', minWidth: 768, icon: 'tablet' },
  desktop: { label: 'Desktop', minWidth: 1280, icon: 'monitor' },
  large: { label: 'Large', minWidth: 1536, icon: 'tv' },
};

/** Ordered from smallest to largest */
export const BREAKPOINT_ORDER: BreakpointKey[] = ['mobile', 'tablet', 'desktop', 'large'];

/**
 * Device presets for the preview switcher
 */
export const DEVICE_PRESETS: Record<string, { label: string; width: number | null; breakpoint: BreakpointKey }> = {
  mobile: { label: 'Mobile', width: 375, breakpoint: 'mobile' },
  tablet: { label: 'Tablet', width: 768, breakpoint: 'tablet' },
  desktop: { label: 'Desktop', width: 1280, breakpoint: 'desktop' },
  fullWidth: { label: 'Full Width', width: null, breakpoint: 'mobile' },
};

/**
 * Resolve the effective value of a property at a given breakpoint.
 *
 * Uses mobile-first cascading: mobile is the base, then tablet overrides,
 * then desktop overrides tablet, etc.
 *
 * @param responsive - The component's responsive overrides (may be undefined)
 * @param baseValue  - The base (mobile) value from the component's props
 * @param breakpoint - The target breakpoint to resolve for
 * @returns The effective value at the given breakpoint
 */
export function resolveAtBreakpoint<T>(
  responsive: ResponsiveOverrides | undefined,
  baseValue: T,
  breakpoint: BreakpointKey
): T {
  // Mobile always uses base value
  if (breakpoint === 'mobile' || !responsive) {
    return baseValue;
  }

  const targetIndex = BREAKPOINT_ORDER.indexOf(breakpoint);

  // Walk from tablet up to the target breakpoint, applying overrides
  // The last override found wins (cascading)
  let resolved = baseValue;
  for (let i = 1; i <= targetIndex; i++) {
    const bp = BREAKPOINT_ORDER[i];
    const overrides = responsive[bp];
    if (overrides !== undefined) {
      // Check each property in the overrides — we return the whole override set
      // because this function resolves a single property at a time via the caller
      resolved = overrides as unknown as T;
    }
  }

  return resolved;
}

/**
 * Resolve a single named property at a given breakpoint.
 *
 * @param responsive - The component's responsive overrides
 * @param baseValue  - The base (mobile) value of the property
 * @param propertyId - The property key to resolve
 * @param breakpoint - The target breakpoint
 * @returns The resolved value for that property at that breakpoint
 */
export function resolvePropertyAtBreakpoint<T>(
  responsive: ResponsiveOverrides | undefined,
  baseValue: T,
  propertyId: string,
  breakpoint: BreakpointKey
): T {
  if (breakpoint === 'mobile' || !responsive) {
    return baseValue;
  }

  const targetIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
  let resolved = baseValue;

  for (let i = 1; i <= targetIndex; i++) {
    const bp = BREAKPOINT_ORDER[i];
    const overrides = responsive[bp];
    if (overrides && propertyId in overrides) {
      resolved = (overrides as Record<string, any>)[propertyId] as T;
    }
  }

  return resolved;
}

/**
 * Check if a specific property has an explicit override at the given breakpoint
 * (not inherited from a smaller breakpoint).
 */
export function hasExplicitOverride(
  responsive: ResponsiveOverrides | undefined,
  propertyId: string,
  breakpoint: BreakpointKey
): boolean {
  if (breakpoint === 'mobile' || !responsive) {
    return false;
  }
  const overrides = responsive[breakpoint];
  return overrides !== undefined && propertyId in overrides;
}

/**
 * Get the breakpoint key that corresponds to a given viewport width.
 */
export function getBreakpointForWidth(width: number): BreakpointKey {
  // Walk from largest to smallest, returning the first match
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const bp = BREAKPOINT_ORDER[i];
    if (width >= BREAKPOINTS[bp].minWidth) {
      return bp;
    }
  }
  return 'mobile';
}
