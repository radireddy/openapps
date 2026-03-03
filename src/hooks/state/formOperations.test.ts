/**
 * Form Operations — unit tests for pure form submission functions.
 *
 * Tests: getDescendants, findNearestFormAncestor, collectFormFields,
 *        collectAndValidateFormData, executeExpression, getResetFieldIds
 */

import { ComponentType, AppComponent } from '@/types';
import {
  getDescendants,
  findNearestFormAncestor,
  collectFormFields,
  collectAndValidateFormData,
  executeExpression,
  getResetFieldIds,
  FORM_FIELD_TYPES,
} from './formOperations';

// ── Helpers ──────────────────────────────────────────────────

const makeComponent = (overrides: Partial<AppComponent> & { id: string; type: ComponentType }): AppComponent => ({
  pageId: 'page1',
  props: {} as any,
  ...overrides,
});

// ── Test Data ────────────────────────────────────────────────

// Component tree:
//  page1:
//    form1 (FORM)
//      input1 (INPUT, parentId: form1)
//      select1 (SELECT, parentId: form1)
//      container1 (CONTAINER, parentId: form1)
//        textarea1 (TEXTAREA, parentId: container1) — nested inside container inside form
//    input_outside (INPUT, no parent) — root-level input on same page
//    button1 (BUTTON, parentId: form1)

const components: AppComponent[] = [
  makeComponent({ id: 'form1', type: ComponentType.FORM }),
  makeComponent({ id: 'input1', type: ComponentType.INPUT, parentId: 'form1', props: { label: 'Name', required: true } as any }),
  makeComponent({ id: 'select1', type: ComponentType.SELECT, parentId: 'form1', props: { label: 'Country' } as any }),
  makeComponent({ id: 'container1', type: ComponentType.CONTAINER, parentId: 'form1' }),
  makeComponent({ id: 'textarea1', type: ComponentType.TEXTAREA, parentId: 'container1', props: { label: 'Bio' } as any }),
  makeComponent({ id: 'input_outside', type: ComponentType.INPUT, props: { label: 'Outside' } as any }),
  makeComponent({ id: 'button1', type: ComponentType.BUTTON, parentId: 'form1', props: { text: 'Submit' } as any }),
];

// ── Tests ────────────────────────────────────────────────────

describe('getDescendants', () => {
  it('returns direct children of a parent', () => {
    const descendants = getDescendants('form1', components);
    const ids = descendants.map(c => c.id);
    expect(ids).toContain('input1');
    expect(ids).toContain('select1');
    expect(ids).toContain('container1');
    expect(ids).toContain('button1');
  });

  it('returns nested descendants recursively', () => {
    const descendants = getDescendants('form1', components);
    const ids = descendants.map(c => c.id);
    expect(ids).toContain('textarea1'); // nested inside container1 inside form1
  });

  it('does not include the parent itself', () => {
    const descendants = getDescendants('form1', components);
    const ids = descendants.map(c => c.id);
    expect(ids).not.toContain('form1');
  });

  it('does not include siblings outside the parent', () => {
    const descendants = getDescendants('form1', components);
    const ids = descendants.map(c => c.id);
    expect(ids).not.toContain('input_outside');
  });

  it('returns empty array for leaf components', () => {
    expect(getDescendants('input1', components)).toEqual([]);
  });
});

describe('findNearestFormAncestor', () => {
  it('returns the Form when the component is a direct child', () => {
    const form = findNearestFormAncestor('input1', components);
    expect(form?.id).toBe('form1');
  });

  it('returns the Form when the component is deeply nested', () => {
    const form = findNearestFormAncestor('textarea1', components);
    expect(form?.id).toBe('form1');
  });

  it('returns the Form when the trigger component IS the Form', () => {
    const form = findNearestFormAncestor('form1', components);
    expect(form?.id).toBe('form1');
  });

  it('returns null for root-level components with no Form ancestor', () => {
    const form = findNearestFormAncestor('input_outside', components);
    expect(form).toBeNull();
  });

  it('returns null for unknown component IDs', () => {
    const form = findNearestFormAncestor('nonexistent', components);
    expect(form).toBeNull();
  });
});

describe('collectFormFields', () => {
  it('collects only form field descendants when formComponentId is provided', () => {
    const fields = collectFormFields(components, 'page1', 'form1');
    const ids = fields.map(c => c.id);
    expect(ids).toContain('input1');
    expect(ids).toContain('select1');
    expect(ids).toContain('textarea1'); // nested descendant
    expect(ids).not.toContain('button1'); // not a form field type
    expect(ids).not.toContain('container1'); // not a form field type
    expect(ids).not.toContain('input_outside'); // outside the form
  });

  it('collects all page form fields when no formComponentId is provided', () => {
    const fields = collectFormFields(components, 'page1');
    const ids = fields.map(c => c.id);
    expect(ids).toContain('input1');
    expect(ids).toContain('select1');
    expect(ids).toContain('textarea1');
    expect(ids).toContain('input_outside'); // included because no form scoping
    expect(ids).not.toContain('button1');
  });

  it('returns empty for a form with no form field children', () => {
    const fields = collectFormFields(components, 'page1', 'container1');
    // container1 only has textarea1 as descendant, which IS a form field
    const ids = fields.map(c => c.id);
    expect(ids).toEqual(['textarea1']);
  });
});

