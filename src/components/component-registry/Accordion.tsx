/**
 * Accordion Component
 *
 * Collapsible sections with WAI-ARIA accordion pattern.
 * Children are assigned to sections via the `slot` field on AppComponent.
 * Supports single or multiple expanded sections.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ComponentType, AccordionProps, ComponentRendererProps } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { safeEval } from '../../expressions/engine';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const ChevronIcon: React.FC<{ expanded: boolean; position: 'left' | 'right' }> = ({ expanded, position }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.2s ease',
      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      flexShrink: 0,
      order: position === 'left' ? -1 : 1,
    }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const AccordionRenderer: React.FC<ComponentRendererProps> = ({
  component,
  children,
  mode,
  actions,
  evaluationScope,
  dataStore,
  onUpdateDataStore,
}) => {
  const p = component.props as AccordionProps;
  const scope = evaluationScope || {};

  const sectionsStr = useJavaScriptRenderer(p.sections, scope, 'Section 1,Section 2');
  const sectionNames = useMemo(() => {
    const str = typeof sectionsStr === 'string' ? sectionsStr : 'Section 1,Section 2';
    return str.split(',').map((s: string) => s.trim()).filter(Boolean);
  }, [sectionsStr]);

  const allowMultiple = p.allowMultiple ?? false;
  const variant = p.variant || 'default';
  const iconPosition = p.iconPosition || 'right';

  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, scope, 'transparent');
  const borderRadius = useJavaScriptRenderer(p.borderRadius, scope, '0');

  // Expanded state — stored in dataStore
  const stateKey = `${component.id}_expanded`;
  const storedExpanded = dataStore?.[stateKey];

  const expandedSet: Set<number> = useMemo(() => {
    if (Array.isArray(storedExpanded)) return new Set(storedExpanded);
    // Parse defaultExpanded
    if (p.defaultExpanded) {
      const indices = p.defaultExpanded.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      return new Set(indices);
    }
    return new Set([0]); // First section expanded by default
  }, [storedExpanded, p.defaultExpanded]);

  const toggleSection = useCallback((index: number) => {
    const newSet = new Set(expandedSet);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      if (!allowMultiple) {
        newSet.clear();
      }
      newSet.add(index);
    }
    if (onUpdateDataStore) {
      onUpdateDataStore(stateKey, Array.from(newSet));
    }
    // Execute onChange
    if (p.onChange && mode === 'preview') {
      try {
        const changeScope = { ...scope, actions, expandedSections: Array.from(newSet), sectionIndex: index };
        const expr = p.onChange.startsWith('{{') && p.onChange.endsWith('}}')
          ? p.onChange.substring(2, p.onChange.length - 2).trim()
          : p.onChange;
        safeEval(expr, changeScope);
      } catch (error) {
        console.error('Error executing accordion onChange:', error);
      }
    }
  }, [expandedSet, allowMultiple, stateKey, onUpdateDataStore, p.onChange, mode, scope, actions]);

  // Keyboard navigation
  const headerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const count = sectionNames.length;
    let newIndex = index;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (index + 1) % count;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (index - 1 + count) % count;
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
    headerRefs.current[newIndex]?.focus();
  }, [sectionNames.length]);

  // Filter children by slot
  const getChildrenForSection = useCallback((sectionIndex: number) => {
    if (!children) return null;
    const childArray = React.Children.toArray(children);
    return childArray.filter((child) => {
      if (!React.isValidElement(child)) return false;
      const childProps = child.props as any;
      const comp = childProps?.component;
      if (!comp) return true;
      const slot = comp.slot ?? 0;
      return slot === sectionIndex;
    });
  }, [children]);

  // ─── Variant styles ────────────────────────────────────────
  const getWrapperStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '100%',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: typeof backgroundColor === 'string' ? backgroundColor : undefined,
      borderRadius: typeof borderRadius === 'string' ? borderRadius : `${borderRadius}px`,
      boxSizing: 'border-box',
    };
    if (variant === 'separated') {
      base.gap = '8px';
    }
    return base;
  };

  const getSectionStyle = (index: number, isExpanded: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {};
    switch (variant) {
      case 'bordered':
        base.border = '1px solid #e2e8f0';
        if (index === 0) base.borderRadius = '6px 6px 0 0';
        if (index === sectionNames.length - 1) base.borderRadius = isExpanded ? undefined : '0 0 6px 6px';
        if (index > 0) base.borderTop = 'none';
        break;
      case 'separated':
        base.border = '1px solid #e2e8f0';
        base.borderRadius = '6px';
        break;
      default:
        if (index > 0) base.borderTop = '1px solid #e2e8f0';
        break;
    }
    return base;
  };

  const headerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1e293b',
    textAlign: 'left',
    gap: '8px',
  };

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'stretch',
    padding: '0 16px 16px',
    minHeight: '20px',
  };

  // In edit mode, show all sections expanded for editing
  const isEditMode = mode === 'edit';

  return (
    <div style={getWrapperStyle()} data-testid={`accordion-${component.id}`}>
      {sectionNames.map((name, index) => {
        const isExpanded = isEditMode || expandedSet.has(index);
        const sectionChildren = getChildrenForSection(index);
        const hasChildren = sectionChildren && (sectionChildren as any[]).length > 0;

        return (
          <div key={index} style={getSectionStyle(index, isExpanded)}>
            {/* Section header */}
            <h3 style={{ margin: 0 }}>
              <button
                ref={(el) => { headerRefs.current[index] = el; }}
                id={`header-${component.id}-${index}`}
                aria-expanded={isExpanded}
                aria-controls={`panel-${component.id}-${index}`}
                onClick={() => toggleSection(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={headerStyle}
              >
                {iconPosition === 'left' && <ChevronIcon expanded={isExpanded} position="left" />}
                <span style={{ flex: 1 }}>{name}</span>
                {iconPosition === 'right' && <ChevronIcon expanded={isExpanded} position="right" />}
              </button>
            </h3>

            {/* Section panel */}
            {isExpanded && (
              <div
                role="region"
                id={`panel-${component.id}-${index}`}
                aria-labelledby={`header-${component.id}-${index}`}
                style={panelStyle}
              >
                {isEditMode && !hasChildren && (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13px',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '4px',
                  }}>
                    Drop components here for &ldquo;{name}&rdquo;
                  </div>
                )}
                {sectionChildren}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const AccordionPlugin = {
  type: ComponentType.ACCORDION,
  isContainer: true,
  paletteConfig: {
    label: 'Accordion',
    icon: React.createElement('svg', {
      style: iconStyle,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    },
      React.createElement('rect', {
        x: '3', y: '3', width: '18', height: '4', rx: '1',
        stroke: 'currentColor', strokeWidth: '2',
      }),
      React.createElement('rect', {
        x: '3', y: '10', width: '18', height: '4', rx: '1',
        stroke: 'currentColor', strokeWidth: '2',
      }),
      React.createElement('rect', {
        x: '3', y: '17', width: '18', height: '4', rx: '1',
        stroke: 'currentColor', strokeWidth: '2',
      }),
    ),
    defaultProps: {
      width: '100%',
      height: 'auto',
      minHeight: 80,
      backgroundColor: '{{theme.colors.surface}}',
      borderWidth: '{{theme.border.width}}',
      borderColor: '{{theme.colors.border}}',
      borderRadius: '{{theme.radius.default}}',
      padding: '0',
      sections: 'Section 1,Section 2,Section 3',
      allowMultiple: false,
      defaultExpanded: '0',
      variant: 'default',
      onChange: '',
      iconPosition: 'right',
    },
  },
  renderer: AccordionRenderer,
  properties: () => null,
};
