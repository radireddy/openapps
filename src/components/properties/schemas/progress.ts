import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonTabs, commonGroups, createPropertySchema } from '../registry';
import { fontSizePresets } from './typographyPresets';

const progressProperties: PropertyMetadata[] = [
  {
    id: 'value', label: 'Value', type: 'expression', defaultValue: 60,
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.PROGRESS],
    tooltip: 'Current progress value (0 to max)',
    placeholder: 'e.g. 60 or {{progress}}',
  },
  {
    id: 'max', label: 'Max', type: 'number', defaultValue: 100,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.PROGRESS],
    layoutHint: { maxWidth: '80px' },
  },
  {
    id: 'variant', label: 'Variant', type: 'dropdown', defaultValue: 'linear',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.PROGRESS],
    options: [
      { value: 'linear', label: 'Linear' },
      { value: 'circular', label: 'Circular' },
    ],
  },
  {
    id: 'showLabel', label: 'Show Label', type: 'boolean', defaultValue: true,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 3,
    applicableTo: [ComponentType.PROGRESS],
  },
  {
    id: 'labelFormat', label: 'Label Format', type: 'string', defaultValue: '',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 4,
    applicableTo: [ComponentType.PROGRESS],
    tooltip: 'Custom label: use {{value}}, {{max}}, {{percentage}}',
    placeholder: 'e.g. {{value}}/{{max}} or Step {{value}} of {{max}}',
    visibleIf: (props) => (props as any).showLabel !== false,
  },
  {
    id: 'barHeight', label: 'Bar Height', type: 'number', defaultValue: 8,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 5,
    applicableTo: [ComponentType.PROGRESS],
    layoutHint: { maxWidth: '80px' },
  },
  {
    id: 'status', label: 'Status', type: 'dropdown', defaultValue: 'default',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 6,
    applicableTo: [ComponentType.PROGRESS],
    options: [
      { value: 'default', label: 'Default' },
      { value: 'success', label: 'Success' },
      { value: 'warning', label: 'Warning' },
      { value: 'error', label: 'Error' },
    ],
    tooltip: 'Status-based coloring (overrides bar color)',
  },
  {
    id: 'striped', label: 'Striped', type: 'boolean', defaultValue: false,
    group: 'Appearance', tab: 'General',
    tabOrder: 0, groupOrder: 4, propertyOrder: 0,
    applicableTo: [ComponentType.PROGRESS],
    visibleIf: (props) => (props as any).variant !== 'circular',
  },
  {
    id: 'animated', label: 'Animated Stripes', type: 'boolean', defaultValue: false,
    group: 'Appearance', tab: 'General',
    tabOrder: 0, groupOrder: 4, propertyOrder: 1,
    applicableTo: [ComponentType.PROGRESS],
    visibleIf: (props) => (props as any).striped === true && (props as any).variant !== 'circular',
  },
  // Styling
  {
    id: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.PROGRESS],
    tooltip: 'Progress bar fill color',
  },
  {
    id: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.PROGRESS],
    tooltip: 'Background track color',
  },
  {
    id: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.PROGRESS],
  },
  {
    id: 'fontSize', label: 'Font Size', type: 'dropdown', defaultValue: '',
    group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 3,
    applicableTo: [ComponentType.PROGRESS],
    tooltip: 'Font size - select a scale preset or enter a custom value',
    placeholder: 'e.g. 12px',
    options: fontSizePresets,
    allowCustom: true,
  },
];

const progressGroups: PropertyGroup[] = [
  { id: 'Appearance', label: 'Appearance', tab: 'General', order: 4, collapsible: true },
];

export const progressSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.PROGRESS,
  progressProperties,
  commonTabs,
  [...commonGroups, ...progressGroups]
);