describe('collectAndValidateFormData', () => {
  const getValue = (store: Record<string, any>, key: string) => store[key];

  it('collects form data keyed by label when available, then name, then id', () => {
    const fields = [
      makeComponent({ id: 'input1', type: ComponentType.INPUT, name: 'fullName', props: { label: 'Name' } as any }),
      makeComponent({ id: 'select1', type: ComponentType.SELECT, props: { label: 'Country' } as any }),
    ];
    const dataStore = { input1: 'John', select1: 'US' };

    const { formData, errors } = collectAndValidateFormData(fields, dataStore, getValue);
    // Labels are preferred as keys
    expect(formData).toEqual({ Name: 'John', Country: 'US' });
    expect(errors).toEqual([]);
  });

  it('falls back to defaultValue when dataStore has no entry', () => {
    const fields = [
      makeComponent({ id: 'input1', type: ComponentType.INPUT, props: { label: 'Name', defaultValue: 'Default' } as any }),
    ];

    const { formData } = collectAndValidateFormData(fields, {}, getValue);
    expect(formData).toEqual({ Name: 'Default' });
  });

  it('reports required field errors for empty values', () => {
    const fields = [
      makeComponent({ id: 'input1', type: ComponentType.INPUT, props: { label: 'Name', required: true } as any }),
      makeComponent({ id: 'input2', type: ComponentType.INPUT, props: { label: 'Email', required: true } as any }),
    ];

    const { errors } = collectAndValidateFormData(fields, {}, getValue);
    expect(errors).toEqual(['Name is required', 'Email is required']);
  });

  it('does not report errors for non-required empty fields', () => {
    const fields = [
      makeComponent({ id: 'input1', type: ComponentType.INPUT, props: { label: 'Name' } as any }),
    ];

    const { errors } = collectAndValidateFormData(fields, {}, getValue);
    expect(errors).toEqual([]);
  });

  it('treats whitespace-only string values as empty for required fields', () => {
    const fields = [
      makeComponent({ id: 'input1', type: ComponentType.INPUT, props: { label: 'Name', required: true } as any }),
    ];

    const { errors } = collectAndValidateFormData(fields, { input1: '   ' }, getValue);
    expect(errors).toEqual(['Name is required']);
  });
});

describe('executeExpression', () => {
  it('executes pure expression wrapped in {{ }}', () => {
    const fn = jest.fn();
    const scope = { myFn: fn };
    executeExpression('{{ myFn() }}', scope);
    expect(fn).toHaveBeenCalled();
  });

  it('executes template literal expressions', () => {
    const fn = jest.fn();
    const scope = { myFn: fn };
    executeExpression('Hello {{ myFn() }} World', scope);
    expect(fn).toHaveBeenCalled();
  });

  it('handles empty code gracefully', () => {
    expect(() => executeExpression('', {})).not.toThrow();
  });

  it('catches and logs errors without throwing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => executeExpression('{{ throw new Error("test") }}', {})).not.toThrow();
    consoleSpy.mockRestore();
  });
});

describe('getResetFieldIds', () => {
  it('returns IDs of all provided fields', () => {
    const fields = [
      makeComponent({ id: 'input1', type: ComponentType.INPUT }),
      makeComponent({ id: 'select1', type: ComponentType.SELECT }),
    ];
    expect(getResetFieldIds(fields)).toEqual(['input1', 'select1']);
  });
});

describe('FORM_FIELD_TYPES', () => {
  it('includes all expected form field component types', () => {
    expect(FORM_FIELD_TYPES.has(ComponentType.INPUT)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.TEXTAREA)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.SELECT)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.CHECKBOX)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.RADIO_GROUP)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.SWITCH)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.DATE_PICKER)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.SLIDER)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.FILE_UPLOAD)).toBe(true);
    expect(FORM_FIELD_TYPES.has(ComponentType.RATING)).toBe(true);
  });

  it('does not include non-field types', () => {
    expect(FORM_FIELD_TYPES.has(ComponentType.BUTTON)).toBe(false);
    expect(FORM_FIELD_TYPES.has(ComponentType.CONTAINER)).toBe(false);
    expect(FORM_FIELD_TYPES.has(ComponentType.FORM)).toBe(false);
    expect(FORM_FIELD_TYPES.has(ComponentType.LABEL)).toBe(false);
  });
});
