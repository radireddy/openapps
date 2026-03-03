# Testing Guide

This guide covers how to write and run tests for the App Builder. The project uses Jest with React Testing Library for unit tests and Playwright for end-to-end tests.

## Running Tests

### Unit Tests (Jest)

```bash
npm test                    # Run all unit tests
npm run test:coverage       # Run tests with coverage report
```

### Running Specific Tests

```bash
# Run a single component's tests
npx jest --testPathPattern='Button.test' --no-coverage

# Run all component registry tests
npx jest --testPathPattern='component-registry' --no-coverage

# Run expression engine tests
npx jest --testPathPattern='engine.test' --no-coverage
```

### End-to-End Tests (Playwright)

```bash
npm run test:e2e            # Run all Playwright tests
npm run test:e2e-ui         # Run with Playwright UI
npm run test:e2e-report     # View last test report

# Run specific E2E tests by grep
npx playwright test --grep "INPUT:"
```

## Coverage Requirements

Coverage thresholds are configured in `jest.config.js`:

| Metric     | Threshold |
|------------|-----------|
| Statements | 50%       |
| Lines      | 50%       |
| Functions  | 40%       |
| Branches   | 40%       |

Many implementation files are excluded from coverage measurement pending dedicated test creation. See the `collectCoverageFrom` exclusions in `jest.config.js` for the full list. When you add tests for an excluded file, remove its exclusion entry.

## Testing Component Renderers

Component renderer tests verify that the plugin's `renderer` component renders correctly, evaluates expressions, responds to user interaction, and applies styles.

### Basic Pattern

The standard pattern for testing a component renderer (from `Button.test.tsx`):

```typescript
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonPlugin } from '@/components/component-registry/Button';
import { ComponentType } from 'types';
import '@testing-library/jest-dom';

const ButtonRenderer = ButtonPlugin.renderer;

describe('ButtonPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'button1',
      type: ComponentType.BUTTON,
      props: {
        x: 0, y: 0, width: 100, height: 40,
        text: 'Click Me',
        backgroundColor: 'blue',
        textColor: 'white',
        actionType: 'none' as const,
      },
    };

    it('should render the button with text', () => {
      render(<ButtonRenderer component={baseComponent} mode="preview" evaluationScope={{}} />);
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should be disabled based on an expression', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, disabled: '{{ 1 === 1 }}' },
      };
      render(<ButtonRenderer component={component} mode="preview" evaluationScope={{}} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
```

### Key Points for Renderer Tests

- Import the plugin and extract its `renderer`: `const Renderer = SomePlugin.renderer`
- Create a `baseComponent` object with `id`, `type`, and `props` matching the component's props interface
- Pass `evaluationScope` for expression evaluation; include `theme` if the component uses theme expressions
- Test expression evaluation by passing `{{ }}` wrapped expressions in props
- Test user interactions (click, change, etc.) by using `fireEvent` or `userEvent`
- For container components, test that `children` are rendered

### Testing Expression Evaluation

Components use `useJavaScriptRenderer` to evaluate `{{ }}` expressions. To test:

```typescript
it('should apply background color from expression', () => {
  const scope = { theme: { colors: { surface: 'rgb(255, 0, 0)' } } };
  const component = {
    ...baseComponent,
    props: { ...baseComponent.props, backgroundColor: '{{theme.colors.surface}}' },
  };
  render(<Renderer component={component} evaluationScope={scope} />);
  const el = document.querySelector('.w-full.h-full');
  expect(el).toHaveStyle('background-color: rgb(255, 0, 0)');
});
```

### Testing Actions

For components with action handlers (e.g., Button):

```typescript
it('should trigger an alert action on click', () => {
  const spy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  const mockActions = {
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
    selectRecord: jest.fn(),
    updateVariable: jest.fn(),
  };
  const component = {
    ...baseComponent,
    props: {
      ...baseComponent.props,
      actionType: 'alert' as const,
      actionAlertMessage: 'Hello {{user.name}}',
    },
  };
  const scope = { user: { name: 'World' } };

  render(<Renderer component={component} mode="preview" actions={mockActions} evaluationScope={scope} />);
  fireEvent.click(screen.getByRole('button'));
  expect(spy).toHaveBeenCalledWith('Hello World');
  spy.mockRestore();
});
```

## Testing Component Properties

