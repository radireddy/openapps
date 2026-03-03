# Architecture Improvement Action Plan

**Generated**: 2026-02-14
**Based on**: Full architectural audit (component architecture, properties panel, state management, industry benchmarking, testability)

---

## Current State Summary

| Metric | Value |
|--------|-------|
| Registered components | 13 |
| Test files | 38 |
| Test blocks (describe/it) | ~250+ |
| Jest coverage exclusions | 44 patterns |
| useAppData.ts size | 1,859 lines, ~28 exports |
| Property systems | 2 (old `property-groups/` + new `properties/`) |
| Components still on old system | 11 of 13 |
| Components missing dedicated tests | 3 (Divider, Container, List) |
| E2E tests | 2 files, ~6 scenarios |
| Testability score | 6.5/10 |

### Critical Findings

1. **Dual property system**: Old `property-groups/` (11 files, 11 component importers) coexists with new `properties/` (schema-driven). Migration stalled at Phase 2.
2. **Coverage illusion**: 44 exclusion patterns hide nearly all implementation files from the 90% threshold.
3. **God hook**: `useAppData.ts` at 1,859 lines with ~28 exports handles all state management.
4. **Missing test seams**: No expression evaluator abstraction, no storage interface, tight Canvas coupling.
5. **No undo/redo**: Industry-standard feature absent from state management.

---

## Phase 0: Foundation & Quick Wins (Week 1)

> Goal: Fix the measurement system and close easy gaps before structural changes.

### 0.1 Fix Coverage Measurement
**Priority**: P0 | **Effort**: 1 day | **Risk**: None

Remove exclusions for files that **already have tests**:
- `src/hooks/useAppData.ts` — has 25 tests across 2 files
- `src/expressions/**` — has 18 tests in `engine.test.ts`
- `src/property-renderers/**` — has tests in `useJavaScriptRenderer.test.ts`
- `src/storageService.ts` — has `storageService.test.ts`
- `src/utils/**` — has `data-helpers.test.ts`, `disabled-helper.test.ts`
- `src/services/**` — has `geminiService.test.ts`, `project-exporter.test.ts`
- `src/components/component-registry/__tests__/**` — test utils shouldn't be excluded

**Action**: Edit `jest.config.js`, remove 7 exclusion lines, run tests to verify thresholds still pass. If coverage dips below thresholds, adjust thresholds temporarily and document the real baseline.

### 0.2 Add Missing Component Tests
**Priority**: P0 | **Effort**: 2 days | **Risk**: Low

Create test files for untested components:
- `Divider.test.tsx` — simple (renders `<hr>`, few props)
- `Container.test.tsx` — child rendering, overflow, background
- `List.test.tsx` — template iteration, data binding, empty state

Follow existing patterns in `Input.test.tsx`. Use the existing `component-renderer.tsx` test utility.

### 0.3 Establish Real Coverage Baseline
**Priority**: P0 | **Effort**: 0.5 day | **Risk**: None

After 0.1 and 0.2, run full coverage and document:
- Actual coverage % per directory
- Files with 0% coverage
- Set honest thresholds (may need to lower temporarily)
- Create coverage improvement targets per phase

---

## Phase 1: Property System Unification (Weeks 2–3)

> Goal: Complete the stalled migration from `property-groups/` to `properties/`. This is the single highest-impact architectural change — it eliminates the dual system, reduces code, and enables schema-driven testing.

### 1.1 Audit Current Property Schema Coverage
**Priority**: P0 | **Effort**: 1 day | **Risk**: Low

Map which components have schemas in `properties/schemas/` vs which still use only `property-groups/`:

| Component | Has New Schema? | Still Imports Old System? |
|-----------|----------------|--------------------------|
| All 13 | Audit needed | 11 confirmed importing old |

**Action**: Create a migration tracking table. Identify components that can be migrated with zero behavior change.

### 1.2 Migrate Components to New Schema System
**Priority**: P1 | **Effort**: 5–7 days | **Risk**: Medium

