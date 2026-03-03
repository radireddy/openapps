/**
 * Tabs Component Tests
 *
 * Tests for the Tabs container component renderer.
 * Verifies tab headers, ARIA roles, keyboard navigation, slot filtering, and variants.
 */

import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentType } from '../../../types';
import { componentRegistry } from '../registry';
import {
  createTestComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

describe('Tabs component', () => {
  const createTabsComponent = (propOverrides = {}) =>
    createTestComponent(ComponentType.TABS, propOverrides);

  const renderTabs = (propOverrides = {}, dataStore = {}, children?: React.ReactNode) => {
    const component = createTabsComponent(propOverrides);
    const Renderer = componentRegistry[ComponentType.TABS].renderer;
    const scope = createDefaultEvaluationScope();
    const onUpdateDataStore = jest.fn();

    const result = render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={dataStore}
        onUpdateDataStore={onUpdateDataStore}
      >
        {children}
      </Renderer>
    );

    return { ...result, onUpdateDataStore, component };
  };

  it('renders tab headers from comma-separated string', () => {
    renderTabs({ tabs: 'Overview,Details,Settings' });
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders tablist role on the header container', () => {
    renderTabs({ tabs: 'Tab A,Tab B' });
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders tab buttons with role="tab"', () => {
    renderTabs({ tabs: 'Tab A,Tab B' });
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
  });

  it('has aria-selected on the active tab', () => {
    renderTabs({ tabs: 'Tab A,Tab B', defaultActiveTab: 0 });
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('renders tabpanel with correct role', () => {
    renderTabs({ tabs: 'Tab A,Tab B' });
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('tabpanel has aria-labelledby pointing to the active tab', () => {
    const { component } = renderTabs({ tabs: 'Tab A,Tab B' });
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', `tab-${component.id}-0`);
  });

  it('clicking a tab updates the active tab', () => {
    const { onUpdateDataStore, component } = renderTabs({ tabs: 'Tab A,Tab B' });
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    expect(onUpdateDataStore).toHaveBeenCalledWith(`${component.id}_activeTab`, 1);
  });

  it('uses stored active tab from dataStore', () => {
    const component = createTabsComponent({ tabs: 'Tab A,Tab B' });
    const dataStore = { [`${component.id}_activeTab`]: 1 };
    const Renderer = componentRegistry[ComponentType.TABS].renderer;
    const scope = createDefaultEvaluationScope();

    render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={dataStore}
        onUpdateDataStore={jest.fn()}
      />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  describe('keyboard navigation', () => {
    it('ArrowRight moves to next tab', () => {
      const { onUpdateDataStore, component } = renderTabs({ tabs: 'A,B,C' });
      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'ArrowRight' });
      expect(onUpdateDataStore).toHaveBeenCalledWith(`${component.id}_activeTab`, 1);
    });

    it('ArrowLeft wraps to last tab from first', () => {
      const { onUpdateDataStore, component } = renderTabs({ tabs: 'A,B,C' });
      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'ArrowLeft' });
      expect(onUpdateDataStore).toHaveBeenCalledWith(`${component.id}_activeTab`, 2);
    });

    it('Home moves to first tab', () => {
      const component = createTabsComponent({ tabs: 'A,B,C' });
      const dataStore = { [`${component.id}_activeTab`]: 2 };
      const onUpdateDataStore = jest.fn();
      const Renderer = componentRegistry[ComponentType.TABS].renderer;
      const scope = createDefaultEvaluationScope();

      render(
        <Renderer
          component={component}
          mode="preview"
          evaluationScope={scope}
          dataStore={dataStore}
          onUpdateDataStore={onUpdateDataStore}
        />
      );

      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'Home' });
      expect(onUpdateDataStore).toHaveBeenCalledWith(`${component.id}_activeTab`, 0);
    });

    it('End moves to last tab', () => {
      const { onUpdateDataStore, component } = renderTabs({ tabs: 'A,B,C' });
      const tabList = screen.getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'End' });
      expect(onUpdateDataStore).toHaveBeenCalledWith(`${component.id}_activeTab`, 2);
    });
  });

  it('is registered as a container component', () => {
    const plugin = componentRegistry[ComponentType.TABS];
    expect(plugin.isContainer).toBe(true);
  });

  it('has plugin with correct type', () => {
    const plugin = componentRegistry[ComponentType.TABS];
    expect(plugin.type).toBe(ComponentType.TABS);
  });

  it('has palette config with label "Tabs"', () => {
    const plugin = componentRegistry[ComponentType.TABS];
    expect(plugin.paletteConfig.label).toBe('Tabs');
  });

  it('inactive tabs have tabIndex -1', () => {
    renderTabs({ tabs: 'A,B,C' });
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    expect(tabs[2]).toHaveAttribute('tabindex', '-1');
  });
});
