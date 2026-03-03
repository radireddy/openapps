import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAppData } from '@/hooks/useAppData';
import { AppDefinition, ComponentType, AppComponent } from '@/types';

const mockTheme = {
  colors: { primary: '#000', onPrimary: '#fff', secondary: '#000', onSecondary: '#fff', background: '#fff', surface: '#fff', text: '#000', border: '#e5e5e5' },
  font: { family: 'Arial' },
  border: { width: '1px', style: 'solid' },
  radius: { default: '4px' },
  spacing: { sm: '4px', md: '8px', lg: '16px' },
};

const makeAppDef = (components: Partial<AppComponent>[] = []): AppDefinition => ({
  id: 'app1',
  name: 'Test App',
  createdAt: '',
  lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: components as AppComponent[],
  dataStore: {},
  variables: [],
  theme: mockTheme,
});

describe('useAppData - New Features', () => {
  let onSave: jest.Mock;

  beforeEach(() => {
    onSave = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rename', () => {
    it('should expose renameComponent function', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));
      expect(typeof result.current.renameComponent).toBe('function');
    });

    it('should rename a component', () => {
      const appDef = makeAppDef([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', name: 'Label 1', props: { text: 'Hello' } as any },
      ]);
      const { result } = renderHook(() => useAppData(appDef, onSave));

      act(() => {
        result.current.renameComponent('comp1', 'My Custom Label');
      });

      const renamed = result.current.components.find(c => c.id === 'comp1');
      expect(renamed?.name).toBe('My Custom Label');
    });

    it('should auto-generate name when adding component', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));

      act(() => {
        result.current.addComponent(ComponentType.INPUT, { x: 10, y: 10 }, null, 'page1');
      });

      const added = result.current.components[0];
      expect(added.name).toBeDefined();
      expect(added.name).toContain('Input');
    });
  });

  describe('Undo/Redo', () => {
    it('should expose undo, redo, canUndo, canRedo', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));
      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should enable canUndo after adding a component', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));

      act(() => {
        result.current.addComponent(ComponentType.BUTTON, { x: 0, y: 0 }, null, 'page1');
      });

      expect(result.current.components).toHaveLength(1);
      expect(result.current.canUndo).toBe(true);
    });

    it('should undo adding a component', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));

      act(() => {
        result.current.addComponent(ComponentType.BUTTON, { x: 0, y: 0 }, null, 'page1');
      });
      expect(result.current.components).toHaveLength(1);

      act(() => {
        result.current.undo();
      });
      expect(result.current.components).toHaveLength(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('should redo after undo', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));

      act(() => {
        result.current.addComponent(ComponentType.BUTTON, { x: 0, y: 0 }, null, 'page1');
      });

      act(() => {
        result.current.undo();
      });
      expect(result.current.components).toHaveLength(0);

      act(() => {
        result.current.redo();
      });
      expect(result.current.components).toHaveLength(1);
    });

    it('should enable canUndo after deleting a component', () => {
      const appDef = makeAppDef([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello' } as any },
      ]);
      const { result } = renderHook(() => useAppData(appDef, onSave));

      act(() => {
        result.current.deleteComponent('comp1');
      });

      expect(result.current.components).toHaveLength(0);
      expect(result.current.canUndo).toBe(true);
    });

    it('should undo deleting a component', () => {
      const appDef = makeAppDef([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello' } as any },
      ]);
      const { result } = renderHook(() => useAppData(appDef, onSave));

      act(() => {
        result.current.deleteComponent('comp1');
      });
      expect(result.current.components).toHaveLength(0);

      act(() => {
        result.current.undo();
      });
      expect(result.current.components).toHaveLength(1);
      expect(result.current.components[0].id).toBe('comp1');
    });

    it('should clear redo stack on new action', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));

      act(() => {
        result.current.addComponent(ComponentType.BUTTON, { x: 0, y: 0 }, null, 'page1');
      });
      act(() => {
        result.current.undo();
      });
      expect(result.current.canRedo).toBe(true);

      // New action clears redo
      act(() => {
        result.current.addComponent(ComponentType.INPUT, { x: 50, y: 50 }, null, 'page1');
      });
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('Paste Components', () => {
    it('should expose pasteComponents function', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));
      expect(typeof result.current.pasteComponents).toBe('function');
    });

    it('should paste components into the app', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));

      const newComponents: AppComponent[] = [
        {
          id: 'pasted_1',
          type: ComponentType.LABEL,
          pageId: 'page1',
          props: { x: 20, y: 20, width: 100, height: 30, text: 'Pasted' } as any,
          parentId: null as any,
        },
      ];

      act(() => {
        result.current.pasteComponents(newComponents);
      });

      expect(result.current.components).toHaveLength(1);
      expect(result.current.components[0].id).toBe('pasted_1');
    });

    it('should select pasted root components', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));

      const newComponents: AppComponent[] = [
        {
          id: 'pasted_1',
          type: ComponentType.LABEL,
          pageId: 'page1',
          props: { x: 20, y: 20, width: 100, height: 30, text: 'Pasted' } as any,
          parentId: null as any,
        },
      ];

      act(() => {
        result.current.pasteComponents(newComponents);
      });

      expect(result.current.selectedComponentIds).toContain('pasted_1');
    });

    it('should push undo snapshot when pasting', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));

      const newComponents: AppComponent[] = [
        {
          id: 'pasted_1',
          type: ComponentType.BUTTON,
          pageId: 'page1',
          props: { x: 20, y: 20, width: 100, height: 40, text: 'Click' } as any,
          parentId: null as any,
        },
      ];

      act(() => {
        result.current.pasteComponents(newComponents);
      });

      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('Submit Form Action', () => {
    it('should expose submitForm in actions', () => {
      const { result } = renderHook(() => useAppData(makeAppDef(), onSave));
      expect(typeof result.current.actions.submitForm).toBe('function');
    });
  });
});
