/**
 * Accordion Component Tests
 *
 * Tests for the Accordion container component renderer.
 * Verifies section headers, ARIA attributes, expand/collapse behavior,
 * allowMultiple, keyboard navigation, and variants.
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

describe('Accordion component', () => {
  const createAccordionComponent = (propOverrides = {}) =>
    createTestComponent(ComponentType.ACCORDION, propOverrides);

  const renderAccordion = (propOverrides = {}, dataStore = {}, mode: 'edit' | 'preview' = 'preview', children?: React.ReactNode) => {
    const component = createAccordionComponent(propOverrides);
    const Renderer = componentRegistry[ComponentType.ACCORDION].renderer;
    const scope = createDefaultEvaluationScope();
    const onUpdateDataStore = jest.fn();

    const result = render(
      <Renderer
        component={component}
        mode={mode}
        evaluationScope={scope}
        dataStore={dataStore}
        onUpdateDataStore={onUpdateDataStore}
      >
        {children}
      </Renderer>
    );

    return { ...result, onUpdateDataStore, component };
  };

  it('renders section headers from comma-separated string', () => {
    renderAccordion({ sections: 'Personal,Address,Payment' });
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('renders section header buttons with aria-expanded', () => {
    renderAccordion({ sections: 'A,B', defaultExpanded: '0' });
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders region panels for expanded sections', () => {
    renderAccordion({ sections: 'A,B', defaultExpanded: '0' });
    const regions = screen.getAllByRole('region');
    expect(regions).toHaveLength(1);
  });

  it('expanded panel has aria-labelledby pointing to its header', () => {
    const { component } = renderAccordion({ sections: 'A,B', defaultExpanded: '0' });
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-labelledby', `header-${component.id}-0`);
  });

  it('header button has aria-controls pointing to its panel', () => {
    const { component } = renderAccordion({ sections: 'A,B', defaultExpanded: '0' });
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-controls', `panel-${component.id}-0`);
  });

  it('clicking a collapsed section expands it', () => {
    const { onUpdateDataStore } = renderAccordion({ sections: 'A,B', defaultExpanded: '0' });
    const buttons = screen.getAllByRole('button');
    // Click section B (index 1) which is collapsed
    fireEvent.click(buttons[1]);
    // When allowMultiple is false, only the clicked section should be expanded
    expect(onUpdateDataStore).toHaveBeenCalledWith(
      expect.stringContaining('_expanded'),
      [1]
    );
  });

  it('clicking an expanded section collapses it', () => {
    const { onUpdateDataStore } = renderAccordion({ sections: 'A,B', defaultExpanded: '0' });
    const buttons = screen.getAllByRole('button');
    // Click section A (index 0) which is expanded
    fireEvent.click(buttons[0]);
    expect(onUpdateDataStore).toHaveBeenCalledWith(
      expect.stringContaining('_expanded'),
      []
    );
  });

  describe('allowMultiple behavior', () => {
    it('when false, expanding one collapses others', () => {
      const { onUpdateDataStore } = renderAccordion({
        sections: 'A,B,C',
        defaultExpanded: '0',
        allowMultiple: false,
      });
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]); // Expand B
      expect(onUpdateDataStore).toHaveBeenCalledWith(
        expect.stringContaining('_expanded'),
        [1]
      );
    });

    it('when true, multiple sections can be expanded', () => {
      const component = createAccordionComponent({
        sections: 'A,B,C',
        defaultExpanded: '0',
        allowMultiple: true,
      });
      const dataStore = { [`${component.id}_expanded`]: [0] };
      const onUpdateDataStore = jest.fn();
      const Renderer = componentRegistry[ComponentType.ACCORDION].renderer;
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

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]); // Expand B while A stays expanded
      expect(onUpdateDataStore).toHaveBeenCalledWith(
        `${component.id}_expanded`,
        expect.arrayContaining([0, 1])
      );
    });
  });

  describe('edit mode', () => {
    it('shows all sections expanded in edit mode', () => {
      renderAccordion({ sections: 'A,B,C' }, {}, 'edit');
      // All sections should have regions visible
      const regions = screen.getAllByRole('region');
      expect(regions).toHaveLength(3);
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowDown moves focus to next section header', () => {
      renderAccordion({ sections: 'A,B,C', defaultExpanded: '0' });
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      fireEvent.keyDown(buttons[0], { key: 'ArrowDown' });
      expect(buttons[1]).toHaveFocus();
    });

    it('ArrowUp moves focus to previous section header', () => {
      renderAccordion({ sections: 'A,B,C', defaultExpanded: '0' });
      const buttons = screen.getAllByRole('button');
      buttons[1].focus();
      fireEvent.keyDown(buttons[1], { key: 'ArrowUp' });
      expect(buttons[0]).toHaveFocus();
    });

    it('Home moves focus to first section header', () => {
      renderAccordion({ sections: 'A,B,C', defaultExpanded: '0' });
      const buttons = screen.getAllByRole('button');
      buttons[2].focus();
      fireEvent.keyDown(buttons[2], { key: 'Home' });
      expect(buttons[0]).toHaveFocus();
    });

    it('End moves focus to last section header', () => {
      renderAccordion({ sections: 'A,B,C', defaultExpanded: '0' });
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      fireEvent.keyDown(buttons[0], { key: 'End' });
      expect(buttons[2]).toHaveFocus();
    });
  });

  it('is registered as a container component', () => {
    const plugin = componentRegistry[ComponentType.ACCORDION];
    expect(plugin.isContainer).toBe(true);
  });

  it('has plugin with correct type', () => {
    const plugin = componentRegistry[ComponentType.ACCORDION];
    expect(plugin.type).toBe(ComponentType.ACCORDION);
  });

  it('has palette config with label "Accordion"', () => {
    const plugin = componentRegistry[ComponentType.ACCORDION];
    expect(plugin.paletteConfig.label).toBe('Accordion');
  });
});
