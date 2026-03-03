import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

import { ButtonPlugin } from '@/components/component-registry/Button';
import { InputPlugin } from '@/components/component-registry/Input';
import { SelectPlugin } from '@/components/component-registry/Select';
import { TextareaPlugin } from '@/components/component-registry/Textarea';
import { ComponentType, ActionHandlers } from '@/types';

const ButtonRenderer = ButtonPlugin.renderer;
const InputRenderer = InputPlugin.renderer;
const SelectRenderer = SelectPlugin.renderer;
const TextareaRenderer = TextareaPlugin.renderer;

describe('Feature: Field Labels', () => {
  describe('Input with label', () => {
    const baseComponent = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Enter text...',
        label: 'Email Address',
        required: true,
      },
    };

    it('should render label in edit mode', () => {
      render(<InputRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should render label in preview mode', () => {
      render(<InputRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should show required asterisk', () => {
      render(<InputRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should evaluate label expressions', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, label: '{{ "Dynamic Label" }}' },
      };
      render(<InputRenderer component={component} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Dynamic Label')).toBeInTheDocument();
    });

    it('should not render label when empty', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, label: '' },
      };
      const { container } = render(
        <InputRenderer component={component} mode="edit" dataStore={{}} evaluationScope={{}} />
      );
      expect(container.querySelector('label')).toBeNull();
    });
  });

  describe('Select with label', () => {
    const baseComponent = {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Choose...',
        options: 'A,B,C',
        label: 'Category',
        required: false,
      },
    };

    it('should render label in preview mode', () => {
      render(<SelectRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should render label in edit mode', () => {
      render(<SelectRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
  });

  describe('Textarea with label', () => {
    const baseComponent = {
      id: 'textarea1',
      type: ComponentType.TEXTAREA,
      props: {
        x: 0, y: 0, width: 200, height: 100,
        placeholder: 'Enter description...',
        label: 'Description',
        required: true,
      },
    };

    it('should render label in preview mode', () => {
      render(<TextareaRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should show required asterisk', () => {
      render(<TextareaRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });
});

describe('Feature: Button Submit Form', () => {
  const mockActions: ActionHandlers = {
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
    selectRecord: jest.fn(),
    updateVariable: jest.fn(),
    submitForm: jest.fn(),
  };

  const submitButtonComponent = {
    id: 'button1',
    type: ComponentType.BUTTON,
    props: {
      x: 0, y: 0, width: 120, height: 40,
      text: 'Submit',
      backgroundColor: '#4f46e5',
      textColor: '#fff',
      actionType: 'submitForm' as const,
      actionOnSubmitCode: 'console.log(formData)',
    },
  };

  it('should call actions.submitForm when button is clicked', () => {
    render(
      <ButtonRenderer
        component={submitButtonComponent}
        mode="preview"
        actions={mockActions}
        evaluationScope={{}}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(mockActions.submitForm).toHaveBeenCalledWith(
      'console.log(formData)',
      expect.any(Object),
      undefined,
      'button1'
    );
  });

  it('should not call submitForm in edit mode', () => {
    const spy = jest.fn();
    const actions = { ...mockActions, submitForm: spy };

    render(
      <ButtonRenderer
        component={submitButtonComponent}
        mode="edit"
        actions={actions}
        evaluationScope={{}}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not call submitForm when disabled', () => {
    const spy = jest.fn();
    const actions = { ...mockActions, submitForm: spy };
    const component = {
      ...submitButtonComponent,
      props: { ...submitButtonComponent.props, disabled: true },
    };

    render(
      <ButtonRenderer
        component={component}
        mode="preview"
        actions={actions}
        evaluationScope={{}}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('Feature: Searchable Select', () => {
  const searchableComponent = {
    id: 'select1',
    type: ComponentType.SELECT,
    props: {
      x: 0, y: 0, width: 200, height: 40,
      placeholder: 'Search...',
      options: 'Apple,Banana,Cherry,Date,Elderberry',
      searchable: true,
      label: '',
    },
  };

  it('should render combobox role in preview mode when searchable', () => {
    render(
      <SelectRenderer
        component={searchableComponent}
        mode="preview"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render custom combobox in edit mode when searchable (read-only)', () => {
    const { container } = render(
      <SelectRenderer
        component={searchableComponent}
        mode="edit"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    // Custom combobox should render in edit mode for visual consistency (BUG-011 fix)
    expect(container.querySelector('input[role="combobox"]')).toBeInTheDocument();
    // It should be read-only in edit mode
    expect(container.querySelector('input[role="combobox"]')).toHaveAttribute('readonly');
  });

  it('should render native select when searchable is false', () => {
    const component = {
      ...searchableComponent,
      props: { ...searchableComponent.props, searchable: false },
    };
    const { container } = render(
      <SelectRenderer
        component={component}
        mode="preview"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    expect(container.querySelector('select')).toBeInTheDocument();
  });

  it('should open dropdown on focus', () => {
    render(
      <SelectRenderer
        component={searchableComponent}
        mode="preview"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should filter options as user types', () => {
    render(
      <SelectRenderer
        component={searchableComponent}
        mode="preview"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'an' } });

    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    // "Banana" contains "an", and no other options match
    const optionTexts = options.map(o => o.textContent);
    expect(optionTexts).toContain('Banana');
    expect(optionTexts).not.toContain('Cherry');
  });

  it('should show "No matches" when filter yields no results', () => {
    render(
      <SelectRenderer
        component={searchableComponent}
        mode="preview"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzz' } });

    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('should select option on click', () => {
    const onUpdate = jest.fn();
    render(
      <SelectRenderer
        component={searchableComponent}
        mode="preview"
        dataStore={{}}
        onUpdateDataStore={onUpdate}
        evaluationScope={{}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const option = screen.getByText('Cherry');
    fireEvent.mouseDown(option);

    expect(onUpdate).toHaveBeenCalledWith('select1', 'Cherry');
  });

  it('should close dropdown on Escape', () => {
    render(
      <SelectRenderer
        component={searchableComponent}
        mode="preview"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should support keyboard navigation with ArrowDown/ArrowUp', () => {
    render(
      <SelectRenderer
        component={searchableComponent}
        mode="preview"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // ArrowDown to activate first item
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // The combobox should have aria-activedescendant set
    const activeDescendant = input.getAttribute('aria-activedescendant');
    expect(activeDescendant).toBeTruthy();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <SelectRenderer
        component={searchableComponent}
        mode="preview"
        dataStore={{}}
        evaluationScope={{}}
      />
    );
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-expanded');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input).toHaveAttribute('aria-controls', 'select1-listbox');
  });
});
