import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

// Mock the component registry
jest.mock('components/component-registry/registry', () => {
  const types = require('types');
  return {
    componentRegistry: {
      [types.ComponentType.LABEL]: {
        paletteConfig: { label: 'Label' },
      },
    },
  };
});

// Mock the property registry - all components are migrated
jest.mock('components/properties/registry', () => ({
  propertyRegistry: {
    LABEL: {
      componentType: 'LABEL',
      tabs: [{ id: 'General', label: 'General', order: 0 }],
      groups: [],
      properties: [],
    },
  },
}));

// Mock PropertiesPanelCore
jest.mock('components/properties/PropertiesPanelCore', () => ({
  PropertiesPanelCore: ({ components, selectedComponentIds }: any) => {
    if (selectedComponentIds.length === 0) {
      return <div>Select a component to see its properties.</div>;
    }
    const component = components.find((c: any) => c.id === selectedComponentIds[0]);
    return <div>Properties for {component?.props?.text || 'Component'}</div>;
  },
}));

// Mock ResizeObserver (not available in jsdom)
beforeEach(() => {
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('PropertiesPanel', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    onUpdate,
    width: 288,
    isCollapsed: false,
    onToggleCollapse: jest.fn(),
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
  };

  it('should show a message when no component is selected', () => {
    render(<PropertiesPanel {...baseProps} components={[]} selectedComponentIds={[]} />);
    expect(screen.getByText(/Select a component to view its properties/i)).toBeInTheDocument();
  });

  it('should render the properties for a single selected component', () => {
    const components = [
      { id: 'comp1', type: ComponentType.LABEL, props: { text: 'My Label' } } as any,
    ];
    render(<PropertiesPanel {...baseProps} components={components} selectedComponentIds={['comp1']} />);
    expect(screen.getByText('Properties for My Label')).toBeInTheDocument();
    expect(screen.getByText(/comp1/i)).toBeInTheDocument();
  });

  it('should render properties for multiple selected components using metadata system', () => {
    const components = [
      { id: 'comp1', type: ComponentType.LABEL, props: { text: 'Label 1' } } as any,
      { id: 'comp2', type: ComponentType.LABEL, props: { text: 'Label 2' } } as any,
    ];
    render(<PropertiesPanel {...baseProps} components={components} selectedComponentIds={['comp1', 'comp2']} />);
    // With metadata system, multi-select shows PropertiesPanelCore which handles common properties
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
  });
});