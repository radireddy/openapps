import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabsPlugin } from '@/components/component-registry/Tabs';
import { ComponentType, TabsProps } from '@/types';
import '@testing-library/jest-dom';

const TabsRenderer = TabsPlugin.renderer;

describe('TabsPlugin', () => {
  describe('Plugin metadata', () => {
    it('should have TABS type', () => {
      expect(TabsPlugin.type).toBe(ComponentType.TABS);
    });

    it('should be a container', () => {
      expect(TabsPlugin.isContainer).toBe(true);
    });

    it('should return null for properties', () => {
      expect(TabsPlugin.properties()).toBeNull();
    });

    it('should have correct palette label', () => {
      expect(TabsPlugin.paletteConfig.label).toBe('Tabs');
    });
  });

  describe('Renderer', () => {
    const mockOnUpdateDataStore = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    const baseComponent = {
      id: 'tabs1',
      type: ComponentType.TABS,
      props: {
        x: 0, y: 0, width: '100%', height: 'auto',
        tabs: 'Tab A,Tab B,Tab C',
        defaultActiveTab: 0,
        variant: 'line',
        tabPosition: 'top',
        onChange: '',
        fullWidth: false,
        backgroundColor: 'transparent',
        borderRadius: '0',
        padding: '0',
      } as TabsProps,
    };

    it('should render tab buttons from comma-separated string', () => {
      render(
        <TabsRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByRole('tab', { name: 'Tab A' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab B' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab C' })).toBeInTheDocument();
    });

    it('should have first tab selected by default', () => {
      render(
        <TabsRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const tabA = screen.getByRole('tab', { name: 'Tab A' });
      expect(tabA).toHaveAttribute('aria-selected', 'true');

      const tabB = screen.getByRole('tab', { name: 'Tab B' });
      expect(tabB).toHaveAttribute('aria-selected', 'false');
    });

    it('should set active tab from dataStore', () => {
      render(
        <TabsRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          dataStore={{ tabs1_activeTab: 1 }}
        />
      );
      const tabB = screen.getByRole('tab', { name: 'Tab B' });
      expect(tabB).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch tab on click', () => {
      render(
        <TabsRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Tab B' }));
      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('tabs1_activeTab', 1);
    });

    it('should render tablist with correct ARIA role', () => {
      render(
        <TabsRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should render tabpanel with correct ARIA attributes', () => {
      render(
        <TabsRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', 'tab-tabs1-0');
      expect(panel).toHaveAttribute('id', 'panel-tabs1-0');
    });

    it('should set tabIndex=0 on active tab and -1 on inactive tabs', () => {
      render(
        <TabsRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByRole('tab', { name: 'Tab A' })).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('tab', { name: 'Tab B' })).toHaveAttribute('tabindex', '-1');
      expect(screen.getByRole('tab', { name: 'Tab C' })).toHaveAttribute('tabindex', '-1');
    });

    it('should navigate right with ArrowRight key', () => {
      render(
        <TabsRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'ArrowRight' });
      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('tabs1_activeTab', 1);
    });

    it('should navigate left with ArrowLeft key', () => {
      render(
        <TabsRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          dataStore={{ tabs1_activeTab: 2 }}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'ArrowLeft' });
      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('tabs1_activeTab', 1);
    });

    it('should navigate to first with Home key', () => {
      render(
        <TabsRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          dataStore={{ tabs1_activeTab: 2 }}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'Home' });
      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('tabs1_activeTab', 0);
    });

    it('should navigate to last with End key', () => {
      render(
        <TabsRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'End' });
      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('tabs1_activeTab', 2);
    });

    it('should wrap around from last to first with ArrowRight', () => {
      render(
        <TabsRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          dataStore={{ tabs1_activeTab: 2 }}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'ArrowRight' });
      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('tabs1_activeTab', 0);
    });

    it('should show placeholder for empty tab panel in edit mode', () => {
      render(
        <TabsRenderer component={baseComponent} mode="edit" evaluationScope={{}} />
      );
      expect(screen.getByText(/Drop components here for.*Tab A/)).toBeInTheDocument();
    });

    it('should filter children by slot matching active tab', () => {
      const child0 = <div key="c0" component={{ id: 'c0', slot: 0 } as any}>Content for Tab A</div>;
      const child1 = <div key="c1" component={{ id: 'c1', slot: 1 } as any}>Content for Tab B</div>;

      render(
        <TabsRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          dataStore={{ tabs1_activeTab: 0 }}
        >
          {child0}
          {child1}
        </TabsRenderer>
      );
      expect(screen.getByText('Content for Tab A')).toBeInTheDocument();
      expect(screen.queryByText('Content for Tab B')).not.toBeInTheDocument();
    });

    it('should render data-testid on wrapper', () => {
      render(
        <TabsRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByTestId('tabs-tabs1')).toBeInTheDocument();
    });

    it('should use fallback tab names when tabs prop is empty', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, tabs: undefined },
      };
      render(
        <TabsRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    });

    it('should respect defaultActiveTab prop', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, defaultActiveTab: 2 },
      };
      render(
        <TabsRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const tabC = screen.getByRole('tab', { name: 'Tab C' });
      expect(tabC).toHaveAttribute('aria-selected', 'true');
    });

    it('should execute onChange handler in preview mode on tab switch', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, onChange: '{{actions.updateVariable("activeTab", activeTab)}}' },
      };
      render(
        <TabsRenderer
          component={comp}
          mode="preview"
          evaluationScope={{}}
          actions={mockActions}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Tab B' }));
      expect(mockActions.updateVariable).toHaveBeenCalledWith('activeTab', 1);
    });

    it('should render tabs at bottom when tabPosition is bottom', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, tabPosition: 'bottom' },
      };
      const { container } = render(
        <TabsRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.flexDirection).toBe('column-reverse');
    });

    it('should apply pill variant styles', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, variant: 'pill' },
      };
      render(
        <TabsRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const activeTab = screen.getByRole('tab', { name: 'Tab A' });
      expect(activeTab.style.borderRadius).toBe('9999px');
    });

    it('should apply fullWidth styling', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, fullWidth: true },
      };
      render(
        <TabsRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const tab = screen.getByRole('tab', { name: 'Tab A' });
      expect(tab.style.flex).toBe('1');
    });
  });
});
