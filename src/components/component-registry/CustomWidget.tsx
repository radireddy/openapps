import React, { useMemo } from 'react';
import { ComponentPlugin, ComponentType, ComponentRendererProps, CustomWidgetProps, AppComponent } from '@/types';
import { safeEval } from '@/expressions/engine';
// NOTE: This import creates a circular dependency (registry -> CustomWidget -> registry)
// but ES modules handle this correctly via live bindings, unlike CommonJS require().
import { componentRegistry } from './registry';

export const CustomWidgetRenderer: React.FC<ComponentRendererProps> = ({
  component,
  mode,
  evaluationScope,
  widgetDefinitions = [],
}) => {
  const widgetProps = component.props as CustomWidgetProps;
  const { widgetDefinitionId, inputBindings = {} } = widgetProps;

  // Find the widget definition
  const definition = useMemo(
    () => widgetDefinitions.find(w => w.id === widgetDefinitionId),
    [widgetDefinitions, widgetDefinitionId]
  );

  // Resolve input values from bindings using the expression engine.
  // Bindings can be:
  //   - Expression strings: "{{variables.data}}", "{{count + 1}}"
  //   - Template literals with expressions: "Hello {{userName}}"
  //   - Plain literal values: "Total Revenue", "42", "true"
  // Only values containing {{ }} are evaluated; everything else is used as-is.
  const resolvedInputs = useMemo(() => {
    if (!definition) return {};
    const inputs: Record<string, any> = {};
    for (const input of definition.inputs) {
      const binding = inputBindings[input.name];
      if (binding !== undefined && binding !== '') {
        const bindingStr = String(binding);
        if (bindingStr.includes('{{')) {
          // Expression binding — evaluate it
          try {
            // Check if it's a pure expression like "{{expr}}" or a template "text {{expr}} text"
            const pureExprMatch = bindingStr.match(/^\{\{(.+)\}\}$/s);
            if (pureExprMatch) {
              inputs[input.name] = safeEval(pureExprMatch[1], evaluationScope || {});
            } else {
              // Template string with embedded expressions: "Hello {{name}}"
              inputs[input.name] = bindingStr.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
                try {
                  const result = safeEval(expr, evaluationScope || {});
                  return result != null ? String(result) : '';
                } catch {
                  return '';
                }
              });
            }
          } catch {
            inputs[input.name] = input.defaultValue;
          }
        } else {
          // Literal value — coerce to the expected type
          if (input.type === 'number') {
            const num = Number(bindingStr);
            inputs[input.name] = isNaN(num) ? (input.defaultValue ?? 0) : num;
          } else if (input.type === 'boolean') {
            inputs[input.name] = bindingStr === 'true';
          } else {
            inputs[input.name] = bindingStr;
          }
        }
      } else {
        inputs[input.name] = input.defaultValue;
      }
    }
    return inputs;
  }, [definition, inputBindings, evaluationScope]);

  // Build scoped evaluation context for internal components
  const widgetScope = useMemo(
    () => ({ ...evaluationScope, inputs: resolvedInputs }),
    [evaluationScope, resolvedInputs]
  );

  if (!definition) {
    return (
      <div
        role="region"
        aria-label="Widget not found"
        style={{
          width: widgetProps.width || '100%',
          height: widgetProps.height || 'auto',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          border: '2px dashed #fca5a5',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          color: '#ef4444',
          fontSize: '14px',
        }}
      >
        Widget not found: {widgetDefinitionId || 'No widget selected'}
      </div>
    );
  }

  // Get root-level components (no parent), sorted by order
  const rootComponents = definition.components
    .filter(c => !c.parentId)
    .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));

  // Render a single component from the widget definition tree
  const renderComponent = (comp: AppComponent): React.ReactNode => {
    // Prevent recursive widget nesting
    if (comp.type === ComponentType.CUSTOM_WIDGET) return null;

    const plugin = componentRegistry[comp.type];
    if (!plugin) return null;

    const Renderer = plugin.renderer;
    const children = definition.components
      .filter(c => c.parentId === comp.id)
      .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));

    return (
      <Renderer
        key={comp.id}
        component={comp}
        mode={mode}
        evaluationScope={widgetScope}
        allComponents={definition.components}
        widgetDefinitions={widgetDefinitions}
      >
        {children.map(renderComponent)}
      </Renderer>
    );
  };

  return (
    <div
      role="region"
      aria-label={definition.name}
      style={{
        width: widgetProps.width || '100%',
        height: widgetProps.height || 'auto',
        minHeight: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {rootComponents.map(renderComponent)}
    </div>
  );
};

export const CustomWidgetPlugin: ComponentPlugin = {
  type: ComponentType.CUSTOM_WIDGET,
  paletteConfig: {
    label: 'Custom Widget',
    icon: React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'h-5 w-5',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: 1.5,
    }, React.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    })),
    defaultProps: {
      widgetDefinitionId: '',
      inputBindings: {},
      width: '100%',
      height: 'auto',
    },
  },
  renderer: CustomWidgetRenderer,
  properties: () => null,
  isContainer: false,
};