For each of the 11 components still importing `property-groups/`:
1. Create or complete `properties/schemas/{component}.ts` if missing
2. Update component's `.properties` export to use `PropertiesPanelCore` + schema
3. Verify rendering parity (visual regression or manual check)
4. Remove `property-groups/` import

**Order** (simplest first):
1. Divider (fewest properties)
2. Label
3. Image
4. Switch, Checkbox
5. Input, Textarea
6. Select, RadioGroup
7. Button (most complex — actions, conditional properties)
8. Table
9. Container, List (containers)

### 1.3 Deprecate and Remove Old System
**Priority**: P1 | **Effort**: 2 days | **Risk**: Medium

Once all 13 components use the new schema system:
1. Remove all files in `src/components/property-groups/`
2. Remove `property-groups` exclusion from `jest.config.js`
3. Update `PROPERTIES_ARCHITECTURE_SUMMARY.md` to reflect new system
4. Update `design-and-architecture/05-properties-architecture.md`

### 1.4 Add Property Schema Tests
**Priority**: P1 | **Effort**: 2 days | **Risk**: Low

With all components on the new system:
- Test `visibleIf` conditional visibility for each schema
- Test validation rules (min/max, required, patterns)
- Test property interdependencies
- Extend the capability matrix to cover conditional properties
- Remove `properties/**` exclusion from `jest.config.js`

---

## Phase 2: State Management Decomposition (Weeks 4–5)

> Goal: Break the 1,859-line `useAppData` god hook into focused, testable modules.

### 2.1 Extract Pure Functions
**Priority**: P1 | **Effort**: 3 days | **Risk**: Low

Many operations inside `useAppData` are pure transformations that don't need React state. Extract them:

```
src/hooks/
├── useAppData.ts              ← Thin orchestrator (~400 lines)
├── state/
│   ├── componentOperations.ts ← addComponent, updateComponent, deleteComponent
│   ├── containerOperations.ts ← reparentComponent, reorderComponent, arrangeChildren
│   ├── variableOperations.ts  ← addVariable, updateVariable, deleteVariable
│   ├── pageOperations.ts      ← selectPage, addPage, deletePage
│   ├── selectionOperations.ts ← selectComponent, deselectAll, deleteSelected
│   └── evaluationScope.ts     ← buildEvaluationScope (currently O(n) with 3 passes)
```

**Key principle**: Each extracted module is a pure function `(state, action) => newState`. No React hooks inside, making them trivially testable.

### 2.2 Add Tests for Extracted Modules
**Priority**: P1 | **Effort**: 3 days | **Risk**: Low

With pure functions extracted:
- Test `componentOperations` — add/update/delete with edge cases
- Test `containerOperations` — reparenting with coordinate transforms, circular reference detection
- Test `evaluationScope` — scope computation correctness, performance with large component trees
- Test `selectionOperations` — multi-select, shift-click, deselect
- Test `pageOperations` — page CRUD, component-page association

### 2.3 Optimize Evaluation Scope
**Priority**: P2 | **Effort**: 2 days | **Risk**: Medium

Current: O(n) with 3 passes through all components on every change.

Options (pick after profiling):
- **Incremental update**: Only recompute affected portions when a single component changes
- **Memoization by component ID**: Cache individual component evaluations
- **Lazy evaluation**: Only evaluate expressions when components are visible/rendered

### 2.4 Add Undo/Redo (Command Pattern)
**Priority**: P2 | **Effort**: 5 days | **Risk**: Medium

Industry standard feature. Implementation approach:
1. Wrap state mutations in command objects with `execute()` and `undo()`
2. Maintain undo/redo stacks (max depth: ~50 operations)
3. Support grouping related operations (e.g., multi-component drag is one undo step)
4. Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z

**Depends on**: Phase 2.1 (pure function extraction makes commands straightforward)

---

## Phase 3: Component Architecture Improvements (Weeks 6–7)

> Goal: Improve type safety, reduce duplication, and enable better extensibility.

