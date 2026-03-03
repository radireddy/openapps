/**
 * Form Component Tests
 *
 * Tests for the Form container component renderer.
 * Verifies semantic HTML, ARIA attributes, container behavior, spacing,
 * validation summary, and labelPlacement context.
 */

import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentType } from '../../../types';
import { componentRegistry } from '../registry';
import { useRuntimeStore } from '../../../stores/runtimeStore';
import {
  createTestComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

describe('Form component', () => {
  const createFormComponent = (propOverrides = {}) =>
    createTestComponent(ComponentType.FORM, propOverrides);

  const renderForm = (propOverrides = {}, children?: React.ReactNode, mode: 'edit' | 'preview' = 'edit') => {
    const component = createFormComponent(propOverrides);
    const Renderer = componentRegistry[ComponentType.FORM].renderer;
    const scope = createDefaultEvaluationScope();

    return render(
      <Renderer
        component={component}
        mode={mode}
        evaluationScope={scope}
        dataStore={{}}
      >
        {children}
      </Renderer>
    );
  };

  beforeEach(() => {
    // Reset the runtime store before each test
    useRuntimeStore.getState().reset();
  });

  it('renders as a <form> element', () => {
    const { container } = renderForm();
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('has noValidate attribute', () => {
    const { container } = renderForm();
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('novalidate');
  });

  it('renders children inside the form', () => {
    const { container } = renderForm({}, <div data-testid="child">Hello</div>);
    const form = container.querySelector('form');
    expect(form).toContainElement(screen.getByTestId('child'));
  });

  it('is registered as a container component', () => {
    const plugin = componentRegistry[ComponentType.FORM];
    expect(plugin.isContainer).toBe(true);
  });

  it('applies compact spacing gap', () => {
    const { container } = renderForm({ spacing: 'compact' });
    const form = container.querySelector('form');
    expect(form).toHaveStyle({ gap: '8px' });
  });

  it('applies normal spacing gap', () => {
    const { container } = renderForm({ spacing: 'normal' });
    const form = container.querySelector('form');
    expect(form).toHaveStyle({ gap: '16px' });
  });

  it('applies spacious spacing gap', () => {
    const { container } = renderForm({ spacing: 'spacious' });
    const form = container.querySelector('form');
    expect(form).toHaveStyle({ gap: '24px' });
  });

  it('uses column flex direction', () => {
    const { container } = renderForm();
    const form = container.querySelector('form');
    expect(form).toHaveStyle({ flexDirection: 'column' });
  });

  it('has plugin with correct type', () => {
    const plugin = componentRegistry[ComponentType.FORM];
    expect(plugin.type).toBe(ComponentType.FORM);
  });

  it('has palette config with label "Form"', () => {
    const plugin = componentRegistry[ComponentType.FORM];
    expect(plugin.paletteConfig.label).toBe('Form');
  });

  describe('validation summary', () => {
    it('does not render validation summary in edit mode', () => {
      const component = createFormComponent({ showValidationSummary: true });
      // Set form errors in the runtime store
      act(() => {
        useRuntimeStore.getState().setFormErrors(component.id, ['Name is required']);
      });

      const Renderer = componentRegistry[ComponentType.FORM].renderer;
      const scope = createDefaultEvaluationScope();
      render(
        <Renderer component={component} mode="edit" evaluationScope={scope} dataStore={{}}>
          <div>child</div>
        </Renderer>
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders validation summary in preview mode when showValidationSummary is true and errors exist', () => {
      const component = createFormComponent({ showValidationSummary: true });
      // Set form errors in the runtime store
      act(() => {
        useRuntimeStore.getState().setFormErrors(component.id, ['Name is required', 'Email is required']);
      });

      const Renderer = componentRegistry[ComponentType.FORM].renderer;
      const scope = createDefaultEvaluationScope();
      render(
        <Renderer component={component} mode="preview" evaluationScope={scope} dataStore={{}}>
          <div>child</div>
        </Renderer>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('2 validation errors');
      expect(alert).toHaveTextContent('Name is required');
      expect(alert).toHaveTextContent('Email is required');
    });

    it('does not render validation summary when showValidationSummary is false', () => {
      const component = createFormComponent({ showValidationSummary: false });
      act(() => {
        useRuntimeStore.getState().setFormErrors(component.id, ['Name is required']);
      });

      const Renderer = componentRegistry[ComponentType.FORM].renderer;
      const scope = createDefaultEvaluationScope();
      render(
        <Renderer component={component} mode="preview" evaluationScope={scope} dataStore={{}}>
          <div>child</div>
        </Renderer>
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not render validation summary when there are no errors', () => {
      renderForm({ showValidationSummary: true }, <div>child</div>, 'preview');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('native form submit', () => {
    it('prevents default form submission in preview mode', () => {
      const mockSubmitForm = jest.fn(() => ({ success: true, errors: [] }));
      const component = createFormComponent();
      const Renderer = componentRegistry[ComponentType.FORM].renderer;
      const scope = createDefaultEvaluationScope();

      const { container } = render(
        <Renderer
          component={component}
          mode="preview"
          evaluationScope={scope}
          dataStore={{}}
          actions={{
            createRecord: jest.fn() as any,
            updateRecord: jest.fn() as any,
            deleteRecord: jest.fn() as any,
            selectRecord: jest.fn(),
            updateVariable: jest.fn(),
            submitForm: mockSubmitForm as any,
          }}
        >
          <button type="submit">Submit</button>
        </Renderer>
      );

      const form = container.querySelector('form')!;
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const prevented = !form.dispatchEvent(submitEvent);
      // Native form submit should be prevented
      expect(prevented).toBe(true);
    });
  });
});
