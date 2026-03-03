import React, { useState } from 'react';
import { PropertyTab, PropertyGroup, PropertyMetadata, PropertyContext } from './metadata';
import { PropertyGroup as PropertyGroupComponent, AllowCustomDropdown } from './PropertyGroup';
import { PropFxInput, PropInput, PropSelect } from '../component-registry/common';
import { DEFAULT_GROUP_ORDER } from './registry';
import type { BreakpointKey } from '@/types';

interface PropertyTabsProps {
  tabs: PropertyTab[];
  groups: PropertyGroup[];
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

export const PropertyTabs: React.FC<PropertyTabsProps> = ({
  tabs,
  groups,
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
  // Helper function to render a property using PropFxInput, PropInput, PropSelect
  const renderProperty = (prop: PropertyMetadata) => {
    const value = getValue(prop.id);
    const error = getError(prop.id);
    const mixed = isMixed(prop.id);
    const displayValue = mixed ? '— Mixed —' : (value ?? prop.defaultValue ?? '');

    // Handle custom renderer
    if (prop.customRenderer) {
      const CustomRenderer = prop.customRenderer;
      return (
        <CustomRenderer
          key={prop.id}
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
          <div key={prop.id} style={isExpressionBound ? { borderLeft: '2px solid', borderImage: 'linear-gradient(to bottom, #818cf8, #6366f1) 1', paddingLeft: '6px' } : undefined}>
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
              className="mb-1.5"
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
            key={prop.id}
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type="number"
            placeholder={prop.placeholder}
            className="mb-1.5"
          />
        );

      case 'boolean': {
        const boolSupportsExpr = prop.supportsExpression === true;
        const isExpressionValue = typeof value === 'string' && value.startsWith('{{');

        // Expression mode: value is an expression string → render PropFxInput
        if (boolSupportsExpr && isExpressionValue) {
          return (
            <PropFxInput
              key={prop.id}
              label={prop.label}
              value={displayValue}
              onChange={(val) => {
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
              className="mb-1.5"
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
            <div key={prop.id} className="mb-1.5">
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
          <div key={prop.id} className="mb-1.5">
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
            key={prop.id}
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type="color"
            onOpenEditor={prop.supportsExpression && onOpenExpressionEditor ? (val) => {
              const currentValue = String(value || prop.defaultValue || '#000000');
              onOpenExpressionEditor(currentValue, (newVal) => onUpdate(prop.id, newVal));
            } : undefined}
            className="mb-1.5"
          />
        );

      case 'dropdown':
        const options = prop.options
          ? (typeof prop.options === 'function' ? prop.options(context) : prop.options)
          : [];

        if (prop.allowCustom) {
          return (
            <AllowCustomDropdown
              key={prop.id}
              prop={prop}
              value={mixed ? '' : (value ?? prop.defaultValue ?? '')}
              options={options.map(opt => ({ value: opt.value, label: opt.label }))}
              onChange={(val) => onUpdate(prop.id, val)}
              onOpenExpressionEditor={onOpenExpressionEditor}
            />
          );
        }

        return (
          <PropSelect
            key={prop.id}
            label={prop.label}
            value={mixed ? '' : (value ?? prop.defaultValue ?? (options[0]?.value || ''))}
            onChange={(val) => onUpdate(prop.id, val)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            className="mb-1.5"
          />
        );

      case 'composite':
        if (!prop.compositeFields) {
          return <div key={prop.id} className="text-ed-danger text-xs mb-1.5">Composite property missing field definitions</div>;
        }

        const compositeValue = value || {};
        return (
          <div key={prop.id} className="mb-1.5">
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
          <div key={prop.id} className="text-ed-danger text-xs mb-1.5">
            Unsupported property type: {prop.type}
          </div>
        );
    }
  };

  // Sort tabs by order
  const sortedTabs = [...tabs].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });

  const [activeTab, setActiveTab] = useState(sortedTabs[0]?.id || '');

  // Deduplicate properties by id (first occurrence wins)
  const uniqueProperties: PropertyMetadata[] = Array.from(
    new Map(properties.map(p => [p.id, p])).values()
  ) as PropertyMetadata[];

  // Group properties by tab and then by group
  const propertiesByTab = sortedTabs.reduce((acc, tab) => {
    const tabProperties = uniqueProperties.filter((p): p is PropertyMetadata => p.tab === tab.id);
    const propertiesByGroup = groups
      .filter((g) => g.tab === tab.id)
      .reduce((groupAcc, group) => {
        const groupProperties = tabProperties.filter((p): p is PropertyMetadata => p.group === group.id);
        if (groupProperties.length > 0) {
          groupAcc[group.id] = groupProperties;
        }
        return groupAcc;
      }, {} as Record<string, PropertyMetadata[]>);

    // Properties without a group go into a default group
    const ungroupedProperties = tabProperties.filter((p): p is PropertyMetadata => !p.group);
    if (ungroupedProperties.length > 0) {
      propertiesByGroup['__ungrouped__'] = ungroupedProperties;
    }

    acc[tab.id] = {
      properties: tabProperties,
      groups: groups.filter((g) => g.tab === tab.id),
      propertiesByGroup,
    };
    return acc;
  }, {} as Record<string, { properties: PropertyMetadata[]; groups: PropertyGroup[]; propertiesByGroup: Record<string, PropertyMetadata[]> }>);

  const activeTabData = propertiesByTab[activeTab];

  // If no tabs, render all properties in a single view
  if (sortedTabs.length === 0) {
    // Group properties by group
    const propertiesByGroup = groups.reduce((acc, group) => {
      const groupProperties = uniqueProperties.filter((p): p is PropertyMetadata => p.group === group.id);
      if (groupProperties.length > 0) {
        acc[group.id] = groupProperties;
      }
      return acc;
    }, {} as Record<string, PropertyMetadata[]>);

    // Ungrouped properties
    const ungroupedProperties = uniqueProperties.filter((p): p is PropertyMetadata => !p.group);

    return (
      <div className="flex flex-col h-full overflow-y-auto p-2">
        {groups
          .sort((a, b) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            return orderA - orderB;
          })
          .map((group) => {
            const groupProperties = propertiesByGroup[group.id] || [];
            if (groupProperties.length === 0) return null;
            return (
              <PropertyGroupComponent
                key={group.id}
                group={group}
                properties={groupProperties}
                context={context}
                onUpdate={onUpdate}
                onOpenExpressionEditor={onOpenExpressionEditor}
                getValue={getValue}
                getError={getError}
                isMixed={isMixed}
                activeBreakpoint={activeBreakpoint}
                componentProps={componentProps}
                onResetOverride={onResetOverride}
              />
            );
          })}
        {ungroupedProperties.length > 0 && (
          <div className="py-2">
            {ungroupedProperties.map((prop: PropertyMetadata) => renderProperty(prop))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex gap-1 p-1 mx-2 mt-1.5 bg-ed-bg-secondary/50 rounded-lg overflow-x-auto">
        {sortedTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-ed-accent/10 text-ed-accent-text shadow-sm'
                : 'text-ed-text-tertiary hover:text-ed-text-secondary hover:bg-ed-bg-hover/50'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && <span className="flex-shrink-0 opacity-70">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-2.5 pt-2 pb-2" role="tabpanel">
        {activeTabData && (
          <>
            {/* Render grouped properties */}
            {activeTabData.groups
              .sort((a, b) => {
                // Use orderOverride if provided, otherwise use order, otherwise use default order
                const orderA = a.orderOverride ?? a.order ?? DEFAULT_GROUP_ORDER[a.id] ?? 999;
                const orderB = b.orderOverride ?? b.order ?? DEFAULT_GROUP_ORDER[b.id] ?? 999;
                return orderA - orderB;
              })
              .map((group) => {
                const groupProperties = activeTabData.propertiesByGroup[group.id] || [];
                if (groupProperties.length === 0) return null;
                return (
                  <PropertyGroupComponent
                    key={group.id}
                    group={group}
                    properties={groupProperties}
                    context={context}
                    onUpdate={onUpdate}
                    onOpenExpressionEditor={onOpenExpressionEditor}
                    getValue={getValue}
                    getError={getError}
                    isMixed={isMixed}
                  />
                );
              })}

            {/* Render ungrouped properties */}
            {activeTabData.propertiesByGroup['__ungrouped__'] && (
              <div className="py-2">
                {activeTabData.propertiesByGroup['__ungrouped__'].map((prop) => renderProperty(prop))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

