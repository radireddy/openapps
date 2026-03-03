import React, { useEffect } from 'react';

interface MockEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  onMount?: (editor: any, monaco: any) => void;
  language?: string;
  theme?: string;
  height?: string | number;
  options?: Record<string, unknown>;
  loading?: React.ReactNode;
}

const mockMonaco = {
  languages: {
    typescript: {
      javascriptDefaults: {
        setDiagnosticsOptions: jest.fn(),
        setCompilerOptions: jest.fn(),
        addExtraLib: jest.fn(() => ({ dispose: jest.fn() })),
      },
      ScriptTarget: { ESNext: 99 },
    },
    registerCompletionItemProvider: jest.fn(() => ({ dispose: jest.fn() })),
  },
};

const mockEditor = {
  focus: jest.fn(),
  getModel: jest.fn(() => ({
    getValueLength: jest.fn(() => 0),
    getPositionAt: jest.fn(() => ({ lineNumber: 1, column: 1 })),
  })),
  setPosition: jest.fn(),
};

const MockEditor = React.forwardRef<HTMLTextAreaElement, MockEditorProps>(
  ({ value, defaultValue, onChange, onMount }, ref) => {
    useEffect(() => {
      if (onMount) {
        onMount(mockEditor, mockMonaco);
      }
    }, [onMount]);

    return (
      <textarea
        ref={ref}
        data-testid="monaco-editor-mock"
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  }
);

MockEditor.displayName = 'MockEditor';

const loader = {
  config: jest.fn(),
  init: jest.fn().mockResolvedValue(mockMonaco),
};

export default MockEditor;
export { MockEditor as Editor, loader };
