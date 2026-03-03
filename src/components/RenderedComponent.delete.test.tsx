import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RenderedComponent } from '@/components/RenderedComponent';
import { ComponentType } from 'types';
import '@testing-library/jest-dom';

describe('RenderedComponent Delete Functionality', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createComponent = (type: ComponentType, id: string, props: any = {}) => ({
    id,
    type,
    pageId: 'page1',
    props: {
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      ...props,
    },
  });

  const testDeleteForComponent = (componentType: ComponentType, componentName: string, defaultProps: any = {}) => {
    describe(`${componentName} Component Delete`, () => {
      it('should delete component when delete button is clicked after selecting in canvas', async () => {
        const component = createComponent(componentType, 'comp1', defaultProps);
        
        // Create a wrapper component that manages selection state like the real app
        const TestWrapper = () => {
          const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
          
          const handleSelect = (id: string, e: React.MouseEvent) => {
            setSelectedIds([id]);
            mockOnSelect(id, e);
          };
          
          return (
            <RenderedComponent 
              component={component} 
              {...baseProps}
              selectedComponentIds={selectedIds}
              onSelect={handleSelect}
            />
          );
        };
        
        render(<TestWrapper />);

        // Select the component by clicking it
        const wrapper = screen.getByLabelText(`${componentType} component`);
        await userEvent.click(wrapper);
        expect(mockOnSelect).toHaveBeenCalledWith('comp1', expect.any(Object));

        // Wait for delete button to appear
        const deleteButton = await screen.findByLabelText('Delete Component');
        expect(deleteButton).toBeInTheDocument();
        
        // Verify the delete button is actually visible and clickable
        expect(deleteButton).toBeVisible();
        const deleteButtonElement = deleteButton as HTMLElement;
        expect(deleteButtonElement.style.pointerEvents).toBe('auto');
        
        // Click the delete button - simulate both mousedown and click to match real behavior
        // First trigger mousedown to ensure it's not blocked
        fireEvent.mouseDown(deleteButton);
        // Then trigger click
        await userEvent.click(deleteButton);
        
        // Verify delete was called
        expect(mockOnDelete).toHaveBeenCalledWith('comp1');
      });

      it('should delete component when delete button is clicked for disabled component', async () => {
        const component = createComponent(componentType, 'comp1', { ...defaultProps, disabled: true });
        
        const TestWrapper = () => {
          const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
          
          const handleSelect = (id: string, e: React.MouseEvent) => {
            setSelectedIds([id]);
            mockOnSelect(id, e);
          };
          
          return (
            <RenderedComponent 
              component={component} 
              {...baseProps}
              selectedComponentIds={selectedIds}
              onSelect={handleSelect}
            />
          );
        };
        
        render(<TestWrapper />);

        // Select the disabled component
        const wrapper = screen.getByLabelText(`${componentType} component`);
        await userEvent.click(wrapper);
        expect(mockOnSelect).toHaveBeenCalledWith('comp1', expect.any(Object));

        // Delete button should still be visible and clickable
        const deleteButton = await screen.findByLabelText('Delete Component');
        expect(deleteButton).toBeInTheDocument();
        
        await userEvent.click(deleteButton);
        expect(mockOnDelete).toHaveBeenCalledWith('comp1');
      });

      it('should delete component when delete button is clicked for hidden component', async () => {
        const component = createComponent(componentType, 'comp1', { ...defaultProps, hidden: true });
        
        const TestWrapper = () => {
          const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
          
          const handleSelect = (id: string, e: React.MouseEvent) => {
            setSelectedIds([id]);
            mockOnSelect(id, e);
          };
          
          return (
            <RenderedComponent 
              component={component} 
              {...baseProps}
              selectedComponentIds={selectedIds}
              onSelect={handleSelect}
            />
          );
        };
        
        render(<TestWrapper />);
        
        // Select the hidden component (it should still be selectable)
        const wrapper = screen.getByLabelText(`${componentType} component`);
        await userEvent.click(wrapper);
        expect(mockOnSelect).toHaveBeenCalledWith('comp1', expect.any(Object));

        // Delete button should still be visible and clickable
        const deleteButton = await screen.findByLabelText('Delete Component');
        expect(deleteButton).toBeInTheDocument();
        
        await userEvent.click(deleteButton);
        expect(mockOnDelete).toHaveBeenCalledWith('comp1');
      });
    });
  };

  // Test delete for all component types
  testDeleteForComponent(ComponentType.BUTTON, 'Button', { text: 'Click Me', actionType: 'none' });
  testDeleteForComponent(ComponentType.INPUT, 'Input', { placeholder: 'Enter text' });
  testDeleteForComponent(ComponentType.CHECKBOX, 'Checkbox', { label: 'Check me' });
  testDeleteForComponent(ComponentType.SELECT, 'Select', { placeholder: 'Select option', options: 'Option1,Option2' });
  testDeleteForComponent(ComponentType.TEXTAREA, 'Textarea', { placeholder: 'Enter text' });
  testDeleteForComponent(ComponentType.SWITCH, 'Switch', { label: 'Toggle me' });
  testDeleteForComponent(ComponentType.RADIO_GROUP, 'RadioGroup', { options: 'Option1,Option2' });
  testDeleteForComponent(ComponentType.LABEL, 'Label', { text: 'Label Text', fontSize: 14, fontWeight: 'normal', color: '#000000' });
  testDeleteForComponent(ComponentType.TABLE, 'Table', { columns: 'Name:name,Age:age' });
  testDeleteForComponent(ComponentType.IMAGE, 'Image', { src: 'https://example.com/image.jpg', alt: 'Test image' });
  testDeleteForComponent(ComponentType.DIVIDER, 'Divider', { color: '#d1d5db' });
});

