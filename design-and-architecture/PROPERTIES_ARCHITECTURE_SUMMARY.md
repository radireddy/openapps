# Properties Panel Architecture - Summary

## Overview

The properties panel uses a unified, metadata-driven architecture for managing component properties. All 13 components use schema-driven property definitions registered via `src/components/properties/schemas/`. The `PropertiesPanelCore` component reads these schemas at runtime and renders the appropriate UI -- no per-component properties JSX is needed.

## Architecture

### How It Works

1. Each component defines a **property schema** in `src/components/properties/schemas/<component>.ts`. A schema is a `ComponentPropertySchema` object containing an array of `PropertyMetadata` entries, organized into tabs and groups.
2. Schemas are registered at startup via `registerAllPropertySchemas()` (in `src/components/properties/schemas/index.ts`), which calls `registerPropertySchema()` for each schema.
3. When a component is selected in the editor, `PropertiesPanelCore` looks up the schema from the `propertyRegistry` by `ComponentType` and renders tabs, groups, and individual property editors automatically.
4. Component plugins set `properties: () => null` since the metadata system handles everything.

### Key Files

```
src/components/properties/
  metadata.ts          # Type definitions: PropertyMetadata, PropertyType, ComponentPropertySchema, etc.
  registry.ts          # propertyRegistry object, commonProperties, commonTabs, commonGroups, createPropertySchema()
  schemas/
    index.ts           # registerAllPropertySchemas() -- registers all 13 component schemas
    button.ts          # Button-specific properties and schema
    input.ts           # Input-specific properties and schema
    ...                # One file per component (13 total)
    shared-events-renderer.tsx   # Shared custom renderer for event properties
    input-events-renderer.tsx    # Input-specific custom event renderer

src/components/PropertiesPanelCore.tsx   # Renders properties UI from schema metadata
```

### Schema Structure

A property schema consists of **tabs**, **groups**, and **properties**:

```typescript
import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

const buttonProperties: PropertyMetadata[] = [
  {
    id: 'text',
    label: 'Text',
    type: 'expression',
    defaultValue: 'Click Me',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.BUTTON],
    tooltip: 'Button text content',
    placeholder: 'e.g. Submit',
  },
  // ... more properties
];

const buttonGroups: PropertyGroup[] = [
  { id: 'Events', label: 'Events', tab: 'Events', collapsible: true, defaultCollapsed: false },
];

export const buttonSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.BUTTON,
  buttonProperties,
  commonTabs,
  [...commonGroups, ...buttonGroups]
);
```

### Property Types

The `PropertyType` union supports: `string`, `number`, `boolean`, `color`, `dropdown`, `date`, `time`, `json`, `code`, `expression`, `composite`.

### Common Properties

`commonProperties` in `registry.ts` provides reusable definitions for layout (`x`, `y`, `width`, `height`), state (`disabled`, `hidden`), and styling properties (`opacity`, `boxShadow`, border properties). The `createPropertySchema()` factory merges component-specific properties with these common ones automatically.

### Conditional Visibility

Properties can be conditionally shown or hidden using the `visibleIf` field:

```typescript
{
  id: 'actionAlertMessage',
  label: 'Alert Message',
  type: 'expression',
  visibleIf: (props) => (props as any).actionType === 'alert',
  // ...
}
```

## Features

- **Reusability**: Common properties defined once and shared across all components via `commonProperties`
- **Maintainability**: Adding or changing a property only requires editing the schema file
- **Extensibility**: New components just need a schema file and registration
- **Type Safety**: Full TypeScript types for property metadata, schemas, and registries
- **Conditional Visibility**: Properties can be shown/hidden based on other property values
- **Custom Renderers**: Properties can use custom React renderers for specialized UI (e.g., container layout icons)
- **Tabbed Layout**: Properties are organized into tabs (General, Styles, Events) with collapsible groups

## Registered Components

All 13 components use the metadata-driven system:

| Component   | Schema File        |
|-------------|--------------------|
| Container   | `container.ts`     |
| Divider     | `divider.ts`       |
| Input       | `input.ts`         |
| Label       | `label.ts`         |
| Button      | `button.ts`        |
| Textarea    | `textarea.ts`      |
| Select      | `select.ts`        |
| Checkbox    | `checkbox.ts`      |
| RadioGroup  | `radioGroup.ts`    |
| Switch      | `switch.ts`        |
| Image       | `image.ts`         |
| Table       | `table.ts`         |
| List        | `list.ts`          |

## Design Principles

1. **Single Responsibility**: Each schema file defines one component's properties
2. **Open/Closed**: New components extend the system without modifying core rendering
3. **DRY**: Common properties defined once in `registry.ts`
4. **Separation of Concerns**: Property definitions (schemas) are separate from rendering (PropertiesPanelCore)
5. **Composition over Inheritance**: Schemas compose common properties with component-specific ones

## Documentation

- Full metadata types: `src/components/properties/metadata.ts`
- Registry and common definitions: `src/components/properties/registry.ts`
- Component architecture: `design-and-architecture/04-component-architecture.md`
- Creating new components: `design-and-architecture/07-creating-new-components.md`
