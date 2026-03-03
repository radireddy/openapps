import { AppVariable, AppVariableType, AppComponent, AppPage } from '@/types';

/** Map AppVariableType to TypeScript type string */
function inferTsType(varType: AppVariableType): string {
  switch (varType) {
    case AppVariableType.STRING:
      return 'string';
    case AppVariableType.NUMBER:
      return 'number';
    case AppVariableType.BOOLEAN:
      return 'boolean';
    case AppVariableType.OBJECT:
      return 'Record<string, any>';
    case AppVariableType.ARRAY:
      return 'any[]';
    case AppVariableType.ARRAY_OF_OBJECTS:
      return 'Record<string, any>[]';
    default:
      return 'any';
  }
}

/** Ensure name is a valid JS identifier */
function sanitizeIdentifier(name: string): string {
  // Replace non-alphanumeric (except $, _) with underscores
  let safe = name.replace(/[^a-zA-Z0-9$_]/g, '_');
  // Ensure it doesn't start with a digit
  if (/^[0-9]/.test(safe)) {
    safe = '_' + safe;
  }
  return safe;
}

const RESERVED_NAMES = new Set([
  'theme', 'actions', 'console', 'event', 'pages',
  'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
  'var', 'let', 'const', 'function', 'class', 'return',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case',
  'break', 'continue', 'new', 'delete', 'typeof', 'instanceof',
  'this', 'super', 'import', 'export', 'default', 'try',
  'catch', 'finally', 'throw', 'void', 'with', 'yield', 'async', 'await',
]);

/**
 * Generates a TypeScript .d.ts string that describes the expression scope.
 * Used with Monaco's `addExtraLib` to provide intellisense.
 */
export function generateTypeDefs(
  variables: AppVariable[],
  components: AppComponent[],
  pages: AppPage[]
): string {
  const lines: string[] = [];

  // ── Theme type hierarchy ──────────────────────────────────────────
  lines.push(`
interface ThemeColors {
  primary: string; onPrimary: string;
  secondary: string; onSecondary: string;
  background: string; surface: string; text: string; border: string;
  primaryLight: string; primaryDark: string;
  secondaryLight: string; secondaryDark: string;
  error: string; onError: string;
  warning: string; onWarning: string;
  success: string; onSuccess: string;
  info: string; onInfo: string;
  surfaceVariant: string; onSurface: string; onBackground: string;
  hover: string; focus: string; disabled: string; onDisabled: string;
  outline: string; shadow: string; overlay: string; link: string;
}
interface ThemeFont { family: string; }
interface ThemeBorder {
  width: string; style: string;
  widthThin: string; widthMedium: string; widthThick: string;
}
interface ThemeRadius {
  default: string; none: string; sm: string; md: string; lg: string; xl: string; full: string;
}
interface ThemeSpacing {
  xs: string; sm: string; md: string; lg: string; xl: string; xxl: string; xxxl: string; xxxxl: string;
}
interface ThemeTypography {
  fontFamily: string; fontFamilyHeading: string; fontFamilyMono: string;
  fontSizeXs: string; fontSizeSm: string; fontSizeMd: string; fontSizeLg: string;
  fontSizeXl: string; fontSizeXxl: string; fontSizeXxxl: string;
  fontWeightLight: string; fontWeightNormal: string; fontWeightMedium: string;
  fontWeightSemibold: string; fontWeightBold: string;
  lineHeightTight: string; lineHeightNormal: string; lineHeightRelaxed: string;
  letterSpacingTight: string; letterSpacingNormal: string; letterSpacingWide: string;
}
interface ThemeShadow {
  none: string; sm: string; md: string; lg: string; xl: string; inner: string;
}
interface ThemeTransition {
  durationFast: string; durationNormal: string; durationSlow: string; easing: string;
}
interface Theme {
  colors: ThemeColors;
  font: ThemeFont;
  border: ThemeBorder;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  shadow: ThemeShadow;
  transition: ThemeTransition;
}
declare var theme: Theme;
`);

  // ── Actions ───────────────────────────────────────────────────────
  lines.push(`
interface Actions {
  /** Create a new record in a data source */
  createRecord(dataSourceName: string, newRecord: any): Promise<void>;
  /** Update an existing record in a data source */
  updateRecord(dataSourceName: string, recordId: any, updates: any): Promise<void>;
  /** Delete a record from a data source */
  deleteRecord(dataSourceName: string, recordId: any): Promise<void>;
  /** Select a record and store it in the data store */
  selectRecord(dataStoreKey: string, record: any): void;
  /** Update an app variable's value */
  updateVariable(variableName: string, newValue: any): void;
  /** Submit the form */
  submitForm(onSuccessCode?: string, scope?: Record<string, any>): void;
  /** Navigate to a different page */
  navigateTo(pageId: string): void;
}
declare var actions: Actions;
`);

  // ── Console ───────────────────────────────────────────────────────
  lines.push(`
interface ExprConsole {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  info(...args: any[]): void;
}
declare var console: ExprConsole;
`);

  // ── Event ─────────────────────────────────────────────────────────
  lines.push(`
interface ExprEventTarget {
  value: any;
  checked?: boolean;
  name?: string;
  [key: string]: any;
}
interface ExprEvent {
  target: ExprEventTarget;
  type: string;
  preventDefault(): void;
  stopPropagation(): void;
  [key: string]: any;
}
declare var event: ExprEvent;
`);

  // ── Pages ─────────────────────────────────────────────────────────
  if (pages.length > 0) {
    lines.push(`
interface PageDef { id: string; name: string; }
declare var pages: PageDef[];
`);
  }

  // ── User variables (flat scope) ───────────────────────────────────
  for (const v of variables) {
    const safeName = sanitizeIdentifier(v.name);
    if (RESERVED_NAMES.has(safeName) || safeName !== v.name) continue;
    const tsType = inferTsType(v.type);
    lines.push(`/** App variable "${v.name}" (${v.type}) */`);
    lines.push(`declare var ${safeName}: ${tsType};`);
  }

  // ── Components (flat scope, e.g. Input1.value) ────────────────────
  const seen = new Set<string>();
  for (const c of components) {
    const safeName = sanitizeIdentifier(c.id);
    if (RESERVED_NAMES.has(safeName) || seen.has(safeName)) continue;
    seen.add(safeName);
    lines.push(`/** Component "${c.name || c.id}" (${c.type}) */`);
    lines.push(`declare var ${safeName}: { value: any; [key: string]: any };`);
  }

  return lines.join('\n');
}
