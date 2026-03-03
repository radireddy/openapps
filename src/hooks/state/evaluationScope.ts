import { AppDefinition, AppComponent, ComponentType, TableProps, Theme, CustomWidgetProps, WidgetDefinition } from '../../types';
import { safeEval } from '../../expressions/engine';
import { get } from '../../utils/data-helpers';
import type { FormState, QueryResult } from '../../stores/runtimeStore';
import { dependencyGraph } from '../../expressions/dependency-graph';

/**
 * Options for customizing the evaluation scope.
 */
export interface ScopeOptions {
  /** Override theme (e.g., with lowercase color aliases for preview) */
  themeOverride?: Theme;
  /** Additional scope entries to merge (e.g., uipath SDK) */
  extras?: Record<string, any>;
  /** Evaluation mode: edit (design surface), preview (in-editor preview), run (standalone) */
  mode?: 'edit' | 'preview' | 'run';
  /** Runtime store extras for namespaced scope (queryResults, formState) */
  runtimeExtras?: {
    queryResults?: Record<string, QueryResult>;
    formState?: FormState;
  };
  /** Widget definitions for resolving CUSTOM_WIDGET outputs in scope */
  widgetDefinitions?: WidgetDefinition[];
}

/**
 * Build the evaluation scope for expression evaluation.
 * Combines the data store, theme, variables, and component states into a single scope object.
 * Component values are evaluated (expressions resolved) and added to the scope.
 *
 * This is the single source of truth for scope building — used by both the editor
 * and Preview to avoid logic duplication.
 *
 * Produces both namespaced access ($form, $vars, $query) and flat backward-compatible access.
 *
 * @param appDefinition - The full app definition (used for theme, pages)
 * @param dataStore - The current data store state (merged: persisted + runtime component values)
 * @param components - All components in the app
 * @param variableState - Current runtime variable state
 * @param options - Optional customization (theme override, extras, mode)
 * @returns A scope object for use with safeEval
 */
