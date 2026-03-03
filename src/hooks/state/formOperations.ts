/**
 * Form Operations — pure functions for form-scoped field collection,
 * validation, reset, and onSubmit execution.
 */

import { AppComponent, ComponentType, FormProps } from '@/types';
import { safeEval } from '@/expressions/engine';

/** Component types that are considered form fields */
export const FORM_FIELD_TYPES = new Set([
  ComponentType.INPUT,
  ComponentType.TEXTAREA,
  ComponentType.SELECT,
  ComponentType.CHECKBOX,
  ComponentType.RADIO_GROUP,
  ComponentType.SWITCH,
  ComponentType.DATE_PICKER,
  ComponentType.TIME_PICKER,
  ComponentType.SLIDER,
  ComponentType.FILE_UPLOAD,
  ComponentType.RATING,
]);

/**
 * Find all descendant components of a given parent (recursively).
 * Uses BFS over the flat component array via parentId linkage.
 */
export function getDescendants(parentId: string, allComponents: AppComponent[]): AppComponent[] {
  const descendants: AppComponent[] = [];
  const queue = [parentId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = allComponents.filter(c => c.parentId === currentId);
    for (const child of children) {
      descendants.push(child);
      queue.push(child.id);
    }
  }
  return descendants;
}

/**
 * Find the nearest Form component for a given component.
 * First checks if the component itself is a FORM, then walks up the parentId chain.
 */
export function findNearestFormAncestor(
  componentId: string,
  allComponents: AppComponent[]
): AppComponent | null {
  const component = allComponents.find(c => c.id === componentId);
  if (!component) return null;

  // If the trigger component IS a Form, return it directly
  if (component.type === ComponentType.FORM) return component;

  // Walk up the parentId chain
  let currentId: string | null | undefined = component.parentId;
  while (currentId) {
    const parent = allComponents.find(c => c.id === currentId);
    if (!parent) return null;
    if (parent.type === ComponentType.FORM) return parent;
    currentId = parent.parentId;
  }
  return null;
}

/**
 * Collect form field components scoped to a Form container (or all on page if no form).
 */
export function collectFormFields(
  allComponents: AppComponent[],
  pageId: string,
  formComponentId?: string
): AppComponent[] {
  if (formComponentId) {
    // Scoped: only descendants of the form that are form field types
    const descendants = getDescendants(formComponentId, allComponents);
    return descendants.filter(c => FORM_FIELD_TYPES.has(c.type));
  }
  // Fallback: all form fields on the page
  return allComponents.filter(c => c.pageId === pageId && FORM_FIELD_TYPES.has(c.type));
}

export interface FormSubmitResult {
  success: boolean;
  errors: string[];
  formData: Record<string, any>;
}

/**
 * Collect form data and validate required fields.
 * Returns { formData, errors } where errors contains validation messages.
 */
export function collectAndValidateFormData(
  fields: AppComponent[],
  dataStore: Record<string, any>,
  getValue: (store: Record<string, any>, key: string) => any
): { formData: Record<string, any>; errors: string[] } {
  const formData: Record<string, any> = {};
  const errors: string[] = [];

  fields.forEach(c => {
    const props = c.props as any;
    const label = (props.label && String(props.label).trim()) || c.name || c.id;
    let value = getValue(dataStore, c.id);

    // Fallback to defaultValue if dataStore has no entry yet
    if (
      (value === undefined || value === null) &&
      props.defaultValue !== undefined &&
      props.defaultValue !== null &&
      props.defaultValue !== ''
    ) {
      value = props.defaultValue;
    }
    const propLabel = props.label;
    const formKey = (propLabel && typeof propLabel === 'string' && propLabel.trim() && !propLabel.includes('{{'))
      ? propLabel.trim()
      : (c.name || c.id);
    formData[formKey] = value;

    // Check required validation
    const isRequired = props.required === true || props.required === 'true';
    if (isRequired) {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'boolean' && !value);
      if (isEmpty) {
        errors.push(`${label} is required`);
      }
    }
  });

  return { formData, errors };
}

/**
 * Execute an expression string (supports {{ }}, template literals, and raw code).
 */
export function executeExpression(
  code: string,
  scope: Record<string, any>
): void {
  if (!code) return;
  try {
    if (code.startsWith('{{') && code.endsWith('}}')) {
      safeEval(code.substring(2, code.length - 2).trim(), scope);
    } else if (code.includes('{{')) {
      code.replace(/{{\s*(.*?)\s*}}/g, (_match: string, expression: string) => {
        safeEval(expression, scope);
        return '';
      });
    } else {
      safeEval(code, scope);
    }
  } catch (e) {
    console.error('Form submit code execution error:', e);
  }
}

/**
 * Reset form field values in the data store by clearing each field's entry.
 * Returns the list of field IDs that were reset.
 */
export function getResetFieldIds(fields: AppComponent[]): string[] {
  return fields.map(c => c.id);
}
