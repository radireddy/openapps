/**
 * Tabs Property Schema
 *
 * Extends base container schema with tabs-specific properties:
 * tabs, defaultActiveTab, variant, tabPosition, onChange, fullWidth
 */

import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { createBaseContainerSchema } from './base-container';

const tabsProperties: PropertyMetadata[] = [
  {
    id: 'tabs',
    label: 'Tab Names',
    type: 'string',
    defaultValue: 'Tab 1,Tab 2,Tab 3',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -4,
    applicableTo: [ComponentType.TABS],
    tooltip: 'Comma-separated list of tab names',
    placeholder: 'e.g. Overview,Details,Settings',
  },
  {
    id: 'defaultActiveTab',
    label: 'Default Active Tab',
    type: 'number',
    defaultValue: 0,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -3,
    applicableTo: [ComponentType.TABS],
    tooltip: 'Index of the initially active tab (0-based)',
    layoutHint: { maxWidth: '100px' },
  },
  {
    id: 'variant',
    label: 'Variant',
    type: 'dropdown',
    defaultValue: 'line',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -2,
    applicableTo: [ComponentType.TABS],
    tooltip: 'Tab visual style',
    options: [
      { value: 'line', label: 'Line (underline)' },
      { value: 'pill', label: 'Pill (rounded)' },
      { value: 'card', label: 'Card (bordered)' },
      { value: 'enclosed', label: 'Enclosed (box)' },
    ],
  },
  {
    id: 'tabPosition',
    label: 'Tab Position',
    type: 'dropdown',
    defaultValue: 'top',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -1,
    applicableTo: [ComponentType.TABS],
    tooltip: 'Position of tab headers relative to content',
    options: [
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
    ],
  },
  {
    id: 'fullWidth',
    label: 'Full Width Tabs',
    type: 'boolean',
    defaultValue: false,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.TABS],
    tooltip: 'Whether tabs stretch to fill the full width',
  },
  {
    id: 'onChange',
    label: 'On Change',
    type: 'code',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 4,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.TABS],
    tooltip: 'Expression to execute when active tab changes (receives activeTab, tabName in scope)',
    placeholder: "e.g. {{actions.updateVariable('currentTab', tabName)}}",
  },
];

export const tabsSchema: ComponentPropertySchema = createBaseContainerSchema(
  ComponentType.TABS,
  tabsProperties,
);
