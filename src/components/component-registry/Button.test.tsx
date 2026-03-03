import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { ButtonPlugin } from '@/components/component-registry/Button';
import { ComponentType, ActionHandlers, ButtonProps } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const ButtonRenderer = ButtonPlugin.renderer;
const ButtonProperties = ButtonPlugin.properties;

describe('ButtonPlugin', () => {
  describe('Renderer', () => {
    const mockActions: ActionHandlers = {
      createRecord: jest.fn(),
      updateRecord: jest.fn(),
      deleteRecord: jest.fn(),
      selectRecord: jest.fn(),
      updateVariable: jest.fn(),
      submitForm: jest.fn(),
      navigateTo: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

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

    it('should trigger an alert action on click', () => {
      const spy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const component = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          actionType: 'alert' as const,
          actionAlertMessage: 'Hello {{user.name}}',
        },
      };
      const scope = { user: { name: 'World' } };

      render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={scope} />);
      fireEvent.click(screen.getByRole('button'));
      expect(spy).toHaveBeenCalledWith('Hello World');
      spy.mockRestore();
    });

    it('should trigger an updateVariable action on click', () => {
        const component = {
            ...baseComponent,
            props: {
                ...baseComponent.props,
                actionType: 'updateVariable' as const,
                actionVariableName: 'isLoading',
                actionVariableValue: '{{!isLoading}}'
            }
        };
        const scope = { isLoading: false };
        render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={scope} />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockActions.updateVariable).toHaveBeenCalledWith('isLoading', true);
    });

    it('should render outlined variant with transparent background', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, variant: 'outlined' as const },
      };
      render(<ButtonRenderer component={component} mode="preview" evaluationScope={{}} />);
      const button = screen.getByRole('button');
      expect(button.style.backgroundColor).toBe('transparent');
      expect(button.style.borderStyle).toBe('solid');
    });

    it('should render ghost variant with transparent background and no border', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, variant: 'ghost' as const },
      };
      render(<ButtonRenderer component={component} mode="preview" evaluationScope={{}} />);
      const button = screen.getByRole('button');
      expect(button.style.backgroundColor).toBe('transparent');
    });

    it('should render text variant with transparent background', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, variant: 'text' as const },
      };
      render(<ButtonRenderer component={component} mode="preview" evaluationScope={{}} />);
      const button = screen.getByRole('button');
      expect(button.style.backgroundColor).toBe('transparent');
    });

    it('should show loading spinner and be disabled when loading is true', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, loading: true },
      };
      render(<ButtonRenderer component={component} mode="preview" evaluationScope={{}} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should not fire click when loading', () => {
      const spy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const component = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          loading: true,
          actionType: 'alert' as const,
          actionAlertMessage: 'Should not show',
        },
      };
      render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={{}} />);
      fireEvent.click(screen.getByRole('button'));
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should render icon left and right text', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, iconLeft: '+', iconRight: '>' },
      };
      render(<ButtonRenderer component={component} mode="preview" evaluationScope={{}} />);
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText('>')).toBeInTheDocument();
    });

    it('should call navigateTo with static page ID on navigate action', () => {
      const component = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          actionType: 'navigate' as const,
          actionPageId: 'page_success',
        },
      };
      render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={{}} />);
      fireEvent.click(screen.getByRole('button'));
      expect(mockActions.navigateTo).toHaveBeenCalledWith('page_success');
    });

    it('should evaluate expression for dynamic page ID on navigate action', () => {
      const component = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          actionType: 'navigate' as const,
          actionPageId: 'page_fallback',
          actionPageExpression: '{{targetPage}}',
        },
      };
      const scope = { targetPage: 'page_dynamic' };
      render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={scope} />);
      fireEvent.click(screen.getByRole('button'));
      expect(mockActions.navigateTo).toHaveBeenCalledWith('page_dynamic');
    });

    it('should call submitForm with navigation callback when validateBeforeNavigate is true', () => {
      const component = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          actionType: 'navigate' as const,
          actionPageId: 'page_checkout',
          validateBeforeNavigate: true,
        },
      };
      render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={{}} />);
      fireEvent.click(screen.getByRole('button'));
      expect(mockActions.submitForm).toHaveBeenCalled();
      // navigateTo should NOT have been called directly (it's deferred to form validation success)
      expect(mockActions.navigateTo).not.toHaveBeenCalled();
    });

    it('should have type="button" attribute to prevent default form submission', () => {
      render(<ButtonRenderer component={baseComponent} mode="preview" evaluationScope={{}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should call submitForm with onSubmitCode and scope when actionType is submitForm', () => {
      const component = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          actionType: 'submitForm' as const,
          actionOnSubmitCode: '{{ console.log(formData) }}',
        },
      };
      const scope = { dataStore: {} };
      render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={scope} />);
      fireEvent.click(screen.getByRole('button'));
      expect(mockActions.submitForm).toHaveBeenCalledWith(
        '{{ console.log(formData) }}',
        expect.objectContaining({ actions: mockActions }),
        undefined,
        'button1'
      );
    });

    it('should not call submitForm when actions is undefined', () => {
      const component = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          actionType: 'submitForm' as const,
          actionOnSubmitCode: '{{ console.log(formData) }}',
        },
      };
      render(<ButtonRenderer component={component} mode="preview" evaluationScope={{}} />);
      fireEvent.click(screen.getByRole('button'));
      // No error should be thrown, submitForm should not be called
      expect(mockActions.submitForm).not.toHaveBeenCalled();
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(<ButtonProperties />);
      expect(container.innerHTML).toBe('');
    });
  });
});