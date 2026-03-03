import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup, PropertyTab } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER, formValidationProperties, formAccessibilityProperties, formStateProperties, formGroups } from '../registry';
import { SharedEventsGroupRenderer } from './shared-events-renderer';

/**
 * RadioGroup-specific property definitions
 */
const radioGroupProperties: PropertyMetadata[] = [
  {
    id: 'options',
    label: 'Options',
    type: 'string',
    defaultValue: 'Option 1,Option 2',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'Comma-separated list of radio options',
    placeholder: 'e.g. Option 1,Option 2,Option 3',
  },
  {
    id: 'defaultValue',
    label: 'Default Value',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'Initial selected option',
    placeholder: 'e.g. Option 1',
  },
  {
    id: 'groupLabel',
    label: 'Group Label',
    type: 'string',
    defaultValue: '',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'A label for the whole radio group',
    placeholder: 'e.g. Choose an option',
  },
  // Appearance group
  {
    id: 'layout',
    label: 'Layout',
    type: 'dropdown',
    defaultValue: 'vertical',
    group: 'Appearance',
    tab: 'General',
    tabOrder: 0,
    groupOrder: DEFAULT_GROUP_ORDER['Appearance'],
    propertyOrder: 1,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'Direction of radio option layout',
    options: [
      { value: 'vertical', label: 'Vertical' },
      { value: 'horizontal', label: 'Horizontal' },
    ],
  },
  {
    id: 'accentColor',
    label: 'Accent Color',
    type: 'color',
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'Accent color for the radio buttons',
  },
  // Spread shared form properties
  ...formValidationProperties.map(p => ({ ...p, applicableTo: [ComponentType.RADIO_GROUP] as any })),
  ...formAccessibilityProperties.map(p => ({ ...p, applicableTo: [ComponentType.RADIO_GROUP] as any })),
  ...formStateProperties.map(p => ({ ...p, applicableTo: [ComponentType.RADIO_GROUP] as any })),
  // Layout properties - zIndex
  {
    id: 'zIndex',
    label: 'Z-Index',
    type: 'expression',
    defaultValue: undefined,
    supportsExpression: true,
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 4,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'Z-index for layering components (supports expressions)',
    placeholder: 'e.g. 1, 10, 100 or {{zIndex}}',
  },
  // Events Tab
  {
    id: 'onChangeActionType',
    label: 'On Change Action',
    type: 'dropdown',
    defaultValue: 'none',
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.RADIO_GROUP],
    options: [
      { value: 'none', label: 'None' },
      { value: 'alert', label: 'Alert' },
      { value: 'executeCode', label: 'Execute Code' },
    ],
    tooltip: 'Action to perform when radio selection changes',
  },
  {
    id: 'onChangeAlertMessage',
    label: 'Alert Message',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.RADIO_GROUP],
    visibleIf: (props) => (props as any).onChangeActionType === 'alert',
    tooltip: 'Message to display in alert (supports expressions)',
    placeholder: 'e.g., {{ "Value changed: " + event.target.value }}',
  },
  {
    id: 'onChangeCodeToExecute',
    label: 'Code to Execute',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.RADIO_GROUP],
    visibleIf: (props) => (props as any).onChangeActionType === 'executeCode',
    tooltip: 'JavaScript code to execute when radio selection changes',
    placeholder: 'e.g., {{ (() => { console.log(event.target.value); })() }}',
  },
  // On Focus Action
  {
    id: 'onFocusActionType',
    label: 'On Focus Action',
    type: 'dropdown',
    defaultValue: 'none',
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 10,
    applicableTo: [ComponentType.RADIO_GROUP],
    options: [
      { value: 'none', label: 'None' },
      { value: 'alert', label: 'Alert' },
      { value: 'executeCode', label: 'Execute Code' },
    ],
    tooltip: 'Action to perform when radio gains focus',
  },
  {
    id: 'onFocusAlertMessage',
    label: 'Alert Message',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 11,
    applicableTo: [ComponentType.RADIO_GROUP],
    visibleIf: (props) => (props as any).onFocusActionType === 'alert',
    tooltip: 'Message to display in alert when radio gains focus (supports expressions)',
    placeholder: 'e.g., {{ "Radio focused" }}',
  },
  {
    id: 'onFocusCodeToExecute',
    label: 'Code to Execute',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 12,
    applicableTo: [ComponentType.RADIO_GROUP],
    visibleIf: (props) => (props as any).onFocusActionType === 'executeCode',
    tooltip: 'JavaScript code to execute when radio gains focus',
    placeholder: 'e.g., {{ (() => { console.log("Focused"); })() }}',
  },
  // On Blur Action
  {
    id: 'onBlurActionType',
    label: 'On Blur Action',
    type: 'dropdown',
    defaultValue: 'none',
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 20,
    applicableTo: [ComponentType.RADIO_GROUP],
    options: [
      { value: 'none', label: 'None' },
      { value: 'alert', label: 'Alert' },
      { value: 'executeCode', label: 'Execute Code' },
    ],
    tooltip: 'Action to perform when radio loses focus',
  },
  {
    id: 'onBlurAlertMessage',
    label: 'Alert Message',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 21,
    applicableTo: [ComponentType.RADIO_GROUP],
    visibleIf: (props) => (props as any).onBlurActionType === 'alert',
    tooltip: 'Message to display in alert when radio loses focus (supports expressions)',
    placeholder: 'e.g., {{ "Radio blurred" }}',
  },
  {
    id: 'onBlurCodeToExecute',
    label: 'Code to Execute',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 22,
    applicableTo: [ComponentType.RADIO_GROUP],
    visibleIf: (props) => (props as any).onBlurActionType === 'executeCode',
    tooltip: 'JavaScript code to execute when radio loses focus',
    placeholder: 'e.g., {{ (() => { console.log("Blurred"); })() }}',
  },
  // On Enter Key Press Action
  {
    id: 'onEnterActionType',
    label: 'On Enter Action',
    type: 'dropdown',
    defaultValue: 'none',
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 30,
    applicableTo: [ComponentType.RADIO_GROUP],
    options: [
      { value: 'none', label: 'None' },
      { value: 'alert', label: 'Alert' },
      { value: 'executeCode', label: 'Execute Code' },
    ],
    tooltip: 'Action to perform when Enter key is pressed',
  },
  {
    id: 'onEnterAlertMessage',
    label: 'Alert Message',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 31,
    applicableTo: [ComponentType.RADIO_GROUP],
    visibleIf: (props) => (props as any).onEnterActionType === 'alert',
    tooltip: 'Message to display in alert when Enter key is pressed (supports expressions)',
    placeholder: 'e.g., {{ "Enter key pressed" }}',
  },
  {
    id: 'onEnterCodeToExecute',
    label: 'Code to Execute',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 2,
    groupOrder: 0,
    propertyOrder: 32,
    applicableTo: [ComponentType.RADIO_GROUP],
    visibleIf: (props) => (props as any).onEnterActionType === 'executeCode',
    tooltip: 'JavaScript code to execute when Enter key is pressed',
    placeholder: 'e.g., {{ (() => { console.log("Enter pressed"); })() }}',
  },
];

