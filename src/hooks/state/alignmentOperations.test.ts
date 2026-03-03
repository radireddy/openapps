import { describe, it, expect } from '@jest/globals';
import {
  calculateAlignmentUpdates,
  AlignAction,
} from '@/hooks/state/alignmentOperations';
import { AppComponent, ComponentType, ComponentProps } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal AppComponent with known position and size. */
function makeComponent(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): AppComponent {
  return {
    id,
    type: ComponentType.BUTTON,
    pageId: 'page1',
    props: {
      x,
      y,
      width,
      height,
      text: '',
      backgroundColor: '#000',
      textColor: '#fff',
      actionType: 'none',
    } as ComponentProps,
  };
}

// ---------------------------------------------------------------------------
// Reusable fixtures
// ---------------------------------------------------------------------------

// Two components:
//   A at (100, 50)  size 80x40
//   B at (200, 150) size 120x60
const compA = makeComponent('A', 100, 50, 80, 40);
const compB = makeComponent('B', 200, 150, 120, 60);

// Three components:
//   C1 at (50, 200)  size 60x30
//   C2 at (200, 50)  size 100x50
//   C3 at (350, 120) size 80x40
const comp1 = makeComponent('C1', 50, 200, 60, 30);
const comp2 = makeComponent('C2', 200, 50, 100, 50);
const comp3 = makeComponent('C3', 350, 120, 80, 40);

