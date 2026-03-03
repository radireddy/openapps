import { ComponentType } from '../../../types';
import { PropertyMetadata } from '../metadata';
import { createPropertySchema, commonProperties } from '../registry';

export const inputProperties: PropertyMetadata[] = [
  {
    id: 'placeholder',
    label: 'Placeholder',
    type: 'expression',
    defaultValue: 'Enter text...',
    supportsExpression: true,
    group: 'Settings',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 0,
    applicableTo: [ComponentType.INPUT],
    tooltip: 'Placeholder text shown when input is empty',
  },
  {
    id: 'accessibilityLabel',
    label: 'Accessibility Label',
    type: 'string',
    defaultValue: 'Text input field',
    group: 'Accessibility',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 3,
    propertyOrder: 0,
    applicableTo: [ComponentType.INPUT],
    tooltip: 'A descriptive label for screen readers',
    placeholder: 'A descriptive label for screen readers',
  },
];

export const inputSchema = createPropertySchema(ComponentType.INPUT, inputProperties);