/**
 * RadioGroup-specific tabs - General, Styles, and Events
 */
const radioGroupTabs: PropertyTab[] = [
  { id: 'General', label: 'General', order: 0 },
  { id: 'Styles', label: 'Styles', order: 1 },
  { id: 'Events', label: 'Events', order: 2 },
];

/**
 * RadioGroup-specific groups
 * Note: Layout, State, and Styling are already in commonGroups, so we don't duplicate them
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 */
const radioGroupGroups: PropertyGroup[] = [
  { id: 'Basic', label: 'Basic', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Validation', label: 'Validation', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Appearance', label: 'Appearance', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Accessibility', label: 'Accessibility', tab: 'General', collapsible: true, defaultCollapsed: true },
  { id: 'Advanced', label: 'Advanced', tab: 'Styles', collapsible: true, defaultCollapsed: true },
  {
    id: 'Events',
    label: 'Events',
    tab: 'Events',
    collapsible: true,
    defaultCollapsed: false,
    customGroupRenderer: SharedEventsGroupRenderer,
  },
];

/**
 * RadioGroup property schema
 */
const radioGroupSchemaBase = createPropertySchema(
  ComponentType.RADIO_GROUP,
  radioGroupProperties,
  radioGroupTabs,
  [...commonGroups, ...radioGroupGroups]
);

// Filter out border properties (borderWidth, borderColor, borderRadius, borderStyle), shadow property (boxShadow),
// typography properties (fontSize, fontFamily, fontWeight, fontStyle), and color properties (color, backgroundColor)
export const radioGroupSchema: ComponentPropertySchema = {
  ...radioGroupSchemaBase,
  properties: radioGroupSchemaBase.properties.filter(
    prop => ![
      'borderWidth', 'borderColor', 'borderRadius', 'borderStyle', 'boxShadow',
      'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
      'color', 'backgroundColor'
    ].includes(prop.id)
  ),
  groups: radioGroupSchemaBase.groups.filter(
    group => !['Typography', 'Color'].includes(group.id)
  ),
};

