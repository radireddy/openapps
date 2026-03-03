import { describe, it, expect } from '@jest/globals';
import {
  getAbsolutePosition,
  calculateMarqueeRect,
  isMarqueeClick,
  clientToCanvasPosition,
  rectsIntersect,
  componentToBoundingRect,
  findComponentsInMarquee,
} from '@/utils/canvasCalculations';
import { AppComponent, ComponentType } from '@/types';

// Helper to create a minimal AppComponent for testing
function makeComponent(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  opts: { parentId?: string | null; pageId?: string } = {}
): AppComponent {
  return {
    id,
    type: ComponentType.LABEL,
    parentId: opts.parentId ?? null,
    pageId: opts.pageId ?? 'page1',
    props: { x, y, width, height } as any,
  };
}

describe('getAbsolutePosition', () => {
  it('should return component position when no parent', () => {
    const components = [makeComponent('a', 100, 200, 50, 50)];
    expect(getAbsolutePosition('a', components)).toEqual({ x: 100, y: 200 });
  });

  it('should add parent offset for nested component', () => {
    const components = [
      makeComponent('parent', 50, 60, 400, 300),
      makeComponent('child', 10, 20, 50, 50, { parentId: 'parent' }),
    ];
    expect(getAbsolutePosition('child', components)).toEqual({ x: 60, y: 80 });
  });

  it('should accumulate offsets through multiple parent levels', () => {
    const components = [
      makeComponent('root', 10, 10, 500, 500),
      makeComponent('mid', 20, 30, 300, 300, { parentId: 'root' }),
      makeComponent('leaf', 5, 5, 50, 50, { parentId: 'mid' }),
    ];
    expect(getAbsolutePosition('leaf', components)).toEqual({ x: 35, y: 45 });
  });

  it('should return {0, 0} for unknown component', () => {
    expect(getAbsolutePosition('unknown', [])).toEqual({ x: 0, y: 0 });
  });

  it('should handle broken parent chain gracefully', () => {
    const components = [
      makeComponent('orphan', 100, 100, 50, 50, { parentId: 'missing-parent' }),
    ];
    // Should just return own position since parent not found
    expect(getAbsolutePosition('orphan', components)).toEqual({ x: 100, y: 100 });
  });
});

describe('calculateMarqueeRect', () => {
  it('should create rect when dragging right-down', () => {
    expect(calculateMarqueeRect(10, 20, 100, 80)).toEqual({
      x: 10, y: 20, width: 90, height: 60,
    });
  });

  it('should create rect when dragging left-up', () => {
    expect(calculateMarqueeRect(100, 80, 10, 20)).toEqual({
      x: 10, y: 20, width: 90, height: 60,
    });
  });

  it('should handle zero-size marquee', () => {
    expect(calculateMarqueeRect(50, 50, 50, 50)).toEqual({
      x: 50, y: 50, width: 0, height: 0,
    });
  });

  it('should handle negative direction on one axis only', () => {
    expect(calculateMarqueeRect(100, 20, 50, 80)).toEqual({
      x: 50, y: 20, width: 50, height: 60,
    });
  });
});

describe('isMarqueeClick', () => {
  it('should return true for zero-size marquee', () => {
    expect(isMarqueeClick({ x: 0, y: 0, width: 0, height: 0 })).toBe(true);
  });

  it('should return true for marquee smaller than threshold', () => {
    expect(isMarqueeClick({ x: 0, y: 0, width: 3, height: 4 })).toBe(true);
  });

  it('should return false for marquee larger than threshold', () => {
    expect(isMarqueeClick({ x: 0, y: 0, width: 10, height: 10 })).toBe(false);
  });

  it('should return false if width exceeds threshold but height does not', () => {
    expect(isMarqueeClick({ x: 0, y: 0, width: 10, height: 2 })).toBe(false);
  });

  it('should use custom threshold', () => {
    expect(isMarqueeClick({ x: 0, y: 0, width: 8, height: 8 }, 10)).toBe(true);
    expect(isMarqueeClick({ x: 0, y: 0, width: 12, height: 12 }, 10)).toBe(false);
  });
});

describe('clientToCanvasPosition', () => {
  it('should convert client coordinates to canvas-relative', () => {
    const canvasRect = { left: 100, top: 50 };
    expect(clientToCanvasPosition(250, 180, canvasRect)).toEqual({ x: 150, y: 130 });
  });

  it('should handle zero offset', () => {
    const canvasRect = { left: 0, top: 0 };
    expect(clientToCanvasPosition(100, 200, canvasRect)).toEqual({ x: 100, y: 200 });
  });
});

