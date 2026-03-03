
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppDefinition, AppComponent, ComponentType, ComponentProps, ActionHandlers, TableProps, AppVariable, AppQuery, Theme, AppPage, IntegrationSettings, FormProps, WidgetDefinition } from '../types';
import { get, set } from '../utils/data-helpers';
import { useUndoRedo } from './useUndoRedo';
import { safeEval } from '../expressions/engine';
import { useRuntimeStore } from '../stores/runtimeStore';
import {
  collectFormFields,
  collectAndValidateFormData,
  executeExpression,
  getResetFieldIds,
  findNearestFormAncestor,
} from './state/formOperations';
import { useQueryExecution } from './useQueryExecution';

// Import pure state transformation functions
import {
  parseInitialValue,
  addVariableToState,
  updateVariableInState,
  deleteVariableFromState,
  initializeVariableState,
} from './state/variableOperations';
import {
  addComponentToState,
  updateComponentInState,
  updateComponentsInState,
  deleteComponentFromState,
  deleteSelectedComponentsFromState,
  renameComponentInState,
} from './state/componentOperations';
import {
  reparentComponentInState,
  reorderComponentInState,
  moveComponentToParentInState,
} from './state/containerOperations';
import {
  calculateAlignmentUpdates,
} from './state/alignmentOperations';
import {
  addPageToState,
  updatePageInState,
  deletePageFromState,
  reorderPageInState,
} from './state/pageOperations';
import {
  buildEvaluationScope,
} from './state/evaluationScope';

// Re-export AlignAction for backwards compatibility
export type { AlignAction } from './state/alignmentOperations';


/**
 * The core hook for managing the application state in the Editor.
 * It handles the `AppDefinition`, component CRUD operations, selection state,
 * data binding, and interactions with data sources.
 *
 * This is a thin orchestrator that delegates all state transformation logic
 * to pure functions in the `./state/` modules, with runtime state managed
 * by the Zustand runtime store.
 *
 * @param initialAppDefinition - The initial state of the app loaded from storage.
 * @param onSave - Callback function triggered when the app state changes (debounced).
 */
