import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { cloneComponentTree, useClipboard } from '@/hooks/useClipboard';
import { AppComponent, ComponentType } from '@/types';

const makeComponent = (overrides: Partial<AppComponent> & { id: string; type: ComponentType }): AppComponent => ({
  pageId: 'page1',
  props: { x: 0, y: 0, width: 100, height: 40 } as any,
  parentId: undefined as any,
  ...overrides,
});

const sampleComponents: AppComponent[] = [
  makeComponent({ id: 'container1', type: ComponentType.CONTAINER, props: { x: 10, y: 10, width: 400, height: 300 } as any }),
  makeComponent({ id: 'input1', type: ComponentType.INPUT, parentId: 'container1', name: 'Email Input', props: { x: 20, y: 20, width: 200, height: 40 } as any }),
  makeComponent({ id: 'button1', type: ComponentType.BUTTON, parentId: 'container1', name: 'Submit', props: { x: 20, y: 80, width: 120, height: 40 } as any }),
  makeComponent({ id: 'label1', type: ComponentType.LABEL, props: { x: 500, y: 50, width: 100, height: 30 } as any }),
];

describe('cloneComponentTree', () => {
  it('should clone a single root component with new ID', () => {
    const cloned = cloneComponentTree(['label1'], sampleComponents, 'page1');
    expect(cloned).toHaveLength(1);
    expect(cloned[0].id).not.toBe('label1');
    expect(cloned[0].type).toBe(ComponentType.LABEL);
    expect(cloned[0].pageId).toBe('page1');
  });

  it('should apply position offset to root components', () => {
    const cloned = cloneComponentTree(['label1'], sampleComponents, 'page1', 25);
    expect((cloned[0].props as any).x).toBe(525); // 500 + 25
    expect((cloned[0].props as any).y).toBe(75);  // 50 + 25
  });

  it('should clone container with all descendants', () => {
    const cloned = cloneComponentTree(['container1'], sampleComponents, 'page1');
    expect(cloned).toHaveLength(3); // container + input + button

    const types = cloned.map(c => c.type);
    expect(types).toContain(ComponentType.CONTAINER);
    expect(types).toContain(ComponentType.INPUT);
    expect(types).toContain(ComponentType.BUTTON);
  });

  it('should remap parentId references within cloned tree', () => {
    const cloned = cloneComponentTree(['container1'], sampleComponents, 'page1');
    const clonedContainer = cloned.find(c => c.type === ComponentType.CONTAINER)!;
    const clonedInput = cloned.find(c => c.type === ComponentType.INPUT)!;
    const clonedButton = cloned.find(c => c.type === ComponentType.BUTTON)!;

    // Children should point to the new container ID
    expect(clonedInput.parentId).toBe(clonedContainer.id);
    expect(clonedButton.parentId).toBe(clonedContainer.id);
    // IDs should be different from originals
    expect(clonedContainer.id).not.toBe('container1');
    expect(clonedInput.id).not.toBe('input1');
    expect(clonedButton.id).not.toBe('button1');
  });

  it('should append " (copy)" to component names', () => {
    const cloned = cloneComponentTree(['input1'], sampleComponents, 'page1');
    expect(cloned[0].name).toBe('Email Input (copy)');
  });

  it('should not set name on components without one', () => {
    const cloned = cloneComponentTree(['label1'], sampleComponents, 'page1');
    expect(cloned[0].name).toBeUndefined();
  });

  it('should set target pageId on all cloned components', () => {
    const cloned = cloneComponentTree(['container1'], sampleComponents, 'page2');
    cloned.forEach(c => {
      expect(c.pageId).toBe('page2');
    });
  });

  it('should only offset root components, not descendants', () => {
    const cloned = cloneComponentTree(['container1'], sampleComponents, 'page1', 20);
    const clonedContainer = cloned.find(c => c.type === ComponentType.CONTAINER)!;
    const clonedInput = cloned.find(c => c.type === ComponentType.INPUT)!;

    // Root gets offset
    expect((clonedContainer.props as any).x).toBe(30); // 10 + 20
    // Child does NOT get offset
    expect((clonedInput.props as any).x).toBe(20); // unchanged
  });

  it('should clone multiple roots', () => {
    const cloned = cloneComponentTree(['label1', 'button1'], sampleComponents, 'page1', 10);
    // label1 (no children) + button1 (no children, child of container1 but only its subtree)
    expect(cloned).toHaveLength(2);
  });

  it('should generate unique IDs', () => {
    const cloned = cloneComponentTree(['container1'], sampleComponents, 'page1');
    const ids = cloned.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('useClipboard', () => {
  it('should initialize with no clipboard', () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.hasClipboard).toBe(false);
  });

  it('should set hasClipboard after copy', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copy(['label1'], sampleComponents, 'page1');
    });

    expect(result.current.hasClipboard).toBe(true);
  });

  it('should not set clipboard on empty selection', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copy([], sampleComponents, 'page1');
    });

    expect(result.current.hasClipboard).toBe(false);
  });

  it('should return null from paste when clipboard is empty', () => {
    const { result } = renderHook(() => useClipboard());

    let pasted: AppComponent[] | null = null;
    act(() => {
      pasted = result.current.paste(sampleComponents, 'page1');
    });

    expect(pasted).toBeNull();
  });

  it('should paste with new IDs and 20px offset', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copy(['label1'], sampleComponents, 'page1');
    });

    let pasted: AppComponent[] | null = null;
    act(() => {
      pasted = result.current.paste(sampleComponents, 'page1');
    });

    expect(pasted).not.toBeNull();
    expect(pasted!).toHaveLength(1);
    expect(pasted![0].id).not.toBe('label1');
    // Paste applies 20px offset
    expect((pasted![0].props as any).x).toBe(520); // 500 + 20
    expect((pasted![0].props as any).y).toBe(70);  // 50 + 20
  });

  it('should paste to a different page', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copy(['label1'], sampleComponents, 'page1');
    });

    let pasted: AppComponent[] | null = null;
    act(() => {
      pasted = result.current.paste(sampleComponents, 'page2');
    });

    expect(pasted).not.toBeNull();
    expect(pasted![0].pageId).toBe('page2');
  });

  it('should paste container with remapped children', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copy(['container1'], sampleComponents, 'page1');
    });

    let pasted: AppComponent[] | null = null;
    act(() => {
      pasted = result.current.paste(sampleComponents, 'page1');
    });

    expect(pasted).not.toBeNull();
    expect(pasted!).toHaveLength(3);

    const pastedContainer = pasted!.find(c => c.type === ComponentType.CONTAINER)!;
    const pastedChildren = pasted!.filter(c => c.parentId === pastedContainer.id);
    expect(pastedChildren).toHaveLength(2);
  });

  it('should generate IDs different from original on paste', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copy(['label1'], sampleComponents, 'page1');
    });

    let pasted: AppComponent[] | null = null;
    act(() => {
      pasted = result.current.paste(sampleComponents, 'page1');
    });

    // Pasted ID should differ from original
    expect(pasted![0].id).not.toBe('label1');
    // Should contain the component type in the ID
    expect(pasted![0].id).toContain(ComponentType.LABEL);
  });
});
