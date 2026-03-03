import { AppDefinition, AppComponent, ComponentType } from '../../types';
import { componentRegistry } from '../../components/component-registry/registry';
import { parsePaddingValue, parseSizeToNumber, getAbsolutePosition, isDescendant } from './helpers';

/**
 * Reparent a component (move to new container or canvas root).
 * Calculates new relative coordinates based on absolute position and new parent's position.
 *
 * Returns an object with:
 * - `state`: The new AppDefinition (or unchanged if no reparenting needed)
 * - `changed`: Whether the state actually changed
 *
 * Note: The caller is responsible for managing the re-entrancy guard (isReparentingRef)
 * and the setTimeout to clear it.
 */
export function reparentComponentInState(
  state: AppDefinition,
  componentId: string,
  finalPosition?: { x: number; y: number },
  targetContainerId?: string | null
): { state: AppDefinition; changed: boolean } {
  const allComponents = state.components;
  const componentToReparent = allComponents.find(c => c.id === componentId);
  if (!componentToReparent) {
    return { state, changed: false };
  }

  // --- Fast path: targetContainerId was provided (e.g. from drag highlight) ---
  // This bypasses position-based container detection, which doesn't work reliably
  // in flex layouts where props.x/y are order values, not pixel positions.
  if (targetContainerId !== undefined) {
    const oldParentId = componentToReparent.parentId || null;
    const newParentId = targetContainerId;

    if (oldParentId === newParentId) {
      return { state, changed: false };
    }

    // Validate target is a real container (if non-null)
    if (newParentId) {
      const targetParent = allComponents.find(c => c.id === newParentId);
      if (!targetParent) return { state, changed: false };
      const plugin = componentRegistry[targetParent.type];
      if (!plugin?.isContainer) return { state, changed: false };
      if (isDescendant(newParentId, componentId, allComponents)) return { state, changed: false };
      if (targetParent.pageId !== componentToReparent.pageId) return { state, changed: false };
    }

    // Calculate new order: append at end of new parent's children
    const newSiblings = allComponents.filter(c =>
      (c.parentId || null) === newParentId && c.pageId === componentToReparent.pageId && c.id !== componentId
    );
    const newOrder = newSiblings.length;

    let updatedComponents = allComponents.map(c => {
      if (c.id === componentId) {
        return {
          ...c,
          parentId: newParentId,
          props: { ...c.props, x: 0, y: 0, order: newOrder },
        };
      }
      return c;
    });

    // Reassign order in old parent group to close gaps
    updatedComponents = reassignSiblingOrders(updatedComponents, oldParentId, componentToReparent.pageId);

    return { state: { ...state, components: updatedComponents }, changed: true };
  }

  // --- Slow path: position-based container detection (legacy) ---

  // Use finalPosition if provided (from drag drop), otherwise calculate from current state
  let absoluteX: number;
  let absoluteY: number;
  if (finalPosition) {
    absoluteX = finalPosition.x;
    absoluteY = finalPosition.y;
  } else {
    const pos = getAbsolutePosition(componentId, allComponents);
    absoluteX = pos.x;
    absoluteY = pos.y;
  }

  // Parse component dimensions to numbers
  const componentWidth = parseSizeToNumber(componentToReparent.props.width);
  const componentHeight = parseSizeToNumber(componentToReparent.props.height);
  const centerX = absoluteX + componentWidth / 2;
  const centerY = absoluteY + componentHeight / 2;

  // Helper to get parent's border position (not including padding)
  const getParentBorderPosition = (parentId: string): { x: number, y: number } => {
    if (!parentId) return { x: 0, y: 0 };
    const parent = allComponents.find(p => p.id === parentId);
    if (!parent) return { x: 0, y: 0 };

    let borderX = parent.props.x as number;
    let borderY = parent.props.y as number;
    let currentParentId = parent.parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) break;
      visited.add(currentParentId);
      const grandParent = allComponents.find(p => p.id === currentParentId);
      if (grandParent) {
        borderX += grandParent.props.x as number;
        borderY += grandParent.props.y as number;
        if (grandParent.type === ComponentType.CONTAINER || grandParent.type === ComponentType.LIST) {
          const grandParentPadding = parsePaddingValue(grandParent.props.padding);
          borderX += grandParentPadding.left;
          borderY += grandParentPadding.top;
        }
        currentParentId = grandParent.parentId;
      } else {
        break;
      }
    }
    return { x: borderX, y: borderY };
  };

  const potentialParents = allComponents.filter(p => {
    const plugin = componentRegistry[p.type];
    return plugin.isContainer && p.id !== componentId && !isDescendant(componentId, p.id, allComponents) && p.pageId === componentToReparent.pageId;
  });

  let newParent: AppComponent | null = null;
  let smallestArea = Infinity;

  const CONTAINER_THRESHOLD = 0.5;

  const isNestedIn = (containerId: string, potentialAncestorId: string, allComps: AppComponent[]): boolean => {
    if (containerId === potentialAncestorId) return false;
    const container = allComps.find(c => c.id === containerId);
    if (!container || !container.parentId) return false;
    if (container.parentId === potentialAncestorId) return true;
    return isNestedIn(container.parentId, potentialAncestorId, allComps);
  };

  const containingContainers: Array<{ parent: AppComponent; area: number; borderPos: { x: number; y: number }; bounds: any }> = [];

  for (const parent of potentialParents) {
    const parentBorderPos = getParentBorderPosition(parent.id);
    let isWithinBounds: boolean;
    const parentWidth = parseSizeToNumber(parent.props.width);
    const parentHeight = parseSizeToNumber(parent.props.height);

    if (parent.type === ComponentType.CONTAINER || parent.type === ComponentType.LIST) {
      const parentPadding = parsePaddingValue(parent.props.padding);
      const contentLeft = parentBorderPos.x + parentPadding.left;
      const contentTop = parentBorderPos.y + parentPadding.top;
      const contentRight = parentBorderPos.x + parentWidth - parentPadding.right;
      const contentBottom = parentBorderPos.y + parentHeight - parentPadding.bottom;

      isWithinBounds = (
        absoluteX >= contentLeft - CONTAINER_THRESHOLD &&
        absoluteX + componentWidth <= contentRight + CONTAINER_THRESHOLD &&
        absoluteY >= contentTop - CONTAINER_THRESHOLD &&
        absoluteY + componentHeight <= contentBottom + CONTAINER_THRESHOLD
      );
    } else {
      isWithinBounds = (
        centerX >= parentBorderPos.x &&
        centerX <= parentBorderPos.x + parentWidth &&
        centerY >= parentBorderPos.y &&
        centerY <= parentBorderPos.y + parentHeight
      );
    }

    if (isWithinBounds) {
      const area = parentWidth * parentHeight;
      const isContainerOrList = parent.type === ComponentType.CONTAINER || parent.type === ComponentType.LIST;
      const bounds = isContainerOrList ? {
        contentLeft: parentBorderPos.x + (isContainerOrList ? parsePaddingValue(parent.props.padding).left : 0),
        contentTop: parentBorderPos.y + (isContainerOrList ? parsePaddingValue(parent.props.padding).top : 0),
        contentRight: parentBorderPos.x + parentWidth - (isContainerOrList ? parsePaddingValue(parent.props.padding).right : 0),
        contentBottom: parentBorderPos.y + parentHeight - (isContainerOrList ? parsePaddingValue(parent.props.padding).bottom : 0),
      } : {
        left: parentBorderPos.x,
        top: parentBorderPos.y,
        right: parentBorderPos.x + parentWidth,
        bottom: parentBorderPos.y + parentHeight,
      };

      containingContainers.push({
        parent,
        area,
        borderPos: parentBorderPos,
        bounds,
      });
    }
  }

  // Filter out outer containers - if container A is nested in container B and both contain the component,
  // we only want container A (the innermost)
  const innermostContainers = containingContainers.filter(({ parent: candidate }) => {
    for (const { parent: other } of containingContainers) {
      if (other.id !== candidate.id && isNestedIn(candidate.id, other.id, allComponents)) {
        return false;
      }
    }
    return true;
  });

  // Select the container with the smallest area (innermost)
  for (const { parent, area } of innermostContainers) {
    if (area < smallestArea) {
      smallestArea = area;
      newParent = parent;
    }
  }

  const oldParentId = componentToReparent.parentId || null;
  const newParentId = newParent ? newParent.id : null;

  // CRITICAL FIX: If we found a new parent that's different from the old parent,
  // always allow reparenting.
  if (newParentId && newParentId !== oldParentId) {
    // User explicitly dragged component to a new container - allow reparenting
  } else if (oldParentId && oldParentId !== newParentId) {
    const oldParent = allComponents.find(p => p.id === oldParentId);
    if (oldParent && (oldParent.type === ComponentType.CONTAINER || oldParent.type === ComponentType.LIST)) {
      const oldParentBorderPos = getParentBorderPosition(oldParentId);
      const oldParentPadding = parsePaddingValue(oldParent.props.padding);
      const oldParentWidth = parseSizeToNumber(oldParent.props.width);
      const oldParentHeight = parseSizeToNumber(oldParent.props.height);
      const contentLeft = oldParentBorderPos.x + oldParentPadding.left;
      const contentTop = oldParentBorderPos.y + oldParentPadding.top;
      const contentRight = oldParentBorderPos.x + oldParentWidth - oldParentPadding.right;
      const contentBottom = oldParentBorderPos.y + oldParentHeight - oldParentPadding.bottom;

      const CONTAINMENT_THRESHOLD = 0.5;
      const stillInOriginalContainer = (
        absoluteX >= contentLeft - CONTAINMENT_THRESHOLD &&
        absoluteX + componentWidth <= contentRight + CONTAINMENT_THRESHOLD &&
        absoluteY >= contentTop - CONTAINMENT_THRESHOLD &&
        absoluteY + componentHeight <= contentBottom + CONTAINMENT_THRESHOLD
      );

      if (stillInOriginalContainer && !newParentId) {
        return { state, changed: false };
      }

      const completelyOutside = (
        absoluteX + componentWidth <= contentLeft + CONTAINMENT_THRESHOLD ||
        absoluteX >= contentRight - CONTAINMENT_THRESHOLD ||
        absoluteY + componentHeight <= contentTop + CONTAINMENT_THRESHOLD ||
        absoluteY >= contentBottom - CONTAINMENT_THRESHOLD
      );

      if (!completelyOutside && !newParentId) {
        return { state, changed: false };
      }
    }
  }

  if (oldParentId === newParentId) {
    return { state, changed: false };
  }

  try {
    const newParentAbsPos = newParent ? getParentBorderPosition(newParent.id) : { x: 0, y: 0 };
    let newRelativeX: number;
    let newRelativeY: number;
    if (newParent && (newParent.type === ComponentType.CONTAINER || newParent.type === ComponentType.LIST)) {
      const newParentPadding = parsePaddingValue(newParent.props.padding);
      newRelativeX = absoluteX - newParentAbsPos.x - newParentPadding.left;
      newRelativeY = absoluteY - newParentAbsPos.y - newParentPadding.top;
      newRelativeX = Math.max(0, newRelativeX);
      newRelativeY = Math.max(0, newRelativeY);
    } else {
      newRelativeX = absoluteX - newParentAbsPos.x;
      newRelativeY = absoluteY - newParentAbsPos.y;
    }

    const updatedComponents = allComponents.map(c => {
      if (c.id === componentId) {
        return {
          ...c,
          parentId: newParentId,
          props: {
            ...c.props,
            x: newRelativeX,
            y: newRelativeY,
          },
        };
      }
      return c;
    });

    // VALIDATION: Verify the component is actually a child of the new parent
    const updatedComponent = updatedComponents.find(c => c.id === componentId);
    const actualParentId = updatedComponent?.parentId || null;
    const validationFailed = actualParentId !== newParentId;

    if (validationFailed) {
      const errorMessage = `CRITICAL: Component ${componentId} was dropped on container ${newParentId} but is not its child! Expected parentId: ${newParentId}, Actual parentId: ${actualParentId}`;
      console.error(`[REPARENT ERROR] ${errorMessage}`);
      alert(`Error: Component was dropped on a container but was not added as its child. Check console for details.`);
      return { state, changed: false };
    }

    return { state: { ...state, components: updatedComponents }, changed: true };
  } catch (error) {
    console.error('[REPARENT EXCEPTION]', error);
    return { state, changed: false };
  }
}

