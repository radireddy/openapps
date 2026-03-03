import { AppComponent, ComponentType } from '../../types';

/**
 * Parse CSS padding string to structured object with all four sides.
 * Handles formats: number, "10", "10 20", "10 20 30 40"
 */
export function parsePaddingValue(padding?: string | number): { left: number; top: number; right: number; bottom: number } {
  if (padding === undefined) return { left: 0, top: 0, right: 0, bottom: 0 };
  if (typeof padding === 'number') return { left: padding, top: padding, right: padding, bottom: padding };
  const parts = String(padding).trim().split(/\s+/);
  if (parts.length === 1) {
    const value = parseFloat(parts[0]) || 0;
    return { left: value, top: value, right: value, bottom: value };
  } else if (parts.length === 2) {
    const top = parseFloat(parts[0]) || 0;
    const right = parseFloat(parts[1]) || 0;
    return { top, right, bottom: top, left: right };
  } else if (parts.length === 4) {
    return {
      top: parseFloat(parts[0]) || 0,
      right: parseFloat(parts[1]) || 0,
      bottom: parseFloat(parts[2]) || 0,
      left: parseFloat(parts[3]) || 0,
    };
  }
  return { left: 0, top: 0, right: 0, bottom: 0 };
}

/**
 * Parse CSS padding string to a simplified object with only left and top.
 * Used for positioning calculations within addComponent and updateComponent
 * where only left/top offsets are needed.
 */
export function parsePaddingLeftTop(padding?: string | number): { left: number; top: number } {
  if (padding === undefined) return { left: 0, top: 0 };
  if (typeof padding === 'number') return { left: padding, top: padding };
  const parts = String(padding).trim().split(/\s+/);
  if (parts.length === 1) {
    const value = parseFloat(parts[0]) || 0;
    return { left: value, top: value };
  } else if (parts.length === 2) {
    return { top: parseFloat(parts[0]) || 0, left: parseFloat(parts[1]) || 0 };
  } else if (parts.length === 4) {
    return { top: parseFloat(parts[0]) || 0, left: parseFloat(parts[3]) || 0 };
  }
  return { left: 0, top: 0 };
}

/** Parse width/height to number (handles "400px", "50%", or number) */
export function parseSizeToNumber(size: any): number {
  if (typeof size === 'number') return size;
  if (typeof size === 'string' && size.trim()) {
    // Extract numeric value from strings like "400px" or "50%"
    const match = size.trim().match(/^(\d+(?:\.\d+)?)/);
    if (match) return parseFloat(match[1]);
  }
  return 0;
}

/**
 * Get absolute position of a component on canvas (border position).
 * For Container parents, accounts for padding: child positions are relative to padding edge.
 * Uses a visited set to prevent infinite loops from circular parent references.
 */
export function getAbsolutePosition(
  componentId: string,
  allComponents: AppComponent[],
  visited: Set<string> = new Set()
): { x: number; y: number } {
  // Prevent infinite loops from circular references
  if (visited.has(componentId)) {
    console.warn(`Circular parent reference detected for component ${componentId}`);
    return { x: 0, y: 0 };
  }
  visited.add(componentId);

  const component = allComponents.find(c => c.id === componentId);
  if (!component) return { x: 0, y: 0 };

  // Start with component's own position
  let absX = component.props.x;
  let absY = component.props.y;
  let currentParentId = component.parentId;

  while (currentParentId) {
    if (visited.has(currentParentId)) {
      console.warn(`Circular parent reference detected in parent chain for component ${componentId}`);
      break;
    }
    visited.add(currentParentId);
    const parent = allComponents.find(p => p.id === currentParentId);
    if (parent) {
      // Add parent's border position
      absX += parent.props.x;
      absY += parent.props.y;
      // For Container and List types, child positions are relative to padding edge (content area)
      // So we need to add padding to get the absolute border position
      if (parent.type === ComponentType.CONTAINER || parent.type === ComponentType.LIST) {
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
}

/**
 * Check if childId is a descendant of parentId.
 * Uses a visited set to prevent infinite recursion in case of circular references.
 */
export function isDescendant(
  childId: string,
  parentId: string,
  allComponents: AppComponent[],
  visited: Set<string> = new Set()
): boolean {
  // Prevent infinite recursion from circular references
  if (visited.has(childId)) return false;
  visited.add(childId);

  const child = allComponents.find(c => c.id === childId);
  if (!child || !child.parentId) return false;
  if (child.parentId === parentId) return true;
  return isDescendant(child.parentId, parentId, allComponents, visited);
}
