import React from 'react';
import type { ComponentTemplate } from '@/components/component-templates/types';

/**
 * Represents the minimal metadata required to list an application in the dashboard.
 */
export interface AppMetadata {
    /** Unique identifier for the app (e.g., 'app_12345') */
    id: string;
    /** User-defined name of the application */
    name: string;
    /** ISO timestamp of creation */
    createdAt: string;
    /** ISO timestamp of last modification */
    lastModifiedAt: string;
}

/**
 * Represents a single page within the application.
 */
export interface PageMetadata {
    /** Page title (sets document.title in preview) */
    title?: string;
    /** Meta description for SEO */
    description?: string;
    /** Open Graph image URL */
    ogImage?: string;
    /** Favicon URL */
    favicon?: string;
}

export interface AppPage {
    /** Unique identifier for the page */
    id: string;
    /** Display name of the page (e.g., "Home", "Settings") */
    name: string;
    /** Page-level metadata for SEO and social sharing */
    metadata?: PageMetadata;
    /** Page-level cascading text color */
    textColor?: string;
    /** Page-level cascading font size */
    textFontSize?: string;
    /** Page-level cascading font weight */
    textFontWeight?: string;
    /** Page-level cascading font family */
    textFontFamily?: string;
}

export interface ThemeColors {
  // Preserved (backward compat)
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;

  // Palette variants
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  secondaryDark: string;

  // Semantic status
  error: string;
  onError: string;
  warning: string;
  onWarning: string;
  success: string;
  onSuccess: string;
  info: string;
  onInfo: string;

  // Surface & text variants
  surfaceVariant: string;
  onSurface: string;
  onBackground: string;

  // Interaction states
  hover: string;
  focus: string;
  disabled: string;
  onDisabled: string;

  // Utility
  outline: string;
  shadow: string;
  overlay: string;
  link: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyHeading: string;
  fontFamilyMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSizeXxl: string;
  fontSizeXxxl: string;
  fontWeightLight: string;
  fontWeightNormal: string;
  fontWeightMedium: string;
  fontWeightSemibold: string;
  fontWeightBold: string;
  lineHeightTight: string;
  lineHeightNormal: string;
  lineHeightRelaxed: string;
  letterSpacingTight: string;
  letterSpacingNormal: string;
  letterSpacingWide: string;
}

export interface ThemeFont {
  family: string;
}

export interface ThemeBorder {
    width: string;
    style: 'none' | 'solid' | 'dashed' | 'dotted';
    widthThin: string;
    widthMedium: string;
    widthThick: string;
}

export interface ThemeRadius {
    default: string;
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
}

export interface ThemeSpacing {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    xxxl: string;
    xxxxl: string;
}

