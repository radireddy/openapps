import { collectAndValidateFormData } from '../formOperations';
import { ComponentType } from '@/types';

describe('collectAndValidateFormData', () => {
  const getValue = (store: Record<string, any>, key: string) => store[key];

  it('uses label as form data key when available', () => {
    const fields = [
      {
        id: 'comp_1',
        name: 'Input 1',
        type: ComponentType.INPUT,
        props: { label: 'Full Name', required: false },
        pageId: 'page1',
      },
      {
        id: 'comp_2',
        name: 'Select 1',
        type: ComponentType.SELECT,
        props: { label: 'Gender', required: false },
        pageId: 'page1',
      },
    ] as any[];

    const dataStore = { comp_1: 'John Doe', comp_2: 'Male' };
    const { formData } = collectAndValidateFormData(fields, dataStore, getValue);

    expect(formData['Full Name']).toBe('John Doe');
    expect(formData['Gender']).toBe('Male');
    expect(formData['Input 1']).toBeUndefined();
    expect(formData['Select 1']).toBeUndefined();
  });

  it('falls back to component name when label is empty', () => {
    const fields = [
      {
        id: 'comp_1',
        name: 'Input 1',
        type: ComponentType.INPUT,
        props: { label: '', required: false },
        pageId: 'page1',
      },
    ] as any[];

    const dataStore = { comp_1: 'test' };
    const { formData } = collectAndValidateFormData(fields, dataStore, getValue);

    expect(formData['Input 1']).toBe('test');
  });

  it('falls back to component id when both label and name are empty', () => {
    const fields = [
      {
        id: 'comp_1',
        name: '',
        type: ComponentType.INPUT,
        props: { required: false },
        pageId: 'page1',
      },
    ] as any[];

    const dataStore = { comp_1: 'test' };
    const { formData } = collectAndValidateFormData(fields, dataStore, getValue);

    expect(formData['comp_1']).toBe('test');
  });

  it('skips expression labels (containing {{}}) and falls back to name', () => {
    const fields = [
      {
        id: 'comp_1',
        name: 'Input 1',
        type: ComponentType.INPUT,
        props: { label: '{{dynamicLabel}}', required: false },
        pageId: 'page1',
      },
    ] as any[];

    const dataStore = { comp_1: 'test' };
    const { formData } = collectAndValidateFormData(fields, dataStore, getValue);

    expect(formData['Input 1']).toBe('test');
    expect(formData['{{dynamicLabel}}']).toBeUndefined();
  });

  it('validates required fields using label in error messages', () => {
    const fields = [
      {
        id: 'comp_1',
        name: 'Input 1',
        type: ComponentType.INPUT,
        props: { label: 'Full Name', required: true },
        pageId: 'page1',
      },
    ] as any[];

    const dataStore = {};
    const { errors } = collectAndValidateFormData(fields, dataStore, getValue);

    expect(errors).toContain('Full Name is required');
  });
});
