import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyTab, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Divider-specific property definitions
 */
const dividerProperties: PropertyMetadata[] = [
  {
    id: 'color',
    label: 'Color',
    type: 'color',
    defaultValue: '#d1d5db',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.DIVIDER],
  },
  {
    id: 'opacity',
    label: 'Opacity',
    type: 'expression',
    defaultValue: 1,
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.DIVIDER],
    placeholder: 'e.g. 0.5 or {{theme.opacity}}',
  },
  {
    id: 'boxShadow',
    label: 'Shadow',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.DIVIDER],
    placeholder: 'e.g. 2px 2px 5px #ccc',
  },
];

/**
 * Divider property schema
 */
export const dividerSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.DIVIDER,
  dividerProperties,
  commonTabs,
  commonGroups
);

