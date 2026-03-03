import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import FormFieldWrapper from '@/components/component-registry/FormFieldWrapper';
import '@testing-library/jest-dom';

describe('FormFieldWrapper', () => {
  describe('label rendering', () => {
    it('should render label text in edit mode', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="edit" label="Email Address">
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should render label text in preview mode', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" label="Email Address">
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should link label to input via htmlFor', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" label="Email">
          <input id="input1" />
        </FormFieldWrapper>
      );
      const label = screen.getByText('Email');
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'input1');
    });

    it('should show required indicator when required is true', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" label="Email" required={true}>
          <input id="input1" />
        </FormFieldWrapper>
      );
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not show required indicator when required is false', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" label="Email" required={false}>
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('should render children when no label is provided', () => {
      const { container } = render(
        <FormFieldWrapper componentId="input1" mode="edit">
          <input id="input1" data-testid="test-input" />
        </FormFieldWrapper>
      );
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
      // No wrapper div should be added (passthrough)
      expect(container.querySelector('label')).toBeNull();
    });

    it('should not render label for empty/whitespace strings', () => {
      const { container } = render(
        <FormFieldWrapper componentId="input1" mode="edit" label="   ">
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(container.querySelector('label')).toBeNull();
    });
  });

  describe('help text and error messages (preview only)', () => {
    it('should show error message in preview mode', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" errorMessage="Required field">
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Required field');
    });

    it('should not show error message in edit mode', () => {
      const { container } = render(
        <FormFieldWrapper componentId="input1" mode="edit" errorMessage="Required field">
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(container.querySelector('[role="alert"]')).toBeNull();
    });

    it('should show help text in preview mode when no error', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" helpText="Enter your email">
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(screen.getByText('Enter your email')).toBeInTheDocument();
    });

    it('should prioritize error message over help text', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" helpText="Enter email" errorMessage="Invalid email">
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
      expect(screen.queryByText('Enter email')).not.toBeInTheDocument();
    });
  });

  describe('character count', () => {
    it('should show character count in preview mode', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" showCharacterCount={true} currentLength={5} maxLength={100}>
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('should not show character count in edit mode', () => {
      const { container } = render(
        <FormFieldWrapper componentId="input1" mode="edit" showCharacterCount={true} currentLength={5} maxLength={100}>
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(container.textContent).not.toContain('5/100');
    });
  });

  describe('combined label + footer', () => {
    it('should render both label and error in preview mode', () => {
      render(
        <FormFieldWrapper componentId="input1" mode="preview" label="Email" required={true} errorMessage="Required">
          <input id="input1" />
        </FormFieldWrapper>
      );
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Required');
    });
  });
});
