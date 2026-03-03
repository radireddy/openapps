/**
 * List Component Property Definitions
 * 
 * Extends base container properties with List-specific properties:
 * - Data binding
 * - Template settings
 * - List-specific events
 */

import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyTab, PropertyGroup } from '../metadata';
import { createBaseContainerSchema, createBaseContainerProperties } from './base-container';
import { commonGroups, DEFAULT_GROUP_ORDER } from '../registry';

/**
 * List-specific properties
 */
const listProperties: PropertyMetadata[] = [
  // General Tab - Data group
  {
    id: 'data',
    label: 'Data',
    type: 'expression',
    defaultValue: '{{[]}}',
    supportsExpression: true,
    group: 'Data',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Array data source for generating repeated items (must evaluate to an array)',
    placeholder: 'e.g. {{Users.data}} or {{[1,2,3]}}',
  },
  {
    id: 'itemKey',
    label: 'Item Key',
    type: 'expression',
    defaultValue: '{{index}}',
    supportsExpression: true,
    group: 'Data',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Unique key for each item (defaults to index)',
    placeholder: 'e.g. {{currentItem.id}}',
  },
  {
    id: 'emptyState',
    label: 'Empty State',
    type: 'expression',
    defaultValue: 'No items found',
    supportsExpression: true,
    group: 'Data',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Text shown when data array is empty',
    placeholder: 'e.g. {{"No items available"}}',
  },

  // Template Settings Tab - Template group
  {
    id: 'templateHeight',
    label: 'Template Height',
    type: 'expression',
    defaultValue: 120,
    supportsExpression: true,
    group: 'Template',
    tab: 'Template Settings',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Height of each template item in pixels',
    placeholder: 'e.g. 120 or {{120}}',
  },
  {
    id: 'itemSpacing',
    label: 'Item Spacing',
    type: 'expression',
    defaultValue: 8,
    supportsExpression: true,
    group: 'Template',
    tab: 'Template Settings',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Spacing between items in pixels',
    placeholder: 'e.g. 8 or {{theme.spacing.md}}',
  },
];

/**
 * List-specific tabs
 */
const listTabs: PropertyTab[] = [
  { id: 'General', label: 'General', order: 0 },
  { id: 'Template Settings', label: 'Template Settings', order: 1 },
  { id: 'Styles', label: 'Styles', order: 2 },
  { id: 'Events', label: 'Events', order: 3 },
];

/**
 * List-specific groups
 */
const listGroups: PropertyGroup[] = [
  {
    id: 'Data',
    label: 'Data',
    tab: 'General',
    order: 0,
    collapsible: true,
    defaultCollapsed: false,
  },
  {
    id: 'Template',
    label: 'Template',
    tab: 'Template Settings',
    order: 0,
    collapsible: true,
    defaultCollapsed: false,
  },
];

/**
 * List-specific event properties
 */
const listEventProperties: PropertyMetadata[] = [
  {
    id: 'onItemClick',
    label: 'onItemClick',
    type: 'code',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 3,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.LIST],
    tooltip: 'JavaScript expression executed when a list item is clicked. Context: { currentItem, index, actions }',
    placeholder: 'e.g. {{actions.updateVariable("selectedItem", currentItem)}}',
  },
  {
    id: 'onItemSelect',
    label: 'onItemSelect',
    type: 'code',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 3,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.LIST],
    tooltip: 'JavaScript expression executed when a list item is selected. Context: { currentItem, index, actions }',
    placeholder: 'e.g. {{actions.selectRecord("selected", currentItem)}}',
  },
  {
    id: 'onDataChange',
    label: 'onDataChange',
    type: 'code',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 3,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.LIST],
    tooltip: 'JavaScript expression executed when the bound data changes. Context: { data, actions }',
    placeholder: 'e.g. {{console.log("Data changed", data)}}',
  },
];

/**
 * Creates the complete List property schema
 */
export function createListSchema(): ComponentPropertySchema {
  // Get base container properties
  const baseProperties = createBaseContainerProperties(ComponentType.LIST);

  // Combine all properties
  const allProperties = [
    ...baseProperties,
    ...listProperties,
    ...listEventProperties,
  ];

  // Create schema with base container structure + List-specific additions
  return createBaseContainerSchema(
    ComponentType.LIST,
    allProperties,
    listTabs,
    listGroups
  );
}

// Export the schema
export const listSchema = createListSchema();

