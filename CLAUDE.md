# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a low-code/no-code application builder with AI capabilities. Users can visually design applications by dragging components onto a canvas, configure them through a properties panel, and generate layouts using natural language prompts. The entire application state is represented by a single `AppDefinition` object that can be persisted, exported, and transformed into a standalone React project.

## Development Commands

### Running the Application
```bash
npm install              # Install dependencies
npm run start            # Start dev server on http://localhost:3000
npm run build            # Build for production (TypeScript compilation + Vite build)
npm run preview          # Preview production build
```

### Testing
```bash
npm test                 # Run all Jest unit tests
npm run test:coverage    # Run tests with coverage report
npm run test:drag        # Run drag-and-drop specific tests
npm run test:e2e         # Run Playwright end-to-end tests
npm run test:e2e-ui      # Run Playwright tests with UI
npm run test:e2e-report  # View last Playwright test report
```

**Coverage Requirements**: Coverage thresholds are configured in `jest.config.js` (currently 50% statements/lines, 40% functions/branches). Many implementation files are excluded from coverage measurement pending dedicated test creation. See `jest.config.js` for details.

**Running Specific Tests**:
- Use `--testPathPattern` to target specific test files: `jest --testPathPattern='ComponentName.test'`
- Use `--grep` for Playwright: `playwright test --grep "INPUT:"`

## Architecture

### Core Concepts

1. **Single Source of Truth**: The entire application is defined by an `AppDefinition` object (see `types.ts`). This includes:
   - `components[]`: Flat list of all UI components across pages
   - `dataStore`: Runtime state/variables
   - `variables[]`: Global state variable definitions
   - `theme`: Visual styling tokens
   - `pages[]`: Page definitions
   - `integration`: UiPath SDK settings

2. **Component Plugin System**: All UI components are registered plugins in `components/component-registry/registry.ts`. Each plugin implements the `ComponentPlugin` interface:
   - `type`: Unique ComponentType enum value
   - `paletteConfig`: How it appears in the component palette
   - `renderer`: React component for canvas/preview rendering
   - `properties`: Returns `() => null` (property editing is handled by metadata-driven `PropertiesPanelCore`)
   - `isContainer`: Optional boolean for container components

3. **Expression Engine**: Dynamic property evaluation using `safeEval` (in `expressions/engine.ts`)
   - Expressions wrapped in `{{ }}` are evaluated at runtime (e.g., `{{userName}}`, `{{count + 1}}`)
   - Template literals supported: `"Hello {{userName}}"`
   - Sandboxed execution - blocks access to window, document, etc.
   - Dependencies tracked via `parseDependencies()`

4. **State Management**: The `useAppData` hook (`hooks/useAppData.ts`) is the central state manager:
   - Manages the entire `AppDefinition` state
   - Delegates logic to pure function modules in `hooks/state/` (helpers, componentOperations, containerOperations, alignmentOperations, variableOperations, evaluationScope)
   - Provides CRUD operations for components, variables, pages
   - Computes `evaluationScope` for expression evaluation
   - Auto-saves changes with 1-second debounce
   - Exports operations: `addComponent`, `updateComponent`, `deleteComponent`, `updateDataStore`, etc.

### Project Structure

```
/
├── src/                        # All source code lives here
│   ├── App.tsx                 # Root app component (routing)
│   ├── Editor.tsx              # Main editor component
│   ├── Dashboard.tsx           # App management dashboard
│   ├── types.ts                # Central type definitions (AppDefinition, etc.)
│   ├── constants.ts            # Typography, styling constants
│   ├── storageService.ts       # localStorage abstraction
│   ├── database.ts             # Database utilities
│   ├── index.tsx               # Entry point
│   ├── components/             # UI components and component plugin system
│   │   ├── component-registry/ # Component plugins (Button, Input, etc.)
│   │   │   ├── registry.ts     # Central plugin registry
│   │   │   └── *.tsx           # Individual component plugins
│   │   ├── properties/         # Property schema system (metadata-driven)
│   │   │   ├── metadata.ts     # PropertyMetadata, PropertyType, etc.
│   │   │   ├── registry.ts     # propertyRegistry, commonProperties, createPropertySchema()
│   │   │   └── schemas/        # One schema file per component (13 total)
│   │   ├── PropertiesPanelCore.tsx # Renders properties from schema metadata
│   │   ├── Canvas.tsx          # Main design surface
│   │   ├── PropertiesPanel.tsx # Property editor wrapper
│   │   └── Preview.tsx         # Runtime preview
│   ├── hooks/
│   │   ├── useAppData.ts       # Core state management hook
│   │   └── state/              # Decomposed pure function modules
│   │       ├── helpers.ts
│   │       ├── componentOperations.ts
│   │       ├── containerOperations.ts
│   │       ├── alignmentOperations.ts
│   │       ├── variableOperations.ts
│   │       └── evaluationScope.ts
│   ├── expressions/
│   │   └── engine.ts           # Expression evaluation (safeEval)
│   ├── services/
│   │   ├── geminiService.ts    # AI layout generation
│   │   └── project-exporter/   # Export to standalone React project
│   ├── property-renderers/     # Custom property rendering (JS, markdown)
│   └── utils/                  # Shared utilities
├── e2e/                        # Playwright end-to-end tests
├── design-and-architecture/    # Detailed architecture docs
└── __mocks__/                  # Jest root mocks
```

