import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER, formValidationProperties, formAccessibilityProperties, formStateProperties, formGroups } from '../registry';
import { EventsGroupRenderer } from './input-events-renderer';

const datePickerProperties: PropertyMetadata[] = [
  {
    id: 'label', label: 'Label', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: -1,
    applicableTo: [ComponentType.DATE_PICKER],
    tooltip: 'Field label displayed above the date picker',
    placeholder: 'e.g. Birth Date',
  },
  {
    id: 'value', label: 'Value', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.DATE_PICKER],
    tooltip: 'Current date value (ISO format YYYY-MM-DD)',
    placeholder: 'e.g. 2024-01-15',
  },
  {
    id: 'defaultValue', label: 'Default Value', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.DATE_PICKER],
    tooltip: 'Initial date value',
    placeholder: 'e.g. 2024-01-01',
  },
  {
    id: 'placeholder', label: 'Placeholder', type: 'string', defaultValue: '',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.DATE_PICKER],
    placeholder: 'e.g. Select a date',
  },
  {
    id: 'dateFormat', label: 'Date Format', type: 'dropdown', defaultValue: 'YYYY-MM-DD',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 3,
    applicableTo: [ComponentType.DATE_PICKER],
    options: [
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
      { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
    ],
  },
  {
    id: 'minDate', label: 'Min Date', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Validation', tab: 'General',
    tabOrder: 0, groupOrder: DEFAULT_GROUP_ORDER['Validation'], propertyOrder: 3,
    applicableTo: [ComponentType.DATE_PICKER],
    tooltip: 'Earliest selectable date (YYYY-MM-DD)',
    placeholder: 'e.g. 2024-01-01',
  },
  {
    id: 'maxDate', label: 'Max Date', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Validation', tab: 'General',
    tabOrder: 0, groupOrder: DEFAULT_GROUP_ORDER['Validation'], propertyOrder: 4,
    applicableTo: [ComponentType.DATE_PICKER],
    tooltip: 'Latest selectable date (YYYY-MM-DD)',
    placeholder: 'e.g. 2025-12-31',
  },
  // Styling
  {
    id: 'backgroundColor', label: 'Background', type: 'color', defaultValue: '#ffffff',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.DATE_PICKER],
  },
  {
    id: 'color', label: 'Text Color', type: 'color', defaultValue: '#111827',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.DATE_PICKER],
  },
  ...formValidationProperties.map(p => ({ ...p, applicableTo: [ComponentType.DATE_PICKER] as ComponentType[] })),
  ...formAccessibilityProperties.map(p => ({ ...p, applicableTo: [ComponentType.DATE_PICKER] as ComponentType[] })),
  ...formStateProperties.map(p => ({ ...p, applicableTo: [ComponentType.DATE_PICKER] as ComponentType[] })),
];

const datePickerGroups: PropertyGroup[] = [
  ...formGroups,
  { id: 'Events', label: 'Events', tab: 'Events', collapsible: true, defaultCollapsed: false, customGroupRenderer: EventsGroupRenderer },
];

export const datePickerSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.DATE_PICKER,
  datePickerProperties,
  commonTabs,
  [...commonGroups, ...datePickerGroups]
);
