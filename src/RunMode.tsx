import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AppDefinition, ActionHandlers, ComponentType, FormProps } from './types';
import { RenderedComponent } from './components/RenderedComponent';
import { buildEvaluationScope } from './hooks/state/evaluationScope';
import { useRuntimeStore } from './stores/runtimeStore';
import { useQueryExecution } from './hooks/useQueryExecution';
import { safeEval } from './expressions/engine';
import { get, set } from './utils/data-helpers';
import { initializeVariableState } from './hooks/state/variableOperations';
import {
  collectFormFields,
  collectAndValidateFormData,
  executeExpression,
  getResetFieldIds,
  findNearestFormAncestor,
} from './hooks/state/formOperations';
import { generateMediaQueryCSS, generateGlobalBaseStyles } from '@/responsive';

interface RunModeProps {
  appDefinition: AppDefinition;
  onBack: () => void;
}

/**
 * RunMode renders the application in a clean, standalone view without any editor chrome.
 * It reuses RenderedComponent (mode="preview") with full interactivity:
 * - Data store updates via Zustand runtime store
 * - Variable state management
 * - Query execution (onMount, dependency-change, manual)
 * - Page navigation
 * - Form validation and submission
 */
export const RunMode: React.FC<RunModeProps> = ({ appDefinition, onBack }) => {
  const { components = [], dataStore: initialDataStore = {}, mainPageId } = appDefinition;

  const [currentPageId, setCurrentPageId] = useState<string>(mainPageId);

  // ── Runtime Store ─────────────────────────────────────────
  const runtimeComponentValues = useRuntimeStore(s => s.componentValues);
  const runtimeVariableState = useRuntimeStore(s => s.variableState);
  const runtimeQueryResults = useRuntimeStore(s => s.queryResults);
  const runtimeFormState = useRuntimeStore(s => s.formState);
  const setComponentValue = useRuntimeStore(s => s.setComponentValue);
  const runtimeSetVariable = useRuntimeStore(s => s.setVariable);
  const initializeVariables = useRuntimeStore(s => s.initializeVariables);
  const clearAllComponentValues = useRuntimeStore(s => s.clearAllComponentValues);
  const triggerFormValidation = useRuntimeStore(s => s.triggerFormValidation);
  const runtimeReset = useRuntimeStore(s => s.reset);

  // ── Initialize runtime state on mount ──────────────────────
  useEffect(() => {
    runtimeReset();
    clearAllComponentValues();
    if (appDefinition.variables && Array.isArray(appDefinition.variables)) {
      const varState = initializeVariableState(appDefinition.variables);
      initializeVariables(appDefinition.variables, varState);
    }
    return () => {
      runtimeReset();
    };
  }, [appDefinition]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Merged DataStore ──────────────────────────────────────
  const mergedDataStore = useMemo(() => ({
    ...initialDataStore,
    ...runtimeComponentValues,
  }), [initialDataStore, runtimeComponentValues]);

  // ── Update DataStore (runtime only, no persistence) ───────
  const updateDataStore = useCallback((key: string, value: any) => {
    setComponentValue(key, value);
  }, [setComponentValue]);

  // ── Evaluation Scope ──────────────────────────────────────
  const evaluationScope = useMemo(() => {
    return buildEvaluationScope(
      appDefinition,
      mergedDataStore,
      components,
      runtimeVariableState,
      {
        mode: 'run',
        runtimeExtras: {
          queryResults: runtimeQueryResults,
          formState: runtimeFormState,
        },
      }
    );
  }, [appDefinition, mergedDataStore, components, runtimeVariableState, runtimeQueryResults, runtimeFormState]);

  // ── Query Execution ───────────────────────────────────────
  const { runQuery: handleRunQuery } = useQueryExecution(
    appDefinition.queries,
    evaluationScope,
    true // enabled in run mode
  );

  // ── Page Navigation ───────────────────────────────────────
  const handleNavigateTo = useCallback((pageId: string) => {
    const pageExists = appDefinition.pages.some(p => p.id === pageId);
    if (pageExists) {
      setCurrentPageId(pageId);
    }
  }, [appDefinition.pages]);

  // ── Form Submit ───────────────────────────────────────────
  const setFormErrors = useRuntimeStore(s => s.setFormErrors);
  const clearFormErrors = useRuntimeStore(s => s.clearFormErrors);

  const handleSubmitForm = useCallback((onSuccessCode?: string, scope?: Record<string, any>, _pageId?: string, triggerComponentId?: string) => {
    // Auto-detect parent Form from the trigger component (e.g. Button)
    const formComponentId = triggerComponentId
      ? findNearestFormAncestor(triggerComponentId, components)?.id
      : undefined;

    // Collect form fields — scoped to form container if provided
    const fields = collectFormFields(components, currentPageId, formComponentId);

    // Collect data and validate
    const { formData, errors } = collectAndValidateFormData(fields, mergedDataStore, get);

    // Trigger component-level validation via runtime store
    triggerFormValidation();

    // Store errors in runtime store for validation summary display
    if (formComponentId) {
      if (errors.length > 0) {
        setFormErrors(formComponentId, errors);
      } else {
        clearFormErrors(formComponentId);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Look up the Form component to get its onSubmit and resetOnSubmit props
    const formComponent = formComponentId
      ? components.find(c => c.id === formComponentId)
      : undefined;
    const formProps = formComponent?.props as FormProps | undefined;

    // Execute the Form's own onSubmit handler if defined
    if (formProps?.onSubmit && scope) {
      executeExpression(formProps.onSubmit, { ...scope, formData });
    }

    // Execute the Button's success code if provided
    if (onSuccessCode && scope) {
      executeExpression(onSuccessCode, { ...scope, formData });
    }

    // Handle resetOnSubmit — clear all form field values in the data store
    if (formProps?.resetOnSubmit) {
      const resetIds = getResetFieldIds(fields);
      resetIds.forEach(id => updateDataStore(id, ''));
    }

    return { success: true, errors: [] };
  }, [components, currentPageId, mergedDataStore, updateDataStore, triggerFormValidation, setFormErrors, clearFormErrors]);

  // ── Actions ───────────────────────────────────────────────
  const actions: ActionHandlers = useMemo(() => ({
    createRecord: async () => {},
    updateRecord: async () => {},
    deleteRecord: async () => {},
    selectRecord: (key: string, record: any) => updateDataStore(key, record),
    updateVariable: (name: string, value: any) => runtimeSetVariable(name, value),
    submitForm: handleSubmitForm,
    navigateTo: handleNavigateTo,
    runQuery: handleRunQuery,
  }), [updateDataStore, runtimeSetVariable, handleSubmitForm, handleNavigateTo, handleRunQuery]);

  // ── Current Page ──────────────────────────────────────────
  const activePageComponents = components.filter(c => c.pageId === currentPageId);
  const rootComponents = activePageComponents.filter(c => !c.parentId);
  const currentPageName = appDefinition.pages.find(p => p.id === currentPageId)?.name;
  const isOnMainPage = currentPageId === mainPageId;

  // ── Responsive CSS ────────────────────────────────────────
  const responsiveCSS = useMemo(() => {
    const globalStyles = generateGlobalBaseStyles();
    const mediaQueries = generateMediaQueryCSS(components);
    return mediaQueries ? `${globalStyles}\n${mediaQueries}` : globalStyles;
  }, [components]);

  const bgColor = evaluationScope.theme?.colors?.background || '#ffffff';
  const textColor = evaluationScope.theme?.colors?.text || '#333';
  const surfaceColor = evaluationScope.theme?.colors?.surface || '#f5f5f5';
  const borderColor = evaluationScope.theme?.colors?.border || '#e0e0e0';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: bgColor }}
    >
      <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />

      {/* Minimal header */}
      <header
        style={{
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: surfaceColor,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: '4px 12px',
            fontSize: '13px',
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: textColor,
          }}
        >
          Back
        </button>
        <span style={{ fontWeight: 600, fontSize: '14px', color: textColor }}>
          {appDefinition.name}
        </span>
        {!isOnMainPage && (
          <>
            <span style={{ color: borderColor }}>{'/'}</span>
            <span style={{ fontSize: '13px', color: textColor }}>{currentPageName || currentPageId}</span>
            <button
              onClick={() => setCurrentPageId(mainPageId)}
              style={{
                marginLeft: 'auto',
                padding: '2px 10px',
                fontSize: '12px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: textColor,
              }}
            >
              Back to Main
            </button>
          </>
        )}
      </header>

      {/* App content */}
      <main
        style={{
          flex: 1,
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {rootComponents.map(comp => (
          <RenderedComponent
            key={comp.id}
            component={comp}
            allComponents={components}
            selectedComponentIds={[]}
            onSelect={() => {}}
            onUpdate={() => {}}
            onUpdateComponents={() => {}}
            onDelete={() => {}}
            onDrop={() => {}}
            mode="preview"
            dataStore={mergedDataStore}
            onUpdateDataStore={updateDataStore}
            actions={actions}
            evaluationScope={evaluationScope}
            onReparentCheck={() => {}}
          />
        ))}
      </main>
    </div>
  );
};
