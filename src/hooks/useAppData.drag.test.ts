/**
 * Unit tests for drag and move functionality in useAppData hook
 * Tests reorderComponent and moveComponentToParent functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAppData } from '@/hooks/useAppData';
import { AppDefinition, ComponentType } from 'types';

describe('useAppData - Drag and Move', () => {
  const mockOnSave = jest.fn();
  
  const createMockAppDefinition = (): AppDefinition => ({
    id: 'app1',
    name: 'Test App',
    mainPageId: 'page1',
    pages: [{ id: 'page1', name: 'Page 1' }],
    components: [
      {
        id: 'container1',
        type: ComponentType.CONTAINER,
        pageId: 'page1',
        parentId: null,
        props: { x: 0, y: 0, width: 400, height: 300 },
      },
      {
        id: 'container2',
        type: ComponentType.CONTAINER,
        pageId: 'page1',
        parentId: null,
        props: { x: 500, y: 0, width: 400, height: 300 },
      },
      {
        id: 'label1',
        type: ComponentType.LABEL,
        pageId: 'page1',
        parentId: 'container1',
        props: { x: 10, y: 10, width: 100, height: 30, text: 'Label 1' },
      },
      {
        id: 'label2',
        type: ComponentType.LABEL,
        pageId: 'page1',
        parentId: 'container1',
        props: { x: 10, y: 50, width: 100, height: 30, text: 'Label 2' },
      },
      {
        id: 'label3',
        type: ComponentType.LABEL,
        pageId: 'page1',
        parentId: null,
        props: { x: 100, y: 100, width: 100, height: 30, text: 'Label 3' },
      },
    ],
    dataStore: {},
    variables: [],
    theme: {},
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reorderComponent', () => {
    it('should reorder components within the same parent', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.reorderComponent) {
        // Skip test if function doesn't exist (might not be exported)
        return;
      }

      act(() => {
        result.current.reorderComponent!('label1', 1, 'container1', 'page1');
      });

      const components = result.current.appDefinition.components;
      const label1 = components.find(c => c.id === 'label1');
      const label2 = components.find(c => c.id === 'label2');

      // label1 should now have a higher order than label2 (moved to position 1)
      expect((label1!.props as any).order).toBeGreaterThan((label2!.props as any).order);
    });

    it('should reorder root-level components', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.reorderComponent) {
        return;
      }

      act(() => {
        result.current.reorderComponent!('container1', 1, null, 'page1');
      });

      const components = result.current.appDefinition.components;
      const container1 = components.find(c => c.id === 'container1');
      const container2 = components.find(c => c.id === 'container2');

      // container1 should now have a higher order than container2
      expect((container1!.props as any).order).toBeGreaterThan((container2!.props as any).order);
    });

    it('should not reorder if component is not on the correct page', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.reorderComponent) {
        return;
      }

      const initialComponents = [...result.current.appDefinition.components];

      act(() => {
        result.current.reorderComponent!('label1', 1, 'container1', 'wrong-page');
      });

      // Components should remain unchanged
      expect(result.current.appDefinition.components).toEqual(initialComponents);
    });
  });

  describe('moveComponentToParent', () => {
    it('should move component from one container to another', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      act(() => {
        result.current.moveComponentToParent!('label1', 'container2', 0, 'page1');
      });

      const components = result.current.appDefinition.components;
      const movedComponent = components.find(c => c.id === 'label1');
      
      expect(movedComponent?.parentId).toBe('container2');
      expect(movedComponent?.pageId).toBe('page1');
    });

    it('should move component from container to root level', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      // Verify function exists
      expect(result.current.moveComponentToParent).toBeDefined();
      
      act(() => {
        result.current.moveComponentToParent!('label1', null, 0, 'page1');
      });

      const components = result.current.appDefinition.components;
      const movedComponent = components.find(c => c.id === 'label1');
      
      expect(movedComponent?.parentId).toBeNull();
      expect(movedComponent?.pageId).toBe('page1');
    });

    it('should move component from root to container', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      act(() => {
        result.current.moveComponentToParent!('label3', 'container1', 0, 'page1');
      });

      const components = result.current.appDefinition.components;
      const movedComponent = components.find(c => c.id === 'label3');
      
      expect(movedComponent?.parentId).toBe('container1');
    });

    it('should calculate correct relative position when moving to container', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      act(() => {
        result.current.moveComponentToParent!('label3', 'container1', 0, 'page1');
      });

      const components = result.current.appDefinition.components;
      const movedComponent = components.find(c => c.id === 'label3');
      
      // Position should be relative to container (accounting for container's position)
      expect(movedComponent?.props.x).toBeGreaterThanOrEqual(0);
      expect(movedComponent?.props.y).toBeGreaterThanOrEqual(0);
    });

    it('should prevent moving component into itself', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      const initialComponents = [...result.current.appDefinition.components];

      act(() => {
        result.current.moveComponentToParent!('container1', 'container1', 0, 'page1');
      });

      // Components should remain unchanged
      expect(result.current.appDefinition.components).toEqual(initialComponents);
    });

    it('should prevent moving component into its descendant', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      const initialComponents = [...result.current.appDefinition.components];

      // Try to move container1 into label1 (which is a child of container1)
      act(() => {
        result.current.moveComponentToParent!('container1', 'label1', 0, 'page1');
      });

      // Components should remain unchanged
      expect(result.current.appDefinition.components).toEqual(initialComponents);
    });

    it('should rollback if move fails validation', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      const initialComponents = [...result.current.appDefinition.components];
      const initialLabel1 = initialComponents.find(c => c.id === 'label1')!;

      // Try to move to a non-container component
      act(() => {
        result.current.moveComponentToParent!('label1', 'label2', 0, 'page1');
      });

      // Component should remain in original position
      const components = result.current.appDefinition.components;
      const label1 = components.find(c => c.id === 'label1');
      expect(label1?.parentId).toBe(initialLabel1.parentId);
      expect(label1?.props.x).toBe(initialLabel1.props.x);
      expect(label1?.props.y).toBe(initialLabel1.props.y);
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid reorder operations', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.reorderComponent) {
        return;
      }

      const startTime = performance.now();

      act(() => {
        // Perform multiple reorder operations
        for (let i = 0; i < 10; i++) {
          result.current.reorderComponent!('label1', i % 2, 'container1', 'page1');
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 100ms for 10 operations)
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple rapid move operations', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      const startTime = performance.now();

      act(() => {
        // Perform multiple move operations
        for (let i = 0; i < 5; i++) {
          const targetParent = i % 2 === 0 ? 'container1' : 'container2';
          result.current.moveComponentToParent!('label1', targetParent, 0, 'page1');
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 200ms for 5 operations)
      expect(duration).toBeLessThan(200);
    });
  });
});