export interface ThemeShadow {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface ThemeTransition {
  durationFast: string;
  durationNormal: string;
  durationSlow: string;
  easing: string;
}

/**
 * Defines the visual styling rules for the application.
 * Values here are referenced by components using `{{theme.colors.primary}}`, etc.
 * New tokens: `{{theme.typography.fontSizeLg}}`, `{{theme.shadow.md}}`, `{{theme.transition.durationFast}}`
 */
export interface Theme {
  colors: ThemeColors;
  font: ThemeFont;          // kept for backward compat
  border: ThemeBorder;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  shadow: ThemeShadow;
  transition: ThemeTransition;
}

export interface GlobalTheme {
    id: string;
    name: string;
    type: 'light' | 'dark';
    theme: Theme;
    description?: string;
    isBuiltIn?: boolean;
    parentThemeId?: string;
    createdAt?: string;
    lastModifiedAt?: string;
}


// ─── Responsive Layout Types ────────────────────────────────────────────────

export type BreakpointKey = 'mobile' | 'tablet' | 'desktop' | 'large';

/** Partial property overrides for a single breakpoint */
export type BreakpointOverride = Record<string, any>;

/** Per-breakpoint overrides. Mobile is the base (no entry needed). */
export type ResponsiveOverrides = Partial<Record<Exclude<BreakpointKey, 'mobile'>, BreakpointOverride>>;

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

// ─── Component Types ────────────────────────────────────────────────────────

export enum ComponentType {
  LABEL = 'LABEL',
  INPUT = 'INPUT',
  BUTTON = 'BUTTON',
  IMAGE = 'IMAGE',
  TEXTAREA = 'TEXTAREA',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  DIVIDER = 'DIVIDER',
  RADIO_GROUP = 'RADIO_GROUP',
  SWITCH = 'SWITCH',
  TABLE = 'TABLE',
  CONTAINER = 'CONTAINER',
  LIST = 'LIST',
  DATE_PICKER = 'DATE_PICKER',
  TIME_PICKER = 'TIME_PICKER',
  SLIDER = 'SLIDER',
  FILE_UPLOAD = 'FILE_UPLOAD',
  RATING = 'RATING',
  PROGRESS = 'PROGRESS',
  FORM = 'FORM',
  MODAL = 'MODAL',
  TABS = 'TABS',
  ACCORDION = 'ACCORDION',
  CUSTOM_WIDGET = 'CUSTOM_WIDGET',
}

/**
 * Base properties shared by all visual components.
 */
export interface BaseProps {
  /** @deprecated Use order for positioning. Kept for migration compatibility. */
  x?: number;
  /** @deprecated Use order for positioning. Kept for migration compatibility. */
  y?: number;
  width: number | string;
  height: number | string;
  opacity?: number | string;
  boxShadow?: string;
  disabled?: boolean | string;
  /** Expression to determine visibility (e.g., `{{ !user.isLoggedIn }}`) */
  hidden?: boolean | string;
  /** Padding (e.g., '8px', '10px 5px', or '{{theme.spacing.md}}') */
  padding?: number | string;
  /** Margin (e.g., '8px', '10px 5px', or '{{theme.spacing.md}}') */
  margin?: number | string;
  /** Flex item order (controls visual order within flex parent) */
  order?: number;
  /** Flex grow factor */
  flexGrow?: number;
  /** Flex shrink factor */
  flexShrink?: number;
  /** Align self override (overrides parent's alignItems for this item) */
  alignSelf?: string;
  /** Per-breakpoint property overrides for responsive layout */
  responsive?: ResponsiveOverrides;
  /** Expression to execute when component mounts in preview mode */
  onMount?: string;
  /** Expression to execute when component unmounts in preview mode */
  onUnmount?: string;
  /** Anchor ID for scroll-to-section targeting (applied as HTML id attribute) */
  anchorId?: string;
  /** Background color on hover (preview mode only) */
  hoverBackgroundColor?: string;
  /** Text color on hover (preview mode only) */
  hoverColor?: string;
  /** Opacity on hover (0-1, preview mode only) */
  hoverOpacity?: number | string;
  /** CSS transform on hover (e.g., 'scale(1.05)', preview mode only) */
  hoverTransform?: string;
}

export interface BorderProps {
    borderRadius?: number | string;
    borderWidth?: number | string;
    borderColor?: string;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
    borderTop?: number | string;
    borderLeft?: number | string;
    borderRight?: number | string;
    borderBottom?: number | string;
}

/**
 * Shared properties common to all form field components.
 * Used by the useFormField hook for unified form logic.
 */
export interface FormFieldCommonProps {
  disabled?: boolean | string;
  readOnly?: boolean | string;
  required?: boolean | string;
  errorMessage?: string;
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  value?: string;
  defaultValue?: string | boolean;
  customValidator?: string;
  // Event handler props
  onChange?: string;
  onFocus?: string;
  onBlur?: string;
  onEnterKeyPress?: string;
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string;
  onChangeCodeToExecute?: string;
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string;
  onFocusCodeToExecute?: string;
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string;
  onBlurCodeToExecute?: string;
  onEnterActionType?: InputActionType;
  onEnterAlertMessage?: string;
  onEnterCodeToExecute?: string;
}

export type PropertyRendererType = 'javascript' | 'markdown' | 'literal';
/**
 * A function hook that transforms a raw property value into a rendered value.
 * @example
 * // Returns "Hello World" if value is "{{ 'Hello ' + 'World' }}"
 * renderer(value, scope, defaultValue) 
 */
export type PropertyRendererHook = <T>(value: T, scope: Record<string, any>, defaultValue: T) => T;


export interface LabelProps extends BaseProps, BorderProps {
  text: string;
  fontSize: number | string;
  fontWeight: string;
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  backgroundColor?: string;
  textRenderer?: PropertyRendererType;
  /** Line height (e.g., 1.5, '24px', '150%') */
  lineHeight?: number | string;
  /** Letter spacing (e.g., '0.5px', '-0.02em', 'normal') */
  letterSpacing?: string;
  /** Text transform: none, uppercase, lowercase, capitalize */
  textTransform?: string;
  /** Text decoration: none, underline, line-through */
  textDecoration?: string;
  /** Cursor style when hovering: pointer, default, text, etc. */
  cursor?: string;
  /** Link URL: external (https://...), internal page (page_xxx), or anchor (#sectionId) */
  href?: string;
}

export interface InputProps extends BaseProps, BorderProps {
  /** Field label displayed above the input */
  label?: string;
  placeholder: string;
  /** Default value for the input field (supports expressions) */
  defaultValue?: string;
  /** Input type: text, number, password, email, url, tel */
  inputType?: 'text' | 'number' | 'password' | 'email' | 'url' | 'tel';
  /** Value binding (supports expressions) */
  value?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Maximum length for text inputs */
  maxLength?: number;
  /** Maximum value (for number inputs, supports expressions) */
  max?: number | string;
  /** Regex pattern for validation */
  pattern?: string;
  /** Whether input is required */
  required?: boolean | string;
  /** Custom error message (supports expressions) */
  errorMessage?: string;
  /** Font size */
  fontSize?: number | string;
  /** Font family */
  fontFamily?: string;
  /** Font weight */
  fontWeight?: string;
  /** Font style */
  fontStyle?: 'normal' | 'italic';
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Z-index for layering */
  zIndex?: number;
  /** Custom CSS class names */
  className?: string;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the input */
  helpText?: string;
  /** ID of element that describes this input */
  ariaDescribedBy?: string;
  /** Whether input is read-only (focusable but not editable) */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Prefix text displayed before the input */
  prefixText?: string;
  /** Suffix text displayed after the input */
  suffixText?: string;
  /** Show clear button when input has value */
  clearButton?: boolean;
  /** HTML autocomplete attribute */
  autoComplete?: string;
  /** Text transformation */
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  /** Show character count (requires maxLength) */
  showCharacterCount?: boolean;
  /** Event handlers */
  onChange?: string; // JS expression (deprecated, use onChangeActionType)
  onFocus?: string; // JS expression (deprecated, use onFocusActionType)
  onBlur?: string; // JS expression (deprecated, use onBlurActionType)
  onEnterKeyPress?: string; // JS expression (deprecated, use onEnterActionType)
  /** On Change Action */
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string; // Expression for alert message
  onChangeCodeToExecute?: string; // Expression for code to execute
  /** On Focus Action */
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string; // Expression for alert message
  onFocusCodeToExecute?: string; // Expression for code to execute
  /** On Blur Action */
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string; // Expression for alert message
  onBlurCodeToExecute?: string; // Expression for code to execute
  /** On Enter Key Press Action */
  onEnterActionType?: InputActionType;
  onEnterAlertMessage?: string; // Expression for alert message
  onEnterCodeToExecute?: string; // Expression for code to execute
  /** Custom validator expression — receives `value` and `dataStore` in scope, returns error string or '' */
  customValidator?: string;
}

export type ButtonActionType = 'none' | 'alert' | 'updateVariable' | 'executeCode' | 'submitForm' | 'navigate';
export type InputActionType = 'none' | 'alert' | 'executeCode';
export type ButtonVariant = 'solid' | 'outlined' | 'ghost' | 'text';

export interface ButtonProps extends BaseProps, BorderProps {
  text: string;
  backgroundColor: string;
  textColor: string;
  actionType: ButtonActionType;
  // Alert
  actionAlertMessage?: string;
  // Update Variable
  actionVariableName?: string;
  actionVariableValue?: any;
  // Execute Code
  actionCodeToExecute?: string;
  // Submit Form
  actionOnSubmitCode?: string;
  // Navigate to Page
  /** Static target page ID for navigate action */
  actionPageId?: string;
  /** Dynamic expression evaluating to a page ID (overrides static when set) */
  actionPageExpression?: string;
  /** Whether to validate all form fields before navigating */
  validateBeforeNavigate?: boolean;
  /** Button style variant */
  variant?: ButtonVariant;
  /** Show loading spinner and disable interaction */
  loading?: boolean | string;
  /** Icon name or SVG to show before text */
  iconLeft?: string;
  /** Icon name or SVG to show after text */
  iconRight?: string;
  /** Whether button stretches to full container width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Font size */
  fontSize?: number | string;
}

export interface ImageProps extends BaseProps, BorderProps {
  src: string;
  alt: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

