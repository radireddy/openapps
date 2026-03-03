import React, { useState, useMemo, memo, useEffect, useRef } from 'react';
import { AppDefinition, AppPage, AppComponent } from '../types';
import { componentRegistry } from './component-registry/registry';
import { getIconForType } from './TreeViewIcons';
import { typography } from '../constants';

interface TreeViewProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  appDefinition: AppDefinition;
  currentPageId: string;
  selectedComponentIds: string[];
  onSelectPage: (pageId: string) => void;
  onSelectComponent: (componentId: string, pageId: string) => void;
  onDeleteComponent?: (componentId: string) => void;
  onRenameComponent?: (componentId: string, name: string) => void;
  onReorderComponent?: (componentId: string, newIndex: number, parentId: string | null, pageId: string) => void;
  onMoveComponentToParent?: (componentId: string, newParentId: string | null, newIndex: number | null, pageId: string) => void;
  onAddPage?: () => void;
  onDeletePage?: (pageId: string) => void;
  onRenamePage?: (pageId: string, name: string) => void;
  onReorderPage?: (pageId: string, direction: 'up' | 'down') => void;
  mainPageId?: string;
  pageCount?: number;
}

interface TreeNodeData {
  id: string;
  name: string;
  type: 'APP' | 'PAGE' | 'COMPONENT';
  componentType?: AppComponent['type'];
  children: TreeNodeData[];
  pageId?: string;
}

const buildTree = (appDefinition: AppDefinition): TreeNodeData => {
  const { pages, components, name: appName, id: appId } = appDefinition;
  
  const componentMap = new Map<string, AppComponent>(components.map(c => [c.id, c]));
  const childrenMap = new Map<string, string[]>();
  
  components.forEach(c => {
    const parentKey = c.parentId || `page_${c.pageId}`;
    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }
    childrenMap.get(parentKey)!.push(c.id);
  });
  
  const buildComponentNodes = (componentIds: string[]): TreeNodeData[] => {
    if (!componentIds) return [];
    // Sort children by props.order so tree reflects actual visual order
    const sorted = [...componentIds].sort((aId, bId) => {
      const a = componentMap.get(aId);
      const b = componentMap.get(bId);
      return ((a?.props as any)?.order ?? 0) - ((b?.props as any)?.order ?? 0);
    });
    return sorted.map(id => {
      const component = componentMap.get(id)!;
      return {
        id: component.id,
        name: component.name || componentRegistry[component.type]?.paletteConfig.label || component.id,
        type: 'COMPONENT',
        componentType: component.type,
        pageId: component.pageId,
        children: buildComponentNodes(childrenMap.get(component.id) || []),
      };
    });
  };

  return {
    id: appId,
    name: 'Application',
    type: 'APP',
    children: pages.map(page => ({
      id: page.id,
      name: page.name,
      type: 'PAGE',
      pageId: page.id,
      children: buildComponentNodes(childrenMap.get(`page_${page.id}`) || []),
    })),
  };
};

