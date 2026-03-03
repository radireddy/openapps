/**
 * Responsive CSS Generator
 *
 * Generates media query CSS, fluid typography, and global base styles
 * for responsive layout support.
 */

import type React from 'react';
import { AppComponent, ComponentProps } from '@/types';
import { BREAKPOINTS, BREAKPOINT_ORDER } from './breakpoints';
import type { BreakpointKey, ResponsiveOverrides } from '@/types';

/**
 * Style properties that are relevant for responsive overrides.
 * Other properties (like event handlers) are excluded.
 */
const STYLE_PROPERTIES = new Set([
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap',
  'order', 'flexGrow', 'flexShrink', 'alignSelf',
  'padding', 'margin', 'fontSize', 'display',
  'fontWeight', 'fontFamily', 'fontStyle', 'textAlign', 'color', 'textColor',
  'opacity', 'backgroundColor', 'borderRadius',
  'borderWidth', 'borderStyle', 'borderColor',
]);

/**
 * Convert a property ID and value to a CSS declaration.
 * Handles camelCase → kebab-case conversion and unit inference.
 */
function toCSSDeclaration(propertyId: string, value: any): string | null {
  if (value === undefined || value === null || value === '') return null;

  // camelCase to kebab-case
  const cssProp = propertyId.replace(/([A-Z])/g, '-$1').toLowerCase();

  // Number values that need units
  const needsPx = [
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'gap', 'padding', 'margin', 'font-size', 'border-radius', 'border-width',
  ];

  let cssValue: string;
  if (typeof value === 'number') {
    if (needsPx.includes(cssProp)) {
      cssValue = `${value}px`;
    } else {
      cssValue = String(value);
    }
  } else {
    cssValue = String(value);
  }

  return `  ${cssProp}: ${cssValue};`;
}

/**
 * Generate inline styles for a component resolved at a specific breakpoint.
 * Used in preview mode to apply the correct styles.
 */
export function generateResponsiveStyles(
  component: AppComponent,
  breakpoint: BreakpointKey
): React.CSSProperties {
  const props = component.props as any;
  const responsive: ResponsiveOverrides | undefined = props.responsive;
  const styles: Record<string, any> = {};

  // Start with base (mobile) styles
  for (const key of STYLE_PROPERTIES) {
    if (props[key] !== undefined) {
      styles[key] = props[key];
    }
  }

  // Apply cascading overrides up to the target breakpoint
  if (responsive && breakpoint !== 'mobile') {
    const targetIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
    for (let i = 1; i <= targetIndex; i++) {
      const bp = BREAKPOINT_ORDER[i];
      const overrides = responsive[bp];
      if (overrides) {
        for (const [key, value] of Object.entries(overrides)) {
          if (STYLE_PROPERTIES.has(key) && value !== undefined) {
            styles[key] = value;
          }
        }
      }
    }
  }

  return styles as React.CSSProperties;
}

/**
 * Generate a `<style>` block with @media queries for all components.
 *
 * Each component uses `[data-component-id="<id>"]` as its CSS selector.
 * Media queries are generated for tablet, desktop, and large breakpoints.
 */
export function generateMediaQueryCSS(components: AppComponent[]): string {
  // Collect overrides by breakpoint
  const breakpointRules: Record<string, string[]> = {
    tablet: [],
    desktop: [],
    large: [],
  };

  for (const component of components) {
    const responsive = (component.props as any).responsive as ResponsiveOverrides | undefined;
    if (!responsive) continue;

    for (const bp of ['tablet', 'desktop', 'large'] as const) {
      const overrides = responsive[bp];
      if (!overrides) continue;

      const declarations: string[] = [];
      for (const [key, value] of Object.entries(overrides)) {
        if (STYLE_PROPERTIES.has(key)) {
          const decl = toCSSDeclaration(key, value);
          if (decl) declarations.push(decl);
        }
      }

      if (declarations.length > 0) {
        const selector = `[data-component-id="${component.id}"]`;
        const rule = `${selector} {\n${declarations.join('\n')}\n}`;
        breakpointRules[bp].push(rule);
      }
    }
  }

  const blocks: string[] = [];

  for (const bp of ['tablet', 'desktop', 'large'] as const) {
    const rules = breakpointRules[bp];
    if (rules.length === 0) continue;
    const minWidth = BREAKPOINTS[bp].minWidth;
    blocks.push(`@media (min-width: ${minWidth}px) {\n${rules.join('\n\n')}\n}`);
  }

  return blocks.join('\n\n');
}

/**
 * Generate fluid font size using CSS clamp().
 *
 * @param mobileSize - Font size at mobile viewport (px)
 * @param desktopSize - Font size at desktop viewport (px)
 * @returns A `clamp(...)` CSS value
 */
export function generateFluidFontSize(mobileSize: number, desktopSize: number): string {
  // clamp(minSize, preferred, maxSize)
  // preferred = viewportBased for smooth scaling
  // Using viewport width: scale between 375px and 1280px
  const minVw = 375;
  const maxVw = 1280;
  const slope = (desktopSize - mobileSize) / (maxVw - minVw);
  const yIntercept = mobileSize - slope * minVw;
  const preferred = `${yIntercept.toFixed(4)}px + ${(slope * 100).toFixed(4)}vw`;

  return `clamp(${mobileSize}px, ${preferred}, ${desktopSize}px)`;
}

/**
 * Generate global base styles for responsive design.
 * These should be injected once at the top level.
 */
export function generateGlobalBaseStyles(): string {
  return `/* Responsive Base Styles */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100dvh;
}

img, video {
  max-width: 100%;
  height: auto;
}

table {
  width: 100%;
  overflow-x: auto;
  display: block;
}
`;
}