  // Layout
  objectPosition?: string;
  aspectRatio?: string;

  // Loading
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string;
  placeholder?: 'none' | 'skeleton';

  // Filters
  filterBlur?: number;
  filterGrayscale?: number;
  filterBrightness?: number;

  // Hover
  hoverScale?: number;
  hoverOpacity?: number;
  hoverShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  // Events
  onClick?: string;

  // Caption
  caption?: string;
  captionPosition?: 'below' | 'overlay-bottom';
}

export interface TableProps extends BaseProps, BorderProps {
    // --- Existing ---
    columns: string; // "Header:key,Header2:key2"
    rowSelectAction: 'none' | 'updateDataStore';
    selectedRecordKey?: string; // key in dataStore to update with selected row
    headerBackgroundColor?: string;
    rowBorderColor?: string;

    // --- Data Binding ---
    data?: string;                   // Expression: "{{dataStore.users}}"
    emptyStateText?: string;         // Text when no data

    // --- Sorting ---
    sortableColumns?: string;        // "name,email" or "*"

    // --- Filtering ---
    filterableColumns?: string;      // "name,email" or "*"
    showSearch?: boolean;            // Show global search bar
    searchPlaceholder?: string;      // Placeholder for search input

    // --- Column Resize ---
    resizable?: boolean;             // Enable column resize (default: true)

    // --- Virtualization ---
    rowHeight?: number;              // Fixed row height (default: 40)

