





import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ComponentPalette } from './components/ComponentPalette';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Preview } from './components/Preview';
import { useAppData } from './hooks/useAppData';
import { AppDefinition, ComponentType, AppComponent, Theme, GlobalTheme, WidgetDefinition, WidgetInput, WidgetOutput } from './types';
import { AIChatButton, AIChatBox } from './components/ai-chat';
import { componentRegistry } from './components/component-registry/registry';
import { StatePanel } from './components/StatePanel';
import { QueryPanel } from './components/QueryPanel';
import { IntegrationPanel } from './components/IntegrationPanel';
import { ExpressionEditorModal } from './components/ExpressionEditorModal';
import { storageService } from '@/storageService';
import { ThemeEditorPanel as ThemePanel } from './components/theme-editor';
import { TreeView } from './components/TreeView';
import { exportToReactProject } from './services/projectExporter';
import { ThemeToggle } from '@/theme';
import { useClipboard, cloneComponentTree } from './hooks/useClipboard';
import { useDevicePreview } from './hooks/useDevicePreview';
import { DevicePreviewSwitcher } from './components/DevicePreviewSwitcher';
import { getTemplateById, flattenTemplate, ComponentTemplate, componentTreeToTemplate } from './components/component-templates';
import { CanvasContextMenu } from './components/CanvasContextMenu';
import { SaveAsPresetModal } from './components/SaveAsPresetModal';
import { WidgetIOPanel } from './components/WidgetIOPanel';
import { defaultLightTheme } from '@/theme-presets';

const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 500;
const ACTIVITY_BAR_WIDTH = 44; // px — matches w-11 (2.75rem at 16px)
const RESPONSIVE_BREAKPOINT = 1024; // px

interface EditorProps {
  appId?: string;
  templateId?: string;
  widgetId?: string;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ appId, templateId, widgetId, onBack }) => {
  const [initialAppDef, setInitialAppDef] = useState<AppDefinition | null>(null);
  const [globalThemes, setGlobalThemes] = useState<GlobalTheme[]>([]);
  const [widgetDefinition, setWidgetDefinition] = useState<WidgetDefinition | null>(null);
  const isTemplateMode = !!templateId;
  const isWidgetMode = !!widgetId;

  useEffect(() => {
    const loadAppAndThemes = async () => {
      const themes = await storageService.getAllThemes();
      setGlobalThemes(themes);

      if (templateId) {
        // Load template's app definition
        const allTemplates = await storageService.getAllTemplates();
        const template = allTemplates.find(t => t.id === templateId);
        if (template) {
          setInitialAppDef(template.appDefinition);
        } else {
          console.error("Template not found!");
          onBack();
        }
      } else if (widgetId) {
        const widgetDef = await storageService.getWidgetDefinition(widgetId);
        if (widgetDef) {
          const virtualAppDef: AppDefinition = {
            id: widgetId,
            name: widgetDef.name,
            createdAt: widgetDef.createdAt,
            lastModifiedAt: widgetDef.lastModifiedAt,
            pages: [{ id: 'widget_page', name: 'Widget', isMain: true }],
            mainPageId: 'widget_page',
            components: widgetDef.components,
            dataStore: {},
            variables: [],
            theme: themes?.[0]?.theme || defaultLightTheme,
          };
          setInitialAppDef(virtualAppDef);
          setWidgetDefinition(widgetDef);
        } else {
          console.error("Widget not found!");
          onBack();
        }
      } else if (appId) {
        const app = await storageService.getApp(appId);
        if (app) {
          setInitialAppDef(app);
        } else {
          console.error("App not found!");
          onBack();
        }
      } else {
        console.error("No appId, templateId, or widgetId provided!");
        onBack();
      }
    };
    loadAppAndThemes();
  }, [appId, templateId, widgetId, onBack]);

  const handleSave = useCallback(
    async (appDef: AppDefinition) => {
      if (templateId) {
        // Save back to the template
        const allTemplates = await storageService.getAllTemplates();
        const existing = allTemplates.find(t => t.id === templateId);
        if (existing) {
          await storageService.saveTemplate({
            ...existing,
            appDefinition: appDef,
          });
        }
      } else if (widgetId && widgetDefinition) {
        const updatedWidget: WidgetDefinition = {
          ...widgetDefinition,
          components: appDef.components,
          lastModifiedAt: new Date().toISOString(),
        };
        await storageService.saveWidgetDefinition(updatedWidget);
        setWidgetDefinition(updatedWidget);
      } else {
        storageService.saveApp(appDef);
      }
    },
    [templateId, widgetId, widgetDefinition]
  );

  const handleUpdateWidgetIO = useCallback(async (inputs: WidgetInput[], outputs: WidgetOutput[]) => {
    if (!widgetDefinition) return;
    const updated: WidgetDefinition = { ...widgetDefinition, inputs, outputs, lastModifiedAt: new Date().toISOString() };
    await storageService.saveWidgetDefinition(updated);
    setWidgetDefinition(updated);
  }, [widgetDefinition]);

  const handleRenameWidget = useCallback(async (newName: string) => {
    if (!widgetDefinition) return;
    const updated: WidgetDefinition = { ...widgetDefinition, name: newName, lastModifiedAt: new Date().toISOString() };
    await storageService.saveWidgetDefinition(updated);
    setWidgetDefinition(updated);
  }, [widgetDefinition]);

  const handleApplyGlobalTheme = (theme: Theme) => {
    if (initialAppDef) {
      const newAppDef = { ...initialAppDef, theme: theme };
      setInitialAppDef(newAppDef);
    }
  };

  if (!initialAppDef) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-ed-bg-secondary text-ed-text gap-3">
        <svg className="animate-spin h-8 w-8 text-ed-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-ed-text-secondary text-sm">Loading Editor...</span>
      </div>
    );
  }

  return <EditorUI
    initialAppDefinition={initialAppDef}
    onSave={handleSave}
    onBack={onBack}
    globalThemes={globalThemes}
    onApplyGlobalTheme={handleApplyGlobalTheme}
    isTemplateMode={isTemplateMode}
    isWidgetMode={isWidgetMode}
    widgetDefinition={widgetDefinition}
    onUpdateWidgetIO={handleUpdateWidgetIO}
    onRenameWidget={handleRenameWidget}
  />;
};


