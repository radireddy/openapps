import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListPlugin, ListComponentRenderer } from '@/components/component-registry/List';
import { ListContext, ListContextValue } from '@/components/component-registry/ListContext';
import { ComponentType, AppComponent } from '@/types';
import '@testing-library/jest-dom';

const ListRenderer = ListPlugin.renderer;

const createMockListContext = (overrides: Partial<ListContextValue> = {}): ListContextValue => ({
  allComponents: [],
  selectedComponentIds: [],
  onSelect: jest.fn(),
  onUpdate: jest.fn(),
  onUpdateComponents: jest.fn(),
  onDelete: jest.fn(),
  onDrop: jest.fn(),
  onReparentCheck: jest.fn(),
  dataStore: {},
  onUpdateDataStore: jest.fn(),
  actions: undefined,
  currentComponentId: undefined,
  ...overrides,
});

describe('ListPlugin', () => {
  describe('Plugin metadata', () => {
    it('should have correct type', () => {
      expect(ListPlugin.type).toBe(ComponentType.LIST);
    });

    it('should be a container', () => {
      expect(ListPlugin.isContainer).toBe(true);
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'list1',
      type: ComponentType.LIST,
      props: {
        x: 0, y: 0, width: '400px', height: '600px',
        backgroundColor: '{{theme.colors.surface}}',
        borderWidth: '{{theme.border.width}}',
        borderColor: '{{theme.colors.border}}',
        borderRadius: '{{theme.radius.default}}',
        padding: '{{theme.spacing.sm}}',
        data: '{{[]}}',
        itemKey: '{{index}}',
        templateHeight: 120,
        itemSpacing: 8,
        emptyState: 'No items found',
        templateChildren: [],
      },
    };

    const evaluationScope = {
      theme: {
        colors: {
          surface: '#ffffff',
          border: '#d1d5db',
          primary: '#4f46e5',
          secondary: '#6366f1',
        },
        spacing: { sm: '8px' },
        border: { width: '1px' },
        radius: { default: '8px' },
      },
    };

    it('should render with empty data and show empty state text in preview mode', () => {
      const listComponent = {
        id: 'list1',
        type: ComponentType.LIST,
        props: baseComponent.props,
        parentId: null,
        pageId: 'page1',
      };
      const context = createMockListContext({
        allComponents: [listComponent],
        currentComponentId: 'list1',
      });

      render(
        <ListContext.Provider value={context}>
          <ListRenderer
            component={baseComponent}
            mode="preview"
            evaluationScope={evaluationScope}
          >
            {null}
          </ListRenderer>
        </ListContext.Provider>
      );
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should render edit template button in edit mode', () => {
      const listComponent = {
        id: 'list1',
        type: ComponentType.LIST,
        props: baseComponent.props,
        parentId: null,
        pageId: 'page1',
      };
      const context = createMockListContext({
        allComponents: [listComponent],
        currentComponentId: 'list1',
      });

      render(
        <ListContext.Provider value={context}>
          <ListRenderer
            component={baseComponent}
            mode="edit"
            evaluationScope={evaluationScope}
          >
            {null}
          </ListRenderer>
        </ListContext.Provider>
      );
      expect(screen.getByText('Edit Template')).toBeInTheDocument();
    });

    it('should render items when data is provided in preview mode', () => {
      const dataArray = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];
      const componentWithData = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          data: '{{items}}',
        },
      };
      const listComponent = {
        id: 'list1',
        type: ComponentType.LIST,
        props: componentWithData.props,
        parentId: null,
        pageId: 'page1',
      };
      const context = createMockListContext({
        allComponents: [listComponent],
        currentComponentId: 'list1',
      });
      const scopeWithData = {
        ...evaluationScope,
        items: dataArray,
      };

      render(
        <ListContext.Provider value={context}>
          <ListRenderer
            component={componentWithData}
            mode="preview"
            evaluationScope={scopeWithData}
          >
            {null}
          </ListRenderer>
        </ListContext.Provider>
      );
      // With data items present, the empty state should NOT appear
      expect(screen.queryByText('No items found')).not.toBeInTheDocument();
      // Verify the correct number of list items are rendered
      const listItems = document.querySelectorAll('[data-list-item="true"]');
      expect(listItems).toHaveLength(3);
    });
  });

  describe('Properties', () => {
    it('should return null (properties handled by metadata system)', () => {
      const PropertiesComponent = ListPlugin.properties;
      const result = PropertiesComponent({
        component: { id: 'list1', props: {} as any },
        updateProp: jest.fn(),
        onOpenExpressionEditor: jest.fn(),
      });
      expect(result).toBeNull();
    });
  });
});
