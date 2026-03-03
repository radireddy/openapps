import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContainerPlugin } from '@/components/component-registry/Container';
import { ComponentType } from '@/types';
import '@testing-library/jest-dom';

const ContainerRenderer = ContainerPlugin.renderer;

describe('ContainerPlugin', () => {
  describe('Plugin metadata', () => {
    it('should have correct type', () => {
      expect(ContainerPlugin.type).toBe(ComponentType.CONTAINER);
    });

    it('should be a container', () => {
      expect(ContainerPlugin.isContainer).toBe(true);
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'container1',
      type: ComponentType.CONTAINER,
      props: {
        x: 0, y: 0, width: '400px', height: '300px',
        backgroundColor: '{{theme.colors.surface}}',
        borderWidth: '{{theme.border.width}}',
        borderColor: '{{theme.colors.border}}',
        borderRadius: '{{theme.radius.default}}',
        padding: '{{theme.spacing.sm}}',
      },
    };

    const evaluationScope = {
      theme: {
        colors: {
          surface: '#ffffff',
          border: '#d1d5db',
          primary: '#4f46e5',
          secondary: '#6366f1',
        },
        spacing: { sm: '8px' },
        border: { width: '1px' },
        radius: { default: '8px' },
      },
    };

    it('should render children passed to it', () => {
      render(
        <ContainerRenderer component={baseComponent} mode="edit" evaluationScope={evaluationScope}>
          <div>Child Element</div>
        </ContainerRenderer>
      );
      expect(screen.getByText('Child Element')).toBeInTheDocument();
    });

    it('should apply background color from evaluation scope', () => {
      const scope = {
        theme: {
          ...evaluationScope.theme,
          colors: { ...evaluationScope.theme.colors, surface: 'rgb(255, 255, 255)' },
        },
      };
      const { container } = render(
        <ContainerRenderer component={baseComponent} mode="edit" evaluationScope={scope}>
          <div>Content</div>
        </ContainerRenderer>
      );
      const containerDiv = container.firstChild as HTMLElement;
      expect(containerDiv).toHaveStyle('background-color: rgb(255, 255, 255)');
    });

    it('should apply border styles from evaluation scope', () => {
      const scope = {
        theme: {
          colors: { ...evaluationScope.theme.colors, surface: '#ffffff', border: 'rgb(209, 213, 219)' },
          spacing: { sm: '8px' },
          border: { width: '1px' },
          radius: { default: '8px' },
        },
      };
      const { container } = render(
        <ContainerRenderer component={baseComponent} mode="edit" evaluationScope={scope}>
          <div>Content</div>
        </ContainerRenderer>
      );
      const containerDiv = container.firstChild as HTMLElement;
      expect(containerDiv).toHaveStyle('border-radius: 8px');
    });
  });

  describe('Properties', () => {
    it('should return null (properties handled by metadata system)', () => {
      const PropertiesComponent = ContainerPlugin.properties;
      const result = PropertiesComponent({
        component: { id: 'container1', props: {} as any },
        updateProp: jest.fn(),
        onOpenExpressionEditor: jest.fn(),
      });
      expect(result).toBeNull();
    });
  });
});
