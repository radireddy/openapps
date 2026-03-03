/**
 * Form Property Schema
 *
 * Extends base container schema with form-specific properties:
 * formId, onSubmit, resetOnSubmit, showValidationSummary, spacing, labelPlacement
 */

import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { createBaseContainerSchema } from './base-container';
import { DEFAULT_GROUP_ORDER } from '../registry';

const formProperties: PropertyMetadata[] = [
  {
    id: 'formId',
    label: 'Form ID',
    type: 'string',
    defaultValue: '',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -2,
    applicableTo: [ComponentType.FORM],
    tooltip: 'Unique identifier for scoped form submission',
    placeholder: 'e.g. loginForm',
  },
  {
    id: 'spacing',
    label: 'Spacing',
    type: 'dropdown',
    defaultValue: 'normal',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: -1,
    applicableTo: [ComponentType.FORM],
    tooltip: 'Spacing between form fields',
    options: [
      { value: 'compact', label: 'Compact' },
      { value: 'normal', label: 'Normal' },
      { value: 'spacious', label: 'Spacious' },
    ],
  },
  {
    id: 'labelPlacement',
    label: 'Label Placement',
    type: 'dropdown',
    defaultValue: 'top',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.FORM],
    tooltip: 'Where labels appear relative to form fields',
    options: [
      { value: 'top', label: 'Top' },
      { value: 'left', label: 'Left' },
    ],
  },
  {
    id: 'onSubmit',
    label: 'On Submit',
    type: 'code',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 4,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.FORM],
    tooltip: 'Expression to execute on form submit (receives formData in scope)',
    placeholder: 'e.g. {{actions.updateVariable("submitted", true)}}',
  },
  {
    id: 'resetOnSubmit',
    label: 'Reset On Submit',
    type: 'boolean',
    defaultValue: false,
    group: 'Events',
    tab: 'Events',
    tabOrder: 4,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.FORM],
    tooltip: 'Whether to reset form fields after successful submission',
  },
  {
    id: 'showValidationSummary',
    label: 'Show Validation Summary',
    type: 'boolean',
    defaultValue: false,
    group: 'Events',
    tab: 'Events',
    tabOrder: 4,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.FORM],
    tooltip: 'Display a summary of validation errors above the form',
  },
];

const formGroups: PropertyGroup[] = [];

export const formSchema: ComponentPropertySchema = createBaseContainerSchema(
  ComponentType.FORM,
  formProperties,
  [],
  formGroups
);
