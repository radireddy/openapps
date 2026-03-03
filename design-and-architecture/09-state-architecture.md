# State Architecture: Layered State Model

This document describes the layered state model that governs how data is stored, derived, and exposed to expressions within the App Builder. It covers the current architecture, the target four-layer design, the expression evaluation pipeline, and the phased roadmap for evolving the state system.

**Key source files:**
- `src/types.ts` -- `AppDefinition`, `DataStore`, `AppVariable`, component prop interfaces
- `src/hooks/useAppData.ts` -- central state orchestrator hook
- `src/hooks/state/evaluationScope.ts` -- `buildEvaluationScope()`, `ScopeOptions`
- `src/hooks/state/variableOperations.ts` -- variable CRUD and initialization
- `src/hooks/state/componentOperations.ts` -- component CRUD, dataStore cleanup
- `src/expressions/engine.ts` -- `safeEval()`, `parseDependencies()`, LRU cache

---

## 1. Overview: The Four-Layer Model

The state system is organized into four conceptual layers. Each layer has a distinct lifecycle, persistence model, and set of consumers.

```
┌─────────────────────────────────────────────────┐
│           LAYER 4: Evaluation Scope              │
│  Unified, namespaced, mode-aware scope builder   │
├─────────────────────────────────────────────────┤
│           LAYER 3: Derived State                 │
│  Expression cache, dependency graph, validations │
├─────────────────────────────────────────────────┤
│           LAYER 2: Runtime State (future Zustand)│
│  componentValues, variableState, queryResults    │
├─────────────────────────────────────────────────┤
│           LAYER 1: App Definition (React state)  │
│  components[], pages[], theme, variables[]       │
└─────────────────────────────────────────────────┘
```

| Layer | What it holds | Lifecycle | Persisted? |
|-------|--------------|-----------|------------|
| **L1: AppDefinition** | Component tree, pages, theme tokens, variable definitions, integration settings | Design-time; changes trigger autosave | Yes (localStorage) |
| **L2: Runtime State** | Component values (user input), variable runtime values, query results, form validation triggers | Session-scoped; reset on editor load | No |
| **L3: Derived State** | Compiled expression cache, dependency sets, validation results | Computed on demand; invalidated by L1/L2 changes | No (in-memory) |
| **L4: Evaluation Scope** | Flat scope object merging L1 + L2 + L3 for `safeEval()` | Recomputed every render cycle via `useMemo` | No |

Data flows **upward**: L1 and L2 are inputs; L3 caches computations over them; L4 assembles the final scope consumed by expressions.

---

## 2. Current Architecture

### 2.1 AppDefinition (Layer 1)

The entire application blueprint is a single `AppDefinition` object managed via React `useState` inside `useAppData`:

```typescript
// src/types.ts
export interface AppDefinition extends AppMetadata {
  pages: AppPage[];
  mainPageId: string;
  components: AppComponent[];   // Flat list across all pages
  dataStore: DataStore;         // Record<string, any>
  variables: AppVariable[];     // Variable definitions (name, type, initialValue)
  theme: Theme;
  integration?: IntegrationSettings;
}
```

All mutations go through `setAppDefinitionState()`, which creates a new immutable object reference, triggering React re-renders and a 1-second debounced autosave.

### 2.2 The Flat `dataStore` Problem

The `dataStore` is currently typed as `Record<string, any>`. It conflates several concerns into a single flat namespace:

```
dataStore = {
  "INPUT_171234": "user typed value",     // component runtime value
  "TABLE_171235": { selectedRecord: ... }, // component selection state
  "__formValidationTrigger": 1708123456,   // internal signal
  "someApiData": [ ... ],                 // ad-hoc data from actions
}
```

**Limitations:**

1. **No namespace separation** -- Component values, variable state, query results, and internal signals all share one flat object. Key collisions are possible.
2. **Persistence leakage** -- `dataStore` is part of `AppDefinition`, so runtime values written during preview (e.g., user-typed input values) get persisted to localStorage. The editor initialization must strip component-keyed entries on load:
   ```typescript
   // useAppData.ts -- cleanup on init
   const componentIds = new Set(initialAppDefinition.components.map(c => c.id));
   for (const [key, value] of Object.entries(initialAppDefinition.dataStore || {})) {
     if (!componentIds.has(key)) {
       cleanedDataStore[key] = value;
     }
   }
   ```
