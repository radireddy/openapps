


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AppComponent, ComponentProps, ComponentType, ActionHandlers, BreakpointKey, WidgetDefinition } from '../types';
import { componentRegistry } from './component-registry/registry';
import { useJavaScriptRenderer } from '../property-renderers/useJavaScriptRenderer';
import { evaluateHidden } from '../utils/disabled-helper';
import { dragState } from '../utils/dragState';
import { ListContext } from './component-registry/ListContext';
import { useComponentLifecycle } from '../hooks/useComponentLifecycle';
import { generateResponsiveStyles, BREAKPOINT_ORDER } from '@/responsive';


interface RenderedComponentProps {
  component: AppComponent;
  allComponents: AppComponent[];
  selectedComponentIds: string[];
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  onUpdateComponents: (updates: Array<{ id: string; props: Partial<ComponentProps> }>) => void;
  onDelete: (id: string) => void;
  onDrop: (item: { type: ComponentType }, x: number, y: number, parentId: string | null) => void;
  onDropTemplate?: (templateId: string, parentId: string | null) => void;
  onDropWidget?: (widgetId: string, parentId: string | null) => void;
  onReparentCheck: (id: string, finalPosition?: { x: number; y: number }, targetContainerId?: string | null) => void;
  onReorderComponent?: (componentId: string, newIndex: number, parentId: string | null, pageId: string) => void;
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  actions?: ActionHandlers;
  evaluationScope: Record<string, any>;
  activeBreakpoint?: BreakpointKey;
  widgetDefinitions?: WidgetDefinition[];
  onContextMenuSavePreset?: (componentId: string, x: number, y: number) => void;
}

