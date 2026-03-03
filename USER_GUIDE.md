
# App Builder: User Guide

Welcome to the App Builder! This guide will walk you through everything you need to know to create powerful, data-driven web applications with little to no code.

## Table of Contents

1.  [Introduction](#1-introduction)
    *   [What is the App Builder?](#what-is-the-app-builder)
    *   [Key Features](#key-features)
2.  [Getting Started: Your First App](#2-getting-started-your-first-app)
    *   [Creating a "Hello, World" App](#creating-a-hello-world-app)
3.  [The Editor Interface](#3-the-editor-interface)
    *   [Main Toolbar](#main-toolbar)
    *   [Left Panel (Explorer, Components, Data, etc.)](#left-panel)
    *   [Center Canvas](#center-canvas)
    *   [AI Prompt Bar](#ai-prompt-bar)
    *   [Right Panel (Properties)](#right-panel-properties)
4.  [Core Concepts](#4-core-concepts)
    *   [Components](#components)
    *   [Layout & Nesting](#layout--nesting)
    *   [Styling & Theming](#styling--theming)
5.  [State Management & Data Binding](#5-state-management--data-binding)
    *   [The Data Store](#the-data-store)
    *   [App State Variables](#app-state-variables)
6.  [Mastering Expressions (fx)](#6-mastering-expressions-fx)
    *   [What are Expressions?](#what-are-expressions)
    *   [Accessing Data in Expressions](#accessing-data-in-expressions)
    *   [Common Examples](#common-examples)
7.  [Actions & Events](#7-actions--events)
    *   [Configuring Button Actions](#configuring-button-actions)
8.  [Working with Data Sources](#8-working-with-data-sources)
    *   [Connecting to Data](#connecting-to-data)
    *   [Building a Master-Detail View](#building-a-master-detail-view)
9.  [Multi-Page Applications](#9-multi-page-applications)
10. [App Templates](#10-app-templates)

---

## 1. Introduction

### What is the App Builder?

The App Builder is a visual development environment that empowers you to design, build, and launch web applications with a drag-and-drop interface. You can create everything from simple forms to complex, data-driven dashboards, all while writing minimal code.

### Key Features

*   **Visual Drag-and-Drop Interface**: Build your UI by simply dragging components onto a canvas.
*   **AI-Powered Generation**: Describe the layout you want in plain English, and let Gemini build it for you.
*   **Component-Based Architecture**: Use a rich set of pre-built components like inputs, buttons, tables, and layout containers.
*   **Powerful Expression Engine**: Bind data, create conditional logic, and perform calculations using a simple `{{ }}` syntax.
*   **Data Connectivity**: Connect to data sources to build dynamic, real-world applications.
*   **Theming**: Customize the look and feel of your app with a flexible theming engine.
*   **Multi-Page Support**: Organize your app into multiple pages for better structure.
*   **Templates**: Save your apps as templates to reuse designs and accelerate development.

---

## 2. Getting Started: Your First App

Let's build a simple app that takes a user's name and displays a greeting.

### Creating a "Hello, World" App

1.  **Create the App**: From the Dashboard, click "Create New App". Give it a name like "Greeter App" and click "Create". You will be taken to the Editor.

2.  **Add an Input Component**:
    *   In the left panel, ensure the "Components" tab is selected.
    *   Find the **Input** component, and drag it onto the canvas. Position it near the top left.

3.  **Configure the Input**:
    *   With the Input selected, go to the **Properties Panel** on the right.
    *   Find the **Data Store Key** property and set it to `userName`. This is the variable where the input's text will be stored.

4.  **Add a Label Component**:
    *   Drag a **Label** component from the palette and place it below the input.

5.  **Bind the Label's Text**:
    *   Select the Label. In the Properties Panel, find the **Text** property.
    *   Click the `fx` button to enable expression mode.
    *   Enter the following expression: `{{ 'Hello, ' + (userName || 'stranger') + '!' }}`
        *   This expression reads the value from the `userName` variable in the Data Store and constructs a greeting string. If `userName` is empty, it defaults to "stranger".

6.  **Add a Button**:
    *   Drag a **Button** component onto the canvas.
    *   In its properties, change the **Text** to "Show Alert".

7.  **Configure the Button's Action**:
    *   In the Properties Panel, find the "On Click Action" section.
    *   Set **Action Type** to `Show Alert`.
    *   In the **Alert Message** field, enter the same expression as the label: `{{ 'Hello, ' + (userName || 'stranger') + '!' }}`

8.  **Preview Your App**:
    *   Click the "Preview" button in the top-right corner of the editor.
    *   Type your name into the input field. You'll see the label update in real-time.
    *   Click the button to see a browser alert with the same greeting.

Congratulations! You've just built your first interactive application.

---

## 3. The Editor Interface

 <!-- It's highly recommended to add an actual annotated screenshot -->

### Main Toolbar

Located at the top, it contains:
*   **Back to Apps**: Returns you to the Dashboard.
*   **App Name**: The name of the current application.
*   **Preview/Editor Toggle**: Switches between design mode and a live, interactive preview of your app.

### Left Panel

This is your primary resource panel, organized into tabs:
*   **Explorer**: A tree view of your entire application, including pages and the components within them. This is essential for managing multi-page apps and complex component hierarchies.
*   **Components**: A palette of all available UI components you can drag onto the canvas.
*   **Data**: Manage your application's data sources (e.g., databases, APIs).
*   **State**: Define and manage global App State variables.
*   **Theme**: Customize your app's visual style, including colors, fonts, and spacing.

### Center Canvas

This is your visual workspace. You can:
*   **Drag and Drop**: Add components from the palette.
*   **Select**: Click a component to view its properties.
*   **Move**: Click and drag a selected component to reposition it.
*   **Resize**: Drag the handle on the bottom-right of a selected component.
*   **Delete**: Select a component and press the `Delete` or `Backspace` key.

### AI Prompt Bar

Located just above the canvas, this is where you can leverage Gemini to build layouts. Simply describe what you want, and the AI will generate the components for you.

**Examples:**
*   `A user login form with fields for email and password, and a login button.`
*   `A user profile card with an image, name, and email address, arranged in a vertical stack.`
*   `A product details page with an image on the left and product name, description, and price on the right.`

### Right Panel (Properties)

When you select a component on the canvas, this panel displays all of its configurable properties. Properties are grouped into collapsible sections like Layout, Styling, State, and component-specific settings.

---

## 4. Core Concepts

### Components

Components are the fundamental building blocks of your application. Each component has a specific purpose and a set of properties to customize its appearance and behavior.

### Layout & Nesting

To create organized and responsive layouts, you must group components inside **container** components.

*   **Containers**: `Container` and `Form` are containers.
*   **Nesting**: When you drop a component *inside* a container, it becomes a **child**. Its position (`x`, `y`) is now **relative** to the top-left corner of its **parent** container.
*   **Best Practice**: Always group related elements. A form's labels, inputs, and button should all be inside a `Form` or `Container` component. This makes your app easier to manage and style.

### Styling & Theming

Your app's appearance is controlled by the **Theme**, which you can edit in the "Theme" tab. A theme consists of:
*   `colors`: `primary`, `background`, `text`, etc.
*   `font`: `family`
*   `border`: `width`, `style`
*   `radius`: `default`

**Crucially, you should always reference these theme values in your component properties using expressions.** This ensures consistency and makes it easy to restyle your entire app just by changing the theme.

*   **Correct**: Set a Button's `backgroundColor` to `{{theme.colors.primary}}`.
*   **Incorrect**: Setting it to a hardcoded value like `#4F46E5`.

---

## 5. State Management & Data Binding

### The Data Store

The `dataStore` is a central JSON object that holds the state for your UI components. Components can use the `value` property with expressions to bind to the `dataStore`, and any component referencing that value will re-render.

*   **Example**: An Input with `value` set to `{{formData.firstName}}`. As you type, the `dataStore` will look like: `{ "formData": { "firstName": "..." } }`.

### App State Variables

For state that isn't directly tied to a single input (e.g., a loading indicator, a counter), use **App State Variables**. You can create and set initial values for these in the "State" tab. You can then reference them in expressions and update them using Button actions.

*   **Example**: Create a boolean variable named `isLoading` with an initial value of `false`. You can disable a form's submit button using the expression `{{isLoading}}` in its `Disabled` property.

---

## 6. Mastering Expressions (fx)

Expressions are the most powerful feature of the App Builder, allowing you to create dynamic and responsive apps.

### What are Expressions?

An expression is a snippet of JavaScript surrounded by double curly braces: `{{ ... }}`. It allows you to access and manipulate data from anywhere in your app. Any property with an `fx` button next to it can accept an expression.

### Accessing Data in Expressions

| Data Source          | Syntax Example                          | Description                                         |
| -------------------- | --------------------------------------- | --------------------------------------------------- |
| **Data Store**       | `{{ myInputKey }}`                      | Accesses a value from an input or other bound component. |
| **App Variables**    | `{{ isLoading }}`                       | Accesses a variable created in the State panel.       |
| **Component Props**  | `{{ Input_123.value }}`                 | Accesses the live value of a specific component.    |
| **Table Selection**  | `{{ Table1.selectedRecord.name }}`      | Accesses the selected row of a Table component.     |
| **Data Sources**     | `{{ myUsersDb }}`                       | Accesses the entire array of records from a data source. |
| **Theme**            | `{{ theme.colors.primary }}`            | Accesses the app's theme properties.                |

### Common Examples

*   **Displaying Text**: `{{ 'Welcome, ' + userInput + '!' }}`
*   **Conditional Visibility (Hidden property)**: `{{ !Table1.selectedRecord }}` (Hides a component if no table row is selected).
*   **Conditional Disabling (Disabled property)**: `{{ emailInput === '' || passwordInput === '' }}` (Disables a button if fields are empty).
*   **Calculations**: `{{ subtotal * 0.07 }}`
*   **Styling**: Setting a label's `color` property to `{{ score > 50 ? 'green' : 'red' }}`.

---

## 7. Actions & Events

You can trigger actions when a user interacts with certain components, most commonly the **Button**.

### Configuring Button Actions

| Action Type        | Description                                                                                              | Example Properties                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Show Alert`       | Displays a standard browser alert message.                                                               | **Alert Message**: `{{ 'Record ' + Table1.selectedRecord.name + ' saved!' }}`                                    |
| `Update Variable`  | Changes the value of an App State variable.                                                              | **Variable Name**: `isLoading`, **New Value**: `true`                                                          |
| `Create Record`    | Adds a new record to a specified data source.                                                            | **Data Source**: `usersDb`, **New Record**: `{{ { name: nameInput.value, email: emailInput.value } }}`             |
| `Update Record`    | Updates the currently selected record in the `dataStore`.                                                | **Data Source**: `usersDb` (The updates come from inputs bound to `selectedRecord.name`, etc.) |
| `Delete Record`    | Deletes the currently selected record from a data source.                                                | **Data Source**: `usersDb`                                                                                       |
| `Execute Code`     | Runs a block of JavaScript code.                                                                         | **Code to Execute**: `{{ (() => { console.log('Executing code'); actions.updateVariable('counter', counter + 1); })() }}` |

---

## 8. Working with Data Sources

### Connecting to Data

1.  Go to the **Data** tab in the left panel.
2.  Click the `+` icon to add a new source.
3.  Choose a provider (e.g., Mock DB, Local Storage) and give your instance a unique name (e.g., `myUsers`).
4.  This data is now available in expressions using the name you provided (e.g., `{{ myUsers }}`).

### Building a Master-Detail View

This is a classic pattern where you have a list (like a table) and a form to edit the selected item.

1.  **Add a Table**: Drag a `Table` component onto the canvas.
    *   In its properties, set **Data Source** to your data source name (e.g., `myUsers`).
    *   Set **Columns** to define what data to show, e.g., `Name:name,Email:email`.
    *   Set **Selected Record Key** to `selectedRecord`. This is crucial.

2.  **Add a Form**: Drag a `Form` or `Container` component next to the table.

3.  **Add Inputs**: Place `Input` components inside the form for each field you want to edit (e.g., one for name, one for email).

4.  **Bind the Inputs**:
    *   Select the "name" input. Set its **Data Store Key** to `selectedRecord.name`.
    *   Select the "email" input. Set its **Data Store Key** to `selectedRecord.email`.

5.  **Add an "Update" Button**: Place a `Button` inside the form.
    *   Set its **Action Type** to `Update Record`.
    *   Set its **Data Source** to `myUsers`.
    *   Set its **Disabled** property to `{{ !Table1.selectedRecord }}` so it's only enabled when a row is selected.

Now, when you run the app, clicking a row in the table will populate the form. Editing the form fields and clicking "Update" will save the changes back to the data source.

---

## 9. Multi-Page Applications

Use the **Explorer** panel to manage your app's pages.
*   The tree shows the App, its Pages, and the Components on each page.
*   Click a page name to switch the canvas to that page.
*   The `mainPageId` in the app definition (not yet editable in UI) determines which page loads first in Preview mode.

---

## 10. App Templates

Templates allow you to save and reuse entire application designs.

*   **Save as Template**: On the Dashboard, use the menu on any app card to "Save as Template". You'll be asked for a name, description, and an optional thumbnail.
*   **Create from Template**: On the Dashboard, use the dropdown on the "Create New App" button. This will open a gallery of your saved templates. Selecting one will create a brand new, independent copy of that app for you to build upon.