    // --- Visual ---
    striped?: boolean;               // Alternating row colors
    stripedColor?: string;           // Alternate row bg color
    showRowNumbers?: boolean;        // Show row number column
    stickyHeader?: boolean;          // Fixed header (default: true)
    fontSize?: number | string;
    color?: string;
}

export interface TextareaProps extends BaseProps, BorderProps {
  /** Field label displayed above the textarea */
  label?: string;
  textAlign?: 'left' | 'center' | 'right';
  placeholder: string;
  /** Value binding (supports expressions) */
  value?: string;
  /** Default value for the textarea field (supports expressions) */
  defaultValue?: string;
  accessibilityLabel?: string;
  /** Whether textarea is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** Maximum character length */
  maxLength?: number;
  /** Regex pattern for validation */
  pattern?: string;
  /** Font size */
  fontSize?: number | string;
  /** Font family */
  fontFamily?: string;
  /** Font weight */
  fontWeight?: string;
  /** Font style */
  fontStyle?: string;
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Number of visible text rows */
  rows?: number;
  /** CSS resize behavior */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Show character count (requires maxLength) */
  showCharacterCount?: boolean;
  /** Auto-grow textarea height based on content */
  autoGrow?: boolean;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the textarea */
  helpText?: string;
  /** ID of element that describes this input */
  ariaDescribedBy?: string;
  /** Whether textarea is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Event handlers */
  onChange?: string; // JS expression (deprecated, use onChangeActionType)
  onFocus?: string; // JS expression (deprecated, use onFocusActionType)
  onBlur?: string; // JS expression (deprecated, use onBlurActionType)
  onEnterKeyPress?: string; // JS expression (deprecated, use onEnterActionType)
  /** On Change Action */
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string; // Expression for alert message
  onChangeCodeToExecute?: string; // Expression for code to execute
  /** On Focus Action */
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string; // Expression for alert message
  onFocusCodeToExecute?: string; // Expression for code to execute
  /** On Blur Action */
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string; // Expression for alert message
  onBlurCodeToExecute?: string; // Expression for code to execute
  /** On Enter Key Press Action */
  onEnterActionType?: InputActionType;
  onEnterAlertMessage?: string; // Expression for alert message
  onEnterCodeToExecute?: string; // Expression for code to execute
  /** Custom validator expression — receives `value` and `dataStore` in scope, returns error string or '' */
  customValidator?: string;
}

export interface SelectProps extends BaseProps, BorderProps {
  /** Field label displayed above the select */
  label?: string;
  options: string; // comma-separated
  placeholder: string;
  /** Default value for the select field (supports expressions) */
  defaultValue?: string;
  /** Value binding (supports expressions) */
  value?: string;
  accessibilityLabel?: string;
  /** Font size */
  fontSize?: number | string;
  /** Font family */
  fontFamily?: string;
  /** Font weight */
  fontWeight?: string;
  /** Font style */
  fontStyle?: 'normal' | 'italic';
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Z-index for layering */
  zIndex?: number;
  /** Whether select is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Enable search/filter within options (coming soon) */
  searchable?: boolean;
  /** Show clear button to reset selection */
  clearable?: boolean;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the select */
  helpText?: string;
  /** ID of element that describes this input */
  ariaDescribedBy?: string;
  /** Whether select is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Event handlers */
  onChange?: string;
  onFocus?: string;
  onBlur?: string;
  onEnterKeyPress?: string;
  /** On Change Action */
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string;
  onChangeCodeToExecute?: string;
  /** On Focus Action */
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string;
  onFocusCodeToExecute?: string;
  /** On Blur Action */
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string;
  onBlurCodeToExecute?: string;
  /** On Enter Key Press Action */
  onEnterActionType?: InputActionType;
  onEnterAlertMessage?: string;
  onEnterCodeToExecute?: string;
  /** Custom validator expression — receives `value` and `dataStore` in scope, returns error string or '' */
  customValidator?: string;
}

export interface CheckboxProps extends BaseProps {
  label: string;
  /** Initial checked state (supports expressions) */
  defaultValue?: boolean | string;
  accentColor?: string;
  /** Whether checkbox is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Secondary description text below label */
  description?: string;
  /** Hide description text when checkbox is checked */
  hideDescriptionWhenChecked?: boolean;
  /** Whether checkbox shows indeterminate state */
  indeterminate?: boolean | string;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the checkbox */
  helpText?: string;
  /** ID of element that describes this input */
  ariaDescribedBy?: string;
  /** Whether checkbox is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Event handlers */
  onChange?: string; // JS expression (deprecated, use onChangeActionType)
  onFocus?: string; // JS expression (deprecated, use onFocusActionType)
  onBlur?: string; // JS expression (deprecated, use onBlurActionType)
  onEnterKeyPress?: string; // JS expression (deprecated, use onEnterActionType)
  /** On Change Action */
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string; // Expression for alert message
  onChangeCodeToExecute?: string; // Expression for code to execute
  /** On Focus Action */
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string; // Expression for alert message
  onFocusCodeToExecute?: string; // Expression for code to execute
  /** On Blur Action */
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string; // Expression for alert message
  onBlurCodeToExecute?: string; // Expression for code to execute
  /** On Enter Key Press Action */
  onEnterActionType?: InputActionType;
  onEnterAlertMessage?: string; // Expression for alert message
  onEnterCodeToExecute?: string; // Expression for code to execute
  /** Custom validator expression — receives `value` and `dataStore` in scope, returns error string or '' */
  customValidator?: string;
}

export interface RadioGroupProps extends BaseProps {
  options: string; // comma-separated
  /** Initial selected option (supports expressions) */
  defaultValue?: string;
  groupLabel?: string;
  accentColor?: string;
  /** Whether a selection is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Layout direction for radio options */
  layout?: 'horizontal' | 'vertical';
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the radio group */
  helpText?: string;
  /** ID of element that describes this input */
  ariaDescribedBy?: string;
  /** Whether radio group is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Event handlers */
  onChange?: string; // JS expression (deprecated, use onChangeActionType)
  onFocus?: string; // JS expression (deprecated, use onFocusActionType)
  onBlur?: string; // JS expression (deprecated, use onBlurActionType)
  onEnterKeyPress?: string; // JS expression (deprecated, use onEnterActionType)
  /** On Change Action */
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string; // Expression for alert message
  onChangeCodeToExecute?: string; // Expression for code to execute
  /** On Focus Action */
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string; // Expression for alert message
  onFocusCodeToExecute?: string; // Expression for code to execute
  /** On Blur Action */
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string; // Expression for alert message
  onBlurCodeToExecute?: string; // Expression for code to execute
  /** On Enter Key Press Action */
  onEnterActionType?: InputActionType;
  onEnterAlertMessage?: string; // Expression for alert message
  onEnterCodeToExecute?: string; // Expression for code to execute
  /** Custom validator expression — receives `value` and `dataStore` in scope, returns error string or '' */
  customValidator?: string;
}

export interface SwitchProps extends BaseProps {
  label: string;
  /** Initial switch state (supports expressions) */
  defaultValue?: boolean | string;
  trackColor?: string;
  trackColorOff?: string;
  /** Whether switch is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Label shown when switch is on */
  onLabel?: string;
  /** Label shown when switch is off */
  offLabel?: string;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the switch */
  helpText?: string;
  /** ID of element that describes this input */
  ariaDescribedBy?: string;
  /** Whether switch is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Event handlers */
  onChange?: string; // JS expression (deprecated, use onChangeActionType)
  onFocus?: string; // JS expression (deprecated, use onFocusActionType)
  onBlur?: string; // JS expression (deprecated, use onBlurActionType)
  onEnterKeyPress?: string; // JS expression (deprecated, use onEnterActionType)
  /** On Change Action */
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string; // Expression for alert message
  onChangeCodeToExecute?: string; // Expression for code to execute
  /** On Focus Action */
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string; // Expression for alert message
  onFocusCodeToExecute?: string; // Expression for code to execute
  /** On Blur Action */
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string; // Expression for alert message
  onBlurCodeToExecute?: string; // Expression for code to execute
  /** On Enter Key Press Action */
  onEnterActionType?: InputActionType;
  onEnterAlertMessage?: string; // Expression for alert message
  onEnterCodeToExecute?: string; // Expression for code to execute
  /** Custom validator expression — receives `value` and `dataStore` in scope, returns error string or '' */
  customValidator?: string;
}

export interface DatePickerProps extends BaseProps, BorderProps {
  /** Field label displayed above the date picker */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Value binding (ISO date string, supports expressions) */
  value?: string;
  /** Default value (ISO date string, supports expressions) */
  defaultValue?: string;
  /** Date format for display (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY') */
  dateFormat?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'DD-MM-YYYY';
  /** Minimum selectable date (ISO date string, supports expressions) */
  minDate?: string;
  /** Maximum selectable date (ISO date string, supports expressions) */
  maxDate?: string;
  /** Whether the date picker is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the picker */
  helpText?: string;
  /** Whether the picker is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Font size */
  fontSize?: number | string;
  /** Font family */
  fontFamily?: string;
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Event handlers */
  onChange?: string;
  onFocus?: string;
  onBlur?: string;
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string;
  onChangeCodeToExecute?: string;
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string;
  onFocusCodeToExecute?: string;
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string;
  onBlurCodeToExecute?: string;
  /** Custom validator expression */
  customValidator?: string;
}

export interface TimePickerProps extends BaseProps, BorderProps {
  /** Field label displayed above the time picker */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Value binding (HH:MM or HH:MM:SS, supports expressions) */
  value?: string;
  /** Default value (supports expressions) */
  defaultValue?: string;
  /** Time format */
  timeFormat?: '12h' | '24h';
  /** Minute step interval */
  minuteStep?: number;
  /** Whether to show seconds */
  showSeconds?: boolean;
  /** Whether the time picker is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the picker */
  helpText?: string;
  /** Whether the picker is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Font size */
  fontSize?: number | string;
  /** Font family */
  fontFamily?: string;
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Event handlers */
  onChange?: string;
  onFocus?: string;
  onBlur?: string;
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string;
  onChangeCodeToExecute?: string;
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string;
  onFocusCodeToExecute?: string;
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string;
  onBlurCodeToExecute?: string;
  /** Custom validator expression */
  customValidator?: string;
}

export interface SliderProps extends BaseProps {
  /** Field label displayed above the slider */
  label?: string;
  /** Value binding (supports expressions) */
  value?: number | string;
  /** Default value */
  defaultValue?: number | string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether to show the current value label */
  showValue?: boolean;
  /** Whether to show min/max labels */
  showMinMax?: boolean;
  /** Track color (active portion) */
  trackColor?: string;
  /** Track color (inactive portion) */
  trackColorInactive?: string;
  /** Thumb color */
  thumbColor?: string;
  /** Whether the slider is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the slider */
  helpText?: string;
  /** Whether the slider is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Event handlers */
  onChange?: string;
  onFocus?: string;
  onBlur?: string;
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string;
  onChangeCodeToExecute?: string;
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string;
  onFocusCodeToExecute?: string;
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string;
  onBlurCodeToExecute?: string;
  /** Custom validator expression */
  customValidator?: string;
}

export interface FileUploadProps extends BaseProps, BorderProps {
  /** Field label displayed above the upload area */
  label?: string;
  /** Accepted file types (e.g., '.jpg,.png,.pdf' or 'image/*') */
  accept?: string;
  /** Whether multiple files can be uploaded */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Maximum number of files (when multiple is true) */
  maxFiles?: number;
  /** Placeholder text for the drop zone */
  placeholder?: string;
  /** Whether the file upload is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the upload area */
  helpText?: string;
  /** Whether the upload is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  color?: string;
  /** Font size */
  fontSize?: number | string;
  /** Event handlers */
  onChange?: string;
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string;
  onChangeCodeToExecute?: string;
  /** Custom validator expression */
  customValidator?: string;
}

export interface RatingProps extends BaseProps {
  /** Field label displayed above the rating */
  label?: string;
  /** Value binding (supports expressions) */
  value?: number | string;
  /** Default value */
  defaultValue?: number | string;
  /** Maximum number of stars */
  maxStars?: number;
  /** Whether half-star ratings are allowed */
  allowHalf?: boolean;
  /** Star size in pixels */
  starSize?: number;
  /** Active star color */
  activeColor?: string;
  /** Inactive star color */
  inactiveColor?: string;
  /** Whether the rating is required */
  required?: boolean | string;
  /** Custom error message */
  errorMessage?: string;
  /** When to trigger validation */
  validationTiming?: 'onBlur' | 'onChange' | 'onSubmit';
  /** Help text displayed below the rating */
  helpText?: string;
  /** Whether the rating is read-only */
  readOnly?: boolean | string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Whether to show the numeric value beside stars */
  showValue?: boolean;
  /** Event handlers */
  onChange?: string;
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string;
  onChangeCodeToExecute?: string;
  /** Custom validator expression */
  customValidator?: string;
}

export interface ProgressProps extends BaseProps {
  /** Progress value (0-100, supports expressions) */
  value?: number | string;
  /** Maximum value (default 100) */
  max?: number;
  /** Progress bar color */
  barColor?: string;
  /** Track/background color */
  trackColor?: string;
  /** Whether to show the percentage label */
  showLabel?: boolean;
  /** Custom label format (e.g., '{{value}}%' or 'Step {{value}} of {{max}}') */
  labelFormat?: string;
  /** Bar height/thickness */
  barHeight?: number | string;
  /** Whether the progress bar is striped */
  striped?: boolean;
  /** Whether the stripes are animated */
  animated?: boolean;
  /** Progress bar variant */
  variant?: 'linear' | 'circular';
  /** Label text color */
  labelColor?: string;
  /** Font size for the label */
  fontSize?: number | string;
  /** Status-based coloring */
  status?: 'default' | 'success' | 'warning' | 'error';
}

export interface DividerProps extends BaseProps {
  color: string;
}

export interface ContainerProps extends Omit<BaseProps, 'width' | 'height'>, BorderProps {
  /** Width in pixels (px) or percentage (%) */
  width?: number | string;
  /** Height in pixels (px) or percentage (%) */
  height?: number | string;
  /** Background color */
  backgroundColor?: string;
  /** Background image URL */
  backgroundImage?: string;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Z-index for layering */
  zIndex?: number;
  /** Custom CSS class names */
  className?: string;
  /** Tooltip text */
  tooltip?: string;
  /** onClick event handler (JS expression) */
  onClick?: string;
  /** Flex direction for child layout */
  flexDirection?: FlexDirection;
  /** Flex wrap behavior */
  flexWrap?: FlexWrap;
  /** Main axis alignment */
  justifyContent?: JustifyContent;
  /** Cross axis alignment */
  alignItems?: AlignItems;
  /** Gap between flex children (px or string) */
  gap?: number | string;
  /** Background image sizing: cover, contain, auto, 100% 100% */
  backgroundSize?: string;
  /** Background image position: center, top, bottom, left, right, or combinations */
  backgroundPosition?: string;
  /** Background image repeat: no-repeat, repeat, repeat-x, repeat-y */
  backgroundRepeat?: string;
  /** Semi-transparent overlay color for text readability over images (e.g., rgba(0,0,0,0.5)) */
  backgroundOverlay?: string;
  /** Background scroll behavior: scroll (normal) or fixed (parallax) */
  backgroundAttachment?: string;
  /** Overflow behavior: visible, hidden, scroll, auto */
  overflow?: string;
  /** CSS position: static, relative, sticky, fixed */
  position?: string;
  /** Top offset (e.g., '0px', '10px') — used with sticky/fixed position */
  positionTop?: string;
  /** Bottom offset (e.g., '0px', '10px') — used with sticky/fixed position */
  positionBottom?: string;
  /** Left offset (e.g., '0px') — used with fixed position */
  positionLeft?: string;
  /** Right offset (e.g., '0px') — used with fixed position */
  positionRight?: string;
  /** Semantic HTML tag: div, nav, main, section, article, aside, footer, header */
  semanticTag?: string;
  /** Cascading text color — inherited by child components that don't set their own */
  textColor?: string;
  /** Cascading font size — inherited by child components that don't set their own */
  textFontSize?: string;
  /** Cascading font weight — inherited by child components that don't set their own */
  textFontWeight?: string;
  /** Cascading font family — inherited by child components that don't set their own */
  textFontFamily?: string;
}

export interface ListProps extends ContainerProps {
  /** Data source array (expression that evaluates to an array) */
  data?: string;
  /** Unique key for each item (expression, defaults to index) */
  itemKey?: string;
  /** Height of each template item in pixels */
  templateHeight?: number | string;
  /** Spacing between items in pixels */
  itemSpacing?: number | string;
  /** Empty state text (shown when data is empty) */
  emptyState?: string;
  /** Event handler for item click */
  onItemClick?: string;
  /** Event handler for item selection */
  onItemSelect?: string;
  /** Event handler for data change */
  onDataChange?: string;
  /** Template children IDs (stored separately from regular children) */
  templateChildren?: string[];
}

export interface FormProps extends Omit<ContainerProps, 'onClick'> {
  /** Unique form identifier for scoped submission */
  formId?: string;
  /** Expression to execute on form submit with formData in scope */
  onSubmit?: string;
  /** Whether to reset form fields after successful submission */
  resetOnSubmit?: boolean;
  /** Whether to show a validation summary above the form */
  showValidationSummary?: boolean;
  /** Spacing between form fields */
  spacing?: 'compact' | 'normal' | 'spacious';
  /** Label placement for child form fields */
  labelPlacement?: 'top' | 'left';
}

export interface ModalProps extends ContainerProps {
  /** Expression controlling modal open state */
  isOpen?: string;
  /** Modal title text */
  title?: string;
  /** Modal size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEsc?: boolean;
  /** Expression to execute when modal closes */
  onClose?: string;
  /** Expression to execute when modal opens */
  onOpen?: string;
  /** Backdrop style */
  backdrop?: 'dark' | 'light' | 'none';
}

export interface TabsProps extends ContainerProps {
  /** Comma-separated tab names */
  tabs?: string;
  /** Default active tab index (0-based) */
  defaultActiveTab?: number;
  /** Tab visual variant */
  variant?: 'line' | 'pill' | 'card' | 'enclosed';
  /** Tab position relative to content */
  tabPosition?: 'top' | 'bottom';
  /** Expression to execute when active tab changes */
  onChange?: string;
  /** Whether tabs stretch to full width */
  fullWidth?: boolean;
}

export interface AccordionProps extends ContainerProps {
  /** Comma-separated section names */
  sections?: string;
  /** Whether multiple sections can be expanded simultaneously */
  allowMultiple?: boolean;
  /** Comma-separated indices of initially expanded sections */
  defaultExpanded?: string;
  /** Accordion visual variant */
  variant?: 'default' | 'bordered' | 'separated';
  /** Expression to execute when expanded sections change */
  onChange?: string;
  /** Position of the expand/collapse icon */
  iconPosition?: 'left' | 'right';
}

export type ComponentProps = LabelProps | InputProps | ButtonProps | ImageProps | TextareaProps | SelectProps | CheckboxProps | DividerProps | RadioGroupProps | SwitchProps | TableProps | ContainerProps | ListProps | DatePickerProps | TimePickerProps | SliderProps | FileUploadProps | RatingProps | ProgressProps | FormProps | ModalProps | TabsProps | AccordionProps | CustomWidgetProps;

/**
 * Represents a single instance of a UI component in the application.
 */
export interface AppComponent {
  /** Unique identifier (e.g. 'BUTTON_16345...') */
  id: string;
  type: ComponentType;
  /** User-friendly display name (e.g. "First Name Input", "Submit Button") */
  name?: string;
  /** Configuration properties for the component */
  props: ComponentProps;
  /** ID of the container component this component resides in, or null if root */
  parentId?: string | null;
  /** The ID of the page this component belongs to */
  pageId: string;
  /** Slot index for Tabs/Accordion — assigns this child to a specific tab panel or accordion section */
  slot?: number;
}

/**
 * The central state object for the running application.
 * Maps keys (strings) to any value.
 */
export type DataStore = Record<string, any>;


export enum AppVariableType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    OBJECT = 'object',
    ARRAY = 'array',
    ARRAY_OF_OBJECTS = 'array_of_objects',
}