const twoComponents = [compA, compB];
const threeComponents = [comp1, comp2, comp3];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calculateAlignmentUpdates', () => {
  // =========================================================================
  // Edge cases: fewer than 2 selected components
  // =========================================================================
  describe('when fewer than 2 components are selected', () => {
    it('returns [] for an empty selection', () => {
      const result = calculateAlignmentUpdates('align-left', [], twoComponents);
      expect(result).toEqual([]);
    });

    it('returns [] for a single selected component', () => {
      const result = calculateAlignmentUpdates('align-left', ['A'], twoComponents);
      expect(result).toEqual([]);
    });

    it('returns [] when the single selected ID does not exist in allComponents', () => {
      const result = calculateAlignmentUpdates('align-left', ['MISSING'], twoComponents);
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // Edge case: selected IDs not found in allComponents
  // =========================================================================
  describe('when selected IDs are not found in allComponents', () => {
    it('filters out non-existent IDs and returns [] if remaining < 2', () => {
      const result = calculateAlignmentUpdates('align-left', ['MISSING1', 'MISSING2'], twoComponents);
      expect(result).toEqual([]);
    });

    it('filters out one non-existent ID and still operates if remaining >= 2', () => {
      const result = calculateAlignmentUpdates('align-left', ['A', 'MISSING', 'B'], twoComponents);
      // Should produce updates for A and B
      expect(result).toHaveLength(2);
      expect(result.map(u => u.id).sort()).toEqual(['A', 'B']);
    });
  });

  // =========================================================================
  // align-left
  // =========================================================================
  describe('align-left', () => {
    it('aligns 2 components to the leftmost x, stacked vertically sorted by y', () => {
      // Bounding box: x1=100, y1=50
      // Sorted by y: A(y=50), B(y=150)
      const result = calculateAlignmentUpdates('align-left', ['A', 'B'], twoComponents);
      expect(result).toHaveLength(2);

      // First (A): x = 100 (leftmost), y = 50 (bounding y1)
      expect(result[0]).toEqual({ id: 'A', props: { x: 100, y: 50 } });
      // Second (B): x = 100, y = 50 + 40 (A height) + 10 (GAP) = 100
      expect(result[1]).toEqual({ id: 'B', props: { x: 100, y: 100 } });
    });

    it('aligns 3 components to the leftmost x, stacked vertically sorted by y', () => {
      // Bounding box: x1=50, y1=50
      // Sorted by y: C2(y=50), C3(y=120), C1(y=200)
      const result = calculateAlignmentUpdates('align-left', ['C1', 'C2', 'C3'], threeComponents);
      expect(result).toHaveLength(3);

      // C2 first (lowest y): x=50, y=50
      expect(result[0]).toEqual({ id: 'C2', props: { x: 50, y: 50 } });
      // C3 next: y = 50 + 50 (C2 height) + 10 = 110
      expect(result[1]).toEqual({ id: 'C3', props: { x: 50, y: 110 } });
      // C1 last: y = 110 + 40 (C3 height) + 10 = 160
      expect(result[2]).toEqual({ id: 'C1', props: { x: 50, y: 160 } });
    });
  });

  // =========================================================================
  // align-center-h
  // =========================================================================
  describe('align-center-h', () => {
    it('centers 2 components horizontally on bounding box center, stacked vertically', () => {
      // Bounding box: x1=100, x2=320 (200+120), y1=50
      // centerX = 100 + (320 - 100) / 2 = 100 + 110 = 210
      // Sorted by y: A(y=50, w=80), B(y=150, w=120)
      const result = calculateAlignmentUpdates('align-center-h', ['A', 'B'], twoComponents);
      expect(result).toHaveLength(2);

      // A: x = 210 - 80/2 = 170, y = 50
      expect(result[0]).toEqual({ id: 'A', props: { x: 170, y: 50 } });
      // B: x = 210 - 120/2 = 150, y = 50 + 40 + 10 = 100
      expect(result[1]).toEqual({ id: 'B', props: { x: 150, y: 100 } });
    });

    it('centers 3 components horizontally on bounding box center, stacked vertically', () => {
      // Bounding box: x1=50, x2=430 (350+80), y1=50
      // centerX = 50 + (430 - 50) / 2 = 50 + 190 = 240
      // Sorted by y: C2(y=50, w=100), C3(y=120, w=80), C1(y=200, w=60)
      const result = calculateAlignmentUpdates('align-center-h', ['C1', 'C2', 'C3'], threeComponents);
      expect(result).toHaveLength(3);

      // C2: x = 240 - 100/2 = 190, y = 50
      expect(result[0]).toEqual({ id: 'C2', props: { x: 190, y: 50 } });
      // C3: x = 240 - 80/2 = 200, y = 50 + 50 + 10 = 110
      expect(result[1]).toEqual({ id: 'C3', props: { x: 200, y: 110 } });
      // C1: x = 240 - 60/2 = 210, y = 110 + 40 + 10 = 160
      expect(result[2]).toEqual({ id: 'C1', props: { x: 210, y: 160 } });
    });
  });

  // =========================================================================
  // align-right
  // =========================================================================
  describe('align-right', () => {
    it('aligns 2 components right edges to the rightmost, stacked vertically', () => {
      // Bounding box: x2 = max(100+80, 200+120) = max(180, 320) = 320, y1=50
      // Sorted by y: A(y=50, w=80), B(y=150, w=120)
      const result = calculateAlignmentUpdates('align-right', ['A', 'B'], twoComponents);
      expect(result).toHaveLength(2);

      // A: x = 320 - 80 = 240, y = 50
      expect(result[0]).toEqual({ id: 'A', props: { x: 240, y: 50 } });
      // B: x = 320 - 120 = 200, y = 50 + 40 + 10 = 100
      expect(result[1]).toEqual({ id: 'B', props: { x: 200, y: 100 } });
    });

    it('aligns 3 components right edges to the rightmost, stacked vertically', () => {
      // Bounding box: x2 = max(50+60, 200+100, 350+80) = max(110, 300, 430) = 430, y1=50
      // Sorted by y: C2(y=50, w=100), C3(y=120, w=80), C1(y=200, w=60)
      const result = calculateAlignmentUpdates('align-right', ['C1', 'C2', 'C3'], threeComponents);
      expect(result).toHaveLength(3);

      // C2: x = 430 - 100 = 330, y = 50
      expect(result[0]).toEqual({ id: 'C2', props: { x: 330, y: 50 } });
      // C3: x = 430 - 80 = 350, y = 50 + 50 + 10 = 110
      expect(result[1]).toEqual({ id: 'C3', props: { x: 350, y: 110 } });
      // C1: x = 430 - 60 = 370, y = 110 + 40 + 10 = 160
      expect(result[2]).toEqual({ id: 'C1', props: { x: 370, y: 160 } });
    });
  });

  // =========================================================================
  // align-top
  // =========================================================================
  describe('align-top', () => {
    it('aligns 2 components to the topmost y, stacked horizontally sorted by x', () => {
      // Bounding box: x1=100, y1=50
      // Sorted by x: A(x=100, w=80), B(x=200, w=120)
      const result = calculateAlignmentUpdates('align-top', ['A', 'B'], twoComponents);
      expect(result).toHaveLength(2);

      // A: x = 100, y = 50
      expect(result[0]).toEqual({ id: 'A', props: { x: 100, y: 50 } });
      // B: x = 100 + 80 + 10 = 190, y = 50
      expect(result[1]).toEqual({ id: 'B', props: { x: 190, y: 50 } });
    });

    it('aligns 3 components to the topmost y, stacked horizontally sorted by x', () => {
      // Bounding box: x1=50, y1=50
      // Sorted by x: C1(x=50, w=60), C2(x=200, w=100), C3(x=350, w=80)
      const result = calculateAlignmentUpdates('align-top', ['C1', 'C2', 'C3'], threeComponents);
      expect(result).toHaveLength(3);

      // C1: x = 50, y = 50
      expect(result[0]).toEqual({ id: 'C1', props: { x: 50, y: 50 } });
      // C2: x = 50 + 60 + 10 = 120, y = 50
      expect(result[1]).toEqual({ id: 'C2', props: { x: 120, y: 50 } });
      // C3: x = 120 + 100 + 10 = 230, y = 50
      expect(result[2]).toEqual({ id: 'C3', props: { x: 230, y: 50 } });
    });
  });

  // =========================================================================
  // align-center-v
  // =========================================================================
  describe('align-center-v', () => {
    it('centers 2 components vertically on bounding box center, stacked horizontally', () => {
      // Bounding box: y1=50, y2=210 (150+60), x1=100
      // centerY = 50 + (210 - 50) / 2 = 50 + 80 = 130
      // Sorted by x: A(x=100, h=40, w=80), B(x=200, h=60, w=120)
      const result = calculateAlignmentUpdates('align-center-v', ['A', 'B'], twoComponents);
      expect(result).toHaveLength(2);

      // A: x = 100, y = 130 - 40/2 = 110
      expect(result[0]).toEqual({ id: 'A', props: { x: 100, y: 110 } });
      // B: x = 100 + 80 + 10 = 190, y = 130 - 60/2 = 100
      expect(result[1]).toEqual({ id: 'B', props: { x: 190, y: 100 } });
    });

    it('centers 3 components vertically on bounding box center, stacked horizontally', () => {
      // Bounding box: y1=50, y2=230 (200+30), x1=50
      // centerY = 50 + (230 - 50) / 2 = 50 + 90 = 140
      // Sorted by x: C1(x=50, h=30, w=60), C2(x=200, h=50, w=100), C3(x=350, h=40, w=80)
      const result = calculateAlignmentUpdates('align-center-v', ['C1', 'C2', 'C3'], threeComponents);
      expect(result).toHaveLength(3);

      // C1: x = 50, y = 140 - 30/2 = 125
      expect(result[0]).toEqual({ id: 'C1', props: { x: 50, y: 125 } });
      // C2: x = 50 + 60 + 10 = 120, y = 140 - 50/2 = 115
      expect(result[1]).toEqual({ id: 'C2', props: { x: 120, y: 115 } });
      // C3: x = 120 + 100 + 10 = 230, y = 140 - 40/2 = 120
      expect(result[2]).toEqual({ id: 'C3', props: { x: 230, y: 120 } });
    });
  });

  // =========================================================================
  // align-bottom
  // =========================================================================
  describe('align-bottom', () => {
    it('aligns 2 components bottom edges to the bottommost, stacked horizontally', () => {
      // Bounding box: y2 = max(50+40, 150+60) = max(90, 210) = 210, x1=100
      // Sorted by x: A(x=100, w=80, h=40), B(x=200, w=120, h=60)
      const result = calculateAlignmentUpdates('align-bottom', ['A', 'B'], twoComponents);
      expect(result).toHaveLength(2);

      // A: x = 100, y = 210 - 40 = 170
      expect(result[0]).toEqual({ id: 'A', props: { x: 100, y: 170 } });
      // B: x = 100 + 80 + 10 = 190, y = 210 - 60 = 150
      expect(result[1]).toEqual({ id: 'B', props: { x: 190, y: 150 } });
    });

    it('aligns 3 components bottom edges to the bottommost, stacked horizontally', () => {
      // Bounding box: y2 = max(200+30, 50+50, 120+40) = max(230, 100, 160) = 230, x1=50
      // Sorted by x: C1(x=50, w=60, h=30), C2(x=200, w=100, h=50), C3(x=350, w=80, h=40)
      const result = calculateAlignmentUpdates('align-bottom', ['C1', 'C2', 'C3'], threeComponents);
      expect(result).toHaveLength(3);

      // C1: x = 50, y = 230 - 30 = 200
      expect(result[0]).toEqual({ id: 'C1', props: { x: 50, y: 200 } });
      // C2: x = 50 + 60 + 10 = 120, y = 230 - 50 = 180
      expect(result[1]).toEqual({ id: 'C2', props: { x: 120, y: 180 } });
      // C3: x = 120 + 100 + 10 = 230, y = 230 - 40 = 190
      expect(result[2]).toEqual({ id: 'C3', props: { x: 230, y: 190 } });
    });
  });

  // =========================================================================
  // distribute-h
  // =========================================================================
  describe('distribute-h', () => {
    it('returns [] when exactly 2 components are selected (needs > 2)', () => {
      const result = calculateAlignmentUpdates('distribute-h', ['A', 'B'], twoComponents);
      expect(result).toEqual([]);
    });

    it('distributes 3 components evenly horizontally', () => {
      // Sorted by x: C1(x=50, w=60), C2(x=200, w=100), C3(x=350, w=80)
      // totalWidth = 60 + 100 + 80 = 240
      // totalSpace = 350 + 80 - 50 = 380
      // totalGap = 380 - 240 = 140
      // gap = 140 / (3 - 1) = 70
      const result = calculateAlignmentUpdates('distribute-h', ['C1', 'C2', 'C3'], threeComponents);
      expect(result).toHaveLength(3);

      // C1 stays at x=50
      expect(result[0]).toEqual({ id: 'C1', props: { x: 50 } });
      // C2: x = 50 + 60 + 70 = 180
      expect(result[1]).toEqual({ id: 'C2', props: { x: 180 } });
      // C3: x = 180 + 100 + 70 = 350
      expect(result[2]).toEqual({ id: 'C3', props: { x: 350 } });
    });

    it('distributes 4 components evenly horizontally', () => {
      // D1(x=0, w=20), D2(x=100, w=20), D3(x=200, w=20), D4(x=300, w=20)
      const d1 = makeComponent('D1', 0, 0, 20, 30);
      const d2 = makeComponent('D2', 100, 0, 20, 30);
      const d3 = makeComponent('D3', 200, 0, 20, 30);
      const d4 = makeComponent('D4', 300, 0, 20, 30);
      const all = [d1, d2, d3, d4];

      // totalWidth = 80
      // totalSpace = 300 + 20 - 0 = 320
      // totalGap = 320 - 80 = 240
      // gap = 240 / 3 = 80
      const result = calculateAlignmentUpdates('distribute-h', ['D1', 'D2', 'D3', 'D4'], all);
      expect(result).toHaveLength(4);

      expect(result[0]).toEqual({ id: 'D1', props: { x: 0 } });
      expect(result[1]).toEqual({ id: 'D2', props: { x: 100 } }); // 0 + 20 + 80
      expect(result[2]).toEqual({ id: 'D3', props: { x: 200 } }); // 100 + 20 + 80
      expect(result[3]).toEqual({ id: 'D4', props: { x: 300 } }); // 200 + 20 + 80
    });

    it('handles components that are already overlapping', () => {
      // Overlapping: all starting at x=50 with width 40
      const o1 = makeComponent('O1', 50, 0, 40, 30);
      const o2 = makeComponent('O2', 50, 0, 40, 30);
      const o3 = makeComponent('O3', 50, 0, 40, 30);
      const all = [o1, o2, o3];

      // totalWidth = 120
      // totalSpace = 50 + 40 - 50 = 40
      // totalGap = 40 - 120 = -80
      // gap = -80 / 2 = -40
      const result = calculateAlignmentUpdates('distribute-h', ['O1', 'O2', 'O3'], all);
      expect(result).toHaveLength(3);

      // All at same x, sorted by x (stable sort, they're all 50)
      expect(result[0]).toEqual({ id: 'O1', props: { x: 50 } });
      // 50 + 40 + (-40) = 50
      expect(result[1]).toEqual({ id: 'O2', props: { x: 50 } });
      // 50 + 40 + (-40) = 50
      expect(result[2]).toEqual({ id: 'O3', props: { x: 50 } });
    });
  });

  // =========================================================================
  // distribute-v
  // =========================================================================
  describe('distribute-v', () => {
    it('returns [] when exactly 2 components are selected (needs > 2)', () => {
      const result = calculateAlignmentUpdates('distribute-v', ['A', 'B'], twoComponents);
      expect(result).toEqual([]);
    });

    it('distributes 3 components evenly vertically', () => {
      // Sorted by y: C2(y=50, h=50), C3(y=120, h=40), C1(y=200, h=30)
      // totalHeight = 50 + 40 + 30 = 120
      // totalSpace = 200 + 30 - 50 = 180
      // totalGap = 180 - 120 = 60
      // gap = 60 / 2 = 30
      const result = calculateAlignmentUpdates('distribute-v', ['C1', 'C2', 'C3'], threeComponents);
      expect(result).toHaveLength(3);

      // C2 stays at y=50
      expect(result[0]).toEqual({ id: 'C2', props: { y: 50 } });
      // C3: y = 50 + 50 + 30 = 130
      expect(result[1]).toEqual({ id: 'C3', props: { y: 130 } });
      // C1: y = 130 + 40 + 30 = 200
      expect(result[2]).toEqual({ id: 'C1', props: { y: 200 } });
    });

    it('distributes 4 components evenly vertically', () => {
      const d1 = makeComponent('D1', 0, 0, 30, 20);
      const d2 = makeComponent('D2', 0, 100, 30, 20);
      const d3 = makeComponent('D3', 0, 200, 30, 20);
      const d4 = makeComponent('D4', 0, 300, 30, 20);
      const all = [d1, d2, d3, d4];

      // totalHeight = 80
      // totalSpace = 300 + 20 - 0 = 320
      // totalGap = 320 - 80 = 240
      // gap = 240 / 3 = 80
      const result = calculateAlignmentUpdates('distribute-v', ['D1', 'D2', 'D3', 'D4'], all);
      expect(result).toHaveLength(4);

      expect(result[0]).toEqual({ id: 'D1', props: { y: 0 } });
      expect(result[1]).toEqual({ id: 'D2', props: { y: 100 } });
      expect(result[2]).toEqual({ id: 'D3', props: { y: 200 } });
      expect(result[3]).toEqual({ id: 'D4', props: { y: 300 } });
    });

    it('handles components that are already overlapping', () => {
      const o1 = makeComponent('O1', 0, 100, 30, 50);
      const o2 = makeComponent('O2', 0, 100, 30, 50);
      const o3 = makeComponent('O3', 0, 100, 30, 50);
      const all = [o1, o2, o3];

      // totalHeight = 150
      // totalSpace = 100 + 50 - 100 = 50
      // totalGap = 50 - 150 = -100
      // gap = -100 / 2 = -50
      const result = calculateAlignmentUpdates('distribute-v', ['O1', 'O2', 'O3'], all);
      expect(result).toHaveLength(3);

      expect(result[0]).toEqual({ id: 'O1', props: { y: 100 } });
      expect(result[1]).toEqual({ id: 'O2', props: { y: 100 } }); // 100 + 50 - 50
      expect(result[2]).toEqual({ id: 'O3', props: { y: 100 } }); // 100 + 50 - 50
    });
  });

  // =========================================================================
  // match-width
  // =========================================================================
  describe('match-width', () => {
    it('uses the first selected ID as the reference for width', () => {
      // A has width=80, B has width=120
      // Reference is A (first in selectedComponentIds)
      const result = calculateAlignmentUpdates('match-width', ['A', 'B'], twoComponents);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'B', props: { width: 80 } });
    });

    it('uses the first selected ID as reference even if it is not first in allComponents', () => {
      // Reference is B (first in selectedComponentIds), width=120
      const result = calculateAlignmentUpdates('match-width', ['B', 'A'], twoComponents);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'A', props: { width: 120 } });
    });

    it('sets width of all non-reference components to the reference width with 3 components', () => {
      // Reference is C2 (first), width=100
      const result = calculateAlignmentUpdates('match-width', ['C2', 'C1', 'C3'], threeComponents);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 'C1', props: { width: 100 } });
      expect(result).toContainEqual({ id: 'C3', props: { width: 100 } });
    });

    it('does not include the reference component in updates', () => {
      const result = calculateAlignmentUpdates('match-width', ['A', 'B'], twoComponents);
      const ids = result.map(u => u.id);
      expect(ids).not.toContain('A');
    });

    it('returns [] if the reference component is not found in allComponents', () => {
      // 'MISSING' is first selected ID but not in allComponents
      // After filtering, selectedComponents = [A, B] with length 2
      // But the reference lookup uses componentsMap.get(selectedComponentIds[0]) => undefined
      const result = calculateAlignmentUpdates('match-width', ['MISSING', 'A', 'B'], twoComponents);
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // match-height
  // =========================================================================
  describe('match-height', () => {
    it('uses the first selected ID as the reference for height', () => {
      // A has height=40, B has height=60
      // Reference is A (first in selectedComponentIds)
      const result = calculateAlignmentUpdates('match-height', ['A', 'B'], twoComponents);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'B', props: { height: 40 } });
    });

    it('uses the first selected ID as reference even if it is not first in allComponents', () => {
      // Reference is B (first in selectedComponentIds), height=60
      const result = calculateAlignmentUpdates('match-height', ['B', 'A'], twoComponents);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'A', props: { height: 60 } });
    });

    it('sets height of all non-reference components to the reference height with 3 components', () => {
      // Reference is C3 (first), height=40
      const result = calculateAlignmentUpdates('match-height', ['C3', 'C1', 'C2'], threeComponents);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 'C1', props: { height: 40 } });
      expect(result).toContainEqual({ id: 'C2', props: { height: 40 } });
    });

    it('does not include the reference component in updates', () => {
      const result = calculateAlignmentUpdates('match-height', ['A', 'B'], twoComponents);
      const ids = result.map(u => u.id);
      expect(ids).not.toContain('A');
    });

    it('returns [] if the reference component is not found in allComponents', () => {
      const result = calculateAlignmentUpdates('match-height', ['MISSING', 'A', 'B'], twoComponents);
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // Sorting behavior verification
  // =========================================================================
  describe('sorting behavior', () => {
    it('align-left sorts by y regardless of selection order', () => {
      // Pass B first, A second in selection; A has lower y so should come first
      const result = calculateAlignmentUpdates('align-left', ['B', 'A'], twoComponents);
      expect(result[0].id).toBe('A'); // y=50 < y=150
      expect(result[1].id).toBe('B');
    });

    it('align-top sorts by x regardless of selection order', () => {
      // Pass B first, A second in selection; A has lower x so should come first
      const result = calculateAlignmentUpdates('align-top', ['B', 'A'], twoComponents);
      expect(result[0].id).toBe('A'); // x=100 < x=200
      expect(result[1].id).toBe('B');
    });

    it('distribute-h sorts by x regardless of selection order', () => {
      const result = calculateAlignmentUpdates('distribute-h', ['C3', 'C1', 'C2'], threeComponents);
      expect(result[0].id).toBe('C1'); // x=50
      expect(result[1].id).toBe('C2'); // x=200
      expect(result[2].id).toBe('C3'); // x=350
    });

    it('distribute-v sorts by y regardless of selection order', () => {
      const result = calculateAlignmentUpdates('distribute-v', ['C1', 'C3', 'C2'], threeComponents);
      expect(result[0].id).toBe('C2'); // y=50
      expect(result[1].id).toBe('C3'); // y=120
      expect(result[2].id).toBe('C1'); // y=200
    });
  });

  // =========================================================================
  // Components with same position (ties)
  // =========================================================================
  describe('components at the same position', () => {
    it('align-left handles components with the same y', () => {
      const s1 = makeComponent('S1', 10, 50, 60, 30);
      const s2 = makeComponent('S2', 100, 50, 80, 40);
      const all = [s1, s2];

      // Both at y=50; bounding box: x1=10, y1=50
      const result = calculateAlignmentUpdates('align-left', ['S1', 'S2'], all);
      expect(result).toHaveLength(2);

      // Both get x=10; first y=50, second y=50+30+10=90
      expect(result[0]).toEqual({ id: 'S1', props: { x: 10, y: 50 } });
      expect(result[1]).toEqual({ id: 'S2', props: { x: 10, y: 90 } });
    });

    it('align-top handles components with the same x', () => {
      const s1 = makeComponent('S1', 100, 10, 60, 30);
      const s2 = makeComponent('S2', 100, 200, 80, 40);
      const all = [s1, s2];

      // Both at x=100; bounding box: x1=100, y1=10
      const result = calculateAlignmentUpdates('align-top', ['S1', 'S2'], all);
      expect(result).toHaveLength(2);

      // Both get y=10; first x=100, second x=100+60+10=170
      expect(result[0]).toEqual({ id: 'S1', props: { x: 100, y: 10 } });
      expect(result[1]).toEqual({ id: 'S2', props: { x: 170, y: 10 } });
    });
  });

  // =========================================================================
  // Bounding box calculations
  // =========================================================================
  describe('bounding box calculations', () => {
    it('uses correct bounding box when leftmost component is not topmost', () => {
      // compA at (100,50) is leftmost but not topmost
      // compB at (200,150) is rightmost but also lowest
      // So x1=100, y1=50, x2=320, y2=210
      const result = calculateAlignmentUpdates('align-left', ['A', 'B'], twoComponents);
      // Both should get x=100 (bounding x1)
      expect(result[0].props.x).toBe(100);
      expect(result[1].props.x).toBe(100);
    });

    it('computes correct right edge for align-right with different widths', () => {
      const narrow = makeComponent('N', 0, 0, 20, 30);
      const wide = makeComponent('W', 50, 50, 200, 30);
      const all = [narrow, wide];

      // x2 = max(0+20, 50+200) = max(20, 250) = 250
      const result = calculateAlignmentUpdates('align-right', ['N', 'W'], all);

      // N: x = 250 - 20 = 230
      expect(result[0].props.x).toBe(230);
      // W: x = 250 - 200 = 50
      expect(result[1].props.x).toBe(50);
    });

    it('computes correct bottom edge for align-bottom with different heights', () => {
      const short = makeComponent('S', 0, 0, 30, 10);
      const tall = makeComponent('T', 50, 50, 30, 200);
      const all = [short, tall];

      // y2 = max(0+10, 50+200) = max(10, 250) = 250
      const result = calculateAlignmentUpdates('align-bottom', ['S', 'T'], all);

      // S: y = 250 - 10 = 240
      expect(result[0].props.y).toBe(240);
      // T: y = 250 - 200 = 50
      expect(result[1].props.y).toBe(50);
    });
  });

  // =========================================================================
  // All actions return [] for < 2 selected components
  // =========================================================================
  describe('all actions return [] for fewer than 2 selected components', () => {
    const allActions: AlignAction[] = [
      'align-left', 'align-center-h', 'align-right',
      'align-top', 'align-center-v', 'align-bottom',
      'distribute-h', 'distribute-v',
      'match-width', 'match-height',
    ];

    allActions.forEach(action => {
      it(`${action} returns [] with 0 selected components`, () => {
        expect(calculateAlignmentUpdates(action, [], twoComponents)).toEqual([]);
      });

      it(`${action} returns [] with 1 selected component`, () => {
        expect(calculateAlignmentUpdates(action, ['A'], twoComponents)).toEqual([]);
      });
    });
  });

  // =========================================================================
  // GAP constant verification
  // =========================================================================
  describe('GAP constant (10px) is applied correctly', () => {
    it('align-left stacking gap is exactly 10', () => {
      const a = makeComponent('a', 0, 0, 50, 100);
      const b = makeComponent('b', 0, 200, 50, 100);
      const all = [a, b];
      const result = calculateAlignmentUpdates('align-left', ['a', 'b'], all);

      // a: y=0, b: y=0+100+10=110
      expect(result[1].props.y).toBe(110);
      // gap = result[1].y - (result[0].y + a.height) = 110 - 100 = 10
      const gap = (result[1].props.y as number) - ((result[0].props.y as number) + 100);
      expect(gap).toBe(10);
    });

    it('align-top stacking gap is exactly 10', () => {
      const a = makeComponent('a', 0, 0, 100, 50);
      const b = makeComponent('b', 200, 0, 100, 50);
      const all = [a, b];
      const result = calculateAlignmentUpdates('align-top', ['a', 'b'], all);

      // a: x=0, b: x=0+100+10=110
      expect(result[1].props.x).toBe(110);
      const gap = (result[1].props.x as number) - ((result[0].props.x as number) + 100);
      expect(gap).toBe(10);
    });
  });

  // =========================================================================
  // distribute-h/v with exactly 2 components returns []
  // =========================================================================
  describe('distribute actions require more than 2 components', () => {
    it('distribute-h with 2 components returns []', () => {
      expect(calculateAlignmentUpdates('distribute-h', ['A', 'B'], twoComponents)).toEqual([]);
    });

    it('distribute-v with 2 components returns []', () => {
      expect(calculateAlignmentUpdates('distribute-v', ['A', 'B'], twoComponents)).toEqual([]);
    });

    it('distribute-h with 3 components returns updates', () => {
      const result = calculateAlignmentUpdates('distribute-h', ['C1', 'C2', 'C3'], threeComponents);
      expect(result.length).toBeGreaterThan(0);
    });

    it('distribute-v with 3 components returns updates', () => {
      const result = calculateAlignmentUpdates('distribute-v', ['C1', 'C2', 'C3'], threeComponents);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Return value structure
  // =========================================================================
  describe('return value structure', () => {
    it('each update has an id and props object', () => {
      const result = calculateAlignmentUpdates('align-left', ['A', 'B'], twoComponents);
      result.forEach(update => {
        expect(update).toHaveProperty('id');
        expect(update).toHaveProperty('props');
        expect(typeof update.id).toBe('string');
        expect(typeof update.props).toBe('object');
      });
    });

    it('align actions produce updates with both x and y', () => {
      const alignActions: AlignAction[] = [
        'align-left', 'align-center-h', 'align-right',
        'align-top', 'align-center-v', 'align-bottom',
      ];
      alignActions.forEach(action => {
        const result = calculateAlignmentUpdates(action, ['A', 'B'], twoComponents);
        result.forEach(update => {
          expect(update.props).toHaveProperty('x');
          expect(update.props).toHaveProperty('y');
        });
      });
    });

    it('distribute-h produces updates with only x', () => {
      const result = calculateAlignmentUpdates('distribute-h', ['C1', 'C2', 'C3'], threeComponents);
      result.forEach(update => {
        expect(update.props).toHaveProperty('x');
        expect(update.props).not.toHaveProperty('y');
      });
    });

    it('distribute-v produces updates with only y', () => {
      const result = calculateAlignmentUpdates('distribute-v', ['C1', 'C2', 'C3'], threeComponents);
      result.forEach(update => {
        expect(update.props).toHaveProperty('y');
        expect(update.props).not.toHaveProperty('x');
      });
    });

    it('match-width produces updates with only width', () => {
      const result = calculateAlignmentUpdates('match-width', ['A', 'B'], twoComponents);
      result.forEach(update => {
        expect(update.props).toHaveProperty('width');
        expect(update.props).not.toHaveProperty('height');
      });
    });

    it('match-height produces updates with only height', () => {
      const result = calculateAlignmentUpdates('match-height', ['A', 'B'], twoComponents);
      result.forEach(update => {
        expect(update.props).toHaveProperty('height');
        expect(update.props).not.toHaveProperty('width');
      });
    });
  });

  // =========================================================================
  // match-width/height: reference component is NOT updated
  // =========================================================================
  describe('match-width/height reference exclusion', () => {
    it('match-width with 3 components updates all except the reference', () => {
      // Reference is C1 (first), width=60
      const result = calculateAlignmentUpdates('match-width', ['C1', 'C2', 'C3'], threeComponents);
      const ids = result.map(u => u.id);
      expect(ids).not.toContain('C1');
      expect(ids).toContain('C2');
      expect(ids).toContain('C3');
      result.forEach(u => {
        expect(u.props.width).toBe(60);
      });
    });

    it('match-height with 3 components updates all except the reference', () => {
      // Reference is C1 (first), height=30
      const result = calculateAlignmentUpdates('match-height', ['C1', 'C2', 'C3'], threeComponents);
      const ids = result.map(u => u.id);
      expect(ids).not.toContain('C1');
      expect(ids).toContain('C2');
      expect(ids).toContain('C3');
      result.forEach(u => {
        expect(u.props.height).toBe(30);
      });
    });
  });

  // =========================================================================
  // Large coordinate values
  // =========================================================================
  describe('large coordinate and size values', () => {
    it('handles large coordinates correctly for align-center-h', () => {
      const big1 = makeComponent('B1', 1000, 2000, 500, 300);
      const big2 = makeComponent('B2', 3000, 4000, 700, 400);
      const all = [big1, big2];

      // Bounding box: x1=1000, x2=3700, y1=2000
      // centerX = 1000 + (3700 - 1000)/2 = 1000 + 1350 = 2350
      const result = calculateAlignmentUpdates('align-center-h', ['B1', 'B2'], all);

      // B1: x = 2350 - 500/2 = 2100, y = 2000
      expect(result[0]).toEqual({ id: 'B1', props: { x: 2100, y: 2000 } });
      // B2: x = 2350 - 700/2 = 2000, y = 2000 + 300 + 10 = 2310
      expect(result[1]).toEqual({ id: 'B2', props: { x: 2000, y: 2310 } });
    });
  });

  // =========================================================================
  // Zero-sized components
  // =========================================================================
  describe('zero-width or zero-height components', () => {
    it('align-left handles zero-height components', () => {
      const z1 = makeComponent('Z1', 50, 100, 80, 0);
      const z2 = makeComponent('Z2', 100, 200, 60, 40);
      const all = [z1, z2];

      // Bounding box: x1=50, y1=100
      // Sorted by y: Z1(y=100, h=0), Z2(y=200, h=40)
      const result = calculateAlignmentUpdates('align-left', ['Z1', 'Z2'], all);

      // Z1: x=50, y=100
      expect(result[0]).toEqual({ id: 'Z1', props: { x: 50, y: 100 } });
      // Z2: x=50, y=100+0+10=110
      expect(result[1]).toEqual({ id: 'Z2', props: { x: 50, y: 110 } });
    });

    it('align-top handles zero-width components', () => {
      const z1 = makeComponent('Z1', 50, 100, 0, 80);
      const z2 = makeComponent('Z2', 100, 200, 60, 40);
      const all = [z1, z2];

      // Bounding box: x1=50, y1=100
      // Sorted by x: Z1(x=50, w=0), Z2(x=100, w=60)
      const result = calculateAlignmentUpdates('align-top', ['Z1', 'Z2'], all);

      // Z1: x=50, y=100
      expect(result[0]).toEqual({ id: 'Z1', props: { x: 50, y: 100 } });
      // Z2: x=50+0+10=60, y=100
      expect(result[1]).toEqual({ id: 'Z2', props: { x: 60, y: 100 } });
    });
  });
});