describe('rectsIntersect', () => {
  it('should detect overlapping rects', () => {
    const a = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const b = { x1: 50, y1: 50, x2: 150, y2: 150 };
    expect(rectsIntersect(a, b)).toBe(true);
  });

  it('should detect contained rect', () => {
    const a = { x1: 0, y1: 0, x2: 200, y2: 200 };
    const b = { x1: 50, y1: 50, x2: 100, y2: 100 };
    expect(rectsIntersect(a, b)).toBe(true);
  });

  it('should return false for non-overlapping rects (side by side)', () => {
    const a = { x1: 0, y1: 0, x2: 50, y2: 50 };
    const b = { x1: 60, y1: 0, x2: 110, y2: 50 };
    expect(rectsIntersect(a, b)).toBe(false);
  });

  it('should return false for non-overlapping rects (vertically separated)', () => {
    const a = { x1: 0, y1: 0, x2: 50, y2: 50 };
    const b = { x1: 0, y1: 60, x2: 50, y2: 110 };
    expect(rectsIntersect(a, b)).toBe(false);
  });

  it('should detect edge-touching rects as intersecting', () => {
    const a = { x1: 0, y1: 0, x2: 50, y2: 50 };
    const b = { x1: 50, y1: 0, x2: 100, y2: 50 };
    // x2 == x1 means they share an edge — not strictly separated
    expect(rectsIntersect(a, b)).toBe(true);
  });
});

describe('componentToBoundingRect', () => {
  it('should convert root component to bounding rect', () => {
    const comp = makeComponent('a', 100, 200, 80, 60);
    expect(componentToBoundingRect(comp, [comp])).toEqual({
      x1: 100, y1: 200, x2: 180, y2: 260,
    });
  });

  it('should use absolute position for nested component', () => {
    const parent = makeComponent('p', 50, 50, 400, 300);
    const child = makeComponent('c', 10, 20, 80, 60, { parentId: 'p' });
    expect(componentToBoundingRect(child, [parent, child])).toEqual({
      x1: 60, y1: 70, x2: 140, y2: 130,
    });
  });
});

describe('findComponentsInMarquee', () => {
  const components: AppComponent[] = [
    makeComponent('a', 10, 10, 50, 50, { pageId: 'page1' }),
    makeComponent('b', 200, 200, 50, 50, { pageId: 'page1' }),
    makeComponent('c', 400, 400, 50, 50, { pageId: 'page1' }),
    makeComponent('d', 10, 10, 50, 50, { pageId: 'page2' }),
  ];

  it('should find components that intersect the marquee', () => {
    const marquee = { x: 0, y: 0, width: 100, height: 100 };
    const ids = findComponentsInMarquee(components, marquee, 'page1');
    expect(ids).toEqual(['a']);
  });

  it('should find multiple components in a large marquee', () => {
    const marquee = { x: 0, y: 0, width: 250, height: 250 };
    const ids = findComponentsInMarquee(components, marquee, 'page1');
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).not.toContain('c');
  });

  it('should return empty array when no components match', () => {
    const marquee = { x: 300, y: 300, width: 10, height: 10 };
    const ids = findComponentsInMarquee(components, marquee, 'page1');
    expect(ids).toEqual([]);
  });

  it('should only include components from the specified page', () => {
    const marquee = { x: 0, y: 0, width: 100, height: 100 };
    const ids = findComponentsInMarquee(components, marquee, 'page2');
    expect(ids).toEqual(['d']);
  });

  it('should select all page components with a huge marquee', () => {
    const marquee = { x: 0, y: 0, width: 1000, height: 1000 };
    const ids = findComponentsInMarquee(components, marquee, 'page1');
    expect(ids).toHaveLength(3);
  });

  it('should handle nested components using absolute positions', () => {
    const nested = [
      makeComponent('container', 100, 100, 200, 200, { pageId: 'page1' }),
      makeComponent('inner', 10, 10, 30, 30, { parentId: 'container', pageId: 'page1' }),
    ];
    // inner absolute position is (110, 110), size 30x30, so bounding is (110,110)-(140,140)
    const marquee = { x: 100, y: 100, width: 50, height: 50 };
    const ids = findComponentsInMarquee(nested, marquee, 'page1');
    expect(ids).toContain('container');
    expect(ids).toContain('inner');
  });
});
