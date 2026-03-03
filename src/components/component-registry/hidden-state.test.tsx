import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComponentType } from 'types';
import '@testing-library/jest-dom';

// Import all component renderers
import { InputPlugin } from '@/components/component-registry/Input';
import { ButtonPlugin } from '@/components/component-registry/Button';
import { CheckboxPlugin } from '@/components/component-registry/Checkbox';
import { SwitchPlugin } from '@/components/component-registry/Switch';
import { SelectPlugin } from '@/components/component-registry/Select';
import { TextareaPlugin } from '@/components/component-registry/Textarea';
import { RadioGroupPlugin } from '@/components/component-registry/RadioGroup';
import { LabelPlugin } from '@/components/component-registry/Label';
import { ImagePlugin } from '@/components/component-registry/Image';
import { TablePlugin } from '@/components/component-registry/Table';
import { DividerPlugin } from '@/components/component-registry/Divider';

// Import RenderedComponent to test hidden state
import { RenderedComponent } from '@/components/RenderedComponent';

describe('Component Hidden State', () => {
  const mockDataStore = { testKey: 'testValue', checkboxKey: true };
  const mockEvaluationScope = { shouldHide: true, shouldShow: false };

  // Helper to test hidden state for a component using RenderedComponent
  const testHiddenState = (
    componentType: ComponentType,
    componentName: string,
    baseComponent: any,
    getTestElement: () => HTMLElement
  ) => {
    describe(`${componentName} Component`, () => {
      const baseProps = {
        allComponents: [],
        selectedComponentIds: [],
        onSelect: jest.fn(),
        onUpdate: jest.fn(),
        onUpdateComponents: jest.fn(),
        onDelete: jest.fn(),
        onDrop: jest.fn(),
        onReparentCheck: jest.fn(),
        mode: 'preview' as const,
        dataStore: mockDataStore,
        evaluationScope: mockEvaluationScope,
      };

      it('should NOT be hidden when hidden is undefined', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: undefined },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      it('should NOT be hidden when hidden is false (boolean)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: false },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      it('should NOT be hidden when hidden is "false" (string)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: 'false' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      it('should NOT be hidden when hidden is empty string', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      it('should NOT be hidden when hidden is "0" (string)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '0' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      it('should NOT be hidden when hidden is "1" (string)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '1' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      it('should NOT be hidden when hidden is "random text" (string)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: 'random text' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      it('should NOT be hidden when hidden expression evaluates to false', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '{{ false }}' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      it('should NOT be hidden when hidden expression evaluates to false variable', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '{{ shouldShow }}' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const element = getTestElement();
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });

      // Preview mode tests - components should be completely hidden
      it('should be hidden in preview mode when hidden is true (boolean)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: true },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        // In preview mode, hidden components use display: none, so we check the wrapper
        const wrapper = screen.getByLabelText(`${component.type} component`);
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveStyle({ display: 'none' });
      });

      it('should be hidden in preview mode when hidden is "true" (string)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: 'true' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const wrapper = screen.getByLabelText(`${component.type} component`);
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveStyle({ display: 'none' });
      });

      it('should be hidden in preview mode when hidden expression evaluates to true', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '{{ true }}' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const wrapper = screen.getByLabelText(`${component.type} component`);
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveStyle({ display: 'none' });
      });

      it('should be hidden in preview mode when hidden expression evaluates to true variable', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '{{ shouldHide }}' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="preview" />);
        const wrapper = screen.getByLabelText(`${component.type} component`);
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveStyle({ display: 'none' });
      });

      // Edit mode tests - components should be visible but with reduced opacity
      it('should be visible with reduced opacity in edit mode when hidden is true (boolean)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: true },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="edit" />);
        const wrapper = screen.getByLabelText(`${component.type} component`);
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toBeVisible();
        expect(wrapper).toHaveStyle({ opacity: '0.3', display: 'block' });
      });

      it('should be visible with reduced opacity in edit mode when hidden is "true" (string)', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: 'true' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="edit" />);
        const wrapper = screen.getByLabelText(`${component.type} component`);
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toBeVisible();
        expect(wrapper).toHaveStyle({ opacity: '0.3', display: 'block' });
      });

      it('should be visible with reduced opacity in edit mode when hidden expression evaluates to true', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '{{ true }}' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="edit" />);
        const wrapper = screen.getByLabelText(`${component.type} component`);
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toBeVisible();
        expect(wrapper).toHaveStyle({ opacity: '0.3', display: 'block' });
      });

      it('should be visible with reduced opacity in edit mode when hidden expression evaluates to true variable', () => {
        const component = {
          ...baseComponent,
          props: { ...baseComponent.props, hidden: '{{ shouldHide }}' },
        };
        render(<RenderedComponent component={component} {...baseProps} mode="edit" />);
        const wrapper = screen.getByLabelText(`${component.type} component`);
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toBeVisible();
        expect(wrapper).toHaveStyle({ opacity: '0.3', display: 'block' });
      });
    });
  };

  // Test Input Component
  testHiddenState(
    ComponentType.INPUT,
    'Input',
    {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Enter text',
      },
    },
    () => screen.getByRole('textbox')
  );

  // Test Button Component
  testHiddenState(
    ComponentType.BUTTON,
    'Button',
    {
      id: 'button1',
      type: ComponentType.BUTTON,
      props: {
        x: 0, y: 0, width: 100, height: 40,
        text: 'Click Me',
        backgroundColor: 'blue',
        textColor: 'white',
        actionType: 'none' as const,
      },
    },
    () => screen.getByRole('button')
  );

  // Test Checkbox Component
  testHiddenState(
    ComponentType.CHECKBOX,
    'Checkbox',
    {
      id: 'checkbox1',
      type: ComponentType.CHECKBOX,
      props: {
        x: 0, y: 0, width: 150, height: 30,
        label: 'Check me',
      },
    },
    () => screen.getByRole('checkbox')
  );

  // Test Switch Component
  testHiddenState(
    ComponentType.SWITCH,
    'Switch',
    {
      id: 'switch1',
      type: ComponentType.SWITCH,
      props: {
        x: 0, y: 0, width: 180, height: 30,
        label: 'Toggle me',
      },
    },
    () => screen.getByRole('switch')
  );

  // Test Select Component
  testHiddenState(
    ComponentType.SELECT,
    'Select',
    {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Select option',
        options: 'Option1,Option2',
      },
    },
    () => screen.getByRole('combobox')
  );

  // Test Textarea Component
  testHiddenState(
    ComponentType.TEXTAREA,
    'Textarea',
    {
      id: 'textarea1',
      type: ComponentType.TEXTAREA,
      props: {
        x: 0, y: 0, width: 250, height: 100,
        placeholder: 'Enter text',
      },
    },
    () => screen.getByRole('textbox')
  );

  // Test RadioGroup Component
  testHiddenState(
    ComponentType.RADIO_GROUP,
    'RadioGroup',
    {
      id: 'radio1',
      type: ComponentType.RADIO_GROUP,
      props: {
        x: 0, y: 0, width: 150, height: 80,
        options: 'Option1,Option2',
      },
    },
    () => screen.getAllByRole('radio')[0]
  );

  // Test Label Component
  testHiddenState(
    ComponentType.LABEL,
    'Label',
    {
      id: 'label1',
      type: ComponentType.LABEL,
      props: {
        x: 0, y: 0, width: 100, height: 30,
        text: 'Label Text',
      },
    },
    () => screen.getByText('Label Text')
  );

  // Test Image Component
  testHiddenState(
    ComponentType.IMAGE,
    'Image',
    {
      id: 'image1',
      type: ComponentType.IMAGE,
      props: {
        x: 0, y: 0, width: 200, height: 200,
        src: 'https://via.placeholder.com/200',
        alt: 'Test Image',
      },
    },
    () => screen.getByAltText('Test Image')
  );

  // Test Divider Component
  testHiddenState(
    ComponentType.DIVIDER,
    'Divider',
    {
      id: 'divider1',
      type: ComponentType.DIVIDER,
      props: {
        x: 0, y: 0, width: 300, height: 2,
        color: '#d1d5db',
      },
    },
    () => screen.getByLabelText('DIVIDER component')
  );
});

