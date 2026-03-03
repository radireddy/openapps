/**
 * List Component
 * 
 * Extends Container component with data-driven repetition.
 * Uses a container-like template for building repeated UI.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ComponentType, ListProps, AppComponent, ActionHandlers } from '../../types';
import { createBaseContainerRenderer, BaseContainerRendererOptions } from './base-container';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { safeEval } from '../../expressions/engine';
import { RenderedComponent } from '../RenderedComponent';
import { useListContext } from './ListContext';

/**
 * List-specific renderer options
 */
const listRendererOptions: BaseContainerRendererOptions = {
  styleExtensions: {
    overflowY: 'auto', // Enable scrolling for long lists
  },
};

/**
 * Creates the List renderer
 */
const ListRenderer = createBaseContainerRenderer(listRendererOptions);

/**
 * Template Container Renderer
 * Renders the template container that holds template children
 */
interface TemplateContainerRendererProps {
  listComponent: AppComponent;
  templateChildren: AppComponent[];
  mode: 'edit' | 'preview';
  evaluationScope: Record<string, any>;
  isTemplateEditing: boolean;
  templateHeight: number;
}

const TemplateContainerRenderer: React.FC<TemplateContainerRendererProps> = ({
  listComponent,
  templateChildren,
  mode,
  evaluationScope,
  isTemplateEditing,
  templateHeight,
}) => {
  const context = useListContext();

  // In template editing mode, make template children editable
  // In preview mode, template is not directly editable
  const templateMode = isTemplateEditing ? 'edit' : 'preview';

  // For design-time expression evaluation, provide a sample currentItem in the evaluation scope
  // This allows expressions like {{currentItem.name}} to be evaluated and displayed in the designer
  const designTimeEvaluationScope = useMemo(() => {
    if (mode === 'edit') {
      // Create a sample item based on the actual data if available, or use a generic sample
      const listProps = listComponent?.props as ListProps;
      const dataExpression = listProps?.data;
      
      // Try to evaluate the data expression to get actual data
      // Use the same evaluation logic as ListComponentRenderer
      let sampleItem: any = null;
      try {
        if (dataExpression) {
          // Evaluate using the same approach as ListComponentRenderer
          let dataResult: any;
          if (typeof dataExpression === 'string') {
            // Check if it's a pure expression
            if (dataExpression.startsWith('{{') && dataExpression.endsWith('}}')) {
              const expr = dataExpression.substring(2, dataExpression.length - 2).trim();
              dataResult = safeEval(expr, evaluationScope);
            } else {
              // Try to evaluate as expression
              dataResult = safeEval(dataExpression, evaluationScope);
            }
          } else {
            // Already a value, use it directly
            dataResult = dataExpression;
          }
          
          // If result is an array, use the first item
          if (Array.isArray(dataResult) && dataResult.length > 0) {
            sampleItem = dataResult[0];
          } else if (dataResult && typeof dataResult === 'object' && !Array.isArray(dataResult)) {
            // If it's a single object, use it as the sample
            sampleItem = dataResult;
          }
        }
      } catch (e) {
        // If evaluation fails, use generic sample (silently fail for design-time)
      }
      
      // If no actual data available, create a generic sample object
      if (!sampleItem || typeof sampleItem !== 'object' || sampleItem === null) {
        sampleItem = {
          id: 1,
          name: 'Sample Item',
          title: 'Sample Title',
          description: 'Sample Description',
          value: 'Sample Value',
        };
      }
      
      // Return evaluation scope with sample currentItem and index for design-time evaluation
      return {
        ...evaluationScope,
        currentItem: sampleItem,
        index: 0, // Use index 0 for design-time preview
      };
    }
    
    // In preview mode, use the original evaluation scope (currentItem will be set by ListItemRenderer)
    return evaluationScope;
  }, [mode, evaluationScope, listComponent]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: `${templateHeight}px`,
        border: isTemplateEditing && mode === 'edit' ? '2px dashed #3b82f6' : 'none',
        backgroundColor: isTemplateEditing && mode === 'edit' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
      }}
      data-list-template="true"
    >
      {templateChildren.map(child => (
        <RenderedComponent
          key={child.id}
          component={child}
          allComponents={context.allComponents}
          selectedComponentIds={context.selectedComponentIds}
          onSelect={context.onSelect}
          onUpdate={context.onUpdate}
          onUpdateComponents={context.onUpdateComponents}
          onDelete={context.onDelete}
          onDrop={context.onDrop}
          mode={templateMode}
          dataStore={context.dataStore}
          onUpdateDataStore={context.onUpdateDataStore}
          actions={context.actions}
          evaluationScope={designTimeEvaluationScope}
          onReparentCheck={context.onReparentCheck}
          widgetDefinitions={context.widgetDefinitions}
        />
      ))}
    </div>
  );
};

