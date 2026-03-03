import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TreeView } from '@/components/TreeView';
import { ComponentType, AppDefinition } from 'types';
import '@testing-library/jest-dom';

describe('TreeView Component Selection', () => {
  const mockOnSelectPage = jest.fn();
  const mockOnSelectComponent = jest.fn();
  const mockOnToggleCollapse = jest.fn();

  const createAppDefinition = (components: any[]): AppDefinition => ({
    id: 'app1',
    name: 'Test App',
    createdAt: '2024-01-01T00:00:00Z',
    lastModifiedAt: '2024-01-01T00:00:00Z',
    pages: [
      {
        id: 'page1',
        name: 'Page 1',
      },
    ],
    components,
    theme: {
      colors: {
        primary: '#000000',
        onPrimary: '#ffffff',
        secondary: '#000000',
        onSecondary: '#ffffff',
        background: '#ffffff',
        surface: '#ffffff',
        text: '#000000',
        border: '#e5e5e5',
      },
      font: {
        family: 'Arial',
      },
      border: {
        width: '1px',
        style: 'solid',
      },
      radius: {
        default: '4px',
      },
      spacing: {
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseProps = {
    isCollapsed: false,
    onToggleCollapse: mockOnToggleCollapse,
    currentPageId: 'page1',
    selectedComponentIds: [],
    onSelectPage: mockOnSelectPage,
    onSelectComponent: mockOnSelectComponent,
  };

  describe('Button Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'button1',
        type: ComponentType.BUTTON,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          text: 'Click Me',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const buttonNode = screen.getByText('Button');
      fireEvent.click(buttonNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('button1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'button1',
          type: ComponentType.BUTTON,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 40,
            text: 'Click Me',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const buttonNode = screen.getByText('Button');
      fireEvent.click(buttonNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('button1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'button1',
          type: ComponentType.BUTTON,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 40,
            text: 'Click Me',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const buttonNode = screen.getByText('Button');
      fireEvent.click(buttonNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('button1', 'page1');
    });
  });

  describe('Input Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'input1',
        type: ComponentType.INPUT,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 200,
          height: 40,
          placeholder: 'Enter text',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const inputNode = screen.getByText('Input');
      fireEvent.click(inputNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('input1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'input1',
          type: ComponentType.INPUT,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 200,
            height: 40,
            placeholder: 'Enter text',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const inputNode = screen.getByText('Input');
      fireEvent.click(inputNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('input1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'input1',
          type: ComponentType.INPUT,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 200,
            height: 40,
            placeholder: 'Enter text',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const inputNode = screen.getByText('Input');
      fireEvent.click(inputNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('input1', 'page1');
    });
  });

  describe('Checkbox Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'checkbox1',
        type: ComponentType.CHECKBOX,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 150,
          height: 30,
          label: 'Check me',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const checkboxNode = screen.getByText('Checkbox');
      fireEvent.click(checkboxNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('checkbox1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'checkbox1',
          type: ComponentType.CHECKBOX,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 150,
            height: 30,
            label: 'Check me',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const checkboxNode = screen.getByText('Checkbox');
      fireEvent.click(checkboxNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('checkbox1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'checkbox1',
          type: ComponentType.CHECKBOX,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 150,
            height: 30,
            label: 'Check me',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const checkboxNode = screen.getByText('Checkbox');
      fireEvent.click(checkboxNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('checkbox1', 'page1');
    });
  });

  describe('Select Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'select1',
        type: ComponentType.SELECT,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 200,
          height: 40,
          options: 'Option1,Option2',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const selectNode = screen.getByText('Select');
      fireEvent.click(selectNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('select1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'select1',
          type: ComponentType.SELECT,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 200,
            height: 40,
            options: 'Option1,Option2',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const selectNode = screen.getByText('Select');
      fireEvent.click(selectNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('select1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'select1',
          type: ComponentType.SELECT,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 200,
            height: 40,
            options: 'Option1,Option2',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const selectNode = screen.getByText('Select');
      fireEvent.click(selectNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('select1', 'page1');
    });
  });

  describe('Textarea Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'textarea1',
        type: ComponentType.TEXTAREA,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 250,
          height: 100,
          placeholder: 'Enter text',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const textareaNode = screen.getByText('Textarea');
      fireEvent.click(textareaNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('textarea1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'textarea1',
          type: ComponentType.TEXTAREA,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 250,
            height: 100,
            placeholder: 'Enter text',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const textareaNode = screen.getByText('Textarea');
      fireEvent.click(textareaNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('textarea1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'textarea1',
          type: ComponentType.TEXTAREA,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 250,
            height: 100,
            placeholder: 'Enter text',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const textareaNode = screen.getByText('Textarea');
      fireEvent.click(textareaNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('textarea1', 'page1');
    });
  });

  describe('Switch Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'switch1',
        type: ComponentType.SWITCH,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 180,
          height: 30,
          label: 'Toggle me',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const switchNode = screen.getByText('Switch');
      fireEvent.click(switchNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('switch1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'switch1',
          type: ComponentType.SWITCH,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 180,
            height: 30,
            label: 'Toggle me',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const switchNode = screen.getByText('Switch');
      fireEvent.click(switchNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('switch1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'switch1',
          type: ComponentType.SWITCH,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 180,
            height: 30,
            label: 'Toggle me',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const switchNode = screen.getByText('Switch');
      fireEvent.click(switchNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('switch1', 'page1');
    });
  });

  describe('RadioGroup Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'radio1',
        type: ComponentType.RADIO_GROUP,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 150,
          height: 80,
          options: 'Option1,Option2',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const radioNode = screen.getByText('Radio Group');
      fireEvent.click(radioNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('radio1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'radio1',
          type: ComponentType.RADIO_GROUP,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 150,
            height: 80,
            options: 'Option1,Option2',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const radioNode = screen.getByText('Radio Group');
      fireEvent.click(radioNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('radio1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'radio1',
          type: ComponentType.RADIO_GROUP,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 150,
            height: 80,
            options: 'Option1,Option2',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const radioNode = screen.getByText('Radio Group');
      fireEvent.click(radioNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('radio1', 'page1');
    });
  });

  describe('Label Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'label1',
        type: ComponentType.LABEL,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 100,
          height: 30,
          text: 'Label Text',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const labelNode = screen.getByText('Label');
      fireEvent.click(labelNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('label1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'label1',
          type: ComponentType.LABEL,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 30,
            text: 'Label Text',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const labelNode = screen.getByText('Label');
      fireEvent.click(labelNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('label1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'label1',
          type: ComponentType.LABEL,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 30,
            text: 'Label Text',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const labelNode = screen.getByText('Label');
      fireEvent.click(labelNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('label1', 'page1');
    });
  });

  describe('Image Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'image1',
        type: ComponentType.IMAGE,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 200,
          height: 150,
          src: 'https://example.com/image.jpg',
          alt: 'Test image',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const imageNode = screen.getByText('Image');
      fireEvent.click(imageNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('image1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'image1',
          type: ComponentType.IMAGE,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 200,
            height: 150,
            src: 'https://example.com/image.jpg',
            alt: 'Test image',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const imageNode = screen.getByText('Image');
      fireEvent.click(imageNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('image1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'image1',
          type: ComponentType.IMAGE,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 200,
            height: 150,
            src: 'https://example.com/image.jpg',
            alt: 'Test image',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const imageNode = screen.getByText('Image');
      fireEvent.click(imageNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('image1', 'page1');
    });
  });


  describe('Table Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'table1',
        type: ComponentType.TABLE,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          columns: 'Name:name,Age:age',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const tableNode = screen.getByText('Table');
      fireEvent.click(tableNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('table1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'table1',
          type: ComponentType.TABLE,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 400,
            height: 300,
            columns: 'Name:name,Age:age',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const tableNode = screen.getByText('Table');
      fireEvent.click(tableNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('table1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'table1',
          type: ComponentType.TABLE,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 400,
            height: 300,
            columns: 'Name:name,Age:age',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const tableNode = screen.getByText('Table');
      fireEvent.click(tableNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('table1', 'page1');
    });
  });

  describe('Divider Component Selection in TreeView', () => {
    const appDefinition = createAppDefinition([
      {
        id: 'divider1',
        type: ComponentType.DIVIDER,
        pageId: 'page1',
        props: {
          x: 0,
          y: 0,
          width: 300,
          height: 2,
          color: '#d1d5db',
          disabled: false,
        },
      },
    ]);

    it('should be selectable when enabled', () => {
      render(<TreeView appDefinition={appDefinition} {...baseProps} />);
      const dividerNode = screen.getByText('Divider');
      fireEvent.click(dividerNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('divider1', 'page1');
    });

    it('should be selectable when disabled', () => {
      const appDefWithDisabled = createAppDefinition([
        {
          id: 'divider1',
          type: ComponentType.DIVIDER,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 300,
            height: 2,
            color: '#d1d5db',
            disabled: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithDisabled} {...baseProps} />);
      const dividerNode = screen.getByText('Divider');
      fireEvent.click(dividerNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('divider1', 'page1');
    });

    it('should be selectable when hidden', () => {
      const appDefWithHidden = createAppDefinition([
        {
          id: 'divider1',
          type: ComponentType.DIVIDER,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 300,
            height: 2,
            color: '#d1d5db',
            hidden: true,
          },
        },
      ]);
      render(<TreeView appDefinition={appDefWithHidden} {...baseProps} />);
      const dividerNode = screen.getByText('Divider');
      fireEvent.click(dividerNode);
      expect(mockOnSelectComponent).toHaveBeenCalledWith('divider1', 'page1');
    });
  });

});

