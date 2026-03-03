/**
 * DatePicker Component Tests
 *
 * Tests for BUG-001: Year/month jump navigation in calendar picker
 * Tests for BUG-002: Calendar closes on Escape key press
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock useJavaScriptRenderer
jest.mock('@/property-renderers/useJavaScriptRenderer', () => ({
  useJavaScriptRenderer: (val: any, _scope: any, fallback: any) => val || fallback,
}));

// Mock useFormField — keep stable spy references so tests can assert on calls
const mockHandleBlur = jest.fn();
const mockValidateOnBlur = jest.fn();
jest.mock('../useFormField', () => ({
  useFormField: () => ({
    isDisabledInPreview: false,
    isReadOnly: false,
    isRequired: false,
    currentValue: '',
    setLocalValue: jest.fn(),
    validationError: '',
    validateOnChange: jest.fn(),
    validateOnBlur: mockValidateOnBlur,
    forceValidate: jest.fn(),
    sizeVariant: { fontSize: '14px', padding: '8px', height: 40 },
    finalOpacity: 1,
    helpText: '',
    labelText: 'Test Date',
    boxShadowValue: '',
    pointerEventsStyle: {},
    eventHandlers: { handleFocus: jest.fn(), handleBlur: mockHandleBlur, handleKeyDown: jest.fn() },
    ariaDescribedBy: '',
  }),
}));

// Mock event handlers
jest.mock('../event-handlers', () => ({
  handleChangeEvent: jest.fn(),
}));

// Mock FormFieldWrapper to just render children
jest.mock('../FormFieldWrapper', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

import { DatePickerRenderer } from '../DatePicker';

const defaultComponent = {
  id: 'dp-1',
  props: {
    label: 'Test Date',
    dateFormat: 'YYYY-MM-DD' as const,
    placeholder: 'Select date',
  },
};

const defaultEvaluationScope = {
  theme: {
    colors: {
      primary: '#4f46e5',
      text: '#111827',
      surface: '#fff',
      border: '#e5e7eb',
      onPrimary: '#fff',
      disabled: '#d1d5db',
    },
  },
};

function renderDatePicker(propOverrides: Record<string, any> = {}) {
  const component = {
    ...defaultComponent,
    props: { ...defaultComponent.props, ...propOverrides },
  };
  return render(
    <DatePickerRenderer
      component={component as any}
      mode="preview"
      dataStore={{}}
      onUpdateDataStore={jest.fn()}
      evaluationScope={defaultEvaluationScope}
    />
  );
}

/** Opens the calendar popup by focusing the input */
function openCalendar() {
  const input = screen.getByRole('textbox');
  fireEvent.focus(input);
}

