/**
 * Modal Component Tests
 *
 * Tests for the Modal container component renderer.
 * Verifies edit mode inline frame, preview mode portal, ARIA attributes,
 * close button, and registration.
 */

import { describe, it, expect, jest, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentType } from '../../../types';
import { componentRegistry } from '../registry';
import {
  createTestComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

// Disable automatic cleanup since portal unmounting needs manual handling
afterEach(() => {
  document.body.style.overflow = '';
});

describe('Modal component', () => {
  const createModalComponent = (propOverrides = {}) =>
    createTestComponent(ComponentType.MODAL, propOverrides);

  describe('edit mode', () => {
    it('renders inline with a dashed border frame', () => {
      const component = createModalComponent({ title: 'Test Modal' });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { container, unmount } = render(
        <Renderer component={component} mode="edit" evaluationScope={scope} dataStore={{}} />
      );
      const frame = container.querySelector('[data-testid^="modal-edit"]');
      expect(frame).toBeInTheDocument();
      unmount();
    });

    it('shows modal title in edit mode header', () => {
      const component = createModalComponent({ title: 'My Modal' });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { unmount } = render(
        <Renderer component={component} mode="edit" evaluationScope={scope} dataStore={{}} />
      );
      expect(screen.getByText('My Modal')).toBeInTheDocument();
      unmount();
    });

    it('shows close button indicator when showCloseButton is true', () => {
      const component = createModalComponent({ title: 'Test', showCloseButton: true });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { container, unmount } = render(
        <Renderer component={component} mode="edit" evaluationScope={scope} dataStore={{}} />
      );
      expect(container.textContent).toContain('×');
      unmount();
    });

    it('renders children in edit mode', () => {
      const component = createModalComponent({ title: 'Test' });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { unmount } = render(
        <Renderer component={component} mode="edit" evaluationScope={scope} dataStore={{}}>
          <div data-testid="modal-child">Content</div>
        </Renderer>
      );
      expect(screen.getByTestId('modal-child')).toBeInTheDocument();
      unmount();
    });
  });

  describe('preview mode', () => {
    it('does not render content when isOpen is false', () => {
      const component = createModalComponent({ isOpen: '{{false}}', title: 'Hidden' });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { unmount } = render(
        <Renderer component={component} mode="preview" evaluationScope={scope} dataStore={{}} />
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      unmount();
    });

    it('renders portal with dialog role when isOpen is true', () => {
      const component = createModalComponent({ isOpen: '{{true}}', title: 'Open Modal' });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { unmount } = render(
        <Renderer component={component} mode="preview" evaluationScope={scope} dataStore={{}} />
      );
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      unmount();
    });

    it('has aria-modal attribute', () => {
      const component = createModalComponent({ isOpen: '{{true}}', title: 'Open Modal' });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { unmount } = render(
        <Renderer component={component} mode="preview" evaluationScope={scope} dataStore={{}} />
      );
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      unmount();
    });

    it('has aria-labelledby pointing to the title', () => {
      const component = createModalComponent({ isOpen: '{{true}}', title: 'Labeled' });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { unmount } = render(
        <Renderer component={component} mode="preview" evaluationScope={scope} dataStore={{}} />
      );
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-labelledby', `modal-title-${component.id}`);
      unmount();
    });

    it('renders close button with aria-label', () => {
      const component = createModalComponent({ isOpen: '{{true}}', showCloseButton: true });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { unmount } = render(
        <Renderer component={component} mode="preview" evaluationScope={scope} dataStore={{}} />
      );
      const closeBtn = document.querySelector('[aria-label="Close"]');
      expect(closeBtn).toBeInTheDocument();
      unmount();
    });

    it('renders modal title text in portal', () => {
      const component = createModalComponent({ isOpen: '{{true}}', title: 'Hello World' });
      const Renderer = componentRegistry[ComponentType.MODAL].renderer;
      const scope = createDefaultEvaluationScope();
      const { unmount } = render(
        <Renderer component={component} mode="preview" evaluationScope={scope} dataStore={{}} />
      );
      const titleEl = document.getElementById(`modal-title-${component.id}`);
      expect(titleEl).toBeInTheDocument();
      expect(titleEl?.textContent).toBe('Hello World');
      unmount();
    });
  });

  it('is registered as a container component', () => {
    const plugin = componentRegistry[ComponentType.MODAL];
    expect(plugin.isContainer).toBe(true);
  });

  it('has plugin with correct type', () => {
    const plugin = componentRegistry[ComponentType.MODAL];
    expect(plugin.type).toBe(ComponentType.MODAL);
  });

  it('has palette config with label "Modal"', () => {
    const plugin = componentRegistry[ComponentType.MODAL];
    expect(plugin.paletteConfig.label).toBe('Modal');
  });
});
