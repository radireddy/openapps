import { useState, useCallback } from 'react';
import { AppComponent } from '../types';

/**
 * Clone a tree of components, generating new IDs and remapping parentId references.
 * @param rootIds IDs of the root components to clone
 * @param allComponents All components in the app (to find descendants)
 * @param targetPageId Page ID for the cloned components
 * @param offset Position offset for root components (default 20px)
 */
export function cloneComponentTree(
  rootIds: string[],
  allComponents: AppComponent[],
  targetPageId: string,
  offset = 20
): AppComponent[] {
  // Collect all components to clone (roots + descendants)
  const idsToClone = new Set<string>();
  const collectDescendants = (parentId: string) => {
    idsToClone.add(parentId);
    allComponents.forEach(c => {
      if (c.parentId === parentId && !idsToClone.has(c.id)) {
        collectDescendants(c.id);
      }
    });
  };
  rootIds.forEach(id => collectDescendants(id));

  // Generate new ID map
  const idMap = new Map<string, string>();
  const rootIdSet = new Set(rootIds);
  let counter = 0;
  idsToClone.forEach(oldId => {
    const comp = allComponents.find(c => c.id === oldId);
    if (comp) {
      const suffix = `${Date.now()}_${counter++}`;
      idMap.set(oldId, `${comp.type}_${suffix}`);
    }
  });

  // Clone components with new IDs
  const cloned: AppComponent[] = [];
  idsToClone.forEach(oldId => {
    const comp = allComponents.find(c => c.id === oldId);
    if (!comp) return;

    const newId = idMap.get(oldId)!;
    const isRoot = rootIdSet.has(oldId);

    // Remap parentId if it's within the cloned tree
    let newParentId = comp.parentId;
    if (newParentId && idMap.has(newParentId)) {
      newParentId = idMap.get(newParentId)!;
    } else if (newParentId && !idsToClone.has(newParentId)) {
      // Parent is outside cloned tree — keep original parent
      newParentId = comp.parentId;
    }

    const newProps = { ...comp.props };
    // Offset root components
    if (isRoot) {
      (newProps as any).x = ((newProps as any).x || 0) + offset;
      (newProps as any).y = ((newProps as any).y || 0) + offset;
    }

    cloned.push({
      ...comp,
      id: newId,
      name: comp.name ? `${comp.name} (copy)` : undefined,
      props: newProps,
      parentId: newParentId,
      pageId: targetPageId,
    });
  });

  return cloned;
}

/**
 * Hook for clipboard operations (copy/paste).
 */
export function useClipboard() {
  const [clipboardData, setClipboardData] = useState<{
    components: AppComponent[];
    sourcePageId: string;
  } | null>(null);

  const copy = useCallback((selectedIds: string[], allComponents: AppComponent[], pageId: string) => {
    if (selectedIds.length === 0) return;
    // Deep clone the selected components and their descendants
    const cloned = cloneComponentTree(selectedIds, allComponents, pageId, 0);
    setClipboardData({ components: cloned, sourcePageId: pageId });
  }, []);

  const paste = useCallback((allComponents: AppComponent[], targetPageId: string): AppComponent[] | null => {
    if (!clipboardData) return null;
    // Re-clone from clipboard data with fresh IDs and offset
    const rootIds = clipboardData.components
      .filter(c => !c.parentId || !clipboardData.components.some(other => other.id === c.parentId))
      .map(c => c.id);
    return cloneComponentTree(rootIds, clipboardData.components, targetPageId, 20);
  }, [clipboardData]);

  return {
    copy,
    paste,
    hasClipboard: clipboardData !== null,
  };
}
