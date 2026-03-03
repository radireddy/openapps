import { describe, it, expect } from '@jest/globals';
import { patchSchema, templateSchema, buttonActionSchema } from '../schemas';

describe('AI Generation Schemas', () => {
  describe('componentPropertiesSchema (via patchSchema)', () => {
    const componentProps = patchSchema.properties.add.items.properties.props.properties;

    it('includes button action properties', () => {
      expect(componentProps.actionType).toBeDefined();
      expect(componentProps.actionAlertMessage).toBeDefined();
      expect(componentProps.actionVariableName).toBeDefined();
      expect(componentProps.actionVariableValue).toBeDefined();
      expect(componentProps.actionCodeToExecute).toBeDefined();
      expect(componentProps.actionOnSubmitCode).toBeDefined();
    });

    it('actionType has enum constraint excluding none', () => {
      expect(componentProps.actionType.enum).toBeDefined();
      expect(componentProps.actionType.enum).toContain('executeCode');
      expect(componentProps.actionType.enum).toContain('updateVariable');
      expect(componentProps.actionType.enum).toContain('navigate');
      expect(componentProps.actionType.enum).toContain('submitForm');
      expect(componentProps.actionType.enum).toContain('alert');
      expect(componentProps.actionType.enum).not.toContain('none');
    });

    it('includes input event handler properties', () => {
      expect(componentProps.onChangeActionType).toBeDefined();
      expect(componentProps.onChangeCodeToExecute).toBeDefined();
      expect(componentProps.onBlurActionType).toBeDefined();
      expect(componentProps.onBlurCodeToExecute).toBeDefined();
    });

    it('includes validation properties', () => {
      expect(componentProps.customValidator).toBeDefined();
      expect(componentProps.errorMessage).toBeDefined();
    });

    it('preserves existing layout properties', () => {
      expect(componentProps.width).toBeDefined();
      expect(componentProps.height).toBeDefined();
      expect(componentProps.order).toBeDefined();
      expect(componentProps.flexGrow).toBeDefined();
    });

    it('preserves existing form properties', () => {
      expect(componentProps.label).toBeDefined();
      expect(componentProps.placeholder).toBeDefined();
      expect(componentProps.inputType).toBeDefined();
      expect(componentProps.required).toBeDefined();
    });
  });

  describe('patchSchema', () => {
    it('has add, update, delete, and variables arrays', () => {
      expect(patchSchema.properties.add).toBeDefined();
      expect(patchSchema.properties.update).toBeDefined();
      expect(patchSchema.properties.delete).toBeDefined();
      expect(patchSchema.properties.variables).toBeDefined();
    });

    it('variables items have required fields', () => {
      const varItems = patchSchema.properties.variables.items;
      expect(varItems.required).toContain('id');
      expect(varItems.required).toContain('name');
      expect(varItems.required).toContain('type');
      expect(varItems.required).toContain('initialValue');
    });
  });

  describe('buttonActionSchema', () => {
    it('has buttonActions array with required fields', () => {
      expect(buttonActionSchema.required).toContain('buttonActions');
      const items = buttonActionSchema.properties.buttonActions.items;
      expect(items.required).toContain('buttonId');
      expect(items.required).toContain('actionType');
      expect(items.required).toContain('actionCodeToExecute');
    });

    it('actionType has enum excluding none', () => {
      const actionType = buttonActionSchema.properties.buttonActions.items.properties.actionType;
      expect(actionType.enum).toContain('executeCode');
      expect(actionType.enum).not.toContain('none');
    });

    it('is small enough for Gemini structured output (under 20 properties)', () => {
      const propCount = Object.keys(buttonActionSchema.properties.buttonActions.items.properties).length;
      expect(propCount).toBeLessThan(20);
    });
  });

  describe('templateSchema', () => {
    it('has variables array in properties', () => {
      expect(templateSchema.properties.variables).toBeDefined();
    });

    it('templateSchema variables items have required fields', () => {
      const varItems = templateSchema.properties.variables.items;
      expect(varItems.required).toContain('id');
      expect(varItems.required).toContain('name');
      expect(varItems.required).toContain('type');
      expect(varItems.required).toContain('initialValue');
    });

    it('preserves existing required fields', () => {
      expect(templateSchema.required).toContain('name');
      expect(templateSchema.required).toContain('description');
      expect(templateSchema.required).toContain('pages');
      expect(templateSchema.required).toContain('components');
    });
  });
});
