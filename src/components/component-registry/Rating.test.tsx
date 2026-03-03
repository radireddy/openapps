import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RatingPlugin } from '@/components/component-registry/Rating';
import { ComponentType } from 'types';

const RatingRenderer = RatingPlugin.renderer;

describe('RatingPlugin', () => {
  describe('Plugin registration', () => {
    it('should have correct component type', () => {
      expect(RatingPlugin.type).toBe(ComponentType.RATING);
    });

    it('should have palette config with label and icon', () => {
      expect(RatingPlugin.paletteConfig.label).toBe('Rating');
      expect(RatingPlugin.paletteConfig.icon).toBeTruthy();
    });

    it('should have default props configured', () => {
      expect(RatingPlugin.paletteConfig.defaultProps.maxStars).toBe(5);
      expect(RatingPlugin.paletteConfig.defaultProps.allowHalf).toBe(false);
      expect(RatingPlugin.paletteConfig.defaultProps.defaultValue).toBe(0);
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'rating1',
      type: ComponentType.RATING,
      props: {
        width: '100%', height: 40,
        maxStars: 5,
        defaultValue: 0,
        showValue: false,
        allowHalf: false,
        label: '',
      },
    };

    it('should render 5 star radio buttons by default', () => {
      render(<RatingRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(5);
    });

    it('should render custom number of stars', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, maxStars: 3 } };
      render(<RatingRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('should render label when provided', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, label: 'Rate this' } };
      render(<RatingRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Rate this')).toBeInTheDocument();
    });

    it('should show value label when showValue is true', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, showValue: true, defaultValue: 3 } };
      render(<RatingRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByTestId('rating-value')).toHaveTextContent('3/5');
    });

    it('should not show value label when showValue is false', () => {
      render(<RatingRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.queryByTestId('rating-value')).not.toBeInTheDocument();
    });

    it('should have radiogroup role', () => {
      render(<RatingRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should update value on star click in preview mode', () => {
      const mockUpdate = jest.fn();
      render(<RatingRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} onUpdateDataStore={mockUpdate} />);
      const stars = screen.getAllByRole('radio');
      fireEvent.click(stars[2]); // Click 3rd star
      expect(mockUpdate).toHaveBeenCalledWith('rating1', 3);
    });

    it('should toggle off when clicking same star value', () => {
      const mockUpdate = jest.fn();
      const comp = { ...baseComponent, props: { ...baseComponent.props, defaultValue: 3 } };
      render(<RatingRenderer component={comp} mode="preview" dataStore={{ rating1: 3 }} evaluationScope={{}} onUpdateDataStore={mockUpdate} />);
      const stars = screen.getAllByRole('radio');
      fireEvent.click(stars[2]); // Click 3rd star (same as current)
      expect(mockUpdate).toHaveBeenCalledWith('rating1', 0);
    });

    it('should render with correct aria labels on stars', () => {
      render(<RatingRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByLabelText('1 star')).toBeInTheDocument();
      expect(screen.getByLabelText('3 stars')).toBeInTheDocument();
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(React.createElement(RatingPlugin.properties));
      expect(container.innerHTML).toBe('');
    });
  });
});
