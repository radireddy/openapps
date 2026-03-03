
# App Builder: Developer Guide

This document is for developers who want to contribute to, extend, or understand the internals of the App Builder framework.

## Table of Contents
1.  [Introduction](#1-introduction)
    *   [Project Goal](#project-goal)
    *   [Technology Stack](#technology-stack)
2.  [Development Setup](#2-development-setup)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Environment Variables](#environment-variables)
    *   [Running the App](#running-the-app)
3.  [Project Structure](#3-project-structure)
4.  [Architecture Deep Dive](#4-architecture-deep-dive)
    *   [Core Data Structures (`types.ts`)](#core-data-structures-typests)
    *   [State Management (`useAppData` hook)](#state-management-useappdata-hook)
    *   [Component Plugin System](#component-plugin-system)
    *   [Data Source Plugin System](#data-source-plugin-system)
    *   [Expression Engine](#expression-engine)
5.  [How-To Guides](#5-how-to-guides)
    *   [Adding a New Component](#adding-a-new-component)
    *   [Adding a New Data Source Provider](#adding-a-new-data-source-provider)
6.  [Contributing](#6-contributing)
    *   [Code Style](#code-style)
    *   [Pull Requests](#pull-requests)
    *   [Documentation Maintenance](#documentation-maintenance)

---

## 1. Introduction

### Project Goal

The goal of this project is to create a highly extensible, user-friendly, low-code/no-code application builder.

### Technology Stack

*   **Frontend Framework**: React
*   **Styling**: Tailwind CSS
*   **Language**: TypeScript

---

## 2. Development Setup

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd ProcodeAppDesigner
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the App

Start the development server:
```bash
npm run start
```
The application will be available at `http://localhost:3000` (or another port if 3000 is in use).

---

## 3. Project Structure

```
/
├── public/                 # Static assets
├── src/
│   ├── components/         # Core UI components and the component plugin system
│   │   ├── component-registry/ # The heart of the plugin system
│   │   │   ├── Button.tsx    # Example component plugin
│   │   │   ├── common.tsx    # Shared property panel components (PropInput, etc.)
│   │   │   └── registry.ts   # Central registry where all plugins are imported
│   │   ├── AIPromptBar.tsx # The AI input bar
│   │   ├── Canvas.tsx      # The main design surface
│   │   └── ...             # Other UI components like Editor, PropertiesPanel
│   ├── data-sources/       # Pluggable data source providers
│   │   ├── MockDbProvider.ts # Example in-memory provider
│   │   ├── provider.ts     # The DataSourceProvider interface definition
│   │   └── registry.ts     # Central registry for data source providers
│   ├── expressions/        # The expression evaluation engine
│   │   ├── engine.ts       # The `safeEval` function
│   │   └── useExpression.ts  # The React hook for live evaluation
│   ├── hooks/              # Custom React hooks
│   │   └── useAppData.ts   # The main state management hook for the editor
│   ├── services/           # Services for external interactions
│   │   ├── geminiService.ts# Logic for calling the Gemini API
│   │   └── storageService.ts # Abstraction for browser localStorage
│   ├── App.tsx             # Main app component, routes between Dashboard and Editor
│   ├── Dashboard.tsx       # The app management dashboard
│   ├── Editor.tsx          # The main editor component
│   └── types.ts            # Central TypeScript type definitions
├── .env                    # Environment variables (API Key)
└── package.json
```

---

## 4. Architecture Deep Dive

### Core Data Structures (`types.ts`)

`types.ts` is the single source of truth for the application's data model. The most important interface is `AppDefinition`, which represents an entire user-created application. It includes everything from components and their properties to data sources, variables, and themes.

### State Management (`useAppData` hook)

The `useAppData` hook is the stateful brain of the editor. It takes an `initialAppDefinition` and manages all subsequent state changes.

*   It wraps the `appDefinition` in a React state.
*   It exposes memoized callbacks for all actions that modify the state (`addComponent`, `updateComponent`, `deleteComponent`, etc.).
*   It automatically debounces changes and calls an `onSave` callback to persist the `appDefinition`.
*   It computes the `evaluationScope`, a critical object that provides the context for the expression engine. This scope includes the `dataStore`, app variables, data source contents, and theme, making them available within `{{ }}` expressions.

### Component Plugin System

The builder is designed to be easily extensible with new components. The system is centered in `src/components/component-registry/`.

A `ComponentPlugin` is an object with four key properties:

1.  **`type`**: A unique string from the `ComponentType` enum (e.g., `ComponentType.SLIDER`).
2.  **`paletteConfig`**: An object defining how the component appears in the component palette (label, icon, and default properties for a new instance).
3.  **`renderer`**: A React functional component that defines how the component looks and behaves on the canvas and in preview mode. It receives the component's state, `mode`, `evaluationScope`, and action handlers as props.
4.  **`properties`**: A React functional component that renders the UI for the Properties Panel when this component type is selected. It receives the component's state and an `updateProp` callback.
5.  **`isContainer` (optional)**: A boolean that, if `true`, allows this component to act as a parent for other components.

### Data Source Plugin System

Similar to components, data sources are also pluggable. The system is defined in `src/data-sources/`. A `DataSourceProvider` is an object that implements a standard interface for CRUD (Create, Read, Update, Delete) operations.

### Expression Engine

The expression engine allows users to write JavaScript logic without `eval()`.
*   **`safeEval` (`expressions/engine.ts`)**: This function uses the `Function` constructor and a `with` block to create a sandboxed environment. It executes a string expression within a given `scope` object, making the scope's keys available as local variables. It gracefully handles syntax and reference errors that occur while a user is typing.
*   **`useExpression` (`expressions/useExpression.ts`)**: This React hook takes a value and the `evaluationScope`. It determines if the value is a literal, a pure expression (`{{...}}`), or a template literal (`Hello {{name}}`) and uses `safeEval` to compute the final result. It is memoized to only re-evaluate when its dependencies change.

---

## 5. How-To Guides

### Adding a New Component

Let's say you want to add a `Rating` component (e.g., a 5-star rating input).

1.  **Update Types (`types.ts`)**:
    *   Add `RATING = 'RATING'` to the `ComponentType` enum.
    *   Create a `RatingProps` interface extending `BaseProps`. It might include `starCount: number` and `value: string` (for data binding).
    *   Add `RatingProps` to the `ComponentProps` union type.

2.  **Create the Renderer (`/component-registry/Rating.tsx`)**:
    *   Create `RatingRenderer.tsx`. This component will render the stars. It will receive `component.props`, `dataStore`, `onUpdateDataStore`, etc. It should handle clicks to change the rating.

3.  **Create the Properties Panel (`/component-registry/Rating.tsx`)**:
    *   Create `RatingProperties.tsx` in the same file.
    *   This component will render inputs for `starCount` and `value`. Use the shared `PropInput` component from `common.tsx`.

4.  **Create the Plugin Object (`/component-registry/Rating.tsx`)**:
    *   Define the `RatingPlugin: ComponentPlugin` object. Fill in the `type`, `paletteConfig` (with an SVG icon and default props), `renderer`, and `properties`.

5.  **Register the Plugin (`/component-registry/registry.ts`)**:
    *   Import your `RatingPlugin`.
    *   Add it to the `componentRegistry` object: `[ComponentType.RATING]: RatingPlugin`.

That's it! The new component will now appear in the palette and be fully integrated into the editor.

### Adding a New Data Source Provider

1.  **Define the Provider (`/data-sources/MyApiProvider.ts`)**:
    *   Create a new file for your provider.
    *   Implement the `DataSourceProvider` interface from `./provider.ts`.
    *   You will need to implement `getRecords`, `createRecord`, `updateRecord`, and `deleteRecord`. These methods will likely use `fetch` to call your external API.

2.  **Register the Provider (`/data-sources/registry.ts`)**:
    *   Import your new provider.
    *   Add it to the `dataSourceRegistry` object.

The new provider will now be available for users to select in the Data panel.

---

## 6. Contributing

### Code Style

This project uses Prettier for code formatting. Please run `npm run format` before committing your changes.

### Pull Requests

1.  Create a feature branch from `main`.
2.  Make your changes.
3.  Ensure your code is formatted and linted.
4.  Add a `DOCS_IMPACT` comment if your change affects user-facing functionality.
5.  Submit a pull request with a clear description of the changes.

### Documentation Maintenance

To ensure the documentation stays up-to-date, we use a simple comment-based system.

**If your change, bug fix, or enhancement affects how a user or developer interacts with the tool, you MUST add a comment at the top of your primary changed file(s).**

The format is:
```typescript
// DOCS_IMPACT: [A clear, concise description of the documentation that needs to be updated.]
```

**Examples:**

*   `// DOCS_IMPACT: User guide section on Button Actions needs to be updated to include the new 'navigate' action.`
*   `// DOCS_IMPACT: Developer guide on creating components needs to be updated. The 'renderer' prop now receives an additional 'theme' object.`
*   `// DOCS_IMPACT: No impact. This is an internal refactor of the expression engine.`

This comment will be a required part of the pull request review process.
