import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComponentType } from 'types';
import '@testing-library/jest-dom';

// Import all component renderers
import { InputPlugin } from '@/components/component-registry/Input';
import { ButtonPlugin } from '@/components/component-registry/Button';
import { CheckboxPlugin } from '@/components/component-registry/Checkbox';
import { SwitchPlugin } from '@/components/component-registry/Switch';
import { SelectPlugin } from '@/components/component-registry/Select';
import { TextareaPlugin } from '@/components/component-registry/Textarea';
import { RadioGroupPlugin } from '@/components/component-registry/RadioGroup';

describe('Component Disabled State', () => {
  const mockDataStore = { testKey: 'testValue', checkboxKey: true };
  const mockEvaluationScope = {};

  describe('Input Component', () => {
    const baseInput = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Enter text',
        disabled: false,
      },
    };

    it('should NOT be disabled when disabled is false (boolean)', () => {
      render(
        <InputPlugin.renderer
          component={baseInput}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });

    it('should NOT be disabled when disabled is "false" (string)', () => {
      const component = {
        ...baseInput,
        props: { ...baseInput.props, disabled: 'false' },
      };
      render(
        <InputPlugin.renderer
          component={component}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });

    it('should be disabled when disabled is true (boolean)', () => {
      const component = {
        ...baseInput,
        props: { ...baseInput.props, disabled: true },
      };
      render(
        <InputPlugin.renderer
          component={component}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should be disabled when disabled is "true" (string)', () => {
      const component = {
        ...baseInput,
        props: { ...baseInput.props, disabled: 'true' },
      };
      render(
        <InputPlugin.renderer
          component={component}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Button Component', () => {
    const baseButton = {
      id: 'button1',
      type: ComponentType.BUTTON,
      props: {
        x: 0, y: 0, width: 100, height: 40,
        text: 'Click Me',
        backgroundColor: 'blue',
        textColor: 'white',
        actionType: 'none' as const,
        disabled: false,
      },
    };

    it('should NOT be disabled when disabled is false (boolean)', () => {
      render(
        <ButtonPlugin.renderer
          component={baseButton}
          mode="preview"
          evaluationScope={mockEvaluationScope}
        />
      );
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should NOT be disabled when disabled is "false" (string)', () => {
      const component = {
        ...baseButton,
        props: { ...baseButton.props, disabled: 'false' },
      };
      render(
        <ButtonPlugin.renderer
          component={component}
          mode="preview"
          evaluationScope={mockEvaluationScope}
        />
      );
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('Checkbox Component', () => {
    const baseCheckbox = {
      id: 'checkbox1',
      type: ComponentType.CHECKBOX,
      props: {
        x: 0, y: 0, width: 150, height: 30,
        label: 'Check me',
        disabled: false,
      },
    };

    it('should NOT be disabled when disabled is false (boolean)', () => {
      render(
        <CheckboxPlugin.renderer
          component={baseCheckbox}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeDisabled();
    });

    it('should NOT be disabled when disabled is "false" (string)', () => {
      const component = {
        ...baseCheckbox,
        props: { ...baseCheckbox.props, disabled: 'false' },
      };
      render(
        <CheckboxPlugin.renderer
          component={component}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeDisabled();
    });
  });

  describe('Switch Component', () => {
    const baseSwitch = {
      id: 'switch1',
      type: ComponentType.SWITCH,
      props: {
        x: 0, y: 0, width: 180, height: 30,
        label: 'Toggle me',
        disabled: false,
      },
    };

    it('should NOT be disabled when disabled is false (boolean)', () => {
      render(
        <SwitchPlugin.renderer
          component={baseSwitch}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      const switchButton = screen.getByRole('switch');
      expect(switchButton).not.toBeDisabled();
    });

    it('should NOT be disabled when disabled is "false" (string)', () => {
      const component = {
        ...baseSwitch,
        props: { ...baseSwitch.props, disabled: 'false' },
      };
      render(
        <SwitchPlugin.renderer
          component={component}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      const switchButton = screen.getByRole('switch');
      expect(switchButton).not.toBeDisabled();
    });
  });

  describe('Select Component', () => {
    const baseSelect = {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Select option',
        options: 'Option1,Option2',
        disabled: false,
      },
    };

    it('should NOT be disabled when disabled is false (boolean)', () => {
      render(
        <SelectPlugin.renderer
          component={baseSelect}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      expect(screen.getByRole('combobox')).not.toBeDisabled();
    });

    it('should NOT be disabled when disabled is "false" (string)', () => {
      const component = {
        ...baseSelect,
        props: { ...baseSelect.props, disabled: 'false' },
      };
      render(
        <SelectPlugin.renderer
          component={component}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      expect(screen.getByRole('combobox')).not.toBeDisabled();
    });
  });

  describe('Textarea Component', () => {
    const baseTextarea = {
      id: 'textarea1',
      type: ComponentType.TEXTAREA,
      props: {
        x: 0, y: 0, width: 250, height: 100,
        placeholder: 'Enter text',
        disabled: false,
      },
    };

    it('should NOT be disabled when disabled is false (boolean)', () => {
      render(
        <TextareaPlugin.renderer
          component={baseTextarea}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });

    it('should NOT be disabled when disabled is "false" (string)', () => {
      const component = {
        ...baseTextarea,
        props: { ...baseTextarea.props, disabled: 'false' },
      };
      render(
        <TextareaPlugin.renderer
          component={component}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });
  });

  describe('RadioGroup Component', () => {
    const baseRadioGroup = {
      id: 'radio1',
      type: ComponentType.RADIO_GROUP,
      props: {
        x: 0, y: 0, width: 150, height: 80,
        options: 'Option1,Option2',
        disabled: false,
      },
    };

    it('should NOT be disabled when disabled is false (boolean)', () => {
      render(
        <RadioGroupPlugin.renderer
          component={baseRadioGroup}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      const radios = screen.getAllByRole('radio');
      radios.forEach(radio => {
        expect(radio).not.toBeDisabled();
      });
    });

    it('should NOT be disabled when disabled is "false" (string)', () => {
      const component = {
        ...baseRadioGroup,
        props: { ...baseRadioGroup.props, disabled: 'false' },
      };
      render(
        <RadioGroupPlugin.renderer
          component={component}
          mode="preview"
          dataStore={mockDataStore}
          evaluationScope={mockEvaluationScope}
        />
      );
      const radios = screen.getAllByRole('radio');
      radios.forEach(radio => {
        expect(radio).not.toBeDisabled();
      });
    });
  });
});