### 3.1 Fix Type Safety in ComponentPlugin
**Priority**: P1 | **Effort**: 1 day | **Risk**: Low

Current issue: `React.FC<any>` erases type safety for renderers and properties.

```typescript
// Before
interface ComponentPlugin {
  renderer: React.FC<any>;
  properties: React.FC<any>;
}

// After — use generic with constraint
interface ComponentPlugin<T extends BaseProps = BaseProps> {
  renderer: React.FC<ComponentRendererProps<T>>;
  properties: React.FC<ComponentPropertiesProps<T>>;
}
```

### 3.2 Extend Container Factory Pattern
**Priority**: P2 | **Effort**: 3 days | **Risk**: Low

The existing `createContainerComponent()` factory reduced ~250 lines to ~67 per container. Extend this:
- Create `createFormComponent()` factory for form components (Input, Select, Textarea, Checkbox, Switch, RadioGroup share ~60% of their structure)
- Standardize event handler patterns (onChange, onBlur, onFocus)
- Standardize validation display patterns

### 3.3 Add Component Lifecycle Hooks
**Priority**: P3 | **Effort**: 3 days | **Risk**: Medium

Following industry patterns (Appsmith, Retool), add lifecycle hooks:
- `onMount` — execute when component first renders
- `onUnmount` — cleanup when removed
- `onPropertyChange` — react to property modifications
- `onDataChange` — react to bound data changes

### 3.4 Add Component Validation Framework
**Priority**: P2 | **Effort**: 2 days | **Risk**: Low

Standardized validation for form components:
- Required field validation
- Pattern matching (regex)
- Min/max for numbers
- Custom validation expressions
- Validation state reflected in component rendering (error borders, messages)

---

## Phase 4: Canvas & Interaction Testability (Weeks 8–9)

> Goal: Make the Canvas testable at the unit level, not just E2E.

### 4.1 Extract Drag-and-Drop Logic
**Priority**: P2 | **Effort**: 4 days | **Risk**: Medium

Current: Drag logic is embedded in Canvas.tsx with direct DOM manipulation.

Extract to:
```
src/hooks/
├── useDragAndDrop.ts      ← React hook wrapping pure functions
src/utils/
├── dragCalculations.ts    ← Pure: coordinate transforms, hit testing
├── dropTargetResolver.ts  ← Pure: determine valid drop targets
├── containerDetection.ts  ← Pure: find container at coordinates
```

### 4.2 Unit Test Drag Logic
**Priority**: P2 | **Effort**: 3 days | **Risk**: Low

