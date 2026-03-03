import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DividerPlugin } from '@/components/component-registry/Divider';
import { ComponentType } from '@/types';
import '@testing-library/jest-dom';

const DividerRenderer = DividerPlugin.renderer;

describe('DividerPlugin', () => {
  describe('Plugin metadata', () => {
    it('should have correct type', () => {
      expect(DividerPlugin.type).toBe(ComponentType.DIVIDER);
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'divider1',
      type: ComponentType.DIVIDER,
      props: {
        x: 0, y: 0, width: 300, height: 2,
        color: '{{theme.colors.border}}',
        opacity: 1,
        boxShadow: '',
      },
    };

    it('should render a div with full width and height', () => {
      const scope = { theme: { colors: { border: '#d1d5db' } } };
      render(<DividerRenderer component={baseComponent} evaluationScope={scope} />);
      const divider = document.querySelector('.w-full.h-full');
      expect(divider).toBeInTheDocument();
    });

    it('should apply background color from expression', () => {
      const scope = { theme: { colors: { border: 'rgb(209, 213, 219)' } } };
      render(<DividerRenderer component={baseComponent} evaluationScope={scope} />);
      const divider = document.querySelector('.w-full.h-full');
      expect(divider).toHaveStyle('background-color: rgb(209, 213, 219)');
    });

    it('should apply opacity', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, opacity: 0.5 },
      };
      const scope = { theme: { colors: { border: '#d1d5db' } } };
      render(<DividerRenderer component={component} evaluationScope={scope} />);
      const divider = document.querySelector('.w-full.h-full');
      expect(divider).toHaveStyle('opacity: 0.5');
    });
  });

  describe('Properties', () => {
    it('should return null (properties handled by metadata system)', () => {
      const PropertiesComponent = DividerPlugin.properties;
      const result = PropertiesComponent({
        component: { id: 'divider1', props: {} as any },
        updateProp: jest.fn(),
        onOpenExpressionEditor: jest.fn(),
      });
      expect(result).toBeNull();
    });
  });
});
