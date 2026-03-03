
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import JSZip from 'jszip';
import { exportToReactProject } from '@/services/project-exporter';
import { translateExpression } from '@/services/project-exporter/utils/expressionTranslator';
import * as stringUtils from '@/services/project-exporter/utils/stringUtils';
import { generateAppTsx } from '@/services/project-exporter/generators/AppGenerator';
import { generatePageTsx } from '@/services/project-exporter/generators/PageGenerator';
import { AppDefinition, ComponentType, AppVariableType } from 'types';

// Mock JSZip
const mockFile = jest.fn();
const mockFolder = jest.fn();
const mockGenerateAsync = jest.fn().mockResolvedValue(new Blob(['zip content']));

// Setup JSZip mock to allow chaining: zip.folder().file()
const mockZipObj = {
  file: mockFile,
  folder: mockFolder,
  generateAsync: mockGenerateAsync,
};
mockFolder.mockReturnValue(mockZipObj);

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => mockZipObj);
});

// Mock DOM APIs for download
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
};
global.URL.createObjectURL = jest.fn(() => 'blob:url');
global.URL.revokeObjectURL = jest.fn();
document.createElement = jest.fn((tag) => {
  if (tag === 'a') return mockLink as any;
  return document.createElement(tag);
});
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

// Mock Data
const mockTheme = {
  colors: { background: '#fff', primary: '#000' },
} as any;

const mockApp: AppDefinition = {
  id: 'app1',
  name: 'Test App',
  createdAt: '',
  lastModifiedAt: '',
  mainPageId: 'page1',
  pages: [{ id: 'page1', name: 'Home Page' }],
  components: [
    {
        id: 'input1',
        type: ComponentType.INPUT,
        pageId: 'page1',
        props: { 
            x: 10, y: 10, width: 100, height: 50,
            placeholder: 'Enter name', 
        } as any
    },
    {
        id: 'btn1',
        type: ComponentType.BUTTON,
        pageId: 'page1',
        props: {
            x: 10, y: 70, width: 100, height: 40,
            text: 'Submit',
            actionType: 'alert',
            actionAlertMessage: 'Hello {{userName}}'
        } as any
    }
  ],
  dataStore: {},
  variables: [
      { id: 'v1', name: 'isLoading', type: AppVariableType.BOOLEAN, initialValue: false }
  ],
  theme: mockTheme,
};