Since all components now use `properties: () => null`, the properties panel is rendered by `PropertiesPanelCore` using registered schemas. There are two ways to test properties:

### 1. Verify properties returns null

For newer tests that confirm the metadata migration:

```typescript
describe('Properties', () => {
  it('should return null (properties handled by metadata system)', () => {
    const PropertiesComponent = DividerPlugin.properties;
    const result = PropertiesComponent({
      component: { id: 'divider1', props: {} as any },
      updateProp: jest.fn(),
      onOpenExpressionEditor: jest.fn(),
    });
    expect(result).toBeNull();
  });
});
```

### 2. Test via PropertiesPanelCore

For components that still need property panel integration testing, render via the properties export which delegates to `PropertiesPanelCore`:

```typescript
describe('Properties', () => {
  const updateProp = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    component: {
      id: 'input1',
      props: {
        placeholder: 'User Name',
        accessibilityLabel: 'User name input',
      } as any
    },
    updateProp,
    onOpenExpressionEditor,
  };

  it('should render properties correctly', () => {
    render(<InputProperties {...baseProps} />);
    expect(screen.getByLabelText('Placeholder')).toHaveValue('User Name');
  });

  it('should call updateProp when a value is changed', () => {
    render(<InputProperties {...baseProps} />);
    const input = screen.getByLabelText('Placeholder');
    fireEvent.change(input, { target: { value: 'New Placeholder' } });
    expect(updateProp).toHaveBeenCalledWith('placeholder', 'New Placeholder');
  });
});
```

## Data-Driven Property Tests

The project includes a data-driven test suite in `src/components/component-registry/__tests__/form-components-properties.test.tsx` that automatically tests all form components and their properties.

### How It Works

1. The **capability matrix** (`__tests__/test-utils/capability-matrix.ts`) auto-generates a matrix of component capabilities by reading registered property schemas from the `propertyRegistry`.
2. For each component and each property, the suite tests:
   - That the property appears in the properties panel
   - That property values apply correctly to the component
   - That expected effects are triggered (disabled state, visibility, etc.)
   - That expression-typed properties accept `{{ }}` expressions
3. Adding a new component schema automatically includes it in these tests.

### Test Utilities Reference

All test utilities are in `src/components/component-registry/__tests__/test-utils/`:

#### `component-renderer.tsx`

Factory functions for rendering components in tests:

| Function | Description |
|----------|-------------|
| `createTestComponent(type, props?)` | Creates an `AppComponent` with default props from the plugin's `paletteConfig` |
| `renderComponent(options)` | Renders a component using its plugin renderer. Returns `{ renderResult, element, component }` |
| `createDefaultEvaluationScope(overrides?)` | Creates an evaluation scope with theme and console |
| `getDefaultPropsForComponent(type)` | Gets default props from the plugin registry |
| `updateComponentProperty(rendered, propId, value)` | Re-renders a component with an updated property |

Usage:

```typescript
import {
  createTestComponent,
  renderComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

const component = createTestComponent(ComponentType.BUTTON, { text: 'Test' });
const rendered = renderComponent({ component, mode: 'preview' });
expect(rendered.element).toBeInTheDocument();
rendered.renderResult.unmount();
```

#### `sample-values.ts`

Generates sample test values based on property types:

| Function | Description |
|----------|-------------|
| `getSampleValue(type, propertyId?, defaultValue?)` | Returns a sample value appropriate for the property type |
| `getSampleValueForProperty(capability)` | Gets a sample value from a `PropertyCapability` |
| `getDifferentSampleValue(type, propertyId, currentValue)` | Returns a value guaranteed to differ from `currentValue` |

Sample values by type: `boolean` returns opposite of default, `number` returns `default + 42`, `string` returns contextual text (e.g., `'Test Label'` for `label` properties), `color` returns a contrasting hex color.

#### `effect-assertions.ts`

Reusable assertion functions for testing property effects on components:

| Assertion | Tests |
|-----------|-------|
| `componentShouldBeDisabled` | Element has `disabled` attribute, `aria-disabled`, or `.disabled` class |
| `componentShouldShowHide` | Element is hidden via `display: none`, `visibility: hidden`, `opacity: 0`, or `.hidden` class |
| `componentShouldHaveValue` | Input/textarea/select has the expected value |
| `componentShouldHavePlaceholder` | Input/textarea has the expected placeholder |
| `componentShouldHaveLabel` | Label text appears in the component's text content or aria attributes |
| `componentShouldHaveOptions` | Select/radio has the expected options |
| `componentShouldHaveColor` | Element has the expected color in computed styles |
| `componentShouldHaveText` | Element contains the expected text |

