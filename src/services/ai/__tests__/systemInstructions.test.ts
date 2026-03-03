import { describe, it, expect } from '@jest/globals';
import {
  getAppEditingInstruction,
  getTemplateGenerationInstruction,
  getThemeGenerationInstruction,
} from '../systemInstructions';
import { AppDefinition } from '@/types';
import { defaultLightTheme } from '@/theme-presets';

function createTestApp(): AppDefinition {
  return {
    id: 'test',
    name: 'Test',
    createdAt: '',
    lastModifiedAt: '',
    pages: [{ id: 'page_main', name: 'Main' }],
    mainPageId: 'page_main',
    components: [],
    dataStore: {},
    variables: [],
    theme: defaultLightTheme,
  };
}

describe('System Instructions', () => {
  describe('getTemplateGenerationInstruction', () => {
    const instruction = getTemplateGenerationInstruction();

    it('includes interactivity system section', () => {
      expect(instruction).toContain('INTERACTIVITY SYSTEM');
    });

    it('emphasizes button action wiring at the top', () => {
      // The "MOST IMPORTANT" section should appear before the component catalog
      const mostImportantIdx = instruction.indexOf('MOST IMPORTANT');
      const catalogIdx = instruction.indexOf('COMPONENT CATALOG');
      expect(mostImportantIdx).toBeGreaterThan(-1);
      expect(catalogIdx).toBeGreaterThan(-1);
      expect(mostImportantIdx).toBeLessThan(catalogIdx);
    });

    it('includes common mistakes section', () => {
      expect(instruction).toContain('COMMON MISTAKES');
      expect(instruction).toContain('actionType: "none"');
    });

    it('includes final checklist', () => {
      expect(instruction).toContain('FINAL CHECKLIST');
    });

    it('explains dataStore for reading form field values', () => {
      expect(instruction).toContain('dataStore.INPUT_');
    });

    it('explains variables for computed state', () => {
      expect(instruction).toContain('$vars.');
      expect(instruction).toContain('actions.updateVariable');
    });

    it('documents button action types', () => {
      expect(instruction).toContain('executeCode');
      expect(instruction).toContain('updateVariable');
      expect(instruction).toContain('navigate');
      expect(instruction).toContain('submitForm');
      expect(instruction).toContain('actionCodeToExecute');
    });

    it('documents input event handling', () => {
      expect(instruction).toContain('onChangeActionType');
      expect(instruction).toContain('onChangeCodeToExecute');
    });

    it('documents conditional visibility', () => {
      expect(instruction).toContain('hidden');
      expect(instruction).toContain('!$vars.');
    });

    it('documents validation', () => {
      expect(instruction).toContain('customValidator');
      expect(instruction).toContain('required');
    });

    it('includes working app example with variables and actions', () => {
      expect(instruction).toContain('EMI Calculator');
      expect(instruction).toContain('var_emi');
      expect(instruction).toContain('actions.updateVariable');
      expect(instruction).toContain('Math.pow');
    });

    it('mentions variables in return format', () => {
      expect(instruction).toContain('variables array');
    });

    it('preserves existing layout system docs', () => {
      expect(instruction).toContain('LAYOUT SYSTEM');
      expect(instruction).toContain('flexDirection');
      expect(instruction).toContain('parentId');
    });

    it('preserves theme token documentation', () => {
      expect(instruction).toContain('theme.colors.primary');
      expect(instruction).toContain('theme.spacing.md');
    });

    it('mandates width 100% and height auto for all components', () => {
      expect(instruction).toContain("width: '100%'");
      expect(instruction).toContain("height: 'auto'");
    });

    it('requires container-based layouts', () => {
      expect(instruction).toContain('Root CONTAINER wraps');
      expect(instruction).toContain('CONTAINER for ALL layouts');
    });

    it('requires flexWrap wrap for responsive row containers', () => {
      expect(instruction).toContain("flexWrap: 'wrap'");
    });

    it('includes layout rules in common mistakes', () => {
      expect(instruction).toContain("Fixed pixel width");
      expect(instruction).toContain("without a parent CONTAINER");
    });

    it('includes layout checks in final checklist', () => {
      expect(instruction).toContain('root CONTAINER');
      expect(instruction).toContain("flexWrap: 'wrap'");
    });
  });

  describe('getAppEditingInstruction', () => {
    it('includes interactivity section', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain('INTERACTIVITY');
      expect(instruction).toContain('actions.updateVariable');
      expect(instruction).toContain('dataStore.');
    });

    it('emphasizes button action wiring at the top', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      const mostImportantIdx = instruction.indexOf('MOST IMPORTANT');
      const catalogIdx = instruction.indexOf('COMPONENT CATALOG');
      expect(mostImportantIdx).toBeGreaterThan(-1);
      expect(catalogIdx).toBeGreaterThan(-1);
      expect(mostImportantIdx).toBeLessThan(catalogIdx);
    });

    it('documents executeCode action in component catalog', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain('executeCode');
      expect(instruction).toContain('actionCodeToExecute');
    });

    it('documents input event props in component catalog', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain('onChangeActionType');
    });

    it('preserves existing component hierarchy output', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain('CURRENT PAGE HIERARCHY');
      expect(instruction).toContain('(empty page)');
    });

    it('preserves critical rules', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain('NEVER regenerate existing');
      expect(instruction).toContain('NEVER delete');
    });

    it('documents button action patterns in interactivity section', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain("actionType: 'executeCode'");
      expect(instruction).toContain("actionType: 'navigate'");
      expect(instruction).toContain("actionType: 'submitForm'");
    });

    it('mandates width 100% and height auto for all components', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain("width: '100%'");
      expect(instruction).toContain("height: 'auto'");
    });

    it('requires container-based layouts', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain('CONTAINER for ALL layouts');
    });

    it('requires flexWrap wrap for responsive row containers', () => {
      const instruction = getAppEditingInstruction(createTestApp(), 'page_main', -1);
      expect(instruction).toContain("flexWrap: 'wrap'");
    });
  });

  describe('getThemeGenerationInstruction', () => {
    it('is unchanged and still works', () => {
      const instruction = getThemeGenerationInstruction();
      expect(instruction).toContain('WCAG AA');
      expect(instruction).toContain('primary');
      expect(instruction).toContain('fontFamily');
    });
  });
});
