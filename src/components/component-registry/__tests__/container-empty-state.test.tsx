/**
 * Container Empty State (IMP-008)
 *
 * Tests that Container, Form, and Modal components show an "Empty container"
 * placeholder when rendered with no children in both edit and preview modes.
 */

import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentType } from '../../../types';
import { componentRegistry } from '../registry';
import {
  createTestComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

describe('Container empty state in preview (IMP-008)', () => {
  const scope = createDefaultEvaluationScope();

  // Container and Form use the base container renderer via the factory
  const factoryBasedTypes = [
    ComponentType.CONTAINER,
    ComponentType.FORM,
  ];

  factoryBasedTypes.forEach((type) => {
    it(`shows empty container placeholder in preview mode when ${type} has no children`, () => {
      const component = createTestComponent(type);
      const Renderer = componentRegistry[type].renderer;

      render(
        <Renderer
          component={component}
          mode="preview"
          evaluationScope={scope}
          dataStore={{}}
        />
      );

      expect(screen.getByText('Empty container')).toBeInTheDocument();
    });

    it(`shows empty container placeholder in edit mode when ${type} has no children`, () => {
      const component = createTestComponent(type);
      const Renderer = componentRegistry[type].renderer;

      render(
        <Renderer
          component={component}
          mode="edit"
          evaluationScope={scope}
          dataStore={{}}
        />
      );

      expect(screen.getByText('Empty container')).toBeInTheDocument();
    });

    it(`does not show empty container placeholder in preview mode when ${type} has children`, () => {
      const component = createTestComponent(type);
      const Renderer = componentRegistry[type].renderer;

      render(
        <Renderer
          component={component}
          mode="preview"
          evaluationScope={scope}
          dataStore={{}}
        >
          <div>Child content</div>
        </Renderer>
      );

      expect(screen.queryByText('Empty container')).not.toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  // Modal has its own renderer with isOpen gating in preview mode
  describe('MODAL', () => {
    it('shows empty container placeholder in preview mode when modal is open with no children', () => {
      const component = createTestComponent(ComponentType.MODAL, {
        isOpen: '{{true}}',
        title: 'Test Modal',
      });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;

      render(
        <Renderer
          component={component}
          mode="preview"
          evaluationScope={scope}
          dataStore={{}}
        />
      );

      expect(screen.getByText('Empty container')).toBeInTheDocument();
    });

    it('does not show empty container placeholder when modal has children', () => {
      const component = createTestComponent(ComponentType.MODAL, {
        isOpen: '{{true}}',
        title: 'Test Modal',
      });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;

      render(
        <Renderer
          component={component}
          mode="preview"
          evaluationScope={scope}
          dataStore={{}}
        >
          <div>Modal child content</div>
        </Renderer>
      );

      expect(screen.queryByText('Empty container')).not.toBeInTheDocument();
      expect(screen.getByText('Modal child content')).toBeInTheDocument();
    });
  });
});
