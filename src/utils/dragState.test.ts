import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { dragState } from '@/utils/dragState';

describe('dragState', () => {
  beforeEach(() => {
    dragState.endDrag();
  });

  describe('initial state', () => {
    it('should start with isDragging false', () => {
      expect(dragState.getState().isDragging).toBe(false);
    });

    it('should start with empty draggedComponentIds', () => {
      expect(dragState.getState().draggedComponentIds).toEqual([]);
    });

    it('should start with null highlightedContainerId', () => {
      expect(dragState.getState().highlightedContainerId).toBeNull();
    });
  });

  describe('startDrag', () => {
    it('should set isDragging to true', () => {
      dragState.startDrag(['comp1']);
      expect(dragState.getState().isDragging).toBe(true);
    });

    it('should set draggedComponentIds', () => {
      dragState.startDrag(['comp1', 'comp2']);
      expect(dragState.getState().draggedComponentIds).toEqual(['comp1', 'comp2']);
    });
  });

  describe('endDrag', () => {
    it('should reset all state', () => {
      dragState.startDrag(['comp1']);
      dragState.endDrag();
      const state = dragState.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedComponentIds).toEqual([]);
      expect(state.mouseX).toBe(0);
      expect(state.mouseY).toBe(0);
      expect(state.highlightedContainerId).toBeNull();
    });
  });

  describe('setHighlightedContainer', () => {
    it('should set the highlighted container id', () => {
      dragState.setHighlightedContainer('container1');
      expect(dragState.getState().highlightedContainerId).toBe('container1');
    });

    it('should clear the highlighted container', () => {
      dragState.setHighlightedContainer('container1');
      dragState.setHighlightedContainer(null);
      expect(dragState.getState().highlightedContainerId).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', () => {
      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);

      dragState.startDrag(['comp1']);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ isDragging: true, draggedComponentIds: ['comp1'] })
      );

      unsubscribe();
    });

    it('should stop notifying after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);
      unsubscribe();

      dragState.startDrag(['comp1']);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify on highlighted container change', () => {
      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);

      dragState.setHighlightedContainer('container1');
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ highlightedContainerId: 'container1' })
      );

      unsubscribe();
    });

    it('should not notify if highlighted container did not change', () => {
      dragState.setHighlightedContainer('container1');

      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);

      dragState.setHighlightedContainer('container1');
      expect(listener).not.toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('setState', () => {
    it('should skip update if no actual changes', () => {
      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);

      // endDrag was called in beforeEach, so state is already at defaults
      dragState.setState({ isDragging: false });
      expect(listener).not.toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('updateMousePosition', () => {
    it('does nothing when not dragging', () => {
      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);

      dragState.updateMousePosition(100, 200);
      expect(listener).not.toHaveBeenCalled();
      expect(dragState.getState().mouseX).toBe(0);
      expect(dragState.getState().mouseY).toBe(0);

      unsubscribe();
    });

    it('updates mouse position when dragging and throttle elapsed', () => {
      dragState.startDrag(['comp1']);
      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);

      // Mock performance.now to bypass throttle
      const originalNow = performance.now;
      let fakeTime = 1000;
      performance.now = () => fakeTime;

      dragState.updateMousePosition(100, 200);
      expect(dragState.getState().mouseX).toBe(100);
      expect(dragState.getState().mouseY).toBe(200);
      expect(listener).toHaveBeenCalled();

      performance.now = originalNow;
      unsubscribe();
    });

    it('skips update when throttle has not elapsed', () => {
      dragState.startDrag(['comp1']);
      const listener = jest.fn();

      const originalNow = performance.now;
      let fakeTime = 1000;
      performance.now = () => fakeTime;

      // First update succeeds
      dragState.updateMousePosition(100, 200);

      const unsubscribe = dragState.subscribe(listener);

      // Second update within throttle window is skipped
      fakeTime = 1005; // Only 5ms later, less than 16ms throttle
      dragState.updateMousePosition(150, 250);
      expect(listener).not.toHaveBeenCalled();
      expect(dragState.getState().mouseX).toBe(100);

      performance.now = originalNow;
      unsubscribe();
    });

    it('skips update when position has not changed', () => {
      dragState.startDrag(['comp1']);

      const originalNow = performance.now;
      let fakeTime = 1000;
      performance.now = () => fakeTime;

      // First update
      dragState.updateMousePosition(100, 200);

      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);

      // Same position after throttle elapsed
      fakeTime = 1100;
      dragState.updateMousePosition(100, 200);
      expect(listener).not.toHaveBeenCalled();

      performance.now = originalNow;
      unsubscribe();
    });

    it('updates when position changes after throttle', () => {
      dragState.startDrag(['comp1']);

      const originalNow = performance.now;
      let fakeTime = 1000;
      performance.now = () => fakeTime;

      // First update
      dragState.updateMousePosition(100, 200);

      const listener = jest.fn();
      const unsubscribe = dragState.subscribe(listener);

      // Different position after throttle elapsed
      fakeTime = 1100;
      dragState.updateMousePosition(150, 250);
      expect(listener).toHaveBeenCalled();
      expect(dragState.getState().mouseX).toBe(150);
      expect(dragState.getState().mouseY).toBe(250);

      performance.now = originalNow;
      unsubscribe();
    });
  });
});