3. **No type safety** -- Values are `any`. There is no runtime validation that a component wrote the expected type.
4. **Re-render granularity** -- Any `updateDataStore` call replaces the entire `dataStore` object, causing all components that depend on `evaluationScope` to re-render, even if their specific data did not change.
5. **Variable state is separate** -- `variableState` lives in its own `useState` hook, outside `dataStore`, creating two parallel state stores that must be merged at scope-building time.

### 2.3 Runtime Variable State (Layer 2, partial)

Variable runtime values are stored in a separate `useState<Record<string, any>>`:

```typescript
const [variableState, setVariableState] = useState<Record<string, any>>(
  () => initializeVariableState(initialAppDefinition.variables || [])
);
```

`initializeVariableState` parses each variable's `initialValue` according to its declared type (`string`, `number`, `boolean`, `object`, `array`, `array_of_objects`). This state is merged into the evaluation scope alongside `dataStore`.

---

## 3. Target Architecture: Four Layers in Detail

### 3.1 Layer 1: AppDefinition (React State)

**Purpose:** Stores the design-time configuration that is persisted and defines the application structure.

**Contents:**
- `components[]` -- flat array of `AppComponent` instances (type, props, parentId, pageId)
- `pages[]` -- page definitions (id, name)
- `theme` -- colors, typography, spacing, border, radius, shadow, transition tokens
- `variables[]` -- variable definitions (id, name, type, initialValue) -- NOT runtime values
- `integration` -- UiPath SDK settings
- `dataStore` -- initial/default data only (no runtime component values)

**Mutations:** All mutations are pure functions in `src/hooks/state/`:

| Module | Key Functions |
|--------|--------------|
| `componentOperations.ts` | `addComponentToState()`, `updateComponentInState()`, `deleteComponentFromState()`, `deleteSelectedComponentsFromState()` |
| `containerOperations.ts` | `reparentComponentInState()`, `reorderComponentInState()`, `moveComponentToParentInState()` |
| `variableOperations.ts` | `addVariableToState()`, `updateVariableInState()`, `deleteVariableFromState()` |
| `alignmentOperations.ts` | `calculateAlignmentUpdates()` |

**Invariant:** Deleting a component also removes its key from `dataStore`:

```typescript
// componentOperations.ts -- deleteComponentFromState
const cleanedDataStore = { ...state.dataStore };
idsToDelete.forEach(deletedId => {
  delete cleanedDataStore[deletedId];
});
```

### 3.2 Layer 2: Runtime State

**Purpose:** Holds ephemeral values generated during a session -- user input, variable mutations, query responses, form state. Not persisted.

**Current implementation:**

| Data | Storage | Location |
|------|---------|----------|
| Component values (user input) | `dataStore[componentId]` | `AppDefinition.dataStore` (inside L1) |
| Variable runtime values | `variableState` | Separate `useState` in `useAppData` |
| Form validation trigger | `dataStore.__formValidationTrigger` | `AppDefinition.dataStore` |
| Table selected record | `dataStore[selectedRecordKey]` | `AppDefinition.dataStore` |

**Target implementation (Phase 2):** A dedicated Zustand store separating runtime state from the persisted `AppDefinition`:

```typescript
// Future: src/stores/runtimeStore.ts
interface RuntimeState {
  componentValues: Record<string, any>;    // INPUT_123 -> "typed text"
  variableState: Record<string, any>;      // myVar -> 42
  queryResults: Record<string, any>;       // queryName -> { data, loading, error }
  formState: {
    validationTrigger: number;
    fieldErrors: Record<string, string>;
    submitCount: number;
  };
}
```

### 3.3 Layer 3: Derived State

**Purpose:** Caches expensive computations that depend on L1 and L2 inputs. Invalidated automatically when inputs change.

**Current implementation:**

| Derived Data | Implementation | Location |
|-------------|---------------|----------|
| Compiled expression functions | LRU Map (max 500 entries) | `expressions/engine.ts` |
| Parsed dependencies | Computed on each call | `parseDependencies()` |
| Evaluation scope | `useMemo` in `useAppData` | `evaluationScope.ts` |

