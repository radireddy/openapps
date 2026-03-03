import { describe, it, expect } from '@jest/globals';
import { buildEvaluationScope, ScopeOptions } from '@/hooks/state/evaluationScope';
import { AppDefinition, ComponentType } from '@/types';

const mockTheme = {
  colors: { primary: '#4F46E5', onPrimary: '#fff', secondary: '#06B6D4', onSecondary: '#fff', background: '#fff', surface: '#f5f5f5', text: '#000', border: '#e5e5e5' },
  font: { family: 'Arial' },
  border: { width: '1px', style: 'solid' },
  radius: { default: '4px' },
  spacing: { sm: '4px', md: '8px', lg: '16px' },
};

const makeAppDef = (overrides: Partial<AppDefinition> = {}): AppDefinition => ({
  id: 'app1',
  name: 'Test App',
  createdAt: '',
  lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: [],
  dataStore: {},
  variables: [],
  theme: mockTheme,
  ...overrides,
} as AppDefinition);

describe('buildEvaluationScope', () => {
  it('should include theme in scope', () => {
    const appDef = makeAppDef();
    const scope = buildEvaluationScope(appDef, {}, [], {});

    expect(scope.theme).toBe(mockTheme);
  });

  it('should include pages in scope', () => {
    const appDef = makeAppDef();
    const scope = buildEvaluationScope(appDef, {}, [], {});

    expect(scope.pages).toEqual([{ id: 'page1', name: 'Main Page' }]);
  });

  it('should include dataStore values in scope', () => {
    const appDef = makeAppDef();
    const dataStore = { myKey: 'myValue', count: 42 };
    const scope = buildEvaluationScope(appDef, dataStore, [], {});

    expect(scope.myKey).toBe('myValue');
    expect(scope.count).toBe(42);
  });

  it('should include variable state in scope', () => {
    const appDef = makeAppDef();
    const variableState = { userName: 'Alice', isLoggedIn: true };
    const scope = buildEvaluationScope(appDef, {}, [], variableState);

    expect(scope.userName).toBe('Alice');
    expect(scope.isLoggedIn).toBe(true);
  });

  it('should add component props to scope by component ID', () => {
    const components = [
      { id: 'Input1', type: ComponentType.INPUT, name: 'Input 1', pageId: 'page1', props: { placeholder: 'Enter...' } },
    ] as any[];
    const appDef = makeAppDef({ components });
    const scope = buildEvaluationScope(appDef, {}, components, {});

    expect(scope.Input1).toBeDefined();
    expect(scope.Input1.placeholder).toBe('Enter...');
  });

  it('should resolve component values from dataStore', () => {
    const components = [
      { id: 'Input1', type: ComponentType.INPUT, name: 'Input 1', pageId: 'page1', props: { placeholder: 'Enter...' } },
    ] as any[];
    const dataStore = { Input1: 'user typed this' };
    const appDef = makeAppDef({ components });
    const scope = buildEvaluationScope(appDef, dataStore, components, {});

    expect(scope.Input1.value).toBe('user typed this');
  });

  it('should evaluate expression values when no dataStore entry exists', () => {
    const components = [
      { id: 'Label1', type: ComponentType.LABEL, name: 'Label 1', pageId: 'page1', props: { value: '{{1 + 2}}' } },
    ] as any[];
    const appDef = makeAppDef({ components });
    const scope = buildEvaluationScope(appDef, {}, components, {});

    expect(scope.Label1.value).toBe(3);
  });

  it('should fall back to defaultValue when value is not set', () => {
    const components = [
      { id: 'Input1', type: ComponentType.INPUT, name: 'Input 1', pageId: 'page1', props: { defaultValue: 'fallback' } },
    ] as any[];
    const appDef = makeAppDef({ components });
    const scope = buildEvaluationScope(appDef, {}, components, {});

    expect(scope.Input1.value).toBe('fallback');
  });

  describe('ScopeOptions', () => {
    it('should use themeOverride when provided', () => {
      const overrideTheme = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: '#FF0000',
          onprimary: '#FFFFFF',
        },
      };
      const appDef = makeAppDef();
      const scope = buildEvaluationScope(appDef, {}, [], {}, { themeOverride: overrideTheme });

      expect(scope.theme.colors.primary).toBe('#FF0000');
      expect(scope.theme.colors.onprimary).toBe('#FFFFFF');
    });

    it('should merge extras into scope', () => {
      const appDef = makeAppDef();
      const extras = { uipath: { getProcesses: () => [] } };
      const scope = buildEvaluationScope(appDef, {}, [], {}, { extras });

      expect(scope.uipath).toBeDefined();
      expect(scope.uipath.getProcesses).toBeInstanceOf(Function);
    });

    it('should accept mode parameter without altering behavior (foundation)', () => {
      const appDef = makeAppDef();
      const scopeEdit = buildEvaluationScope(appDef, {}, [], {}, { mode: 'edit' });
      const scopePreview = buildEvaluationScope(appDef, {}, [], {}, { mode: 'preview' });
      const scopeRun = buildEvaluationScope(appDef, {}, [], {}, { mode: 'run' });

      // All modes should produce valid scopes (mode-specific behavior is Phase 2)
      expect(scopeEdit.theme).toBeDefined();
      expect(scopePreview.theme).toBeDefined();
      expect(scopeRun.theme).toBeDefined();
    });

    it('should default to edit mode when no mode specified', () => {
      const appDef = makeAppDef();
      // No options = default mode
      const scope = buildEvaluationScope(appDef, {}, [], {});
      expect(scope.theme).toBeDefined();
    });
  });

  describe('Table selectedRecord', () => {
    it('should add selectedRecord to table component scope', () => {
      const components = [
        {
          id: 'Table1', type: ComponentType.TABLE, name: 'Table 1', pageId: 'page1',
          props: { selectedRecordKey: 'Table1_selected', columns: [] },
        },
      ] as any[];
      const dataStore = { Table1_selected: { id: 1, name: 'Row 1' } };
      const appDef = makeAppDef({ components });
      const scope = buildEvaluationScope(appDef, dataStore, components, {});

      expect(scope.Table1.selectedRecord).toEqual({ id: 1, name: 'Row 1' });
    });
  });
});
