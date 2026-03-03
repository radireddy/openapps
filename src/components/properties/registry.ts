import React from 'react';
import { ComponentType, ComponentProps } from '../../types';
import { ComponentPropertySchema, PropertyTab, PropertyGroup, PropertyMetadata } from './metadata';


// Inline SVG tab icons (14x14)
const SlidersIcon = React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('line', { x1: 4, y1: 21, x2: 4, y2: 14 }),
  React.createElement('line', { x1: 4, y1: 10, x2: 4, y2: 3 }),
  React.createElement('line', { x1: 12, y1: 21, x2: 12, y2: 12 }),
  React.createElement('line', { x1: 12, y1: 8, x2: 12, y2: 3 }),
  React.createElement('line', { x1: 20, y1: 21, x2: 20, y2: 16 }),
  React.createElement('line', { x1: 20, y1: 12, x2: 20, y2: 3 }),
  React.createElement('line', { x1: 1, y1: 14, x2: 7, y2: 14 }),
  React.createElement('line', { x1: 9, y1: 8, x2: 15, y2: 8 }),
  React.createElement('line', { x1: 17, y1: 16, x2: 23, y2: 16 })
);

const PaletteIcon = React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('circle', { cx: 13.5, cy: 6.5, r: 0.5 }),
  React.createElement('circle', { cx: 17.5, cy: 10.5, r: 0.5 }),
  React.createElement('circle', { cx: 8.5, cy: 7.5, r: 0.5 }),
  React.createElement('circle', { cx: 6.5, cy: 12.5, r: 0.5 }),
  React.createElement('path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z' })
);

const BoltIcon = React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' })
);

/**
 * Common property definitions that can be reused across components
 */