export function buildEvaluationScope(
  appDefinition: AppDefinition,
  dataStore: Record<string, any>,
  components: AppComponent[],
  variableState: Record<string, any>,
  options?: ScopeOptions
): Record<string, any> {
  const effectiveTheme = options?.themeOverride ?? appDefinition.theme;

  const scope: Record<string, any> = {
    console,
    theme: effectiveTheme,
    pages: appDefinition.pages,
    // Named dataStore access: allows expressions like `dataStore.INPUT_xxx`
    dataStore,
    // Flat backward-compatible access: spread dataStore and variableState
    ...dataStore,
    ...variableState,
  };

  // Merge any extra scope entries (e.g., uipath SDK)
  if (options?.extras) {
    Object.assign(scope, options.extras);
  }

  // Add component states to scope - first pass: add all props
  components.forEach(c => {
    const props = c.props as any;
    scope[c.id] = {
      ...props
    };
  });

  // Second pass: evaluate and add component values
  // This allows components to reference each other's values
  components.forEach(c => {
    const props = c.props as any;
    let componentValue: any = undefined;

    // First check if value exists in dataStore (from user interactions)
    const storedValue = get(dataStore, c.id);
    if (storedValue !== undefined && storedValue !== null) {
      componentValue = storedValue;
    } else {
      // Try to evaluate value prop if it exists
      if (props.value !== undefined && props.value !== null && props.value !== '') {
        try {
          if (typeof props.value === 'string' && (props.value.startsWith('{{') || props.value.includes('{{'))) {
            const expression = props.value.startsWith('{{') && props.value.endsWith('}}')
              ? props.value.substring(2, props.value.length - 2).trim()
              : props.value;
            componentValue = safeEval(expression, scope);
          } else {
            componentValue = props.value;
          }
        } catch (e) {
          componentValue = props.value;
        }
      } else if (props.defaultValue !== undefined && props.defaultValue !== null && props.defaultValue !== '') {
        try {
          if (typeof props.defaultValue === 'string' && (props.defaultValue.startsWith('{{') || props.defaultValue.includes('{{'))) {
            const expression = props.defaultValue.startsWith('{{') && props.defaultValue.endsWith('}}')
              ? props.defaultValue.substring(2, props.defaultValue.length - 2).trim()
              : props.defaultValue;
            componentValue = safeEval(expression, scope);
          } else {
            componentValue = props.defaultValue;
          }
        } catch (e) {
          componentValue = props.defaultValue;
        }
      }
    }

    // Add value to component scope
    if (scope[c.id] && typeof scope[c.id] === 'object') {
      scope[c.id] = {
        ...scope[c.id],
        value: componentValue
      };
    }
  });

  // Add selected record of tables to scope
  components.filter(c => c.type === ComponentType.TABLE).forEach(c => {
    const props = c.props as TableProps;
    if (props.selectedRecordKey) {
      const existingScopeValue = scope[c.id];
      scope[c.id] = {
        ...(typeof existingScopeValue === 'object' && existingScopeValue ? existingScopeValue : {}),
        selectedRecord: get(dataStore, props.selectedRecordKey)
      };
    }
  });

  // ─── Namespaced Access (new, structured) ─────────────────────────
  // These provide collision-free access to different state domains.
  // Users can write {{$vars.count}} instead of {{count}} to avoid collisions.

  // $vars: all runtime variable values
  scope.$vars = { ...variableState };

  // $form: per-component form field values keyed by component ID
  // Includes value + basic component info for each form-type component
  const formScope: Record<string, any> = {};
  const formComponentTypes = new Set([
    ComponentType.INPUT, ComponentType.TEXTAREA, ComponentType.SELECT,
    ComponentType.CHECKBOX, ComponentType.RADIO_GROUP, ComponentType.SWITCH,
    ComponentType.DATE_PICKER, ComponentType.TIME_PICKER, ComponentType.SLIDER,
    ComponentType.FILE_UPLOAD, ComponentType.RATING,
  ]);

  components.forEach(c => {
    if (formComponentTypes.has(c.type)) {
      const compScope = scope[c.id];
      formScope[c.id] = {
        value: compScope?.value,
        name: c.name,
        type: c.type,
      };
    }
  });
  scope.$form = formScope;

  // $query: query results (placeholder for Phase 3, populated from runtime store)
  scope.$query = options?.runtimeExtras?.queryResults ?? {};

  // $page: current page info
  const currentPage = appDefinition.pages?.[0]; // Default to first page
  scope.$page = currentPage ? { id: currentPage.id, name: currentPage.name } : {};

  // ─── Resolve CUSTOM_WIDGET Outputs ──────────────────────────────
  // For each CUSTOM_WIDGET component, evaluate its output expressions against
  // a scoped context (parent scope + resolved input bindings) and expose the
  // results as scope[componentId] = { outputName: value, ... }
  const widgetDefinitions = options?.widgetDefinitions;
  if (widgetDefinitions && widgetDefinitions.length > 0) {
    const widgetComponents = components.filter(c => c.type === ComponentType.CUSTOM_WIDGET);
    for (const wc of widgetComponents) {
      const widgetProps = wc.props as CustomWidgetProps;
      const definition = widgetDefinitions.find(w => w.id === widgetProps.widgetDefinitionId);
      if (!definition) continue;

      // Resolve inputs from bindings
      const resolvedInputs: Record<string, any> = {};
      for (const input of definition.inputs) {
        const binding = widgetProps.inputBindings?.[input.name];
        if (binding) {
          try {
            resolvedInputs[input.name] = safeEval(binding, scope);
          } catch {
            resolvedInputs[input.name] = input.defaultValue;
          }
        } else {
          resolvedInputs[input.name] = input.defaultValue;
        }
      }

      // Evaluate output expressions in widget scope (parent scope + resolved inputs)
      const widgetOutputs: Record<string, any> = {};
      const widgetScope = { ...scope, inputs: resolvedInputs };
      for (const output of definition.outputs) {
        if (output.expression) {
          try {
            widgetOutputs[output.name] = safeEval(output.expression, widgetScope);
          } catch {
            widgetOutputs[output.name] = undefined;
          }
        }
      }

      // Expose as scope[componentId] — merges with any existing component scope entry
      scope[wc.id] = {
        ...(typeof scope[wc.id] === 'object' && scope[wc.id] ? scope[wc.id] : {}),
        ...widgetOutputs,
      };
    }
  }

  // Stamp the scope with a monotonically increasing version for dependency graph caching.
  // This lets useJavaScriptRenderer skip re-evaluation when the cached result's version matches.
  scope.__scopeVersion = dependencyGraph.bumpVersion();

  return scope;
}