export const useAppData = (initialAppDefinition: AppDefinition, onSave: (appDef: AppDefinition) => void, widgetDefinitions?: WidgetDefinition[]) => {
  const [appDefinition, setAppDefinitionState] = useState<AppDefinition>(() => {
    // Strip out component-level dataStore entries that were persisted from preview interactions.
    // This ensures every editor session starts with clean runtime state so expression-evaluated
    // values (e.g., variable defaults) are not overridden by stale stored values.
    const componentIds = new Set(initialAppDefinition.components.map(c => c.id));
    const cleanedDataStore: Record<string, any> = {};
    for (const [key, value] of Object.entries(initialAppDefinition.dataStore || {})) {
      if (!componentIds.has(key)) {
        cleanedDataStore[key] = value;
      }
    }
    return { ...initialAppDefinition, dataStore: cleanedDataStore };
  });
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string>(initialAppDefinition.mainPageId);

  // Ref to store latest selectedComponentIds to avoid stale closures in deleteSelectedComponents
  const selectedComponentIdsRef = useRef<string[]>([]);
  useEffect(() => {
    selectedComponentIdsRef.current = selectedComponentIds;
  }, [selectedComponentIds]);

  // Undo/Redo
  const undoRedo = useUndoRedo<AppDefinition>(50);

  const { components, dataStore, variables, theme } = appDefinition;

  // ─── Runtime Store (Zustand) ─────────────────────────────────────
  // Subscribe to runtime store slices that affect rendering
  const runtimeComponentValues = useRuntimeStore(s => s.componentValues);
  const runtimeVariableState = useRuntimeStore(s => s.variableState);
  const runtimeFormState = useRuntimeStore(s => s.formState);
  const runtimeQueryResults = useRuntimeStore(s => s.queryResults);

  // Get runtime store actions (stable references from Zustand)
  const setComponentValue = useRuntimeStore(s => s.setComponentValue);
  const setComponentValues = useRuntimeStore(s => s.setComponentValues);
  const clearAllComponentValues = useRuntimeStore(s => s.clearAllComponentValues);
  const runtimeSetVariable = useRuntimeStore(s => s.setVariable);
  const runtimeSetVariables = useRuntimeStore(s => s.setVariables);
  const initializeVariables = useRuntimeStore(s => s.initializeVariables);
  const clearVariable = useRuntimeStore(s => s.clearVariable);
  const triggerFormValidation = useRuntimeStore(s => s.triggerFormValidation);
  const setFormSubmitting = useRuntimeStore(s => s.setFormSubmitting);
  const runtimeReset = useRuntimeStore(s => s.reset);

  // ─── Variable State (backed by Zustand) ──────────────────────────
  // Initialize variable state in the runtime store
  const initialVarState = useMemo(
    () => initializeVariableState(initialAppDefinition.variables || []),
    [] // Only on mount
  );

  // Initialize Zustand store on mount: reset runtime state and set up variables
  useEffect(() => {
    clearAllComponentValues();
    initializeVariables(initialAppDefinition.variables || [], initialVarState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-initialize when variable definitions change (e.g., variable added/removed in editor)
  useEffect(() => {
    if (appDefinition.variables && Array.isArray(appDefinition.variables)) {
      const newState = initializeVariableState(appDefinition.variables);
      initializeVariables(appDefinition.variables, newState);
    } else {
      initializeVariables([], {});
    }
  }, [appDefinition.variables, initializeVariables]);

  // Backward-compatible alias: variableState reads from Zustand
  const variableState = runtimeVariableState;

  // ─── Merged DataStore (backward compatible) ──────────────────────
  // Merge persisted dataStore with runtime component values.
  // This preserves backward compatibility — consumers see a single dataStore
  // that includes both design-time data and runtime component values.
  const mergedDataStore = useMemo(() => ({
    ...dataStore,
    ...runtimeComponentValues,
  }), [dataStore, runtimeComponentValues]);

  // Autosave app on any change (persists AppDefinition only, not runtime values)
  const debounceTimeout = useRef<number | null>(null);
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = window.setTimeout(() => {
      onSave(appDefinition);
    }, 1000); // 1 second debounce

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [appDefinition, onSave]);


  const setAppDefinition = useCallback((definition: AppDefinition) => {
    setAppDefinitionState(definition);
    setSelectedComponentIds([]);
    setCurrentPageId(definition.mainPageId);
    // Reset runtime state when loading a new app definition
    runtimeReset();
    // Re-initialize variables from the new definition
    if (definition.variables && Array.isArray(definition.variables)) {
      const newState = initializeVariableState(definition.variables);
      initializeVariables(definition.variables, newState);
    }
  }, [runtimeReset, initializeVariables]);


  const addVariable = useCallback((variable: AppVariable) => {
    setAppDefinitionState(prev => {
      const result = addVariableToState(prev, variable);
      if (result === null) {
        alert('A variable with this name already exists.');
        return prev;
      }
      return result;
    });
  }, []);

  const updateVariable = useCallback((variableId: string, updates: Partial<AppVariable>) => {
    setAppDefinitionState(prev => updateVariableInState(prev, variableId, updates));
  }, []);

  const deleteVariable = useCallback((variableId: string) => {
    setAppDefinitionState(prev => {
      const variable = (prev.variables || []).find(v => v.id === variableId);
      if (variable) {
        // Clean up variable from runtime store
        setTimeout(() => clearVariable(variable.name), 0);
      }
      return deleteVariableFromState(prev, variableId);
    });
  }, [clearVariable]);

  const updateTheme = useCallback((category: keyof Theme, prop: string, value: string) => {
    setAppDefinitionState(prev => {
      const newTheme = JSON.parse(JSON.stringify(prev.theme)); // Deep copy to ensure reactivity
      (newTheme[category] as any)[prop] = value;
      return { ...prev, theme: newTheme };
    });
  }, []);

  const applyTheme = useCallback((newTheme: Theme) => {
    setAppDefinitionState(prev => ({
      ...prev,
      theme: newTheme,
    }));
  }, []);

  // FIX: was calling `setAppDefinition` (which resets selection/page) instead of `setAppDefinitionState`
  const updateIntegrationSettings = useCallback((settings: IntegrationSettings) => {
    setAppDefinitionState(prev => ({ ...prev, integration: settings }));
  }, []);

  /**
   * Adds a new component to the canvas.
   * Automatically initializes related data store keys if configured in default props.
   */
  const addComponent = useCallback((type: ComponentType, position: { x: number; y: number }, parentId: string | null = null, pageId: string) => {
    setAppDefinitionState(prev => {
      undoRedo.pushSnapshot(prev);
      return addComponentToState(prev, type, position, parentId, pageId);
    });
  }, [undoRedo]);

  const updateComponent = useCallback((id: string, newProps: Partial<ComponentProps>) => {
    setAppDefinitionState(prev => {
      undoRedo.pushSnapshot(prev);
      return updateComponentInState(prev, id, newProps);
    });
  }, [undoRedo]);

  const updateComponents = useCallback((updates: Array<{ id: string; props: Partial<ComponentProps> }>) => {
    if (updates.length === 0) return;
    setAppDefinitionState(prev => {
      undoRedo.pushBatchSnapshot(prev);
      return updateComponentsInState(prev, updates);
    });
  }, [undoRedo]);

  // FIX: Added 'React' import to resolve 'React.MouseEvent' type error.
  const selectComponent = useCallback((id: string, e?: React.MouseEvent) => {
    if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
      setSelectedComponentIds(prevIds => {
        const newIds = new Set(prevIds);
        if (newIds.has(id)) {
          newIds.delete(id); // Deselect if already selected
        } else {
          newIds.add(id); // Select if not selected
        }
        return Array.from(newIds);
      });
    } else {
      setSelectedComponentIds([id]); // Default behavior: select only this one
    }
  }, []);

  const deselectAllComponents = useCallback(() => {
    setSelectedComponentIds([]);
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setAppDefinitionState(prev => {
      undoRedo.pushSnapshot(prev);
      return deleteComponentFromState(prev, id);
    });
    setSelectedComponentIds(prev => prev.filter(selectedId => selectedId !== id));
  }, [undoRedo]);

  const deleteSelectedComponents = useCallback(() => {
    setAppDefinitionState(prev => {
      undoRedo.pushSnapshot(prev);
      const currentSelectedIds = selectedComponentIdsRef.current;
      return deleteSelectedComponentsFromState(prev, currentSelectedIds);
    });
    setSelectedComponentIds([]);
  }, [undoRedo]);

  const renameComponent = useCallback((id: string, name: string) => {
    setAppDefinitionState(prev => {
      undoRedo.pushSnapshot(prev);
      return renameComponentInState(prev, id, name);
    });
  }, [undoRedo]);

  /**
   * Updates the data store. Routes component values to the Zustand runtime store
   * and non-component data to AppDefinition.dataStore for persistence.
   */
  const updateDataStore = useCallback((key: string, value: any) => {
    // Always mirror to runtime store for fast access
    setComponentValue(key, value);
    // Also write to appDefinition.dataStore for backward compatibility
    // (consumers may read directly from appDefinition.dataStore)
    setAppDefinitionState(prev => ({
      ...prev,
      dataStore: set(prev.dataStore, key, value)
    }));
  }, [setComponentValue]);

  /**
   * Batch update multiple dataStore keys in a single state update.
   * Prevents N separate re-render cascades when setting N values programmatically
   * (e.g., form reset, bulk data import, code-driven control updates).
   */
  const batchUpdateDataStore = useCallback((updates: Record<string, any>) => {
    // Batch update in runtime store
    setComponentValues(updates);
    // Also batch update in appDefinition.dataStore for backward compatibility
    setAppDefinitionState(prev => {
      let newDataStore = { ...prev.dataStore };
      for (const [key, value] of Object.entries(updates)) {
        newDataStore = set(newDataStore, key, value);
      }
      return { ...prev, dataStore: newDataStore };
    });
  }, [setComponentValues]);

  // Ref to track if reparentComponent is currently being processed to prevent infinite loops
  const isReparentingRef = useRef<Set<string>>(new Set());

  /**
   * Handles the complex logic of moving a component into or out of a container.
   * It calculates the new relative coordinates based on the component's absolute position
   * and the new parent's position.
   */
  const reparentComponent = useCallback((componentId: string, finalPosition?: { x: number; y: number }, targetContainerId?: string | null) => {
    // Prevent infinite loops by checking if this component is already being reparented
    if (isReparentingRef.current.has(componentId)) {
      return;
    }
    isReparentingRef.current.add(componentId);

    setAppDefinitionState(prev => {
      const result = reparentComponentInState(prev, componentId, finalPosition, targetContainerId);
      return result.state;
    });

    // Remove from processing set after a short delay to allow state update to complete
    setTimeout(() => {
      isReparentingRef.current.delete(componentId);
    }, 100);
  }, [setAppDefinitionState]);

  /**
   * Aligns or distributes selected components.
   */
  const alignAndDistribute = useCallback((action: import('./state/alignmentOperations').AlignAction) => {
    if (selectedComponentIds.length < 2) return;

    const updates = calculateAlignmentUpdates(action, selectedComponentIds, components);
    if (updates.length > 0) {
      updateComponents(updates);
    }
  }, [selectedComponentIds, components, updateComponents]);


  /**
   * Reorders a component within the same parent.
   */
  const reorderComponent = useCallback((componentId: string, newIndex: number, parentId: string | null, pageId: string) => {
    setAppDefinitionState(prev => reorderComponentInState(prev, componentId, newIndex, parentId, pageId));
  }, []);

  /**
   * Moves a component from one parent to another (or to root).
   */
  const moveComponentToParent = useCallback((componentId: string, newParentId: string | null, newIndex: number | null, pageId: string) => {
    setAppDefinitionState(prev => moveComponentToParentInState(prev, componentId, newParentId, newIndex, pageId));
  }, []);

  // --- Undo/Redo ---
  const undo = useCallback(() => {
    const restored = undoRedo.undo(appDefinition);
    if (restored) {
      setAppDefinitionState(restored);
      setSelectedComponentIds([]);
    }
  }, [undoRedo, appDefinition]);

  const redo = useCallback(() => {
    const restored = undoRedo.redo(appDefinition);
    if (restored) {
      setAppDefinitionState(restored);
      setSelectedComponentIds([]);
    }
  }, [undoRedo, appDefinition]);

  // --- Paste Components (for copy/paste feature) ---
  const pasteComponents = useCallback((newComponents: AppComponent[]) => {
    setAppDefinitionState(prev => {
      undoRedo.pushSnapshot(prev);
      return {
        ...prev,
        components: [...prev.components, ...newComponents],
      };
    });
    // Select pasted root components (those without parentId pointing to another pasted component)
    const pastedIds = new Set(newComponents.map(c => c.id));
    const rootPastedIds = newComponents
      .filter(c => !c.parentId || !pastedIds.has(c.parentId))
      .map(c => c.id);
    setSelectedComponentIds(rootPastedIds);
  }, [undoRedo]);

  const handleSelectRecord = useCallback((dataStoreKey: string, record: any) => {
    updateDataStore(dataStoreKey, record);
  }, [updateDataStore]);

  const handleUpdateVariable = useCallback((variableName: string, newValue: any) => {
    runtimeSetVariable(variableName, newValue);
  }, [runtimeSetVariable]);

  const handleUpdateVariables = useCallback((updates: Record<string, any>) => {
    runtimeSetVariables(updates);
  }, [runtimeSetVariables]);

  // --- Query CRUD ---
  const addQuery = useCallback((query: AppQuery) => {
    setAppDefinitionState(prev => ({
      ...prev,
      queries: [...(prev.queries || []), query],
    }));
  }, []);

  const updateQuery = useCallback((queryId: string, updates: Partial<AppQuery>) => {
    setAppDefinitionState(prev => ({
      ...prev,
      queries: (prev.queries || []).map(q =>
        q.id === queryId ? { ...q, ...updates } : q
      ),
    }));
  }, []);

  const deleteQuery = useCallback((queryId: string) => {
    setAppDefinitionState(prev => ({
      ...prev,
      queries: (prev.queries || []).filter(q => q.id !== queryId),
    }));
  }, []);

  // --- Submit Form ---
  const setFormErrors = useRuntimeStore(s => s.setFormErrors);
  const clearFormErrors = useRuntimeStore(s => s.clearFormErrors);

  const handleSubmitForm = useCallback((onSuccessCode?: string, scope?: Record<string, any>, pageId?: string, triggerComponentId?: string) => {
    const effectivePageId = pageId || currentPageId;

    // Auto-detect parent Form from the trigger component (e.g. Button)
    const formComponentId = triggerComponentId
      ? findNearestFormAncestor(triggerComponentId, components)?.id
      : undefined;

    // Collect form fields — scoped to form container if provided, otherwise all page fields
    const fields = collectFormFields(components, effectivePageId, formComponentId);

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
      console.warn('[Form Submit] Validation failed:', errors);
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

  const selectPage = useCallback((pageId: string) => {
    setCurrentPageId(pageId);
    setSelectedComponentIds([]);
  }, []);

  const addPage = useCallback((page: AppPage) => {
    setAppDefinitionState(prev => {
      const result = addPageToState(prev, page);
      if (result === null) {
        alert('A page with this ID already exists.');
        return prev;
      }
      return result;
    });
  }, []);

  const updatePage = useCallback((pageId: string, updates: Partial<AppPage>) => {
    setAppDefinitionState(prev => updatePageInState(prev, pageId, updates));
  }, []);

  const deletePage = useCallback((pageId: string) => {
    setAppDefinitionState(prev => {
      const result = deletePageFromState(prev, pageId);
      if (result === null) return prev;
      return result;
    });
    // If we were on the deleted page, switch to main page
    setCurrentPageId(prev => prev === pageId ? appDefinition.mainPageId : prev);
    setSelectedComponentIds([]);
  }, [appDefinition.mainPageId]);

  const reorderPage = useCallback((pageId: string, direction: 'up' | 'down') => {
    setAppDefinitionState(prev => reorderPageInState(prev, pageId, direction));
  }, []);

  const currentPageComponents = useMemo(() => {
    return components.filter(c => c.pageId === currentPageId);
  }, [components, currentPageId]);


  // --- EXPRESSION EVALUATION SCOPE ---
  const prevScopeRef = useRef<Record<string, any> | null>(null);

  const evaluationScope = useMemo(() => {
    const scope = buildEvaluationScope(appDefinition, mergedDataStore, components, variableState, {
      mode: 'edit',
      runtimeExtras: {
        queryResults: runtimeQueryResults,
        formState: runtimeFormState,
      },
      widgetDefinitions,
    });
    prevScopeRef.current = scope;
    return scope;
  }, [appDefinition.theme, appDefinition.pages, mergedDataStore, components, variableState, runtimeQueryResults, runtimeFormState, widgetDefinitions]);

  // --- Query Execution ---
  // Query execution is disabled in editor mode (only active in preview/run)
  // but we still provide the runQuery callback for manual execution
  const { runQuery: handleRunQuery } = useQueryExecution(
    appDefinition.queries,
    evaluationScope,
    false // disabled in editor mode — enabled in Preview/RunMode
  );

  const actions: ActionHandlers = useMemo(() => ({
    createRecord: async (_dataSourceName: string, _newRecord: any) => { /* no-op: data sources removed */ },
    updateRecord: async (_dataSourceName: string, _recordId: any, _updates: any) => { /* no-op: data sources removed */ },
    deleteRecord: async (_dataSourceName: string, _recordId: any) => { /* no-op: data sources removed */ },
    selectRecord: handleSelectRecord,
    updateVariable: handleUpdateVariable,
    updateVariables: handleUpdateVariables,
    submitForm: handleSubmitForm,
    navigateTo: () => {},
    runQuery: handleRunQuery,
  }), [handleSelectRecord, handleUpdateVariable, handleUpdateVariables, handleSubmitForm, handleRunQuery]);

  const memoizedAppDefinition = useMemo(() => (appDefinition), [appDefinition]);

  return {
    appDefinition: memoizedAppDefinition,
    setAppDefinition,
    components,
    currentPageId,
    currentPageComponents,
    dataStore: mergedDataStore,
    selectedComponentIds,
    setSelectedComponentIds,
    addComponent,
    updateComponent,
    updateComponents,
    selectComponent,
    deselectAllComponents,
    deleteComponent,
    deleteSelectedComponents,
    updateDataStore,
    batchUpdateDataStore,
    actions,
    evaluationScope,
    variables,
    addVariable,
    updateVariable,
    deleteVariable,
    variableState,
    updateTheme,
    applyTheme,
    integrationSettings: appDefinition.integration,
    updateIntegrationSettings,
    reparentComponent,
    selectPage,
    addPage,
    updatePage,
    deletePage,
    reorderPage,
    alignAndDistribute,
    renameComponent,
    reorderComponent,
    moveComponentToParent,
    undo,
    redo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
    pasteComponents,
    queries: appDefinition.queries || [],
    addQuery,
    updateQuery,
    deleteQuery,
    runQuery: handleRunQuery,
  };
};
