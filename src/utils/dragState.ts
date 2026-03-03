/**
 * Global drag state management for canvas drag operations
 * This allows all components to know when a drag is in progress and where the mouse is
 */

interface DragState {
  isDragging: boolean;
  mouseX: number;
  mouseY: number;
  draggedComponentIds: string[];
  highlightedContainerId: string | null; // ID of the innermost container under mouse
}

let globalDragState: DragState = {
  isDragging: false,
  mouseX: 0,
  mouseY: 0,
  draggedComponentIds: [],
  highlightedContainerId: null,
};

const listeners = new Set<(state: DragState) => void>();

// Throttle mouse position updates to reduce listener calls
let lastMouseUpdateTime = 0;
const MOUSE_UPDATE_THROTTLE_MS = 16; // ~60fps

export const dragState = {
  getState: (): DragState => globalDragState,
  
  setState: (updates: Partial<DragState>) => {
    const hasChanges = Object.keys(updates).some(key => {
      const typedKey = key as keyof DragState;
      return globalDragState[typedKey] !== updates[typedKey];
    });
    
    if (!hasChanges) return; // Skip if no actual changes
    
    globalDragState = { ...globalDragState, ...updates };
    listeners.forEach(listener => listener(globalDragState));
  },
  
  subscribe: (listener: (state: DragState) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  
  startDrag: (componentIds: string[]) => {
    dragState.setState({
      isDragging: true,
      draggedComponentIds: componentIds,
    });
  },
  
  updateMousePosition: (x: number, y: number) => {
    if (!globalDragState.isDragging) return;
    
    // Throttle mouse position updates
    const now = performance.now();
    if (now - lastMouseUpdateTime < MOUSE_UPDATE_THROTTLE_MS) {
      return; // Skip if too soon
    }
    lastMouseUpdateTime = now;
    
    // Only update if position actually changed
    if (globalDragState.mouseX === x && globalDragState.mouseY === y) {
      return;
    }
    
    globalDragState.mouseX = x;
    globalDragState.mouseY = y;
    // Directly notify listeners without creating new state object
    listeners.forEach(listener => listener(globalDragState));
  },
  
  setHighlightedContainer: (containerId: string | null) => {
    if (globalDragState.highlightedContainerId !== containerId) {
      globalDragState.highlightedContainerId = containerId;
      listeners.forEach(listener => listener(globalDragState));
    }
  },
  
  endDrag: () => {
    lastMouseUpdateTime = 0; // Reset throttle
    dragState.setState({
      isDragging: false,
      mouseX: 0,
      mouseY: 0,
      draggedComponentIds: [],
      highlightedContainerId: null,
    });
  },
};