describe('Project Exporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('String Utils', () => {
    it('converts to camelCase', () => {
      expect(stringUtils.toCamelCase('Background Color')).toBe('backgroundColor');
      expect(stringUtils.toCamelCase('my-variable')).toBe('myVariable');
      expect(stringUtils.toCamelCase('UPPER CASE')).toBe('upperCase');
    });

    it('converts to PascalCase', () => {
      expect(stringUtils.toPascalCase('my page')).toBe('MyPage');
      expect(stringUtils.toPascalCase('app-name')).toBe('AppName');
    });

    it('sanitizes names', () => {
      expect(stringUtils.sanitizeName('My App (Final)')).toBe('MyAppFinal');
      expect(stringUtils.sanitizeName('123 Testing!')).toBe('123Testing');
    });
  });

  describe('Expression Translator', () => {
    it('translates literal values', () => {
      expect(translateExpression('hello', mockApp, 'raw-js')).toBe('"hello"');
      expect(translateExpression(123, mockApp, 'raw-js')).toBe('123');
      expect(translateExpression(true, mockApp, 'raw-js')).toBe('true');
      expect(translateExpression(undefined, mockApp, 'raw-js')).toBe('undefined');
      expect(translateExpression(undefined, mockApp, 'jsx-attr')).toBe('{undefined}');
    });

    it('translates pure expressions with dataStore access', () => {
      const expr = '{{ userName }}';
      const result = translateExpression(expr, mockApp, 'raw-js');
      // Should wrap unknown identifier in get(dataStore, ...)
      expect(result).toBe("get(dataStore, 'userName')");
    });

    it('translates component property access', () => {
      const expr = '{{ input1.value }}';
      const result = translateExpression(expr, mockApp, 'raw-js');
      // input1 now uses component ID as dataStore key
      expect(result).toBe("get(dataStore, 'input1')");
    });

    it('translates template literals', () => {
      const expr = 'Hello {{ userName }}!';
      const result = translateExpression(expr, mockApp, 'jsx-attr');
      expect(result).toBe("{`Hello ${get(dataStore, 'userName')}!`}");
    });

    it('preserves local variables in code blocks', () => {
        // We can't fully simulate local scope without a parser, but the translator
        // should be smart enough not to touch keywords or if specifically instructed.
        // Currently implementation assumes identifiers are dataStore keys unless in exclusion list.
        // Let's test action transformation which is unique to code-block.
        const expr = "actions.updateVariable('isLoading', true)";
        const result = translateExpression(expr, mockApp, 'code-block');
        expect(result).toBe("setIsLoading(true)");
    });
    
    it('preserves keywords', () => {
        const expr = '{{ true ? 1 : 0 }}';
        const result = translateExpression(expr, mockApp, 'raw-js');
        expect(result).toBe("true ? 1 : 0");
    });

    it('handles jsx-children context', () => {
        const expr = 'Static Text';
        expect(translateExpression(expr, mockApp, 'jsx-children')).toBe('Static Text');
        
        const expr2 = '{{ userName }}';
        expect(translateExpression(expr2, mockApp, 'jsx-children')).toBe("{get(dataStore, 'userName')}");
    });
  });

  describe('App Generator', () => {
    it('generates App.tsx with state initialization', () => {
      const code = generateAppTsx(mockApp);
      expect(code).toContain('const [isLoading, setIsLoading] = useState(false);');
      expect(code).toContain('<HomePage');
      expect(code).toContain('dataStore={dataStore}');
    });

    it('handles different variable types in initial value', () => {
        const complexApp = {
            ...mockApp,
            variables: [
                { id: 'v1', name: 'str', type: AppVariableType.STRING, initialValue: 'test' },
                { id: 'v2', name: 'num', type: AppVariableType.NUMBER, initialValue: '42' },
                { id: 'v3', name: 'obj', type: AppVariableType.OBJECT, initialValue: '{"a":1}' },
                { id: 'v4', name: 'arr', type: AppVariableType.ARRAY, initialValue: '[1,2]' },
            ]
        } as AppDefinition;
        
        const code = generateAppTsx(complexApp);
        expect(code).toContain('useState("test")');
        expect(code).toContain('useState(42)');
        expect(code).toContain('useState({"a":1})');
        expect(code).toContain('useState([1,2])');
    });
  });

  describe('Page Generator', () => {
    it('generates page component with correct name', () => {
      const code = generatePageTsx(mockApp.pages[0], mockApp.components, mockApp);
      expect(code).toContain('export const HomePage');
    });

    it('generates input component with binding', () => {
      const code = generatePageTsx(mockApp.pages[0], mockApp.components, mockApp);
      expect(code).toContain('<input');
      expect(code).toContain("value={get(dataStore, 'input1') || ''}");
      expect(code).toContain("updateDataStore('input1', e.target.value)");
    });

    it('generates button with click handler', () => {
      const code = generatePageTsx(mockApp.pages[0], mockApp.components, mockApp);
      expect(code).toContain('<button');
      expect(code).toContain('onClick={handleBtn1Click}');
      // Check handler body for alert action
      expect(code).toContain("const handleBtn1Click = () => { alert(`Hello ${get(dataStore, 'userName')}`) };");
    });

    
    it('generates code for updateVariable action', () => {
        const appWithVarBtn = {
            ...mockApp,
            components: [{
                id: 'btn3', type: ComponentType.BUTTON, pageId: 'page1',
                props: { actionType: 'updateVariable', actionVariableName: 'isLoading', actionVariableValue: '{{ true }}' } as any
            }]
        } as AppDefinition;
        const code = generatePageTsx(appWithVarBtn.pages[0], appWithVarBtn.components, appWithVarBtn);
        expect(code).toContain("setIsLoading(true)");
    });

    it('generates code for executeCode action', () => {
         const appWithCodeBtn = {
            ...mockApp,
            components: [{
                id: 'btn4', type: ComponentType.BUTTON, pageId: 'page1',
                props: { actionType: 'executeCode', actionCodeToExecute: 'console.log("hi")' } as any
            }]
        } as AppDefinition;
        const code = generatePageTsx(appWithCodeBtn.pages[0], appWithCodeBtn.components, appWithCodeBtn);
        expect(code).toContain('console.log("hi")');
    });

    it('generates containers recursively', () => {
        const appWithContainer = {
            ...mockApp,
            components: [
                { id: 'container1', type: ComponentType.CONTAINER, pageId: 'page1', props: { x:0, y:0, width:200, height:200 } as any },
                { id: 'child1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'container1', props: { text: 'Child' } as any }
            ]
        } as AppDefinition;
        const code = generatePageTsx(appWithContainer.pages[0], appWithContainer.components, appWithContainer);
        
        // Simple check: child should be rendered?
        // The generator builds root components first.
        // The ContainerGenerator recursively calls generator for children.
        // So 'Child' text should appear in the output.
        expect(code).toContain('Child');
        // And logic for nesting? Container uses <div> with children.
    });
    
    it('handles fallback for unknown components', () => {
         const appWithUnknown = {
            ...mockApp,
            components: [
                { id: 'mystery1', type: 'UNKNOWN_TYPE' as any, pageId: 'page1', props: { x:0,y:0 } as any }
            ]
        } as AppDefinition;
        const code = generatePageTsx(appWithUnknown.pages[0], appWithUnknown.components, appWithUnknown);
        expect(code).toContain('Unsupported Component: UNKNOWN_TYPE');
    });
  });

  describe('Integration: exportToReactProject', () => {
    it('creates a zip file with all required assets', async () => {
      await exportToReactProject(mockApp);

      // Verify file structure in zip
      expect(mockFile).toHaveBeenCalledWith('package.json', expect.stringContaining('"name": "test-app"'));
      expect(mockFile).toHaveBeenCalledWith('vite.config.ts', expect.any(String));
      expect(mockFile).toHaveBeenCalledWith('tsconfig.json', expect.any(String));
      expect(mockFile).toHaveBeenCalledWith('index.html', expect.any(String));
      
      // Verify src folder contents
      expect(mockFolder).toHaveBeenCalledWith('src');
      expect(mockFile).toHaveBeenCalledWith('App.tsx', expect.any(String));
      expect(mockFile).toHaveBeenCalledWith('main.tsx', expect.any(String));
      expect(mockFile).toHaveBeenCalledWith('index.css', expect.any(String));

      // Verify pages folder
      expect(mockFolder).toHaveBeenCalledWith('pages');
      expect(mockFile).toHaveBeenCalledWith('HomePage.tsx', expect.any(String));

      // Verify zip generation and download trigger
      expect(mockGenerateAsync).toHaveBeenCalledWith({ type: 'blob' });
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('test_app.zip');
    });
  });
});
