import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RenderedComponent } from '@/components/RenderedComponent';
import { ComponentType } from 'types';
import '@testing-library/jest-dom';

describe('RenderedComponent Selection', () => {
  const mockOnSelect = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnUpdateComponents = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnDrop = jest.fn();
  const mockOnReparentCheck = jest.fn();
  const mockEvaluationScope = {};

  const baseProps = {
    allComponents: [],
    selectedComponentIds: [],
    onSelect: mockOnSelect,
    onUpdate: mockOnUpdate,
    onUpdateComponents: mockOnUpdateComponents,
    onDelete: mockOnDelete,
    onDrop: mockOnDrop,
    onReparentCheck: mockOnReparentCheck,
    mode: 'edit' as const,
    dataStore: {},
    evaluationScope: mockEvaluationScope,
  };

  describe('Button Component Selection', () => {
    const buttonComponent = {
      id: 'button1',
      type: ComponentType.BUTTON,
      props: {
        x: 0,
        y: 0,
        width: 100,
        height: 40,
        text: 'Click Me',
        backgroundColor: 'blue',
        textColor: 'white',
        actionType: 'none' as const,
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={buttonComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('BUTTON component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('button1', expect.any(Object));
    });

    it('should be selectable when disabled (boolean true)', () => {
      const disabledButton = {
        ...buttonComponent,
        props: { ...buttonComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledButton} {...baseProps} />);
      const wrapper = screen.getByLabelText('BUTTON component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('button1', expect.any(Object));
    });

    it('should be selectable when disabled (string "true")', () => {
      const disabledButton = {
        ...buttonComponent,
        props: { ...buttonComponent.props, disabled: 'true' },
      };
      render(<RenderedComponent component={disabledButton} {...baseProps} />);
      const wrapper = screen.getByLabelText('BUTTON component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('button1', expect.any(Object));
    });

    it('should be selectable when hidden (boolean true)', () => {
      const hiddenButton = {
        ...buttonComponent,
        props: { ...buttonComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenButton} {...baseProps} />);
      const wrapper = screen.getByLabelText('BUTTON component');
      // Component should be visible but hidden (visibility: hidden) in edit mode
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('button1', expect.any(Object));
    });

    it('should be selectable when hidden (expression)', () => {
      const hiddenButton = {
        ...buttonComponent,
        props: { ...buttonComponent.props, hidden: '{{ true }}' },
      };
      render(<RenderedComponent component={hiddenButton} {...baseProps} />);
      const wrapper = screen.getByLabelText('BUTTON component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('button1', expect.any(Object));
    });
  });

  describe('Input Component Selection', () => {
    const inputComponent = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        x: 0,
        y: 0,
        width: 200,
        height: 40,
        placeholder: 'Enter text',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={inputComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('INPUT component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('input1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledInput = {
        ...inputComponent,
        props: { ...inputComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledInput} {...baseProps} />);
      const wrapper = screen.getByLabelText('INPUT component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('input1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenInput = {
        ...inputComponent,
        props: { ...inputComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenInput} {...baseProps} />);
      const wrapper = screen.getByLabelText('INPUT component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('input1', expect.any(Object));
    });
  });

  describe('Checkbox Component Selection', () => {
    const checkboxComponent = {
      id: 'checkbox1',
      type: ComponentType.CHECKBOX,
      props: {
        x: 0,
        y: 0,
        width: 150,
        height: 30,
        label: 'Check me',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={checkboxComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('CHECKBOX component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('checkbox1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledCheckbox = {
        ...checkboxComponent,
        props: { ...checkboxComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledCheckbox} {...baseProps} />);
      const wrapper = screen.getByLabelText('CHECKBOX component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('checkbox1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenCheckbox = {
        ...checkboxComponent,
        props: { ...checkboxComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenCheckbox} {...baseProps} />);
      const wrapper = screen.getByLabelText('CHECKBOX component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('checkbox1', expect.any(Object));
    });
  });

  describe('Select Component Selection', () => {
    const selectComponent = {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        x: 0,
        y: 0,
        width: 200,
        height: 40,
        placeholder: 'Select option',
        options: 'Option1,Option2',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={selectComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('SELECT component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('select1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledSelect = {
        ...selectComponent,
        props: { ...selectComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledSelect} {...baseProps} />);
      const wrapper = screen.getByLabelText('SELECT component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('select1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenSelect = {
        ...selectComponent,
        props: { ...selectComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenSelect} {...baseProps} />);
      const wrapper = screen.getByLabelText('SELECT component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('select1', expect.any(Object));
    });
  });

  describe('Textarea Component Selection', () => {
    const textareaComponent = {
      id: 'textarea1',
      type: ComponentType.TEXTAREA,
      props: {
        x: 0,
        y: 0,
        width: 250,
        height: 100,
        placeholder: 'Enter text',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={textareaComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('TEXTAREA component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('textarea1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledTextarea = {
        ...textareaComponent,
        props: { ...textareaComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledTextarea} {...baseProps} />);
      const wrapper = screen.getByLabelText('TEXTAREA component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('textarea1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenTextarea = {
        ...textareaComponent,
        props: { ...textareaComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenTextarea} {...baseProps} />);
      const wrapper = screen.getByLabelText('TEXTAREA component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('textarea1', expect.any(Object));
    });
  });

  describe('Switch Component Selection', () => {
    const switchComponent = {
      id: 'switch1',
      type: ComponentType.SWITCH,
      props: {
        x: 0,
        y: 0,
        width: 180,
        height: 30,
        label: 'Toggle me',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={switchComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('SWITCH component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('switch1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledSwitch = {
        ...switchComponent,
        props: { ...switchComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledSwitch} {...baseProps} />);
      const wrapper = screen.getByLabelText('SWITCH component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('switch1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenSwitch = {
        ...switchComponent,
        props: { ...switchComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenSwitch} {...baseProps} />);
      const wrapper = screen.getByLabelText('SWITCH component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('switch1', expect.any(Object));
    });
  });

  describe('RadioGroup Component Selection', () => {
    const radioGroupComponent = {
      id: 'radio1',
      type: ComponentType.RADIO_GROUP,
      props: {
        x: 0,
        y: 0,
        width: 150,
        height: 80,
        options: 'Option1,Option2',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={radioGroupComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('RADIO_GROUP component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('radio1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledRadio = {
        ...radioGroupComponent,
        props: { ...radioGroupComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledRadio} {...baseProps} />);
      const wrapper = screen.getByLabelText('RADIO_GROUP component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('radio1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenRadio = {
        ...radioGroupComponent,
        props: { ...radioGroupComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenRadio} {...baseProps} />);
      const wrapper = screen.getByLabelText('RADIO_GROUP component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('radio1', expect.any(Object));
    });
  });

  describe('Label Component Selection', () => {
    const labelComponent = {
      id: 'label1',
      type: ComponentType.LABEL,
      props: {
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text: 'Label Text',
        fontSize: 14,
        fontWeight: 'normal' as const,
        color: '#000000',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={labelComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('LABEL component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('label1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledLabel = {
        ...labelComponent,
        props: { ...labelComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledLabel} {...baseProps} />);
      const wrapper = screen.getByLabelText('LABEL component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('label1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenLabel = {
        ...labelComponent,
        props: { ...labelComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenLabel} {...baseProps} />);
      const wrapper = screen.getByLabelText('LABEL component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('label1', expect.any(Object));
    });
  });

  describe('Image Component Selection', () => {
    const imageComponent = {
      id: 'image1',
      type: ComponentType.IMAGE,
      props: {
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={imageComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('IMAGE component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('image1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledImage = {
        ...imageComponent,
        props: { ...imageComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledImage} {...baseProps} />);
      const wrapper = screen.getByLabelText('IMAGE component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('image1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenImage = {
        ...imageComponent,
        props: { ...imageComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenImage} {...baseProps} />);
      const wrapper = screen.getByLabelText('IMAGE component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('image1', expect.any(Object));
    });
  });


  describe('Table Component Selection', () => {
    const tableComponent = {
      id: 'table1',
      type: ComponentType.TABLE,
      props: {
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        columns: 'Name:name,Age:age',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={tableComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('TABLE component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('table1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledTable = {
        ...tableComponent,
        props: { ...tableComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledTable} {...baseProps} />);
      const wrapper = screen.getByLabelText('TABLE component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('table1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenTable = {
        ...tableComponent,
        props: { ...tableComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenTable} {...baseProps} />);
      const wrapper = screen.getByLabelText('TABLE component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('table1', expect.any(Object));
    });
  });

  describe('Divider Component Selection', () => {
    const dividerComponent = {
      id: 'divider1',
      type: ComponentType.DIVIDER,
      props: {
        x: 0,
        y: 0,
        width: 300,
        height: 2,
        color: '#d1d5db',
        disabled: false,
      },
    };

    it('should be selectable when enabled', () => {
      render(<RenderedComponent component={dividerComponent} {...baseProps} />);
      const wrapper = screen.getByLabelText('DIVIDER component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('divider1', expect.any(Object));
    });

    it('should be selectable when disabled', () => {
      const disabledDivider = {
        ...dividerComponent,
        props: { ...dividerComponent.props, disabled: true },
      };
      render(<RenderedComponent component={disabledDivider} {...baseProps} />);
      const wrapper = screen.getByLabelText('DIVIDER component');
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('divider1', expect.any(Object));
    });

    it('should be selectable when hidden', () => {
      const hiddenDivider = {
        ...dividerComponent,
        props: { ...dividerComponent.props, hidden: true },
      };
      render(<RenderedComponent component={hiddenDivider} {...baseProps} />);
      const wrapper = screen.getByLabelText('DIVIDER component');
      expect(wrapper).toBeInTheDocument();
      fireEvent.mouseDown(wrapper);
      expect(mockOnSelect).toHaveBeenCalledWith('divider1', expect.any(Object));
    });
  });

});

