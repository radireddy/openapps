/**
 * FormContext — provides form-level configuration to descendant form fields.
 * Currently exposes labelPlacement so child fields can render labels on top or left.
 */

import React, { useContext } from 'react';

export interface FormContextValue {
  /** Label layout direction: 'top' (default) stacks vertically, 'left' lays out horizontally */
  labelPlacement: 'top' | 'left';
}

const FormContextInternal = React.createContext<FormContextValue | null>(null);

export const FormContextProvider = FormContextInternal.Provider;

/**
 * Hook to read form-level configuration. Returns null if the component
 * is not rendered inside a Form container.
 */
export function useFormContext(): FormContextValue | null {
  return useContext(FormContextInternal);
}
