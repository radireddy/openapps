# How to Run the Form Components Properties Tests

## Quick Start

### Run all tests:
```bash
npm test
```

### Run only the form components properties test suite:
```bash
npm test form-components-properties
```

Or using Jest directly:
```bash
npx jest form-components-properties
```

### Run with verbose output:
```bash
npm test form-components-properties -- --verbose
```

### Run in watch mode (auto-rerun on file changes):
```bash
npm test form-components-properties -- --watch
```

### Run a specific test case:
```bash
npm test form-components-properties -- -t "should render without errors"
```

### Run with coverage report:
```bash
npm run test:coverage
```

## Test Structure

The test suite is located at:
- **Main test file**: `src/components/component-registry/__tests__/form-components-properties.test.tsx`
- **Test utilities**: `src/components/component-registry/__tests__/test-utils/`
  - `capability-matrix.ts` - Builds capability matrix from property registry
  - `sample-values.ts` - Generates sample test values
  - `effect-assertions.ts` - Reusable assertion functions
  - `component-renderer.tsx` - Factory functions for rendering components

## What Gets Tested

The test suite automatically tests **all form components**:
- INPUT
- BUTTON
- CHECKBOX
- SELECT
- SWITCH
- TEXTAREA
- RADIO_GROUP

For each component, it tests:
1. **Component rendering** - Verifies components render without errors
2. **Property visibility** - Checks properties appear in properties panel
3. **Property application** - Verifies properties apply to components
4. **Expected effects** - Tests property effects (disabled, hidden, etc.)
5. **Expression support** - Verifies expression support for applicable properties

## Test Execution

When you run the tests, you'll see output like:

```
Form Components Properties - Data-Driven Tests
  ✓ should have form components defined
  INPUT
    ✓ should render without errors
    Property: Value (value)
      ✓ should show property 'Value' in properties panel
      ✓ should apply property 'value' correctly to component
      ✓ should trigger expected effects for 'value'
      ✓ should support expressions for 'value'
    ...
  BUTTON
    ...
```

## Troubleshooting

### Import Errors

If you see import errors, make sure:
- All dependencies are installed: `npm install`
- The property schemas are registered: The test file automatically registers them via `registerAllPropertySchemas()`

### Component Not Found Errors

If a component plugin is not found:
- Ensure the component is registered in `components/component-registry/registry.ts`
- Check that the component type matches the `ComponentType` enum

### Property Not Found Errors

If a property is not found:
- Ensure the property schema is registered for that component
- Check that the property is defined in the component's schema file

## Benefits of This Approach

✅ **Automatic coverage** - New components and properties are automatically tested  
✅ **Maintainable** - Single source of truth (property registry)  
✅ **Scalable** - Works for hundreds of components and properties  
✅ **No code duplication** - Reusable test utilities  
✅ **Fast** - Efficient test execution  

## Example Commands

```bash
# Run all tests
npm test

# Run only form components tests
npm test form-components-properties

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch

# Run specific component tests
npm test form-components-properties -- -t "INPUT"

# Run specific property test
npm test form-components-properties -- -t "should apply property 'value'"
```

