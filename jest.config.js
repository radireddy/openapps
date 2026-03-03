/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', 'performance\\.test\\.ts$', 'geminiService\\.test\\.ts$'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  maxWorkers: '50%',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^@/monacoConfig$': '<rootDir>/src/__mocks__/monacoConfig.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^marked$': '<rootDir>/__mocks__/marked.js',
    '^monaco-editor$': '<rootDir>/src/__mocks__/monaco-editor.ts',
    '^@monaco-editor/react$': '<rootDir>/src/__mocks__/@monaco-editor/react.tsx',
    '^html-to-image$': '<rootDir>/src/__mocks__/html-to-image.ts',
    // Mock assets if needed, though this project uses CDN
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  // Some dependencies ship ESM builds (e.g. `marked`). Allow transforming them.
  transformIgnorePatterns: ['node_modules/(?!(marked)/)'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    // Standard exclusions (type definitions, entry points, constants)
    '!src/types.ts',
    '!src/index.tsx',
    '!src/main.tsx',
    '!src/**/*.d.ts',
    '!src/**/constants.ts',
    '!src/**/*.md',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__mocks__/*.{ts,tsx}',
    '!src/performance.test.ts',
    // Files without dedicated tests yet — add tests then remove exclusion
    '!src/database.ts',
    '!src/Editor.tsx',
    '!src/Dashboard.tsx',
    '!src/CreateAppModal.tsx',
    '!src/DeleteConfirmationModal.tsx',
    '!src/ImportConfirmationModal.tsx',
    '!src/RenameAppModal.tsx',
    '!src/ThemeEditorModal.tsx',
    '!src/ThemePanel.tsx',
    '!src/components/Canvas.tsx',
    '!src/components/Preview.tsx',
    '!src/components/PropertiesPanel.tsx',
    '!src/components/RenderedComponent.tsx',
    '!src/components/StatePanel.tsx',
    '!src/components/TreeView.tsx',
    '!src/components/TreeViewIcons.tsx',
    '!src/components/AIPromptBar.tsx',
    '!src/components/ExpressionEditorModal.tsx',
    '!src/components/JSONEditorModal.tsx',
    '!src/components/IntegrationPanel.tsx',
    '!src/components/SaveAsTemplateModal.tsx',
    '!src/components/TemplateSelectionModal.tsx',
    '!src/theme/**',
    '!src/components/properties/**',

    '!src/components/component-registry/__tests__/**',
    '!src/hooks/useUiPathSDK.ts',
  ],
  // Thresholds set to real baseline after removing artificial exclusions.
  // Files with tests (useAppData, expressions, utils, services, storageService,
  // property-renderers, component-registry) are now included in measurement.
  // Raise thresholds as coverage improves.
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 50,
      statements: 50,
    },
  },
};