/**
 * Reassign contiguous order values (0, 1, 2, ...) to all siblings
 * in a given parent group. This keeps order values clean and gap-free.
 */
export function reassignSiblingOrders(
  components: AppComponent[],
  parentId: string | null,
  pageId: string
): AppComponent[] {
  // Get siblings sorted by their current order
  const siblings = components
    .filter(c => {
      const cParentId = c.parentId || null;
      return cParentId === parentId && c.pageId === pageId;
    })
    .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));

  // Build a map of componentId -> new order
  const orderMap = new Map<string, number>();
  siblings.forEach((s, i) => orderMap.set(s.id, i));

  // Update components with new order values
  return components.map(c => {
    const newOrder = orderMap.get(c.id);
    if (newOrder !== undefined && (c.props as any).order !== newOrder) {
      return { ...c, props: { ...c.props, order: newOrder } };
    }
    return c;
  });
}

/**
 * Reorder a component within its parent.
 * Moves the component to a new position in the sibling list.
 * Updates props.order for all affected siblings to maintain contiguous values.
 */
export function reorderComponentInState(
  state: AppDefinition,
  componentId: string,
  newIndex: number,
  parentId: string | null,
  pageId: string
): AppDefinition {
  const component = state.components.find(c => c.id === componentId);
  if (!component) return state;

  // Verify the component is on the correct page
  if (component.pageId !== pageId) return state;

  // Get all siblings (excluding the component being moved), sorted by order
  const siblings = state.components
    .filter(c => {
      const cParentId = c.parentId || null;
      return cParentId === parentId && c.pageId === pageId && c.id !== componentId;
    })
    .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));

  // Clamp newIndex to valid range
  const clampedIndex = Math.max(0, Math.min(newIndex, siblings.length));

  // Create new ordered list with component inserted at new position
  const newSiblings = [...siblings];
  newSiblings.splice(clampedIndex, 0, component);

  // Assign contiguous order values (0, 1, 2, ...)
  const orderMap = new Map<string, number>();
  newSiblings.forEach((s, i) => orderMap.set(s.id, i));

  // Update components with new order values
  const updatedComponents = state.components.map(c => {
    const newOrder = orderMap.get(c.id);
    if (newOrder !== undefined && (c.props as any).order !== newOrder) {
      return { ...c, props: { ...c.props, order: newOrder } };
    }
    return c;
  });

  return {
    ...state,
    components: updatedComponents,
  };
}