describe('DatePicker component', () => {

  beforeEach(() => {
    mockHandleBlur.mockClear();
    mockValidateOnBlur.mockClear();
  });

  // ==========================================
  // BUG-F003: Premature validation on calendar open
  // ==========================================
  describe('BUG-F003: No premature validation when calendar opens', () => {
    it('does not call handleBlur when calendar is open (blur caused by focus moving to popup)', () => {
      renderDatePicker();
      const input = screen.getByRole('textbox');

      // Focus to open calendar
      fireEvent.focus(input);

      // Calendar should be open
      expect(screen.getByRole('dialog', { name: 'Calendar' })).toBeInTheDocument();

      // Blur the input (simulates focus moving to calendar popup)
      fireEvent.blur(input);

      // handleBlur should NOT have been called since calendar is open
      expect(mockHandleBlur).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // BUG-001: Year/Month Jump Navigation
  // ==========================================
  describe('BUG-001: Year/Month jump navigation', () => {

    it('renders month and year as clickable buttons in calendar header', () => {
      renderDatePicker();
      openCalendar();

      const dialog = screen.getByRole('dialog', { name: 'Calendar' });
      const monthButton = within(dialog).getByRole('button', { name: 'Select month' });
      const yearButton = within(dialog).getByRole('button', { name: 'Select year' });

      expect(monthButton).toBeInTheDocument();
      expect(yearButton).toBeInTheDocument();
      // Verify they show current month/year text
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      expect(monthButton).toHaveTextContent(monthNames[now.getMonth()]);
      expect(yearButton).toHaveTextContent(String(now.getFullYear()));
    });

    it('shows month picker grid when month button is clicked', () => {
      renderDatePicker();
      openCalendar();

      const dialog = screen.getByRole('dialog', { name: 'Calendar' });
      const monthButton = within(dialog).getByRole('button', { name: 'Select month' });

      fireEvent.click(monthButton);

      // Verify all 12 months are displayed
      const monthPicker = within(dialog).getByRole('listbox', { name: 'Month picker' });
      expect(monthPicker).toBeInTheDocument();
      const monthOptions = within(monthPicker).getAllByRole('option');
      expect(monthOptions).toHaveLength(12);

      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      shortMonths.forEach(month => {
        expect(within(monthPicker).getByText(month)).toBeInTheDocument();
      });
    });

    it('navigates to selected month from month picker', () => {
      renderDatePicker();
      openCalendar();

      const dialog = screen.getByRole('dialog', { name: 'Calendar' });
      const monthButton = within(dialog).getByRole('button', { name: 'Select month' });

      // Open month picker
      fireEvent.click(monthButton);

      // Select March
      const marchOption = within(dialog).getByText('Mar');
      fireEvent.click(marchOption);

      // Verify calendar shows March — month picker should close, header should show "March"
      const updatedMonthButton = within(dialog).getByRole('button', { name: 'Select month' });
      expect(updatedMonthButton).toHaveTextContent('March');

      // Verify day headers are back (the days view is shown)
      expect(within(dialog).getByText('Su')).toBeInTheDocument();
    });

    it('shows year picker when year button is clicked', () => {
      renderDatePicker();
      openCalendar();

      const dialog = screen.getByRole('dialog', { name: 'Calendar' });
      const yearButton = within(dialog).getByRole('button', { name: 'Select year' });

      fireEvent.click(yearButton);

      // Verify year list is displayed
      const yearPicker = within(dialog).getByRole('listbox', { name: 'Year picker' });
      expect(yearPicker).toBeInTheDocument();
      const yearOptions = within(yearPicker).getAllByRole('option');
      // Default range: currentYear-100 to currentYear+10 = 111 years
      expect(yearOptions.length).toBeGreaterThan(50);
    });

    it('navigates to selected year from year picker', () => {
      renderDatePicker();
      openCalendar();

      const dialog = screen.getByRole('dialog', { name: 'Calendar' });
      const yearButton = within(dialog).getByRole('button', { name: 'Select year' });

      // Open year picker
      fireEvent.click(yearButton);

      // Select year 2000
      const yearPicker = within(dialog).getByRole('listbox', { name: 'Year picker' });
      const year2000 = within(yearPicker).getByText('2000');
      fireEvent.click(year2000);

      // Verify year picker closes and header shows 2000
      const updatedYearButton = within(dialog).getByRole('button', { name: 'Select year' });
      expect(updatedYearButton).toHaveTextContent('2000');

      // Verify day headers are back (days view is shown)
      expect(within(dialog).getByText('Su')).toBeInTheDocument();
    });

    it('respects minDate/maxDate range in year picker', () => {
      renderDatePicker({ minDate: '1950-01-01', maxDate: '2010-12-31' });
      openCalendar();

      const dialog = screen.getByRole('dialog', { name: 'Calendar' });
      const yearButton = within(dialog).getByRole('button', { name: 'Select year' });

      fireEvent.click(yearButton);

      const yearPicker = within(dialog).getByRole('listbox', { name: 'Year picker' });
      const yearOptions = within(yearPicker).getAllByRole('option');

      // Should have years from 1950 to 2010 = 61 years
      expect(yearOptions).toHaveLength(61);

      // First year should be 1950
      expect(yearOptions[0]).toHaveTextContent('1950');
      // Last year should be 2010
      expect(yearOptions[yearOptions.length - 1]).toHaveTextContent('2010');

      // Years outside range should not exist
      expect(within(yearPicker).queryByText('1949')).not.toBeInTheDocument();
      expect(within(yearPicker).queryByText('2011')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // IMP-006: Date Picker presets
  // ==========================================
  describe('IMP-006: Date Picker presets', () => {

    it('shows Today and Yesterday buttons in calendar footer', () => {
      renderDatePicker();
      openCalendar();

      const dialog = screen.getByRole('dialog', { name: 'Calendar' });
      expect(within(dialog).getByRole('button', { name: 'Today' })).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Yesterday' })).toBeInTheDocument();
    });

    it('disables preset buttons when date is outside min/max range', () => {
      // Set min/max to a range far in the past so Today and Yesterday are outside range
      renderDatePicker({ minDate: '1990-01-01', maxDate: '1990-12-31' });
      openCalendar();

      const dialog = screen.getByRole('dialog', { name: 'Calendar' });
      const todayBtn = within(dialog).getByRole('button', { name: 'Today' });
      const yesterdayBtn = within(dialog).getByRole('button', { name: 'Yesterday' });

      expect(todayBtn).toBeDisabled();
      expect(yesterdayBtn).toBeDisabled();
    });
  });

  // ==========================================
  // BUG-002: Calendar closes on Escape
  // ==========================================
  describe('BUG-002: Calendar closes on Escape key', () => {

    it('closes calendar popup when Escape key is pressed', async () => {
      const user = userEvent.setup();
      renderDatePicker();

      // Open the calendar by clicking the input
      const input = screen.getByRole('textbox');
      await act(async () => {
        await user.click(input);
      });

      // Verify calendar is open
      expect(screen.getByRole('dialog', { name: 'Calendar' })).toBeInTheDocument();

      // Press Escape key
      await act(async () => {
        await user.keyboard('{Escape}');
      });

      // Verify calendar is closed
      expect(screen.queryByRole('dialog', { name: 'Calendar' })).not.toBeInTheDocument();
    });

    it('resets picker view to days when Escape is pressed', async () => {
      const user = userEvent.setup();
      renderDatePicker();

      // Open calendar by clicking the input
      const input = screen.getByRole('textbox');
      await act(async () => {
        await user.click(input);
      });

      // Verify calendar is open
      expect(screen.getByRole('dialog', { name: 'Calendar' })).toBeInTheDocument();

      // Open month picker by clicking the month button in the header
      const monthButton = screen.getByRole('button', { name: 'Select month' });
      fireEvent.click(monthButton);

      // Verify month picker is showing
      expect(screen.getByRole('listbox', { name: 'Month picker' })).toBeInTheDocument();

      // Press Escape key — should close calendar and reset picker view
      await act(async () => {
        await user.keyboard('{Escape}');
      });

      // Verify calendar is closed
      expect(screen.queryByRole('dialog', { name: 'Calendar' })).not.toBeInTheDocument();

      // Re-open calendar by tabbing away and back to trigger a fresh focus event
      await act(async () => {
        await user.tab(); // blur the input
      });
      await act(async () => {
        fireEvent.focus(input); // re-focus to trigger onFocus which sets isOpen=true
      });

      // Calendar should re-open with days view (not month picker)
      const reopenedDialog = screen.getByRole('dialog', { name: 'Calendar' });
      expect(within(reopenedDialog).queryByRole('listbox', { name: 'Month picker' })).not.toBeInTheDocument();
      // Day headers should be visible (days view is active)
      expect(within(reopenedDialog).getByText('Su')).toBeInTheDocument();
    });
  });
});
