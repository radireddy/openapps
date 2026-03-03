# Form Components Properties E2E Tests

This directory contains data-driven E2E tests that automatically test all form components and their properties.

## Overview

The E2E test suite (`form-components-properties.spec.ts`) uses the same capability matrix as the unit tests to automatically discover and test:
- All form components (INPUT, BUTTON, CHECKBOX, SELECT, SWITCH, TEXTAREA, RADIO_GROUP)
- All properties for each component
- Property effects in preview mode

## Running the Tests

### Run all E2E tests:
```bash
npm run test:e2e
```

### Run only form components properties tests:
```bash
npx playwright test form-components-properties
```

### Run with UI mode (for debugging):
```bash
npm run test:e2e-ui
```

### Run specific component test:
```bash
npx playwright test form-components-properties -g "INPUT"
```

## What Gets Tested

For each form component, the E2E tests verify:

1. **Component can be added to canvas** - Drag and drop from palette
2. **Properties panel displays** - When component is selected
3. **All properties are visible** - Properties from capability matrix appear in panel
4. **Properties can be set** - Values can be changed in properties panel
5. **Property effects work** - Changing properties affects component behavior in preview:
   - `disabled` → Component becomes disabled
   - `hidden` → Component becomes hidden
   - `value/placeholder` → Component shows new value/placeholder
   - `label/text` → Component displays new label/text
   - And more...

## Test Structure

The tests are data-driven and use the same capability matrix utilities as unit tests:

```typescript
// Automatically discover components and properties
const capabilityMatrix = getCapabilityMatrix();
const formComponents = getFormComponents();

// Test each component
for (const componentType of formComponents) {
  // Get all properties for this component
  const properties = capabilityMatrix[componentType].properties;
  
  // Test each property
  for (const [propertyId, propertyCapability] of properties) {
    // Verify property appears in panel
    // Set property value
    // Verify effect in preview mode
  }
}
```

## Features

✅ **Automatic discovery** - Uses property registry to find all components and properties  
✅ **Future-proof** - New components/properties automatically get tested  
✅ **No code duplication** - Reuses capability matrix from unit tests  
✅ **Preview mode verification** - Tests actual component behavior  
✅ **Effect verification** - Validates property changes affect components  

## Test Workflow

For each component:

1. **Create app** - New app for testing
2. **Add component** - Drag from palette to canvas
3. **Select component** - Opens properties panel
4. **Verify properties** - Check all properties from matrix are visible
5. **Switch to preview** - Enter preview mode
6. **Verify rendering** - Component renders correctly
7. **Test property effects** - For each property with expected effects:
   - Go back to edit mode
   - Set property value
   - Switch to preview
   - Verify the effect (disabled, hidden, value change, etc.)

## Adding New Components/Properties

When you add:
- **New component**: Add to `FORM_COMPONENTS` in `capability-matrix.ts` - E2E tests will auto-generate
- **New property**: Add to component's property schema - E2E tests will auto-generate
- **New property effect**: Add effect mapping in `capability-matrix.ts` and update `verifyPropertyEffect()` function

## Troubleshooting

### Tests failing due to timing issues:
- Increase timeout: `test.setTimeout(60000)`
- Add explicit waits: `await page.waitForTimeout(500)`

### Component not found in preview:
- Check component type mapping in `findComponentInPreview()`
- Verify component renders in preview mode manually

### Property not found:
- Property might have conditional visibility (`visibleIf`)
- Check property selectors in `setPropertyValue()`
- Verify property is in capability matrix

### Preview frame not found:
- Update preview frame selector based on actual DOM structure
- Check if preview uses iframe or direct rendering

## Example Output

```
✓ INPUT: Verify all properties and their effects (15s)
✓ BUTTON: Verify all properties and their effects (12s)
✓ CHECKBOX: Verify all properties and their effects (10s)
✓ SELECT: Verify all properties and their effects (14s)
✓ SWITCH: Verify all properties and their effects (11s)
✓ TEXTAREA: Verify all properties and their effects (13s)
✓ RADIO_GROUP: Verify all properties and their effects (16s)
✓ All form components can be added and configured (8s)
```

