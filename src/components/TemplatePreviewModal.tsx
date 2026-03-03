import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppTemplate, DataStore, ActionHandlers } from '../types';
import { RenderedComponent } from './RenderedComponent';
import { safeEval } from '../expressions/engine';
import { get } from '../utils/data-helpers';
import { typography } from '../constants';

interface TemplatePreviewModalProps {
  template: AppTemplate;
  onClose: () => void;
  onUseTemplate: () => void;
  onEditTemplate: () => void;
}

const noopActions: ActionHandlers = {
  createRecord: async () => {},
  updateRecord: async () => {},
  deleteRecord: async () => {},
  selectRecord: () => {},
  updateVariable: () => {},
  submitForm: () => ({ success: true, errors: [] }),
  navigateTo: () => {},
};

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  onClose,
  onUseTemplate,
  onEditTemplate,
}) => {
  const appDef = template.appDefinition;
  const pages = appDef.pages || [];
  const mainPageId = appDef.mainPageId || pages[0]?.id || '';
  const [activePageId, setActivePageId] = useState(mainPageId);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a read-only evaluation scope (similar to Preview.tsx)
  const evaluationScope = useMemo(() => {
    const theme = appDef.theme;
    const themeWithAliases = theme?.colors
      ? {
          ...theme,
          colors: {
            ...theme.colors,
            onprimary: theme.colors.onPrimary || '#FFFFFF',
            onsecondary: theme.colors.onSecondary || '#FFFFFF',
          },
        }
      : {
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

    const dataStore: DataStore = appDef.dataStore || { selectedRecord: null };
    const scope: Record<string, any> = {
      theme: themeWithAliases,
      pages: appDef.pages,
      ...dataStore,
    };

    // Add component props to scope
    (appDef.components || []).forEach((c) => {
      const props = c.props as any;
      let componentValue: any = undefined;

      const storedValue = get(dataStore, c.id);
      if (storedValue !== undefined && storedValue !== null) {
        componentValue = storedValue;
      } else if (props.value !== undefined && props.value !== null && props.value !== '') {
        try {
          if (typeof props.value === 'string' && props.value.includes('{{')) {
            const expression = props.value.startsWith('{{') && props.value.endsWith('}}')
              ? props.value.substring(2, props.value.length - 2).trim()
              : props.value;
            componentValue = safeEval(expression, scope);
          } else {
            componentValue = props.value;
          }
        } catch {
          componentValue = props.value;
        }
      } else if (props.defaultValue !== undefined && props.defaultValue !== null && props.defaultValue !== '') {
        componentValue = props.defaultValue;
      }

      scope[c.id] = { ...props, value: componentValue };
    });

    return scope;
  }, [appDef]);

  const activePageComponents = (appDef.components || []).filter(
    (c) => c.pageId === activePageId
  );
  const rootComponents = activePageComponents.filter((c) => !c.parentId);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-ed-bg rounded-xl shadow-ed-modal animate-ed-scale-in w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-ed-border flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className={`${typography.heading} font-bold text-ed-text truncate`}>
              {template.name}
            </h2>
            {template.description && (
              <p className={`${typography.body} text-ed-text-secondary mt-1 line-clamp-2`}>
                {template.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover rounded-lg shrink-0"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Page tabs (only if multiple pages) */}
        {pages.length > 1 && (
          <div className="px-6 pt-2 flex gap-1 border-b border-ed-border shrink-0 overflow-x-auto">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePageId(page.id)}
                className={`px-3 py-2 ${typography.caption} font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activePageId === page.id
                    ? 'border-ed-accent text-ed-accent-text'
                    : 'border-transparent text-ed-text-secondary hover:text-ed-text hover:border-ed-border'
                }`}
              >
                {page.name}
              </button>
            ))}
          </div>
        )}

        {/* Preview area */}
        <div
          ref={containerRef}
          className="flex-grow overflow-auto bg-ed-bg-secondary p-4"
          style={{ minHeight: '300px' }}
        >
          <div
            className="bg-white rounded-lg shadow-md mx-auto w-full"
            style={{
              maxWidth: '960px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              minHeight: '200px',
              backgroundColor: evaluationScope.theme?.colors?.background || '#ffffff',
            }}
          >
            {rootComponents.length > 0 ? (
              rootComponents.map((comp) => (
                <RenderedComponent
                  key={comp.id}
                  component={comp}
                  allComponents={appDef.components}
                  selectedComponentIds={[]}
                  onSelect={() => {}}
                  onUpdate={() => {}}
                  onUpdateComponents={() => {}}
                  onDelete={() => {}}
                  onDrop={() => {}}
                  mode="preview"
                  dataStore={appDef.dataStore || {}}
                  onUpdateDataStore={() => {}}
                  actions={noopActions}
                  evaluationScope={evaluationScope}
                  onReparentCheck={() => {}}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-40 text-ed-text-tertiary">
                <p className={typography.body}>This page has no components.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-ed-border flex justify-between items-center shrink-0 bg-ed-bg-secondary rounded-b-xl">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${typography.body} font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-tertiary`}
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onEditTemplate}
              className={`px-4 py-2 ${typography.body} font-semibold text-ed-accent-text border border-ed-accent/30 rounded-md hover:bg-ed-accent/10`}
            >
              Edit Template
            </button>
            <button
              onClick={onUseTemplate}
              className={`px-4 py-2 ${typography.body} font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover`}
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
