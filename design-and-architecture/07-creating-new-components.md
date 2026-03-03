# Creating a New Component

This guide walks you through creating a new component for the App Builder.

## Step-by-Step Process

### Step 1: Define Component Type

Add your component type to the `ComponentType` enum in `types.ts`:

```typescript
// In types.ts

export enum ComponentType {
  LABEL = 'LABEL',
  INPUT = 'INPUT',
  BUTTON = 'BUTTON',
  // ... existing types
  YOUR_COMPONENT = 'YOUR_COMPONENT', // NEW: Add your component type
}
```

### Step 2: Define Component Props Interface

Create a props interface that extends `BaseProps` (and optionally `BorderProps`):

```typescript
// In types.ts

export interface YourComponentProps extends BaseProps, BorderProps {
  // Component-specific properties
  label: string;
  value?: string;
  placeholder?: string;
  // ... other properties
}
```

Add it to the `ComponentProps` union type:

```typescript
export type ComponentProps =
  LabelProps |
  InputProps |
  // ... existing types
  YourComponentProps; // NEW: Add your component
```

### Step 3: Create Component File

Create a new file: `src/components/component-registry/YourComponent.tsx`

### Step 4: Create the Renderer

The renderer is what displays the component on the canvas:

```typescript
import React from 'react';
import { ComponentType, YourComponentProps, ComponentPlugin } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const YourComponentRenderer: React.FC<{
  component: { props: YourComponentProps };
  mode: 'edit' | 'preview';
  evaluationScope: Record<string, any>;
  // Add other props as needed (dataStore, onUpdateDataStore, actions, etc.)
}> = ({ component, mode, evaluationScope }) => {
  const p = component.props;

  // Evaluate dynamic properties
  const label = useJavaScriptRenderer(p.label, evaluationScope, '');
  const value = useJavaScriptRenderer(p.value, evaluationScope, '');

  // Build styles
  const style: React.CSSProperties = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: useJavaScriptRenderer(p.opacity, evaluationScope, 1),
    boxShadow: useJavaScriptRenderer(p.boxShadow, evaluationScope, ''),
  };

  return (
    <div style={style} className="w-full h-full">
      <label>{label}</label>
      <input value={value} placeholder={p.placeholder} />
    </div>
  );
};
```

### Step 5: Create the Plugin

Define the component plugin. The `properties` field returns `() => null` because property editing is handled by the schema-driven `PropertiesPanelCore`.

```typescript
export const YourComponentPlugin: ComponentPlugin = {
  type: ComponentType.YOUR_COMPONENT,
  paletteConfig: {
    label: 'Your Component',
    icon: React.createElement('svg', {
      style: iconStyle,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    },
      React.createElement('path', { d: "M12 2L2 7v10l10 5 10-5V7l-10-5z" })
    ),
    defaultProps: {
      ...commonStylingProps,
      label: 'New Component',
      value: '',
      placeholder: 'Enter value...',
      width: 200,
      height: 40,
    },
  },
  renderer: YourComponentRenderer,
  properties: () => null,
};
```

### Step 6: Create a Property Schema

Create a new file: `src/components/properties/schemas/yourComponent.ts`

The schema defines all editable properties for your component. Use `createPropertySchema()` to automatically include common properties (layout, state, styling, border).

```typescript
import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

const yourComponentProperties: PropertyMetadata[] = [
  {
    id: 'label',
    label: 'Label',
    type: 'string',
    defaultValue: 'New Component',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.YOUR_COMPONENT],
    tooltip: 'Display label',
  },
  {
    id: 'value',
    label: 'Value',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.YOUR_COMPONENT],
    tooltip: 'Current value (supports expressions)',
  },
  {
    id: 'placeholder',
    label: 'Placeholder',
    type: 'string',
    defaultValue: 'Enter value...',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.YOUR_COMPONENT],
    tooltip: 'Placeholder text',
  },
];

export const yourComponentSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.YOUR_COMPONENT,
  yourComponentProperties,
  commonTabs,
  commonGroups
);
```

### Step 7: Register the Schema

In `src/components/properties/schemas/index.ts`, import and register your schema:

```typescript
import { yourComponentSchema } from './yourComponent';

export function registerAllPropertySchemas(): void {
  // ... existing registrations
  registerPropertySchema(yourComponentSchema);
}
```

### Step 8: Register the Component Plugin

Add your component to the registry in `src/components/component-registry/registry.ts`:

```typescript
import { YourComponentPlugin } from './YourComponent';

export const componentRegistry: Record<ComponentType, ComponentPlugin> = {
  // ... existing components
  [ComponentType.YOUR_COMPONENT]: YourComponentPlugin,
};
```

## Property Schema Reference

### PropertyMetadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Property key (matches the props field name) |
| `label` | `string` | Yes | Display label in the properties panel |
| `type` | `PropertyType` | Yes | One of: `string`, `number`, `boolean`, `color`, `dropdown`, `expression`, `date`, `time`, `json`, `code`, `composite` |
| `defaultValue` | `any` | No | Default value for the property |
| `supportsExpression` | `boolean` | No | Whether the property supports `{{ }}` expressions |
| `group` | `string` | Yes | Group name (e.g., `'Basic'`, `'Styling'`, `'Events'`) |
| `tab` | `string` | Yes | Tab name (e.g., `'General'`, `'Styles'`, `'Events'`) |
| `tabOrder` | `number` | Yes | Order of the tab (lower = first) |
| `groupOrder` | `number` | Yes | Order of the group within its tab |
| `propertyOrder` | `number` | Yes | Order of the property within its group |
| `applicableTo` | `ComponentType[] \| 'all'` | Yes | Which components this property applies to |
| `tooltip` | `string` | No | Tooltip text |
| `placeholder` | `string` | No | Input placeholder text |
| `options` | `DropdownOption[]` | No | Options for dropdown properties |
| `visibleIf` | `(props, scope) => boolean` | No | Conditional visibility function |

### Conditional Properties

Properties that only show under certain conditions:

```typescript
{
  id: 'actionAlertMessage',
  label: 'Alert Message',
  type: 'expression',
  visibleIf: (props) => (props as any).actionType === 'alert',
  // ...
}
```

### Container Components

If your component can contain other components, set `isContainer: true`:

```typescript
export const YourComponentPlugin: ComponentPlugin = {
  // ... other config
  isContainer: true,
};
```

Then in your renderer, accept and render children:

```typescript
const YourComponentRenderer: React.FC<{
  component: { props: YourComponentProps };
  children?: React.ReactNode;
}> = ({ component, children }) => {
  return (
    <div>
      {children}
    </div>
  );
};
```

## Checklist

### Core Implementation
- [ ] Add `ComponentType` enum value in `src/types.ts`
- [ ] Create props interface extending `BaseProps` in `src/types.ts`
- [ ] Add props to `ComponentProps` union type
- [ ] Create component file with renderer in `src/components/component-registry/`
- [ ] Set `properties: () => null` in the plugin
- [ ] Use theme tokens for color/shadow/spacing defaults (e.g., `{{theme.colors.text}}`)
- [ ] Create property schema in `src/components/properties/schemas/`
- [ ] Register schema in `src/components/properties/schemas/index.ts`
- [ ] Register component plugin in `src/components/component-registry/registry.ts`

### AI Generation
- [ ] Add component to the component catalog in `src/services/ai/systemInstructions.ts`
- [ ] Add component type to `componentEnum` in `src/services/ai/schemas.ts`
- [ ] Add component-specific properties to `componentPropertiesSchema` in `src/services/ai/schemas.ts`
- [ ] Add post-processing rules in `src/services/ai/templateGenerationService.ts` (if needed)

### Testing
- [ ] Write unit tests in `src/components/component-registry/<Component>.test.tsx`
- [ ] Add component to capability matrix in `test-utils/capability-matrix.ts` (if applicable)
- [ ] Write E2E tests in `e2e/` (see [08-testing-guide.md](./08-testing-guide.md))

### Documentation
- [ ] Add `// DOCS_IMPACT:` comment at top of changed files
- [ ] Update `USER_GUIDE.md` with component description and usage
- [ ] Update `DEVELOPER_GUIDE.md` if architectural patterns are affected

## Best Practices

1. **Use `createPropertySchema()`**: It automatically merges common properties (layout, state, styling) with your component-specific ones
2. **Use Conditional Visibility**: Hide properties that don't apply to the current state via `visibleIf`
3. **Provide Defaults**: Always provide sensible default values in `defaultProps` and schema `defaultValue`
4. **Type Safety**: Use TypeScript properly--extend `BaseProps` and add to `ComponentProps`
5. **Expression Support**: Set `supportsExpression: true` and `type: 'expression'` for properties that should support dynamic values
6. **Icon Design**: Create a clear, recognizable SVG icon for the palette
7. **Theme Integration**: Use theme tokens for color, shadow, spacing, and typography defaults — never hardcode colors
8. **AI Awareness**: Always update the AI system instructions and schema so AI-generated layouts can use your component

## Related Guides

- [08-testing-guide.md](./08-testing-guide.md) — Testing patterns and utilities
- [09-enhancing-existing-components.md](./09-enhancing-existing-components.md) — Adding properties to existing components (includes the same cross-cutting checklist for AI, theming, testing, and docs)
