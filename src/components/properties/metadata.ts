import React from 'react';
import { ComponentType, ComponentProps } from '../../types';

/**
 * Property value types supported by the properties panel
 */
export type PropertyType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'color' 
  | 'dropdown' 
  | 'date' 
  | 'time' 
  | 'json' 
  | 'code' 
  | 'expression'
  | 'composite'; // Multi-field composite (e.g., padding)

/**
 * Multi-edit behavior when multiple components are selected
 */
export type MultiEditSupport = 
  | 'all'        // Can edit all selected components
  | 'common'     // Only show if common to all
  | 'none';      // Hide when multiple selected

/**
 * Validation rule for a property
 */
export interface ValidationRule {
  type: 'required' | 'max' | 'pattern' | 'custom' | 'range';
  value?: any;
  min?: number;
  max?: number;
  message?: string;
  validator?: (value: any) => boolean | string; // Returns true if valid, or error message
}

/**
 * Visibility condition for a property
 */
export type VisibilityCondition = 
  | boolean 
  | string  // Expression string
  | ((props: ComponentProps, evaluationScope: Record<string, any>) => boolean);

/**
 * Dropdown option
 */
export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Composite property field (for multi-field inputs like padding)
 */
export interface CompositeField {
  id: string;
  label: string;
  type: 'number' | 'string';
  defaultValue?: any;
}

/**
 * Layout hint for grouping related properties
 */
export interface PropertyLayoutHint {
  /** Group ID - properties with the same layoutGroupId will be rendered together */
  layoutGroupId?: string;
  /** Number of columns this property should span (1-4) */
  columnSpan?: number;
  /** Whether this property should be in a compact row with related properties */
  compactRow?: boolean;
  /** Maximum width for this property (e.g., '120px', '8rem', '150px') */
  maxWidth?: string;
}

/**
 * Property metadata definition
 */
export interface PropertyMetadata {
  /** Unique property identifier (must match prop key) */
  id: string;
  /** Human-readable label */
  label: string;
  /** Property type */
  type: PropertyType;
  /** Default value */
  defaultValue?: any;
  /** Whether this property supports expressions */
  supportsExpression?: boolean;
  /** Group name within the tab */
  group?: string;
  /** Tab name (General, Styles, Events, etc.) */
  tab?: string;
  /** Tab order (lower numbers appear first) */
  tabOrder?: number;
  /** Group order within tab (lower numbers appear first) */
  groupOrder?: number;
  /** Property order within group (lower numbers appear first) */
  propertyOrder?: number;
  /** Conditionally hide this property */
  hidden?: VisibilityCondition;
  /** Show only when condition is met */
  visibleIf?: VisibilityCondition;
  /** Which components this applies to */
  applicableTo?: ComponentType[] | 'all';
  /** Validation rules */
  validationRules?: ValidationRule[];
  /** Tooltip/help text */
  tooltip?: string;
  /** Static guidance text displayed below the input */
  helpText?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Multi-edit support behavior */
  multiEditSupport?: MultiEditSupport;
  /** For dropdown type: available options */
  options?: DropdownOption[] | (() => DropdownOption[]) | ((context: PropertyContext) => DropdownOption[]);
  /** For composite type: field definitions */
  compositeFields?: CompositeField[];
  /** Custom renderer component (optional, uses default for type if not provided) */
  customRenderer?: React.FC<any>;
  /** Layout hints for efficient space usage */
  layoutHint?: PropertyLayoutHint;
  /** Optional preset values for quick selection */
  presets?: Array<{ label: string; value: string }>;
  /** When true on a dropdown, shows a "Custom" option with a text input for arbitrary values */
  allowCustom?: boolean;
}

/**
 * Context passed to property inputs and options generators
 */
export interface PropertyContext {
  component?: { id: string; type: ComponentType; props: ComponentProps };
  components?: Array<{ id: string; type: ComponentType; props: ComponentProps }>;
  variables?: any[];
  evaluationScope?: Record<string, any>;
  isMultiSelect?: boolean;
}

/**
 * Tab definition
 */
export interface PropertyTab {
  id: string;
  label: string;
  order?: number;
  icon?: React.ReactNode;
}

/**
 * Group definition
 */
export interface PropertyGroup {
  id: string;
  label: string;
  tab: string;
  order?: number; // Order within the tab (lower numbers appear first)
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Override the default group order for this specific group (takes precedence over order) */
  orderOverride?: number;
  /** Custom renderer for the entire group (overrides default rendering) */
  customGroupRenderer?: React.FC<{
    group: PropertyGroup;
    properties: PropertyMetadata[];
    context: PropertyContext;
    onUpdate: (propertyId: string, value: any) => void;
    onOpenExpressionEditor?: (
      initialValue: string, 
      onSave: (newValue: string) => void,
      propertyContext?: {
        propertyId?: string;
        propertyLabel?: string;
        propertyType?: string;
        componentType?: string;
        tab?: string;
        group?: string;
      }
    ) => void;
    getValue: (propertyId: string) => any;
    getError: (propertyId: string) => string | undefined;
    isMixed: (propertyId: string) => boolean;
  }>;
}

/**
 * Component property schema - defines all properties for a component type
 */
export interface ComponentPropertySchema {
  componentType: ComponentType;
  tabs?: PropertyTab[];
  groups?: PropertyGroup[];
  properties: PropertyMetadata[];
}

/**
 * Property registry - maps component types to their property schemas
 */
export type PropertyRegistry = Record<ComponentType, ComponentPropertySchema>;

