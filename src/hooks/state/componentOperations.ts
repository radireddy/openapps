import { AppDefinition, AppComponent, ComponentType, ComponentProps } from '../../types';
import { componentRegistry } from '../../components/component-registry/registry';
import { parsePaddingLeftTop } from './helpers';
import { generateAutoResponsiveDefaults } from '@/responsive';

/**
 * Add a component to the app definition.
 * Automatically initializes position within parent containers and handles
 * auto-arrangement for Panel/HStack/VStack containers.
 */
export function addComponentToState(
  state: AppDefinition,
  type: ComponentType,
  position: { x: number; y: number },
  parentId: string | null,
  pageId: string
): AppDefinition {
  const componentPlugin = componentRegistry[type];
  if (!componentPlugin) return state;

  // Auto-generate a name like "Input 1", "Button 2"
  const typeLabel = componentPlugin.paletteConfig.label;
  const sameTypeCount = state.components.filter(c => c.type === type && c.pageId === pageId).length + 1;
  const autoName = `${typeLabel} ${sameTypeCount}`;

  // Calculate order: position.x carries insertion order from Canvas drop
  const siblings = state.components.filter(c =>
    (c.parentId || null) === parentId && c.pageId === pageId
  );
  const insertionOrder = Math.min(position.x, siblings.length);

  // Determine slot for Tabs/Accordion containers
  let slot: number | undefined;
  if (parentId) {
    const parentComponent = state.components.find(c => c.id === parentId);
    if (parentComponent?.type === ComponentType.TABS) {
      const storedTab = state.dataStore[`${parentId}_activeTab`];
      slot = typeof storedTab === 'number' ? storedTab : ((parentComponent.props as any).defaultActiveTab ?? 0);
    } else if (parentComponent?.type === ComponentType.ACCORDION) {
      const storedExpanded = state.dataStore[`${parentId}_expanded`];
      if (Array.isArray(storedExpanded) && storedExpanded.length > 0) {
        slot = storedExpanded[storedExpanded.length - 1];
      } else {
        const defaultExp = (parentComponent.props as any).defaultExpanded;
        if (typeof defaultExp === 'string') {
          const indices = defaultExp.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n));
          slot = indices.length > 0 ? indices[0] : 0;
        } else {
          slot = 0;
        }
      }
    }
  }

  const newComp: AppComponent = {
    id: `${type}_${Date.now()}`,
    type,
    name: autoName,
    props: {
      ...componentPlugin.paletteConfig.defaultProps,
      order: insertionOrder,
    } as ComponentProps,
    parentId,
    pageId,
    ...(slot !== undefined && { slot }),
  };

  // Generate auto-responsive defaults (mobile-first overrides)
  const autoResult = generateAutoResponsiveDefaults(newComp);
  if (autoResult) {
    if (autoResult.baseOverrides) {
      newComp.props = { ...newComp.props, ...autoResult.baseOverrides } as ComponentProps;
    }
    if (autoResult.responsive) {
      const existing = (newComp.props as any).responsive || {};
      newComp.props = {
        ...newComp.props,
        responsive: {
          tablet: { ...existing.tablet, ...autoResult.responsive.tablet },
          desktop: { ...existing.desktop, ...autoResult.responsive.desktop },
          large: { ...existing.large, ...autoResult.responsive.large },
        },
      } as ComponentProps;
    }
  }

  // Shift order of existing siblings that come after the insertion point
  const updatedComponents = state.components.map(c => {
    if ((c.parentId || null) === parentId && c.pageId === pageId) {
      const currentOrder = (c.props as any).order ?? 0;
      if (currentOrder >= insertionOrder) {
        return { ...c, props: { ...c.props, order: currentOrder + 1 } };
      }
    }
    return c;
  });

  return {
    ...state,
    components: [...updatedComponents, newComp],
  };
}

/**
 * Update a single component's props.
 * Handles special Container padding changes by adjusting child positions.
 */
