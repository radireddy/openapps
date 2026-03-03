/**
 * TimePicker Component Tests
 *
 * Tests for BUG-004 (seconds display) and BUG-005 (label rendering).
 * Verifies that:
 * - Time is displayed without seconds when showSeconds is false
 * - Time is displayed with seconds when showSeconds is true
 * - The dataStore value excludes seconds when showSeconds is false
 * - The label renders correctly when the label prop is set
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mocks ────────────────────────────────────────────────────

jest.mock('@/property-renderers/useJavaScriptRenderer', () => ({
  useJavaScriptRenderer: (val: any, _scope: any, fallback: any) => val ?? fallback,
}));

const mockSetLocalValue = jest.fn();
const mockValidateOnChange = jest.fn();
const mockValidateOnBlur = jest.fn();
const mockForceValidate = jest.fn();

let mockCurrentValue: any = '';
let mockLabelText: string = '';

jest.mock('../useFormField', () => ({
  useFormField: (opts: any) => ({
    isDisabled: false,
    isDisabledInPreview: false,
    isReadOnly: false,
    isRequired: false,
    currentValue: mockCurrentValue,
    setLocalValue: mockSetLocalValue,
    validationError: '',
    validateOnChange: mockValidateOnChange,
    validateOnBlur: mockValidateOnBlur,
    forceValidate: mockForceValidate,
    sizeVariant: { fontSize: '14px', padding: '8px', height: 40 },
    finalOpacity: 1,
    helpText: '',
    labelText: mockLabelText,
    boxShadowValue: '',
    pointerEventsStyle: {},
    eventHandlers: {
      handleFocus: jest.fn(),
      handleBlur: jest.fn(),
      handleKeyDown: jest.fn(),
    },
    ariaDescribedBy: '',
  }),
}));

jest.mock('../event-handlers', () => ({
  handleChangeEvent: jest.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────

import { ComponentType } from '../../../types';
import { componentRegistry } from '../registry';
import {
  createTestComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

// ── Helpers ──────────────────────────────────────────────────

const Renderer = componentRegistry[ComponentType.TIME_PICKER].renderer;

function renderTimePicker(
  propOverrides: Record<string, any> = {},
  options: { mode?: 'edit' | 'preview'; dataStore?: Record<string, any>; onUpdateDataStore?: any } = {},
) {
  const component = createTestComponent(ComponentType.TIME_PICKER, propOverrides);
  const scope = createDefaultEvaluationScope();
  const onUpdateDataStore = options.onUpdateDataStore ?? jest.fn();

  return {
    ...render(
      <Renderer
        component={component}
        mode={options.mode ?? 'preview'}
        evaluationScope={scope}
        dataStore={options.dataStore ?? {}}
        onUpdateDataStore={onUpdateDataStore}
      />,
    ),
    onUpdateDataStore,
    component,
  };
}

// ── Tests ────────────────────────────────────────────────────

describe('TimePicker component', () => {
  beforeEach(() => {
    mockCurrentValue = '';
    mockLabelText = '';
    mockSetLocalValue.mockClear();
    mockValidateOnChange.mockClear();
  });

  // BUG-004: seconds display
  describe('BUG-004 — seconds display', () => {
    it('displays time without seconds when showSeconds is false', () => {
      mockCurrentValue = '14:30:00';
      renderTimePicker({ showSeconds: false });

      const input = screen.getByRole('textbox');
      // The value attribute should strip trailing :00
      expect(input).toHaveValue('14:30');
    });

    it('displays HH:MM value unchanged when showSeconds is false and value has no seconds', () => {
      mockCurrentValue = '10:00';
      renderTimePicker({ showSeconds: false });

      const input = screen.getByRole('textbox');
      // "10:00" must remain "10:00", not be truncated to "10"
      expect(input).toHaveValue('10:00');
    });

    it('displays time with seconds when showSeconds is true', () => {
      mockCurrentValue = '14:30:45';
      renderTimePicker({ showSeconds: true });

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('14:30:45');
    });

    it('stores time value without seconds in dataStore when showSeconds is false', () => {
      mockCurrentValue = '';
      const { onUpdateDataStore, component } = renderTimePicker(
        { showSeconds: false },
        { mode: 'preview' },
      );

      const input = screen.getByRole('textbox');

      // Focus the input to open the dropdown
      fireEvent.focus(input);

      // Find and click a time option (e.g. "14:30" in 24h format)
      const option = screen.getByText('14:30');
      fireEvent.mouseDown(option); // prevent blur
      fireEvent.click(option);

      // The dataStore should be called with "14:30" (no seconds)
      expect(onUpdateDataStore).toHaveBeenCalledWith(component.id, '14:30');
    });

    it('stores time value with seconds in dataStore when showSeconds is true', () => {
      mockCurrentValue = '';
      const { onUpdateDataStore, component } = renderTimePicker(
        { showSeconds: true },
        { mode: 'preview' },
      );

      const input = screen.getByRole('textbox');

      // Focus the input to open the dropdown
      fireEvent.focus(input);

      // With showSeconds, the dropdown items include seconds e.g. "14:30:00"
      const option = screen.getByText('14:30:00');
      fireEvent.mouseDown(option);
      fireEvent.click(option);

      // The dataStore should be called with "14:30:00" (with seconds)
      expect(onUpdateDataStore).toHaveBeenCalledWith(component.id, '14:30:00');
    });
  });

  // BUG-005: label rendering
  describe('BUG-005 — label rendering', () => {
    it('renders label text above time picker when label prop is set', () => {
      mockLabelText = 'Start Time';
      renderTimePicker({ label: 'Start Time' });

      const label = screen.getByText('Start Time');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('does not render a label element when label prop is empty', () => {
      mockLabelText = '';
      const { container } = renderTimePicker({ label: '' });

      const labels = container.querySelectorAll('label');
      expect(labels.length).toBe(0);
    });
  });
});