/**
 * List Item Renderer
 * Renders a single repeated item from the template
 */
interface ListItemRendererProps {
  listComponent: AppComponent;
  templateChildren: AppComponent[];
  item: any;
  index: number;
  templateHeight: number;
  itemSpacing: number;
  mode: 'edit' | 'preview';
  baseEvaluationScope: Record<string, any>;
  onItemClick?: (item: any, index: number) => void;
  onItemSelect?: (item: any, index: number) => void;
}

const ListItemRenderer: React.FC<ListItemRendererProps> = ({
  listComponent,
  templateChildren,
  item,
  index,
  templateHeight,
  itemSpacing,
  mode,
  baseEvaluationScope,
  onItemClick,
  onItemSelect,
}) => {
  const context = useListContext();

  // Create evaluation scope with currentItem and index
  const itemEvaluationScope = useMemo(() => ({
    ...baseEvaluationScope,
    currentItem: item,
    index: index,
  }), [baseEvaluationScope, item, index]);

  // Recursively clone a component and all its nested children
  // Returns a map of originalId -> clonedComponent for quick lookup
  const cloneComponentTree = useCallback((component: AppComponent, newParentId: string, allComponents: AppComponent[]): Map<string, AppComponent> => {
    const clonedMap = new Map<string, AppComponent>();
    
    // Clone the component itself
    const clonedComponent: AppComponent = {
      ...component,
      id: `${component.id}_item_${index}`,
      parentId: newParentId,
    };
    clonedMap.set(component.id, clonedComponent);
    
    // Find all children of this component
    const children = allComponents.filter(c => c.parentId === component.id);
    
    // Recursively clone all children
    children.forEach(child => {
      const childClones = cloneComponentTree(child, clonedComponent.id, allComponents);
      childClones.forEach((cloned, originalId) => {
        clonedMap.set(originalId, cloned);
      });
    });
    
    return clonedMap;
  }, [index]);

  // Clone template children for this item (recursively including all nested children)
  // We need all cloned components in a flat array for allComponents, but only render top-level ones
  const { allClonedComponents, topLevelCloned } = useMemo(() => {
    const allClonedMap = new Map<string, AppComponent>();
    const topLevel: AppComponent[] = [];
    const itemParentId = `${listComponent.id}_item_${index}`;
    
    templateChildren.forEach(templateChild => {
      const clonedTree = cloneComponentTree(templateChild, itemParentId, context.allComponents);
      clonedTree.forEach((cloned, originalId) => {
        allClonedMap.set(originalId, cloned);
      });
      // Only add the direct template child clone to topLevel
      const clonedChild = clonedTree.get(templateChild.id);
      if (clonedChild) {
        topLevel.push(clonedChild);
      }
    });
    
    return {
      allClonedComponents: Array.from(allClonedMap.values()),
      topLevelCloned: topLevel,
    };
  }, [templateChildren, index, listComponent.id, context.allComponents, cloneComponentTree]);

  const topOffset = index * (templateHeight + itemSpacing);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onItemClick) {
      onItemClick(item, index);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topOffset}px`,
        left: '0',
        width: '100%',
        height: `${templateHeight}px`,
      }}
      onClick={handleClick}
      data-list-item="true"
      data-item-index={index}
    >
      {/* Only render top-level cloned children - RenderedComponent will recursively render nested children */}
      {topLevelCloned.map(child => (
        <RenderedComponent
          key={child.id}
          component={child}
          allComponents={[...context.allComponents, ...allClonedComponents]}
          selectedComponentIds={[]}
          onSelect={() => {}}
          onUpdate={() => {}}
          onUpdateComponents={() => {}}
          onDelete={() => {}}
          onDrop={() => {}}
          mode={mode}
          dataStore={context.dataStore}
          onUpdateDataStore={context.onUpdateDataStore}
          actions={context.actions}
          evaluationScope={itemEvaluationScope}
          onReparentCheck={() => {}}
          widgetDefinitions={context.widgetDefinitions}
        />
      ))}
    </div>
  );
};

/**
 * Main List Component Renderer
 * 
 * Note: This renderer receives children from RenderedComponent, but for List components,
 * those children are the template children. We use React context to access allComponents.
 */
interface ListComponentRendererProps {
  component: { props: ListProps };
  children: React.ReactNode;
  mode: 'edit' | 'preview';
  actions?: ActionHandlers;
  evaluationScope: Record<string, any>;
  onClick?: () => void;
}

export const ListComponentRenderer: React.FC<ListComponentRendererProps> = ({
  component,
  children,
  mode,
  actions,
  evaluationScope,
  onClick,
}) => {
  const props = component.props;
  const context = useListContext();

  // Find the list component - use currentComponentId from context if available
  const listComponent = useMemo(() => {
    // First try: use currentComponentId from context (most reliable)
    if (context.currentComponentId) {
      const found = context.allComponents.find(c => c.id === context.currentComponentId);
      if (found && found.type === ComponentType.LIST) {
        return found;
      }
    }
    
    // Second try: find by matching data prop (if unique)
    const thisProps = props as ListProps;
    if (thisProps.data) {
      const matching = context.allComponents.filter(c => {
        if (c.type !== ComponentType.LIST) return false;
        const cProps = c.props as ListProps;
        return cProps.data === thisProps.data;
      });
      if (matching.length === 1) {
        return matching[0];
      }
    }
    
    // Third try: if there's only one LIST component, use it
    const allLists = context.allComponents.filter(c => c.type === ComponentType.LIST);
    if (allLists.length === 1) {
      return allLists[0];
    }
    
    // Last resort: return first LIST component found (may not be correct if multiple exist)
    return allLists[0];
  }, [context.allComponents, context.currentComponentId, props]);

  // Get template children - these are regular children with parentId === listComponent.id
  const templateChildren = useMemo(() => {
    if (!listComponent) {
      // If listComponent not found, try to find children by matching parentId from context
      // This is a fallback for when listComponent lookup fails
      const templateChildrenIds = (props as ListProps).templateChildren;
      if (templateChildrenIds && templateChildrenIds.length > 0) {
        return context.allComponents.filter(c => templateChildrenIds.includes(c.id));
      }
      return [];
    }
    const templateChildrenIds = (props as ListProps).templateChildren;
    if (templateChildrenIds && templateChildrenIds.length > 0) {
      return context.allComponents.filter(c => templateChildrenIds.includes(c.id));
    }
    // Fallback: use all children with parentId === listComponent.id
    return context.allComponents.filter(c => c.parentId === listComponent.id);
  }, [context.allComponents, listComponent, props]);

  // Evaluate data expression
  // useJavaScriptRenderer already evaluates expressions, so it may return an array directly
  const dataExpression = useJavaScriptRenderer((props as ListProps).data, evaluationScope, '');
  const data = useMemo(() => {
    // If useJavaScriptRenderer already evaluated it to an array, use it directly
    if (Array.isArray(dataExpression)) {
      return dataExpression;
    }
    
    // If it's a string, try to evaluate it
    if (typeof dataExpression === 'string') {
      try {
        const expr = dataExpression.startsWith('{{') && dataExpression.endsWith('}}')
          ? dataExpression.substring(2, dataExpression.length - 2).trim()
          : dataExpression;
        const result = safeEval(expr, evaluationScope);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        return [];
      }
    }
    
    // If it's not an array or string, return empty array
    return [];
  }, [dataExpression, evaluationScope]);

  // Evaluate template height
  const templateHeight = useJavaScriptRenderer((props as ListProps).templateHeight, evaluationScope, 120);
  const templateHeightNum = typeof templateHeight === 'number' 
    ? templateHeight 
    : (typeof templateHeight === 'string' ? parseFloat(templateHeight) || 120 : 120);

  // Evaluate item spacing
  const itemSpacing = useJavaScriptRenderer((props as ListProps).itemSpacing, evaluationScope, 8);
  const itemSpacingNum = typeof itemSpacing === 'number'
    ? itemSpacing
    : (typeof itemSpacing === 'string' ? parseFloat(itemSpacing) || 8 : 8);

  // Template editing mode state (only in edit mode)
  // Store in component's props or use a ref to persist across re-renders
  const [isTemplateEditing, setIsTemplateEditing] = useState(false);

  // Toggle template editing mode
  const toggleTemplateMode = () => {
    setIsTemplateEditing(!isTemplateEditing);
  };

  // Handle item click
  const handleItemClick = (item: any, index: number) => {
    if (mode === 'preview' && (props as ListProps).onItemClick && context.actions) {
      try {
        const clickScope = {
          ...evaluationScope,
          currentItem: item,
          index: index,
          actions: context.actions,
        };
        const onItemClick = (props as ListProps).onItemClick!;
        const expression = onItemClick.startsWith('{{') && onItemClick.endsWith('}}')
          ? onItemClick.substring(2, onItemClick.length - 2).trim()
          : onItemClick;
        safeEval(expression, clickScope);
      } catch (error) {
        console.error('Error executing onItemClick:', error);
      }
    }
  };

  // Handle item select
  const handleItemSelect = (item: any, index: number) => {
    if (mode === 'preview' && (props as ListProps).onItemSelect && context.actions) {
      try {
        const selectScope = {
          ...evaluationScope,
          currentItem: item,
          index: index,
          actions: context.actions,
        };
        const onItemSelect = (props as ListProps).onItemSelect!;
        const expression = onItemSelect.startsWith('{{') && onItemSelect.endsWith('}}')
          ? onItemSelect.substring(2, onItemSelect.length - 2).trim()
          : onItemSelect;
        safeEval(expression, selectScope);
      } catch (error) {
        console.error('Error executing onItemSelect:', error);
      }
    }
  };

  // Calculate total height needed for all items
  const totalHeight = data.length > 0
    ? (templateHeightNum + itemSpacingNum) * data.length - itemSpacingNum
    : templateHeightNum;


  // Render template editing mode or normal mode
  if (mode === 'edit' && isTemplateEditing) {
    // Template editing mode: show only the template
    return (
      <ListRenderer
        component={component}
        mode={mode}
        actions={actions}
        evaluationScope={evaluationScope}
        onClick={onClick}
      >
        <div style={{ position: 'relative', width: '100%', minHeight: `${templateHeightNum}px` }}>
          <TemplateContainerRenderer
            listComponent={listComponent}
            templateChildren={templateChildren}
            mode={mode}
            evaluationScope={evaluationScope}
            isTemplateEditing={true}
            templateHeight={templateHeightNum}
          />
          {/* Template mode toggle button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTemplateMode();
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              zIndex: 1000,
            }}
          >
            Back to List
          </button>
        </div>
      </ListRenderer>
    );
  }

  // Normal mode: show template or repeated items
  if (mode === 'edit') {
    // Edit mode (non-template): show template only
    return (
      <ListRenderer
        component={component}
        mode={mode}
        actions={actions}
        evaluationScope={evaluationScope}
        onClick={onClick}
      >
        <div style={{ position: 'relative', width: '100%', minHeight: `${templateHeightNum}px` }}>
          <TemplateContainerRenderer
            listComponent={listComponent}
            templateChildren={templateChildren}
            mode={mode}
            evaluationScope={evaluationScope}
            isTemplateEditing={false}
            templateHeight={templateHeightNum}
          />
          {/* Edit template button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTemplateMode();
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 8px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              zIndex: 1000,
            }}
          >
            Edit Template
          </button>
        </div>
      </ListRenderer>
    );
  }

  // Preview mode: show repeated items
  const emptyStateText = useJavaScriptRenderer((props as ListProps).emptyState, evaluationScope, 'No items found');

  return (
    <ListRenderer
      component={component}
      mode={mode}
      actions={actions}
      evaluationScope={evaluationScope}
      onClick={onClick}
    >
      <div style={{ position: 'relative', width: '100%', minHeight: `${totalHeight}px` }}>
        {data.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: `${templateHeightNum}px`,
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            {emptyStateText || 'No items found'}
          </div>
        ) : (
          data.map((item, index) => {
            // Evaluate item key
            let itemKey: string;
            const listProps = props as ListProps;
            if (listProps.itemKey) {
              try {
                const keyScope = { ...evaluationScope, currentItem: item, index };
                const keyExpr = listProps.itemKey.startsWith('{{') && listProps.itemKey.endsWith('}}')
                  ? listProps.itemKey.substring(2, listProps.itemKey.length - 2).trim()
                  : listProps.itemKey;
                const keyResult = safeEval(keyExpr, keyScope);
                itemKey = String(keyResult ?? index);
              } catch (error) {
                itemKey = String(index);
              }
            } else {
              itemKey = String(index);
            }

            return (
              <ListItemRenderer
                key={itemKey}
                listComponent={listComponent}
                templateChildren={templateChildren}
                item={item}
                index={index}
                templateHeight={templateHeightNum}
                itemSpacing={itemSpacingNum}
                mode={mode}
                baseEvaluationScope={evaluationScope}
                onItemClick={handleItemClick}
                onItemSelect={handleItemSelect}
              />
            );
          })
        )}
      </div>
    </ListRenderer>
  );
};

/**
 * List Plugin
 */
const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

export const ListPlugin = {
  type: ComponentType.LIST,
  isContainer: true,
  paletteConfig: {
    label: 'List',
    icon: React.createElement('svg', {
      style: iconStyle,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    },
      React.createElement('rect', {
        x: "3",
        y: "3",
        width: "18",
        height: "18",
        rx: "2",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinejoin: "round"
      }),
      React.createElement('line', {
        x1: "7",
        y1: "8",
        x2: "17",
        y2: "8",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round"
      }),
      React.createElement('line', {
        x1: "7",
        y1: "12",
        x2: "17",
        y2: "12",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round"
      }),
      React.createElement('line', {
        x1: "7",
        y1: "16",
        x2: "17",
        y2: "16",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round"
      })
    ),
    defaultProps: {
      width: '100%',
      height: 'auto',
      backgroundColor: '{{theme.colors.surface}}',
      borderWidth: '{{theme.border.width}}',
      borderColor: '{{theme.colors.border}}',
      borderRadius: '{{theme.radius.default}}',
      padding: '{{theme.spacing.sm}}',
      data: '{{[]}}',
      itemKey: '{{index}}',
      templateHeight: 120,
      itemSpacing: 8,
      emptyState: 'No items found',
      templateChildren: [],
    },
  },
  renderer: ListComponentRenderer,
  properties: () => null, // Properties handled by metadata system
};

