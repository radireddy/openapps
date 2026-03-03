


import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AppDefinition, ActionHandlers, BreakpointKey, WidgetDefinition } from '../types';
import { RenderedComponent } from './RenderedComponent';
import { useUiPathSDK } from '../hooks/useUiPathSDK';
import { ENABLE_UIPATH_SDK } from '../constants';
import { generateMediaQueryCSS, generateGlobalBaseStyles } from '@/responsive';
import { buildEvaluationScope } from '../hooks/state/evaluationScope';
import { useQueryExecution } from '../hooks/useQueryExecution';
import { InheritedStylesProvider, buildPageInheritedStyles } from './InheritedStylesContext';

interface PreviewProps {
  appDefinition: AppDefinition;
  onUpdateDataStore: (key: string, value: any) => void;
  actions: ActionHandlers;
  variableState: Record<string, any>;
  previewWidth?: number | null;
  activeBreakpoint?: BreakpointKey;
  widgetDefinitions?: WidgetDefinition[];
}

export const Preview: React.FC<PreviewProps> = ({ appDefinition, onUpdateDataStore, actions, variableState, previewWidth, activeBreakpoint, widgetDefinitions }) => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  // Initialize UiPath SDK using integration settings (only if enabled)
  const { uipath, error: sdkError, isInitializing } = useUiPathSDK(
    ENABLE_UIPATH_SDK ? appDefinition.integration : undefined
  );

  // Log SDK initialization errors only when integration is actually configured
  useEffect(() => {
    if (sdkError) {
      const integration = appDefinition.integration;
      const hasConfig = integration && (integration.accountName || integration.tenantName || integration.clientId);
      if (hasConfig) {
        console.warn('UiPath SDK initialization error:', sdkError);
      }
    }
  }, [sdkError, appDefinition.integration]);

  // Validate appDefinition structure
  if (!appDefinition) {
    console.error('[Preview] appDefinition is missing');
    return <div className="flex-grow flex items-center justify-center">Error: Invalid app definition</div>;
  }

  const { components = [], dataStore = { selectedRecord: null }, mainPageId } = appDefinition;

  // Validate mainPageId exists
  if (!mainPageId) {
    console.error('[Preview] mainPageId is missing');
    return <div className="flex-grow flex items-center justify-center">Error: Main page ID is missing</div>;
  }

  const [previewPageId, setPreviewPageId] = useState<string>(mainPageId);

  // Reset previewPageId when mainPageId changes (e.g., switching apps or mode toggle)
  useEffect(() => {
    setPreviewPageId(mainPageId);
  }, [mainPageId]);

  const handleNavigateTo = useCallback((pageId: string) => {
    const pageExists = appDefinition.pages.some(p => p.id === pageId);
    if (pageExists) {
      setPreviewPageId(pageId);
    } else {
      console.warn(`[Preview] navigateTo: page "${pageId}" not found`);
    }
  }, [appDefinition.pages]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Apply page metadata (title, meta tags, favicon)
  const currentPage = appDefinition.pages.find(p => p.id === previewPageId);
  useEffect(() => {
    if (!currentPage?.metadata) return;
    const meta = currentPage.metadata;
    const originalTitle = document.title;

    if (meta.title) {
      document.title = meta.title;
    }

    // Meta description
    let descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    const hadDescMeta = !!descMeta;
    if (meta.description) {
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.name = 'description';
        document.head.appendChild(descMeta);
      }
      descMeta.content = meta.description;
    }

    // OG image
    let ogMeta = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    const hadOgMeta = !!ogMeta;
    if (meta.ogImage) {
      if (!ogMeta) {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', 'og:image');
        document.head.appendChild(ogMeta);
      }
      ogMeta.content = meta.ogImage;
    }

    // Favicon
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const originalFavicon = favicon?.href;
    if (meta.favicon) {
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = meta.favicon;
    }

    return () => {
      document.title = originalTitle;
      if (!hadDescMeta && descMeta) descMeta.remove();
      if (!hadOgMeta && ogMeta) ogMeta.remove();
      if (favicon && originalFavicon) favicon.href = originalFavicon;
    };
  }, [currentPage?.metadata, previewPageId]);

  const activePageComponents = components.filter(c => c.pageId === previewPageId);
  const rootComponents = activePageComponents
    .filter(c => !c.parentId)
    .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));
  const currentPageName = appDefinition.pages.find(p => p.id === previewPageId)?.name;
  const isOnMainPage = previewPageId === mainPageId;

  // Create theme with lowercase aliases for consistency
  const themeWithLowercaseAliases = useMemo(() => {
    const theme = appDefinition.theme;
    if (!theme || !theme.colors) {
      // Fallback to default theme if missing
      return {
        colors: {
          primary: '#4F46E5',
          onPrimary: '#FFFFFF',
          secondary: '#06B6D4',
          onSecondary: '#FFFFFF',
          background: '#FFFFFF',
          surface: '#F5F5F5',
          text: '#1A1A1A',
          border: '#D1D1D1',
          onprimary: '#FFFFFF',
          onsecondary: '#FFFFFF',
        },
        font: { family: 'Segoe UI, sans-serif' },
        border: { width: '1px', style: 'solid' },
        radius: { default: '4px' },
        spacing: { sm: '4px', md: '8px', lg: '16px' },
      };
    }
    return {
      ...theme,
      colors: {
        ...theme.colors,
        // Add lowercase aliases for camelCase properties
        onprimary: theme.colors.onPrimary || '#FFFFFF',
        onsecondary: theme.colors.onSecondary || '#FFFFFF',
      },
    };
  }, [appDefinition.theme]);

  // Build evaluation scope using the unified scope builder — eliminates duplication
  // with editor's evaluationScope.ts while adding preview-specific extensions
  const evaluationScope = useMemo(() => {
    const extras: Record<string, any> = {};
    if (uipath) {
      extras.uipath = uipath;
    }

    return buildEvaluationScope(
      appDefinition,
      dataStore,
      components,
      variableState,
      {
        themeOverride: themeWithLowercaseAliases,
        extras,
        mode: 'preview',
      }
    );
  }, [themeWithLowercaseAliases, dataStore, components, variableState, uipath, appDefinition]);

  // Execute queries in preview mode (onMount, dependency-change, refresh intervals)
  const { runQuery: runPreviewQuery } = useQueryExecution(
    appDefinition.queries,
    evaluationScope,
    true // enabled in preview mode
  );

  const previewActions = useMemo(() => ({
    ...actions,
    navigateTo: handleNavigateTo,
    submitForm: (onSuccessCode?: string, scope?: Record<string, any>, _pageId?: string, triggerComponentId?: string) =>
      actions.submitForm(onSuccessCode, scope, previewPageId, triggerComponentId),
    runQuery: runPreviewQuery,
  }), [actions, handleNavigateTo, previewPageId, runPreviewQuery]);

  // Generate responsive CSS media queries for preview
  const responsiveCSS = useMemo(() => {
    const globalStyles = generateGlobalBaseStyles();
    const mediaQueries = generateMediaQueryCSS(components);
    return mediaQueries ? `${globalStyles}\n${mediaQueries}` : globalStyles;
  }, [components]);

  return (
    <div
      ref={containerRef}
      className="flex-grow flex flex-col items-center bg-gray-200 p-4 sm:p-8 overflow-hidden"
      role="region"
      aria-label="Preview"
    >
      <style dangerouslySetInnerHTML={{ __html: `${responsiveCSS}\n.theme-focus:focus { outline: 2px solid var(--theme-primary); outline-offset: 1px; }\n.theme-focus:focus:not(:focus-visible) { outline: none; }` }} />
      <div
        className="shadow-2xl rounded-lg bg-white w-full flex-1 min-h-0"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: previewWidth ? `${previewWidth}px` : '1280px',
          margin: '0 auto',
          transition: 'max-width 0.3s ease',
          backgroundColor: evaluationScope.theme?.colors?.background || '#ffffff',
          gap: '12px',
          padding: '16px',
          overflowY: 'auto',
          userSelect: 'text',
          '--theme-primary': evaluationScope.theme?.colors?.primary || '#4F46E5',
        } as React.CSSProperties}
      >
        {!isOnMainPage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: evaluationScope.theme?.colors?.surface || '#f5f5f5',
              borderRadius: '6px',
              fontSize: '13px',
              color: evaluationScope.theme?.colors?.text || '#333',
            }}
          >
            <span style={{ fontWeight: 500 }}>Page: {currentPageName || previewPageId}</span>
            <button
              onClick={() => setPreviewPageId(mainPageId)}
              style={{
                marginLeft: 'auto',
                padding: '2px 10px',
                fontSize: '12px',
                border: '1px solid',
                borderColor: evaluationScope.theme?.colors?.border || '#ccc',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: evaluationScope.theme?.colors?.text || '#333',
              }}
            >
              Back to Main
            </button>
          </div>
        )}
        {/* Ephemeral state notice */}
        <div style={{
          fontSize: '11px',
          color: evaluationScope.theme?.colors?.text || '#666',
          opacity: 0.5,
          textAlign: 'center',
          padding: '2px 4px',
          userSelect: 'none',
        }}>
          Preview mode — variable changes reset when returning to editor
        </div>
        <InheritedStylesProvider value={buildPageInheritedStyles(currentPage)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
        {rootComponents.map(comp => (
          <RenderedComponent
            key={comp.id}
            component={comp}
            allComponents={appDefinition.components}
            selectedComponentIds={[]}
            onSelect={() => { }}
            onUpdate={() => { }}
            onUpdateComponents={() => { }}
            onDelete={() => { }}
            onDrop={() => { }}
            mode="preview"
            dataStore={dataStore}
            onUpdateDataStore={onUpdateDataStore}
            actions={previewActions}
            evaluationScope={evaluationScope}
            onReparentCheck={() => { }}
            activeBreakpoint={activeBreakpoint}
            widgetDefinitions={widgetDefinitions}
          />
        ))}
        </div>
        </InheritedStylesProvider>
        {/* Variable Inspector */}
        <div style={{
          borderTop: `1px solid ${evaluationScope.theme?.colors?.border || '#e5e7eb'}`,
          marginTop: '8px',
        }}>
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            style={{
              width: '100%',
              padding: '6px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: evaluationScope.theme?.colors?.text || '#666',
              opacity: 0.7,
            }}
            aria-expanded={showDebugPanel}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showDebugPanel ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
            Variable Inspector
          </button>
          {showDebugPanel && (
            <pre
              style={{
                fontSize: '11px',
                maxHeight: '200px',
                overflow: 'auto',
                background: evaluationScope.theme?.colors?.surface || '#f9fafb',
                padding: '8px 12px',
                borderRadius: '4px',
                margin: '0 4px 4px',
                color: evaluationScope.theme?.colors?.text || '#333',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              data-testid="variable-inspector"
            >
              {JSON.stringify(variableState, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};