**Expression Cache (LRU):**

The compiled function cache avoids recompiling the same expression string into `new Function()` on every render:

```typescript
// expressions/engine.ts
const CACHE_MAX_SIZE = 500;
const compiledFunctionCache = new Map<string, Function>();

function getOrCompileFunction(funcBody: string): Function {
  const cached = compiledFunctionCache.get(funcBody);
  if (cached) {
    // LRU promotion: delete and re-insert at end
    compiledFunctionCache.delete(funcBody);
    compiledFunctionCache.set(funcBody, cached);
    return cached;
  }
  const func = new Function('scope', funcBody);
  if (compiledFunctionCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = compiledFunctionCache.keys().next().value;
    if (oldestKey !== undefined) compiledFunctionCache.delete(oldestKey);
  }
  compiledFunctionCache.set(funcBody, func);
  return func;
}
```

With ~30 components and ~15 expressible properties each, this reduces ~450 compilations per render to ~30 unique compilations.

**Target additions (Phase 3):**
- Expression dependency graph (static analysis of which scope keys each expression reads)
- Validation result cache keyed by `(componentId, value, rules)`

### 3.4 Layer 4: Evaluation Scope

**Purpose:** Assembles a single flat object that `safeEval()` uses as the `with(scope)` context for expression evaluation. Mode-aware (edit, preview, run).

**Current implementation:** `buildEvaluationScope()` in `src/hooks/state/evaluationScope.ts`.

```typescript
export interface ScopeOptions {
  /** Override theme (e.g., with lowercase color aliases for preview) */
  themeOverride?: Theme;
  /** Additional scope entries to merge (e.g., uipath SDK) */
  extras?: Record<string, any>;
  /** Evaluation mode: edit (design surface), preview (in-editor preview), run (standalone) */
  mode?: 'edit' | 'preview' | 'run';
}
```

**Scope assembly order (current):**

```
scope = {
  console,                          // safe console access
  theme: effectiveTheme,            // L1: theme tokens
  pages: appDefinition.pages,       // L1: page definitions
  ...dataStore,                     // L1+L2: spread all dataStore keys
  ...variableState,                 // L2: spread all variable values
  ...options.extras,                // injected extras (SDK, etc.)
  [componentId]: { ...props, value } // per-component: props + resolved value
}
```

**Two-pass component resolution:**
1. First pass: add all component props to scope (`scope[componentId] = { ...props }`)
2. Second pass: resolve each component's `value` (check dataStore, then evaluate `value` expression, then fall back to `defaultValue` expression) and merge it in

This two-pass approach allows components to reference each other's values in expressions.

---

## 4. Expression Pipeline

Expressions flow through a well-defined pipeline from `{{ }}` syntax in component props to evaluated runtime values.

### 4.1 Pipeline Stages

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. Author   │───>│  2. Detect   │───>│  3. Compile  │───>│  4. Evaluate │
│              │    │              │    │              │    │              │
│ User writes  │    │ Template vs  │    │ new Function │    │ func(scope)  │
│ {{count + 1}}│    │ pure expr    │    │ (LRU cached) │    │ with(scope)  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                                                                   v
                                        ┌──────────────┐    ┌──────────────┐
                                        │ 6. Render    │<───│ 5. Resolve   │
                                        │              │    │              │
                                        │ Component    │    │ Return value │
                                        │ displays val │    │ or fallback  │
                                        └──────────────┘    └──────────────┘