export const commonProperties = {
  // Layout properties
  order: {
    id: 'order',
    label: 'Order',
    type: 'number' as const,
    defaultValue: 0,
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'Flex order (controls rendering sequence within parent)',
    layoutHint: {
      maxWidth: '100px',
    },
  },
  width: {
    id: 'width',
    label: 'Width',
    type: 'string' as const,
    defaultValue: '100%',
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: 'all' as const,
    tooltip: 'Width in pixels (px), percentage (%), or auto. Examples: 400px, 50%, 100%, auto',
    placeholder: 'e.g. 100% or 400px',
    helpText: 'px, %, auto, vh/vw, fit-content',
    validationRules: [{
      type: 'custom' as const,
      message: 'Use a valid CSS size: e.g. 100%, 400px, auto',
      validator: (value: any) => {
        if (!value || value === '') return true;
        if (typeof value === 'string' && value.startsWith('{{')) return true;
        const v = String(value).trim();
        return /^(auto|inherit|initial|unset|fit-content|min-content|max-content|\d+(\.\d+)?(px|%|em|rem|vh|vw|vmin|vmax|ch|ex)|calc\(.+\)|clamp\(.+\)|min\(.+\)|max\(.+\))$/i.test(v);
      },
    }],
    layoutHint: {
      maxWidth: '120px',
    },
  },
  height: {
    id: 'height',
    label: 'Height',
    type: 'string' as const,
    defaultValue: '40px',
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: 'all' as const,
    tooltip: 'Height in pixels (px), percentage (%), or auto. Examples: 40px, 50%, auto',
    placeholder: 'e.g. 40px or auto',
    helpText: 'px, %, auto, vh/vw, fit-content',
    validationRules: [{
      type: 'custom' as const,
      message: 'Use a valid CSS size: e.g. 100%, 400px, auto',
      validator: (value: any) => {
        if (!value || value === '') return true;
        if (typeof value === 'string' && value.startsWith('{{')) return true;
        const v = String(value).trim();
        return /^(auto|inherit|initial|unset|fit-content|min-content|max-content|\d+(\.\d+)?(px|%|em|rem|vh|vw|vmin|vmax|ch|ex)|calc\(.+\)|clamp\(.+\)|min\(.+\)|max\(.+\))$/i.test(v);
      },
    }],
    layoutHint: {
      maxWidth: '120px',
    },
  },
  flexGrow: {
    id: 'flexGrow',
    label: 'Flex Grow',
    type: 'number' as const,
    defaultValue: 0,
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 3,
    applicableTo: 'all' as const,
    tooltip: 'How much the item should grow relative to siblings (0 = no grow)',
    layoutHint: {
      maxWidth: '100px',
    },
  },
  flexShrink: {
    id: 'flexShrink',
    label: 'Flex Shrink',
    type: 'number' as const,
    defaultValue: 1,
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 4,
    applicableTo: 'all' as const,
    tooltip: 'How much the item should shrink relative to siblings (1 = default shrink)',
    layoutHint: {
      maxWidth: '100px',
    },
  },
  alignSelf: {
    id: 'alignSelf',
    label: 'Align Self',
    type: 'dropdown' as const,
    defaultValue: '',
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 5,
    applicableTo: 'all' as const,
    tooltip: 'Override parent align-items for this component',
    options: [
      { value: '', label: 'Auto (inherit)' },
      { value: 'flex-start', label: 'Start' },
      { value: 'flex-end', label: 'End' },
      { value: 'center', label: 'Center' },
      { value: 'stretch', label: 'Stretch' },
      { value: 'baseline', label: 'Baseline' },
    ],
  },
  // State properties
  disabled: {
    id: 'disabled',
    label: 'Disabled',
    type: 'boolean' as const,
    defaultValue: false,
    supportsExpression: true,
    group: 'State',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'Whether the component is disabled',
    placeholder: 'e.g. {{Table1.selectedRecord == null}}',
  },
  hidden: {
    id: 'hidden',
    label: 'Hidden',
    type: 'boolean' as const,
    defaultValue: false,
    supportsExpression: true,
    group: 'State',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 1,
    applicableTo: 'all' as const,
    tooltip: 'Whether the component is hidden',
    placeholder: 'e.g. {{!showAlert}}',
  },
  // Styling properties
  opacity: {
    id: 'opacity',
    label: 'Opacity',
    type: 'expression' as const,
    defaultValue: 1,
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: 'all' as const,
    placeholder: 'e.g. 0.5 or {{theme.opacity}}',
  },
  boxShadow: {
    id: 'boxShadow',
    label: 'Shadow',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: 'all' as const,
    placeholder: 'e.g. 2px 2px 5px #ccc',
  },
  borderRadius: {
    id: 'borderRadius',
    label: 'Border Radius',
    type: 'expression' as const,
    defaultValue: '4px',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: 'all' as const,
    placeholder: 'e.g. 4px or {{theme.radius.default}}',
  },
  borderWidth: {
    id: 'borderWidth',
    label: 'Border Width',
    type: 'expression' as const,
    defaultValue: '1px',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 3,
    applicableTo: 'all' as const,
    placeholder: 'e.g. 1px or {{theme.border.width}}',
  },
  borderStyle: {
    id: 'borderStyle',
    label: 'Border Style',
    type: 'dropdown' as const,
    defaultValue: 'solid',
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 4,
    applicableTo: 'all' as const,
    options: [
      { value: 'none', label: 'None' },
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
    ],
  },
  borderColor: {
    id: 'borderColor',
    label: 'Border Color',
    type: 'color' as const,
    defaultValue: '#e5e7eb',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 5,
    applicableTo: 'all' as const,
  },
  // Spacing properties
  padding: {
    id: 'padding',
    label: 'Padding',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 6,
    applicableTo: 'all' as const,
    tooltip: 'Inner spacing (e.g., 8px, 10px 5px)',
    placeholder: 'e.g. 8px or {{theme.spacing.md}}',
  },
  margin: {
    id: 'margin',
    label: 'Margin',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 7,
    applicableTo: 'all' as const,
    tooltip: 'Outer spacing (e.g., 8px, 10px 5px)',
    placeholder: 'e.g. 8px or {{theme.spacing.md}}',
  },
  // Individual border side properties (only for components with BorderProps)
  borderTop: {
    id: 'borderTop',
    label: 'Border Top',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 8,
    applicableTo: [ComponentType.LABEL, ComponentType.INPUT, ComponentType.BUTTON, ComponentType.IMAGE, ComponentType.TEXTAREA, ComponentType.SELECT, ComponentType.TABLE, ComponentType.CONTAINER, ComponentType.LIST, ComponentType.DATE_PICKER, ComponentType.TIME_PICKER, ComponentType.FILE_UPLOAD],
    tooltip: 'Top border (e.g., 1px solid #ccc)',
    placeholder: 'e.g. 1px solid #ccc',
  },
  borderRight: {
    id: 'borderRight',
    label: 'Border Right',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 9,
    applicableTo: [ComponentType.LABEL, ComponentType.INPUT, ComponentType.BUTTON, ComponentType.IMAGE, ComponentType.TEXTAREA, ComponentType.SELECT, ComponentType.TABLE, ComponentType.CONTAINER, ComponentType.LIST, ComponentType.DATE_PICKER, ComponentType.TIME_PICKER, ComponentType.FILE_UPLOAD],
    tooltip: 'Right border (e.g., 1px solid #ccc)',
    placeholder: 'e.g. 1px solid #ccc',
  },
  borderBottom: {
    id: 'borderBottom',
    label: 'Border Bottom',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 10,
    applicableTo: [ComponentType.LABEL, ComponentType.INPUT, ComponentType.BUTTON, ComponentType.IMAGE, ComponentType.TEXTAREA, ComponentType.SELECT, ComponentType.TABLE, ComponentType.CONTAINER, ComponentType.LIST, ComponentType.DATE_PICKER, ComponentType.TIME_PICKER, ComponentType.FILE_UPLOAD],
    tooltip: 'Bottom border (e.g., 1px solid #ccc)',
    placeholder: 'e.g. 1px solid #ccc',
  },
  borderLeft: {
    id: 'borderLeft',
    label: 'Border Left',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 11,
    applicableTo: [ComponentType.LABEL, ComponentType.INPUT, ComponentType.BUTTON, ComponentType.IMAGE, ComponentType.TEXTAREA, ComponentType.SELECT, ComponentType.TABLE, ComponentType.CONTAINER, ComponentType.LIST, ComponentType.DATE_PICKER, ComponentType.TIME_PICKER, ComponentType.FILE_UPLOAD],
    tooltip: 'Left border (e.g., 1px solid #ccc)',
    placeholder: 'e.g. 1px solid #ccc',
  },
  // Hover effect properties
  hoverBackgroundColor: {
    id: 'hoverBackgroundColor',
    label: 'Hover Background',
    type: 'color' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Hover Effects',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 10,
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'Background color when hovering (preview mode only)',
  },
  hoverColor: {
    id: 'hoverColor',
    label: 'Hover Text Color',
    type: 'color' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Hover Effects',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 10,
    propertyOrder: 1,
    applicableTo: 'all' as const,
    tooltip: 'Text color when hovering (preview mode only)',
  },
  hoverOpacity: {
    id: 'hoverOpacity',
    label: 'Hover Opacity',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Hover Effects',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 10,
    propertyOrder: 2,
    applicableTo: 'all' as const,
    tooltip: 'Opacity when hovering (0 to 1)',
    placeholder: 'e.g. 0.8',
  },
  hoverTransform: {
    id: 'hoverTransform',
    label: 'Hover Transform',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Hover Effects',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 10,
    propertyOrder: 3,
    applicableTo: 'all' as const,
    tooltip: 'CSS transform on hover (e.g., scale(1.05), translateY(-2px))',
    placeholder: 'e.g. scale(1.05)',
  },
  // Advanced properties
  anchorId: {
    id: 'anchorId',
    label: 'Anchor ID',
    type: 'string' as const,
    defaultValue: '',
    group: 'Advanced',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 3, // Advanced group order (matches DEFAULT_GROUP_ORDER['Advanced'])
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'HTML id for scroll-to-section targeting. Use #anchorId in a Label href to scroll here.',
    placeholder: 'e.g. hero-section',
  },
};

