import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ProgressPlugin } from '@/components/component-registry/Progress';
import { ComponentType } from 'types';

const ProgressRenderer = ProgressPlugin.renderer;

describe('ProgressPlugin', () => {
  describe('Plugin registration', () => {
    it('should have correct component type', () => {
      expect(ProgressPlugin.type).toBe(ComponentType.PROGRESS);
    });

    it('should have palette config with label and icon', () => {
      expect(ProgressPlugin.paletteConfig.label).toBe('Progress');
      expect(ProgressPlugin.paletteConfig.icon).toBeTruthy();
    });

    it('should have default props configured', () => {
      expect(ProgressPlugin.paletteConfig.defaultProps.value).toBe(60);
      expect(ProgressPlugin.paletteConfig.defaultProps.max).toBe(100);
      expect(ProgressPlugin.paletteConfig.defaultProps.variant).toBe('linear');
    });
  });

  describe('Renderer - Linear variant', () => {
    const baseComponent = {
      id: 'progress1',
      type: ComponentType.PROGRESS,
      props: {
        width: '100%', height: 40,
        value: 60, max: 100,
        showLabel: true,
        variant: 'linear' as const,
        barHeight: 8,
      },
    };

    it('should render a progressbar with correct aria attributes', () => {
      render(<ProgressRenderer component={baseComponent} mode="preview" evaluationScope={{}} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuenow', '60');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should display percentage label by default', () => {
      render(<ProgressRenderer component={baseComponent} mode="preview" evaluationScope={{}} />);
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, showLabel: false } };
      render(<ProgressRenderer component={comp} mode="preview" evaluationScope={{}} />);
      expect(screen.queryByText('60%')).not.toBeInTheDocument();
    });

    it('should render the progress bar element', () => {
      render(<ProgressRenderer component={baseComponent} mode="preview" evaluationScope={{}} />);
      const bar = screen.getByTestId('progress-bar');
      expect(bar).toBeInTheDocument();
      expect(bar.style.width).toBe('60%');
    });

    it('should clamp value between 0 and max', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, value: 150 } };
      render(<ProgressRenderer component={comp} mode="preview" evaluationScope={{}} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('should support custom label format', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, labelFormat: '{{value}}/{{max}}' } };
      render(<ProgressRenderer component={comp} mode="preview" evaluationScope={{}} />);
      expect(screen.getByText('60/100')).toBeInTheDocument();
    });

    it('should render with 0% value correctly', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, value: 0 } };
      render(<ProgressRenderer component={comp} mode="preview" evaluationScope={{}} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar').style.width).toBe('0%');
    });

    it('should render with 100% value correctly', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, value: 100 } };
      render(<ProgressRenderer component={comp} mode="preview" evaluationScope={{}} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar').style.width).toBe('100%');
    });
  });

  describe('Renderer - Circular variant', () => {
    const circularComponent = {
      id: 'progress2',
      type: ComponentType.PROGRESS,
      props: {
        width: 60, height: 60,
        value: 75, max: 100,
        showLabel: true,
        variant: 'circular' as const,
        barHeight: 6,
      },
    };

    it('should render circular SVG variant', () => {
      render(<ProgressRenderer component={circularComponent} mode="preview" evaluationScope={{}} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      // Circular renders SVG circles
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });

    it('should show percentage in center of circular variant', () => {
      render(<ProgressRenderer component={circularComponent} mode="preview" evaluationScope={{}} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(React.createElement(ProgressPlugin.properties));
      expect(container.innerHTML).toBe('');
    });
  });
});