```

**Stage 1 -- Author:** User writes an expression in a component property, either as a pure expression (`{{count + 1}}`) or as a template literal (`"Hello {{userName}}"`).

**Stage 2 -- Detect:** At render time, the system checks if the property value is a string containing `{{`. Two forms are recognized:
- **Pure expression:** starts with `{{` and ends with `}}` -- the inner content is extracted and evaluated directly
- **Template literal:** contains `{{ }}` embedded within other text -- each `{{ }}` segment is evaluated and interpolated

**Stage 3 -- Compile:** The expression string is wrapped in a `with(scope)` block and compiled into a `Function` object. The compiled function is cached in the LRU cache keyed by the function body string:

```typescript
const funcBody = `with(scope) { return ${trimmedExpression} }`;
const func = getOrCompileFunction(funcBody);  // LRU cache lookup/insert
```

**Stage 4 -- Evaluate:** The compiled function is called with the current evaluation scope. Security guards run before compilation:
- Forbidden globals regex: blocks `window`, `document`, `globalThis`, `process`, `require`, `Function`
- Assignment pattern regex: blocks top-level assignments like `myVar = 10`

**Stage 5 -- Resolve:** The return value is used. Error handling is forgiving:
- `ReferenceError` on a simple identifier (partially typed variable) returns the identifier as a string
- `SyntaxError` on a partial expression (ends with operator) returns `undefined`
- Other errors are logged but do not throw, returning `undefined`

**Stage 6 -- Render:** The resolved value is passed to the component renderer, which displays it in the DOM.

### 4.2 Dependency Tracking

`parseDependencies()` performs static analysis to extract top-level variable names from an expression:

```typescript
parseDependencies("Input1.value > 10 && isAdmin")
// Returns: ["Input1", "isAdmin"]
```

The regex matches identifier patterns followed by operators, property access, or end-of-string, filtering out language keywords (`true`, `false`, `null`, `undefined`, etc.).

Currently, dependency information is computed on demand and not cached. Phase 3 will introduce a persistent dependency graph for fine-grained invalidation.

---

## 5. Data Flow Diagram

This diagram traces the complete data flow from user interaction through all four layers.

```
 User Interaction (types into Input, clicks Button, etc.)
           │
           v
 ┌─────────────────────────────────────────────────────────┐
 │  Component Renderer (e.g., InputRenderer)                │
 │  Calls: onUpdateDataStore(componentId, newValue)         │
 │         actions.updateVariable(varName, newValue)        │
 └────────────────────┬────────────────────────────────────┘
                      │
                      v
 ┌─────────────────────────────────────────────────────────┐
 │  useAppData Hook (Orchestrator)                          │
 │                                                          │
 │  updateDataStore() ──> setAppDefinitionState(prev => {   │
 │    ...prev,                                              │
 │    dataStore: set(prev.dataStore, key, value)    [L1+L2] │
 │  })                                                      │
 │                                                          │
 │  handleUpdateVariable() ──> setVariableState(prev => {   │
 │    ...prev,                                              │
 │    [varName]: newValue                              [L2] │
 │  })                                                      │
 └────────────────────┬────────────────────────────────────┘
                      │
                      │ React re-render triggered
                      v
 ┌─────────────────────────────────────────────────────────┐
 │  evaluationScope = useMemo(() => {                       │
 │    return buildEvaluationScope(                          │
 │      appDefinition,     // L1: theme, pages, components  │
 │      dataStore,         // L1+L2: runtime values         │
 │      components,        // L1: component definitions     │
 │      variableState,     // L2: variable runtime values   │
 │      { mode: 'edit' }   // L4: scope options             │
 │    );                                                    │
 │  }, [appDefinition.theme, appDefinition.pages,           │
 │      dataStore, components, variableState]);         [L4] │
 └────────────────────┬────────────────────────────────────┘
                      │
                      v
 ┌─────────────────────────────────────────────────────────┐
 │  Component Re-render                                     │
 │                                                          │
 │  props.text = "Total: {{count + 1}}"                     │
 │                    │                                     │
 │                    v                                     │
 │  safeEval("count + 1", evaluationScope)                  │
 │       │                                                  │
 │       ├── getOrCompileFunction(funcBody)         [L3]    │
 │       │       cache hit? return cached Function          │
 │       │       cache miss? compile, cache, return         │
 │       │                                                  │
 │       └── func(scope) ──> returns 43                     │
 │                                                          │
 │  Rendered output: "Total: 43"                            │
 └─────────────────────────────────────────────────────────┘
```

### Batch Update Flow

For operations that modify multiple dataStore keys at once (e.g., form reset, bulk import), `batchUpdateDataStore` prevents N separate re-renders:

```typescript
batchUpdateDataStore(updates: Record<string, any>) {
  setAppDefinitionState(prev => {
    let newDataStore = { ...prev.dataStore };
    for (const [key, value] of Object.entries(updates)) {
      newDataStore = set(newDataStore, key, value);
    }
    return { ...prev, dataStore: newDataStore };
  });
}
```

This coalesces multiple writes into a single `setState` call, producing one re-render.

### Autosave Flow

```
 setAppDefinitionState(newState)
           │
           v
 useEffect([appDefinition]) triggers
           │
           v
 clearTimeout(previous) ──> setTimeout(onSave, 1000ms)
           │
           v (after 1s of inactivity)
 onSave(appDefinition) ──> storageService.saveApp()
```

---

## 6. Phase 1 Changes (Implemented)

These improvements are already in the codebase on the current branch.

### 6.1 Unified Scope Builder

**Before:** Scope building logic was duplicated between `useAppData` (editor) and `Preview` component. Changes in one could diverge from the other.

**After:** A single `buildEvaluationScope()` function in `src/hooks/state/evaluationScope.ts` is the sole authority for scope construction. Both editor and preview call it with different `ScopeOptions`.

```typescript
// Editor usage
buildEvaluationScope(appDefinition, dataStore, components, variableState, { mode: 'edit' });

// Preview usage
buildEvaluationScope(appDefinition, dataStore, components, variableState, {
  mode: 'preview',
  themeOverride: previewTheme,
  extras: { uipath: sdkInstance }
});
```

### 6.2 Expression Caching (LRU)

**Before:** Every call to `safeEval()` compiled a new `Function` object via `new Function('scope', ...)`.

**After:** An LRU cache (capacity 500) stores compiled `Function` objects keyed by their body string. Cache hits skip compilation entirely. LRU eviction ensures memory stays bounded.

**Impact:** With 30 components x 15 expressible properties, a typical render cycle goes from ~450 compilations to ~30 unique compilations on first render, then 0 compilations on subsequent renders (all cache hits).

Diagnostic/testing API:
```typescript
clearExpressionCache(): void       // Reset cache (testing, security model changes)
getExpressionCacheSize(): number   // Current cache occupancy
```

### 6.3 DataStore Cleanup on Component Deletion

**Before:** Deleting a component left orphan entries in `dataStore`, accumulating stale data over the application's lifetime.

**After:** `deleteComponentFromState()` and `deleteSelectedComponentsFromState()` both remove `dataStore[id]` for every deleted component and its descendants:

```typescript
const cleanedDataStore = { ...state.dataStore };
idsToDelete.forEach(deletedId => {
  delete cleanedDataStore[deletedId];
});
```

### 6.4 Batch Update API

`batchUpdateDataStore(updates: Record<string, any>)` was added to coalesce multiple dataStore writes into a single `setState` call, preventing N re-render cascades for operations like form resets.

### 6.5 Mode-Aware Scope

`ScopeOptions.mode` (`'edit' | 'preview' | 'run'`) is threaded through `buildEvaluationScope()`. Currently both modes build the same scope, but the mode flag is available for future differentiation (e.g., suppressing action execution in edit mode, enabling query execution only in preview/run).

### 6.6 Editor Session Initialization Cleanup

On editor load, component-keyed entries from the persisted `dataStore` are stripped:

```typescript
const componentIds = new Set(initialAppDefinition.components.map(c => c.id));
const cleanedDataStore: Record<string, any> = {};
for (const [key, value] of Object.entries(initialAppDefinition.dataStore || {})) {
  if (!componentIds.has(key)) {
    cleanedDataStore[key] = value;
  }
}
```

This ensures each editor session starts with clean runtime state, preventing stale preview values from overriding expression-evaluated defaults.

---

## 7. Phase 2 Roadmap: Runtime Store Separation

### 7.1 Zustand Runtime Store

Extract all ephemeral runtime state from `AppDefinition.dataStore` into a dedicated Zustand store:

```typescript
// src/stores/runtimeStore.ts (future)
import { create } from 'zustand';

interface RuntimeState {
  // Component values (user interactions)
  componentValues: Record<string, any>;
  setComponentValue: (id: string, value: any) => void;
  clearComponentValue: (id: string) => void;

  // Variable runtime state
  variableState: Record<string, any>;
  setVariableValue: (name: string, value: any) => void;

  // Query/data source results
  queryResults: Record<string, { data: any; loading: boolean; error: string | null }>;
  setQueryResult: (name: string, result: any) => void;

  // Form state
  formState: {
    validationTrigger: number;
    fieldErrors: Record<string, string>;
    submitCount: number;
  };
  triggerValidation: () => void;

  // Bulk operations
  reset: () => void;
}
```

**Benefits:**
- `AppDefinition.dataStore` becomes purely for design-time/initial data
- Zustand selectors enable fine-grained subscriptions (only re-render when your slice changes)
- No more persistence leakage of runtime values
- Clear separation of concerns

### 7.2 Namespaced Scope

Replace the flat spread of `dataStore` and `variableState` into scope with explicit namespaces:

```typescript
// Target scope shape
scope = {
  $form: {
    Input1: { value: "typed text", error: null, touched: true },
    Select1: { value: "option-a", error: null, touched: false },
  },
  $vars: {
    userName: "Alice",
    itemCount: 42,
  },
  $query: {
    fetchUsers: { data: [...], loading: false, error: null },
  },
  theme: { colors: { ... }, spacing: { ... }, ... },
  pages: [ ... ],
  // Component shorthand access preserved for backward compatibility
  Input1: { ...props, value: "typed text" },
}
```

This eliminates key collisions between component IDs, variable names, and query names.

### 7.3 Form-Scoped State

Move form validation logic from `handleSubmitForm` in `useAppData` to the runtime store:

- Track `touched`, `dirty`, `error` per field
- `validationTiming` (`onBlur`, `onChange`, `onSubmit`) drives when errors are computed
- `customValidator` expressions run against form-scoped state
- `$form.isValid`, `$form.isDirty`, `$form.errors` available in expressions

### 7.4 Runtime Type Validation

Use `AppVariable.type` to validate values written to `variableState`:

```typescript
setVariableValue(name: string, value: any) {
  const definition = variables.find(v => v.name === name);
  if (definition) {
    const validated = coerceToType(value, definition.type);
    // warn in dev mode if coercion changed the value
  }
}
```

---

## 8. Phase 3 Roadmap: Expression Dependency Graph

### 8.1 Static Dependency Graph

Build a persistent graph mapping each `(componentId, propKey)` to the set of scope keys it reads:

```
Expression: "{{Input1.value + $vars.taxRate}}"
Depends on: ["Input1", "$vars"]

Graph entry:
  Label1.text -> { Input1, $vars }
  Button1.disabled -> { $form }
```

When `Input1.value` changes, only components with edges to `Input1` need re-evaluation. This replaces the current approach where every component re-evaluates every expression on every render.

**Implementation sketch:**

```typescript
interface DependencyGraph {
  // Forward: which scope keys does this expression depend on?
  dependencies: Map<string, Set<string>>;  // expressionKey -> Set<scopeKey>
  // Reverse: which expressions depend on this scope key?
  dependents: Map<string, Set<string>>;    // scopeKey -> Set<expressionKey>

  addExpression(key: string, expression: string): void;
  removeExpression(key: string): void;
  getAffected(changedKeys: string[]): Set<string>;
}
```

### 8.2 Query / Data Source Layer

Introduce a query abstraction in the runtime store:

```typescript
interface QueryDefinition {
  name: string;
  type: 'rest' | 'graphql' | 'static';
  config: Record<string, any>;
  // Expressions in config are resolved against scope
  autoRefreshInterval?: number;
  dependsOn?: string[];  // scope keys that trigger re-fetch
}
```

Query results populate `$query.queryName` in the scope. Queries can reference other scope values in their configuration (e.g., URL parameters from form fields).

### 8.3 Run Mode

Full standalone execution mode where:
- No editor chrome is loaded
- `mode: 'run'` in `ScopeOptions` enables all action execution
- Queries auto-execute based on their `dependsOn` triggers
- Navigation actions actually change the rendered page
- Form submissions can POST to external endpoints

### 8.4 Replace `with()` in safeEval

The current `with(scope)` pattern has known limitations:
- Cannot be used in strict mode
- Performance overhead from scope chain lookup
- Ambiguity between scope properties and local variables

Target replacement: generate a function with destructured parameters:

```typescript
// Current
new Function('scope', 'with(scope) { return count + 1 }')

// Target
const keys = Object.keys(scope);
const func = new Function(...keys, 'return count + 1');
func(...keys.map(k => scope[k]));
```

This is strict-mode compatible and avoids the `with` scope chain overhead.

---

## 9. API Reference

### 9.1 `buildEvaluationScope()`

**Location:** `src/hooks/state/evaluationScope.ts`

```typescript
function buildEvaluationScope(
  appDefinition: AppDefinition,
  dataStore: Record<string, any>,
  components: AppComponent[],
  variableState: Record<string, any>,
  options?: ScopeOptions
): Record<string, any>
```

Builds the unified evaluation scope by merging design-time config (theme, pages), runtime state (dataStore, variableState), and per-component resolved values. Uses a two-pass approach: first pass adds component props to scope, second pass resolves each component's `value` (dataStore lookup, then expression evaluation, then defaultValue fallback).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `appDefinition` | `AppDefinition` | Full app blueprint (used for theme, pages) |
| `dataStore` | `Record<string, any>` | Current runtime data store |
| `components` | `AppComponent[]` | All components in the app |
| `variableState` | `Record<string, any>` | Current variable runtime values |
| `options` | `ScopeOptions` (optional) | Theme override, extras, mode |

**ScopeOptions interface:**

```typescript
interface ScopeOptions {
  themeOverride?: Theme;
  extras?: Record<string, any>;
  mode?: 'edit' | 'preview' | 'run';
}
```

### 9.2 `safeEval()`

**Location:** `src/expressions/engine.ts`

```typescript
function safeEval(expression: string, scope: Record<string, any>): any
```

Evaluates a JavaScript expression string within a sandboxed scope. Uses the LRU-cached compiled function to avoid recompilation. Returns `undefined` for empty/invalid expressions. Does not throw on evaluation errors (logs them instead).

**Security guards:**
- Blocks access to `window`, `document`, `globalThis`, `process`, `require`, `Function`
- Blocks top-level assignments (`myVar = 10`)

**Error handling:**
- `ReferenceError` on simple identifier: returns identifier as string (typing assistance)
- `SyntaxError` on partial expression: returns `undefined` (in-progress typing)
- All other errors: logs to console, returns `undefined`

### 9.3 `parseDependencies()`

**Location:** `src/expressions/engine.ts`

```typescript
function parseDependencies(expression: string): string[]
```

Performs static analysis to extract top-level variable names referenced in an expression. Filters out JavaScript keywords and literals. Returns unique root identifiers (e.g., `Input1.value` yields `"Input1"`).

### 9.4 `clearExpressionCache()`

**Location:** `src/expressions/engine.ts`

```typescript
function clearExpressionCache(): void
```

Clears the entire LRU compiled function cache. Use for testing or when the expression security model changes.

### 9.5 `getExpressionCacheSize()`

**Location:** `src/expressions/engine.ts`

```typescript
function getExpressionCacheSize(): number
```

Returns the current number of entries in the compiled function cache. Useful for diagnostics and testing cache behavior.

### 9.6 `batchUpdateDataStore()`

**Location:** `src/hooks/useAppData.ts`

```typescript
batchUpdateDataStore(updates: Record<string, any>): void
```

Applies multiple key-value updates to the dataStore in a single `setState` call. Prevents N separate re-render cascades for bulk operations (form reset, data import, programmatic multi-field updates).

### 9.7 `initializeVariableState()`

**Location:** `src/hooks/state/variableOperations.ts`

```typescript
function initializeVariableState(variables: AppVariable[]): Record<string, any>
```

Creates the initial runtime variable state by parsing each variable's `initialValue` according to its declared type. Handles JSON parsing for object/array types with safe fallbacks.

---

## 10. Related Documents

- [00-architecture-overview.md](./00-architecture-overview.md) -- System-level architecture and plugin design
- [01-expression-engine.md](./01-expression-engine.md) -- Expression evaluation details and sandboxing
- [03-app-data-model.md](./03-app-data-model.md) -- AppDefinition data model reference
- [04-component-architecture.md](./04-component-architecture.md) -- Component plugin system
- [PROPERTIES_ARCHITECTURE_SUMMARY.md](./PROPERTIES_ARCHITECTURE_SUMMARY.md) -- Metadata-driven property system