/**
 * Common tabs
 */
export const commonTabs: PropertyTab[] = [
  { id: 'General', label: 'General', order: 0, icon: SlidersIcon },
  { id: 'Styles', label: 'Styles', order: 1, icon: PaletteIcon },
  { id: 'Events', label: 'Events', order: 2, icon: BoltIcon },
];

/**
 * Default group order for consistent ordering across all components
 * Groups are ordered by tab first, then by this order within each tab
 */
export const DEFAULT_GROUP_ORDER: Record<string, number> = {
  // General tab groups
  'Basic': 0,
  'Layout': 1,
  'State': 2,
  'Validation': 3,
  'Input Form And Validation': 3,
  'Appearance': 4,
  'Accessibility': 5,
  'Container Layout': 6,
  'Color & Typography': 7,
  'Spacing': 8,
  'Borders': 9,
  // Styles tab groups
  'Styling': 0,
  'Typography': 1,
  'Color': 2,
  'Hover Effects': 10,
  'Advanced': 3,
  // Events tab groups
  'Events': 0,
};

/**
 * Common groups with consistent default ordering
 */
export const commonGroups: PropertyGroup[] = [
  { id: 'Basic', label: 'Basic', tab: 'General', order: DEFAULT_GROUP_ORDER['Basic'], collapsible: true },
  { id: 'Layout', label: 'Layout', tab: 'General', order: DEFAULT_GROUP_ORDER['Layout'], collapsible: true },
  { id: 'State', label: 'State', tab: 'General', order: DEFAULT_GROUP_ORDER['State'], collapsible: true },
  { id: 'Styling', label: 'Styling', tab: 'Styles', order: DEFAULT_GROUP_ORDER['Styling'], collapsible: true },
  { id: 'Hover Effects', label: 'Hover Effects', tab: 'Styles', collapsible: true, defaultCollapsed: true },
  { id: 'Advanced', label: 'Advanced', tab: 'Styles', order: DEFAULT_GROUP_ORDER['Advanced'], collapsible: true, defaultCollapsed: true },
];

