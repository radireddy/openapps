/**
 * Generates responsive.css with media queries for component breakpoint overrides.
 */

import { AppComponent } from '../../../types';
import { generateMediaQueryCSS } from '@/responsive';

/**
 * Generate the responsive.css file content for the exported project.
 * Contains @media queries for all components with responsive overrides.
 */
export function generateResponsiveCss(components: AppComponent[]): string {
  const mediaQueries = generateMediaQueryCSS(components);

  return `/* Auto-generated responsive styles */
/* Media queries for component breakpoint overrides */

${mediaQueries}
`;
}
