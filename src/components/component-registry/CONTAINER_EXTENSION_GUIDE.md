# Container Component Extension Guide

The Container component has been refactored to serve as a base for all grouping components. Any new component that extends Container will automatically inherit all Container features.

## What You Get Automatically

When you create a component that extends Container, you automatically get:

1. **All Container Properties**:
   - Basic: hidden, disabled, tooltip
   - Layout: x, y, width, height, minWidth, maxWidth, minHeight, maxHeight
   - Advanced: zIndex, className
   - Styles: backgroundColor, backgroundImage, padding, borders (all border properties)
   - Events: onClick

2. **Container Rendering Behavior**:
   - Absolute positioning container (position: relative)
   - Background color/image support
   - Border styling (all border properties)
   - Padding support
   - Min/max width/height
   - Z-index support
   - onClick event handling

3. **Container Drag-and-Drop Behavior**:
   - Children use absolute positioning within container
   - Padding-aware positioning
   - Complete containment checks
   - Automatic reparenting logic

4. **Container Property Panel Structure**:
   - General tab (Basic, Layout, Advanced groups)
   - Styles tab (Color & Typography, Spacing, Borders groups)
   - Events tab (Events group)

## How to Create a New Container-Based Component

### Step 1: Define the Component Type

Add your new component type to `types.ts`:

```typescript
export enum ComponentType {
  // ... existing types
  MY_CONTAINER = 'MY_CONTAINER',
}

export interface MyContainerProps extends ContainerProps {
  // Add any custom properties here
  myCustomProp?: string;
}
```

### Step 2: Create the Component Plugin

Create a new file `components/component-registry/MyContainer.tsx`:

```typescript
import React from 'react';
import { ComponentType, MyContainerProps } from '../../types';
import { createContainerComponent } from './container-factory';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

export const MyContainerPlugin = createContainerComponent({
  type: ComponentType.MY_CONTAINER,
  label: 'My Container',
  icon: React.createElement('svg', { 
    style: iconStyle, 
    viewBox: "0 0 24 24", 
    fill: "none", 
    xmlns: "http://www.w3.org/2000/svg" 
  }, 
    // Your icon elements here
  ),
  defaultProps: {
    width: 500,
    height: 400,
    // All container props are available
    backgroundColor: '{{theme.colors.surface}}',
    padding: '{{theme.spacing.md}}',
  },
  // Optional: Custom renderer options
  rendererOptions: {
    styleExtensions: {
      // Add custom styles that will be merged with base container styles
      cursor: 'pointer',
    },
    onClick: (props, actions, evaluationScope) => {
      // Custom onClick logic (called in addition to base onClick)
      console.log('MyContainer clicked!');
    },
  },
});
```

### Step 3: Create the Property Schema

Create `components/properties/schemas/my-container.ts`:

```typescript
import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata } from '../metadata';
import { createBaseContainerSchema } from './base-container';

// Define any custom properties
const customProperties: PropertyMetadata[] = [
  {
    id: 'myCustomProp',
    label: 'My Custom Property',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 3,
    applicableTo: [ComponentType.MY_CONTAINER],
    tooltip: 'My custom property description',
  },
];

// Create schema with base container properties + custom properties
export const myContainerSchema: ComponentPropertySchema = createBaseContainerSchema(
  ComponentType.MY_CONTAINER,
  customProperties // Custom properties are automatically merged with base properties
);
```

### Step 4: Register the Component

1. **Register the plugin** in `components/component-registry/registry.ts`:

```typescript
import { MyContainerPlugin } from './MyContainer';

export const componentRegistry: Record<ComponentType, ComponentPlugin> = {
  // ... existing components
  [ComponentType.MY_CONTAINER]: MyContainerPlugin,
};
```

2. **Register the schema** in `components/properties/schemas/index.ts`:

```typescript
import { myContainerSchema } from './my-container';

export function registerAllPropertySchemas(): void {
  // ... existing registrations
  registerPropertySchema(myContainerSchema);
}
```

