import React, { useState, useMemo, useCallback } from 'react';
import { PropertyGroup as PropertyGroupType, PropertyMetadata, PropertyContext, DropdownOption } from './metadata';
import { CollapsibleSection, PropInput, PropFxInput, PropSelect } from '../component-registry/common';
import type { BreakpointKey } from '@/types';
import { hasExplicitOverride } from '@/responsive';
import { typography } from '@/constants';
import { usePanelLayout } from './PanelLayoutContext';

export const CUSTOM_SENTINEL = '__custom__';

/**
 * Dropdown with "Custom" option that reveals a text input for arbitrary values.
 * Used when PropertyMetadata has allowCustom: true.
 */
export const AllowCustomDropdown: React.FC<{
  prop: PropertyMetadata;
  value: any;
  options: { value: string; label: string }[];
  onChange: (val: any) => void;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  compact?: boolean;
}> = ({ prop, value, options, onChange, onOpenExpressionEditor, compact }) => {
  const currentValue = value ?? '';
  const matchesOption = options.some(opt => opt.value === currentValue);
  const isCustom = currentValue !== '' && !matchesOption;
  const [showCustomInput, setShowCustomInput] = useState(isCustom);

  // Sync showCustomInput when value changes externally (e.g., undo/redo)
  React.useEffect(() => {
    const matches = options.some(opt => opt.value === currentValue);
    if (currentValue !== '' && !matches) {
      setShowCustomInput(true);
    } else if (matches) {
      setShowCustomInput(false);
    }
  }, [currentValue, options]);

  const selectValue = showCustomInput ? CUSTOM_SENTINEL : currentValue;
  const allOptions = [...options, { value: CUSTOM_SENTINEL, label: 'Custom...' }];

  const handleSelectChange = (val: string) => {
    if (val === CUSTOM_SENTINEL) {
      setShowCustomInput(true);
      // Don't change the value yet; user will type in the text input
    } else {
      setShowCustomInput(false);
      onChange(val);
    }
  };

  const { isNarrow } = usePanelLayout();

  const marginClass = compact ? 'mb-0' : 'mb-1.5';
  const selectClasses = `bg-ed-bg-secondary border border-ed-border/50 rounded px-2 py-1 ${typography.body} text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus focus:bg-ed-bg focus:shadow-[var(--ed-glow-accent)] h-[30px] min-w-0 transition-all duration-150 shadow-[var(--ed-input-shadow-inner)] hover:border-ed-border`;
  const inputClasses = `flex-1 bg-ed-bg-secondary border border-ed-border/50 px-2 py-1 ${typography.body} text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus focus:bg-ed-bg focus:shadow-[var(--ed-glow-accent)] h-[30px] min-w-0 transition-all duration-150 placeholder:text-ed-text-tertiary/60 shadow-[var(--ed-input-shadow-inner)] hover:border-ed-border`;

  const isExpressionBound = typeof currentValue === 'string' && currentValue.includes('{{');
  const selectId = `prop-select-${prop.label.replace(/\s+/g, '-').toLowerCase()}`;

  const editorButton = showCustomInput && onOpenExpressionEditor ? (
    <button
      onClick={() => {
        onOpenExpressionEditor(String(currentValue || ''), (newVal) => {
          onChange(newVal);
        });
      }}
      className={`px-2 border-t border-b border-r rounded-r h-[30px] flex items-center justify-center transition-all duration-150 flex-shrink-0 ${isExpressionBound ? 'bg-ed-accent-muted text-ed-accent border-ed-accent/30 hover:bg-ed-accent-muted' : 'bg-ed-bg-secondary text-ed-text-tertiary border-ed-border/50 hover:bg-ed-bg-hover hover:text-ed-text-secondary'}`}
      title={isExpressionBound ? 'Edit Expression' : 'Add Expression'}
      aria-label={isExpressionBound ? 'Edit Expression' : 'Add Expression'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" /></svg>
    </button>
  ) : null;

  return (
    <div className={marginClass} style={isExpressionBound && showCustomInput ? { borderLeft: '2px solid', borderImage: 'linear-gradient(to bottom, #818cf8, #6366f1) 1', paddingLeft: '6px' } : undefined}>
      {isNarrow ? (
        <>
          <label htmlFor={selectId} className="block text-[11px] text-ed-text-secondary mb-0.5 break-words" title={prop.tooltip}>{prop.label}</label>
          <select
            id={selectId}
            value={selectValue}
            onChange={e => handleSelectChange(e.target.value)}
            className={selectClasses + ' w-full'}
          >
            {allOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          {showCustomInput && (
            <div className="flex items-center mt-1">
              <input
                type="text"
                value={currentValue}
                onChange={e => onChange(e.target.value)}
                className={inputClasses + (editorButton ? ' rounded-l border-r-0' : ' rounded') + ' w-full'}
                placeholder={prop.placeholder || 'Enter custom value...'}
              />
              {editorButton}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-[35%_1fr] items-center gap-x-1.5">
            <label htmlFor={selectId} className="text-[11px] text-ed-text-secondary truncate" title={prop.tooltip}>{prop.label}</label>
            <select
              id={selectId}
              value={selectValue}
              onChange={e => handleSelectChange(e.target.value)}
              className={selectClasses + ' flex-1'}
            >
              {allOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          {showCustomInput && (
            <div className="grid grid-cols-[35%_1fr] items-center gap-x-1.5 mt-1">
              <span />
              <div className="flex items-center">
                <input
                  type="text"
                  value={currentValue}
                  onChange={e => onChange(e.target.value)}
                  className={inputClasses + (editorButton ? ' rounded-l border-r-0' : ' rounded')}
                  placeholder={prop.placeholder || 'Enter custom value...'}
                />
                {editorButton}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface PropertyGroupProps {
  group: PropertyGroupType;
  properties: PropertyMetadata[];
  context: PropertyContext;
  onUpdate: (propertyId: string, value: any) => void;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  getValue: (propertyId: string) => any;
  getError: (propertyId: string) => string | undefined;
  isMixed: (propertyId: string) => boolean;
  activeBreakpoint?: BreakpointKey;
  componentProps?: Record<string, any>;
  onResetOverride?: (propertyId: string) => void;
}

export const PropertyGroup: React.FC<PropertyGroupProps> = ({
  group,
  properties,
  context,
  onUpdate,
  onOpenExpressionEditor,
  getValue,
  getError,
  isMixed,
  activeBreakpoint,
  componentProps,
  onResetOverride,
}) => {
  const storageKey = `propcollapse:${group.id}`;
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored === 'true';
    } catch { /* ignore */ }
    return !group.defaultCollapsed;
  });

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(storageKey, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  const sectionId = `group-${group.id}`;

  // Sort properties by order
  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      const orderA = a.propertyOrder ?? 999;
      const orderB = b.propertyOrder ?? 999;
      return orderA - orderB;
    });
  }, [properties]);

  const isNonMobile = activeBreakpoint && activeBreakpoint !== 'mobile';

  // Wrap a property with override indicator when editing a non-mobile breakpoint
  const wrapWithOverrideIndicator = (prop: PropertyMetadata, content: React.ReactNode) => {
    if (!isNonMobile || !componentProps) return content;
    const isOverridden = hasExplicitOverride(componentProps?.responsive, prop.id, activeBreakpoint);
    if (!isOverridden) return content;
    return (
      <div className="relative">
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-ed-accent" title={`Overridden at ${activeBreakpoint}`} />
        {onResetOverride && (
          <button
            onClick={() => onResetOverride(prop.id)}
            className="absolute -right-1 top-0 w-4 h-4 flex items-center justify-center rounded-full text-ed-text-tertiary hover:text-ed-danger hover:bg-ed-danger-muted transition-colors text-[10px] leading-none"
            title="Reset to base value"
            aria-label={`Reset ${prop.label} override`}
          >
            &times;
          </button>
        )}
        {content}
      </div>
    );
  };

  // Render a single property input (without wrapper) - using smart layout logic
  const renderPropertyInput = (prop: PropertyMetadata, compact: boolean = false) => {
    const value = getValue(prop.id);
    const error = getError(prop.id);
    const mixed = isMixed(prop.id);
    const displayValue = mixed ? '— Mixed —' : (value ?? prop.defaultValue ?? '');

    // Handle custom renderer
    if (prop.customRenderer) {
      const CustomRenderer = prop.customRenderer;
      return (
        <CustomRenderer
          metadata={prop}
          value={value}
          onChange={(newValue) => onUpdate(prop.id, newValue)}
          context={context}
          onOpenExpressionEditor={onOpenExpressionEditor}
          error={error}
          isMixed={mixed}
        />
      );
    }

    // Render based on type
    switch (prop.type) {
      case 'string':
      case 'expression':
      case 'code':
        const supportsExpression = prop.supportsExpression ?? (prop.type === 'expression' || prop.type === 'code');
        const isExpression = typeof value === 'string' && value.startsWith('{{');
        const isExpressionBound = typeof displayValue === 'string' && displayValue.includes('{{');

        return (
          <div style={isExpressionBound ? { borderLeft: '2px solid', borderImage: 'linear-gradient(to bottom, #818cf8, #6366f1) 1', paddingLeft: '6px' } : undefined}>
            <PropFxInput
              label={prop.label}
              value={displayValue}
              onChange={(val) => onUpdate(prop.id, val)}
              type={prop.type === 'expression' || prop.type === 'code' ? 'text' : undefined}
              placeholder={prop.placeholder}
              onOpenEditor={supportsExpression && onOpenExpressionEditor ? (val) => {
                const currentValue = isExpression ? String(value || '') : String(value || '');
                onOpenExpressionEditor(currentValue, (newVal) => onUpdate(prop.id, newVal));
              } : undefined}
              propertyKey={prop.id}
              className={compact ? 'mb-0' : 'mb-1.5'}
              error={error}
              helpText={prop.helpText}
            />
            {prop.presets && prop.presets.length > 0 && !displayValue && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {prop.presets.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onUpdate(prop.id, preset.value)}
                    className="px-2 py-0.5 text-[10px] rounded border border-ed-border bg-ed-bg text-ed-text-secondary hover:bg-ed-accent-muted hover:text-ed-accent hover:border-ed-accent transition-colors"
                    title={preset.value}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <PropInput
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type="number"
            placeholder={prop.placeholder}
            className={compact ? 'mb-0' : undefined}
          />
        );

      case 'boolean': {
        const boolSupportsExpr = prop.supportsExpression === true;
        const isExpressionValue = typeof value === 'string' && value.startsWith('{{');

        // Expression mode: value is an expression string → render PropFxInput
        if (boolSupportsExpr && isExpressionValue) {
          return (
            <PropFxInput
              label={prop.label}
              value={displayValue}
              onChange={(val) => {
                // If user clears the expression, revert to boolean false
                if (val === '' || val === undefined || val === null) {
                  onUpdate(prop.id, false);
                } else {
                  onUpdate(prop.id, val);
                }
              }}
              type="text"
              placeholder={prop.placeholder}
              onOpenEditor={onOpenExpressionEditor ? (val) => {
                const currentValue = String(value || '');
                onOpenExpressionEditor!(currentValue, (newVal) => {
                  if (!newVal || newVal === '') {
                    onUpdate(prop.id, false);
                  } else {
                    onUpdate(prop.id, newVal);
                  }
                });
              } : undefined}
              propertyKey={prop.id}
              className={compact ? 'mb-0' : 'mb-1.5'}
            />
          );
        }

        // Toggle mode for boolean with expression support
        if (boolSupportsExpr) {
          const boolValue = typeof value === 'boolean' ? value
            : value === 'true' ? true
            : value === 'false' ? false
            : (typeof prop.defaultValue === 'boolean' ? prop.defaultValue : false);

          return (
            <div className={compact ? 'mb-0' : 'mb-1.5'}>
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
                  onClick={() => !mixed && onUpdate(prop.id, !boolValue)}
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={boolValue}
                    aria-label={prop.label}
                    disabled={mixed}
                    onClick={(e) => { e.stopPropagation(); if (!mixed) onUpdate(prop.id, !boolValue); }}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ed-accent/20 ${
                      boolValue ? 'bg-ed-accent' : 'bg-ed-border'
                    } ${mixed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm ${
                        boolValue ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`}
                      style={{ transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />
                  </button>
                  <span className={`text-xs text-ed-text-secondary group-hover:text-ed-text transition-colors truncate ${prop.tooltip ? 'cursor-help' : ''}`} title={prop.tooltip}>
                    {prop.label}
                  </span>
                </label>
                {onOpenExpressionEditor && (
                  <button
                    onClick={() => {
                      onOpenExpressionEditor!('', (newVal) => {
                        if (newVal && newVal.startsWith('{{')) {
                          onUpdate(prop.id, newVal);
                        } else if (newVal === 'true') {
                          onUpdate(prop.id, true);
                        } else if (newVal === 'false' || !newVal) {
                          onUpdate(prop.id, false);
                        } else {
                          onUpdate(prop.id, newVal);
                        }
                      });
                    }}
                    className="px-1.5 h-5 flex items-center justify-center rounded transition-all duration-150 bg-ed-bg-secondary text-ed-text-tertiary border border-ed-border/70 hover:bg-ed-bg-hover hover:text-ed-text-secondary flex-shrink-0 ml-2"
                    title="Use Expression"
                    aria-label="Use Expression"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
                    </svg>
                  </button>
                )}
              </div>
              {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
            </div>
          );
        }

        // Simple checkbox (no expression support) - custom styled
        const simpleChecked = mixed ? false : (value ?? prop.defaultValue ?? false);
        return (
          <div className={compact ? 'mb-0' : 'mb-1.5'}>
            <label className="flex items-center gap-2.5 py-1 cursor-pointer group"
              onClick={() => !mixed && onUpdate(prop.id, !simpleChecked)}
            >
              <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all duration-200 cursor-pointer ${
                simpleChecked
                  ? 'bg-ed-accent border-ed-accent shadow-sm'
                  : 'bg-ed-bg-secondary border-ed-border/70 hover:border-ed-accent/50'
              } ${mixed ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {simpleChecked && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-xs text-ed-text-secondary group-hover:text-ed-text transition-colors ${prop.tooltip ? 'cursor-help' : ''}`} title={prop.tooltip}>
                {prop.label}
              </span>
            </label>
            {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
          </div>
        );
      }

      case 'color':
        return (
          <PropFxInput
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type="color"
            onOpenEditor={prop.supportsExpression && onOpenExpressionEditor ? (val) => {
              const currentValue = String(value || prop.defaultValue || '#000000');
              onOpenExpressionEditor(currentValue, (newVal) => onUpdate(prop.id, newVal));
            } : undefined}
            className={compact ? 'mb-0' : undefined}
          />
        );

      case 'dropdown':
        const options = prop.options
          ? (typeof prop.options === 'function' ? prop.options(context) : prop.options)
          : [];

        if (prop.allowCustom) {
          return (
            <AllowCustomDropdown
              prop={prop}
              value={mixed ? '' : (value ?? prop.defaultValue ?? '')}
              options={options.map(opt => ({ value: opt.value, label: opt.label }))}
              onChange={(val) => onUpdate(prop.id, val)}
              onOpenExpressionEditor={onOpenExpressionEditor}
              compact={compact}
            />
          );
        }

        return (
          <PropSelect
            label={prop.label}
            value={mixed ? '' : (value ?? prop.defaultValue ?? (options[0]?.value || ''))}
            onChange={(val) => onUpdate(prop.id, val)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            className={compact ? 'mb-0' : undefined}
          />
        );

      case 'composite':
        if (!prop.compositeFields) {
          return <div className="text-ed-danger text-xs">Composite property missing field definitions</div>;
        }
        
        const compositeValue = value || {};
        return (
          <div className={compact ? 'mb-0' : 'mb-1.5'}>
            <label className="block text-xs font-medium text-ed-text-secondary mb-1">{prop.label}</label>
            <div className="grid grid-cols-2 gap-2.5">
              {prop.compositeFields.map((field) => (
                <PropInput
                  key={field.id}
                  label={field.label}
                  value={mixed ? '—' : (compositeValue[field.id] ?? field.defaultValue ?? '')}
                  onChange={(val) => {
                    onUpdate(prop.id, { ...compositeValue, [field.id]: val });
                  }}
                  type={field.type}
                />
              ))}
            </div>
            {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
          </div>
        );

      default:
        return (
          <div className="text-ed-danger text-xs mb-1.5">
            Unsupported property type: {prop.type}
          </div>
        );
    }
  };

  // Render property input wrapped with responsive override indicator
  const renderPropertyWithIndicator = (prop: PropertyMetadata, compact: boolean = false) => {
    return wrapWithOverrideIndicator(prop, renderPropertyInput(prop, compact));
  };

  // Smart layout: Group related properties for efficient space usage
  const renderPropertyGroup = (properties: PropertyMetadata[]) => {
    // Detect common patterns for grouping
    const layoutGroups: Record<string, PropertyMetadata[]> = {};
    const standalone: PropertyMetadata[] = [];

    properties.forEach(prop => {
      // Check for layout hints
      if (prop.layoutHint?.layoutGroupId) {
        const groupId = prop.layoutHint.layoutGroupId;
        if (!layoutGroups[groupId]) {
          layoutGroups[groupId] = [];
        }
        layoutGroups[groupId].push(prop);
      } else {
        // Auto-detect common patterns
        const id = prop.id.toLowerCase();
        
        // Flex item pairs: order/flexGrow/flexShrink
        if (id === 'order' || id === 'flexgrow' || id === 'flexshrink') {
          if (!layoutGroups['flexItem']) {
            layoutGroups['flexItem'] = [];
          }
          layoutGroups['flexItem'].push(prop);
        }
        // Size pairs: width/height
        else if (id === 'width' || id === 'height') {
          if (!layoutGroups['size']) {
            layoutGroups['size'] = [];
          }
          layoutGroups['size'].push(prop);
        }
        // Validation pair: max/maxlength
        else if (id === 'max' || id === 'maxlength') {
          if (!layoutGroups['validation']) {
            layoutGroups['validation'] = [];
          }
          layoutGroups['validation'].push(prop);
        }
        // Spacing pairs: padding/margin
        else if (id === 'padding' || id === 'margin') {
          if (!layoutGroups['spacing']) {
            layoutGroups['spacing'] = [];
          }
          layoutGroups['spacing'].push(prop);
        }
        // Border pairs: borderWidth/borderColor
        else if (id === 'borderwidth' || id === 'bordercolor') {
          if (!layoutGroups['border']) {
            layoutGroups['border'] = [];
          }
          layoutGroups['border'].push(prop);
        }
        // Boolean pairs: group adjacent booleans for 2-column layout
        else if (prop.type === 'boolean' && !prop.supportsExpression) {
          if (!layoutGroups['booleans']) {
            layoutGroups['booleans'] = [];
          }
          layoutGroups['booleans'].push(prop);
        }
        else {
          standalone.push(prop);
        }
      }
    });

    const elements: React.ReactNode[] = [];

    // Helper function to get max width from property layout hint
    const getMaxWidth = (prop: PropertyMetadata): string | undefined => {
      return prop.layoutHint?.maxWidth;
    };

    // Render flex item group (Order, Flex Grow, Flex Shrink) - Responsive columns
    if (layoutGroups['flexItem'] && layoutGroups['flexItem'].length >= 2) {
      const sorted = layoutGroups['flexItem'].sort((a, b) => {
        const order = ['order', 'flexgrow', 'flexshrink'];
        const aIdx = order.indexOf(a.id.toLowerCase());
        const bIdx = order.indexOf(b.id.toLowerCase());
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
      elements.push(
        <div key="flexItem" className="flex flex-wrap gap-2 mb-1.5">
          {sorted.map(prop => {
            const maxWidth = getMaxWidth(prop);
            return (
              <div key={prop.id} style={{ flex: maxWidth ? '0 1 auto' : '1 1 0%', maxWidth: maxWidth, minWidth: '80px' }}>
                {renderPropertyWithIndicator(prop, true)}
              </div>
            );
          })}
        </div>
      );
    } else if (layoutGroups['flexItem']) {
      layoutGroups['flexItem'].forEach(prop => standalone.push(prop));
    }

    // Render size group (Width, Height) - Responsive 2 columns that wrap with max width
    if (layoutGroups['size'] && layoutGroups['size'].length === 2) {
      const [widthProp, heightProp] = layoutGroups['size'].sort((a, b) => {
        if (a.id === 'width') return -1;
        if (b.id === 'width') return 1;
        return 0;
      });
      const widthMaxWidth = getMaxWidth(widthProp);
      const heightMaxWidth = getMaxWidth(heightProp);
      const minWidth = widthMaxWidth || heightMaxWidth ? '100px' : '150px';
      elements.push(
        <div key="size" className="flex flex-wrap gap-2 mb-1.5">
          <div style={{ flex: widthMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: widthMaxWidth, minWidth: minWidth }}>
            {renderPropertyWithIndicator(widthProp, true)}
          </div>
          <div style={{ flex: heightMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: heightMaxWidth, minWidth: minWidth }}>
            {renderPropertyWithIndicator(heightProp, true)}
          </div>
        </div>
      );
    } else if (layoutGroups['size']) {
      layoutGroups['size'].forEach(prop => standalone.push(prop));
    }

    // Render validation group (Max, MaxLength) - Responsive columns that wrap with max width
    if (layoutGroups['validation'] && layoutGroups['validation'].length > 0) {
      const sorted = layoutGroups['validation'].sort((a, b) => {
        const order = ['maxlength', 'max'];
        const aIdx = order.indexOf(a.id.toLowerCase());
        const bIdx = order.indexOf(b.id.toLowerCase());
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
      
      if (sorted.length === 3) {
        elements.push(
          <div key="validation" className="flex flex-wrap gap-2 mb-1.5">
            {sorted.map(prop => {
              const maxWidth = getMaxWidth(prop);
              return (
                <div key={prop.id} style={{ flex: maxWidth ? '0 1 auto' : '1 1 0%', maxWidth: maxWidth, minWidth: '100px' }}>
                  {renderPropertyWithIndicator(prop, true)}
                </div>
              );
            })}
          </div>
        );
      } else if (sorted.length === 2) {
        // If 2 properties, use responsive 2 columns
        elements.push(
          <div key="validation" className="flex flex-wrap gap-2 mb-1.5">
            {sorted.map(prop => {
              const maxWidth = getMaxWidth(prop);
              return (
                <div key={prop.id} style={{ flex: maxWidth ? '0 1 auto' : '1 1 0%', maxWidth: maxWidth, minWidth: '150px' }}>
                  {renderPropertyWithIndicator(prop, true)}
                </div>
              );
            })}
          </div>
        );
      } else {
        // If 1 property, render standalone
        sorted.forEach(prop => standalone.push(prop));
      }
    }

    // Render spacing group (Padding, Margin) - Responsive 2 columns that wrap with max width
    if (layoutGroups['spacing'] && layoutGroups['spacing'].length === 2) {
      const [paddingProp, marginProp] = layoutGroups['spacing'].sort((a, b) => {
        if (a.id === 'padding') return -1;
        if (b.id === 'padding') return 1;
        return 0;
      });
      const paddingMaxWidth = getMaxWidth(paddingProp);
      const marginMaxWidth = getMaxWidth(marginProp);
      const minWidth = paddingMaxWidth || marginMaxWidth ? '100px' : '150px';
      elements.push(
        <div key="spacing" className="flex flex-wrap gap-2 mb-1.5">
          <div style={{ flex: paddingMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: paddingMaxWidth, minWidth: minWidth }}>
            {renderPropertyWithIndicator(paddingProp, true)}
          </div>
          <div style={{ flex: marginMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: marginMaxWidth, minWidth: minWidth }}>
            {renderPropertyWithIndicator(marginProp, true)}
          </div>
        </div>
      );
    } else if (layoutGroups['spacing']) {
      layoutGroups['spacing'].forEach(prop => standalone.push(prop));
    }

    // Render border group (BorderWidth, BorderColor) - Responsive 2 columns that wrap with max width
    if (layoutGroups['border'] && layoutGroups['border'].length === 2) {
      const [widthProp, colorProp] = layoutGroups['border'].sort((a, b) => {
        if (a.id.toLowerCase().includes('width')) return -1;
        if (b.id.toLowerCase().includes('width')) return 1;
        return 0;
      });
      const borderWidthMaxWidth = getMaxWidth(widthProp);
      const borderColorMaxWidth = getMaxWidth(colorProp);
      const minWidth = borderWidthMaxWidth || borderColorMaxWidth ? '100px' : '150px';
      elements.push(
        <div key="border" className="flex flex-wrap gap-2 mb-1.5">
          <div style={{ flex: borderWidthMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: borderWidthMaxWidth, minWidth: minWidth }}>
            {renderPropertyWithIndicator(widthProp, true)}
          </div>
          <div style={{ flex: borderColorMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: borderColorMaxWidth, minWidth: minWidth }}>
            {renderPropertyWithIndicator(colorProp, true)}
          </div>
        </div>
      );
    } else if (layoutGroups['border']) {
      layoutGroups['border'].forEach(prop => standalone.push(prop));
    }

    // Render boolean groups in a 2-column grid
    if (layoutGroups['booleans'] && layoutGroups['booleans'].length >= 2) {
      elements.push(
        <div key="booleans" className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-2">
          {layoutGroups['booleans'].map(prop => (
            <div key={prop.id}>{renderPropertyWithIndicator(prop, true)}</div>
          ))}
        </div>
      );
    } else if (layoutGroups['booleans']) {
      layoutGroups['booleans'].forEach(prop => standalone.push(prop));
    }

    // Render custom layout groups - Responsive wrapping with max width
    Object.keys(layoutGroups).forEach(groupId => {
      if (!['flexItem', 'size', 'validation', 'spacing', 'border', 'booleans'].includes(groupId)) {
        const groupProps = layoutGroups[groupId];
        const minWidth = groupProps.length <= 2 ? '150px' : '100px';
        elements.push(
          <div key={groupId} className="flex flex-wrap gap-2 mb-1.5">
            {groupProps.map(prop => {
              const maxWidth = getMaxWidth(prop);
              return (
                <div key={prop.id} style={{ flex: maxWidth ? '0 1 auto' : '1 1 0%', maxWidth: maxWidth, minWidth: minWidth }}>
                  {renderPropertyWithIndicator(prop, true)}
                </div>
              );
            })}
          </div>
        );
      }
    });

    // Render standalone properties (full width) — use stacked layout for consistency with paired groups
    standalone.forEach(prop => {
      elements.push(
        <div key={prop.id} className="mb-1.5">
          {renderPropertyWithIndicator(prop, true)}
        </div>
      );
    });

    return <>{elements}</>;
  };

  // Use custom renderer if provided
  if (group.customGroupRenderer) {
    const CustomRenderer = group.customGroupRenderer;
    return (
      <div className="mb-1">
        <button
          onClick={toggleOpen}
          className="w-full flex justify-between items-center text-left text-[11px] font-semibold text-ed-text-secondary tracking-wide px-1 py-1.5 group/section transition-all duration-200 hover:text-ed-text"
          aria-expanded={isOpen}
          aria-controls={sectionId}
        >
          <div className="flex items-center gap-2">
            <span className="w-0.5 h-3.5 rounded-full bg-transparent group-hover/section:bg-ed-accent transition-all duration-200" />
            <span>{group.label}</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 text-ed-text-tertiary transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="border-b border-ed-border/30 mx-1" />
        <div
          id={sectionId}
          className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="px-1 pb-1.5 pt-1">
            <CustomRenderer
              group={group}
              properties={sortedProperties}
              context={context}
              onUpdate={onUpdate}
              onOpenExpressionEditor={onOpenExpressionEditor}
              getValue={getValue}
              getError={getError}
              isMixed={isMixed}
            />
          </div>
        </div>
      </div>
    );
  }

  if (group.collapsible === false) {
    return (
      <div className="mb-1">
        <h4 className="text-[11px] font-semibold text-ed-text-secondary tracking-wide px-1 pt-2 pb-1.5 flex items-center gap-2">
          <span className="w-0.5 h-3.5 rounded-full bg-transparent" />
          {group.label}
        </h4>
        <div className="border-b border-ed-border/30 mx-1" />
        <div className="px-1 pb-1.5 pt-1">
          {renderPropertyGroup(sortedProperties)}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={toggleOpen}
        className="w-full flex justify-between items-center text-left text-[11px] font-semibold text-ed-text-secondary tracking-wide px-1 py-1.5 group/section transition-all duration-200 hover:text-ed-text"
        aria-expanded={isOpen}
        aria-controls={sectionId}
      >
        <div className="flex items-center gap-2">
          <span className="w-0.5 h-3.5 rounded-full bg-transparent group-hover/section:bg-ed-accent transition-all duration-200" />
          <span>{group.label}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 text-ed-text-tertiary transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="border-b border-ed-border/30 mx-1" />
      <div
        id={sectionId}
        className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-1 pb-1.5 pt-1">
          {renderPropertyGroup(sortedProperties)}
        </div>
      </div>
    </div>
  );
};
