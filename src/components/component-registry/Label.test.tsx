import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { LabelPlugin } from '@/components/component-registry/Label';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const LabelRenderer = LabelPlugin.renderer;
const LabelProperties = LabelPlugin.properties;

describe('LabelPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'label1',
      type: ComponentType.LABEL,
      props: {
        x: 0, y: 0, width: 100, height: 30,
        text: 'Static Label',
        fontSize: 16,
        fontWeight: 'normal',
        color: 'black',
      },
    };

    it('should render static text', () => {
      render(<LabelRenderer component={baseComponent} evaluationScope={{}} />);
      expect(screen.getByText('Static Label')).toBeInTheDocument();
    });

    it('should render text from an expression', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, text: 'Hello, {{user.name}}' },
      };
      const scope = { user: { name: 'Alice' } };
      render(<LabelRenderer component={component} evaluationScope={scope} />);
      expect(screen.getByText('Hello, Alice')).toBeInTheDocument();
    });

    it('should apply styles correctly', () => {
        const component = {
            ...baseComponent,
            props: { ...baseComponent.props, color: '{{theme.colors.primary}}', fontSize: 20 },
          };
        const scope = { theme: { colors: { primary: 'rgb(255, 0, 0)' } } };
        render(<LabelRenderer component={component} evaluationScope={scope} />);
        const label = screen.getByText('Static Label');
        expect(label).toHaveStyle('color: rgb(255, 0, 0)');
        expect(label).toHaveStyle('font-size: 20px');
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(<LabelProperties />);
      expect(container.innerHTML).toBe('');
    });
  });
});