#### `capability-matrix.ts`

Auto-generates a capability matrix from property schemas:

| Function | Description |
|----------|-------------|
| `getCapabilityMatrix()` | Builds and returns the full capability matrix from the property registry |
| `getFormComponents()` | Returns the list of form component types to test |
| `buildCapabilityMatrix()` | Builds the matrix (called by `getCapabilityMatrix`) |

## Testing the Expression Engine

Expression tests are in `src/expressions/engine.test.ts`. They test the `safeEval` function directly:

```typescript
import { safeEval } from '@/expressions/engine';

describe('safeEval', () => {
  const scope = {
    a: 1,
    b: { value: 2 },
    c: 'hello',
    myFunc: (x: number) => x * 2,
    isTrue: true,
  };

  it('should evaluate numeric literals', () => {
    expect(safeEval('123', scope)).toBe(123);
  });

  it('should access nested properties from scope', () => {
    expect(safeEval('b.value', scope)).toBe(2);
  });

  it('should call functions from the scope', () => {
    expect(safeEval('myFunc(5)', scope)).toBe(10);
  });
});
```

Key areas to test for expressions:
- Literal evaluation (numbers, strings, booleans)
- Scope variable access (top-level and nested)
- Arithmetic and logical operators
- Function calls from scope
- Template literal interpolation
- Error handling for invalid expressions
- Sandboxing (blocked access to `window`, `document`, etc.)

## Test File Locations

| What | Location |
|------|----------|
| Component renderer/properties tests | `src/components/component-registry/<Component>.test.tsx` |
| Data-driven property tests | `src/components/component-registry/__tests__/form-components-properties.test.tsx` |
| Test utilities | `src/components/component-registry/__tests__/test-utils/` |
| Expression engine tests | `src/expressions/engine.test.ts` |
| State management tests | `src/hooks/useAppData.test.ts`, `src/hooks/useAppData.drag.test.ts` |
| Service tests | `src/services/geminiService.test.ts`, `src/services/project-exporter.test.ts` |
| Utility tests | `src/utils/data-helpers.test.ts`, `src/utils/disabled-helper.test.ts` |
| Storage tests | `src/storageService.test.ts` |
| E2E tests | `e2e/` |
| Jest config | `jest.config.js` |

## Adding Tests for a New Component

When creating a new component, add a test file at `src/components/component-registry/YourComponent.test.tsx`:

1. **Plugin metadata**: Verify `type`, `paletteConfig`, and that `properties` returns null
2. **Renderer**: Test default rendering, expression evaluation, style application, and user interactions
3. **Properties**: Verify `properties` returns null (metadata system handles property editing)

If the component is a form component, also add it to the `FORM_COMPONENTS` array in `src/components/component-registry/__tests__/test-utils/capability-matrix.ts` to include it in the data-driven test suite.

### Minimal New Component Test

```typescript
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { YourComponentPlugin } from '@/components/component-registry/YourComponent';
import { ComponentType } from '@/types';
import '@testing-library/jest-dom';

const Renderer = YourComponentPlugin.renderer;

describe('YourComponentPlugin', () => {
  describe('Plugin metadata', () => {
    it('should have correct type', () => {
      expect(YourComponentPlugin.type).toBe(ComponentType.YOUR_COMPONENT);
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'test1',
      type: ComponentType.YOUR_COMPONENT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        // ... default props
      },
    };

    it('should render without errors', () => {
      render(<Renderer component={baseComponent} mode="preview" evaluationScope={{}} />);
      // Assert on expected output
    });

    it('should evaluate expressions', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, label: '{{greeting}}' },
      };
      render(<Renderer component={component} mode="preview" evaluationScope={{ greeting: 'Hello' }} />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  describe('Properties', () => {
    it('should return null (properties handled by metadata system)', () => {
      const result = YourComponentPlugin.properties({
        component: { id: 'test1', props: {} as any },
        updateProp: jest.fn(),
        onOpenExpressionEditor: jest.fn(),
      });
      expect(result).toBeNull();
    });
  });
});
```