/**
 * Shared form validation properties — use in Validation group, General tab
 */
export const formValidationProperties: PropertyMetadata[] = [
  {
    id: 'required',
    label: 'Required',
    type: 'boolean' as const,
    defaultValue: false,
    supportsExpression: true,
    group: 'Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: DEFAULT_GROUP_ORDER['Validation'],
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'Whether the field is required',
    placeholder: 'e.g. true or {{someCondition}}',
  },
  {
    id: 'errorMessage',
    label: 'Error Message',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: DEFAULT_GROUP_ORDER['Validation'],
    propertyOrder: 1,
    applicableTo: 'all' as const,
    tooltip: 'Custom error message shown when validation fails',
    placeholder: 'e.g. "Please enter a valid value"',
  },
  {
    id: 'validationTiming',
    label: 'Validation Timing',
    type: 'dropdown' as const,
    defaultValue: 'onBlur',
    group: 'Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: DEFAULT_GROUP_ORDER['Validation'],
    propertyOrder: 2,
    applicableTo: 'all' as const,
    tooltip: 'When to trigger validation',
    options: [
      { value: 'onBlur', label: 'On Blur' },
      { value: 'onChange', label: 'On Change' },
      { value: 'onSubmit', label: 'On Submit' },
    ],
  },
];

/**
 * Shared form accessibility properties — use in Accessibility group, General tab
 */
export const formAccessibilityProperties: PropertyMetadata[] = [
  {
    id: 'accessibilityLabel',
    label: 'Accessibility Label',
    type: 'string' as const,
    defaultValue: '',
    group: 'Accessibility',
    tab: 'General',
    tabOrder: 0,
    groupOrder: DEFAULT_GROUP_ORDER['Accessibility'],
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'A descriptive label for screen readers',
    placeholder: 'A descriptive label for screen readers',
  },
  {
    id: 'helpText',
    label: 'Help Text',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Accessibility',
    tab: 'General',
    tabOrder: 0,
    groupOrder: DEFAULT_GROUP_ORDER['Accessibility'],
    propertyOrder: 1,
    applicableTo: 'all' as const,
    tooltip: 'Help text displayed below the component',
    placeholder: 'e.g. Enter your full name',
  },
  {
    id: 'ariaDescribedBy',
    label: 'Aria Described By',
    type: 'string' as const,
    defaultValue: '',
    group: 'Accessibility',
    tab: 'General',
    tabOrder: 0,
    groupOrder: DEFAULT_GROUP_ORDER['Accessibility'],
    propertyOrder: 2,
    applicableTo: 'all' as const,
    tooltip: 'ID of element that describes this input',
    placeholder: 'e.g. help-text-id',
  },
];

/**
 * Shared form state properties — readOnly in Advanced, size in Appearance
 */
