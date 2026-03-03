# Architecture Deep Dive: App Rendering & Preview Runtime

This document explains the core runtime mechanism of the App Builder: how it transforms a static JSON `AppDefinition` into a live, interactive web application in Preview mode.

## 1. Core Principle: Interpretation, Not Conversion

The runtime is a **live React application** that acts as an **interpreter** or a "player" for your `AppDefinition`. It dynamically renders your application's components and logic based on the JSON blueprint in real-time. This approach is what makes the application instantly interactive and reactive to state changes.

### Analogy: The Blueprint and the Construction Crew

-   **The `AppDefinition` JSON**: This is the architectural blueprint. It specifies every component, its properties, position, and relationships.
-   **The Runtime (`Preview.tsx` & `RenderedComponent.tsx`)**: This is the skilled construction crew. They read the blueprint, grab pre-fabricated parts (`ComponentPlugin` renderers) from their toolbox (`componentRegistry`), and assemble them into a live, functioning building. They also wire up all the dynamic logic.

## 2. The Rendering Pipeline: Step-by-Step

### Step 1: Entry Point and Context Creation (`Preview.tsx`)

1.  The `Editor` renders the `<Preview />` component, passing down the current `appDefinition` and all relevant state (`dataStore`, `variableState`, `actions`, etc.).
2.  The `Preview` component assembles the **`evaluationScope`**. This is a single, large JavaScript object that combines all possible sources of data into one context. This `scope` is the "world" that `{{...}}` expressions live in.

### Step 2: The Recursive Rendering Engine (`RenderedComponent.tsx`)

The `Preview` component kicks off the rendering process by rendering a `<RenderedComponent />` for each "root" component.

`RenderedComponent` is the workhorse of the runtime. For each `AppComponent` it is given, it performs the following steps:

1.  **Find the Component Renderer**: It looks at the component's `type` (e.g., `ComponentType.BUTTON`) and uses this key to look up the corresponding plugin in the `componentRegistry`.
    ```typescript
    // Simplified from RenderedComponent.tsx
    const plugin = componentRegistry[component.type];
    const ComponentRenderer = plugin.renderer;
    ```
2.  **Render the Component**: It renders the `ComponentRenderer`, passing down all necessary props (`component`, `mode: 'preview'`, the `evaluationScope`, and `actions`).
3.  **Handle Children**: It finds all components whose `parentId` matches its own `id` and recursively renders a **new** `<RenderedComponent />` for each one. This builds the nested layout.

### Step 3: Pluggable Property Rendering (The Strategy Pattern)

This is the most powerful part of the architecture. Instead of hard-coding the logic for evaluating `{{...}}` expressions, the system uses a pluggable strategy.

1.  **Property Renderer Registry**: A central `propertyRendererRegistry` maps keys (like `'javascript'` or `'markdown'`) to specific rendering hooks.

2.  **Dynamic Renderer Selection**: Inside a component renderer (e.g., `LabelRenderer`), it no longer calls a specific evaluation function directly. Instead, it inspects a special prop on the component (e.g., `textRenderer`) to decide *which* rendering strategy to use.

    ```typescript
    // Simplified from LabelRenderer.tsx
    const LabelRenderer: React.FC<...> = ({ component, evaluationScope }) => {
      const p = component.props;

      // 1. Dynamically select the renderer hook from the registry.
      const rendererHook = propertyRendererRegistry[p.textRenderer || 'javascript'];

      // 2. Call the selected hook to get the final content.
      const content = rendererHook(p.text, evaluationScope, '');
      
      // ... a "javascript" renderer will evaluate {{...}}
      // ... a "markdown" renderer will parse the text as Markdown
      // ... a "literal" renderer will just return the text as-is

      return <div>{content}</div>;
    };
    ```

This architecture means we can easily add new renderers in the future (e.g., for different template languages, date formatting, etc.) without changing any existing component renderers.

### Step 4: The Reactive Loop (Handling User Interaction)

When a user interacts with a component, it triggers a state change that flows back up and causes the UI to react.

1.  **User Action**: A user types into an `Input`.
2.  **State Update**: The `InputRenderer` calls `onUpdateDataStore`, which updates the central `dataStore` state in the `useAppData` hook.
3.  **Re-render**: The state update causes React to re-render. A **new `evaluationScope`** is created with the updated `dataStore`.
4.  **Property Re-evaluation**: Any component renderer whose property depends on that piece of data will now call its selected `rendererHook` again. The hook, being a memoized React hook, detects the change in the `evaluationScope` and re-computes its value, thus updating the UI.

## 3. Visualized Flow Diagram

This diagram shows the updated architecture with the pluggable property renderer.

```mermaid
graph TD
    A["Preview.tsx (Host)"] -- "appDefinition, state" --> B["Builds evaluationScope"];
    B -- "scope" --> C["Renders <RenderedComponent />"];

    subgraph "For each Component"
        C --> D{"RenderedComponent"};
        D --> E{"Looks up `ComponentRenderer` in componentRegistry"};
        E --> F["Renders specific renderer (e.g., LabelRenderer)"];
        
        F -- "props, scope" --> G{"Selects `PropertyRendererHook` from `propertyRendererRegistry`"};
        G -- "'javascript' or 'markdown'" --> H["propertyRendererRegistry"];
        H -- "useJavaScriptRenderer" --> G;
        
        G -- "value, scope" --> I["Calls selected hook (e.g., useJavaScriptRenderer)"];
        I -- "Computed Value" --> F;
        
        F --> J["React renders to DOM (HTML)"];
    end

    subgraph "Interaction Loop"
        K["User types in Input"] --> L["InputRenderer's onChange"];
        L --> M["Calls `updateDataStore()`"];
        M --> N["`useAppData` hook updates state"];
        N --> A;
    end
```