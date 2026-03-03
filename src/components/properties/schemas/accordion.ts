/**
 * Accordion Property Schema
 *
 * Extends base container schema with accordion-specific properties:
 * sections, allowMultiple, defaultExpanded, variant, onChange, iconPosition
 */

import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { createBaseContainerSchema } from './base-container';

const accordionProperties: PropertyMetadata[] = [
  {
    id: 'sections',
    label: 'Section Names',
    type: 'string',
    defaultValue: 'Section 1,Section 2,Section 3',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -4,
    applicableTo: [ComponentType.ACCORDION],
    tooltip: 'Comma-separated list of section names',
    placeholder: 'e.g. Personal,Address,Payment',
  },
  {
    id: 'allowMultiple',
    label: 'Allow Multiple Open',
    type: 'boolean',
    defaultValue: false,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -3,
    applicableTo: [ComponentType.ACCORDION],
    tooltip: 'Allow multiple sections to be expanded simultaneously',
  },
  {
    id: 'defaultExpanded',
    label: 'Default Expanded',
    type: 'string',
    defaultValue: '0',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -2,
    applicableTo: [ComponentType.ACCORDION],
    tooltip: 'Comma-separated indices of initially expanded sections',
    placeholder: 'e.g. 0,2',
  },
  {
    id: 'variant',
    label: 'Variant',
    type: 'dropdown',
    defaultValue: 'default',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -1,
    applicableTo: [ComponentType.ACCORDION],
    tooltip: 'Accordion visual style',
    options: [
      { value: 'default', label: 'Default (dividers)' },
      { value: 'bordered', label: 'Bordered' },
      { value: 'separated', label: 'Separated (cards)' },
    ],
  },
  {
    id: 'iconPosition',
    label: 'Icon Position',
    type: 'dropdown',
    defaultValue: 'right',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.ACCORDION],
    tooltip: 'Position of the expand/collapse chevron icon',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ],
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
    applicableTo: [ComponentType.ACCORDION],
    tooltip: 'Expression to execute when expanded sections change',
    placeholder: "e.g. {{actions.updateVariable('expanded', expandedSections)}}",
  },
];

export const accordionSchema: ComponentPropertySchema = createBaseContainerSchema(
  ComponentType.ACCORDION,
  accordionProperties,
);