/**
 * Move a component to a new parent.
 * Also handles reordering within the new parent.
 * Properly updates parentId and calculates relative positions.
 * Returns original state if validation fails.
 */
export function moveComponentToParentInState(
  state: AppDefinition,
  componentId: string,
  newParentId: string | null,
  newIndex: number | null,
  pageId: string
): AppDefinition {
  const component = state.components.find(c => c.id === componentId);
  if (!component) {
    return state;
  }

  // Verify the component is on the correct page
  if (component.pageId !== pageId) {
    return state;
  }

  // Helper to get absolute position of a component
  const getAbsPos = (cId: string, allComps: AppComponent[]): { x: number, y: number } => {
    const comp = allComps.find(c => c.id === cId);
    if (!comp) return { x: 0, y: 0 };

    let absX = comp.props.x as number;
    let absY = comp.props.y as number;
    let currentParentId = comp.parentId;

    while (currentParentId) {
      const parent = allComps.find(p => p.id === currentParentId);
      if (parent) {
        absX += parent.props.x as number;
        absY += parent.props.y as number;
        if (parent.type === ComponentType.CONTAINER) {
          const parentPadding = parsePaddingValue(parent.props.padding);
          absX += parentPadding.left;
          absY += parentPadding.top;
        }
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }
    return { x: absX, y: absY };
  };

  // Helper to check if a component is a descendant (prevent circular references)
  const isDesc = (childId: string, parentId: string, allComps: AppComponent[]): boolean => {
    const child = allComps.find(c => c.id === childId);
    if (!child || !child.parentId) return false;
    if (child.parentId === parentId) return true;
    return isDesc(child.parentId, parentId, allComps);
  };

  // Prevent moving component into itself or its own descendant
  if (newParentId && (component.id === newParentId || isDesc(newParentId, component.id, state.components))) {
    return state;
  }

  // Verify new parent exists and is a container (if not null)
  if (newParentId) {
    const newParent = state.components.find(c => c.id === newParentId);
    if (!newParent) {
      return state;
    }

    const plugin = componentRegistry[newParent.type];
    if (!plugin || !plugin.isContainer) {
      return state;
    }

    // Verify new parent is on the same page
    if (newParent.pageId !== pageId) {
      return state;
    }
  }

  const oldParentId = component.parentId || null;

  // If parent hasn't changed and no reordering needed, return early
  if (oldParentId === newParentId && newIndex === null) {
    return state;
  }

  // Get absolute position of the component
  const absolutePos = getAbsPos(componentId, state.components);

  // Calculate new relative position based on new parent
  let newRelativeX: number;
  let newRelativeY: number;

  if (newParentId) {
    const newParent = state.components.find(c => c.id === newParentId)!;
    const newParentAbsPos = getAbsPos(newParentId, state.components);

    if (newParent.type === ComponentType.CONTAINER) {
      const newParentPadding = parsePaddingValue(newParent.props.padding);
      newRelativeX = absolutePos.x - newParentAbsPos.x - newParentPadding.left;
      newRelativeY = absolutePos.y - newParentAbsPos.y - newParentPadding.top;
      newRelativeX = Math.max(0, newRelativeX);
      newRelativeY = Math.max(0, newRelativeY);
    } else {
      newRelativeX = absolutePos.x - newParentAbsPos.x;
      newRelativeY = absolutePos.y - newParentAbsPos.y;
    }
  } else {
    newRelativeX = absolutePos.x;
    newRelativeY = absolutePos.y;
  }

  // Get siblings in new parent (excluding the component being moved), sorted by order
  const newSiblings = state.components
    .filter(c => {
      const cParentId = c.parentId || null;
      return cParentId === newParentId && c.pageId === pageId && c.id !== componentId;
    })
    .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));

  // Determine insertion order in new parent
  let insertOrder: number;
  if (newIndex !== null && newIndex >= 0) {
    insertOrder = Math.max(0, Math.min(newIndex, newSiblings.length));
  } else {
    insertOrder = newSiblings.length;
  }

  // Update the moved component: set new parentId, position, and order
  let updatedComponents = state.components.map(c => {
    if (c.id === componentId) {
      return {
        ...c,
        parentId: newParentId,
        props: {
          ...c.props,
          x: newRelativeX,
          y: newRelativeY,
          order: insertOrder,
        },
      };
    }
    return c;
  });

  // Shift order of new siblings at or after insertOrder
  updatedComponents = updatedComponents.map(c => {
    if (c.id === componentId) return c;
    const cParentId = c.parentId || null;
    if (cParentId === newParentId && c.pageId === pageId) {
      const currentOrder = (c.props as any).order ?? 0;
      if (currentOrder >= insertOrder) {
        return { ...c, props: { ...c.props, order: currentOrder + 1 } };
      }
    }
    return c;
  });

  // Reassign contiguous order values in the new parent group
  updatedComponents = reassignSiblingOrders(updatedComponents, newParentId, pageId);

  // Also reassign order values in the old parent group (to close gaps)
  if (oldParentId !== newParentId) {
    updatedComponents = reassignSiblingOrders(updatedComponents, oldParentId, pageId);
  }

  // Validate the move
  const movedComponent = updatedComponents.find(c => c.id === componentId);
  if (!movedComponent) return state;
  if ((movedComponent.parentId || null) !== newParentId) return state;
  if (newParentId) {
    const newParent = updatedComponents.find(c => c.id === newParentId);
    if (!newParent) return state;
    const plugin = componentRegistry[newParent.type];
    if (!plugin || !plugin.isContainer) return state;
  }

  return {
    ...state,
    components: updatedComponents,
  };
}
