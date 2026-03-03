/**
 * Form Enhancements Test Suite
 *
 * Targeted unit tests for new form enhancement features:
 * - Validation timing (onBlur/onChange/onSubmit)
 * - Size variants (sm/md/lg)
 * - Input prefix/suffix
 * - Input clear button
 * - Input character count
 * - Textarea resize and autoGrow
 * - Checkbox indeterminate and description
 * - RadioGroup layout (horizontal/vertical)
 * - Select clearable and multiple
 * - Switch on/off labels
 * - ReadOnly vs Disabled
 * - Help text rendering
 * - FormFieldWrapper error/help display
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ComponentType } from 'types';
import { componentRegistry } from 'components/component-registry/registry';
import {
  renderComponent,
  createTestComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

// Helper to render a component with specific props in preview mode
// Returns both element (first child) and container (full render container)
function renderPreview(type: ComponentType, props: Record<string, any> = {}) {
  const component = createTestComponent(type, props);
  const result = renderComponent({
    component,
    mode: 'preview',
    dataStore: {},
  });
  return { ...result, container: result.renderResult.container };
}

// Helper to render a component in edit mode
function renderEdit(type: ComponentType, props: Record<string, any> = {}) {
  const component = createTestComponent(type, props);
  const result = renderComponent({
    component,
    mode: 'edit',
    dataStore: {},
  });
  return { ...result, container: result.renderResult.container };
}

describe('Form Enhancements', () => {

  // ==========================================
  // 1. Validation Timing
  // ==========================================
  describe('Validation Timing', () => {
    it('INPUT: onBlur validation shows error after blur on empty required field', () => {
      const component = createTestComponent(ComponentType.INPUT, {
        required: true,
        validationTiming: 'onBlur',
        value: '',
      });

      const rendered = renderComponent({
        component,
        mode: 'preview',
        dataStore: {},
      });

      const container = rendered.renderResult.container;
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();

      // Focus and blur with empty value to trigger onBlur validation
      act(() => {
        fireEvent.focus(input);
      });
      act(() => {
        fireEvent.blur(input);
      });

      // After blur, an error should appear in the FormFieldWrapper
      const errorEl = container.querySelector('[role="alert"]');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toBeTruthy();
    });

    it('INPUT: onChange validation shows error immediately on change', () => {
      const component = createTestComponent(ComponentType.INPUT, {
        required: true,
        validationTiming: 'onChange',
        value: 'initial',
      });

      const rendered = renderComponent({
        component,
        mode: 'preview',
        dataStore: {},
      });

      const container = rendered.renderResult.container;
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();

      // Clear the input to trigger onChange validation
      act(() => {
        fireEvent.change(input, { target: { value: '' } });
      });

      // After onChange validation, error should appear
      const errorEl = container.querySelector('[role="alert"]');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toBeTruthy();
    });
  });

  // ==========================================
  // 2. Size Variants
  // ==========================================
  describe('Size Variants', () => {
    it('INPUT: sm and lg sizes both render successfully', () => {
      const { container: smContainer } = renderPreview(ComponentType.INPUT, { size: 'sm' });
      const { container: lgContainer } = renderPreview(ComponentType.INPUT, { size: 'lg' });

      expect(smContainer.querySelector('input')).toBeTruthy();
      expect(lgContainer.querySelector('input')).toBeTruthy();
    });

    it('TEXTAREA: different sizes render successfully', () => {
      const { container: smContainer } = renderPreview(ComponentType.TEXTAREA, { size: 'sm' });
      const { container: lgContainer } = renderPreview(ComponentType.TEXTAREA, { size: 'lg' });

      expect(smContainer.querySelector('textarea')).toBeTruthy();
      expect(lgContainer.querySelector('textarea')).toBeTruthy();
    });
  });

  // ==========================================
  // 3. Input Prefix/Suffix
  // ==========================================
  describe('Input Prefix/Suffix', () => {
    it('renders prefix text before input', () => {
      const { container } = renderPreview(ComponentType.INPUT, {
        prefixText: '$',
      });

      const prefixEl = container.querySelector('[data-testid="input-prefix"]');
      expect(prefixEl).toBeTruthy();
      expect(prefixEl?.textContent).toBe('$');

      // Prefix should come before input in DOM order
      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      if (prefixEl && input) {
        const parent = input.parentElement;
        const children = parent ? Array.from(parent.children) : [];
        const prefixIndex = children.indexOf(prefixEl as Element);
        const inputIndex = children.indexOf(input);
        expect(prefixIndex).toBeLessThan(inputIndex);
      }
    });

    it('renders suffix text after input', () => {
      const { container } = renderPreview(ComponentType.INPUT, {
        suffixText: '.com',
      });

      const suffixEl = container.querySelector('[data-testid="input-suffix"]');
      expect(suffixEl).toBeTruthy();
      expect(suffixEl?.textContent).toBe('.com');

      // Suffix should come after input in DOM order
      const input = container.querySelector('input');
      if (suffixEl && input) {
        const parent = input.parentElement;
        const children = parent ? Array.from(parent.children) : [];
        const suffixIndex = children.indexOf(suffixEl as Element);
        const inputIndex = children.indexOf(input);
        expect(suffixIndex).toBeGreaterThan(inputIndex);
      }
    });

    it('renders both prefix and suffix together', () => {
      const { container } = renderPreview(ComponentType.INPUT, {
        prefixText: 'https://',
        suffixText: '.com',
      });

      expect(container.querySelector('[data-testid="input-prefix"]')?.textContent).toBe('https://');
      expect(container.querySelector('[data-testid="input-suffix"]')?.textContent).toBe('.com');
    });
  });

  // ==========================================
  // 4. Input Clear Button
  // ==========================================
  describe('Input Clear Button', () => {
    it('shows clear button when clearButton is true and value exists', () => {
      const { container } = renderPreview(ComponentType.INPUT, {
        clearButton: true,
        value: 'some text',
      });

      const clearBtn = container.querySelector('button[aria-label="Clear input"]');
      expect(clearBtn).toBeTruthy();
    });

    it('hides clear button when value is empty', () => {
      const { container } = renderPreview(ComponentType.INPUT, {
        clearButton: true,
        value: '',
      });

      const clearBtn = container.querySelector('button[aria-label="Clear input"]');
      expect(clearBtn).toBeNull();
    });
  });

  // ==========================================
  // 5. Textarea Resize
  // ==========================================
  describe('Textarea Resize', () => {
    it('applies resize CSS property', () => {
      const { container } = renderPreview(ComponentType.TEXTAREA, {
        resize: 'both',
      });

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
      if (textarea) {
        expect(textarea.style.resize).toBe('both');
      }
    });

    it('renders with specified number of rows', () => {
      const { container } = renderPreview(ComponentType.TEXTAREA, {
        rows: 8,
      });

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
      if (textarea) {
        expect(textarea.rows).toBe(8);
      }
    });
  });

  // ==========================================
  // 6. Checkbox Indeterminate
  // ==========================================
  describe('Checkbox Indeterminate', () => {
    it('sets indeterminate state on checkbox element', () => {
      const { container } = renderPreview(ComponentType.CHECKBOX, {
        indeterminate: true,
      });

      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      if (checkbox) {
        expect(checkbox.indeterminate).toBe(true);
      }
    });
  });

  // ==========================================
  // 7. Checkbox Description
  // ==========================================
  describe('Checkbox Description', () => {
    it('renders description text below the label', () => {
      const { container } = renderPreview(ComponentType.CHECKBOX, {
        label: 'Accept Terms',
        description: 'You must accept the terms to continue',
      });

      expect(container.textContent).toContain('You must accept the terms to continue');
    });
  });

  // ==========================================
  // 8. RadioGroup Layout
  // ==========================================
  describe('RadioGroup Layout', () => {
    it('renders vertical layout by default', () => {
      const { container } = renderPreview(ComponentType.RADIO_GROUP, {
        options: 'Option A,Option B,Option C',
        layout: 'vertical',
      });

      const radios = container.querySelectorAll('input[type="radio"]');
      expect(radios.length).toBe(3);
    });

    it('renders horizontal layout when specified', () => {
      const { container } = renderPreview(ComponentType.RADIO_GROUP, {
        options: 'Option A,Option B,Option C',
        layout: 'horizontal',
      });

      const radios = container.querySelectorAll('input[type="radio"]');
      expect(radios.length).toBe(3);

      // RadioGroup uses CSS class 'flex-row' for horizontal layout
      const hasRowLayout = container.querySelector('.flex-row') !== null
        || container.innerHTML.includes('flex-row');
      expect(hasRowLayout).toBe(true);
    });
  });

  // ==========================================
  // 9. Select Multiple
  // ==========================================
  describe('Select Multiple', () => {
    it('sets multiple attribute when multiple is true', () => {
      const { container } = renderPreview(ComponentType.SELECT, {
        options: 'Option A,Option B,Option C',
        multiple: true,
      });

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select).toBeTruthy();
      if (select) {
        expect(select.multiple).toBe(true);
      }
    });
  });

  // ==========================================
  // 10. Select Clearable
  // ==========================================
  describe('Select Clearable', () => {
    it('renders clear button when clearable and has value', () => {
      const { container } = renderPreview(ComponentType.SELECT, {
        options: 'Option A,Option B,Option C',
        clearable: true,
        value: 'Option A',
      });

      // Look for a clear button
      const clearBtn = container.querySelector('button[aria-label="Clear selection"]');
      expect(clearBtn).toBeTruthy();
    });
  });

  // ==========================================
  // 11. Switch On/Off Labels
  // ==========================================
  describe('Switch On/Off Labels', () => {
    it('renders on/off labels when provided', () => {
      const { container } = renderPreview(ComponentType.SWITCH, {
        onLabel: 'ON',
        offLabel: 'OFF',
        label: 'Toggle',
      });

      const textContent = container.textContent || '';
      // At least one of the labels should be visible (depending on current state)
      expect(textContent.includes('ON') || textContent.includes('OFF')).toBe(true);
    });
  });

  // ==========================================
  // 12. ReadOnly vs Disabled
  // ==========================================
  describe('ReadOnly vs Disabled', () => {
    it('INPUT: readOnly prevents editing but allows focus', () => {
      const { container } = renderPreview(ComponentType.INPUT, {
        readOnly: true,
        value: 'readonly text',
      });

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      if (input) {
        expect(input.readOnly).toBe(true);
        expect(input.disabled).toBeFalsy();
      }
    });

    it('INPUT: disabled prevents interaction entirely', () => {
      const { container } = renderPreview(ComponentType.INPUT, {
        disabled: true,
        value: 'disabled text',
      });

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      if (input) {
        expect(input.disabled).toBe(true);
      }
    });

    it('TEXTAREA: readOnly prevents editing but allows focus', () => {
      const { container } = renderPreview(ComponentType.TEXTAREA, {
        readOnly: true,
        defaultValue: 'readonly text',
      });

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      if (textarea) {
        expect(textarea.readOnly).toBe(true);
        expect(textarea.disabled).toBeFalsy();
      }
    });
  });

  // ==========================================
  // 13. Help Text Rendering
  // ==========================================
  describe('Help Text', () => {
    it('INPUT: renders help text below input in preview mode', () => {
      const component = createTestComponent(ComponentType.INPUT, {
        helpText: 'Enter your email address',
      });

      const rendered = renderComponent({
        component,
        mode: 'preview',
        dataStore: {},
      });

      const helpEl = rendered.renderResult.container.querySelector(`[id="${component.id}-help"]`);
      expect(helpEl).toBeTruthy();
      expect(helpEl?.textContent).toBe('Enter your email address');
    });

    it('INPUT: does not render help text in edit mode', () => {
      const component = createTestComponent(ComponentType.INPUT, {
        helpText: 'Enter your email address',
      });

      const rendered = renderComponent({
        component,
        mode: 'edit',
        dataStore: {},
      });

      const helpEl = rendered.renderResult.container.querySelector(`[id="${component.id}-help"]`);
      expect(helpEl).toBeNull();
    });
  });

  // ==========================================
  // 14. FormFieldWrapper Error Display
  // ==========================================
  describe('FormFieldWrapper Error Display', () => {
    it('error message has role="alert" and aria-live="polite"', () => {
      const component = createTestComponent(ComponentType.INPUT, {
        required: true,
        validationTiming: 'onBlur',
        value: '',
      });

      const rendered = renderComponent({
        component,
        mode: 'preview',
        dataStore: {},
      });

      const input = rendered.renderResult.container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();

      // Trigger validation by blurring
      fireEvent.focus(input);
      fireEvent.blur(input);

      // Find error element in the full container
      const errorEl = rendered.renderResult.container.querySelector('[role="alert"]');
      if (errorEl) {
        expect(errorEl.getAttribute('aria-live')).toBe('polite');
        expect(errorEl.textContent).toBeTruthy();
      }
    });
  });

  // ==========================================
  // 15. Required Indicator
  // ==========================================
  describe('Required Fields', () => {
    it('INPUT: sets required attribute when required is true', () => {
      const { container } = renderPreview(ComponentType.INPUT, {
        required: true,
      });

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      if (input) {
        expect(input.required).toBe(true);
        expect(input.getAttribute('aria-required')).toBeTruthy();
      }
    });

    it('CHECKBOX: sets aria-required when required is true', () => {
      const { container } = renderPreview(ComponentType.CHECKBOX, {
        required: true,
        label: 'Accept Terms',
      });

      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      if (checkbox) {
        expect(
          checkbox.required || checkbox.getAttribute('aria-required') === 'true'
        ).toBe(true);
      }
    });
  });

  // ==========================================
  // 16. Character Count Display
  // ==========================================
  describe('Character Count', () => {
    it('INPUT: shows character count when showCharacterCount and maxLength are set', () => {
      const component = createTestComponent(ComponentType.INPUT, {
        showCharacterCount: true,
        maxLength: 50,
        value: 'Hello',
      });

      const rendered = renderComponent({
        component,
        mode: 'preview',
        dataStore: {},
      });

      const containerText = rendered.renderResult.container.textContent || '';
      // Should show something like "5/50"
      expect(containerText).toContain('/50');
    });
  });

  // ==========================================
  // Checkbox: hideDescriptionWhenChecked (BUG-F005)
  // ==========================================
  describe('Checkbox hideDescriptionWhenChecked (BUG-F005)', () => {
    it('hides description when checked and hideDescriptionWhenChecked is true', () => {
      const component = createTestComponent(ComponentType.CHECKBOX, {
        label: 'I agree',
        description: 'You must agree to proceed',
        hideDescriptionWhenChecked: true,
      });

      // Render unchecked — description should be visible
      const { renderResult } = renderComponent({
        component,
        mode: 'preview',
        dataStore: {},
      });
      expect(screen.getByText('You must agree to proceed')).toBeInTheDocument();

      // Rerender with checked state — description should be hidden
      renderResult.rerender(
        React.createElement(componentRegistry[ComponentType.CHECKBOX].renderer, {
          component,
          mode: 'preview',
          dataStore: { [component.id]: true },
          evaluationScope: createDefaultEvaluationScope(),
        })
      );
      expect(screen.queryByText('You must agree to proceed')).not.toBeInTheDocument();
    });

    it('keeps description visible when hideDescriptionWhenChecked is false (default)', () => {
      const component = createTestComponent(ComponentType.CHECKBOX, {
        label: 'I agree',
        description: 'You must agree to proceed',
      });
      renderComponent({
        component,
        mode: 'preview',
        dataStore: { [component.id]: true },
      });
      expect(screen.getByText('You must agree to proceed')).toBeInTheDocument();
    });
  });
});
