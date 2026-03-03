import { create } from 'zustand';
import { AppVariable, AppVariableType } from '@/types';

// ─── Types ────────────────────────────────────────────────────────

export interface QueryResult {
  data: any;
  loading: boolean;
  error: string | null;
}

export interface FormState {
  /** Timestamp-based trigger that fires when submitForm is called */
  validationTrigger: number;
  /** Per-field validation errors keyed by component ID */
  fieldErrors: Record<string, string>;
  /** Whether a form submission is in progress */
  submitting: boolean;
  /** Per-form validation errors keyed by form component ID */
  formErrors: Record<string, string[]>;
}

export interface RuntimeState {
  // ── Component Values (user-entered data in preview mode) ──
  componentValues: Record<string, any>;

  // ── Variable Runtime State ──
  variableState: Record<string, any>;

  // ── Form State (replaces __formValidationTrigger sentinel) ──
  formState: FormState;

  // ── Query Results (placeholder for Phase 3 data sources) ──
  queryResults: Record<string, QueryResult>;

  // ── Variable Definitions (for type validation) ──
  _variableDefinitions: AppVariable[];

  // ── Actions ──

  /** Set a single component's runtime value */
  setComponentValue: (id: string, value: any) => void;
  /** Batch set multiple component values in one update */
  setComponentValues: (updates: Record<string, any>) => void;
  /** Clear a component's runtime value */
  clearComponentValue: (id: string) => void;
  /** Clear all component values (e.g., on editor session start) */
  clearAllComponentValues: () => void;

  /** Set a variable's runtime value (with optional type validation) */
  setVariable: (name: string, value: any) => void;
  /** Batch-set multiple variable values in one atomic update */
  setVariables: (updates: Record<string, any>) => void;
  /** Initialize all variable state from definitions */
  initializeVariables: (variables: AppVariable[], initialState: Record<string, any>) => void;
  /** Clear a variable's runtime value */
  clearVariable: (name: string) => void;

  /** Trigger form validation (replaces __formValidationTrigger in dataStore) */
  triggerFormValidation: () => void;
  /** Set a field-level validation error */
  setFieldError: (componentId: string, error: string) => void;
  /** Clear a field-level validation error */
  clearFieldError: (componentId: string) => void;
  /** Set form submitting state */
  setFormSubmitting: (submitting: boolean) => void;
  /** Set validation errors for a specific form */
  setFormErrors: (formId: string, errors: string[]) => void;
  /** Clear validation errors for a specific form */
  clearFormErrors: (formId: string) => void;

  /** Set a query result */
  setQueryResult: (name: string, result: QueryResult) => void;

  /** Full reset (e.g., when switching apps) */
  reset: () => void;
}

// ─── Type Validation ──────────────────────────────────────────────

/**
 * Validates that a value matches the declared variable type.
 * Returns true if valid or if no type info available.
 * Issues console.warn on mismatch (does not throw).
 */
export function validateVariableType(
  name: string,
  value: any,
  expectedType: AppVariableType
): boolean {
  if (value === null || value === undefined) return true; // null/undefined always allowed

  let isValid = true;
  let actualType: string = typeof value;

  switch (expectedType) {
    case AppVariableType.STRING:
      isValid = typeof value === 'string';
      break;
    case AppVariableType.NUMBER:
      isValid = typeof value === 'number' && !isNaN(value);
      break;
    case AppVariableType.BOOLEAN:
      isValid = typeof value === 'boolean';
      break;
    case AppVariableType.OBJECT:
      isValid = typeof value === 'object' && !Array.isArray(value);
      break;
    case AppVariableType.ARRAY:
      isValid = Array.isArray(value);
      actualType = Array.isArray(value) ? 'array' : actualType;
      break;
    case AppVariableType.ARRAY_OF_OBJECTS:
      isValid = Array.isArray(value) &&
        value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
      actualType = Array.isArray(value) ? 'array' : actualType;
      break;
    default:
      return true;
  }

  if (!isValid) {
    console.warn(
      `[Runtime] Variable "${name}": expected type "${expectedType}", got "${actualType}".`,
      'Value:', value
    );
  }

  return isValid;
}

// ─── Initial State ────────────────────────────────────────────────

const initialFormState: FormState = {
  validationTrigger: 0,
  fieldErrors: {},
  submitting: false,
  formErrors: {},
};

// ─── Store ────────────────────────────────────────────────────────

export const useRuntimeStore = create<RuntimeState>((set, get) => ({
  componentValues: {},
  variableState: {},
  formState: { ...initialFormState },
  queryResults: {},
  _variableDefinitions: [],

  // ── Component Values ──

  setComponentValue: (id, value) =>
    set(state => ({
      componentValues: { ...state.componentValues, [id]: value },
    })),

  setComponentValues: (updates) =>
    set(state => ({
      componentValues: { ...state.componentValues, ...updates },
    })),

  clearComponentValue: (id) =>
    set(state => {
      const next = { ...state.componentValues };
      delete next[id];
      return { componentValues: next };
    }),

  clearAllComponentValues: () =>
    set({ componentValues: {} }),

  // ── Variable State ──

  setVariable: (name, value) => {
    // Type validation: warn on mismatch
    const definitions = get()._variableDefinitions;
    const def = definitions.find(v => v.name === name);
    if (def) {
      validateVariableType(name, value, def.type);
    }

    set(state => ({
      variableState: { ...state.variableState, [name]: value },
    }));
  },

  setVariables: (updates) => {
    const definitions = get()._variableDefinitions;
    for (const [name, value] of Object.entries(updates)) {
      const def = definitions.find(v => v.name === name);
      if (def) {
        validateVariableType(name, value, def.type);
      }
    }

    set(state => ({
      variableState: { ...state.variableState, ...updates },
    }));
  },

  initializeVariables: (variables, initialState) =>
    set({
      _variableDefinitions: variables,
      variableState: { ...initialState },
    }),

  clearVariable: (name) =>
    set(state => {
      const next = { ...state.variableState };
      delete next[name];
      return { variableState: next };
    }),

  // ── Form State ──

  triggerFormValidation: () =>
    set(state => ({
      formState: {
        ...state.formState,
        validationTrigger: Date.now(),
      },
    })),

  setFieldError: (componentId, error) =>
    set(state => ({
      formState: {
        ...state.formState,
        fieldErrors: { ...state.formState.fieldErrors, [componentId]: error },
      },
    })),

  clearFieldError: (componentId) =>
    set(state => {
      const next = { ...state.formState.fieldErrors };
      delete next[componentId];
      return { formState: { ...state.formState, fieldErrors: next } };
    }),

  setFormSubmitting: (submitting) =>
    set(state => ({
      formState: { ...state.formState, submitting },
    })),

  setFormErrors: (formId, errors) =>
    set(state => ({
      formState: {
        ...state.formState,
        formErrors: { ...state.formState.formErrors, [formId]: errors },
      },
    })),

  clearFormErrors: (formId) =>
    set(state => {
      const next = { ...state.formState.formErrors };
      delete next[formId];
      return { formState: { ...state.formState, formErrors: next } };
    }),

  // ── Query Results ──

  setQueryResult: (name, result) =>
    set(state => ({
      queryResults: { ...state.queryResults, [name]: result },
    })),

  // ── Reset ──

  reset: () =>
    set({
      componentValues: {},
      variableState: {},
      formState: { ...initialFormState },
      queryResults: {},
      _variableDefinitions: [],
    }),
}));
