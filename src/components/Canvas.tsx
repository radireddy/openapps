


import React, { useRef, useCallback, useState, useEffect } from 'react';
import { AppComponent, ComponentType, ComponentProps, BreakpointKey, AppPage, WidgetDefinition } from '../types';
import { RenderedComponent } from './RenderedComponent';
import {
  calculateMarqueeRect,
  isMarqueeClick,
  clientToCanvasPosition,
  findComponentsInMarquee,
} from '../utils/canvasCalculations';
import { InheritedStylesProvider, buildPageInheritedStyles } from './InheritedStylesContext';

interface CanvasProps {
  components: AppComponent[];
  allComponents: AppComponent[];
  onDrop: (item: { type: ComponentType }, x: number, y: number, parentId: string | null) => void;
  onDropTemplate?: (templateId: string, parentId: string | null) => void;
  onDropWidget?: (widgetId: string, parentId: string | null) => void;
  onSelectComponent: (id: string, e: React.MouseEvent) => void;
  onDeselectCanvas: () => void;
  selectedComponentIds: string[];
  onSetSelectedComponentIds: (ids: string[]) => void;
  updateComponent: (id: string, newProps: Partial<ComponentProps>) => void;
  updateComponents: (updates: Array<{ id: string; props: Partial<ComponentProps> }>) => void;
  onDeleteComponent: (id: string) => void;
  evaluationScope: Record<string, any>;
  dataStore: Record<string, any>;
  onReparentComponent: (componentId: string, finalPosition?: { x: number; y: number }, targetContainerId?: string | null) => void;
  onReorderComponent?: (componentId: string, newIndex: number, parentId: string | null, pageId: string) => void;
  currentPageId: string;
  activeBreakpoint?: BreakpointKey;
  currentPage?: AppPage;
  widgetDefinitions?: WidgetDefinition[];
  onContextMenuSavePreset?: (componentId: string, x: number, y: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  components,
  allComponents,
  onDrop,
  onDropTemplate,
  onDropWidget,
  onSelectComponent,
  onDeselectCanvas,
  selectedComponentIds,
  onSetSelectedComponentIds,
  updateComponent,
  updateComponents,
  onDeleteComponent,
  evaluationScope,
  dataStore,
  onReparentComponent,
  onReorderComponent,
  currentPageId,
  activeBreakpoint,
  currentPage,
  widgetDefinitions,
  onContextMenuSavePreset,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const marqueeStartPos = useRef({ x: 0, y: 0 });
  const isMarqueeSelecting = useRef(false);

  // This ref will hold the latest marquee state, allowing the mouseup handler to access it
  // without needing to be re-created on every marquee change.
  const marqueeRef = useRef(marquee);
  useEffect(() => {
    marqueeRef.current = marquee;
  }, [marquee]);

  // Auto-scroll to selected component (e.g., when selected from TreeView)
  useEffect(() => {
    if (selectedComponentIds.length !== 1 || !canvasRef.current) return;
    const el = canvasRef.current.querySelector(
      `[data-component-id="${selectedComponentIds[0]}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedComponentIds]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!canvasRef.current) return;

    // Check for widget drop first
    const widgetId = event.dataTransfer.getData('application/widget');
    if (widgetId) {
      onDropWidget?.(widgetId, null);
      return;
    }

    // Check for template drop
    const templateId = event.dataTransfer.getData('application/template');
    if (templateId) {
      onDropTemplate?.(templateId, null);
      return;
    }

    const type = event.dataTransfer.getData('application/reactflow') as ComponentType;
    if (!type) return;

    // Calculate insertion order based on drop position relative to existing children
    const rootChildren = components.filter(c => !c.parentId)
      .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));
    let insertionOrder = rootChildren.length;

    // Find the child element closest to the drop position and insert after it
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const dropY = event.clientY - canvasRect.top + canvasRef.current.scrollTop;

    for (let i = 0; i < rootChildren.length; i++) {
      const childEl = canvasRef.current.querySelector(`[data-component-id="${rootChildren[i].id}"]`) as HTMLElement;
      if (childEl) {
        const childRect = childEl.getBoundingClientRect();
        const childMidY = childRect.top - canvasRect.top + canvasRef.current.scrollTop + childRect.height / 2;
        if (dropY < childMidY) {
          insertionOrder = i;
          break;
        }
      }
    }

    // Pass order as x, y=0 (position is now order-based)
    onDrop({ type }, insertionOrder, 0, null);
  }, [onDrop, onDropTemplate, onDropWidget, components]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMarqueeSelecting.current || !canvasRef.current) return;
    const { x: currentX, y: currentY } = clientToCanvasPosition(
      e.clientX, e.clientY, canvasRef.current.getBoundingClientRect()
    );
    setMarquee(calculateMarqueeRect(
      marqueeStartPos.current.x, marqueeStartPos.current.y, currentX, currentY
    ));
  }, []);

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);

    const finalMarquee = marqueeRef.current;
    if (isMarqueeSelecting.current && finalMarquee) {
      if (!isMarqueeClick(finalMarquee)) {
        const selectedIds = findComponentsInMarquee(allComponents, finalMarquee, currentPageId);
        if (selectedIds.length > 0) {
          onSetSelectedComponentIds(selectedIds);
        }
      }
    }
    isMarqueeSelecting.current = false;
    setMarquee(null);
  }, [allComponents, onSetSelectedComponentIds, handleMouseMove, currentPageId]);


  const handleMouseDown = (e: React.MouseEvent) => {
    // FIX: Only start marquee selection if the mousedown event's direct target is the canvas itself.
    // This prevents marquee from starting when clicking on container components, fixing the selection bug.
    if (e.target !== canvasRef.current) {
        return;
    }

    onDeselectCanvas();
    isMarqueeSelecting.current = true;
    marqueeStartPos.current = clientToCanvasPosition(
      e.clientX, e.clientY, canvasRef.current!.getBoundingClientRect()
    );
    setMarquee({ ...marqueeStartPos.current, width: 0, height: 0 });
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
  };

  const rootComponents = components
    .filter(c => !c.parentId)
    .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));

  // Build page-level inherited styles for cascading text properties
  const pageInheritedStyles = buildPageInheritedStyles(currentPage);

  return (
    <div
      ref={canvasRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseDown={handleMouseDown}
      className="flex-grow overflow-y-auto"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px',
        paddingBottom: '120px', // Extra drop zone at bottom so users can always drop components
        alignItems: 'stretch',
        minHeight: '100%',
        backgroundColor: evaluationScope?.theme?.colors?.background || '#fbfcfd',
        backgroundImage: `radial-gradient(circle at 1px 1px, ${evaluationScope?.theme?.colors?.border || '#d1d5db'} 1px, transparent 0)`,
        backgroundSize: '20px 20px',
      }}
      role="region"
      aria-label="Application design canvas"
      data-testid="canvas"
    >
      <InheritedStylesProvider value={pageInheritedStyles}>
      {rootComponents.map(comp => (
        <RenderedComponent
          key={comp.id}
          component={comp}
          allComponents={allComponents}
          selectedComponentIds={selectedComponentIds}
          onSelect={onSelectComponent}
          onUpdate={updateComponent}
          onUpdateComponents={updateComponents}
          onDelete={onDeleteComponent}
          onDrop={onDrop}
          onDropTemplate={onDropTemplate}
          onDropWidget={onDropWidget}
          mode="edit"
          dataStore={dataStore}
          evaluationScope={evaluationScope}
          onReparentCheck={onReparentComponent}
          onReorderComponent={onReorderComponent}
          activeBreakpoint={activeBreakpoint}
          widgetDefinitions={widgetDefinitions}
          onContextMenuSavePreset={onContextMenuSavePreset}
        />
      ))}
      </InheritedStylesProvider>
      {marquee && (
        <div
          className="absolute border-2 border-ed-accent bg-ed-accent/20 pointer-events-none"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      )}
    </div>
  );
};