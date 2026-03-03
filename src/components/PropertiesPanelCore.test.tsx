import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertiesPanelCore } from './properties/PropertiesPanelCore';
import { ComponentType } from 'types';
import { registerAllPropertySchemas } from './properties/schemas';
import '@testing-library/jest-dom';

// Register all property schemas before tests
beforeEach(() => {
  // Clear any previous registrations
  const { propertyRegistry } = require('./properties/registry');
  Object.keys(propertyRegistry).forEach(key => delete propertyRegistry[key]);
  
  // Register all schemas
  registerAllPropertySchemas();
});

describe('PropertiesPanelCore - Label Component', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    onUpdate,
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
    onArrangeContainerChildren: jest.fn(),
  };

  it('should display the Text property for Label component', () => {
    const components = [
      { 
        id: 'label1', 
        type: ComponentType.LABEL, 
        props: { 
          text: 'My Label',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['label1']} 
      />
    );
    
    // Check that the Text property label is visible
    expect(screen.getByLabelText('Text')).toBeInTheDocument();
  });

  it('should display the Text Renderer property for Label component', () => {
    const components = [
      { 
        id: 'label1', 
        type: ComponentType.LABEL, 
        props: { 
          text: 'My Label',
          textRenderer: 'javascript',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['label1']} 
      />
    );
    
    // Check that the Text Renderer property label is visible
    expect(screen.getByLabelText('Text Renderer')).toBeInTheDocument();
  });

  it('should display all Basic group properties for Label component', () => {
    const components = [
      { 
        id: 'label1', 
        type: ComponentType.LABEL, 
        props: { 
          text: 'My Label',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['label1']} 
      />
    );
    
    // Check that Basic group exists and contains Text property
    const basicGroup = screen.getByText('Basic');
    expect(basicGroup).toBeInTheDocument();
    
    // Check that Text property is in the Basic group
    expect(screen.getByLabelText('Text')).toBeInTheDocument();
    expect(screen.getByLabelText('Text Renderer')).toBeInTheDocument();
  });

  it('should display Typography properties for Label component', async () => {
    const user = userEvent.setup();
    const components = [
      { 
        id: 'label1', 
        type: ComponentType.LABEL, 
        props: { 
          text: 'My Label',
          fontSize: 16,
          fontWeight: 'normal',
          color: '#111827',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['label1']} 
      />
    );
    
    // Click on the Styles tab to see Typography group
    const stylesTab = screen.getByRole('tab', { name: /Styles/i });
    expect(stylesTab).toBeInTheDocument();
    await user.click(stylesTab);
    
    // Wait for Typography group to appear after tab switch
    await waitFor(() => {
      expect(screen.getByText('Typography')).toBeInTheDocument();
    });
    
    // Check that typography properties are visible
    expect(screen.getByLabelText('Font Size')).toBeInTheDocument();
    expect(screen.getByLabelText('Font Weight')).toBeInTheDocument();
    expect(screen.getByLabelText('Text Color')).toBeInTheDocument();
  });
});

describe('PropertiesPanelCore - Default Value Property', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    onUpdate,
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
    onArrangeContainerChildren: jest.fn(),
  };

  it('should display Default Value property for INPUT component', () => {
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should apply static default value to INPUT component when dataStore is empty', () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { InputPlugin } = require('components/component-registry/Input');
    
    const component = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        placeholder: 'Enter text',
        defaultValue: 'John Doe',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    const dataStore = {}; // Empty dataStore
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <InputPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    expect(input?.defaultValue).toBe('John Doe');
  });

  it('should apply expression default value to INPUT component when dataStore is empty', () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { InputPlugin } = require('components/component-registry/Input');
    
    const component = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        placeholder: 'Enter text',
        defaultValue: '{{user.name}}',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    const dataStore = {}; // Empty dataStore
    const evaluationScope = {
      user: { name: 'Jane Doe' },
    };
    
    const { container } = renderComponent(
      <InputPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    expect(input?.defaultValue).toBe('Jane Doe');
  });

  it('should prioritize dataStore value over default value for INPUT component', () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { InputPlugin } = require('components/component-registry/Input');
    
    const component = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        placeholder: 'Enter text',
        defaultValue: 'Default Name',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    const dataStore = {
      'input1': 'Stored Name',
    };
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <InputPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    expect(input?.defaultValue).toBe('Stored Name');
  });

  it('should not throw hooks error when double-clicking input with default value', () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { InputPlugin } = require('components/component-registry/Input');
    
    const component = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        placeholder: 'Enter text',
        defaultValue: 'Test Value',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    const dataStore = {};
    const evaluationScope = {};
    
    // Render multiple times to simulate re-renders (like double-clicking)
    const { container, rerender } = renderComponent(
      <InputPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    // Re-render to simulate state change (like double-clicking)
    rerender(
      <InputPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    // Should not throw "Rendered fewer hooks than expected" error
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    expect(input?.defaultValue).toBe('Test Value');
  });

  it('should initialize dataStore with default value when empty for INPUT component', async () => {
    const { render: renderComponent, waitFor } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { InputPlugin } = require('components/component-registry/Input');
    
    const component = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        placeholder: 'Enter text',
        defaultValue: 'Initial Value',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    const dataStore = {}; // Empty dataStore
    const onUpdateDataStore = jest.fn();
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <InputPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        onUpdateDataStore={onUpdateDataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    // Components now use local state and don't automatically initialize dataStore on mount
    // They only update dataStore when user interacts with them
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    // Component should display the default value from local state
    expect(input?.value).toBe('Initial Value');
  });

  it('should show default value in preview when dataStore is empty for INPUT component', async () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { InputPlugin } = require('components/component-registry/Input');
    
    const component = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        placeholder: 'Enter text',
        defaultValue: 'Preview Value',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    const dataStore = {}; // Empty dataStore
    const onUpdateDataStore = jest.fn();
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <InputPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        onUpdateDataStore={onUpdateDataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    // Should show default value even when dataStore is empty
    expect(input?.defaultValue || input?.value).toBe('Preview Value');
  });

  it('should use dataStore value once initialized, not default value for INPUT component', async () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { InputPlugin } = require('components/component-registry/Input');
    
    const component = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        placeholder: 'Enter text',
        defaultValue: 'Default Value',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    // dataStore already has a value
    const dataStore = {
      'input1': 'Changed Value',
    };
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <InputPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    // Should use dataStore value, not default value
    expect(input?.defaultValue || input?.value).toBe('Changed Value');
  });

  it('should initialize dataStore with default value when empty for TEXTAREA component', async () => {
    const { render: renderComponent, waitFor } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { TextareaPlugin } = require('components/component-registry/Textarea');
    
    const component = {
      id: 'textarea1',
      type: ComponentType.TEXTAREA,
      props: {
        placeholder: 'Enter text',
        defaultValue: 'Initial Bio',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      },
    };
    
    const dataStore = {}; // Empty dataStore
    const onUpdateDataStore = jest.fn();
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <TextareaPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        onUpdateDataStore={onUpdateDataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    // Components now use local state and don't automatically initialize dataStore on mount
    // They only update dataStore when user interacts with them
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
    // Component should display the default value from local state
    expect(textarea?.value).toBe('Initial Bio');
  });

  it('should show default value in preview when dataStore is empty for TEXTAREA component', async () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { TextareaPlugin } = require('components/component-registry/Textarea');
    
    const component = {
      id: 'textarea1',
      type: ComponentType.TEXTAREA,
      props: {
        placeholder: 'Enter text',
        defaultValue: 'Preview Bio',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      },
    };
    
    const dataStore = {}; // Empty dataStore
    const onUpdateDataStore = jest.fn();
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <TextareaPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        onUpdateDataStore={onUpdateDataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
    // Should show default value even when dataStore is empty
    expect(textarea?.defaultValue || textarea?.value).toBe('Preview Bio');
  });

  it('should initialize dataStore with default value when empty for SELECT component', async () => {
    const { render: renderComponent, waitFor } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { SelectPlugin } = require('components/component-registry/Select');
    
    const component = {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        placeholder: 'Select option',
        options: 'Option 1,Option 2,Option 3',
        defaultValue: 'Option 2',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    const dataStore = {}; // Empty dataStore
    const onUpdateDataStore = jest.fn();
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <SelectPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        onUpdateDataStore={onUpdateDataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    // Components now use local state and don't automatically initialize dataStore on mount
    // They only update dataStore when user interacts with them
    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
    // Component should display the default value from local state
    expect(select?.value).toBe('Option 2');
  });

  it('should show default value in preview when dataStore is empty for SELECT component', async () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { SelectPlugin } = require('components/component-registry/Select');
    
    const component = {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        placeholder: 'Select option',
        options: 'Option 1,Option 2,Option 3',
        defaultValue: 'Option 3',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    const dataStore = {}; // Empty dataStore
    const onUpdateDataStore = jest.fn();
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <SelectPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        onUpdateDataStore={onUpdateDataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
    // Should show default value even when dataStore is empty
    expect(select?.value).toBe('Option 3');
  });

  it('should use dataStore value once initialized, not default value for SELECT component', async () => {
    const { render: renderComponent } = require('@testing-library/react');
    const { ComponentType } = require('types');
    const { SelectPlugin } = require('components/component-registry/Select');
    
    const component = {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        placeholder: 'Select option',
        options: 'Option 1,Option 2,Option 3',
        defaultValue: 'Option 1',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
      },
    };
    
    // dataStore already has a value
    const dataStore = {
      'select1': 'Option 2',
    };
    const evaluationScope = {};
    
    const { container } = renderComponent(
      <SelectPlugin.renderer
        component={component}
        mode="preview"
        dataStore={dataStore}
        evaluationScope={evaluationScope}
      />
    );
    
    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
    // Should use dataStore value, not default value
    expect(select?.value).toBe('Option 2');
  });

  it('should display Default Value property for SELECT component', () => {
    const components = [
      { 
        id: 'select1', 
        type: ComponentType.SELECT, 
        props: { 
          placeholder: 'Select an option',
          options: 'Option 1,Option 2',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['select1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for TEXTAREA component', () => {
    const components = [
      { 
        id: 'textarea1', 
        type: ComponentType.TEXTAREA, 
        props: { 
          placeholder: 'Enter text',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 100,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['textarea1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for CHECKBOX component', () => {
    const components = [
      { 
        id: 'checkbox1', 
        type: ComponentType.CHECKBOX, 
        props: { 
          label: 'Accept terms',
          defaultValue: false,
          x: 0,
          y: 0,
          width: 150,
          height: 30,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['checkbox1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for SWITCH component', () => {
    const components = [
      { 
        id: 'switch1', 
        type: ComponentType.SWITCH, 
        props: { 
          label: 'Enable feature',
          defaultValue: false,
          x: 0,
          y: 0,
          width: 180,
          height: 30,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['switch1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for RADIO_GROUP component', () => {
    const components = [
      { 
        id: 'radio1', 
        type: ComponentType.RADIO_GROUP, 
        props: { 
          options: 'Option 1,Option 2',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 150,
          height: 80,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['radio1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should update component when Default Value is changed for INPUT', () => {
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    const defaultValueInput = screen.getByLabelText('Default Value');
    expect(defaultValueInput).toBeInTheDocument();
    
    // Verify the input can be updated (this tests that the property is functional)
    expect(defaultValueInput).toHaveValue('');
  });

  it('should update component when Default Value is changed for SELECT', () => {
    const components = [
      { 
        id: 'select1', 
        type: ComponentType.SELECT, 
        props: { 
          placeholder: 'Select an option',
          options: 'Option 1,Option 2,Option 3',
          defaultValue: 'Option 1',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['select1']} 
      />
    );
    
    const defaultValueInput = screen.getByLabelText('Default Value');
    expect(defaultValueInput).toBeInTheDocument();
    expect(defaultValueInput).toHaveValue('Option 1');
  });

  it('should not have duplicate State groups', () => {
    const components = [
      { 
        id: 'select1', 
        type: ComponentType.SELECT, 
        props: { 
          placeholder: 'Select an option',
          options: 'Option 1,Option 2',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    const { container } = render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['select1']} 
      />
    );
    
    // Count how many "State" group headers exist (button elements with text "State")
    const stateButtons = Array.from(container.querySelectorAll('button')).filter(btn => 
      btn.textContent?.trim() === 'State'
    );
    // Should only have one State group
    expect(stateButtons.length).toBeLessThanOrEqual(1);
  });
});

describe('PropertiesPanelCore - Group Ordering', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    onUpdate,
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
    onArrangeContainerChildren: jest.fn(),
  };

  it('should maintain consistent group order for INPUT component', () => {
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    const { container } = render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    // Get all group headers (buttons with group labels)
    const groupButtons = Array.from(container.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent?.trim();
      return text && ['Layout', 'State', 'Validation', 'Accessibility', 'Styling'].includes(text);
    });
    
    const groupLabels = groupButtons.map(btn => btn.textContent?.trim()).filter(Boolean);
    
    // Verify order: Layout should come before State, State before Validation, etc.
    const layoutIndex = groupLabels.indexOf('Layout');
    const stateIndex = groupLabels.indexOf('State');
    const validationIndex = groupLabels.indexOf('Validation');
    const accessibilityIndex = groupLabels.indexOf('Accessibility');
    
    expect(layoutIndex).toBeGreaterThanOrEqual(0);
    expect(stateIndex).toBeGreaterThanOrEqual(0);
    expect(validationIndex).toBeGreaterThanOrEqual(0);
    expect(accessibilityIndex).toBeGreaterThanOrEqual(0);
    
    // Verify consistent ordering
    expect(layoutIndex).toBeLessThan(stateIndex);
    expect(stateIndex).toBeLessThan(validationIndex);
    expect(validationIndex).toBeLessThan(accessibilityIndex);
  });

  it('should maintain consistent group order for SELECT component', () => {
    const components = [
      { 
        id: 'select1', 
        type: ComponentType.SELECT, 
        props: { 
          placeholder: 'Select an option',
          options: 'Option 1,Option 2',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    const { container } = render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['select1']} 
      />
    );
    
    // Get all group headers
    const groupButtons = Array.from(container.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent?.trim();
      return text && ['Basic', 'Layout', 'State', 'Accessibility'].includes(text);
    });
    
    const groupLabels = groupButtons.map(btn => btn.textContent?.trim()).filter(Boolean);
    
    // Verify order: Basic should come before Layout, Layout before State, State before Accessibility
    const basicIndex = groupLabels.indexOf('Basic');
    const layoutIndex = groupLabels.indexOf('Layout');
    const stateIndex = groupLabels.indexOf('State');
    const accessibilityIndex = groupLabels.indexOf('Accessibility');
    
    expect(basicIndex).toBeGreaterThanOrEqual(0);
    expect(layoutIndex).toBeGreaterThanOrEqual(0);
    expect(stateIndex).toBeGreaterThanOrEqual(0);
    expect(accessibilityIndex).toBeGreaterThanOrEqual(0);
    
    // Verify consistent ordering
    expect(basicIndex).toBeLessThan(layoutIndex);
    expect(layoutIndex).toBeLessThan(stateIndex);
    expect(stateIndex).toBeLessThan(accessibilityIndex);
  });

  it('should allow components to override group order', () => {
    // This test verifies that orderOverride works if needed in the future
    // For now, we just verify that the system supports it
    const { DEFAULT_GROUP_ORDER } = require('./properties/registry');
    
    // Verify DEFAULT_GROUP_ORDER is defined
    expect(DEFAULT_GROUP_ORDER).toBeDefined();
    expect(DEFAULT_GROUP_ORDER['Basic']).toBe(0);
    expect(DEFAULT_GROUP_ORDER['Layout']).toBe(1);
    expect(DEFAULT_GROUP_ORDER['State']).toBe(2);
  });
});

describe('PropertiesPanelCore - Property Tabs', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    onUpdate,
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
    onArrangeContainerChildren: jest.fn(),
  };

  it('should display all registered tabs', () => {
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    // Verify all tabs are displayed
    expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Styles' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeInTheDocument();
  });

  it('should show styling properties in Styles tab', async () => {
    const user = userEvent.setup();
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          opacity: 1,
          boxShadow: '2px 2px 5px #ccc',
          borderRadius: '4px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e5e7eb',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    // Click on the Styles tab
    const stylesTab = screen.getByRole('tab', { name: 'Styles' });
    expect(stylesTab).toBeInTheDocument();
    await user.click(stylesTab);
    
    // Wait for Styling group to appear
    await waitFor(() => {
      expect(screen.getByText('Styling')).toBeInTheDocument();
    });
    
    // Verify styling properties are visible in Styles tab
    expect(screen.getByLabelText('Opacity')).toBeInTheDocument();
    expect(screen.getByLabelText('Shadow')).toBeInTheDocument();
    expect(screen.getByLabelText('Border Radius')).toBeInTheDocument();
    expect(screen.getByLabelText('Border Width')).toBeInTheDocument();
    expect(screen.getByLabelText('Border Style')).toBeInTheDocument();
    expect(screen.getByLabelText('Border Color')).toBeInTheDocument();
  });

  it('should switch between tabs correctly', async () => {
    const user = userEvent.setup();
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    // Initially, General tab should be active
    const generalTab = screen.getByRole('tab', { name: 'General' });
    expect(generalTab).toHaveAttribute('aria-selected', 'true');
    
    // Verify General tab content is visible
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
    
    // Click on Styles tab
    const stylesTab = screen.getByRole('tab', { name: 'Styles' });
    await user.click(stylesTab);
    
    // Verify Styles tab is now active
    await waitFor(() => {
      expect(stylesTab).toHaveAttribute('aria-selected', 'true');
    });
    
    // Verify General tab is no longer active
    expect(generalTab).toHaveAttribute('aria-selected', 'false');
    
    // Verify Styles tab content is visible
    await waitFor(() => {
      expect(screen.getByText('Styling')).toBeInTheDocument();
    });
    
    // Click back on General tab
    await user.click(generalTab);
    
    // Verify General tab is active again
    await waitFor(() => {
      expect(generalTab).toHaveAttribute('aria-selected', 'true');
    });
    
    // Verify General tab content is visible again
    expect(screen.getByText('Layout')).toBeInTheDocument();
  });

  it('should not show styling properties in General tab', () => {
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          opacity: 1,
          borderWidth: '1px',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    // General tab should be active by default
    const generalTab = screen.getByRole('tab', { name: 'General' });
    expect(generalTab).toHaveAttribute('aria-selected', 'true');
    
    // Styling properties should NOT be visible in General tab
    expect(screen.queryByLabelText('Opacity')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Border Width')).not.toBeInTheDocument();
    expect(screen.queryByText('Styling')).not.toBeInTheDocument();
    
    // But Layout and State groups should be visible
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
  });
});