export interface AppVariable {
    id: string;
    name: string;
    type: AppVariableType;
    initialValue: any;
}

// ─── Query / Data Source Types ────────────────────────────────────────────────

export type QueryType = 'rest' | 'static';
export type QueryMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface QueryConfig {
  /** REST endpoint URL (supports {{ }} expressions) */
  url?: string;
  /** HTTP method for REST queries */
  method?: QueryMethod;
  /** HTTP headers */
  headers?: Record<string, string>;
  /** Request body (supports {{ }} expressions) */
  body?: string;
  /** Static JSON data string for 'static' type queries */
  staticData?: string;
  /** Expression applied to the response (receives `data` in scope) */
  responseTransform?: string;
}

export interface AppQuery {
  /** Unique identifier */
  id: string;
  /** Scope key: accessible as $query.{name} */
  name: string;
  /** Query type */
  type: QueryType;
  /** Query configuration */
  config: QueryConfig;
  /** When the query executes */
  trigger: 'manual' | 'onMount' | 'onDependencyChange';
  /** Scope keys that trigger automatic re-execution */
  dependsOn?: string[];
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Whether the query is active */
  enabled?: boolean;
}

/**
 * The Single Source of Truth for an application.
 * This object contains the entire blueprint of the app: structure, logic, styling, and configuration.
 */
