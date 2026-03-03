import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ComponentPlugin, ComponentType, WidgetDefinition } from '@/types';
import { componentRegistry } from '@/components/component-registry/registry';
import { componentTemplates, ComponentTemplate } from './component-templates';
import { storageService } from '@/storageService';

interface ComponentPaletteProps {
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddComponent?: (type: string) => void;
  onAddTemplate?: (templateId: string) => void;
  widgetDefinitions?: WidgetDefinition[];
  onAddWidget?: (widgetId: string) => void;
}

const PaletteItem: React.FC<{
  componentPlugin: ComponentPlugin;
  onAdd?: (type: string) => void;
  onTrackRecent?: (type: string) => void;
}> = ({ componentPlugin, onAdd, onTrackRecent }) => {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', componentPlugin.type);
    event.dataTransfer.effectAllowed = 'move';
    onTrackRecent?.(componentPlugin.type);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDoubleClick={() => { onTrackRecent?.(componentPlugin.type); onAdd?.(componentPlugin.type); }}
      className="flex flex-col items-center justify-center p-2 border border-ed-border rounded-md cursor-grab bg-ed-bg hover:bg-ed-accent-muted hover:border-ed-accent hover:text-ed-accent transition-all text-center"
      title={`Drag to add a ${componentPlugin.paletteConfig.label}`}
      aria-label={`${componentPlugin.paletteConfig.label} component`}
      data-testid={`palette-item-${componentPlugin.type}`}
    >
      {componentPlugin.paletteConfig.icon}
      <span className="text-xs font-semibold mt-1">{componentPlugin.paletteConfig.label}</span>
    </div>
  );
};

const TemplatePaletteItem: React.FC<{
  template: ComponentTemplate;
  onAdd?: (templateId: string) => void;
}> = ({ template, onAdd }) => {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/template', template.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDoubleClick={() => onAdd?.(template.id)}
      className="flex flex-col items-center justify-center p-2 border border-ed-border rounded-md cursor-grab bg-ed-bg hover:bg-ed-accent-muted hover:border-ed-accent hover:text-ed-accent transition-all text-center"
      title={template.description}
      data-testid={`palette-template-${template.id}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
      <span className="text-xs font-semibold mt-1">{template.name}</span>
    </div>
  );
};

const WidgetPaletteItem: React.FC<{
  widget: WidgetDefinition;
  onAdd?: (widgetId: string) => void;
}> = ({ widget, onAdd }) => {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/widget', widget.id);
    event.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDoubleClick={() => onAdd?.(widget.id)}
      className="flex flex-col items-center justify-center p-2 border border-ed-border rounded-md cursor-grab bg-ed-bg hover:bg-ed-accent-muted hover:border-ed-accent hover:text-ed-accent transition-all text-center"
      title={widget.description || widget.name}
      data-testid={`palette-widget-${widget.id}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <span className="text-xs font-semibold mt-1">{widget.name}</span>
    </div>
  );
};

