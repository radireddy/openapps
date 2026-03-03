export {
  BREAKPOINTS,
  BREAKPOINT_ORDER,
  DEVICE_PRESETS,
  resolveAtBreakpoint,
  resolvePropertyAtBreakpoint,
  hasExplicitOverride,
  getBreakpointForWidth,
} from './breakpoints';

export {
  generateAutoResponsiveDefaults,
  generateBatchAutoDefaults,
} from './auto-defaults';
export type { AutoResponsiveResult } from './auto-defaults';

export {
  generateResponsiveStyles,
  generateMediaQueryCSS,
  generateFluidFontSize,
  generateGlobalBaseStyles,
} from './css-generator';
