import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER, formValidationProperties, formAccessibilityProperties, formStateProperties, formGroups } from '../registry';
import { EventsGroupRenderer } from './input-events-renderer';

const ratingProperties: PropertyMetadata[] = [
  {
    id: 'label', label: 'Label', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: -1,
    applicableTo: [ComponentType.RATING],
    placeholder: 'e.g. Rate this product',
  },
  {
    id: 'value', label: 'Value', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.RATING],
    placeholder: 'e.g. {{product.rating}}',
  },
  {
    id: 'defaultValue', label: 'Default Value', type: 'number', defaultValue: 0,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.RATING],
  },
  {
    id: 'maxStars', label: 'Max Stars', type: 'number', defaultValue: 5,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.RATING],
    layoutHint: { maxWidth: '80px' },
  },
  {
    id: 'allowHalf', label: 'Allow Half Stars', type: 'boolean', defaultValue: false,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 3,
    applicableTo: [ComponentType.RATING],
  },
  {
    id: 'showValue', label: 'Show Value Label', type: 'boolean', defaultValue: false,
    group: 'Appearance', tab: 'General',
    tabOrder: 0, groupOrder: DEFAULT_GROUP_ORDER['Appearance'], propertyOrder: 1,
    applicableTo: [ComponentType.RATING],
  },
  {
    id: 'starSize', label: 'Star Size (px)', type: 'number', defaultValue: 24,
    group: 'Appearance', tab: 'General',
    tabOrder: 0, groupOrder: DEFAULT_GROUP_ORDER['Appearance'], propertyOrder: 2,
    applicableTo: [ComponentType.RATING],
    layoutHint: { maxWidth: '80px' },
  },
  // Styling
  {
    id: 'activeColor', label: 'Active Color', type: 'color', defaultValue: '#f59e0b',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.RATING],
    tooltip: 'Color for filled stars',
  },
  {
    id: 'inactiveColor', label: 'Inactive Color', type: 'color', defaultValue: '#e5e7eb',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.RATING],
    tooltip: 'Color for empty stars',
  },
  ...formValidationProperties.map(p => ({ ...p, applicableTo: [ComponentType.RATING] as ComponentType[] })),
  ...formAccessibilityProperties.map(p => ({ ...p, applicableTo: [ComponentType.RATING] as ComponentType[] })),
  ...formStateProperties.map(p => ({ ...p, applicableTo: [ComponentType.RATING] as ComponentType[] })),
];

const ratingGroups: PropertyGroup[] = [
  ...formGroups,
  { id: 'Events', label: 'Events', tab: 'Events', collapsible: true, defaultCollapsed: false, customGroupRenderer: EventsGroupRenderer },
];

export const ratingSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.RATING,
  ratingProperties,
  commonTabs,
  [...commonGroups, ...ratingGroups]
);