**Path Alias**: `@/` maps to `src/` consistently across Vite, TypeScript, and Jest. Use `@/types` not `./types` or `../types`.

## Adding New Components

1. Add enum value to `ComponentType` in `src/types.ts`
2. Create props interface extending `BaseProps` in `src/types.ts`
3. Add props to `ComponentProps` union type
4. Create component file in `src/components/component-registry/ComponentName.tsx`:
   - `ComponentNameRenderer`: Canvas/preview rendering logic
   - `ComponentNamePlugin`: Plugin object with `properties: () => null`
5. Create property schema in `src/components/properties/schemas/componentName.ts`
6. Register schema in `src/components/properties/schemas/index.ts`
7. Register plugin in `src/components/component-registry/registry.ts`
8. Update AI: Add to component catalog in `src/services/ai/systemInstructions.ts` and schema in `src/services/ai/schemas.ts`
9. Add unit tests, capability matrix entry, and E2E tests
10. Update documentation (`USER_GUIDE.md`, `DEVELOPER_GUIDE.md`)

See `design-and-architecture/07-creating-new-components.md` for detailed instructions.

## Enhancing Existing Components

When adding new properties to an existing component, the full process includes:

1. Update props interface in `src/types.ts` (new props must be optional)
2. Update property schema in `src/components/properties/schemas/<component>.ts`
3. Update `defaultProps` in component plugin (use theme tokens for colors/shadows/spacing)
4. Update renderer to use new properties
5. Update AI system instructions and schema (`src/services/ai/systemInstructions.ts`, `schemas.ts`)
6. Add AI post-processing rules if needed (`src/services/ai/templateGenerationService.ts`)
7. Write/expand unit tests, capability matrix, and E2E tests
8. Update documentation

See `design-and-architecture/09-enhancing-existing-components.md` for the complete guide and checklist.

## Important Patterns

### Data Binding
Components can bind to the data store using expressions. The `evaluationScope` includes:
- `dataStore`: Direct access to stored values
- `variables`: App variable state
- `theme`: Theme tokens (colors, spacing, etc.)
- `actions`: CRUD action handlers

### Property Renderers
Properties can have custom renderers (see `src/property-renderers/`):
- `javascript`: Evaluates JS expressions at runtime
- `markdown`: Renders markdown content
- `literal`: No processing (default)

### Testing Patterns
- Component tests in `src/components/component-registry/__tests__/`
- Use `@testing-library/react` and `@testing-library/user-event`
- Mock data helpers available in `src/components/component-registry/__tests__/test-utils/`
- E2E tests in `e2e/` using Playwright
- **Naming**: Use descriptive names for test files and test cases — avoid generic names like `new-features.spec.ts` or `Phase 1 Tests`. File names should describe the domain (e.g., `editor-interactions.spec.ts`), and test names should describe the specific behavior (e.g., `Ctrl+Z undoes component addition and Ctrl+Shift+Z redoes it`)
- Delete all screenshots taken during testing once done. 

### AI Integration
The Gemini service (`src/services/geminiService.ts`) generates layouts from natural language:
- Uses structured JSON output with schema validation
- Post-processes to add defaults and assign page IDs
- Returns complete `AppDefinition` object

### Project Export
The `project-exporter` service generates standalone React applications:
- `AppGenerator`: Creates package.json, main files
- `PageGenerator`: Creates page components
- `expressionTranslator`: Converts `{{ }}` expressions to React state

## Environment Variables

The application uses `GEMINI_API_KEY` for AI features (configured in vite.config.ts):
- Set in `.env` file (not committed to repo)
- Accessed via `process.env.GEMINI_API_KEY`

UiPath SDK integration can be enabled via `ENABLE_UIPATH_SDK` flag.

## Documentation

Extensive architecture documentation in `design-and-architecture/`:
- `00-architecture-overview.md`: System design and data flow
- `01-expression-engine.md`: Expression evaluation details
- `02-data-sources.md`: Data source plugin architecture
- `04-component-architecture.md`: Component plugin system
- `07-creating-new-components.md`: Step-by-step component creation
- `08-testing-guide.md`: Testing patterns, utilities, and coverage
- `09-enhancing-existing-components.md`: Adding properties to existing components (AI, theming, testing checklist)
- `PROPERTIES_ARCHITECTURE_SUMMARY.md`: Metadata-driven property system

Also see `DEVELOPER_GUIDE.md` and `USER_GUIDE.md` in root.

## Contributing Guidelines

When making changes that affect user-facing functionality or developer workflows:
- Add a `// DOCS_IMPACT:` comment at the top of changed files describing what documentation needs updating
- Example: `// DOCS_IMPACT: User guide section on Button Actions needs to include new 'navigate' action`

## Key Files to Reference

- `src/types.ts`: All TypeScript interfaces (AppDefinition, ComponentProps, etc.)
- `src/hooks/useAppData.ts`: Central state management logic
- `src/hooks/state/`: Decomposed state operation modules
- `src/expressions/engine.ts`: Expression evaluation and sandboxing
- `src/components/component-registry/registry.ts`: Component plugin registry
- `src/components/properties/registry.ts`: Property schema registry and common definitions
- `src/components/properties/schemas/`: Property schemas for all 13 components
- `src/storageService.ts`: Data persistence layer