export function updateComponentInState(
  state: AppDefinition,
  id: string,
  newProps: Partial<ComponentProps>
): AppDefinition {
  const component = state.components.find(c => c.id === id);
  if (!component) {
    return state;
  }

  // Check if this is a Container and padding is being changed
  const isContainer = component.type === ComponentType.CONTAINER;
  const paddingChanged = isContainer && 'padding' in newProps && newProps.padding !== component.props.padding;

  // If padding changed on a Container, calculate deltas BEFORE updating the container
  let paddingDeltaX = 0;
  let paddingDeltaY = 0;
  if (paddingChanged) {
    const oldPadding = parsePaddingLeftTop(component.props.padding);
    const newPadding = parsePaddingLeftTop(newProps.padding);
    paddingDeltaX = newPadding.left - oldPadding.left;
    paddingDeltaY = newPadding.top - oldPadding.top;
  }

  // Update components - first update the container, then adjust children
  let updatedComponents = state.components.map(c => {
    if (c.id === id) {
      return { ...c, props: { ...c.props, ...newProps } };
    }
    return c;
  });

  // If padding changed, adjust all child positions to maintain their visual positions
  // When padding increases, content area moves right/down, so children need to move right/down
  // When padding decreases, content area moves left/up, so children need to move left/up
  // This preserves the visual arrangement and spacing between components
  if (paddingChanged && (paddingDeltaX !== 0 || paddingDeltaY !== 0)) {
    updatedComponents = updatedComponents.map(c => {
      if (c.parentId === id) {
        const currentX = c.props.x as number;
        const currentY = c.props.y as number;
        // Adjust position by the padding delta to maintain visual position
        // Don't clamp to 0 here - allow negative values if padding decreases significantly
        // The component will be clipped by the container's overflow anyway
        return {
          ...c,
          props: {
            ...c.props,
            x: currentX + paddingDeltaX,
            y: currentY + paddingDeltaY,
          }
        };
      }
      return c;
    });
  }

  return {
    ...state,
    components: updatedComponents,
  };
}

/**
 * Batch update multiple components' props.
 * Handles order, width, height, and any other prop changes.
 */
export function updateComponentsInState(
  state: AppDefinition,
  updates: Array<{ id: string; props: Partial<ComponentProps> }>
): AppDefinition {
  if (updates.length === 0) return state;

  const updatesMap = new Map(updates.map(u => [u.id, u.props]));

  let hasChanges = false;
  const newComponents = state.components.map(c => {
    const newProps = updatesMap.get(c.id);
    if (!newProps) return c;

    // Check if any prop actually changed
    let changed = false;
    for (const key of Object.keys(newProps)) {
      if ((c.props as any)[key] !== (newProps as any)[key]) {
        changed = true;
        break;
      }
    }

    if (changed) {
      hasChanges = true;
      return { ...c, props: { ...c.props, ...newProps } };
    }
    return c;
  });

  if (!hasChanges) return state;

  return { ...state, components: newComponents };
}

/** Delete a component and all its descendants, cleaning up associated dataStore entries */
export function deleteComponentFromState(state: AppDefinition, id: string): AppDefinition {
  const idsToDelete = new Set<string>([id]);
  const findChildren = (parentId: string) => {
    state.components.forEach(c => {
      if (c.parentId === parentId) {
        idsToDelete.add(c.id);
        findChildren(c.id);
      }
    });
  };
  findChildren(id);

  // Clean dataStore: remove entries for deleted component IDs
  const cleanedDataStore = { ...state.dataStore };
  idsToDelete.forEach(deletedId => {
    delete cleanedDataStore[deletedId];
  });

  return {
    ...state,
    components: state.components.filter(c => !idsToDelete.has(c.id)),
    dataStore: cleanedDataStore,
  };
}

/** Rename a component */
export function renameComponentInState(state: AppDefinition, id: string, name: string): AppDefinition {
  return {
    ...state,
    components: state.components.map(c =>
      c.id === id ? { ...c, name } : c
    ),
  };
}

/** Delete multiple selected components and their descendants, cleaning up associated dataStore entries */
export function deleteSelectedComponentsFromState(state: AppDefinition, selectedIds: string[]): AppDefinition {
  if (selectedIds.length === 0) return state;

  const allIdsToDelete = new Set<string>();
  const findChildren = (parentId: string) => {
    state.components.forEach(c => {
      if (c.parentId === parentId) {
        allIdsToDelete.add(c.id);
        findChildren(c.id);
      }
    });
  };
  selectedIds.forEach(id => {
    allIdsToDelete.add(id);
    findChildren(id);
  });

  // Clean dataStore: remove entries for deleted component IDs
  const cleanedDataStore = { ...state.dataStore };
  allIdsToDelete.forEach(deletedId => {
    delete cleanedDataStore[deletedId];
  });

  return {
    ...state,
    components: state.components.filter(c => !allIdsToDelete.has(c.id)),
    dataStore: cleanedDataStore,
  };
}
