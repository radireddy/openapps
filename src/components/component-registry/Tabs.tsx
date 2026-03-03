/**
 * Tabs Component
 *
 * Tabbed content panels with WAI-ARIA tabs pattern.
 * Children are assigned to panels via the `slot` field on AppComponent.
 * Only the active panel's children are rendered (unmount inactive).
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ComponentType, TabsProps, ComponentRendererProps } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { safeEval } from '../../expressions/engine';
import { buildBorderStyles, buildSpacingStyles } from './common';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const TabsRenderer: React.FC<ComponentRendererProps> = ({
  component,
  children,
  mode,
  actions,
  evaluationScope,
  dataStore,
  onUpdateDataStore,
}) => {
  const p = component.props as TabsProps;
  const scope = evaluationScope || {};

  const tabsStr = useJavaScriptRenderer(p.tabs, scope, 'Tab 1,Tab 2');
  const tabNames = useMemo(() => {
    const str = typeof tabsStr === 'string' ? tabsStr : 'Tab 1,Tab 2';
    return str.split(',').map((t: string) => t.trim()).filter(Boolean);
  }, [tabsStr]);

  const defaultTab = p.defaultActiveTab ?? 0;
  const variant = p.variant || 'line';
  const tabPosition = p.tabPosition || 'top';
  const fullWidth = p.fullWidth ?? false;

  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, scope, 'transparent');
  const borderRadius = useJavaScriptRenderer(p.borderRadius, scope, '0');
  const padding = useJavaScriptRenderer(p.padding, scope, '0');

  // Active tab state — stored in dataStore for persistence
  const stateKey = `${component.id}_activeTab`;
  const storedTab = dataStore?.[stateKey];
  const activeTab = typeof storedTab === 'number' ? storedTab : defaultTab;

  const tabListRef = useRef<HTMLDivElement>(null);

  const setActiveTab = useCallback((index: number) => {
    if (onUpdateDataStore) {
      onUpdateDataStore(stateKey, index);
    }
    // Execute onChange expression
    if (p.onChange && mode === 'preview') {
      try {
        const changeScope = { ...scope, actions, activeTab: index, tabName: tabNames[index] };
        const expr = p.onChange.startsWith('{{') && p.onChange.endsWith('}}')
          ? p.onChange.substring(2, p.onChange.length - 2).trim()
          : p.onChange;
        safeEval(expr, changeScope);
      } catch (error) {
        console.error('Error executing tabs onChange:', error);
      }
    }
  }, [stateKey, onUpdateDataStore, p.onChange, mode, scope, actions, tabNames]);

  // Keyboard navigation (WAI-ARIA tabs pattern)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const count = tabNames.length;
    if (count === 0) return;

    let newIndex = activeTab;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (activeTab + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (activeTab - 1 + count) % count;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = count - 1;
        break;
      default:
        return;
    }
    setActiveTab(newIndex);

    // Focus the new tab button
    if (tabListRef.current) {
      const buttons = tabListRef.current.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons[newIndex]?.focus();
    }
  }, [activeTab, tabNames.length, setActiveTab]);

  // Filter children by slot matching active tab index
  const activeChildren = useMemo(() => {
    if (!children) return null;
    const childArray = React.Children.toArray(children);
    return childArray.filter((child) => {
      if (!React.isValidElement(child)) return false;
      const childProps = child.props as any;
      const comp = childProps?.component;
      if (!comp) return true; // If no component prop, show in all tabs
      const slot = comp.slot ?? 0;
      return slot === activeTab;
    });
  }, [children, activeTab]);

  // ─── Tab header styles by variant ──────────────────────────
  const getTabStyle = (index: number, isActive: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: isActive ? 600 : 400,
      border: 'none',
      background: 'none',
      color: isActive ? '#3b82f6' : '#64748b',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
      flex: fullWidth ? 1 : undefined,
      textAlign: 'center',
    };

    switch (variant) {
      case 'pill':
        return {
          ...base,
          borderRadius: '9999px',
          backgroundColor: isActive ? '#3b82f6' : 'transparent',
          color: isActive ? '#ffffff' : '#64748b',
        };
      case 'card':
        return {
          ...base,
          borderRadius: '6px 6px 0 0',
          border: isActive ? '1px solid #e2e8f0' : '1px solid transparent',
          borderBottom: isActive ? '1px solid #ffffff' : '1px solid transparent',
          backgroundColor: isActive ? '#ffffff' : 'transparent',
          marginBottom: '-1px',
        };
      case 'enclosed':
        return {
          ...base,
          border: '1px solid',
          borderColor: isActive ? '#e2e8f0' : 'transparent',
          borderBottom: isActive ? 'none' : '1px solid #e2e8f0',
          backgroundColor: isActive ? '#ffffff' : 'transparent',
          borderRadius: '6px 6px 0 0',
          marginBottom: '-1px',
        };
      case 'line':
      default:
        return {
          ...base,
          borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        };
    }
  };

  const tabListStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: variant === 'line' || variant === 'enclosed' ? '1px solid #e2e8f0' : undefined,
    gap: variant === 'pill' ? '4px' : '0',
    flexShrink: 0,
    overflowX: 'auto',
  };

  const panelStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'stretch',
    padding: typeof padding === 'string' ? padding : `${padding}px`,
    minHeight: '40px',
  };

  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100%',
    display: 'flex',
    flexDirection: tabPosition === 'bottom' ? 'column-reverse' : 'column',
    backgroundColor: typeof backgroundColor === 'string' ? backgroundColor : undefined,
    borderRadius: typeof borderRadius === 'string' ? borderRadius : `${borderRadius}px`,
    boxSizing: 'border-box',
  };

  return (
    <div style={wrapperStyle} data-testid={`tabs-${component.id}`}>
      {/* Tab header list */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Tabs"
        onKeyDown={handleKeyDown}
        style={tabListStyle}
      >
        {tabNames.map((name, index) => {
          const isActive = index === activeTab;
          return (
            <button
              key={index}
              role="tab"
              id={`tab-${component.id}-${index}`}
              aria-selected={isActive}
              aria-controls={`panel-${component.id}-${index}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(index)}
              style={getTabStyle(index, isActive)}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Active tab panel */}
      <div
        role="tabpanel"
        id={`panel-${component.id}-${activeTab}`}
        aria-labelledby={`tab-${component.id}-${activeTab}`}
        style={panelStyle}
      >
        {mode === 'edit' && (!activeChildren || (activeChildren as any[]).length === 0) && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '13px',
            border: '1px dashed #cbd5e1',
            borderRadius: '4px',
          }}>
            Drop components here for &ldquo;{tabNames[activeTab] || `Tab ${activeTab + 1}`}&rdquo;
          </div>
        )}
        {activeChildren}
      </div>
    </div>
  );
};

export const TabsPlugin = {
  type: ComponentType.TABS,
  isContainer: true,
  paletteConfig: {
    label: 'Tabs',
    icon: React.createElement('svg', {
      style: iconStyle,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    },
      React.createElement('rect', {
        x: '3', y: '6', width: '18', height: '14', rx: '2',
        stroke: 'currentColor', strokeWidth: '2',
      }),
      React.createElement('path', {
        d: 'M3 10h18',
        stroke: 'currentColor', strokeWidth: '1.5',
      }),
      React.createElement('path', {
        d: 'M9 6V10',
        stroke: 'currentColor', strokeWidth: '1.5',
      }),
      React.createElement('path', {
        d: 'M15 6V10',
        stroke: 'currentColor', strokeWidth: '1.5',
      }),
    ),
    defaultProps: {
      width: '100%',
      height: 'auto',
      minHeight: 100,
      backgroundColor: '{{theme.colors.surface}}',
      borderWidth: '{{theme.border.width}}',
      borderColor: '{{theme.colors.border}}',
      borderRadius: '{{theme.radius.default}}',
      padding: '{{theme.spacing.sm}}',
      tabs: 'Tab 1,Tab 2,Tab 3',
      defaultActiveTab: 0,
      variant: 'line',
      tabPosition: 'top',
      onChange: '',
      fullWidth: false,
    },
  },
  renderer: TabsRenderer,
  properties: () => null,
};
