import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useRef, useState, useCallback } from 'react';

/**
 * Test harness that mirrors how useAppData uses useUndoRedo.
 * Avoids nesting setState calls (which React 18 batches differently).
 */
function useTestHarness(maxSnapshots = 50) {
  const [state, setState] = useState(0);
  const undoRedo = useUndoRedo<number>(maxSnapshots);
  const stateRef = useRef(0);
  stateRef.current = state;

  const doAction = useCallback((newState: number) => {
    undoRedo.pushSnapshot(stateRef.current);
    setState(newState);
  }, [undoRedo]);

  const doBatchAction = useCallback((newState: number) => {
    undoRedo.pushBatchSnapshot(stateRef.current);
    setState(newState);
  }, [undoRedo]);

  const undo = useCallback(() => {
    const restored = undoRedo.undo(stateRef.current);
    if (restored !== null) setState(restored);
  }, [undoRedo]);

  const redo = useCallback(() => {
    const restored = undoRedo.redo(stateRef.current);
    if (restored !== null) setState(restored);
  }, [undoRedo]);

  return {
    state,
    doAction,
    doBatchAction,
    undo,
    redo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
  };
}

describe('useUndoRedo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useUndoRedo<string>());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  describe('pushSnapshot', () => {
    it('should enable undo after pushing a snapshot', () => {
      const { result } = renderHook(() => useTestHarness());

      act(() => { result.current.doAction(1); });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.state).toBe(1);
    });

    it('should clear future (redo) stack on new action', () => {
      const { result } = renderHook(() => useTestHarness());

      act(() => { result.current.doAction(1); });
      act(() => { result.current.doAction(2); });
      act(() => { result.current.undo(); });
      expect(result.current.canRedo).toBe(true);

      act(() => { result.current.doAction(3); });
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('undo', () => {
    it('should not change state when no history', () => {
      const { result } = renderHook(() => useTestHarness());

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(0);
    });

    it('should restore the previous state', () => {
      const { result } = renderHook(() => useTestHarness());

      act(() => { result.current.doAction(1); }); // snap: [0], state: 1
      act(() => { result.current.doAction(2); }); // snap: [0, 1], state: 2

      act(() => { result.current.undo(); }); // restore 1
      expect(result.current.state).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      act(() => { result.current.undo(); }); // restore 0
      expect(result.current.state).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('redo', () => {
    it('should not change state when no future', () => {
      const { result } = renderHook(() => useTestHarness());
      act(() => { result.current.doAction(1); });

      act(() => { result.current.redo(); });
      expect(result.current.state).toBe(1); // unchanged
    });

    it('should restore from future after undo', () => {
      const { result } = renderHook(() => useTestHarness());

      act(() => { result.current.doAction(1); });
      act(() => { result.current.doAction(2); });
      act(() => { result.current.undo(); }); // back to 1

      act(() => { result.current.redo(); }); // forward to 2
      expect(result.current.state).toBe(2);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('undo/redo round-trip', () => {
    it('should support multiple undo then redo', () => {
      const { result } = renderHook(() => useTestHarness());

      act(() => { result.current.doAction(10); });
      act(() => { result.current.doAction(20); });
      act(() => { result.current.doAction(30); });

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(20);

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(10);

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(0);

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      act(() => { result.current.redo(); });
      expect(result.current.state).toBe(10);

      act(() => { result.current.redo(); });
      expect(result.current.state).toBe(20);

      act(() => { result.current.redo(); });
      expect(result.current.state).toBe(30);

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('maxSnapshots', () => {
    it('should trim history to maxSnapshots', () => {
      const { result } = renderHook(() => useTestHarness(3));

      act(() => { result.current.doAction(1); });
      act(() => { result.current.doAction(2); });
      act(() => { result.current.doAction(3); });
      act(() => { result.current.doAction(4); }); // 0 trimmed

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(3);

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(2);

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(1);

      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('pushBatchSnapshot', () => {
    it('should only capture one snapshot for rapid consecutive calls', () => {
      const { result } = renderHook(() => useTestHarness());

      act(() => { result.current.doBatchAction(1); });
      act(() => { result.current.doBatchAction(2); });
      act(() => { result.current.doBatchAction(3); });

      expect(result.current.state).toBe(3);

      // Only one undo to get back to the snapshot before the batch
      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(0);
      expect(result.current.canUndo).toBe(false);
    });

    it('should allow new batch after 300ms timeout', () => {
      const { result } = renderHook(() => useTestHarness());

      act(() => { result.current.doBatchAction(1); });

      act(() => { jest.advanceTimersByTime(400); });

      act(() => { result.current.doBatchAction(2); });

      expect(result.current.state).toBe(2);

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(1);

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(0);

      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('deduplication', () => {
    it('should not push duplicate consecutive snapshots', () => {
      const { result } = renderHook(() => useUndoRedo<{ v: number }>());

      act(() => { result.current.pushSnapshot({ v: 1 }); });
      act(() => { result.current.pushSnapshot({ v: 1 }); });

      expect(result.current.canUndo).toBe(true);
      act(() => { result.current.undo({ v: 2 }); });
      expect(result.current.canUndo).toBe(false);
    });
  });
});