3. **Add to component palette** in `components/ComponentPalette.tsx`:

```typescript
const getCategoryFor = (plugin: ComponentPlugin) => {
  switch (plugin.type) {
    // ... existing cases
    case ComponentType.MY_CONTAINER:
      return 'Layout'; // or appropriate category
    // ...
  }
};
```

## Advanced Customization

### Custom Renderer

If you need more control over rendering, you can create a custom renderer:

```typescript
import { createBaseContainerRenderer } from './base-container';

export const MyContainerRenderer = createBaseContainerRenderer({
  styleExtensions: (props, evaluationScope) => {
    // Dynamic styles based on props
    return {
      cursor: props.myCustomProp ? 'pointer' : 'default',
    };
  },
  onClick: (props, actions, evaluationScope) => {
    // Custom onClick logic
  },
  wrapperElement: 'section', // Use a different HTML element
  wrapperProps: {
    'data-container-type': 'my-container',
  },
});
```

### Property Overrides

You can override base container properties:

```typescript
import { createBaseContainerProperties } from './base-container';

const properties = createBaseContainerProperties(ComponentType.MY_CONTAINER, {
  propertyOverrides: [
    {
      id: 'padding',
      defaultValue: '{{theme.spacing.lg}}', // Override default padding
    },
  ],
  additionalProperties: [
    // Your custom properties
  ],
});
```

### Custom Tabs and Groups

You can add custom tabs and groups:

```typescript
import { createBaseContainerSchema } from './base-container';

const schema = createBaseContainerSchema(
  ComponentType.MY_CONTAINER,
  customProperties,
  [
    { id: 'Custom', label: 'Custom', order: 3 }, // Add custom tab
  ],
  [
    { 
      id: 'Custom Group', 
      label: 'Custom Group', 
      tab: 'Custom', 
      order: 0,
      collapsible: true,
      defaultCollapsed: false,
    },
  ]
);
```

## Examples

### Example 1: Simple Container Extension

```typescript
// Just use the factory with minimal configuration
export const SimpleContainerPlugin = createContainerComponent({
  type: ComponentType.SIMPLE_CONTAINER,
  label: 'Simple Container',
  icon: <SimpleIcon />,
});
```

### Example 2: Container with Custom Properties

```typescript
// Add custom properties and override defaults
export const CustomContainerPlugin = createContainerComponent({
  type: ComponentType.CUSTOM_CONTAINER,
  label: 'Custom Container',
  icon: <CustomIcon />,
  defaultProps: {
    width: 600,
    height: 500,
    backgroundColor: '#f0f0f0',
  },
  additionalProperties: [
    {
      id: 'borderRadius',
      label: 'Border Radius',
      type: 'expression',
      defaultValue: '8px',
      supportsExpression: true,
      group: 'Borders',
      tab: 'Styles',
      // ... other metadata
    },
  ],
});
```

### Example 3: Container with Custom Renderer

```typescript
// Use custom renderer with additional behavior
export const AdvancedContainerPlugin = createContainerComponent({
  type: ComponentType.ADVANCED_CONTAINER,
  label: 'Advanced Container',
  icon: <AdvancedIcon />,
  rendererOptions: {
    styleExtensions: {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    },
    onClick: (props, actions, evaluationScope) => {
      // Custom click handling
      if (props.onClick) {
        // Evaluate custom onClick expression
      }
    },
  },
});
```

## Benefits

1. **Consistency**: All container-based components share the same base behavior
2. **Maintainability**: Changes to base container logic automatically apply to all extensions
3. **Extensibility**: Easy to add new container types with minimal code
4. **Type Safety**: Full TypeScript support with proper typing
5. **Flexibility**: Can override or extend any aspect of the base container

## Migration Notes

The existing Container component has been refactored to use these base utilities, so it serves as a reference implementation. All existing functionality is preserved, but the code is now more modular and reusable.



