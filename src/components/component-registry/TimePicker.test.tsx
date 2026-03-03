import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TimePickerPlugin } from '@/components/component-registry/TimePicker';
import { ComponentType } from 'types';

const TimePickerRenderer = TimePickerPlugin.renderer;

describe('TimePickerPlugin', () => {
  describe('Plugin registration', () => {
    it('should have correct component type', () => {
      expect(TimePickerPlugin.type).toBe(ComponentType.TIME_PICKER);
    });

    it('should have palette config with label and icon', () => {
      expect(TimePickerPlugin.paletteConfig.label).toBe('Time Picker');
      expect(TimePickerPlugin.paletteConfig.icon).toBeTruthy();
    });

    it('should have default props configured', () => {
      expect(TimePickerPlugin.paletteConfig.defaultProps.timeFormat).toBe('24h');
      expect(TimePickerPlugin.paletteConfig.defaultProps.minuteStep).toBe(15);
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'timepicker1',
      type: ComponentType.TIME_PICKER,
      props: {
        width: '100%', height: 40,
        placeholder: 'Select a time',
        timeFormat: '24h' as const,
        minuteStep: 15,
      },
    };

    it('should render with placeholder text', () => {
      render(<TimePickerRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByPlaceholderText('Select a time')).toBeInTheDocument();
    });

    it('should render with default placeholder when none specified', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, placeholder: '' } };
      render(<TimePickerRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByPlaceholderText('Select time (24h)')).toBeInTheDocument();
    });

    it('should be disabled when disabled expression is true', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, disabled: '{{true}}' } };
      render(<TimePickerRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should render label when provided', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, label: 'Start Time' } };
      render(<TimePickerRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Start Time')).toBeInTheDocument();
    });

    it('should open time dropdown on focus in preview mode', () => {
      render(<TimePickerRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should not open dropdown in edit mode', () => {
      render(<TimePickerRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should show time options in 24h format by default', () => {
      render(<TimePickerRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      fireEvent.focus(screen.getByRole('textbox'));
      // Should have 00:00, 00:15, 00:30, etc.
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
    });

    it('should show time options in 12h format when configured', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, timeFormat: '12h' as const } };
      render(<TimePickerRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByText('12:00 AM')).toBeInTheDocument();
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<TimePickerRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
      expect(input).toHaveAttribute('aria-label', 'Time picker');
    });
  });

  describe('Time selection and dropdown interactions', () => {
    const baseComponent = {
      id: 'timepicker1',
      type: ComponentType.TIME_PICKER,
      props: {
        width: '100%', height: 40,
        placeholder: 'Select a time',
        timeFormat: '24h' as const,
        minuteStep: 15,
      },
    };

    it('should update value when a time option is selected from dropdown', () => {
      const onUpdateDataStore = jest.fn();
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Click on a time option
      fireEvent.click(screen.getByText('09:00'));
      expect(onUpdateDataStore).toHaveBeenCalledWith('timepicker1', '09:00');

      // Dropdown should close after selection
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should update value when a 12h format time option is selected', () => {
      const onUpdateDataStore = jest.fn();
      const comp = { ...baseComponent, props: { ...baseComponent.props, timeFormat: '12h' as const } };
      render(
        <TimePickerRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      fireEvent.click(screen.getByText('1:00 PM'));
      // 1:00 PM = 13:00 in 24h (no seconds when showSeconds is false)
      expect(onUpdateDataStore).toHaveBeenCalledWith('timepicker1', '13:00');
    });

    it('should update value when typing in preview mode', () => {
      const onUpdateDataStore = jest.fn();
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '14:30' } });
      expect(onUpdateDataStore).toHaveBeenCalledWith('timepicker1', '14:30');
    });

    it('should not update value when readOnly in preview mode', () => {
      const onUpdateDataStore = jest.fn();
      const comp = { ...baseComponent, props: { ...baseComponent.props, readOnly: true } };
      render(
        <TimePickerRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '14:30' } });
      expect(onUpdateDataStore).not.toHaveBeenCalled();
    });

    it('should close dropdown when clicking outside', () => {
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      // Open the dropdown
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should apply hover styles on mouse enter and reset on mouse leave', () => {
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      const option = screen.getByText('10:00');

      fireEvent.mouseEnter(option);
      // JSDOM converts hex to rgb
      expect(option.style.backgroundColor).toBe('rgb(243, 244, 246)');

      fireEvent.mouseLeave(option);
      expect(option.style.backgroundColor).toBe('transparent');
    });

    it('should highlight selected option in dropdown', () => {
      const onUpdateDataStore = jest.fn();
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      // Select a time first
      fireEvent.focus(screen.getByRole('textbox'));
      fireEvent.click(screen.getByText('10:00'));

      // Reopen dropdown
      fireEvent.focus(screen.getByRole('textbox'));
      const selectedOption = screen.getByText('10:00');
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Time format and step variations', () => {
    const baseComponent = {
      id: 'timepicker2',
      type: ComponentType.TIME_PICKER,
      props: {
        width: '100%', height: 40,
        placeholder: '',
        timeFormat: '24h' as const,
        minuteStep: 30,
      },
    };

    it('should generate options with 30-minute step intervals', () => {
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByText('00:30')).toBeInTheDocument();
      expect(screen.getByText('01:00')).toBeInTheDocument();
      // 00:15 should NOT exist with 30-min steps
      expect(screen.queryByText('00:15')).not.toBeInTheDocument();
    });

    it('should show seconds in 24h format when showSeconds is true', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, showSeconds: true, minuteStep: 60 } };
      render(
        <TimePickerRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
      expect(screen.getByText('01:00:00')).toBeInTheDocument();
    });

    it('should show seconds in 12h format when showSeconds is true', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, timeFormat: '12h' as const, showSeconds: true, minuteStep: 60 } };
      render(
        <TimePickerRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByText('12:00:00 AM')).toBeInTheDocument();
      expect(screen.getByText('1:00:00 PM')).toBeInTheDocument();
    });

    it('should select 12:00 AM and convert to 00:00:00 ISO', () => {
      const onUpdateDataStore = jest.fn();
      const comp = { ...baseComponent, props: { ...baseComponent.props, timeFormat: '12h' as const, minuteStep: 60 } };
      render(
        <TimePickerRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      fireEvent.click(screen.getByText('12:00 AM'));
      // 12:00 AM = 00:00 in 24h (no seconds when showSeconds is false)
      expect(onUpdateDataStore).toHaveBeenCalledWith('timepicker2', '00:00');
    });

    it('should select 12:00 PM and convert to 12:00:00 ISO', () => {
      const onUpdateDataStore = jest.fn();
      const comp = { ...baseComponent, props: { ...baseComponent.props, timeFormat: '12h' as const, minuteStep: 60 } };
      render(
        <TimePickerRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      fireEvent.click(screen.getByText('12:00 PM'));
      // 12:00 PM = 12:00 in 24h (no seconds when showSeconds is false)
      expect(onUpdateDataStore).toHaveBeenCalledWith('timepicker2', '12:00');
    });
  });

  describe('Validation and error handling', () => {
    const baseComponent = {
      id: 'timepicker3',
      type: ComponentType.TIME_PICKER,
      props: {
        width: '100%', height: 40,
        placeholder: 'Select a time',
        timeFormat: '24h' as const,
        minuteStep: 15,
        validationTiming: 'onChange',
      },
    };

    it('should show validation error for invalid time input on change', () => {
      const onUpdateDataStore = jest.fn();
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'not-a-time' } });
      // Validation should detect the invalid format
      expect(screen.getByText('Invalid time format')).toBeInTheDocument();
    });

    it('should show custom error message when errorMessage prop is set', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, errorMessage: 'Please enter a valid time', validationTiming: 'onChange' },
      };
      render(
        <TimePickerRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'bad-time' } });
      expect(screen.getByText('Please enter a valid time')).toBeInTheDocument();
    });

    it('should not show validation error for valid time input', () => {
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '14:30' } });
      expect(screen.queryByText('Invalid time format')).not.toBeInTheDocument();
    });

    it('should not show validation error for empty input', () => {
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.queryByText('Invalid time format')).not.toBeInTheDocument();
    });

    it('should set aria-invalid when validation error exists', () => {
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'xyz' } });
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Theme and styling integration', () => {
    const baseComponent = {
      id: 'timepicker4',
      type: ComponentType.TIME_PICKER,
      props: {
        width: '100%', height: 40,
        placeholder: 'Select a time',
        timeFormat: '24h' as const,
        minuteStep: 60,
      },
    };

    it('should use theme colors for dropdown when provided', () => {
      const scope = {
        theme: { colors: { surface: '#1a1a2e', border: '#333', text: '#eee', hover: '#2a2a4e', primary: '#ff6600' } },
      };
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={scope}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      const listbox = screen.getByRole('listbox');
      // JSDOM converts hex to rgb
      expect(listbox.style.backgroundColor).toBe('rgb(26, 26, 46)');
      expect(listbox.style.border).toContain('#333');
    });

    it('should apply theme hover color on mouse enter', () => {
      const scope = {
        theme: { colors: { hover: '#2a2a4e', text: '#eee' } },
      };
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={scope}
        />
      );
      fireEvent.focus(screen.getByRole('textbox'));
      const option = screen.getByText('01:00');
      fireEvent.mouseEnter(option);
      // JSDOM converts hex to rgb
      expect(option.style.backgroundColor).toBe('rgb(42, 42, 78)');
    });

    it('should use theme hover color on mouse leave for selected option', () => {
      const onUpdateDataStore = jest.fn();
      const scope = {
        theme: { colors: { hover: '#2a2a4e', text: '#eee', primary: '#ff6600' } },
      };
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={scope}
          onUpdateDataStore={onUpdateDataStore}
        />
      );
      // Select a time
      fireEvent.focus(screen.getByRole('textbox'));
      fireEvent.click(screen.getByText('01:00'));

      // Reopen dropdown and check mouseleave on the selected option
      fireEvent.focus(screen.getByRole('textbox'));
      const selectedOption = screen.getByText('01:00');
      fireEvent.mouseLeave(selectedOption);
      // Selected items keep hover bg on leave; JSDOM converts hex to rgb
      expect(selectedOption.style.backgroundColor).toBe('rgb(42, 42, 78)');
    });
  });

  describe('Preview mode event handlers', () => {
    const baseComponent = {
      id: 'timepicker5',
      type: ComponentType.TIME_PICKER,
      props: {
        width: '100%', height: 40,
        timeFormat: '24h' as const,
        minuteStep: 15,
      },
    };

    it('should fire onBlur handler in preview mode', () => {
      render(
        <TimePickerRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);
      // No error thrown, blur handled gracefully
      expect(input).toBeInTheDocument();
    });

    it('should not open dropdown when disabled in preview', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, disabled: '{{true}}' } };
      render(
        <TimePickerRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(React.createElement(TimePickerPlugin.properties));
      expect(container.innerHTML).toBe('');
    });
  });
});
