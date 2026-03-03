# Form Components Properties Test Suite

This directory contains a data-driven test suite that automatically tests all form components and their properties.

## Test Structure

- `form-components-properties.test.tsx` - Main test file that uses the capability matrix to test all components
- `test-utils/` - Utility files that support the test suite:
  - `capability-matrix.ts` - Builds a capability matrix from the property registry
  - `sample-values.ts` - Generates sample test values based on property types
  - `effect-assertions.ts` - Reusable assertion functions for testing property effects
  - `component-renderer.ts` - Factory functions for rendering components in tests

## Running the Tests

### Run all tests:
```bash
npm test
```

### Run only this specific test file:
```bash
npm test form-components-properties
```

Or using Jest directly:
```bash
npx jest form-components-properties
```

### Run with coverage:
```bash
npm run test:coverage
```

### Run in watch mode (auto-rerun on file changes):
```bash
npm test -- --watch
```

### Run with verbose output:
```bash
npm test -- --verbose
```

### Run a specific test case:
```bash
npm test -- -t "should render without errors"
```

## What Gets Tested

The test suite automatically tests:

1. **All form components**: INPUT, BUTTON, CHECKBOX, SELECT, SWITCH, TEXTAREA, RADIO_GROUP
2. **All properties** for each component (automatically discovered from property registry)
3. **Property visibility** in the properties panel
4. **Property application** to component instances
5. **Expected effects** when properties are set (e.g., disabled state, visibility, etc.)
6. **Expression support** for properties that support it

## How It Works

1. **Capability Matrix**: Automatically builds a matrix of all components and their properties from the property registry
2. **Data-Driven Tests**: Loops through the matrix to generate tests for each component-property combination
3. **Reusable Assertions**: Uses a library of effect assertions to verify property effects
4. **Sample Values**: Automatically generates appropriate test values based on property types

## Adding New Components/Properties

When you add:
- **New component**: Just add it to the `FORM_COMPONENTS` array in `capability-matrix.ts` - tests will auto-generate
- **New property**: Add it to the component's property schema - tests will auto-generate
- **New property effect**: Add the effect mapping in `capability-matrix.ts` and create an assertion in `effect-assertions.ts`

## Test Output Example

```
Form Components Properties - Data-Driven Tests
  INPUT
    ✓ should render without errors
    Property: Value (value)
      ✓ should show property 'Value' in properties panel
      ✓ should apply property 'value' correctly to component
      ✓ should trigger expected effects for 'value'
    Property: Placeholder (placeholder)
      ✓ should show property 'Placeholder' in properties panel
      ...
  BUTTON
    ...
```

## Troubleshooting

If tests fail:

1. **Check property registry**: Ensure all property schemas are registered via `registerAllPropertySchemas()`
2. **Verify component registry**: Ensure all components are registered in `componentRegistry`
3. **Check imports**: Ensure all component plugins are properly imported
4. **Review property visibility**: Some properties have conditional visibility - they may not always appear in tests

