import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER, formValidationProperties, formAccessibilityProperties, formStateProperties, formGroups } from '../registry';
import { EventsGroupRenderer } from './input-events-renderer';

const sliderProperties: PropertyMetadata[] = [
  {
    id: 'label', label: 'Label', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: -1,
    applicableTo: [ComponentType.SLIDER],
    tooltip: 'Field label displayed above the slider',
    placeholder: 'e.g. Volume',
  },
  {
    id: 'value', label: 'Value', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.SLIDER],
    placeholder: 'e.g. {{volume}}',
  },
  {
    id: 'defaultValue', label: 'Default Value', type: 'expression', defaultValue: 50,
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.SLIDER],
  },
  {
    id: 'min', label: 'Min', type: 'number', defaultValue: 0,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.SLIDER],
    layoutHint: { maxWidth: '80px' },
  },
  {
    id: 'max', label: 'Max', type: 'number', defaultValue: 100,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 3,
    applicableTo: [ComponentType.SLIDER],
    layoutHint: { maxWidth: '80px' },
  },
  {
    id: 'step', label: 'Step', type: 'number', defaultValue: 1,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 4,
    applicableTo: [ComponentType.SLIDER],
    layoutHint: { maxWidth: '80px' },
  },
  {
    id: 'showValue', label: 'Show Value', type: 'boolean', defaultValue: true,
    group: 'Appearance', tab: 'General',
    tabOrder: 0, groupOrder: DEFAULT_GROUP_ORDER['Appearance'], propertyOrder: 1,
    applicableTo: [ComponentType.SLIDER],
  },
  {
    id: 'showMinMax', label: 'Show Min/Max', type: 'boolean', defaultValue: false,
    group: 'Appearance', tab: 'General',
    tabOrder: 0, groupOrder: DEFAULT_GROUP_ORDER['Appearance'], propertyOrder: 2,
    applicableTo: [ComponentType.SLIDER],
  },
  // Styling
  {
    id: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.SLIDER],
    tooltip: 'Active track color',
  },
  {
    id: 'trackColorInactive', label: 'Track Inactive', type: 'color', defaultValue: '',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.SLIDER],
    tooltip: 'Inactive track color',
  },
  {
    id: 'thumbColor', label: 'Thumb Color', type: 'color', defaultValue: '',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.SLIDER],
  },
  ...formValidationProperties.map(p => ({ ...p, applicableTo: [ComponentType.SLIDER] as ComponentType[] })),
  ...formAccessibilityProperties.map(p => ({ ...p, applicableTo: [ComponentType.SLIDER] as ComponentType[] })),
  ...formStateProperties.map(p => ({ ...p, applicableTo: [ComponentType.SLIDER] as ComponentType[] })),

  // Events Tab - On Change
  {
    id: 'onChangeActionType', label: 'On Change Action', type: 'dropdown', defaultValue: 'none',
    group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.SLIDER],
    options: [
      { value: 'none', label: 'None' },
      { value: 'alert', label: 'Alert' },
      { value: 'executeCode', label: 'Execute Code' },
    ],
    tooltip: 'Action to perform when slider value changes',
  },
  {
    id: 'onChangeAlertMessage', label: 'Alert Message', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.SLIDER],
    visibleIf: (props) => (props as any).onChangeActionType === 'alert',
    tooltip: 'Message to display in alert (supports expressions)',
    placeholder: 'e.g., {{ "Value changed: " + event.target.value }}',
  },
  {
    id: 'onChangeCodeToExecute', label: 'Code to Execute', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.SLIDER],
    visibleIf: (props) => (props as any).onChangeActionType === 'executeCode',
    tooltip: 'JavaScript code to execute when slider value changes',
    placeholder: 'e.g., {{ actions.updateDataStore(\'Input1\', event.target.value) }}',
  },
  // Events Tab - On Focus
  {
    id: 'onFocusActionType', label: 'On Focus Action', type: 'dropdown', defaultValue: 'none',
    group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 10,
    applicableTo: [ComponentType.SLIDER],
    options: [
      { value: 'none', label: 'None' },
      { value: 'alert', label: 'Alert' },
      { value: 'executeCode', label: 'Execute Code' },
    ],
    tooltip: 'Action to perform when slider gains focus',
  },
  {
    id: 'onFocusAlertMessage', label: 'Alert Message', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 11,
    applicableTo: [ComponentType.SLIDER],
    visibleIf: (props) => (props as any).onFocusActionType === 'alert',
    tooltip: 'Message to display in alert when slider gains focus (supports expressions)',
    placeholder: 'e.g., {{ "Slider focused" }}',
  },
  {
    id: 'onFocusCodeToExecute', label: 'Code to Execute', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 12,
    applicableTo: [ComponentType.SLIDER],
    visibleIf: (props) => (props as any).onFocusActionType === 'executeCode',
    tooltip: 'JavaScript code to execute when slider gains focus',
    placeholder: 'e.g., {{ (() => { console.log("Focused"); })() }}',
  },
  // Events Tab - On Blur
  {
    id: 'onBlurActionType', label: 'On Blur Action', type: 'dropdown', defaultValue: 'none',
    group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 20,
    applicableTo: [ComponentType.SLIDER],
    options: [
      { value: 'none', label: 'None' },
      { value: 'alert', label: 'Alert' },
      { value: 'executeCode', label: 'Execute Code' },
    ],
    tooltip: 'Action to perform when slider loses focus',
  },
  {
    id: 'onBlurAlertMessage', label: 'Alert Message', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 21,
    applicableTo: [ComponentType.SLIDER],
    visibleIf: (props) => (props as any).onBlurActionType === 'alert',
    tooltip: 'Message to display in alert when slider loses focus (supports expressions)',
    placeholder: 'e.g., {{ "Slider blurred" }}',
  },
  {
    id: 'onBlurCodeToExecute', label: 'Code to Execute', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Events', tab: 'Events', tabOrder: 2, groupOrder: 0, propertyOrder: 22,
    applicableTo: [ComponentType.SLIDER],
    visibleIf: (props) => (props as any).onBlurActionType === 'executeCode',
    tooltip: 'JavaScript code to execute when slider loses focus',
    placeholder: 'e.g., {{ (() => { console.log("Blurred"); })() }}',
  },
];

const sliderGroups: PropertyGroup[] = [
  ...formGroups,
  { id: 'Events', label: 'Events', tab: 'Events', collapsible: true, defaultCollapsed: false, customGroupRenderer: EventsGroupRenderer },
];

export const sliderSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.SLIDER,
  sliderProperties,
  commonTabs,
  [...commonGroups, ...sliderGroups]
);