export const formStateProperties: PropertyMetadata[] = [
  {
    id: 'readOnly',
    label: 'Read Only',
    type: 'boolean' as const,
    defaultValue: false,
    supportsExpression: true,
    group: 'Advanced',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: DEFAULT_GROUP_ORDER['Advanced'],
    propertyOrder: 10,
    applicableTo: 'all' as const,
    tooltip: 'Component is focusable but not editable (distinct from disabled)',
    placeholder: 'e.g. true or {{someCondition}}',
  },
  {
    id: 'size',
    label: 'Size',
    type: 'dropdown' as const,
    defaultValue: 'md',
    group: 'Appearance',
    tab: 'General',
    tabOrder: 0,
    groupOrder: DEFAULT_GROUP_ORDER['Appearance'],
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'Size variant for the component',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
  },
];

/**
 * Common form-specific groups
 */
export const formGroups: PropertyGroup[] = [
  { id: 'Validation', label: 'Validation', tab: 'General', order: DEFAULT_GROUP_ORDER['Validation'], collapsible: true },
  { id: 'Appearance', label: 'Appearance', tab: 'General', order: DEFAULT_GROUP_ORDER['Appearance'], collapsible: true },
  { id: 'Accessibility', label: 'Accessibility', tab: 'General', order: DEFAULT_GROUP_ORDER['Accessibility'], collapsible: true, defaultCollapsed: true },
  { id: 'Advanced', label: 'Advanced', tab: 'Styles', order: DEFAULT_GROUP_ORDER['Advanced'], collapsible: true, defaultCollapsed: true },
];

/**
 * Helper to create a property schema for a component
 */
export function createPropertySchema(
  componentType: ComponentType,
  customProperties: PropertyMetadata[],
  customTabs?: PropertyTab[],
  customGroups?: PropertyGroup[]
): ComponentPropertySchema {
  // Get common properties applicable to this component
  const applicableCommonProps = Object.values(commonProperties).filter((prop) => {
    if (prop.applicableTo === 'all') return true;
    if (Array.isArray(prop.applicableTo)) {
      const applicableTypes = prop.applicableTo as ComponentType[];
      return applicableTypes.includes(componentType);
    }
    return false;
  });

  // Combine common and custom properties, with custom properties overriding common ones
  // Deduplicate by id - custom properties take precedence
  const propertyMap = new Map<string, PropertyMetadata>();
  applicableCommonProps.forEach(prop => {
    propertyMap.set(prop.id, prop);
  });
  customProperties.forEach(prop => {
    propertyMap.set(prop.id, prop); // Custom properties override common ones
  });
  const allProperties = Array.from(propertyMap.values());

  // Use custom tabs/groups or defaults
  const tabs = customTabs || commonTabs;
  
  // Merge common and custom groups, deduplicating by id
  let groups: PropertyGroup[];
  if (customGroups && customGroups.length > 0) {
    const groupMap = new Map<string, PropertyGroup>();
    // First add common groups
    commonGroups.forEach(group => {
      groupMap.set(group.id, group);
    });
    // Then add/override with custom groups (custom groups take precedence)
    customGroups.forEach(group => {
      // If custom group doesn't have an order, use default order
      if (group.order === undefined) {
        group.order = DEFAULT_GROUP_ORDER[group.id] ?? 999;
      }
      groupMap.set(group.id, group);
    });
    groups = Array.from(groupMap.values());
  } else {
    groups = commonGroups;
  }
  
  // Sort groups: first by tab, then by order within tab
  groups.sort((a, b) => {
    // First sort by tab order
    const tabA = tabs.find(t => t.id === a.tab);
    const tabB = tabs.find(t => t.id === b.tab);
    const tabOrderA = tabA?.order ?? 999;
    const tabOrderB = tabB?.order ?? 999;
    if (tabOrderA !== tabOrderB) {
      return tabOrderA - tabOrderB;
    }
    
    // Within the same tab, sort by order
    // Use orderOverride if provided, otherwise use order, otherwise use default order
    const orderA = a.orderOverride ?? a.order ?? DEFAULT_GROUP_ORDER[a.id] ?? 999;
    const orderB = b.orderOverride ?? b.order ?? DEFAULT_GROUP_ORDER[b.id] ?? 999;
    return orderA - orderB;
  });

  return {
    componentType,
    tabs,
    groups,
    properties: allProperties,
  };
}

/**
 * Property registry - will be populated by component schemas
 */
export const propertyRegistry: Partial<Record<ComponentType, ComponentPropertySchema>> = {};

/**
 * Register a property schema for a component type
 */
export function registerPropertySchema(schema: ComponentPropertySchema): void {
  propertyRegistry[schema.componentType] = schema;
}

