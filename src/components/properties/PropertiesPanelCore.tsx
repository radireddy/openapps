import React, { useMemo, useState } from 'react';
import { AppComponent, ComponentProps, AppVariable, ComponentType, BreakpointKey, WidgetDefinition, CustomWidgetProps, WidgetInput, WidgetOutput } from '../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyContext } from './metadata';
import { propertyRegistry } from './registry';
import { PropertyTabs } from './PropertyTabs';
import { resolvePropertyAtBreakpoint, hasExplicitOverride } from '@/responsive';

// ─── Widget Input Type Badge ──────────────────────────────────────────────────

const TYPE_BADGE_COLORS: Record<string, string> = {
  string: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  number: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  boolean: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  array: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  object: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`inline-block text-[9px] font-semibold px-1.5 py-0 rounded-full leading-4 ${TYPE_BADGE_COLORS[type] || 'bg-ed-bg-tertiary text-ed-text-tertiary'}`}>
    {type}
  </span>
);

// ─── Widget Input Bindings Section ────────────────────────────────────────────

interface WidgetInputBindingsProps {
  inputs: WidgetInput[];
  inputBindings: Record<string, string>;
  onUpdateBindings: (newBindings: Record<string, string>) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}

const WidgetInputBindings: React.FC<WidgetInputBindingsProps> = ({
  inputs,
  inputBindings,
  onUpdateBindings,
  onOpenExpressionEditor,
}) => {
  const handleInputChange = (inputName: string, value: string) => {
    onUpdateBindings({ ...inputBindings, [inputName]: value });
  };

  if (inputs.length === 0) {
    return (
      <div className="text-xs text-ed-text-tertiary italic py-2">
        This widget has no inputs defined.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {inputs.map((input) => {
        const currentValue = inputBindings[input.name] ?? input.defaultValue ?? '';
        const isExpressionBound = typeof currentValue === 'string' && currentValue.includes('{{');

        return (
          <div key={input.id} data-testid={`widget-input-${input.name}`}>
            {/* Label row */}
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-xs font-medium text-ed-text-secondary truncate">
                {input.name}
              </label>
              <TypeBadge type={input.type} />
              {input.required && (
                <span className="text-ed-danger text-[10px] font-bold" title="Required">*</span>
              )}
            </div>

            {/* Input field */}
            <div
              className="flex items-center gap-1"
              style={isExpressionBound ? {
                borderLeft: '2px solid',
                borderImage: 'linear-gradient(to bottom, #818cf8, #6366f1) 1',
                paddingLeft: '6px',
              } : undefined}
            >
              {input.type === 'boolean' ? (
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={currentValue === 'true' || currentValue === true}
                    aria-label={input.name}
                    onClick={() => {
                      const newVal = (currentValue === 'true' || currentValue === true) ? 'false' : 'true';
                      handleInputChange(input.name, newVal);
                    }}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ed-accent/20 ${
                      (currentValue === 'true' || currentValue === true) ? 'bg-ed-accent' : 'bg-ed-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm ${
                        (currentValue === 'true' || currentValue === true) ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`}
                      style={{ transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />
                  </button>
                  <span className="text-[11px] text-ed-text-tertiary">
                    {(currentValue === 'true' || currentValue === true) ? 'true' : 'false'}
                  </span>
                </div>
              ) : input.type === 'color' ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="color"
                    value={typeof currentValue === 'string' && currentValue.startsWith('#') ? currentValue : '#000000'}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    className="w-7 h-7 rounded border border-ed-border cursor-pointer bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={String(currentValue)}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    placeholder={input.defaultValue || '#000000'}
                    className="flex-1 bg-ed-bg-secondary border border-ed-border/70 rounded-md px-2 py-1.5 text-xs text-ed-text placeholder:text-ed-text-tertiary focus:outline-none focus:ring-1 focus:ring-ed-accent/40 focus:border-ed-accent/40"
                  />
                </div>
              ) : input.type === 'number' ? (
                <input
                  type="number"
                  value={String(currentValue)}
                  onChange={(e) => handleInputChange(input.name, e.target.value)}
                  placeholder={input.defaultValue != null ? String(input.defaultValue) : '0'}
                  className="flex-1 bg-ed-bg-secondary border border-ed-border/70 rounded-md px-2 py-1.5 text-xs text-ed-text placeholder:text-ed-text-tertiary focus:outline-none focus:ring-1 focus:ring-ed-accent/40 focus:border-ed-accent/40"
                />
              ) : (input.type === 'array' || input.type === 'object') ? (
                <textarea
                  value={String(currentValue)}
                  onChange={(e) => handleInputChange(input.name, e.target.value)}
                  placeholder={input.type === 'array' ? '{{variables.items}}' : '{{variables.config}}'}
                  rows={2}
                  className="flex-1 bg-ed-bg-secondary border border-ed-border/70 rounded-md px-2 py-1.5 text-xs text-ed-text placeholder:text-ed-text-tertiary focus:outline-none focus:ring-1 focus:ring-ed-accent/40 focus:border-ed-accent/40 font-mono resize-y"
                />
              ) : (
                /* string and default */
                <input
                  type="text"
                  value={String(currentValue)}
                  onChange={(e) => handleInputChange(input.name, e.target.value)}
                  placeholder={input.defaultValue != null ? String(input.defaultValue) : `Enter ${input.name}...`}
                  className="flex-1 bg-ed-bg-secondary border border-ed-border/70 rounded-md px-2 py-1.5 text-xs text-ed-text placeholder:text-ed-text-tertiary focus:outline-none focus:ring-1 focus:ring-ed-accent/40 focus:border-ed-accent/40"
                />
              )}

              {/* Expression editor button (all types) */}
              <button
                onClick={() => {
                  onOpenExpressionEditor(String(currentValue || ''), (newVal) => {
                    handleInputChange(input.name, newVal);
                  });
                }}
                className="flex-shrink-0 px-1.5 h-7 flex items-center justify-center rounded transition-all duration-150 bg-ed-bg-secondary text-ed-text-tertiary border border-ed-border/70 hover:bg-ed-bg-hover hover:text-ed-text-secondary"
                title="Use expression"
                aria-label={`Use expression for ${input.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
                </svg>
              </button>
            </div>

            {/* Description help text */}
            {input.description && (
              <p className="text-[10px] text-ed-text-tertiary mt-0.5 leading-tight">{input.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Widget Outputs Section (read-only reference) ─────────────────────────────

interface WidgetOutputsRefProps {
  outputs: WidgetOutput[];
  componentId: string;
}

const WidgetOutputsRef: React.FC<WidgetOutputsRefProps> = ({ outputs, componentId }) => {
  const [copiedOutput, setCopiedOutput] = useState<string | null>(null);

  if (outputs.length === 0) {
    return (
      <div className="text-xs text-ed-text-tertiary italic py-2">
        This widget has no outputs defined.
      </div>
    );
  }

  const handleCopy = (expression: string, outputName: string) => {
    try {
      navigator.clipboard.writeText(expression);
      setCopiedOutput(outputName);
      setTimeout(() => setCopiedOutput(null), 1500);
    } catch {
      // Clipboard API may be unavailable
    }
  };

  return (
    <div className="space-y-2">
      {outputs.map((output) => {
        const expression = `{{${componentId}.${output.name}}}`;
        return (
          <div key={output.id} className="bg-ed-bg-secondary/50 rounded-md p-2 border border-ed-border/40" data-testid={`widget-output-${output.name}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-medium text-ed-text-secondary">{output.name}</span>
              <TypeBadge type={output.type} />
            </div>
            {output.description && (
              <p className="text-[10px] text-ed-text-tertiary mb-1.5 leading-tight">{output.description}</p>
            )}
            <div className="flex items-center gap-1">
              <code className="flex-1 text-[10px] font-mono bg-ed-bg-tertiary/50 text-ed-accent-text px-2 py-1 rounded border border-ed-border/30 truncate">
                {expression}
              </code>
              <button
                onClick={() => handleCopy(expression, output.name)}
                className="flex-shrink-0 px-1.5 h-6 flex items-center justify-center rounded text-ed-text-tertiary hover:text-ed-accent hover:bg-ed-accent-muted/30 transition-colors"
                title="Copy expression"
                aria-label={`Copy expression for ${output.name}`}
              >
                {copiedOutput === output.name ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface PropertiesPanelCoreProps {
  components: AppComponent[];
  selectedComponentIds: string[];
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  variables: AppVariable[];
  evaluationScope: Record<string, any>;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
  activeBreakpoint?: BreakpointKey;
  widgetDefinitions?: WidgetDefinition[];
}

/**
 * Core metadata-driven properties panel
 * Supports tabs, groups, multi-selection, and expression editing
 */
export const PropertiesPanelCore: React.FC<PropertiesPanelCoreProps> = ({
  components,
  selectedComponentIds,
  onUpdate,
  variables,
  evaluationScope,
  onOpenExpressionEditor,
  activeBreakpoint = 'mobile' as BreakpointKey,
  widgetDefinitions = [],
}) => {
  const isMultiSelect = selectedComponentIds.length > 1;
  const selectedComponents = useMemo(() => {
    return components.filter(c => selectedComponentIds.includes(c.id));
  }, [components, selectedComponentIds]);

  // Get property schema for the selected component(s)
  const schema = useMemo(() => {
    if (selectedComponents.length === 0) return null;
    
    if (isMultiSelect) {
      // For multi-select, find common properties across all selected components
      const types = selectedComponents.map(c => c.type);
      const uniqueTypes = Array.from(new Set(types));
      
      // If all components are the same type, use that schema
      if (uniqueTypes.length === 1) {
        return propertyRegistry[uniqueTypes[0] as ComponentType] || null;
      }
      
      // Otherwise, find common properties
      const schemas = uniqueTypes
        .map(type => propertyRegistry[type as ComponentType])
        .filter((s): s is ComponentPropertySchema => s !== undefined);
      
      if (schemas.length === 0) return null;
      
      // Find common properties across all schemas
      const commonPropertyIds = new Set<string>();
      const firstSchema = schemas[0];
      
      firstSchema.properties.forEach(prop => {
        if (schemas.every(s => s.properties.some(p => p.id === prop.id))) {
          commonPropertyIds.add(prop.id);
        }
      });
      
      // Create a merged schema with only common properties
      return {
        componentType: uniqueTypes[0] as ComponentType, // Use first type as representative
        tabs: firstSchema.tabs || [],
        groups: firstSchema.groups || [],
        properties: firstSchema.properties.filter(p => commonPropertyIds.has(p.id)),
      };
    } else {
      // Single selection
      const component = selectedComponents[0];
      return propertyRegistry[component.type];
    }
  }, [selectedComponents, isMultiSelect]);

  // Create property context
  const context: PropertyContext = useMemo(() => ({
    component: isMultiSelect ? undefined : selectedComponents[0],
    components: selectedComponents,
    variables,
    evaluationScope,
    isMultiSelect,
  }), [selectedComponents, isMultiSelect, variables, evaluationScope]);

  // Get property value (handles multi-select with mixed values and breakpoint resolution)
  const getValue = (propertyId: string): any => {
    if (isMultiSelect) {
      const values = selectedComponents.map(c => {
        const baseValue = (c.props as any)[propertyId];
        if (activeBreakpoint === 'mobile') return baseValue;
        return resolvePropertyAtBreakpoint((c.props as any).responsive, baseValue, propertyId, activeBreakpoint);
      });
      const uniqueValues = Array.from(new Set(values.map(v => String(v ?? ''))));
      if (uniqueValues.length === 1) {
        return values[0];
      }
      return undefined;
    }
    const props = selectedComponents[0].props as any;
    const baseValue = props[propertyId];
    if (activeBreakpoint === 'mobile') return baseValue;
    return resolvePropertyAtBreakpoint(props.responsive, baseValue, propertyId, activeBreakpoint);
  };

  // Check if property has mixed values (multi-select)
  const isMixed = (propertyId: string): boolean => {
    if (!isMultiSelect) return false;
    const values = selectedComponents.map(c => (c.props as any)[propertyId]);
    const uniqueValues = Array.from(new Set(values.map(v => String(v ?? ''))));
    return uniqueValues.length > 1;
  };

  // Get validation error for a property
  const getError = (propertyId: string): string | undefined => {
    const metadata = schema?.properties.find(p => p.id === propertyId);
    if (!metadata?.validationRules) return undefined;

    const value = getValue(propertyId);
    
    for (const rule of metadata.validationRules) {
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            return rule.message || 'This field is required';
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > (rule.value ?? Infinity)) {
            return rule.message || `Value must be at most ${rule.value}`;
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && rule.value) {
            const regex = new RegExp(rule.value);
            if (!regex.test(value)) {
              return rule.message || 'Value does not match required pattern';
            }
          }
          break;
        case 'range':
          if (typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
              return rule.message || `Value must be at least ${rule.min}`;
            }
            if (rule.max !== undefined && value > rule.max) {
              return rule.message || `Value must be at most ${rule.max}`;
            }
          }
          break;
        case 'custom':
          if (rule.validator) {
            const result = rule.validator(value);
            if (result !== true) {
              return typeof result === 'string' ? result : (rule.message || 'Invalid value');
            }
          }
          break;
      }
    }
    return undefined;
  };

  // Update property value (writes to correct breakpoint)
  const handleUpdate = (propertyId: string, value: any) => {
    const updateForId = (id: string) => {
      if (activeBreakpoint === 'mobile') {
        // Mobile = base props
        onUpdate(id, { [propertyId]: value } as Partial<ComponentProps>);
      } else {
        // Non-mobile = write to responsive overrides
        const comp = components.find(c => c.id === id);
        if (!comp) return;
        const existing = (comp.props as any).responsive || {};
        const bpOverrides = existing[activeBreakpoint] || {};
        onUpdate(id, {
          responsive: {
            ...existing,
            [activeBreakpoint]: { ...bpOverrides, [propertyId]: value },
          },
        } as any);
      }
    };

    if (isMultiSelect) {
      selectedComponentIds.forEach(updateForId);
    } else {
      updateForId(selectedComponentIds[0]);
    }
  };

  // Filter properties based on visibility conditions
  const visibleProperties = useMemo(() => {
    if (!schema) return [];
    
    return schema.properties.filter(prop => {
      // Check hidden condition
      if (prop.hidden !== undefined) {
        if (typeof prop.hidden === 'boolean' && prop.hidden) return false;
        if (typeof prop.hidden === 'function' && selectedComponents[0]?.props) {
          const props = selectedComponents[0].props as ComponentProps;
          const result = prop.hidden(props, evaluationScope);
          if (result === true) return false;
        }
      }
      
      // Check visibleIf condition
      if (prop.visibleIf !== undefined) {
        if (typeof prop.visibleIf === 'boolean') {
          if (!prop.visibleIf) return false;
        } else if (typeof prop.visibleIf === 'function' && selectedComponents[0]?.props) {
          const props = selectedComponents[0].props as ComponentProps;
          const result = prop.visibleIf(props, evaluationScope);
          if (result !== true) return false;
        }
      }
      
      // Check multi-edit support
      if (isMultiSelect && prop.multiEditSupport === 'none') {
        return false;
      }
      
      // Check applicableTo
      if (prop.applicableTo !== undefined && prop.applicableTo !== 'all') {
        if (isMultiSelect) {
          // For multi-select, property must be applicable to all selected component types
          const types = selectedComponents.map(c => c.type);
          return types.every(type => prop.applicableTo?.includes(type));
        } else {
          const componentType = selectedComponents[0]?.type;
          if (Array.isArray(prop.applicableTo)) {
            return prop.applicableTo.includes(componentType);
          }
        }
      }
      
      return true;
    });
  }, [schema, selectedComponents, isMultiSelect, evaluationScope]);

  if (!schema || selectedComponents.length === 0) {
    return (
      <div className="p-4 text-center text-ed-text-secondary text-sm">
        Select a component to see its properties.
      </div>
    );
  }

  // Reset a responsive override at the current breakpoint
  const handleResetOverride = (propertyId: string) => {
    if (activeBreakpoint === 'mobile') return;
    const resetForId = (id: string) => {
      const comp = components.find(c => c.id === id);
      if (!comp) return;
      const existing = (comp.props as any).responsive || {};
      const bpOverrides = { ...(existing[activeBreakpoint] || {}) };
      delete bpOverrides[propertyId];
      const updatedResponsive = { ...existing, [activeBreakpoint]: bpOverrides };
      // Clean up empty breakpoint objects
      if (Object.keys(bpOverrides).length === 0) {
        delete updatedResponsive[activeBreakpoint];
      }
      onUpdate(id, { responsive: updatedResponsive } as any);
    };
    if (isMultiSelect) {
      selectedComponentIds.forEach(resetForId);
    } else {
      resetForId(selectedComponentIds[0]);
    }
  };

  // ─── Custom Widget: resolve definition for dynamic sections ────────────────
  const isCustomWidget = !isMultiSelect && selectedComponents[0]?.type === ComponentType.CUSTOM_WIDGET;
  const widgetDefinition = useMemo(() => {
    if (!isCustomWidget) return null;
    const props = selectedComponents[0].props as CustomWidgetProps;
    return widgetDefinitions.find(w => w.id === props.widgetDefinitionId) || null;
  }, [isCustomWidget, selectedComponents, widgetDefinitions]);

  const handleUpdateInputBindings = (newBindings: Record<string, string>) => {
    if (!isCustomWidget) return;
    const id = selectedComponents[0].id;
    onUpdate(id, { inputBindings: newBindings } as Partial<ComponentProps>);
  };

  // For CUSTOM_WIDGET, render standard schema tabs plus dynamic widget sections
  if (isCustomWidget && widgetDefinition) {
    const widgetProps = selectedComponents[0].props as CustomWidgetProps;
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Widget identity header */}
        <div className="px-3 py-2.5 bg-ed-bg-secondary/30 border-b border-ed-border/40">
          <div className="flex items-center gap-2">
            <span className="text-base">{widgetDefinition.icon || '\u{1F9E9}'}</span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ed-text truncate">{widgetDefinition.name}</div>
              {widgetDefinition.description && (
                <div className="text-[10px] text-ed-text-tertiary truncate">{widgetDefinition.description}</div>
              )}
            </div>
          </div>
        </div>

        {/* Widget Inputs Section */}
        <div className="px-3 py-2.5 border-b border-ed-border/40" data-testid="widget-inputs-section">
          <div className="flex items-center gap-1.5 mb-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-ed-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <h4 className="text-xs font-semibold text-ed-text">Widget Inputs</h4>
            <span className="text-[10px] text-ed-text-tertiary">({widgetDefinition.inputs.length})</span>
          </div>
          <WidgetInputBindings
            inputs={widgetDefinition.inputs}
            inputBindings={widgetProps.inputBindings || {}}
            onUpdateBindings={handleUpdateInputBindings}
            onOpenExpressionEditor={onOpenExpressionEditor}
          />
        </div>

        {/* Widget Outputs Section (read-only) */}
        {widgetDefinition.outputs.length > 0 && (
          <div className="px-3 py-2.5 border-b border-ed-border/40" data-testid="widget-outputs-section">
            <div className="flex items-center gap-1.5 mb-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-ed-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <h4 className="text-xs font-semibold text-ed-text">Widget Outputs</h4>
              <span className="text-[10px] text-ed-text-tertiary">({widgetDefinition.outputs.length})</span>
            </div>
            <WidgetOutputsRef
              outputs={widgetDefinition.outputs}
              componentId={selectedComponents[0].id}
            />
          </div>
        )}

        {/* Standard property tabs below (widgetDefinitionId etc.) */}
        <PropertyTabs
          tabs={schema.tabs || []}
          groups={schema.groups || []}
          properties={visibleProperties}
          context={context}
          onUpdate={handleUpdate}
          onOpenExpressionEditor={onOpenExpressionEditor}
          getValue={getValue}
          getError={getError}
          isMixed={isMixed}
          activeBreakpoint={activeBreakpoint}
          componentProps={selectedComponents[0]?.props as any}
          onResetOverride={handleResetOverride}
        />
      </div>
    );
  }

  // If custom widget but definition not found, show a warning
  if (isCustomWidget && !widgetDefinition) {
    const widgetProps = selectedComponents[0].props as CustomWidgetProps;
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-xs font-medium">Widget definition not found</p>
              <p className="text-[10px] mt-0.5 opacity-80">ID: {widgetProps.widgetDefinitionId}</p>
            </div>
          </div>
        </div>
        <PropertyTabs
          tabs={schema.tabs || []}
          groups={schema.groups || []}
          properties={visibleProperties}
          context={context}
          onUpdate={handleUpdate}
          onOpenExpressionEditor={onOpenExpressionEditor}
          getValue={getValue}
          getError={getError}
          isMixed={isMixed}
          activeBreakpoint={activeBreakpoint}
          componentProps={selectedComponents[0]?.props as any}
          onResetOverride={handleResetOverride}
        />
      </div>
    );
  }

  // Use PropertyTabs to show tabs and organize properties by tab
  // This will show all registered tabs (General, Styles, Events, etc.)
  return (
    <PropertyTabs
      tabs={schema.tabs || []}
      groups={schema.groups || []}
      properties={visibleProperties}
      context={context}
      onUpdate={handleUpdate}
      onOpenExpressionEditor={onOpenExpressionEditor}
      getValue={getValue}
      getError={getError}
      isMixed={isMixed}
      activeBreakpoint={activeBreakpoint}
      componentProps={isMultiSelect ? undefined : (selectedComponents[0]?.props as any)}
      onResetOverride={handleResetOverride}
    />
  );
};

