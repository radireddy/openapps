import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DatePickerPlugin } from '@/components/component-registry/DatePicker';
import { ComponentType } from 'types';

const DatePickerRenderer = DatePickerPlugin.renderer;

describe('DatePickerPlugin', () => {
  describe('Plugin registration', () => {
    it('should have correct component type', () => {
      expect(DatePickerPlugin.type).toBe(ComponentType.DATE_PICKER);
    });

    it('should have palette config with label and icon', () => {
      expect(DatePickerPlugin.paletteConfig.label).toBe('Date Picker');
      expect(DatePickerPlugin.paletteConfig.icon).toBeTruthy();
    });

    it('should have default props configured', () => {
      expect(DatePickerPlugin.paletteConfig.defaultProps.dateFormat).toBe('YYYY-MM-DD');
      expect(DatePickerPlugin.paletteConfig.defaultProps.width).toBe('100%');
      expect(DatePickerPlugin.paletteConfig.defaultProps.height).toBe('auto');
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'datepicker1',
      type: ComponentType.DATE_PICKER,
      props: {
        width: '100%', height: 'auto',
        placeholder: 'Select a date',
        dateFormat: 'YYYY-MM-DD' as const,
      },
    };

    it('should render with placeholder text', () => {
      render(<DatePickerRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByPlaceholderText('Select a date')).toBeInTheDocument();
    });

    it('should render with default placeholder when none specified', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, placeholder: '' } };
      render(<DatePickerRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByPlaceholderText('Select date (YYYY-MM-DD)')).toBeInTheDocument();
    });

    it('should render calendar icon', () => {
      render(<DatePickerRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      // Calendar icon SVG should be in the DOM
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should be disabled when disabled expression is true', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, disabled: '{{true}}' } };
      render(<DatePickerRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should render label when provided', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, label: 'Birth Date' } };
      render(<DatePickerRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Birth Date')).toBeInTheDocument();
    });

    it('should show required indicator when required', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, label: 'Date', required: true } };
      render(<DatePickerRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should open calendar popup on focus in preview mode', () => {
      render(<DatePickerRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not open calendar in edit mode', () => {
      render(<DatePickerRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<DatePickerRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-haspopup', 'dialog');
      expect(input).toHaveAttribute('aria-label', 'Date picker');
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(React.createElement(DatePickerPlugin.properties));
      expect(container.innerHTML).toBe('');
    });
  });
});