export interface AppDefinition extends AppMetadata {
  pages: AppPage[];
  mainPageId: string;
  /** Flat list of all components across all pages */
  components: AppComponent[];
  /** Initial state of the data store */
  dataStore: DataStore;
  /** Global state variable definitions */
  variables: AppVariable[];
  /** Visual theme configuration */
  theme: Theme;
  /** Integration settings */
  integration?: IntegrationSettings;
  /** Data queries (REST, static JSON) */
  queries?: AppQuery[];
}

export interface IntegrationSettings {
  accountName: string;
  tenantName: string;
  clientId: string;
  scope: string;
}

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  appDefinition: AppDefinition;
}

// ─── Custom Widget Types ──────────────────────────────────────────────────────

/** Defines a typed input parameter for a custom widget */
export interface WidgetInput {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'color';
  defaultValue?: any;
  required: boolean;
  description?: string;
}

/** Defines a typed output value exposed by a custom widget */
export interface WidgetOutput {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  expression?: string;
}

/** A reusable widget definition stored globally in the Dashboard */
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category?: string;
  icon: string;
  tags: string[];
  inputs: WidgetInput[];
  outputs: WidgetOutput[];
  components: AppComponent[];
  thumbnail?: string;
  createdAt: string;
  lastModifiedAt: string;
}

