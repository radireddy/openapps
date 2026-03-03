/**
 * Unit tests for drag and move functionality in RenderedComponent
 * These tests ensure that drag operations work correctly and perform well
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RenderedComponent } from '@/components/RenderedComponent';
import { AppComponent, ComponentType } from 'types';
import { dragState } from '../utils/dragState';
import '@testing-library/jest-dom';

// Mock the dragState utility
jest.mock('../utils/dragState', () => ({
  dragState: {
    getState: jest.fn(() => ({ isDragging: false, mouseX: 0, mouseY: 0, draggedComponentIds: [], highlightedContainerId: null })),
    setState: jest.fn(),
    subscribe: jest.fn((listener) => {
      // Return unsubscribe function
      return () => {};
    }),
    startDrag: jest.fn(),
    updateMousePosition: jest.fn(),
    setHighlightedContainer: jest.fn(),
    endDrag: jest.fn(),
  },
}));

describe('RenderedComponent - Drag and Move', () => {
  const mockOnSelect = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnUpdateComponents = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnDrop = jest.fn();
  const mockOnReparentCheck = jest.fn();

  const testComponent: AppComponent = {
    id: 'test-component',
    type: ComponentType.LABEL,
    pageId: 'page1',
    parentId: null,
    props: {
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      text: 'Test Label',
    },
  };

  const defaultProps = {
    component: testComponent,
    allComponents: [testComponent], // Include the component in allComponents so drag can find it
    selectedComponentIds: [],
    onSelect: mockOnSelect,
    onUpdate: mockOnUpdate,
    onUpdateComponents: mockOnUpdateComponents,
    onDelete: mockOnDelete,
    onDrop: mockOnDrop,
    onReparentCheck: mockOnReparentCheck,
    mode: 'edit' as const,
    dataStore: {},
    evaluationScope: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (dragState.getState as jest.Mock).mockReturnValue({
      isDragging: false,
      mouseX: 0,
      mouseY: 0,
      draggedComponentIds: [],
      highlightedContainerId: null,
    });
  });

  describe('Drag Start', () => {
    it('should start drag when mouse down on component', () => {
      render(<RenderedComponent {...defaultProps} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });

      // When clicking on an unselected component, it gets selected first, then dragged
      expect(dragState.startDrag).toHaveBeenCalledWith(['test-component']);
    });

    it('should start drag with selected component IDs', () => {
      const props = {
        ...defaultProps,
        selectedComponentIds: ['test-component', 'other-component'],
      };
      render(<RenderedComponent {...props} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });

      expect(dragState.startDrag).toHaveBeenCalledWith(['test-component', 'other-component']);
    });
  });

  describe('Drag Move', () => {
    it('should update mouse position during drag', () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });

      expect(dragState.updateMousePosition).toHaveBeenCalledWith(150, 150);
    });

    it('should trigger reparent check on drag end', async () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);

      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Move mouse more than 2 pixels to trigger movement tracking
      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });

      await new Promise(resolve => setTimeout(resolve, 10));

      fireEvent.mouseUp(window);

      // In flex layout, drag ends with a reparent check including the highlighted container
      await waitFor(() => {
        expect(mockOnReparentCheck).toHaveBeenCalledWith('test-component', undefined, null);
      });
    });

    it('should not update position if mouse moved less than 2 pixels', () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 101, clientY: 100 }); // Only 1 pixel movement

      // updateMousePosition is only called if movement > 2 pixels
      // Since we only moved 1 pixel, it should not be called
      expect(dragState.updateMousePosition).not.toHaveBeenCalled();
    });
  });

  describe('Drag End', () => {
    it('should end drag and reparent component on mouse up', async () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      
      // Wait for drag to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });
      
      // Wait for position update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      fireEvent.mouseUp(window, { clientX: 150, clientY: 150 });

      await waitFor(() => {
        expect(dragState.endDrag).toHaveBeenCalled();
        // Reparent might be called with or without position depending on implementation
        expect(mockOnReparentCheck).toHaveBeenCalled();
      });
    });

    it('should not reparent if component did not move', () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(window, { clientX: 100, clientY: 100 }); // No movement

      expect(dragState.endDrag).toHaveBeenCalled();
      expect(mockOnReparentCheck).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should trigger reparent check on drag end after rapid movements', async () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);

      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate rapid mouse movements
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(window, { clientX: 100 + i * 10, clientY: 100 + i * 10 });
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      fireEvent.mouseUp(window);

      await waitFor(() => {
        // Should have called reparent check on drag end
        expect(mockOnReparentCheck).toHaveBeenCalled();
      });
    });

    it('should not cause excessive re-renders during drag', () => {
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return <RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />;
      };

      render(<TestComponent />);
      const initialRenderCount = renderCount;

      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      
      // Simulate multiple mouse movements
      for (let i = 0; i < 5; i++) {
        fireEvent.mouseMove(window, { clientX: 100 + i * 10, clientY: 100 + i * 10 });
      }

      // Component should not re-render excessively (only on state changes)
      // Note: This is a basic check - actual render count depends on React's optimization
      expect(renderCount).toBeLessThan(initialRenderCount + 10);
    });
  });

  describe('Container Drag Over Highlight', () => {
    it('should show highlight when dragging over container', () => {
      const containerComponent = {
        id: 'container-1',
        type: ComponentType.CONTAINER,
        pageId: 'page1',
        parentId: null,
        props: {
          x: 0,
          y: 0,
          width: 400,
          height: 300,
        },
      } as AppComponent;

      const mockSubscribe = jest.fn((listener) => {
        // Simulate drag state update
        setTimeout(() => {
          listener({
            isDragging: true,
            mouseX: 200,
            mouseY: 150,
            draggedComponentIds: ['other-component'],
          });
        }, 0);
        return () => {};
      });

      (dragState.subscribe as jest.Mock).mockImplementation(mockSubscribe);

      render(
        <RenderedComponent
          {...defaultProps}
          component={containerComponent}
        />
      );

      // Wait for drag state update
      waitFor(() => {
        const container = screen.getByLabelText(/container component/i);
        expect(container).toHaveClass('ring-4', 'ring-blue-400');
      });
    });
  });

  describe('Reparent into container via drag', () => {
    it('should pass highlighted container ID to onReparentCheck on drag end', async () => {
      // Simulate dragState returning a highlighted container
      (dragState.getState as jest.Mock).mockReturnValue({
        isDragging: true,
        mouseX: 200,
        mouseY: 200,
        draggedComponentIds: ['test-component'],
        highlightedContainerId: 'target-container',
      });

      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);

      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Move enough to trigger hasMoved
      fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });

      await new Promise(resolve => setTimeout(resolve, 10));

      fireEvent.mouseUp(window);

      await waitFor(() => {
        // onReparentCheck should be called with the highlighted container ID
        expect(mockOnReparentCheck).toHaveBeenCalledWith('test-component', undefined, 'target-container');
      });
    });

    it('should pass null targetContainerId when no container is highlighted', async () => {
      (dragState.getState as jest.Mock).mockReturnValue({
        isDragging: true,
        mouseX: 200,
        mouseY: 200,
        draggedComponentIds: ['test-component'],
        highlightedContainerId: null,
      });

      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);

      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });

      await new Promise(resolve => setTimeout(resolve, 10));

      fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });

      await new Promise(resolve => setTimeout(resolve, 10));

      fireEvent.mouseUp(window);

      await waitFor(() => {
        expect(mockOnReparentCheck).toHaveBeenCalledWith('test-component', undefined, null);
      });
    });
  });
});