const TreeNode: React.FC<{
  node: TreeNodeData;
  level: number;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  currentPageId: string;
  selectedComponentIds: string[];
  onSelectPage: (pageId: string) => void;
  onSelectComponent: (componentId: string, pageId: string) => void;
  onDeleteComponent?: (componentId: string) => void;
  onRenameComponent?: (componentId: string, name: string) => void;
  onReorderComponent?: (componentId: string, newIndex: number, parentId: string | null, pageId: string) => void;
  onMoveComponentToParent?: (componentId: string, newParentId: string | null, newIndex: number | null, pageId: string) => void;
  onExpandNode?: (id: string) => void;
  appDefinition: AppDefinition;
  draggedNodeIdRef: React.MutableRefObject<string | null>;
  isDraggingRef: React.MutableRefObject<boolean>;
  onDeletePage?: (pageId: string) => void;
  onRenamePage?: (pageId: string, name: string) => void;
  onReorderPage?: (pageId: string, direction: 'up' | 'down') => void;
  mainPageId?: string;
  pageIndex?: number;
  pageCount?: number;
  siblingIndex?: number;
  siblingCount?: number;
}> = memo(({ node, level, expandedNodes, toggleNode, currentPageId, selectedComponentIds, onSelectPage, onSelectComponent, onDeleteComponent, onRenameComponent, onReorderComponent, onMoveComponentToParent, onExpandNode, appDefinition, draggedNodeIdRef, isDraggingRef, onDeletePage, onRenamePage, onReorderPage, mainPageId, pageIndex, pageCount, siblingIndex, siblingCount }) => {
  const isExpanded = expandedNodes.has(node.id);
  const isExpandable = node.children.length > 0;

  const handleSelect = () => {
    if (node.type === 'PAGE' && node.pageId) {
        onSelectPage(node.pageId);
    } else if (node.type === 'COMPONENT' && node.pageId) {
        onSelectComponent(node.id, node.pageId);
    }
  };
  
  const isSelected = (node.type === 'PAGE' && node.id === currentPageId) || (node.type === 'COMPONENT' && selectedComponentIds.includes(node.id));
  const selectionClass = isSelected ? 'bg-ed-accent-muted text-ed-accent-text' : 'hover:bg-ed-bg-hover';
  const label = node.type === 'COMPONENT' ? node.name : node.name;

  // Auto-scroll selected node into view
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isSelected && node.type === 'COMPONENT' && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected, node.type]);

  // Inline rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(label);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (node.type === 'COMPONENT' && onRenameComponent) {
      e.stopPropagation();
      setRenameValue(label);
      setIsRenaming(true);
    } else if (node.type === 'PAGE' && onRenamePage) {
      e.stopPropagation();
      setRenameValue(label);
      setIsRenaming(true);
    }
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== label) {
      if (node.type === 'COMPONENT' && onRenameComponent) {
        onRenameComponent(node.id, trimmed);
      } else if (node.type === 'PAGE' && onRenamePage) {
        onRenamePage(node.id, trimmed);
      }
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(label);
    setIsRenaming(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'COMPONENT' && onDeleteComponent) {
      onDeleteComponent(node.id);
    }
  };

  // Drag and drop handlers
  const [dragOverState, setDragOverState] = useState<'none' | 'over' | 'before' | 'after'>('none');

  const handleDragStart = (e: React.DragEvent) => {
    if (node.type !== 'COMPONENT') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
    draggedNodeIdRef.current = node.id;
    isDraggingRef.current = true;
    document.body.style.cursor = 'grabbing';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (node.type === 'APP') {
      return;
    }

    const draggedId = draggedNodeIdRef.current;
    if (!draggedId || draggedId === node.id) {
      setDragOverState('none');
      return;
    }

    // Prevent dropping on self or descendants
    const isDescendant = (childId: string, parentId: string, components: AppComponent[]): boolean => {
      const child = components.find(c => c.id === childId);
      if (!child || !child.parentId) return false;
      if (child.parentId === parentId) return true;
      return isDescendant(child.parentId, parentId, components);
    };

    if (node.type === 'COMPONENT' && isDescendant(node.id, draggedId, appDefinition.components)) {
      setDragOverState('none');
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    // Auto-expand collapsed nodes when dragging over them
    if (isExpandable && !isExpanded && onExpandNode) {
      onExpandNode(node.id);
    }

    // Determine drop position (before, after, or inside)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const threshold = height / 3;

    if (y < threshold) {
      setDragOverState('before');
    } else if (y > height - threshold) {
      setDragOverState('after');
    } else {
      setDragOverState('over');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverState('none');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData('text/plain') || draggedNodeIdRef.current;
    if (!draggedId || !onReorderComponent || !onMoveComponentToParent) {
      setDragOverState('none');
      draggedNodeIdRef.current = null;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      return;
    }

    const draggedComponent = appDefinition.components.find(c => c.id === draggedId);
    if (!draggedComponent || !draggedComponent.pageId) {
      setDragOverState('none');
      draggedNodeIdRef.current = null;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      return;
    }

    // Determine target parent and index
    let targetParentId: string | null = null;
    let targetIndex: number | null = null;

    if (node.type === 'PAGE') {
      // Dropping on a page - move to root level of that page
      targetParentId = null;
      const pageChildren = appDefinition.components
        .filter(c => !c.parentId && c.pageId === node.pageId && c.id !== draggedId)
        .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));
      
      if (pageChildren.length > 0 && dragOverState !== 'over') {
        if (dragOverState === 'before') {
          targetIndex = 0;
        } else {
          targetIndex = pageChildren.length;
        }
      } else {
        targetIndex = pageChildren.length;
      }
    } else if (node.type === 'COMPONENT') {
      // Dropping on a component - check if it's a container
      const plugin = componentRegistry[node.componentType!];
      if (plugin && plugin.isContainer) {
        // Dropping into a container
        targetParentId = node.id;
        const containerChildren = appDefinition.components
          .filter(c => c.parentId === node.id && c.pageId === node.pageId)
          .sort((a, b) => {
            const aIndex = appDefinition.components.indexOf(a);
            const bIndex = appDefinition.components.indexOf(b);
            return aIndex - bIndex;
          });
        
        if (dragOverState === 'before') {
          const currentNodeParentId = appDefinition.components.find(c => c.id === node.id)?.parentId || null;
          const siblings = appDefinition.components
            .filter(c => (c.parentId || null) === currentNodeParentId && c.pageId === node.pageId)
            .sort((a, b) => {
              const aIndex = appDefinition.components.indexOf(a);
              const bIndex = appDefinition.components.indexOf(b);
              return aIndex - bIndex;
            });
          const targetIndexInSiblings = siblings.findIndex(c => c.id === node.id);
          targetIndex = Math.max(0, targetIndexInSiblings);
          targetParentId = currentNodeParentId;
        } else if (dragOverState === 'after') {
          const currentNodeParentId = appDefinition.components.find(c => c.id === node.id)?.parentId || null;
          const siblings = appDefinition.components
            .filter(c => (c.parentId || null) === currentNodeParentId && c.pageId === node.pageId)
            .sort((a, b) => {
              const aIndex = appDefinition.components.indexOf(a);
              const bIndex = appDefinition.components.indexOf(b);
              return aIndex - bIndex;
            });
          const targetIndexInSiblings = siblings.findIndex(c => c.id === node.id);
          targetIndex = Math.min(siblings.length, targetIndexInSiblings + 1);
          targetParentId = currentNodeParentId;
        } else {
          // Dropping inside container
          targetIndex = containerChildren.length;
        }
      } else {
        // Not a container - treat as sibling
        const currentNodeParentId = appDefinition.components.find(c => c.id === node.id)?.parentId || null;
        targetParentId = currentNodeParentId;
        const siblings = appDefinition.components
          .filter(c => (c.parentId || null) === currentNodeParentId && c.pageId === node.pageId && c.id !== draggedId)
          .sort((a, b) => {
            const aIndex = appDefinition.components.indexOf(a);
            const bIndex = appDefinition.components.indexOf(b);
            return aIndex - bIndex;
          });
        
        const targetIndexInSiblings = siblings.findIndex(c => c.id === node.id);
        if (dragOverState === 'before') {
          targetIndex = Math.max(0, targetIndexInSiblings);
        } else {
          targetIndex = Math.min(siblings.length, targetIndexInSiblings + 1);
        }
      }
    }

    // Check if we're moving to a different parent or just reordering
    const currentParentId = draggedComponent.parentId || null;
    if (targetParentId === currentParentId) {
      // Same parent (including both null for root level) - just reorder
      const siblings = appDefinition.components
        .filter(c => {
          const cParentId = c.parentId || null;
          return cParentId === currentParentId && c.pageId === draggedComponent.pageId && c.id !== draggedId;
        })
        .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));
      
      const currentIndex = siblings.findIndex(c => c.id === draggedId);
      let newIndex = targetIndex!;
      
      if (currentIndex >= 0 && newIndex > currentIndex) {
        newIndex -= 1;
      }
      
      if (onReorderComponent) {
        onReorderComponent(draggedId, newIndex, currentParentId, draggedComponent.pageId);
      }
    } else {
      // Different parent - move component
      if (onMoveComponentToParent) {
        onMoveComponentToParent(draggedId, targetParentId, targetIndex, draggedComponent.pageId);
      }
    }

    setDragOverState('none');
    draggedNodeIdRef.current = null;
    isDraggingRef.current = false;
    document.body.style.cursor = '';
  };

  const handleDragEnd = () => {
    setDragOverState('none');
    draggedNodeIdRef.current = null;
    isDraggingRef.current = false;
    document.body.style.cursor = '';
  };

  // Keyboard handler for tree nodes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (isExpandable) {
        toggleNode(node.id);
      }
      handleSelect();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Stop propagation to prevent Editor's global handler from deleting selected components
      e.stopPropagation();
    }
  };

  // Move up/down handlers for component reordering
  const canMoveUp = node.type === 'COMPONENT' && (siblingIndex ?? 0) > 0;
  const canMoveDown = node.type === 'COMPONENT' && (siblingIndex ?? 0) < (siblingCount ?? 1) - 1;

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canMoveUp || !onReorderComponent || !node.pageId) return;
    const comp = appDefinition.components.find(c => c.id === node.id);
    const parentId = comp?.parentId || null;
    onReorderComponent(node.id, (siblingIndex ?? 0) - 1, parentId, node.pageId);
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canMoveDown || !onReorderComponent || !node.pageId) return;
    const comp = appDefinition.components.find(c => c.id === node.id);
    const parentId = comp?.parentId || null;
    onReorderComponent(node.id, (siblingIndex ?? 0) + 1, parentId, node.pageId);
  };

  // Prevent click when dragging
  const handleRowClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // If it's expandable, toggle the expand/collapse state
    if (isExpandable) {
      toggleNode(node.id);
    }
    // Always select the component/page
    handleSelect();
  };

  const dragOverClass = dragOverState === 'over' ? 'bg-ed-accent-muted border-2 border-ed-accent shadow-ed' :
                       dragOverState === 'before' ? 'border-t-4 border-ed-accent bg-ed-accent-muted' :
                       dragOverState === 'after' ? 'border-b-4 border-ed-accent bg-ed-accent-muted' : '';
  
  const isBeingDragged = draggedNodeIdRef.current === node.id;
  const dragClass = isBeingDragged ? 'opacity-50 cursor-grabbing' : '';

  return (
    <div>
      <div
        ref={rowRef}
        className={`flex items-center p-1 my-0.5 rounded-md ${node.type === 'COMPONENT' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${selectionClass} ${dragOverClass} ${dragClass} transition-colors group`}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={handleRowClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        draggable={node.type === 'COMPONENT'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        role="treeitem"
        tabIndex={0}
        data-testid="tree-node"
      >
        <div className="flex items-center flex-grow">
            {isExpandable ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 text-ed-text-tertiary transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
            ) : (
                <span className="w-4 mr-1 flex-shrink-0"></span>
            )}
            <span className="mr-2 flex-shrink-0">{getIconForType(node.type, node.componentType)}</span>
            {isRenaming ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs bg-ed-bg border border-ed-accent rounded px-1 py-0 outline-none w-full min-w-0"
                style={{ fontSize: '11px' }}
              />
            ) : (
              <span className={`${typography.label} ${typography.medium} truncate`} title={label}>{label}</span>
            )}
        </div>
        {node.type === 'COMPONENT' && (onRenameComponent || onDeleteComponent || onReorderComponent) && (
          <div className="flex items-center ml-2 flex-shrink-0">
            {onReorderComponent && canMoveUp && (
              <button
                onClick={handleMoveUp}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ed-accent-muted text-ed-text-tertiary hover:text-ed-accent transition-all"
                aria-label={`Move ${label} up`}
                title="Move up"
                onMouseDown={(e) => e.stopPropagation()}
                data-testid={`move-up-${node.id}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {onReorderComponent && canMoveDown && (
              <button
                onClick={handleMoveDown}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ed-accent-muted text-ed-text-tertiary hover:text-ed-accent transition-all"
                aria-label={`Move ${label} down`}
                title="Move down"
                onMouseDown={(e) => e.stopPropagation()}
                data-testid={`move-down-${node.id}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {onRenameComponent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameValue(label);
                  setIsRenaming(true);
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ed-accent-muted text-ed-text-tertiary hover:text-ed-accent transition-all"
                aria-label={`Rename ${label}`}
                title="Rename (double-click)"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {onDeleteComponent && (
              <button
                onClick={handleDelete}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ed-danger-muted text-ed-text-tertiary hover:text-ed-danger transition-all"
                aria-label={`Delete ${label}`}
                title={`Delete ${label}`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        {node.type === 'PAGE' && (onRenamePage || onDeletePage || onReorderPage) && (
          <div className="flex items-center ml-2 flex-shrink-0">
            {onRenamePage && (
              <button
                onClick={(e) => { e.stopPropagation(); setRenameValue(label); setIsRenaming(true); }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ed-accent-muted text-ed-text-tertiary hover:text-ed-accent transition-all"
                aria-label={`Rename ${label}`}
                title="Rename page"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {onReorderPage && (pageIndex ?? 0) > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onReorderPage(node.id, 'up'); }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ed-accent-muted text-ed-text-tertiary hover:text-ed-accent transition-all"
                aria-label={`Move ${label} up`}
                title="Move up"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {onReorderPage && (pageIndex ?? 0) < (pageCount ?? 1) - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onReorderPage(node.id, 'down'); }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ed-accent-muted text-ed-text-tertiary hover:text-ed-accent transition-all"
                aria-label={`Move ${label} down`}
                title="Move down"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {onDeletePage && node.id !== mainPageId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete page "${label}"? All components on this page will also be deleted.`)) {
                    onDeletePage(node.id);
                  }
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ed-danger-muted text-ed-text-tertiary hover:text-ed-danger transition-all"
                aria-label={`Delete ${label}`}
                title="Delete page"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      {isExpanded && node.children.map((child, index) => {
        // Count component siblings for move up/down logic
        const componentChildren = node.children.filter(c => c.type === 'COMPONENT');
        const componentIndex = child.type === 'COMPONENT' ? componentChildren.indexOf(child) : undefined;
        const componentCount = child.type === 'COMPONENT' ? componentChildren.length : undefined;
        return (
        <TreeNode
          key={child.id}
          node={child}
          level={level + 1}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
          currentPageId={currentPageId}
          selectedComponentIds={selectedComponentIds}
          onSelectPage={onSelectPage}
          onSelectComponent={onSelectComponent}
          onDeleteComponent={onDeleteComponent}
          onRenameComponent={onRenameComponent}
          onReorderComponent={onReorderComponent}
          onMoveComponentToParent={onMoveComponentToParent}
          onExpandNode={onExpandNode}
          appDefinition={appDefinition}
          draggedNodeIdRef={draggedNodeIdRef}
          isDraggingRef={isDraggingRef}
          onDeletePage={onDeletePage}
          onRenamePage={onRenamePage}
          onReorderPage={onReorderPage}
          mainPageId={mainPageId}
          pageIndex={child.type === 'PAGE' ? index : undefined}
          pageCount={pageCount}
          siblingIndex={componentIndex}
          siblingCount={componentCount}
        />
        );
      })}
    </div>
  );
});

export const TreeView: React.FC<TreeViewProps> = ({ isCollapsed, onToggleCollapse, appDefinition, currentPageId, selectedComponentIds, onSelectPage, onSelectComponent, onDeleteComponent, onRenameComponent, onReorderComponent, onMoveComponentToParent, onAddPage, onDeletePage, onRenamePage, onReorderPage, mainPageId, pageCount }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set([appDefinition.id, currentPageId]));
    const draggedNodeIdRef = useRef<string | null>(null);
    const isDraggingRef = useRef<boolean>(false);

    const tree = useMemo(() => buildTree(appDefinition), [appDefinition]);
    
    useEffect(() => {
        // Automatically expand the current page when switching pages
        setExpandedNodes(prev => {
            if (prev.has(currentPageId)) return prev;
            return new Set(prev).add(currentPageId);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPageId]);

    // Auto-expand ancestor nodes when a component is selected on canvas
    useEffect(() => {
        if (selectedComponentIds.length === 0) return;

        const componentParentMap = new Map<string, string>();
        appDefinition.components.forEach(c => {
            if (c.parentId) {
                componentParentMap.set(c.id, c.parentId);
            }
        });

        const nodesToExpand = new Set<string>();
        selectedComponentIds.forEach(id => {
            let currentId = componentParentMap.get(id);
            while (currentId) {
                nodesToExpand.add(currentId);
                currentId = componentParentMap.get(currentId);
            }
            const comp = appDefinition.components.find(c => c.id === id);
            if (comp) {
                nodesToExpand.add(comp.pageId);
            }
        });

        if (nodesToExpand.size > 0) {
            setExpandedNodes(prev => {
                const newSet = new Set(prev);
                let changed = false;
                nodesToExpand.forEach(nodeId => {
                    if (!newSet.has(nodeId)) {
                        newSet.add(nodeId);
                        changed = true;
                    }
                });
                return changed ? newSet : prev;
            });
        }
    }, [selectedComponentIds, appDefinition.components]);

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const expandNode = (id: string) => {
        setExpandedNodes(prev => new Set(prev).add(id));
    };
  
    if (isCollapsed) {
        return (
          <aside className="w-10 bg-ed-bg border-r border-ed-border flex flex-col items-center py-3 shrink-0" role="region" aria-label="Explorer">
            <button
                onClick={onToggleCollapse}
                className="p-2 rounded-md hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-text"
                aria-label="Expand Explorer"
                aria-expanded="false"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </aside>
        );
      }
    
      return (
        <aside className="bg-ed-bg border-r border-ed-border flex flex-col shrink-0 overflow-hidden flex-1 min-h-0" role="region" aria-label="Explorer">
          <div className="flex items-center justify-between p-3 border-b border-ed-border">
            <h2 className={`${typography.section} ${typography.bold} text-ed-text-secondary uppercase tracking-wider px-1`} id="explorer-heading">Explorer</h2>
            <div className="flex items-center gap-1">
              {onAddPage && (
                <button
                  onClick={onAddPage}
                  className="p-1.5 rounded-md hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-accent transition-colors"
                  aria-label="Add Page"
                  title="Add Page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-md hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-text"
                aria-label="Collapse Explorer"
                aria-expanded="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-2 overflow-y-auto flex-1 min-h-0" aria-labelledby="explorer-heading">
            <TreeNode
                node={tree}
                level={0}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                currentPageId={currentPageId}
                selectedComponentIds={selectedComponentIds}
                onSelectPage={onSelectPage}
                onSelectComponent={onSelectComponent}
                onDeleteComponent={onDeleteComponent}
                onRenameComponent={onRenameComponent}
                onReorderComponent={onReorderComponent}
                onMoveComponentToParent={onMoveComponentToParent}
                onExpandNode={expandNode}
                appDefinition={appDefinition}
                draggedNodeIdRef={draggedNodeIdRef}
                isDraggingRef={isDraggingRef}
                onDeletePage={onDeletePage}
                onRenamePage={onRenamePage}
                onReorderPage={onReorderPage}
                mainPageId={mainPageId}
                pageCount={pageCount}
            />
          </div>
        </aside>
      );
};