interface EditorUIProps {
  initialAppDefinition: AppDefinition;
  onSave: (appDef: AppDefinition) => void;
  onBack: () => void;
  globalThemes: GlobalTheme[];
  onApplyGlobalTheme: (theme: Theme) => void;
  isTemplateMode?: boolean;
  isWidgetMode?: boolean;
  widgetDefinition?: WidgetDefinition | null;
  onUpdateWidgetIO?: (inputs: WidgetInput[], outputs: WidgetOutput[]) => void;
  onRenameWidget?: (newName: string) => void;
}

const EditorUI: React.FC<EditorUIProps> = ({ initialAppDefinition, onSave, onBack, globalThemes, onApplyGlobalTheme, isTemplateMode, isWidgetMode, widgetDefinition, onUpdateWidgetIO, onRenameWidget }) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Load widget definitions early so they can be passed to useAppData for scope building
  const [widgetDefinitions, setWidgetDefinitions] = useState<WidgetDefinition[]>([]);

  useEffect(() => {
    const result = storageService.getAllWidgetDefinitions();
    if (result && typeof result.then === 'function') {
      result.then(defs => {
        if (defs) setWidgetDefinitions(defs);
      }).catch(() => {});
    }
  }, []);

  const [customPresets, setCustomPresets] = useState<ComponentTemplate[]>([]);

  useEffect(() => {
    storageService.getAllCustomPresets().then(setCustomPresets);
  }, []);

  const {
    appDefinition,
    setAppDefinition,
    components,
    currentPageId,
    currentPageComponents,
    selectedComponentIds,
    setSelectedComponentIds,
    addComponent,
    updateComponent,
    updateComponents,
    selectComponent,
    deselectAllComponents,
    deleteComponent,
    deleteSelectedComponents,
    updateDataStore,
    actions,
    evaluationScope,
    variables,
    addVariable,
    updateVariable,
    deleteVariable,
    variableState,
    dataStore,
    updateTheme,
    applyTheme,
    integrationSettings,
    updateIntegrationSettings,
    reparentComponent,
    selectPage,
    alignAndDistribute,
    renameComponent,
    reorderComponent,
    moveComponentToParent,
    undo,
    redo,
    canUndo,
    canRedo,
    pasteComponents,
    queries,
    addQuery,
    updateQuery,
    deleteQuery,
    runQuery,
    addPage,
    updatePage,
    deletePage,
    reorderPage,
  } = useAppData(initialAppDefinition, onSave, widgetDefinitions) as any;

  const clipboard = useClipboard();
  const devicePreview = useDevicePreview();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ componentId: string; x: number; y: number } | null>(null);
  const [presetModalComponentId, setPresetModalComponentId] = useState<string | null>(null);
  const [isRenamingWidget, setIsRenamingWidget] = useState(false);
  const [widgetNameValue, setWidgetNameValue] = useState('');
  const widgetNameInputRef = useRef<HTMLInputElement>(null);

  const startWidgetRename = useCallback(() => {
    if (!isWidgetMode || !widgetDefinition) return;
    setWidgetNameValue(widgetDefinition.name);
    setIsRenamingWidget(true);
  }, [isWidgetMode, widgetDefinition]);

  const commitWidgetRename = useCallback(() => {
    const trimmed = widgetNameValue.trim();
    if (trimmed && widgetDefinition && trimmed !== widgetDefinition.name) {
      onRenameWidget?.(trimmed);
    }
    setIsRenamingWidget(false);
  }, [widgetNameValue, widgetDefinition, onRenameWidget]);

  useEffect(() => {
    if (isRenamingWidget && widgetNameInputRef.current) {
      widgetNameInputRef.current.focus();
      widgetNameInputRef.current.select();
    }
  }, [isRenamingWidget]);

  const [expressionEditorState, setExpressionEditorState] = useState<{
    isOpen: boolean;
    value: string;
    onSave: (newValue: string) => void;
    propertyContext?: {
      propertyId?: string;
      propertyLabel?: string;
      propertyType?: string;
      componentType?: string;
      tab?: string;
      group?: string;
    };
  }>({
    isOpen: false,
    value: '',
    onSave: () => { },
    propertyContext: undefined,
  });

  const openExpressionEditor = useCallback((
    initialValue: string,
    onSaveCallback: (newValue: string) => void,
    propertyContext?: {
      propertyId?: string;
      propertyLabel?: string;
      propertyType?: string;
      componentType?: string;
      tab?: string;
      group?: string;
    }
  ) => {
    setExpressionEditorState({
      isOpen: true,
      value: initialValue,
      onSave: onSaveCallback,
      propertyContext,
    });
  }, []);

  const handleSaveExpression = (newValue: string) => {
    expressionEditorState.onSave(newValue);
    setExpressionEditorState({ isOpen: false, value: '', onSave: () => { }, propertyContext: undefined });
  };

  const handleCloseExpressionEditor = () => {
    setExpressionEditorState({ isOpen: false, value: '', onSave: () => { }, propertyContext: undefined });
  };

  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(288);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [activeLeftPanel, setActiveLeftPanel] = useState<'explorer' | 'components' | 'state' | 'queries' | 'theme' | 'integration' | 'widget-io'>('explorer');

  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  // Keyboard shortcut for deleting components
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process delete/backspace if expression editor is open
      if (document.body.getAttribute('data-expression-editor-open') === 'true') {
        return;
      }

      if (mode === 'edit' && selectedComponentIds.length > 0) {
        const activeElement = document.activeElement;

        // Check if focus is in the properties panel or tree view - if so, don't delete
        const isInPropertiesPanel = (activeElement as HTMLElement)?.closest?.('[data-testid="properties-panel"]');
        const isInTreeView = (activeElement as HTMLElement)?.closest?.('[aria-label="Explorer"]');

        // Don't delete if focus is in properties panel or tree view
        if (isInPropertiesPanel || isInTreeView) {
          return;
        }

        // Check if the active element is an input/textarea that might be actively being edited
        const isTextInput = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable
        );

        if (isTextInput) {
          // If user is actively editing text in an input/textarea, never delete the component
          // This includes when pressing backspace to delete characters
          if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            // Check if the input is focused (user is actively editing)
            if (document.activeElement === activeElement) {
              // User is editing text - don't delete component, let the input handle the key
              return;
            }
          }
          // For contentEditable elements, check if it's inside a selected component
          if ((activeElement as HTMLElement).isContentEditable) {
            let isInsideSelectedComponent = false;
            let componentCheck: HTMLElement | null = activeElement as HTMLElement;
            while (componentCheck && componentCheck !== document.body) {
              if (componentCheck.classList.contains('outline')) {
                isInsideSelectedComponent = true;
                break;
              }
              componentCheck = componentCheck.parentElement;
            }
            if (!isInsideSelectedComponent) {
              // ContentEditable in canvas but not in selected component - don't delete
              return;
            }
          }
        }

        // For all other cases (including when focus is on body or component wrapper):
        // If components are selected and we're not in properties panel, allow deletion
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          deleteSelectedComponents();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase to catch events earlier
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [selectedComponentIds, deleteSelectedComponents, mode]);

  // Keyboard shortcuts for undo/redo, copy/paste/duplicate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process if expression editor is open
      if (document.body.getAttribute('data-expression-editor-open') === 'true') return;
      if (mode !== 'edit') return;

      const activeElement = document.activeElement;
      const isTextInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable
      );

      // Check if focus is in properties panel
      const isInPropertiesPanel = activeElement && (activeElement as HTMLElement).closest?.('[data-testid="properties-panel"]');

      const isMod = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z / Cmd+Z (works even in text inputs if not in properties panel)
      if (isMod && e.key === 'z' && !e.shiftKey) {
        if (!isTextInput || !isInPropertiesPanel) {
          e.preventDefault();
          undo();
          return;
        }
      }

      // Redo: Ctrl+Y / Cmd+Y / Ctrl+Shift+Z
      if (isMod && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey))) {
        if (!isTextInput || !isInPropertiesPanel) {
          e.preventDefault();
          redo();
          return;
        }
      }

      // Copy/Paste/Cut/Duplicate - skip if in text inputs or properties panel
      // But allow through if the focused input is inside the canvas (e.g., readonly Input/Textarea components)
      const isInCanvas = activeElement && (activeElement as HTMLElement).closest?.('[data-testid="canvas"]');
      if (isInPropertiesPanel || (isTextInput && !isInCanvas)) return;

      // Copy: Ctrl+C
      if (isMod && e.key === 'c' && !e.shiftKey) {
        if (selectedComponentIds.length > 0) {
          e.preventDefault();
          clipboard.copy(selectedComponentIds, components, currentPageId);
        }
        return;
      }

      // Paste: Ctrl+V
      if (isMod && e.key === 'v' && !e.shiftKey) {
        if (clipboard.hasClipboard) {
          e.preventDefault();
          const pasted = clipboard.paste(components, currentPageId);
          if (pasted && pasted.length > 0) {
            pasteComponents(pasted);
          }
        }
        return;
      }

      // Cut: Ctrl+X
      if (isMod && e.key === 'x' && !e.shiftKey) {
        if (selectedComponentIds.length > 0) {
          e.preventDefault();
          clipboard.copy(selectedComponentIds, components, currentPageId);
          deleteSelectedComponents();
        }
        return;
      }

      // Duplicate: Ctrl+D
      if (isMod && e.key === 'd') {
        if (selectedComponentIds.length > 0) {
          e.preventDefault();
          const cloned = cloneComponentTree(selectedComponentIds, components, currentPageId, 20);
          if (cloned.length > 0) {
            pasteComponents(cloned);
          }
        }
        return;
      }

      // Move component up: Alt+ArrowUp
      if (e.altKey && e.key === 'ArrowUp' && !isMod && !e.shiftKey) {
        if (selectedComponentIds.length === 1) {
          e.preventDefault();
          const comp = components.find(c => c.id === selectedComponentIds[0]);
          if (comp) {
            const parentId = comp.parentId || null;
            const currentOrder = (comp.props as any).order ?? 0;
            if (currentOrder > 0) {
              reorderComponent(comp.id, currentOrder - 1, parentId, comp.pageId);
            }
          }
        }
        return;
      }

      // Move component down: Alt+ArrowDown
      if (e.altKey && e.key === 'ArrowDown' && !isMod && !e.shiftKey) {
        if (selectedComponentIds.length === 1) {
          e.preventDefault();
          const comp = components.find(c => c.id === selectedComponentIds[0]);
          if (comp) {
            const parentId = comp.parentId || null;
            const currentOrder = (comp.props as any).order ?? 0;
            const siblings = components.filter(c =>
              (c.parentId || null) === parentId && c.pageId === comp.pageId
            );
            if (currentOrder < siblings.length - 1) {
              reorderComponent(comp.id, currentOrder + 1, parentId, comp.pageId);
            }
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [mode, selectedComponentIds, components, currentPageId, undo, redo, clipboard, pasteComponents, deleteSelectedComponents, reorderComponent]);

  // Responsive Panel Collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < RESPONSIVE_BREAKPOINT) {
        setIsLeftPanelCollapsed(true);
        setIsRightPanelCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check on load
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingLeft.current) {
      setLeftPanelWidth(prev => Math.max(MIN_PANEL_WIDTH, Math.min(e.clientX - ACTIVITY_BAR_WIDTH, MAX_PANEL_WIDTH)));
    }
    if (isResizingRight.current) {
      setRightPanelWidth(prev => Math.max(MIN_PANEL_WIDTH, Math.min(window.innerWidth - e.clientX, MAX_PANEL_WIDTH)));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingLeft.current = false;
    isResizingRight.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  const handleMouseDownLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingLeft.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDownRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRight.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, handleMouseUp]);

  const handleAIAppGenerated = useCallback((newApp: AppDefinition) => {
    setAppDefinition(newApp);
  }, [setAppDefinition]);

  const onDrop = useCallback((item: { type: ComponentType }, x: number, y: number, parentId: string | null) => {
    // x carries the insertion order, y is unused in flex layout
    addComponent(item.type, { x, y: 0 }, parentId, currentPageId);
  }, [addComponent, currentPageId]);

  const handleDropTemplate = useCallback((templateId: string, parentId: string | null) => {
    const template = getTemplateById(templateId, customPresets);
    if (!template) return;
    const flatComponents = flattenTemplate(template.components, currentPageId, parentId);
    pasteComponents(flatComponents);
  }, [currentPageId, pasteComponents, customPresets]);

  const handleDropWidget = useCallback((widgetId: string, parentId: string | null) => {
    const widget = widgetDefinitions.find(w => w.id === widgetId);
    const newComponent: AppComponent = {
      id: `CUSTOM_WIDGET_${Date.now()}`,
      type: ComponentType.CUSTOM_WIDGET,
      name: widget?.name || 'Custom Widget',
      props: {
        widgetDefinitionId: widgetId,
        inputBindings: {},
        width: '100%',
        height: 'auto',
      } as any,
      parentId: parentId,
      pageId: currentPageId,
    };
    pasteComponents([newComponent]);
  }, [widgetDefinitions, currentPageId, pasteComponents]);

  const handleSelectPage = useCallback((pageId: string) => {
    selectPage(pageId);
    setSelectedPageId(pageId);
  }, [selectPage]);

  const handleAddPage = useCallback(() => {
    const newPage = {
      id: `page_${Date.now()}`,
      name: 'New Page',
    };
    addPage(newPage);
    selectPage(newPage.id);
    setSelectedPageId(newPage.id);
  }, [addPage, selectPage]);

  const handleDeletePage = useCallback((pageId: string) => {
    deletePage(pageId);
    setSelectedPageId(prev => prev === pageId ? null : prev);
  }, [deletePage]);

  const handleRenamePage = useCallback((pageId: string, name: string) => {
    updatePage(pageId, { name });
  }, [updatePage]);

  const handleReorderPage = useCallback((pageId: string, direction: 'up' | 'down') => {
    reorderPage(pageId, direction);
  }, [reorderPage]);

  useEffect(() => {
    if (selectedComponentIds.length > 0) {
      setSelectedPageId(null);
    }
  }, [selectedComponentIds]);

  const selectedPage = selectedPageId ? appDefinition.pages.find(p => p.id === selectedPageId) || null : null;
  const isSelectedPageMain = selectedPageId === appDefinition.mainPageId;

  const handleSelectComponentFromTree = useCallback((componentId: string, pageId: string) => {
    if (pageId !== currentPageId) {
      selectPage(pageId);
    }
    selectComponent(componentId);
  }, [currentPageId, selectPage, selectComponent]);

  const handleSelectComponentOnCanvas = useCallback((componentId: string) => {
    selectComponent(componentId);
    setActiveLeftPanel('explorer');
    setIsLeftPanelCollapsed(false);
  }, [selectComponent]);

  const handleExportAsReactProject = async () => {
    setIsExporting(true);
    try {
      await exportToReactProject(appDefinition);
    } catch (error) {
      console.error("Failed to export project:", error);
      alert("An error occurred while trying to export the project. See the console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAsPreset = useCallback(async (name: string, description: string) => {
    if (!presetModalComponentId) return;
    const template = componentTreeToTemplate(presetModalComponentId, components);
    if (template.length === 0) return;

    const preset: ComponentTemplate = {
      id: `preset_${Date.now()}`,
      name,
      description,
      icon: 'LayoutTemplate',
      components: template,
    };

    await storageService.saveCustomPreset(preset);
    const updated = await storageService.getAllCustomPresets();
    setCustomPresets(updated);
    setPresetModalComponentId(null);
  }, [presetModalComponentId, components]);


  const renderLeftPanel = () => {
    switch (activeLeftPanel) {
      case 'explorer':
        return <TreeView
          isCollapsed={false}
          onToggleCollapse={() => setIsLeftPanelCollapsed(true)}
          appDefinition={appDefinition}
          currentPageId={currentPageId}
          selectedComponentIds={selectedComponentIds}
          onSelectPage={handleSelectPage}
          onSelectComponent={handleSelectComponentFromTree}
          onDeleteComponent={deleteComponent}
          onRenameComponent={renameComponent}
          onReorderComponent={reorderComponent}
          onMoveComponentToParent={moveComponentToParent}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          onReorderPage={handleReorderPage}
          mainPageId={appDefinition.mainPageId}
          pageCount={appDefinition.pages.length}
        />;
      case 'components':
        return <ComponentPalette
          width={leftPanelWidth}
          isCollapsed={false}
          onToggleCollapse={() => setIsLeftPanelCollapsed(true)}
          onAddComponent={(type) => {
            const rootChildren = currentPageComponents.filter(c => !c.parentId);
            addComponent(type as ComponentType, { x: rootChildren.length, y: 0 }, null, currentPageId);
          }}
          onAddTemplate={(templateId) => handleDropTemplate(templateId, null)}
          widgetDefinitions={widgetDefinitions}
          onAddWidget={(widgetId) => handleDropWidget(widgetId, null)}
        />;

      case 'state':
        return <StatePanel
          isCollapsed={false}
          onToggleCollapse={() => setIsLeftPanelCollapsed(true)}
          variables={variables}
          onAddVariable={addVariable}
          onUpdateVariable={updateVariable}
          onDeleteVariable={deleteVariable}
          variableState={variableState}
        />;
      case 'theme':
        return <ThemePanel
          isCollapsed={false}
          onToggleCollapse={() => setIsLeftPanelCollapsed(true)}
          theme={appDefinition.theme}
          onUpdateTheme={updateTheme}
          globalThemes={globalThemes}
          onApplyGlobalTheme={applyTheme}
        />;
      case 'queries':
        return <QueryPanel
          isCollapsed={false}
          onToggleCollapse={() => setIsLeftPanelCollapsed(true)}
          queries={queries || []}
          onAddQuery={addQuery}
          onUpdateQuery={updateQuery}
          onDeleteQuery={deleteQuery}
          onRunQuery={runQuery}
        />;
      case 'integration':
        return <IntegrationPanel
          integrationSettings={integrationSettings}
          onUpdate={updateIntegrationSettings}
        />;
      case 'widget-io':
        return widgetDefinition ? (
          <WidgetIOPanel
            inputs={widgetDefinition.inputs}
            outputs={widgetDefinition.outputs}
            onUpdateInputs={(inputs) => onUpdateWidgetIO?.(inputs, widgetDefinition.outputs)}
            onUpdateOutputs={(outputs) => onUpdateWidgetIO?.(widgetDefinition.inputs, outputs)}
          />
        ) : null;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-ed-bg-secondary text-ed-text">
      <header role="banner" className="flex items-center justify-between px-4 h-14 bg-ed-bg border-b border-ed-border shadow-ed-header z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-ed-text-secondary hover:text-ed-text">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {isWidgetMode ? 'Widgets' : isTemplateMode ? 'Templates' : 'Apps'}
          </button>
          <div className="w-px h-6 bg-ed-border"></div>
          {isWidgetMode && isRenamingWidget ? (
            <input
              ref={widgetNameInputRef}
              value={widgetNameValue}
              onChange={(e) => setWidgetNameValue(e.target.value)}
              onBlur={commitWidgetRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitWidgetRename();
                if (e.key === 'Escape') setIsRenamingWidget(false);
              }}
              className="text-lg font-semibold text-ed-text bg-ed-bg-secondary border border-ed-accent rounded px-2 py-0.5 outline-none"
            />
          ) : (
            <h1
              className={`text-lg font-semibold text-ed-text ${isWidgetMode ? 'cursor-pointer hover:text-ed-accent transition-colors' : ''}`}
              onDoubleClick={isWidgetMode ? startWidgetRename : undefined}
              title={isWidgetMode ? 'Double-click to rename' : undefined}
            >
              {isWidgetMode && widgetDefinition ? widgetDefinition.name : appDefinition.name}
            </h1>
          )}
          {isTemplateMode && (
            <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-md">
              Template
            </span>
          )}
          {isWidgetMode && (
            <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded-md">
              Widget
            </span>
          )}
        </div>
        {mode === 'edit' && (
          <div className="flex items-center gap-1" data-testid="editor-toolbar">
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              className="w-8 h-8 flex items-center justify-center rounded-md text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo}
              className="w-8 h-8 flex items-center justify-center rounded-md text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" /></svg>
            </button>
            <div className="w-px h-5 bg-ed-border mx-1"></div>
            <button
              onClick={() => { if (selectedComponentIds.length > 0) clipboard.copy(selectedComponentIds, components, currentPageId); }}
              disabled={selectedComponentIds.length === 0}
              className="w-8 h-8 flex items-center justify-center rounded-md text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Copy (Ctrl+C)"
              aria-label="Copy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
            </button>
            <button
              onClick={() => {
                if (clipboard.hasClipboard) {
                  const pasted = clipboard.paste(components, currentPageId);
                  if (pasted && pasted.length > 0) pasteComponents(pasted);
                }
              }}
              disabled={!clipboard.hasClipboard}
              className="w-8 h-8 flex items-center justify-center rounded-md text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Paste (Ctrl+V)"
              aria-label="Paste"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </button>
            <button
              onClick={() => {
                if (selectedComponentIds.length > 0) {
                  const cloned = cloneComponentTree(selectedComponentIds, components, currentPageId, 20);
                  if (cloned.length > 0) pasteComponents(cloned);
                }
              }}
              disabled={selectedComponentIds.length === 0}
              className="w-8 h-8 flex items-center justify-center rounded-md text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Duplicate (Ctrl+D)"
              aria-label="Duplicate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <div className="w-px h-5 bg-ed-border mx-1"></div>
            <button
              onClick={() => { if (selectedComponentIds.length > 0) deleteSelectedComponents(); }}
              disabled={selectedComponentIds.length === 0}
              className="w-8 h-8 flex items-center justify-center rounded-md text-ed-text-secondary hover:text-ed-danger hover:bg-ed-danger-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Delete (Del)"
              aria-label="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
        <DevicePreviewSwitcher
          activeDevice={devicePreview.activeDevice}
          onSetDevice={devicePreview.setDevice}
        />
        <div className="flex items-center gap-3">
          {mode === 'edit' && (
            <button
              onClick={handleExportAsReactProject}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ed-text-secondary bg-ed-bg-tertiary rounded-md hover:bg-ed-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ed-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{isExporting ? 'Exporting...' : 'Export as React Project'}</span>
            </button>
          )}
          <div className="w-px h-6 bg-ed-border"></div>
          <ThemeToggle />
          <button
            onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            aria-label={`Switch to ${mode === 'edit' ? 'preview' : 'editor'} mode`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover shadow-ed-sm hover:shadow-ed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ed-accent transition-all"
          >
            {mode === 'edit' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Preview</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Editor</span>
              </>
            )}
          </button>
        </div>
      </header>

      {mode === 'edit' ? (
        <div className="flex-grow flex overflow-hidden" role="main">
          {/* Left panel: activity bar + content */}
          <div className="flex shrink-0 relative z-[1]">
            {/* Activity Bar */}
            <div className="w-11 bg-ed-bg border-r border-ed-border flex flex-col items-center pt-2 gap-1 shrink-0">
              {([
                { key: 'explorer' as const, label: 'Explorer', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                )},
                { key: 'components' as const, label: 'Components', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                )},
                ...(!isWidgetMode ? [{ key: 'state' as const, label: 'State', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 12c0 2.21 3.582 4 8 4s8-1.79 8-4" />
                  </svg>
                )}] : []),
                ...(isWidgetMode ? [{ key: 'widget-io' as const, label: 'Widget I/O', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12H2m20 0h-3" />
                  </svg>
                )}] : []),
                { key: 'queries' as const, label: 'Queries', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )},
                { key: 'theme' as const, label: 'Theme', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                )},
                { key: 'integration' as const, label: 'Integration', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )},
              ]).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (activeLeftPanel === key && !isLeftPanelCollapsed) {
                      setIsLeftPanelCollapsed(true);
                    } else {
                      setActiveLeftPanel(key);
                      setIsLeftPanelCollapsed(false);
                    }
                  }}
                  className={`relative w-9 h-9 flex items-center justify-center rounded-md transition-colors duration-150 ${
                    activeLeftPanel === key && !isLeftPanelCollapsed
                      ? 'text-ed-accent-text bg-ed-accent/10'
                      : 'text-ed-text-tertiary hover:text-ed-text-secondary hover:bg-ed-bg-hover'
                  }`}
                  aria-label={label}
                  title={label}
                >
                  {icon}
                  {activeLeftPanel === key && !isLeftPanelCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-ed-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>
            {/* Panel Content */}
            {!isLeftPanelCollapsed && (
              <div className="bg-ed-bg border-r border-ed-border flex flex-col overflow-hidden h-full" style={{ width: `${leftPanelWidth}px` }}>
                {renderLeftPanel()}
              </div>
            )}
          </div>

          <div
            onMouseDown={handleMouseDownLeft}
            className={`w-1.5 cursor-col-resize bg-ed-border hover:bg-ed-accent transition-colors group/resize flex items-center justify-center ${isLeftPanelCollapsed ? 'hidden' : ''}`}
            aria-label="Resize component panel"
            role="separator"
          >
            <div className="flex flex-col gap-0.5 opacity-0 group-hover/resize:opacity-100 transition-opacity">
              <span className="block w-0.5 h-0.5 rounded-full bg-ed-text-inverse"></span>
              <span className="block w-0.5 h-0.5 rounded-full bg-ed-text-inverse"></span>
              <span className="block w-0.5 h-0.5 rounded-full bg-ed-text-inverse"></span>
            </div>
          </div>
          <main className="flex-grow flex flex-col bg-ed-bg-canvas overflow-auto relative">
            <div
              className="flex-grow flex justify-center"
              style={{
                ...(devicePreview.previewWidth ? {
                  maxWidth: `${devicePreview.previewWidth}px`,
                  width: '100%',
                  margin: '0 auto',
                  transition: 'max-width 0.3s ease',
                } : {}),
              }}
            >
              <Canvas
                components={currentPageComponents}
                allComponents={components}
                onDrop={onDrop}
                onDropTemplate={handleDropTemplate}
                onDropWidget={handleDropWidget}
                onSelectComponent={handleSelectComponentOnCanvas}
                onDeselectCanvas={deselectAllComponents}
                selectedComponentIds={selectedComponentIds}
                onSetSelectedComponentIds={setSelectedComponentIds}
                updateComponent={updateComponent}
                updateComponents={updateComponents}
                onDeleteComponent={deleteComponent}
                evaluationScope={evaluationScope}
                dataStore={dataStore}
                onReparentComponent={reparentComponent}
                onReorderComponent={reorderComponent}
                currentPageId={currentPageId}
                activeBreakpoint={devicePreview.activeBreakpoint}
                currentPage={appDefinition.pages.find(p => p.id === currentPageId)}
                widgetDefinitions={widgetDefinitions}
                onContextMenuSavePreset={(componentId, x, y) => setContextMenu({ componentId, x, y })}
              />
            </div>
          </main>
          <div
            onMouseDown={handleMouseDownRight}
            className={`w-1.5 cursor-col-resize bg-ed-border hover:bg-ed-accent transition-colors group/resize flex items-center justify-center ${isRightPanelCollapsed ? 'hidden' : ''}`}
            aria-label="Resize properties panel"
            role="separator"
          >
            <div className="flex flex-col gap-0.5 opacity-0 group-hover/resize:opacity-100 transition-opacity">
              <span className="block w-0.5 h-0.5 rounded-full bg-ed-text-inverse"></span>
              <span className="block w-0.5 h-0.5 rounded-full bg-ed-text-inverse"></span>
              <span className="block w-0.5 h-0.5 rounded-full bg-ed-text-inverse"></span>
            </div>
          </div>
          <PropertiesPanel
            components={components}
            selectedComponentIds={selectedComponentIds}
            onUpdate={updateComponent}
            onRenameComponent={renameComponent}
            width={rightPanelWidth}
            isCollapsed={isRightPanelCollapsed}
            onToggleCollapse={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            variables={variables}
            evaluationScope={evaluationScope}
            onOpenExpressionEditor={openExpressionEditor}
            activeBreakpoint={devicePreview.activeBreakpoint}
            selectedPage={selectedPage}
            isMainPage={isSelectedPageMain}
            onUpdatePage={updatePage}
            widgetDefinitions={widgetDefinitions}
            isWidgetMode={isWidgetMode}
          />
        </div>
      ) : (
        <Preview
          appDefinition={appDefinition}
          onUpdateDataStore={updateDataStore}
          actions={actions}
          variableState={variableState}
          previewWidth={devicePreview.previewWidth}
          activeBreakpoint={devicePreview.activeBreakpoint}
          widgetDefinitions={widgetDefinitions}
        />
      )}
      {mode === 'edit' && (
        <>
          <AIChatButton
            onClick={() => setIsAIChatOpen(prev => !prev)}
            isOpen={isAIChatOpen}
          />
          <AIChatBox
            isOpen={isAIChatOpen}
            onClose={() => setIsAIChatOpen(false)}
            mode="app-edit"
            onAppGenerated={handleAIAppGenerated}
            currentApp={appDefinition}
            currentPageId={currentPageId}
          />
        </>
      )}
      <ExpressionEditorModal
        isOpen={expressionEditorState.isOpen}
        initialValue={expressionEditorState.value}
        onClose={handleCloseExpressionEditor}
        onSave={handleSaveExpression}
        propertyContext={expressionEditorState.propertyContext}
        variables={appDefinition.variables}
        components={components}
        pages={appDefinition.pages}
      />
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onSaveAsPreset={() => {
            setPresetModalComponentId(contextMenu.componentId);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      {presetModalComponentId && (
        <SaveAsPresetModal
          defaultName={components.find(c => c.id === presetModalComponentId)?.name || 'My Preset'}
          onSave={handleSaveAsPreset}
          onClose={() => setPresetModalComponentId(null)}
        />
      )}
    </div>
  );
};