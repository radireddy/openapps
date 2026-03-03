/**
 * Pure utility functions for canvas coordinate calculations,
 * hit testing, and marquee selection logic.
 *
 * Extracted from Canvas.tsx to enable unit testing without DOM dependencies.
 */

import { AppComponent } from '../types';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoundingRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Calculate the absolute position of a component on the canvas,
 * accounting for all parent offsets up the hierarchy.
 */
export function getAbsolutePosition(
  componentId: string,
  allComponents: AppComponent[]
): { x: number; y: number } {
  const component = allComponents.find(c => c.id === componentId);
  if (!component) return { x: 0, y: 0 };

  let absX = component.props.x as number;
  let absY = component.props.y as number;
  let currentParentId = component.parentId;

  while (currentParentId) {
    const parent = allComponents.find(p => p.id === currentParentId);
    if (parent) {
      absX += parent.props.x as number;
      absY += parent.props.y as number;
      currentParentId = parent.parentId;
    } else {
      break;
    }
  }

  return { x: absX, y: absY };
}

/**
 * Calculate the marquee rectangle from a start position and current mouse position.
 * Handles dragging in any direction (start can be bottom-right of current).
 */
export function calculateMarqueeRect(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): Rect {
  return {
    x: Math.min(startX, currentX),
    y: Math.min(startY, currentY),
    width: Math.abs(currentX - startX),
    height: Math.abs(currentY - startY),
  };
}

/**
 * Determine if a marquee gesture is actually a click (too small to be a drag).
 */
export function isMarqueeClick(marquee: Rect, threshold: number = 5): boolean {
  return marquee.width < threshold && marquee.height < threshold;
}

/**
 * Convert a client (screen) coordinate to a canvas-relative coordinate.
 */
export function clientToCanvasPosition(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect | { left: number; top: number }
): { x: number; y: number } {
  return {
    x: clientX - canvasRect.left,
    y: clientY - canvasRect.top,
  };
}

/**
 * Test whether two bounding rectangles intersect.
 */
export function rectsIntersect(a: BoundingRect, b: BoundingRect): boolean {
  return !(a.x1 > b.x2 || a.x2 < b.x1 || a.y1 > b.y2 || a.y2 < b.y1);
}

/**
 * Convert a component's position + size to a bounding rect,
 * using absolute positions from the hierarchy.
 */
export function componentToBoundingRect(
  component: AppComponent,
  allComponents: AppComponent[]
): BoundingRect {
  const { x, y } = getAbsolutePosition(component.id, allComponents);
  return {
    x1: x,
    y1: y,
    x2: x + (component.props.width as number),
    y2: y + (component.props.height as number),
  };
}

/**
 * Find all components on a page that intersect with a given marquee rectangle.
 * Returns the IDs of matching components.
 */
export function findComponentsInMarquee(
  allComponents: AppComponent[],
  marquee: Rect,
  pageId: string
): string[] {
  const marqueeRect: BoundingRect = {
    x1: marquee.x,
    y1: marquee.y,
    x2: marquee.x + marquee.width,
    y2: marquee.y + marquee.height,
  };

  return allComponents
    .filter(comp => comp.pageId === pageId)
    .filter(comp => {
      const compRect = componentToBoundingRect(comp, allComponents);
      return rectsIntersect(compRect, marqueeRect);
    })
    .map(c => c.id);
}
