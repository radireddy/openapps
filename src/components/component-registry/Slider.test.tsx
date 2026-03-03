import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SliderPlugin } from '@/components/component-registry/Slider';
import { ComponentType } from 'types';

const SliderRenderer = SliderPlugin.renderer;

describe('SliderPlugin', () => {
  describe('Plugin registration', () => {
    it('should have correct component type', () => {
      expect(SliderPlugin.type).toBe(ComponentType.SLIDER);
    });

    it('should have palette config with label and icon', () => {
      expect(SliderPlugin.paletteConfig.label).toBe('Slider');
      expect(SliderPlugin.paletteConfig.icon).toBeTruthy();
    });

    it('should have default props configured', () => {
      expect(SliderPlugin.paletteConfig.defaultProps.min).toBe(0);
      expect(SliderPlugin.paletteConfig.defaultProps.max).toBe(100);
      expect(SliderPlugin.paletteConfig.defaultProps.step).toBe(1);
      expect(SliderPlugin.paletteConfig.defaultProps.defaultValue).toBe(50);
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'slider1',
      type: ComponentType.SLIDER,
      props: {
        width: '100%', height: 40,
        min: 0, max: 100, step: 1,
        defaultValue: 50,
        showValue: true,
        label: '',
      },
    };

    it('should render a range input', () => {
      render(<SliderRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should display the current value when showValue is true', () => {
      render(<SliderRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByTestId('slider-value')).toHaveTextContent('50');
    });

    it('should not display value when showValue is false', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, showValue: false } };
      render(<SliderRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.queryByTestId('slider-value')).not.toBeInTheDocument();
    });

    it('should render with correct min/max/step attributes', () => {
      render(<SliderRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
      expect(slider).toHaveAttribute('step', '1');
    });

    it('should render label when provided', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, label: 'Volume' } };
      render(<SliderRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Volume')).toBeInTheDocument();
    });

    it('should be disabled when disabled expression is true', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, disabled: '{{true}}' } };
      render(<SliderRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByRole('slider')).toBeDisabled();
    });

    it('should show min/max labels when showMinMax is true', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, showMinMax: true } };
      render(<SliderRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<SliderRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
    });

    it('should update value on change in preview mode', () => {
      const mockUpdate = jest.fn();
      render(<SliderRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} onUpdateDataStore={mockUpdate} />);
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '75' } });
      expect(mockUpdate).toHaveBeenCalledWith('slider1', 75);
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(React.createElement(SliderPlugin.properties));
      expect(container.innerHTML).toBe('');
    });
  });
});