const RECENT_KEY = 'palette:recent';

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ width, isCollapsed, onToggleCollapse, onAddComponent, onAddTemplate, widgetDefinitions, onAddWidget }) => {
  const [expandedCategory, setExpandedCategory] = useState<string>('Input');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [recentTypes, setRecentTypes] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });

  const trackRecent = useCallback((type: string) => {
    setRecentTypes(prev => {
      const updated = [type, ...prev.filter(t => t !== type)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const [customPresets, setCustomPresets] = useState<ComponentTemplate[]>([]);

  useEffect(() => {
    storageService.getAllCustomPresets().then(setCustomPresets);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return Object.values(componentRegistry).filter(plugin =>
      plugin.paletteConfig.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const widgetSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return (widgetDefinitions || []).filter(w =>
      w.name.toLowerCase().includes(query) || (w.description || '').toLowerCase().includes(query)
    );
  }, [searchQuery, widgetDefinitions]);

  const categories = useMemo(() => [
    'Input',
    'Display',
    'Media',
    'Layout',
    'Icons',
    'Other',
    'Presets',
    'Widgets',
  ], []);

  const getCategoryFor = (plugin: ComponentPlugin) => {
    switch (plugin.type) {
      case ComponentType.INPUT:
      case ComponentType.TEXTAREA:
      case ComponentType.SELECT:
      case ComponentType.CHECKBOX:
      case ComponentType.RADIO_GROUP:
      case ComponentType.SWITCH:
      case ComponentType.DATE_PICKER:
      case ComponentType.TIME_PICKER:
      case ComponentType.SLIDER:
      case ComponentType.FILE_UPLOAD:
      case ComponentType.RATING:
        return 'Input';
      case ComponentType.LABEL:
      case ComponentType.BUTTON:
      case ComponentType.TABLE:
      case ComponentType.PROGRESS:
        return 'Display';
      case ComponentType.IMAGE:
        return 'Media';
      case ComponentType.CONTAINER:
      case ComponentType.LIST:
      case ComponentType.FORM:
      case ComponentType.MODAL:
      case ComponentType.TABS:
      case ComponentType.ACCORDION:
        return 'Layout';
      case ComponentType.DIVIDER:
        return 'Layout';
      case ComponentType.CUSTOM_WIDGET:
        return null; // Hidden from palette — added via Widgets category
      default:
        return 'Other';
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, ComponentPlugin[]> = {};
    categories.forEach(c => (map[c] = []));
    Object.values(componentRegistry).forEach(plugin => {
      const c = getCategoryFor(plugin);
      if (c && map[c]) map[c].push(plugin);
    });
    return map;
  }, [categories]);

  if (isCollapsed) {
    return (
      <aside className="w-10 bg-ed-bg border-r border-ed-border flex flex-col items-center py-3 shrink-0" role="region" aria-label="Components">
        <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-text"
            aria-label="Expand Components"
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
    <aside style={{ width: `${width}px` }} className="bg-ed-bg border-r border-ed-border flex flex-col shrink-0 overflow-hidden h-full" role="region" aria-label="Components">
      <div className="flex items-center justify-between p-3 border-b border-ed-border">
        <h2 className="text-sm font-bold text-ed-text-secondary uppercase tracking-wider px-1" id="components-heading">Components</h2>
        <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-text"
            aria-label="Collapse Components"
            aria-expanded="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="px-3 py-2 border-b border-ed-border">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full px-2 py-1.5 text-sm border border-ed-border rounded-md bg-ed-bg text-ed-text placeholder-ed-text-tertiary focus:outline-none focus:ring-1 focus:ring-ed-accent"
            aria-label="Search components"
            data-testid="palette-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ed-text-tertiary hover:text-ed-text"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>
      <div className="p-2 flex-1 min-h-0 overflow-y-auto" aria-labelledby="components-heading">
        {searchResults ? (
          <div className="p-2">
            {searchResults.length === 0 && (!widgetSearchResults || widgetSearchResults.length === 0) ? (
              <div className="text-sm text-ed-text-tertiary text-center py-4">No components found</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {searchResults.map(plugin => (
                  <PaletteItem key={plugin.type} componentPlugin={plugin} onAdd={onAddComponent} onTrackRecent={trackRecent} />
                ))}
                {(widgetSearchResults || []).map(widget => (
                  <WidgetPaletteItem key={widget.id} widget={widget} onAdd={onAddWidget} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {recentTypes.length > 0 && (
              <div className="mb-2">
                <button
                  onClick={() => setRecentExpanded(!recentExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-ed-bg-hover"
                  aria-expanded={recentExpanded}
                  aria-controls="palette-recent"
                >
                  <span className="text-sm font-medium text-ed-text-secondary">Recent</span>
                  <svg className={`h-4 w-4 text-ed-text-tertiary transform transition-transform ${recentExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 4l8 6-8 6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {recentExpanded && (
                  <div id="palette-recent" className="mt-2 px-2">
                    <div className="grid grid-cols-2 gap-2">
                      {recentTypes
                        .map(type => Object.values(componentRegistry).find(p => p.type === type))
                        .filter(Boolean)
                        .map(plugin => (
                          <PaletteItem key={`recent-${plugin!.type}`} componentPlugin={plugin!} onAdd={onAddComponent} onTrackRecent={trackRecent} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {categories.filter(cat => {
              if (cat === 'Presets') return componentTemplates.length > 0 || customPresets.length > 0;
              if (cat === 'Widgets') return (widgetDefinitions || []).length > 0;
              return (grouped[cat] || []).length > 0;
            }).map(cat => {
              const isOpen = expandedCategory === cat;
              return (
                <div key={cat} className="mb-2">
                  <button
                    onClick={() => setExpandedCategory(isOpen ? '' : cat)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-ed-bg-hover"
                    aria-expanded={isOpen}
                    aria-controls={`palette-${cat}`}
                  >
                    <span className="text-sm font-medium text-ed-text-secondary">{cat}</span>
                    <svg className={`h-4 w-4 text-ed-text-tertiary transform transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 4l8 6-8 6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div id={`palette-${cat}`} className="mt-2 px-2">
                      {cat === 'Presets' ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {componentTemplates.map(template => (
                              <TemplatePaletteItem key={template.id} template={template} onAdd={onAddTemplate} />
                            ))}
                          </div>
                          {customPresets.length > 0 && componentTemplates.length > 0 && (
                            <div className="mx-3 my-2 border-t border-ed-border" />
                          )}
                          {customPresets.length > 0 && (
                            <div className="px-3 py-1">
                              <span className="text-[10px] font-medium text-ed-text-tertiary uppercase tracking-wider">Custom</span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {customPresets.map(preset => (
                              <TemplatePaletteItem key={preset.id} template={preset} onAdd={onAddTemplate} />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {cat === 'Widgets'
                            ? (widgetDefinitions || []).map(widget => (
                                <WidgetPaletteItem key={widget.id} widget={widget} onAdd={onAddWidget} />
                              ))
                            : (grouped[cat] || []).map(plugin => (
                                <PaletteItem key={plugin.type} componentPlugin={plugin} onAdd={onAddComponent} onTrackRecent={trackRecent} />
                              ))
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
};