/** Props for a CUSTOM_WIDGET component instance placed in an app */
export interface CustomWidgetProps extends BaseProps {
  widgetDefinitionId: string;
  inputBindings: Record<string, string>;
}

export interface ActionHandlers {
    createRecord: (dataSourceName: string, newRecord: any) => Promise<void>;
    updateRecord: (dataSourceName: string, recordId: any, updates: any) => Promise<void>;
    deleteRecord: (dataSourceName: string, recordId: any) => Promise<void>;
    selectRecord: (dataStoreKey: string, record: any) => void;
    updateVariable: (variableName: string, newValue: any) => void;
    /** Batch-update multiple variables atomically (avoids React batching issues) */
    updateVariables?: (updates: Record<string, any>) => void;
    submitForm: (onSuccessCode?: string, scope?: Record<string, any>, pageId?: string, triggerComponentId?: string) => { success: boolean; errors: string[] };
    navigateTo?: (pageId: string) => void;
    /** Execute a named query and store the result in $query.{name} */
    runQuery?: (queryName: string) => Promise<void>;
}


export interface PaletteComponent {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  defaultProps: Record<string, any>;
}

export interface PaletteConfig {
  label: string;
  icon: React.ReactNode;
  defaultProps: Record<string, any>;
}

/**
 * Props passed to a component's renderer by the RenderedComponent host.
 *
 * Individual renderers may only use a subset of these; every property beyond
 * `component` and `evaluationScope` is optional so that components which need
 * fewer props remain assignable to `React.FC<ComponentRendererProps>`.
 */