export const RenderedComponent: React.FC<RenderedComponentProps> = ({
  component,
  allComponents,
  selectedComponentIds,
  onSelect,
  onUpdate,
  onUpdateComponents,
  onDelete,
  onDrop,
  onDropTemplate,
  onDropWidget,
  onReparentCheck,
  onReorderComponent,
  mode,
  dataStore,
  onUpdateDataStore,
  actions,
  evaluationScope,
  activeBreakpoint,
  widgetDefinitions,
  onContextMenuSavePreset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragOverCheckRef = useRef<number | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartInfo = useRef({ x: 0, y: 0, width: 0, height: 0, widthUnit: 'px', heightUnit: 'px' });
  const componentRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // This ref will hold the latest `allComponents` array to avoid stale closures in event handlers.
  const allComponentsRef = useRef(allComponents);
  useEffect(() => {
    allComponentsRef.current = allComponents;
  }, [allComponents]);

  // FIX: This ref ensures the drag handler always has the latest list of selected component IDs,
  // preventing a stale closure if the selection changes at the start of a drag.
  const selectedIdsRef = useRef(selectedComponentIds);
  useEffect(() => {
    selectedIdsRef.current = selectedComponentIds;
  }, [selectedComponentIds]);

  const plugin = componentRegistry[component.type];
  const ComponentRenderer = plugin.renderer;
  const isSelected = selectedComponentIds.includes(component.id);
  
  const isHidden = evaluateHidden(component.props.hidden, evaluationScope);

  // Execute onMount/onUnmount lifecycle expressions in preview mode
  useComponentLifecycle({
    componentId: component.id,
    onMount: component.props.onMount,
    onUnmount: component.props.onUnmount,
    evaluationScope,
    actions,
    mode,
  });

  // Hover state evaluation (must be unconditional for React hook rules)
  const hoverBg = useJavaScriptRenderer((component.props as any).hoverBackgroundColor, evaluationScope, undefined);
  const hoverColor = useJavaScriptRenderer((component.props as any).hoverColor, evaluationScope, undefined);
  const hoverOpacity = useJavaScriptRenderer((component.props as any).hoverOpacity, evaluationScope, undefined);
  const hoverTransform = useJavaScriptRenderer((component.props as any).hoverTransform, evaluationScope, undefined);

  const hasHoverProps = mode === 'preview' && !!(hoverBg || hoverColor || hoverOpacity || hoverTransform);
  const hoverClassName = hasHoverProps ? `procode-hover-${component.id.replace(/[^a-zA-Z0-9]/g, '-')}` : '';

  useEffect(() => {
    if (!hasHoverProps) return;
    const rules: string[] = [];
    if (hoverBg) rules.push(`background-color: ${hoverBg} !important`);
    if (hoverColor) rules.push(`color: ${hoverColor} !important`);
    if (hoverOpacity !== undefined && hoverOpacity !== '') rules.push(`opacity: ${hoverOpacity} !important`);
    if (hoverTransform) rules.push(`transform: ${hoverTransform} !important`);

    const styleId = `procode-hover-${component.id}`;
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `.${hoverClassName}:hover { ${rules.join('; ')}; transition: all 0.2s ease !important; }`;

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [hasHoverProps, hoverBg, hoverColor, hoverOpacity, hoverTransform, hoverClassName, component.id]);

  // Exit inline editing when component is deselected
  useEffect(() => {
    if (!isSelected) {
      setIsEditingInline(false);
    }
  }, [isSelected]);

  // Subscribe to global drag state for visual feedback on containers
  // Only highlights the innermost container under the mouse
  useEffect(() => {
    if (!plugin.isContainer || mode !== 'edit') return;
    
    let lastCheckTime = 0;
    const THROTTLE_MS = 16; // Check at ~60fps for smoother updates
    
    const checkDragOver = () => {
      const now = performance.now();
      if (now - lastCheckTime < THROTTLE_MS) {
        return; // Skip if too soon
      }
      lastCheckTime = now;
      
      const state = dragState.getState();
      // Only show highlight if dragging and not dragging this component itself
      if (state.isDragging && !state.draggedComponentIds.includes(component.id) && componentRef.current) {
        const rect = componentRef.current.getBoundingClientRect();
        const isOverContainer = (
          state.mouseX >= rect.left &&
          state.mouseX <= rect.right &&
          state.mouseY >= rect.top &&
          state.mouseY <= rect.bottom
        );
        
        // Only highlight if this is the highlighted container (innermost one)
        const shouldHighlight = isOverContainer && state.highlightedContainerId === component.id;
        
        // Throttle drag over state updates to avoid excessive re-renders
        if (dragOverCheckRef.current !== null) {
          cancelAnimationFrame(dragOverCheckRef.current);
        }
        
        dragOverCheckRef.current = requestAnimationFrame(() => {
          setIsDragOver(shouldHighlight);
          dragOverCheckRef.current = null;
        });
      } else {
        if (dragOverCheckRef.current !== null) {
          cancelAnimationFrame(dragOverCheckRef.current);
          dragOverCheckRef.current = null;
        }
        setIsDragOver(false);
      }
    };
    
    const unsubscribe = dragState.subscribe(() => {
      checkDragOver();
    });
    
    // Also check on mount in case drag is already in progress
    checkDragOver();
    
    return () => {
      unsubscribe();
      if (dragOverCheckRef.current !== null) {
        cancelAnimationFrame(dragOverCheckRef.current);
        dragOverCheckRef.current = null;
      }
    };
  }, [plugin.isContainer, mode, component.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'edit' || isEditingInline) return;
    if ((e.target as HTMLElement).dataset.resizeHandle) return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-delete-button="true"]') || target.closest('[aria-label="Delete Component"]')) {
      return;
    }

    e.stopPropagation();

    const componentsToDrag = !isSelected ? [component.id] : selectedComponentIds;
    selectedIdsRef.current = componentsToDrag;

    if (!isSelected) {
      onSelect(component.id, e);
    }
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragOffsetRef.current = { x: 0, y: 0 };

    dragState.startDrag(componentsToDrag);
  };
  
  const handleDoubleClick = () => {
    if (mode !== 'edit') return;
    if (component.type === ComponentType.LABEL || component.type === ComponentType.BUTTON || component.type === ComponentType.INPUT) {
      setIsEditingInline(true);
    }
  };

  const handleCommitInlineEdit = (newValue: string) => {
    const propToUpdate = component.type === ComponentType.INPUT ? 'placeholder' : 'text';
    onUpdate(component.id, { [propToUpdate]: newValue } as Partial<ComponentProps>);
    setIsEditingInline(false);
  };


  const handleDeleteMouseDown = (e: React.MouseEvent) => {
    // Prevent the delete button click from triggering component selection
    // Stop propagation immediately to prevent wrapper's handleMouseDown from firing
    e.stopPropagation();
    e.preventDefault();
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    // Ensure delete click is handled
    e.stopPropagation();
    e.preventDefault();
    if (mode === 'edit') {
      onDelete(component.id);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode !== 'edit' || selectedComponentIds.length > 1) return; // Disable resizing for multi-select
    
    // Parse width/height to numbers for resize calculations
    // Also store the original units to preserve them during resize
    const parseSizeToNumber = (size: any, fallbackElement?: HTMLElement | null, dimension?: 'width' | 'height'): number => {
      if (typeof size === 'number') return size;
      if (typeof size === 'string' && size.trim()) {
        const trimmed = size.trim();
        // For 'auto' or '100%', use the actual rendered size from the DOM
        if ((trimmed === 'auto' || trimmed === '100%') && fallbackElement && dimension) {
          const rect = fallbackElement.getBoundingClientRect();
          return dimension === 'width' ? rect.width : rect.height;
        }
        const match = trimmed.match(/^(\d+(?:\.\d+)?)(px|%)$/);
        if (match) return parseFloat(match[1]);
      }
      return 400; // default
    };

    const getSizeUnit = (size: any): string => {
      if (typeof size === 'string' && size.trim()) {
        const trimmed = size.trim();
        if (trimmed === 'auto') return 'px'; // resize from auto switches to px
        const match = trimmed.match(/^(\d+(?:\.\d+)?)(px|%)$/);
        if (match) return match[2];
      }
      return 'px'; // default to px
    };
    
    // Store both numeric values and units for resize
    const originalWidth = component.props.width;
    const originalHeight = component.props.height;
    const el = document.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement | null;
    const widthNum = parseSizeToNumber(originalWidth, el, 'width');
    const heightNum = parseSizeToNumber(originalHeight, el, 'height');
    const widthUnit = getSizeUnit(originalWidth);
    const heightUnit = getSizeUnit(originalHeight);
    
    setIsResizing(true);
    resizeStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      width: widthNum,
      height: heightNum,
      // Store units in the ref so we can use them during resize
      widthUnit: widthUnit,
      heightUnit: heightUnit,
    } as any;
  };

  useEffect(() => {
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || mode !== 'edit') return;

      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;

      const moved = Math.abs(dx) > 2 || Math.abs(dy) > 2;
      if (moved) hasMoved.current = true;

      if (hasMoved.current) {
        dragState.updateMousePosition(e.clientX, e.clientY);

        // Find innermost container under cursor for reparenting highlight
        let innermostContainerId: string | null = null;
        let smallestArea = Infinity;

        allComponentsRef.current.forEach(comp => {
          const compPlugin = componentRegistry[comp.type];
          if (!compPlugin?.isContainer ||
              selectedIdsRef.current.includes(comp.id) ||
              comp.pageId !== component.pageId) return;

          const containerElement = document.querySelector(`[data-component-id="${comp.id}"]`) as HTMLElement;
          if (!containerElement) return;

          const rect = containerElement.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right &&
              e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const area = rect.width * rect.height;
            if (area < smallestArea) {
              smallestArea = area;
              innermostContainerId = comp.id;
            }
          }
        });

        dragState.setHighlightedContainer(innermostContainerId);
      }

      dragOffsetRef.current = { x: dx, y: dy };

      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (hasMoved.current) {
          selectedIdsRef.current.forEach(id => {
            const element = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
            if (element) {
              element.style.transform = `translate(${dx}px, ${dy}px)`;
              element.style.willChange = 'transform';
              element.style.pointerEvents = 'none';
              if (element.style.zIndex !== '10000') element.style.zIndex = '10000';
            }
          });
        }
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      setIsDragOver(false);

      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }

      if (hasMoved.current) {
        // Use the highlighted container from dragState — it was determined from
        // actual DOM bounding rects during drag, which is reliable in flex layouts
        // (unlike props.x/y which are order values, not pixel positions).
        const targetContainerId = dragState.getState().highlightedContainerId;
        const mouseY = dragState.getState().mouseY;

        selectedIdsRef.current.forEach(id => {
          const comp = allComponentsRef.current.find(c => c.id === id);
          if (!comp) {
            onReparentCheck(id, undefined, targetContainerId);
            return;
          }

          const currentParentId = comp.parentId || null;
          const targetParentId = targetContainerId || null;

          // If dragging within the same parent, reorder instead of reparent
          if (currentParentId === targetParentId && onReorderComponent) {
            // Find siblings in the same parent, sorted by order
            const siblings = allComponentsRef.current
              .filter(c => (c.parentId || null) === currentParentId && c.pageId === comp.pageId && c.id !== id)
              .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));

            // Calculate insertion index based on mouse Y position among sibling elements
            let insertIndex = siblings.length; // default: end
            for (let i = 0; i < siblings.length; i++) {
              const sibEl = document.querySelector(`[data-component-id="${siblings[i].id}"]`) as HTMLElement;
              if (sibEl) {
                const rect = sibEl.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (mouseY < midY) {
                  insertIndex = i;
                  break;
                }
              }
            }

            onReorderComponent(id, insertIndex, currentParentId, comp.pageId);
          } else {
            onReparentCheck(id, undefined, targetContainerId);
          }
        });
      }

      // Clean up drag styles
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          selectedIdsRef.current.forEach(id => {
            const element = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
            if (element) {
              element.style.removeProperty('transform');
              element.style.removeProperty('will-change');
              element.style.removeProperty('pointer-events');
              if (element.style.zIndex === '10000') element.style.removeProperty('z-index');
            }
          });
        });
      });

      dragState.setHighlightedContainer(null);
      dragState.endDrag();
      hasMoved.current = false;
      dragOffsetRef.current = { x: 0, y: 0 };
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      // Clean up leftover drag styles
      setTimeout(() => {
        selectedIdsRef.current.forEach(id => {
          const element = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
          if (element) {
            element.style.removeProperty('transform');
            element.style.removeProperty('will-change');
            element.style.removeProperty('pointer-events');
            if (element.style.zIndex === '10000') element.style.removeProperty('z-index');
          }
        });
      }, 0);
    };
  }, [isDragging, onUpdateComponents, mode, onReparentCheck, onReorderComponent]);


  useEffect(() => {
    const handleResizeMouseMove = (e: MouseEvent) => {
      if (!isResizing || mode !== 'edit') return;
      const dx = e.clientX - resizeStartInfo.current.x;
      const dy = e.clientY - resizeStartInfo.current.y;
      
      try {
        // Calculate new dimensions ensuring they're always valid positive numbers
        // Round to avoid decimal precision issues
        const newWidthNum = Math.max(20, Math.round(resizeStartInfo.current.width + dx));
        const newHeightNum = Math.max(20, Math.round(resizeStartInfo.current.height + dy));
        
        // All components now use string values with units (px or %)
        const widthUnit = (resizeStartInfo.current as any).widthUnit || 'px';
        const heightUnit = (resizeStartInfo.current as any).heightUnit || 'px';

        let widthValue: number | string;
        let heightValue: number | string;

        // When resizing, convert % to px (user is manually sizing)
        // Keep px units as-is
        if (widthUnit === '%') {
          widthValue = `${newWidthNum}px`;
        } else {
          widthValue = `${newWidthNum}${widthUnit}`;
        }
        if (heightUnit === '%') {
          heightValue = `${newHeightNum}px`;
        } else {
          heightValue = `${newHeightNum}${heightUnit}`;
        }
        
        // Only update if values have actually changed to avoid unnecessary re-renders
        const currentWidth = component.props.width;
        const currentHeight = component.props.height;
        if (currentWidth !== widthValue || currentHeight !== heightValue) {
          try {
            onUpdate(component.id, {
              width: widthValue,
              height: heightValue,
            });
          } catch (error) {
            console.error('Resize update failed:', component.id, error);
          }
        }
      } catch (error) {
        console.error('Resize exception:', component.id, error);
      }
    };
    const handleResizeMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, onUpdate, component.id, mode]);
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    setIsDragOver(false);

    // Non-containers: let the drop event bubble to the parent container or canvas
    if (!plugin.isContainer || !componentRef.current) return;

    // Container handles the drop — stop it from bubbling further
    event.preventDefault();
    event.stopPropagation();

    // Check for widget drop first
    const widgetId = event.dataTransfer.getData('application/widget');
    if (widgetId) {
      onDropWidget?.(widgetId, component.id);
      return;
    }

    // Check for template drop
    const templateId = event.dataTransfer.getData('application/template');
    if (templateId) {
      onDropTemplate?.(templateId, component.id);
      return;
    }

    const type = event.dataTransfer.getData('application/reactflow') as ComponentType;
    if (!type) return;

    // Calculate insertion order based on drop position relative to existing children
    const children = allComponents.filter(c => c.parentId === component.id)
      .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));
    let insertionOrder = children.length;

    const containerRect = componentRef.current.getBoundingClientRect();
    const dropY = event.clientY - containerRect.top;

    for (let i = 0; i < children.length; i++) {
      const childEl = componentRef.current.querySelector(`[data-component-id="${children[i].id}"]`) as HTMLElement;
      if (childEl) {
        const childRect = childEl.getBoundingClientRect();
        const childMidY = childRect.top - containerRect.top + childRect.height / 2;
        if (dropY < childMidY) {
          insertionOrder = i;
          break;
        }
      }
    }

    onDrop({ type }, insertionOrder, 0, component.id);
  }, [onDrop, onDropTemplate, onDropWidget, component.id, plugin.isContainer, allComponents]);

  const handleDragOver = (event: React.DragEvent) => {
    if (plugin.isContainer && mode === 'edit') {
      // Check if something is being dragged
      // Note: getData might not work during dragover in some browsers, so we check types instead
      const hasDragData = event.dataTransfer.types.length > 0;
      
      // Show visual feedback if dragging anything (new component from palette or existing component)
      if (hasDragData) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    // Only clear if we're actually leaving the element (not just moving to a child)
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDropEnd = () => {
    setIsDragOver(false);
  };


  const p = component.props;

  // Parse width and height - support px, %, auto, and other CSS values
  const parseSize = (size: any, defaultValue: string): string => {
    if (typeof size === 'number') {
      return `${size}px`; // Convert number to px string
    }
    if (typeof size === 'string') {
      const trimmed = size.trim();
      // Support 'auto' keyword
      if (trimmed === 'auto') return 'auto';
      // If it's already a valid CSS size value, use it
      if (trimmed.match(/^\d+(?:\.\d+)?(px|%|rem|em|vw|vh)$/)) {
        return trimmed;
      }
      // Support calc() expressions
      if (trimmed.startsWith('calc(')) return trimmed;
      // If it's just a number, assume px
      const numValue = parseFloat(trimmed);
      if (!isNaN(numValue)) {
        return `${numValue}px`;
      }
    }
    return defaultValue;
  };

  // Resolve responsive styles when a non-mobile breakpoint is active
  const resolvedStyles = activeBreakpoint && activeBreakpoint !== 'mobile'
    ? generateResponsiveStyles(component, activeBreakpoint)
    : null;

  // Create component with responsive overrides merged into props for the active breakpoint.
  // This ensures component renderers (Input, Label, Button, etc.) see the correct values
  // for ALL properties (typography, colors, etc.), not just layout properties.
  const resolvedComponent = useMemo(() => {
    if (!activeBreakpoint || activeBreakpoint === 'mobile') return component;
    const responsive = (component.props as any).responsive;
    if (!responsive) return component;
    const targetIndex = BREAKPOINT_ORDER.indexOf(activeBreakpoint);
    let mergedProps = { ...component.props };
    for (let i = 1; i <= targetIndex; i++) {
      const bp = BREAKPOINT_ORDER[i];
      const overrides = responsive[bp];
      if (overrides) {
        mergedProps = { ...mergedProps, ...overrides };
      }
    }
    return { ...component, props: mergedProps };
  }, [component, activeBreakpoint]);

  const width = parseSize(resolvedStyles?.width ?? p.width, '100%');
  const rawHeight = parseSize(resolvedStyles?.height ?? p.height, 'auto');
  // When a component has a label, FormFieldWrapper adds a label row (~20px),
  // so the wrapper must grow to match. Fixed height ensures edit/preview consistency.
  const hasLabel = (p as any).label && String((p as any).label).trim() !== '';
  const height = (hasLabel && rawHeight !== 'auto') ? `calc(${rawHeight} + 20px)` : rawHeight;

  // Min dimensions — pass through to wrapper so containers with height:auto have a visible minimum
  const minHeightRaw = (resolvedStyles?.minHeight as string) ?? (p as any).minHeight;
  const minWidthRaw = (resolvedStyles?.minWidth as string) ?? (p as any).minWidth;
  const minHeight = minHeightRaw ? parseSize(minHeightRaw, undefined as any) : undefined;
  const minWidth = minWidthRaw ? parseSize(minWidthRaw, undefined as any) : undefined;

  // Flex item properties — use resolved responsive values when available
  const order = (resolvedStyles?.order as number) ?? (p as any).order ?? 0;
  const flexGrow = (resolvedStyles?.flexGrow as number) ?? (p as any).flexGrow ?? 0;
  const flexShrink = (resolvedStyles?.flexShrink as number) ?? (p as any).flexShrink ?? 1;
  const alignSelf = (resolvedStyles?.alignSelf as string) ?? (p as any).alignSelf;

  // z-index boosts for selection/drag states
  const explicitZIndex = (component.props as any).zIndex;
  const selectedBoost = isSelected ? 1000 : 0;
  const dragBoost = isDragging ? 10000 : 0;

  let finalZIndex: number | undefined;
  if (explicitZIndex !== undefined && explicitZIndex !== null) {
    const baseZIndex = typeof explicitZIndex === 'number' ? explicitZIndex : parseFloat(String(explicitZIndex)) || 0;
    finalZIndex = baseZIndex + selectedBoost + dragBoost;
  } else if (selectedBoost || dragBoost) {
    finalZIndex = selectedBoost + dragBoost;
  }

  // Flex item style — components are now flex items, not absolutely positioned
  const componentStyle: React.CSSProperties = {
    position: 'relative',
    width: width,
    height: height,
    ...(minHeight && { minHeight }),
    ...(minWidth && { minWidth }),
    order: order,
    flexGrow: flexGrow,
    flexShrink: flexShrink,
    ...(alignSelf && { alignSelf }),
    ...(finalZIndex !== undefined && { zIndex: finalZIndex }),
    ...(isHidden
      ? (mode === 'edit'
        ? { opacity: 0.3, pointerEvents: 'auto' as const }
        : { display: 'none' })
      : {}),
    overflow: 'visible',
  };

  const selectionClass = isSelected && mode === 'edit' ? 'outline outline-2 outline-blue-500 outline-offset-2' : '';
  const cursorClass = mode === 'edit' ? 'cursor-grab' : '';
  const activeCursorClass = isDragging ? 'cursor-grabbing' : '';
  // Visual feedback when dragging over a container/panel - smooth transition
  const dragOverClass = isDragOver && plugin.isContainer && mode === 'edit' 
    ? 'ring-4 ring-ed-accent ring-offset-2 bg-ed-accent-muted border-2 border-ed-accent border-dashed transition-all duration-150 ease-out' 
    : '';
  
  // For List components, don't render template children here because List handles its own children rendering:
  // - In edit mode: TemplateContainerRenderer renders template children
  // - In preview mode: ListItemRenderer renders cloned items
  // If we render them here too, we get duplicate rendering
  const shouldRenderChildren = component.type !== ComponentType.LIST;
  const children = shouldRenderChildren
    ? allComponents
        .filter(c => c.parentId === component.id)
        .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0))
    : [];

  // For Tabs/Accordion in edit mode, assign slot on drop based on active tab/section
  // This is handled by the handleDrop callback above which sets the order

  return (
    <div
      ref={componentRef}
      data-component-id={component.id}
      id={(component.props as any).anchorId || undefined}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e: React.MouseEvent) => {
        if (mode === 'edit' && plugin?.isContainer && onContextMenuSavePreset) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenuSavePreset(component.id, e.clientX, e.clientY);
        }
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDropEnd}
      style={componentStyle}
      className={`${mode === 'edit' ? 'select-none' : ''} ${selectionClass} ${cursorClass} ${activeCursorClass} ${dragOverClass} ${hoverClassName}`}
      aria-label={`${component.type} component`}
    >
      <ListContext.Provider
        value={{
          allComponents,
          selectedComponentIds,
          onSelect,
          onUpdate,
          onUpdateComponents,
          onDelete,
          onDrop,
          onReparentCheck,
          dataStore,
          onUpdateDataStore,
          actions,
          currentComponentId: component.id,
          activeBreakpoint,
          widgetDefinitions,
        } as any}
      >
        <ComponentRenderer
          component={resolvedComponent}
          mode={mode}
          dataStore={dataStore}
          onUpdateDataStore={onUpdateDataStore}
          actions={actions}
          isEditingInline={isEditingInline}
          onCommitInlineEdit={handleCommitInlineEdit}
          evaluationScope={evaluationScope}
          widgetDefinitions={widgetDefinitions}
        >
          {/* Render children recursively */}
          {/* For List in preview mode, children are handled by ListComponentRenderer */}
          {children.map(child => (
            <RenderedComponent
              key={child.id}
              component={child}
              allComponents={allComponents}
              selectedComponentIds={selectedComponentIds}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onUpdateComponents={onUpdateComponents}
              onDelete={onDelete}
              onDrop={onDrop}
              onDropTemplate={onDropTemplate}
              onDropWidget={onDropWidget}
              mode={mode}
              dataStore={dataStore}
              onUpdateDataStore={onUpdateDataStore}
              actions={actions}
              evaluationScope={evaluationScope}
              onReparentCheck={onReparentCheck}
              onReorderComponent={onReorderComponent}
              activeBreakpoint={activeBreakpoint}
              widgetDefinitions={widgetDefinitions}
              onContextMenuSavePreset={onContextMenuSavePreset}
            />
          ))}
        </ComponentRenderer>
      </ListContext.Provider>
      
      {/* Delete button and resize handle rendered after ComponentRenderer to ensure they're on top */}
      {isSelected && mode === 'edit' && !isEditingInline && (
        <>
           <div
            onClick={handleDeleteClick}
            onMouseDown={handleDeleteMouseDown}
            className="absolute -top-3 -right-3 w-6 h-6 bg-ed-bg text-ed-text-secondary border border-ed-border rounded-full flex items-center justify-center cursor-pointer hover:bg-ed-danger hover:text-ed-text-inverse hover:border-ed-danger transition-all shadow-lg"
            aria-label="Delete Component"
            role="button"
            style={{ 
              pointerEvents: 'auto',
              zIndex: 1000, // Very high z-index to ensure it's above everything
              position: 'absolute',
            }}
            data-delete-button="true"
            onMouseUp={(e) => {
              // Also stop propagation on mouseup to be safe
              e.stopPropagation();
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (mode === 'edit') {
                  onDelete(component.id);
                }
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          {selectedComponentIds.length === 1 && (
            <div
                data-resize-handle="true"
                onMouseDown={handleResizeMouseDown}
                className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-ed-accent border-2 border-ed-bg rounded-sm cursor-nwse-resize z-20"
                aria-label="Resize Component"
                role="slider"
            />
           )}
        </>
      )}
    </div>
  );
};