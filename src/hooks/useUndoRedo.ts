import { useState, useCallback, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  future: T[];
}

/**
 * Generic undo/redo hook using snapshot-based history.
 * Stores deep-copied snapshots of state for reliable undo/redo.
 *
 * Uses a ref mirror of history state so that undo/redo can read
 * and return the restored state synchronously (avoids relying on
 * setState updater side-effects which may not eagerly execute in React 18).
 *
 * @param maxSnapshots Maximum number of past snapshots to retain (default 50)
 */
export function useUndoRedo<T>(maxSnapshots = 50) {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    past: [],
    future: [],
  });

  // Mirror of history kept in sync for synchronous reads
  const historyRef = useRef<UndoRedoState<T>>(history);

  // Debounce ref for continuous operations (drag/resize)
  const batchTimeoutRef = useRef<number | null>(null);
  const hasBatchSnapshotRef = useRef(false);

  /**
   * Push a snapshot of the current state before a discrete operation.
   * Clears the future (redo) stack.
   */
  const pushSnapshot = useCallback((state: T) => {
    const prev = historyRef.current;

    // Deduplicate: don't push if identical to most recent snapshot
    if (prev.past.length > 0) {
      const lastSnapshot = prev.past[prev.past.length - 1];
      if (JSON.stringify(lastSnapshot) === JSON.stringify(state)) {
        return;
      }
    }

    const newPast = [...prev.past, JSON.parse(JSON.stringify(state))];
    // Trim to max snapshots
    if (newPast.length > maxSnapshots) {
      newPast.splice(0, newPast.length - maxSnapshots);
    }

    const newHistory: UndoRedoState<T> = {
      past: newPast,
      future: [], // Clear redo stack on new action
    };
    historyRef.current = newHistory;
    setHistory(newHistory);
  }, [maxSnapshots]);

  /**
   * Push a snapshot for continuous/batch operations (drag, resize).
   * Only captures on the first call in a batch; subsequent calls within 300ms are ignored.
   */
  const pushBatchSnapshot = useCallback((state: T) => {
    if (!hasBatchSnapshotRef.current) {
      hasBatchSnapshotRef.current = true;
      pushSnapshot(state);
    }

    // Reset the batch flag after 300ms of inactivity
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    batchTimeoutRef.current = window.setTimeout(() => {
      hasBatchSnapshotRef.current = false;
      batchTimeoutRef.current = null;
    }, 300);
  }, [pushSnapshot]);

  /**
   * Undo: restore the most recent past snapshot.
   * Returns the state to restore, or null if nothing to undo.
   */
  const undo = useCallback((currentState: T): T | null => {
    const current = historyRef.current;
    if (current.past.length === 0) return null;

    const newPast = [...current.past];
    const restored = newPast.pop()!;
    const restoredDeep: T = JSON.parse(JSON.stringify(restored));

    const newHistory: UndoRedoState<T> = {
      past: newPast,
      future: [JSON.parse(JSON.stringify(currentState)), ...current.future],
    };
    historyRef.current = newHistory;
    setHistory(newHistory);

    return restoredDeep;
  }, []);

  /**
   * Redo: restore the most recent future snapshot.
   * Returns the state to restore, or null if nothing to redo.
   */
  const redo = useCallback((currentState: T): T | null => {
    const current = historyRef.current;
    if (current.future.length === 0) return null;

    const newFuture = [...current.future];
    const restored = newFuture.shift()!;
    const restoredDeep: T = JSON.parse(JSON.stringify(restored));

    const newHistory: UndoRedoState<T> = {
      past: [...current.past, JSON.parse(JSON.stringify(currentState))],
      future: newFuture,
    };
    historyRef.current = newHistory;
    setHistory(newHistory);

    return restoredDeep;
  }, []);

  return {
    pushSnapshot,
    pushBatchSnapshot,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
