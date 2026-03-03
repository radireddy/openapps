import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER, formValidationProperties, formAccessibilityProperties, formStateProperties, formGroups } from '../registry';
import { EventsGroupRenderer } from './input-events-renderer';

const timePickerProperties: PropertyMetadata[] = [
  {
    id: 'label', label: 'Label', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: -1,
    applicableTo: [ComponentType.TIME_PICKER],
    tooltip: 'Field label displayed above the time picker',
    placeholder: 'e.g. Start Time',
  },
  {
    id: 'value', label: 'Value', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.TIME_PICKER],
    tooltip: 'Current time value (HH:MM format)',
    placeholder: 'e.g. 14:30',
  },
  {
    id: 'defaultValue', label: 'Default Value', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.TIME_PICKER],
    placeholder: 'e.g. 09:00',
  },
  {
    id: 'placeholder', label: 'Placeholder', type: 'string', defaultValue: '',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.TIME_PICKER],
    placeholder: 'e.g. Select a time',
  },
  {
    id: 'timeFormat', label: 'Time Format', type: 'dropdown', defaultValue: '24h',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 3,
    applicableTo: [ComponentType.TIME_PICKER],
    options: [
      { value: '24h', label: '24 Hour' },
      { value: '12h', label: '12 Hour (AM/PM)' },
    ],
  },
  {
    id: 'minuteStep', label: 'Minute Step', type: 'number', defaultValue: 15,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 4,
    applicableTo: [ComponentType.TIME_PICKER],
    tooltip: 'Interval between minute options',
  },
  {
    id: 'showSeconds', label: 'Show Seconds', type: 'boolean', defaultValue: false,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 5,
    applicableTo: [ComponentType.TIME_PICKER],
  },
  // Styling
  {
    id: 'backgroundColor', label: 'Background', type: 'color', defaultValue: '#ffffff',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.TIME_PICKER],
  },
  {
    id: 'color', label: 'Text Color', type: 'color', defaultValue: '#111827',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.TIME_PICKER],
  },
  ...formValidationProperties.map(p => ({ ...p, applicableTo: [ComponentType.TIME_PICKER] as ComponentType[] })),
  ...formAccessibilityProperties.map(p => ({ ...p, applicableTo: [ComponentType.TIME_PICKER] as ComponentType[] })),
  ...formStateProperties.map(p => ({ ...p, applicableTo: [ComponentType.TIME_PICKER] as ComponentType[] })),
];

const timePickerGroups: PropertyGroup[] = [
  ...formGroups,
  { id: 'Events', label: 'Events', tab: 'Events', collapsible: true, defaultCollapsed: false, customGroupRenderer: EventsGroupRenderer },
];

export const timePickerSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.TIME_PICKER,
  timePickerProperties,
  commonTabs,
  [...commonGroups, ...timePickerGroups]
);
