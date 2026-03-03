import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import { ComponentType } from '@/types';
import { LabelPlugin } from '@/components/component-registry/Label';
import { InputPlugin } from '@/components/component-registry/Input';
import { TextareaPlugin } from '@/components/component-registry/Textarea';
import '@testing-library/jest-dom';

/**
 * Test suite for textAlign property across all applicable components
 * Tests that textAlign (left, center, right) is properly applied to:
 * - Label component
 * - Input component
 * - Textarea component
 */
describe('textAlign Property Tests', () => {
  const evaluationScope = {};

  describe('Label Component', () => {
    it('should apply textAlign: left by default', () => {
      const component = {
        id: 'label1',
        type: ComponentType.LABEL,
        props: {
          text: 'Test Label',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <LabelPlugin.renderer
          component={component}
          evaluationScope={evaluationScope}
        />
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toBeTruthy();
      // textAlign is on the inner span, not the outer flex container
      const span = element.querySelector('span');
      expect(span).toBeTruthy();
      expect(span?.style.textAlign).toBe('left');
    });

    it('should apply textAlign: center when set', () => {
      const component = {
        id: 'label2',
        type: ComponentType.LABEL,
        props: {
          text: 'Test Label',
          textAlign: 'center' as const,
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <LabelPlugin.renderer
          component={component}
          evaluationScope={evaluationScope}
        />
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toBeTruthy();
      // textAlign is on the inner span
      const span = element.querySelector('span');
      expect(span).toBeTruthy();
      expect(span?.style.textAlign).toBe('center');
    });

    it('should apply textAlign: right when set', () => {
      const component = {
        id: 'label3',
        type: ComponentType.LABEL,
        props: {
          text: 'Test Label',
          textAlign: 'right' as const,
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <LabelPlugin.renderer
          component={component}
          evaluationScope={evaluationScope}
        />
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toBeTruthy();
      // textAlign is on the inner span
      const span = element.querySelector('span');
      expect(span).toBeTruthy();
      expect(span?.style.textAlign).toBe('right');
    });

    it('should use display: flex with alignItems: center for vertical centering', () => {
      const component = {
        id: 'label4',
        type: ComponentType.LABEL,
        props: {
          text: 'Test Label',
          textAlign: 'center' as const,
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <LabelPlugin.renderer
          component={component}
          evaluationScope={evaluationScope}
        />
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toBeTruthy();
      // Should use flex for vertical centering
      expect(element.style.display).toBe('flex');
      expect(element.style.alignItems).toBe('center');
    });
  });

  describe('Input Component', () => {
    it('should apply textAlign: left by default', () => {
      const component = {
        id: 'input1',
        type: ComponentType.INPUT,
        props: {
          placeholder: 'Enter text',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <InputPlugin.renderer
          component={component}
          mode="preview"
          dataStore={{}}
          evaluationScope={evaluationScope}
        />
      );

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.style.textAlign).toBe('left');
    });

    it('should apply textAlign: center when set', () => {
      const component = {
        id: 'input2',
        type: ComponentType.INPUT,
        props: {
          placeholder: 'Enter text',
          textAlign: 'center' as const,
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <InputPlugin.renderer
          component={component}
          mode="preview"
          dataStore={{}}
          evaluationScope={evaluationScope}
        />
      );

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.style.textAlign).toBe('center');
    });

    it('should apply textAlign: right when set', () => {
      const component = {
        id: 'input3',
        type: ComponentType.INPUT,
        props: {
          placeholder: 'Enter text',
          textAlign: 'right' as const,
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <InputPlugin.renderer
          component={component}
          mode="preview"
          dataStore={{}}
          evaluationScope={evaluationScope}
        />
      );

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.style.textAlign).toBe('right');
    });
  });

  describe('Textarea Component', () => {
    it('should apply textAlign: left by default', () => {
      const component = {
        id: 'textarea1',
        type: ComponentType.TEXTAREA,
        props: {
          placeholder: 'Enter text',
          x: 0,
          y: 0,
          width: 200,
          height: 100,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <TextareaPlugin.renderer
          component={component}
          mode="preview"
          dataStore={{}}
          evaluationScope={evaluationScope}
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(textarea?.style.textAlign).toBe('left');
    });

    it('should apply textAlign: center when set', () => {
      const component = {
        id: 'textarea2',
        type: ComponentType.TEXTAREA,
        props: {
          placeholder: 'Enter text',
          textAlign: 'center' as const,
          x: 0,
          y: 0,
          width: 200,
          height: 100,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <TextareaPlugin.renderer
          component={component}
          mode="preview"
          dataStore={{}}
          evaluationScope={evaluationScope}
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(textarea?.style.textAlign).toBe('center');
    });

    it('should apply textAlign: right when set', () => {
      const component = {
        id: 'textarea3',
        type: ComponentType.TEXTAREA,
        props: {
          placeholder: 'Enter text',
          textAlign: 'right' as const,
          x: 0,
          y: 0,
          width: 200,
          height: 100,
        },
        pageId: 'page1',
        parentId: null,
      };

      const { container } = render(
        <TextareaPlugin.renderer
          component={component}
          mode="preview"
          dataStore={{}}
          evaluationScope={evaluationScope}
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(textarea?.style.textAlign).toBe('right');
    });
  });
});

