/**
 * Label Typography and Markdown Styling
 *
 * Tests that Label correctly applies typography properties (lineHeight,
 * letterSpacing, textTransform, cursor) and renders markdown content
 * with the expected HTML structure and CSS class.
 */

// Override the moduleNameMapper mock with the real marked library.
// moduleNameMapper redirects 'marked' to __mocks__/marked.js, so we
// point it to the actual node_modules path instead.
jest.mock('marked', () => {
  return jest.requireActual(
    require('path').resolve(__dirname, '../../../../node_modules/marked/lib/marked.umd.js')
  );
});

import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentType } from '../../../types';
import { componentRegistry } from '../registry';
import {
  createTestComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

describe('Label typography and markdown styling', () => {
  const scope = createDefaultEvaluationScope();
  const Renderer = componentRegistry[ComponentType.LABEL].renderer;

  it('applies lineHeight and letterSpacing CSS properties', () => {
    const component = createTestComponent(ComponentType.LABEL, {
      text: 'Spaced text',
      lineHeight: '1.8',
      letterSpacing: '0.5px',
    });

    const { container } = render(
      <Renderer component={component} evaluationScope={scope} />
    );

    const el = container.firstChild as HTMLElement;
    expect(el.style.lineHeight).toBe('1.8');
    expect(el.style.letterSpacing).toBe('0.5px');
  });

  it('applies textTransform uppercase', () => {
    const component = createTestComponent(ComponentType.LABEL, {
      text: 'uppercase text',
      textTransform: 'uppercase',
    });

    const { container } = render(
      <Renderer component={component} evaluationScope={scope} />
    );

    const el = container.firstChild as HTMLElement;
    expect(el.style.textTransform).toBe('uppercase');
  });

  it('applies cursor pointer', () => {
    const component = createTestComponent(ComponentType.LABEL, {
      text: 'Click me',
      cursor: 'pointer',
    });

    const { container } = render(
      <Renderer component={component} evaluationScope={scope} />
    );

    const el = container.firstChild as HTMLElement;
    expect(el.style.cursor).toBe('pointer');
  });

  it('renders markdown with procode-markdown-content class, h1, and strong tags', () => {
    const component = createTestComponent(ComponentType.LABEL, {
      text: '# Hello World\n\nThis is **bold** text.',
      textRenderer: 'markdown',
    });

    const { container } = render(
      <Renderer component={component} evaluationScope={scope} />
    );

    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('procode-markdown-content');
    expect(el.innerHTML).toContain('<h1');
    expect(el.innerHTML).toContain('<strong');
  });

  it('renders markdown bullet lists with ul and li tags', () => {
    const component = createTestComponent(ComponentType.LABEL, {
      text: '- Item 1\n- Item 2\n- Item 3',
      textRenderer: 'markdown',
    });

    const { container } = render(
      <Renderer component={component} evaluationScope={scope} />
    );

    const el = container.firstChild as HTMLElement;
    expect(el.innerHTML).toContain('<ul');
    expect(el.innerHTML).toContain('<li');
  });

  it('renders markdown links with anchor tags and href', () => {
    const component = createTestComponent(ComponentType.LABEL, {
      text: 'Visit [Google](https://google.com) for more.',
      textRenderer: 'markdown',
    });

    const { container } = render(
      <Renderer component={component} evaluationScope={scope} />
    );

    const el = container.firstChild as HTMLElement;
    expect(el.innerHTML).toContain('<a');
    expect(el.innerHTML).toContain('href');
  });
});