export interface ComponentRendererProps {
  /** The component instance being rendered */
  component: AppComponent;
  /** Current interaction mode */
  mode?: 'edit' | 'preview';
  /** Evaluation scope for expression resolution */
  evaluationScope?: Record<string, any>;
  /** Global data store for value look-ups */
  dataStore?: Record<string, any>;
  /** Callback to persist a value back into the data store */
  onUpdateDataStore?: (key: string, value: any) => void;
  /** CRUD / state-update action handlers available at runtime */
  actions?: ActionHandlers;
  /** Whether the user is currently inline-editing text within this component */
  isEditingInline?: boolean;
  /** Callback to commit an inline text edit */
  onCommitInlineEdit?: (newValue: string) => void;
  /** Widget definitions for resolving CUSTOM_WIDGET instances */
  widgetDefinitions?: WidgetDefinition[];
  /** Child elements (for container components) */
  children?: React.ReactNode;
}

/**
 * Props passed to a component's properties-panel editor.
 *
 * All fields beyond `component` are optional so that components that do not
 * yet implement a properties panel (i.e. `() => null`) remain compatible.
 */
export interface ComponentPropertiesProps {
  /** The component being edited */
  component?: AppComponent;
  /** Callback to update a single property value */
  updateProp?: (key: string, value: any) => void;
  /** Opens the expression editor for a given property */
  onOpenExpressionEditor?: (propKey: string, currentValue: string) => void;
}

/**
 * Interface for implementing a new UI Component Plugin.
 */
export interface ComponentPlugin {
  type: ComponentType;
  paletteConfig: PaletteConfig;
  /** React component used to render the element on the canvas */
  renderer: React.FC<ComponentRendererProps>;
  /** React component used to render the Properties Panel controls */
  properties: React.FC<ComponentPropertiesProps>;
  /** If true, other components can be dropped inside this one */
  isContainer?: boolean;
}

// In AppStorageService interface
export interface AppStorageService {
  getAllAppsMetadata: () => Promise<AppMetadata[]>;
  getApp: (id: string) => Promise<AppDefinition | null>;
  saveApp: (app: AppDefinition) => Promise<AppDefinition>;
  createApp: (name: string, templateDefinition?: AppDefinition) => Promise<AppDefinition>;
  deleteApp: (id: string) => Promise<void>;
  renameApp: (id: string, newName: string) => Promise<AppMetadata>;
  exportAllApps: () => Promise<string>;
  exportSingleApp: (id: string) => Promise<string>;
  importApps: (jsonString: string) => Promise<void>;
  
  // Global Theme Management
  getAllThemes: () => Promise<GlobalTheme[]>;
  saveTheme: (theme: GlobalTheme) => Promise<GlobalTheme>;
  deleteTheme: (themeId: string) => Promise<void>;
  exportTheme: (themeId: string) => Promise<string>;
  importTheme: (jsonString: string) => Promise<GlobalTheme>;

  // App Template Management
  getAllTemplates: () => Promise<AppTemplate[]>;
  saveTemplate: (template: AppTemplate) => Promise<AppTemplate>;
  deleteTemplate: (templateId: string) => Promise<void>;
  exportTemplate: (templateId: string) => Promise<string>;
  exportAllTemplates: () => Promise<string>;
  importTemplates: (jsonString: string) => Promise<void>;

  // Widget Definition Management
  getAllWidgetDefinitions: () => Promise<WidgetDefinition[]>;
  getWidgetDefinition: (id: string) => Promise<WidgetDefinition | null>;
  saveWidgetDefinition: (widget: WidgetDefinition) => Promise<WidgetDefinition>;
  deleteWidgetDefinition: (widgetId: string) => Promise<void>;
  exportWidgetDefinition: (widgetId: string) => Promise<string>;
  exportAllWidgetDefinitions: () => Promise<string>;
  importWidgetDefinitions: (jsonString: string) => Promise<void>;

  // Custom Preset Management
  getAllCustomPresets: () => Promise<ComponentTemplate[]>;
  saveCustomPreset: (preset: ComponentTemplate) => Promise<ComponentTemplate>;
  deleteCustomPreset: (presetId: string) => Promise<void>;
  renameCustomPreset: (presetId: string, newName: string) => Promise<ComponentTemplate>;
  exportCustomPreset: (presetId: string) => Promise<string>;
  exportAllCustomPresets: () => Promise<string>;
  importCustomPresets: (jsonString: string) => Promise<void>;
}
