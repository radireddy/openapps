
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppComponent, ComponentProps, AppVariable, BreakpointKey, AppPage, WidgetDefinition } from '../types';
import { componentRegistry } from './component-registry/registry';
import { PropertiesPanelCore } from './properties/PropertiesPanelCore';
import { PanelLayoutContext } from './properties/PanelLayoutContext';
import { BREAKPOINTS } from '@/responsive';
import { PageSettingsPanel } from './PageSettingsPanel';

interface PropertiesPanelProps {
  components: AppComponent[];
  selectedComponentIds: string[];
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  onRenameComponent?: (id: string, name: string) => void;
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  variables: AppVariable[];
  evaluationScope: Record<string, any>;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
  activeBreakpoint?: BreakpointKey;
  selectedPage?: AppPage | null;
  isMainPage?: boolean;
  onUpdatePage?: (pageId: string, updates: Partial<AppPage>) => void;
  widgetDefinitions?: WidgetDefinition[];
  isWidgetMode?: boolean;
}

const PropertiesPanelHeader: React.FC<{
  component: AppComponent | null | undefined;
  plugin: any;
  onToggleCollapse: () => void;
  onRenameComponent?: (id: string, name: string) => void;
  activeBreakpoint?: BreakpointKey;
  selectedPage?: AppPage | null;
}> = ({ component, plugin, onToggleCollapse, onRenameComponent, activeBreakpoint, selectedPage }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [idCopied, setIdCopied] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const displayName = component?.name || (plugin ? plugin.paletteConfig.label : (selectedPage ? selectedPage.name : 'Properties'));

  const startRename = () => {
    if (component && onRenameComponent) {
      setNameValue(displayName);
      setIsEditingName(true);
    }
  };

  const commitRename = () => {
    const trimmed = nameValue.trim();
    if (trimmed && component && onRenameComponent) {
      onRenameComponent(component.id, trimmed);
    }
    setIsEditingName(false);
  };

  const handleCopyId = () => {
    if (!component) return;
    try {
      navigator.clipboard.writeText(component.id);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 1500);
    } catch {
      // Fallback: silently fail if clipboard API unavailable
    }
  };

  return (
    <div className="flex items-center justify-between px-3.5 py-3 bg-ed-bg border-b border-ed-border/70">
      <div className="flex items-center gap-2.5 min-w-0">
        {component && plugin && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-ed-accent/20 to-ed-accent/5 text-ed-accent flex items-center justify-center ring-1 ring-ed-accent/20">
            {plugin.paletteConfig.icon}
          </div>
        )}
        {!component && selectedPage && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-ed-accent/20 to-ed-accent/5 text-ed-accent flex items-center justify-center ring-1 ring-ed-accent/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        <div className="min-w-0">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              className="text-sm font-semibold text-ed-text bg-ed-bg border border-ed-accent rounded px-1 py-0 outline-none w-full"
            />
          ) : (
            <h3
              id="properties-heading"
              className="text-[13px] font-semibold text-ed-text truncate cursor-pointer hover:text-ed-accent transition-colors"
              onDoubleClick={startRename}
              title="Double-click to rename"
            >
              {displayName}
            </h3>
          )}
          {component && (
            <span
              onClick={handleCopyId}
              title="Click to copy ID"
              className="inline-flex items-center gap-1 mt-0.5 bg-ed-accent-muted/50 text-ed-text-tertiary text-[10px] px-1.5 py-0.5 rounded font-mono truncate max-w-[160px] border border-ed-accent/15 cursor-pointer hover:bg-ed-accent-muted hover:text-ed-accent-text transition-colors"
            >
              {idCopied ? 'Copied!' : component.id}
              {!idCopied && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </span>
          )}
          {activeBreakpoint && activeBreakpoint !== 'mobile' && (
            <span className="inline-block mt-1 bg-ed-accent/15 text-ed-accent text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {BREAKPOINTS[activeBreakpoint].label}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onToggleCollapse}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-ed-bg-hover text-ed-text-tertiary hover:text-ed-text-secondary transition-colors"
        aria-label="Collapse Properties"
        aria-expanded="true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ components, selectedComponentIds, onUpdate, onRenameComponent, width, isCollapsed, onToggleCollapse, variables, evaluationScope, onOpenExpressionEditor, activeBreakpoint, selectedPage, isMainPage, onUpdatePage, widgetDefinitions, isWidgetMode }) => {
  const isSingleSelection = selectedComponentIds.length === 1;
  const component = isSingleSelection ? components.find(c => c.id === selectedComponentIds[0]) : null;
  const plugin = component ? componentRegistry[component.type] : null;

  const panelRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width <= 300);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const commonPanelClasses = "bg-ed-bg border-l border-ed-border flex flex-col shrink-0";

  if (isCollapsed) {
    return (
      <aside className={`w-10 items-center py-3 ${commonPanelClasses}`} role="region" aria-label="Properties">
        <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-text"
            aria-label="Expand Properties"
            aria-expanded="false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    );
  }

  // All components are now migrated to metadata-driven system
  // Always use PropertiesPanelCore
  let content;
  if (selectedComponentIds.length === 0) {
    if (selectedPage && onUpdatePage && !isWidgetMode) {
      content = (
        <PageSettingsPanel
          page={selectedPage}
          onUpdatePage={onUpdatePage}
          isMainPage={isMainPage || false}
        />
      );
    } else {
      content = (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-10 h-10 rounded-lg bg-ed-bg-tertiary flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ed-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <p className="text-ed-text-tertiary text-xs text-center">Select a component to view its properties</p>
        </div>
      );
    }
  } else {
    content = (
      <PropertiesPanelCore
        components={components}
        selectedComponentIds={selectedComponentIds}
        onUpdate={onUpdate}
        variables={variables}
        evaluationScope={evaluationScope}
        onOpenExpressionEditor={onOpenExpressionEditor}
        activeBreakpoint={activeBreakpoint}
        widgetDefinitions={widgetDefinitions}
      />
    );
  }

  return (
    <aside ref={panelRef} style={{ width: `${width}px` }} className={commonPanelClasses} role="region" aria-label="Properties" data-testid="properties-panel">
       <PropertiesPanelHeader
         component={component}
         plugin={plugin}
         onToggleCollapse={onToggleCollapse}
         onRenameComponent={onRenameComponent}
         activeBreakpoint={activeBreakpoint}
         selectedPage={isWidgetMode ? null : selectedPage}
       />
      <PanelLayoutContext.Provider value={{ isNarrow }}>
        <div className="flex-1 overflow-y-auto" aria-labelledby="properties-heading">
          {content}
        </div>
      </PanelLayoutContext.Provider>
    </aside>
  );
};
