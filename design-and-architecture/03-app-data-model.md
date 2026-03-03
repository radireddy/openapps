
# Architecture Deep Dive: Application Data Model

This document describes the core data model of the App Builder, focusing on the `AppDefinition` interface. This single, serializable object is the source of truth for an entire user-created application.

## 1. The `AppDefinition` Interface

Everything that defines an application is contained within the `AppDefinition` interface, found in `src/types.ts`. This design ensures that an entire app can be easily stored, loaded, exported, and templated by handling just one object.

```typescript
// From: src/types.ts

export interface AppDefinition extends AppMetadata {
  // --- Structure ---
  pages: AppPage[];
  mainPageId: string;
  components: AppComponent[];

  // --- State ---
  dataStore: DataStore;
  variables: AppVariable[];

  // --- Connectivity ---
  dataSources: DataSourceInstance[];
  
  // --- Styling ---
  theme: Theme;
}
```

### Breakdown of Key Properties

-   **`AppMetadata`**: Inherits basic info like `id`, `name`, `createdAt`, and `lastModifiedAt`.
-   **`pages: AppPage[]`**: An array of objects, each with an `id` and `name`, defining the pages in the app.
-   **`mainPageId: string`**: The ID of the page that should be loaded first when the app is run or previewed.
-   **`components: AppComponent[]`**: A **flat list** of all UI components in the entire application. Each component has a `pageId` property to associate it with a page and an optional `parentId` to create nested layouts. Keeping this list flat simplifies component lookup and updates.
-   **`dataStore: DataStore`**: A `Record<string, any>` that holds the live state of data-bound UI components (like the value of an `Input` or the selected item of a `Table`).
-   **`variables: AppVariable[]`**: The definition of global app state variables created by the user in the "State" panel.
-   **`dataSources: DataSourceInstance[]`**: The configuration for all connected data sources. This does **not** contain the data itself, only the information needed to fetch it.
-   **`theme: Theme`**: An object containing all the styling information for the app, such as colors, fonts, and border radius.

## 2. The Data Model Lifecycle

The `AppDefinition` object flows through the application in a well-defined lifecycle.

### 1. Loading into the Editor

1.  The user selects an app from the `Dashboard`.
2.  The `Editor` component mounts and calls `storageService.getApp(appId)`.
3.  The `storageService` retrieves the serialized JSON string for that app from `localStorage`.
4.  It `JSON.parse`s the string into a complete `AppDefinition` object.
5.  This object is passed as the `initialAppDefinition` prop to the `useAppData` hook.
6.  `useAppData` initializes its internal state with this object.

### 2. Modification in the Editor

1.  A user performs an action, such as dragging a new component or changing a property in the Properties Panel.
2.  This action calls a modifier function exposed by `useAppData` (e.g., `addComponent`, `updateComponent`).
3.  The modifier function creates a **new** `AppDefinition` object with the updated data and sets it as the new state using `setAppDefinitionState`.
4.  This state change triggers a re-render of the editor, reflecting the user's action.

### 3. Saving (Persistence)

1.  The `useAppData` hook has a `useEffect` that listens for changes to the `appDefinition` state object.
2.  When a change is detected, it starts a 1-second debounce timer. This prevents saving on every single keystroke.
3.  Once the timer completes, the `onSave` callback is invoked with the latest `appDefinition`.
4.  The `Editor` component provides `storageService.saveApp` as this callback.
5.  `storageService.saveApp` updates the `lastModifiedAt` timestamp, `JSON.stringify`s the entire `AppDefinition` object, and saves it back to `localStorage`. It also updates the app's metadata in the central index.

### 4. Running in Preview Mode

1.  The user clicks the "Preview" button in the `Editor`.
2.  The `Editor` component switches its view and renders the `Preview` component.
3.  Crucially, it passes the **current, in-memory `appDefinition` state** from the `useAppData` hook to the `Preview` component.
4.  The `Preview` component uses this definition to render the app, starting with the `mainPageId`.
5.  The `Preview` component builds its own `evaluationScope` from the passed-down `appDefinition`, ensuring that expressions work correctly and that the preview is an exact, interactive reflection of the current state in the editor.

### Diagram: Data Model Lifecycle

```mermaid
graph TD
    subgraph Dashboard
        A[User selects App]
    end

    subgraph Editor
        B[1. Load App]
        C[storageService.getApp(id)]
        D[localStorage]
        E[useAppData Hook]
        F[Canvas & Properties]
        G[2. User Edits]
        H[3. Auto-Save]
        I[debounce(1s)]
        J[storageService.saveApp(appDef)]
        K[Preview Component]
    end

    A --> B
    B --> C
    C --> D
    D -- JSON string --> C
    C -- AppDefinition object --> E
    E -- State --> F
    F -- Action (e.g., updateProp) --> G
    G --> E
    E -- State Change --> H
    H --> I
    I --> J
    J -- JSON string --> D
    
    E -- Current AppDefinition --> K
```
