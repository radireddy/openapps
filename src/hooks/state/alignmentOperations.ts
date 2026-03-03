import { AppComponent, ComponentProps } from '../../types';

export type AlignAction =
  | 'align-left' | 'align-center-h' | 'align-right'
  | 'align-top' | 'align-center-v' | 'align-bottom'
  | 'distribute-h' | 'distribute-v'
  | 'match-width' | 'match-height';

// Helper to safely extract numeric width/height from component props.
// ComponentProps is a union where ContainerProps/ListProps redeclare width/height as `number | string | undefined`.
// Alignment only operates on positioned components, so we cast to number.
const numWidth = (c: AppComponent): number => c.props.width as number;
const numHeight = (c: AppComponent): number => c.props.height as number;

/**
 * Calculate position/size updates for alignment and distribution operations.
 * Returns an array of updates to apply via updateComponents.
 *
 * @param action - The alignment/distribution action to perform
 * @param selectedComponentIds - Ordered list of selected component IDs (first is reference for match-width/height)
 * @param allComponents - All components in the app
 * @returns Array of component updates to apply
 */
export function calculateAlignmentUpdates(
  action: AlignAction,
  selectedComponentIds: string[],
  allComponents: AppComponent[]
): Array<{ id: string; props: Partial<ComponentProps> }> {
  const componentsMap = new Map<string, AppComponent>();
  allComponents.forEach(c => componentsMap.set(c.id, c));
  const selectedComponents = selectedComponentIds.map(id => componentsMap.get(id)).filter((c): c is AppComponent => !!c);

  if (selectedComponents.length < 2) return [];

  const updates: Array<{ id: string; props: Partial<ComponentProps> }> = [];
  const GAP = 10; // Default gap between components when stacking

  const boundingBox = selectedComponents.reduce((acc, c) => ({
    x1: Math.min(acc.x1, c.props.x),
    y1: Math.min(acc.y1, c.props.y),
    x2: Math.max(acc.x2, c.props.x + numWidth(c)),
    y2: Math.max(acc.y2, c.props.y + numHeight(c))
  }), { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity });

  switch (action) {
    // --- HORIZONTAL ALIGNMENT & VERTICAL STACKING ---
    case 'align-left': {
      const sorted = [...selectedComponents].sort((a, b) => a.props.y - b.props.y);
      let currentY = boundingBox.y1;
      sorted.forEach(c => {
        updates.push({ id: c.id, props: { x: boundingBox.x1, y: currentY } });
        currentY += numHeight(c) + GAP;
      });
      break;
    }
    case 'align-center-h': {
      const sorted = [...selectedComponents].sort((a, b) => a.props.y - b.props.y);
      const centerX = boundingBox.x1 + (boundingBox.x2 - boundingBox.x1) / 2;
      let currentY = boundingBox.y1;
      sorted.forEach(c => {
        updates.push({ id: c.id, props: { x: centerX - numWidth(c) / 2, y: currentY } });
        currentY += numHeight(c) + GAP;
      });
      break;
    }
    case 'align-right': {
      const sorted = [...selectedComponents].sort((a, b) => a.props.y - b.props.y);
      let currentY = boundingBox.y1;
      sorted.forEach(c => {
        updates.push({ id: c.id, props: { x: boundingBox.x2 - numWidth(c), y: currentY } });
        currentY += numHeight(c) + GAP;
      });
      break;
    }

    // --- VERTICAL ALIGNMENT & HORIZONTAL STACKING ---
    case 'align-top': {
      const sorted = [...selectedComponents].sort((a, b) => a.props.x - b.props.x);
      let currentX = boundingBox.x1;
      sorted.forEach(c => {
        updates.push({ id: c.id, props: { x: currentX, y: boundingBox.y1 } });
        currentX += numWidth(c) + GAP;
      });
      break;
    }
    case 'align-center-v': {
      const sorted = [...selectedComponents].sort((a, b) => a.props.x - b.props.x);
      const centerY = boundingBox.y1 + (boundingBox.y2 - boundingBox.y1) / 2;
      let currentX = boundingBox.x1;
      sorted.forEach(c => {
        updates.push({ id: c.id, props: { x: currentX, y: centerY - numHeight(c) / 2 } });
        currentX += numWidth(c) + GAP;
      });
      break;
    }
    case 'align-bottom': {
      const sorted = [...selectedComponents].sort((a, b) => a.props.x - b.props.x);
      let currentX = boundingBox.x1;
      sorted.forEach(c => {
        updates.push({ id: c.id, props: { x: currentX, y: boundingBox.y2 - numHeight(c) } });
        currentX += numWidth(c) + GAP;
      });
      break;
    }

    // --- DISTRIBUTION ---
    case 'distribute-h': {
      if (selectedComponents.length > 2) {
        const sorted = [...selectedComponents].sort((a, b) => a.props.x - b.props.x);
        const totalWidth = sorted.reduce((sum, c) => sum + numWidth(c), 0);
        const totalSpace = sorted[sorted.length - 1].props.x + numWidth(sorted[sorted.length - 1]) - sorted[0].props.x;
        const totalGap = totalSpace - totalWidth;
        const gap = totalGap / (selectedComponents.length - 1);

        let currentX = sorted[0].props.x;
        updates.push({ id: sorted[0].id, props: { x: currentX } });
        for (let i = 1; i < sorted.length; i++) {
          currentX += numWidth(sorted[i - 1]) + gap;
          updates.push({ id: sorted[i].id, props: { x: currentX } });
        }
      }
      break;
    }
    case 'distribute-v': {
      if (selectedComponents.length > 2) {
        const sorted = [...selectedComponents].sort((a, b) => a.props.y - b.props.y);
        const totalHeight = sorted.reduce((sum, c) => sum + numHeight(c), 0);
        const totalSpace = sorted[sorted.length - 1].props.y + numHeight(sorted[sorted.length - 1]) - sorted[0].props.y;
        const totalGap = totalSpace - totalHeight;
        const gap = totalGap / (selectedComponents.length - 1);

        let currentY = sorted[0].props.y;
        updates.push({ id: sorted[0].id, props: { y: currentY } });
        for (let i = 1; i < sorted.length; i++) {
          currentY += numHeight(sorted[i - 1]) + gap;
          updates.push({ id: sorted[i].id, props: { y: currentY } });
        }
      }
      break;
    }

    // --- SIZE MATCHING ---
    case 'match-width': {
      const referenceComponent = componentsMap.get(selectedComponentIds[0]);
      if (!referenceComponent) break;
      const refWidth = referenceComponent.props.width;
      selectedComponents.forEach(c => {
        if (c.id !== referenceComponent.id) {
          updates.push({ id: c.id, props: { width: refWidth as number } });
        }
      });
      break;
    }
    case 'match-height': {
      const referenceComponent = componentsMap.get(selectedComponentIds[0]);
      if (!referenceComponent) break;
      const refHeight = referenceComponent.props.height;
      selectedComponents.forEach(c => {
        if (c.id !== referenceComponent.id) {
          updates.push({ id: c.id, props: { height: refHeight as number } });
        }
      });
      break;
    }
  }

  return updates;
}