With pure functions extracted:
- Test coordinate transforms (canvas zoom, scroll offset)
- Test container detection at various nesting levels
- Test drop target validation (can't drop parent into child)
- Test reparenting coordinate adjustment
- Remove `Canvas.tsx` from jest exclusions

### 4.3 Add Integration Tests for Editor Workflows
**Priority**: P3 | **Effort**: 3 days | **Risk**: Low

Tests that verify complete workflows without E2E overhead:
- Add component → select → edit properties → verify state
- Multi-select → batch property edit → verify all updated
- Delete component with children → verify cascade
- Copy/paste component → verify new IDs

---

## Phase 5: Expression Engine Hardening (Week 10)

> Goal: Cover edge cases and prepare for more advanced expression features.

### 5.1 Advanced Expression Tests
**Priority**: P2 | **Effort**: 2 days | **Risk**: Low

Add tests for uncovered scenarios:
- Array/object literals: `{{ [1, 2, 3] }}`, `{{ {key: "value"} }}`
- Template literals: `` {{ `Hello ${name}` }} ``
- Ternary expressions: `{{ isLoggedIn ? "Welcome" : "Login" }}`
- Optional chaining: `{{ user?.profile?.name }}`
- Undefined nested paths: `{{ a.b.c }}` when `b` is undefined
- Performance: large scope objects (1000+ keys)

### 5.2 Expression Evaluator Abstraction
**Priority**: P3 | **Effort**: 2 days | **Risk**: Low

Create `useExpressionEvaluator()` hook:
- Injectable evaluator function (enables mocking in tests)
- Error boundary per expression (one bad expression doesn't break siblings)
- Expression result caching (don't re-evaluate unchanged expressions)
- Debug mode (log evaluated expressions and results)

---

## Phase 6: Documentation & Developer Experience (Ongoing)

### 6.1 Update Architecture Docs
**Priority**: P1 | **Effort**: 2 days | **Risk**: None

Files to update after each phase:
- `PROPERTIES_ARCHITECTURE_SUMMARY.md` — reflect unified system (after Phase 1)
- `00-architecture-overview.md` — update data flow diagrams (after Phase 2)
- `04-component-architecture.md` — update plugin patterns (after Phase 3)
- `07-creating-new-components.md` — update step-by-step guide (after Phases 1+3)

### 6.2 Create Testing Guide
**Priority**: P2 | **Effort**: 1 day | **Risk**: None

New file: `design-and-architecture/08-testing-guide.md`
- How to add tests for new components (use capability matrix)
- How to test property schemas
- How to test expressions
- Coverage requirements and how to run them
- Test utility reference (component-renderer, sample-values, effect-assertions)

---

## Execution Timeline

```
Week 1  ████████  Phase 0: Foundation (coverage fix, missing tests, baseline)
Week 2  ████████  Phase 1.1–1.2: Property audit + start migration
Week 3  ████████  Phase 1.2–1.4: Complete migration, remove old system, add tests
Week 4  ████████  Phase 2.1–2.2: Extract pure functions from useAppData + tests
Week 5  ████████  Phase 2.3–2.4: Optimize eval scope, add undo/redo
Week 6  ████████  Phase 3.1–3.2: Type safety + component factories
Week 7  ████████  Phase 3.3–3.4: Lifecycle hooks + validation framework
Week 8  ████████  Phase 4.1–4.2: Extract and test drag logic
Week 9  ████████  Phase 4.3: Integration tests
Week 10 ████████  Phase 5: Expression engine hardening
Ongoing ░░░░░░░░  Phase 6: Documentation (after each phase)
```

## Expected Outcomes

| Metric | Current | After Phase 0 | After Phase 1 | After All |
|--------|---------|---------------|---------------|-----------|
| Coverage exclusions | 44 | 37 | 33 | <15 |
| Real coverage % | Unknown | Baselined | +15% | 80%+ real |
| Property systems | 2 | 2 | 1 | 1 |
| useAppData size | 1,859 lines | 1,859 lines | 1,859 lines | ~400 lines |
| Components with tests | 11/13 | 13/13 | 13/13 | 13/13 |
| Testability score | 6.5/10 | 7.5/10 | 8.5/10 | 9/10 |
| Undo/redo | No | No | No | Yes |
| Type safety | Partial (FC<any>) | Partial | Partial | Full generics |

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Property migration breaks component rendering | Migrate one at a time. Visual regression check after each. Keep old system until fully migrated. |
| useAppData decomposition introduces state bugs | Extract as pure functions first (no behavior change). Add tests before modifying hook. |
| Coverage thresholds fail after removing exclusions | Lower thresholds temporarily. Document real baseline. Raise as coverage improves. |
| Undo/redo increases memory usage | Cap undo stack depth. Use structural sharing (immutable data). Profile memory. |
| Canvas extraction breaks drag-and-drop | E2E tests protect against regression. Extract incrementally, verify E2E after each step. |

## Dependencies Between Phases

```
Phase 0 ──→ Phase 1 ──→ Phase 3.2 (factories need unified property system)
                    ──→ Phase 6.1 (docs need to reflect new system)
         ──→ Phase 2 ──→ Phase 2.4 (undo/redo needs pure functions)
                    ──→ Phase 4 (canvas extraction uses same patterns)
         ──→ Phase 5 (independent, can run in parallel with Phase 3 or 4)
```

Phase 0 is the prerequisite for everything. Phases 1 and 2 can overlap. Phases 3, 4, and 5 are mostly independent.
