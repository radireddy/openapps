import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormPlugin } from '@/components/component-registry/Form';
import { ComponentType, FormProps } from '@/types';
import { useRuntimeStore } from '@/stores/runtimeStore';
import '@testing-library/jest-dom';

const FormRenderer = FormPlugin.renderer;

describe('FormPlugin', () => {
  describe('Plugin metadata', () => {
    it('should have FORM type', () => {
      expect(FormPlugin.type).toBe(ComponentType.FORM);
    });

    it('should be a container', () => {
      expect(FormPlugin.isContainer).toBe(true);
    });

    it('should return null for properties', () => {
      expect(FormPlugin.properties()).toBeNull();
    });

    it('should have correct palette label', () => {
      expect(FormPlugin.paletteConfig.label).toBe('Form');
    });
  });

  describe('Renderer', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      useRuntimeStore.getState().reset();
    });

    const baseComponent = {
      id: 'form1',
      type: ComponentType.FORM,
      props: {
        x: 0, y: 0, width: '100%', height: 'auto',
        backgroundColor: '#ffffff',
        borderWidth: '0',
        borderColor: '#d1d5db',
        borderRadius: '8px',
        padding: '16px',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        gap: '16px',
        formId: '',
        onSubmit: '',
        resetOnSubmit: false,
        showValidationSummary: false,
        spacing: 'normal',
        labelPlacement: 'top',
      } as FormProps,
    };

    const evaluationScope = {
      theme: {
        colors: { surface: '#ffffff', border: '#d1d5db' },
        spacing: { md: '16px' },
        border: { width: '0' },
        radius: { default: '8px' },
      },
    };

    it('should render children', () => {
      render(
        <FormRenderer component={baseComponent} mode="edit" evaluationScope={evaluationScope}>
          <div>Form Field</div>
        </FormRenderer>
      );
      expect(screen.getByText('Form Field')).toBeInTheDocument();
    });

    it('should render a form element with noValidate', () => {
      const { container } = render(
        <FormRenderer component={baseComponent} mode="edit" evaluationScope={evaluationScope}>
          <div>Content</div>
        </FormRenderer>
      );
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('novalidate');
    });

    it('should not show validation summary in edit mode', () => {
      // Set form errors in the runtime store
      useRuntimeStore.getState().setFormErrors('form1', ['Field is required']);

      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, showValidationSummary: true },
      };
      render(
        <FormRenderer component={comp} mode="edit" evaluationScope={evaluationScope} />
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should show validation summary with single error in preview mode', () => {
      useRuntimeStore.getState().setFormErrors('form1', ['Name is required']);

      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, showValidationSummary: true },
      };
      render(
        <FormRenderer component={comp} mode="preview" evaluationScope={evaluationScope} />
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('1 validation error')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('should show validation summary with multiple errors', () => {
      useRuntimeStore.getState().setFormErrors('form1', [
        'Name is required',
        'Email is invalid',
        'Age must be positive',
      ]);

      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, showValidationSummary: true },
      };
      render(
        <FormRenderer component={comp} mode="preview" evaluationScope={evaluationScope} />
      );
      expect(screen.getByText('3 validation errors')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
      expect(screen.getByText('Age must be positive')).toBeInTheDocument();
    });

    it('should not show validation summary when there are no errors', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, showValidationSummary: true },
      };
      render(
        <FormRenderer component={comp} mode="preview" evaluationScope={evaluationScope} />
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should apply compact spacing gap', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, spacing: 'compact' },
      };
      const { container } = render(
        <FormRenderer component={comp} mode="edit" evaluationScope={evaluationScope} />
      );
      const form = container.querySelector('form') as HTMLElement;
      expect(form.style.gap).toBe('8px');
    });

    it('should apply spacious spacing gap', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, spacing: 'spacious' },
      };
      const { container } = render(
        <FormRenderer component={comp} mode="edit" evaluationScope={evaluationScope} />
      );
      const form = container.querySelector('form') as HTMLElement;
      expect(form.style.gap).toBe('24px');
    });

    it('should apply normal spacing gap by default', () => {
      const { container } = render(
        <FormRenderer component={baseComponent} mode="edit" evaluationScope={evaluationScope} />
      );
      const form = container.querySelector('form') as HTMLElement;
      expect(form.style.gap).toBe('16px');
    });

    it('should prevent default form submit and call submitForm action in preview mode', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const { container } = render(
        <FormRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={evaluationScope}
          actions={mockActions}
        >
          <input type="text" />
        </FormRenderer>
      );

      // Simulate native form submit (e.g. pressing Enter in an input)
      const form = container.querySelector('form')!;
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      // Use onSubmitCapture on the wrapper div
      const wrapperDiv = form.parentElement!;
      fireEvent.submit(form);

      expect(mockActions.submitForm).toHaveBeenCalledWith(
        undefined,
        evaluationScope,
        undefined,
        'form1'
      );
    });

    it('should not call submitForm in edit mode', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const { container } = render(
        <FormRenderer
          component={baseComponent}
          mode="edit"
          evaluationScope={evaluationScope}
          actions={mockActions}
        />
      );

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      expect(mockActions.submitForm).not.toHaveBeenCalled();
    });

    it('should set flexDirection to column', () => {
      const { container } = render(
        <FormRenderer component={baseComponent} mode="edit" evaluationScope={evaluationScope} />
      );
      const form = container.querySelector('form') as HTMLElement;
      expect(form.style.flexDirection).toBe('column');
    });
  });
});
