/**
 * Container Background and Overflow Properties
 *
 * Tests that Container correctly applies background image properties
 * (backgroundSize, backgroundPosition, backgroundRepeat, backgroundOverlay,
 * backgroundAttachment) and the overflow property.
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

describe('Container background and overflow properties', () => {
  const scope = createDefaultEvaluationScope();
  const Renderer = componentRegistry[ComponentType.CONTAINER].renderer;

  it('applies backgroundSize, backgroundPosition, and backgroundRepeat when backgroundImage is set', () => {
    const component = createTestComponent(ComponentType.CONTAINER, {
      backgroundImage: 'https://example.com/hero.jpg',
      backgroundSize: 'contain',
      backgroundPosition: 'top left',
      backgroundRepeat: 'repeat',
    });

    const { container } = render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={{}}
      >
        <div>child</div>
      </Renderer>
    );

    const el = container.firstChild as HTMLElement;
    expect(el.style.backgroundImage).toBe('url(https://example.com/hero.jpg)');
    expect(el.style.backgroundSize).toBe('contain');
    expect(el.style.backgroundPosition).toBe('top left');
    expect(el.style.backgroundRepeat).toBe('repeat');
  });

  it('renders an overlay div when backgroundImage and backgroundOverlay are both set', () => {
    const component = createTestComponent(ComponentType.CONTAINER, {
      backgroundImage: 'https://example.com/hero.jpg',
      backgroundOverlay: 'rgba(0,0,0,0.5)',
    });

    const { container } = render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={{}}
      >
        <div>child</div>
      </Renderer>
    );

    const wrapper = container.firstChild as HTMLElement;
    // The overlay is the first child of the wrapper element
    const overlayDiv = wrapper.firstChild as HTMLElement;
    expect(overlayDiv.style.pointerEvents).toBe('none');
    expect(overlayDiv.style.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
    expect(overlayDiv.style.position).toBe('absolute');
  });

  it('does not render an overlay div when there is no backgroundImage', () => {
    const component = createTestComponent(ComponentType.CONTAINER, {
      backgroundColor: '#ff0000',
      backgroundOverlay: 'rgba(0,0,0,0.5)',
    });

    const { container } = render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={{}}
      >
        <div>child</div>
      </Renderer>
    );

    const wrapper = container.firstChild as HTMLElement;
    // Without a backgroundImage, no overlay should be present.
    // Look for any child with position absolute and pointer-events none
    const children = Array.from(wrapper.children);
    const overlayElements = children.filter((child) => {
      const el = child as HTMLElement;
      return el.style.pointerEvents === 'none' && el.style.position === 'absolute';
    });
    expect(overlayElements).toHaveLength(0);
  });

  it('applies overflow hidden to the container element', () => {
    const component = createTestComponent(ComponentType.CONTAINER, {
      overflow: 'hidden',
    });

    const { container } = render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={{}}
      >
        <div>child</div>
      </Renderer>
    );

    const el = container.firstChild as HTMLElement;
    expect(el.style.overflow).toBe('hidden');
  });
});
