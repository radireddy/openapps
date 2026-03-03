import React, { useState, useEffect, useRef } from 'react';
import '@/monacoConfig';
import Editor from '@monaco-editor/react';
import { AppVariable, AppComponent, AppPage } from '@/types';
import { generateTypeDefs } from './expression-editor/generateTypeDefs';
import { getSnippetSuggestions } from './expression-editor/snippetSuggestions';

interface PropertyContext {
  propertyId?: string;
  propertyLabel?: string;
  propertyType?: string;
  componentType?: string;
  tab?: string;
  group?: string;
}

interface ExpressionEditorModalProps {
  isOpen: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (newValue: string) => void;
  propertyContext?: PropertyContext;
  variables?: AppVariable[];
  components?: AppComponent[];
  pages?: AppPage[];
}

interface Example {
  title: string;
  description: string;
  code: string;
  category: 'value' | 'style' | 'event' | 'conditional' | 'data' | 'general';
}

/**
 * Generates context-aware examples based on property metadata
 */
const generateExamples = (context?: PropertyContext): Example[] => {
  const examples: Example[] = [];
  const propertyId = context?.propertyId?.toLowerCase() || '';
  const propertyLabel = context?.propertyLabel?.toLowerCase() || '';
  const tab = context?.tab?.toLowerCase() || '';
  const group = context?.group?.toLowerCase() || '';

  // Event-related properties
  if (tab === 'events' || propertyId.includes('onchange') || propertyId.includes('onclick') || 
      propertyId.includes('onfocus') || propertyId.includes('onblur') || propertyId.includes('action')) {
    // Event value examples - available for all events
    examples.push({
      title: 'Get Event Value',
      description: 'Access the value from the event',
      code: `event.target.value`,
      category: 'event'
    });
    examples.push({
      title: 'Log Event Value',
      description: 'Log the event value to console',
      code: `console.log('New value:', event.target.value)`,
      category: 'event'
    });
    examples.push({
      title: 'Update Variable with Event Value',
      description: 'Update an app variable with the event value',
      code: `actions.updateVariable('userInput', event.target.value)`,
      category: 'event'
    });
    examples.push({
      title: 'Conditional Update from Event',
      description: 'Update variable only if event value meets condition',
      code: `(() => {
  const newValue = event.target.value;
  if (newValue.length > 0) {
    actions.updateVariable('userInput', newValue);
  }
})()`,
      category: 'event'
    });
    examples.push({
      title: 'Show Alert',
      description: 'Display an alert message when triggered',
      code: `alert('Hello World')`,
      category: 'event'
    });
    examples.push({
      title: 'Update App Variable',
      description: 'Update an app variable value',
      code: `actions.updateVariable('counter', counter + 1)`,
      category: 'event'
    });
    examples.push({
      title: 'Execute Custom Code',
      description: 'Run custom JavaScript logic with variable updates',
      code: `(() => {
  const newValue = (counter || 0) + 1;
  actions.updateVariable('counter', newValue);
  console.log('Counter updated:', newValue);
})()`,
      category: 'event'
    });
  }

  // Value properties
  if (propertyId.includes('value') || propertyId.includes('text') || propertyId.includes('label') ||
      propertyId.includes('placeholder') || propertyId.includes('defaultvalue')) {
    examples.push({
      title: 'App Variable',
      description: 'Access an app variable by name',
      code: `variableName`,
      category: 'value'
    });
    examples.push({
      title: 'Variable with Logging',
      description: 'Access variable and log its value',
      code: `(() => {
  console.log('Variable value:', variableName);
  return variableName;
})()`,
      category: 'value'
    });
    examples.push({
      title: 'Computed Value',
      description: 'Calculate a value using variables',
      code: `firstName + ' ' + lastName`,
      category: 'value'
    });
    examples.push({
      title: 'Conditional Value',
      description: 'Return different values based on condition',
      code: `isLoggedIn ? 'Welcome back!' : 'Please log in'`,
      category: 'value'
    });
  }

  // Style properties
  if (tab === 'styles' || propertyId.includes('color') || propertyId.includes('background') ||
      propertyId.includes('font') || propertyId.includes('size') || propertyId.includes('width') ||
      propertyId.includes('height') || propertyId.includes('padding') || propertyId.includes('margin') ||
      propertyId.includes('border') || propertyId.includes('opacity') || propertyId.includes('shadow')) {
    examples.push({
      title: 'Theme Color',
      description: 'Use theme color',
      code: `theme.colors.primary`,
      category: 'style'
    });
    examples.push({
      title: 'Dynamic Color',
      description: 'Set color based on variable condition',
      code: `isError ? '#ef4444' : theme.colors.primary`,
      category: 'style'
    });
    examples.push({
      title: 'Calculated Size',
      description: 'Calculate size using variable',
      code: `baseSize * 2 + 'px'`,
      category: 'style'
    });
    examples.push({
      title: 'Conditional Opacity',
      description: 'Change opacity based on variable state',
      code: `isDisabled ? 0.5 : 1`,
      category: 'style'
    });
  }

  // Conditional/Boolean properties
  if (propertyId.includes('disabled') || propertyId.includes('hidden') || propertyId.includes('visible') ||
      propertyId.includes('required') || propertyId.includes('checked') || propertyId.includes('selected')) {
    examples.push({
      title: 'Simple Condition',
      description: 'Check if variable exists',
      code: `userName != null`,
      category: 'conditional'
    });
    examples.push({
      title: 'Complex Condition',
      description: 'Multiple conditions using variables',
      code: `isLoggedIn && role === 'admin'`,
      category: 'conditional'
    });
    examples.push({
      title: 'Negation',
      description: 'Invert boolean variable',
      code: `!isVisible`,
      category: 'conditional'
    });
  }

  // Data source properties
  if (propertyId.includes('data') || propertyId.includes('source') || propertyId.includes('record') ||
      propertyId.includes('selected') || propertyId.includes('item')) {
    examples.push({
      title: 'Selected Record',
      description: 'Get selected record from table',
      code: `table1.selectedRecord`,
      category: 'data'
    });
    examples.push({
      title: 'Data Source Item',
      description: 'Access data source item',
      code: `dataSourceContents.hotels[0]`,
      category: 'data'
    });
    examples.push({
      title: 'Variable Object Property',
      description: 'Access nested property from variable',
      code: `user.profile.name`,
      category: 'data'
    });
  }

  // General examples (always include if no specific examples)
  if (examples.length === 0) {
    examples.push({
      title: 'App Variable',
      description: 'Access an app variable by name',
      code: `variableName`,
      category: 'general'
    });
    examples.push({
      title: 'Variable with Console Log',
      description: 'Access variable and log its value',
      code: `(() => {
  console.log('Variable value:', variableName);
  return variableName;
})()`,
      category: 'general'
    });
    examples.push({
      title: 'Update Variable',
      description: 'Update an app variable value',
      code: `actions.updateVariable('counter', counter + 1)`,
      category: 'general'
    });
    examples.push({
      title: 'Simple Expression',
      description: 'Basic JavaScript expression',
      code: `10 + 20`,
      category: 'general'
    });
    examples.push({
      title: 'String Concatenation',
      description: 'Combine strings with variables',
      code: `'Hello ' + variableName`,
      category: 'general'
    });
    examples.push({
      title: 'Theme Reference',
      description: 'Use theme values',
      code: `theme.colors.primary`,
      category: 'general'
    });
  }

  return examples;
};

/**
 * Formats JavaScript code with proper indentation.
 * Handles {{ }} expression wrappers, tracks string literals to avoid
 * formatting inside strings, and manages brace-based indentation.
 */
const formatJavaScriptCode = (code: string): string => {
  if (!code) return code;

  // Check if wrapped in {{ }}
  const trimmed = code.trim();
  let isExpression = false;
  let inner = trimmed;

  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    isExpression = true;
    inner = trimmed.slice(2, -2).trim();
  }

  // Short-circuit: if code has no braces or semicolons, it's a simple expression
  if (!inner.includes('{') && !inner.includes(';')) {
    return code;
  }

  // Already formatted (contains newlines with indentation)
  if (/\n\s+/.test(inner)) {
    return code;
  }

  const result: string[] = [];
  let indent = 0;
  const INDENT = '  ';
  let current = '';
  let inString: string | null = null;
  let escaped = false;

  const pushLine = (line: string, dedentBefore = false) => {
    if (dedentBefore && indent > 0) indent--;
    const trimmedLine = line.trim();
    if (trimmedLine) {
      result.push(INDENT.repeat(indent) + trimmedLine);
    }
  };

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];

    // Handle escape sequences inside strings
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      current += ch;
      escaped = true;
      continue;
    }

    // Track string literals
    if (!inString && (ch === "'" || ch === '"' || ch === '`')) {
      inString = ch;
      current += ch;
      continue;
    }

    if (inString && ch === inString) {
      inString = null;
      current += ch;
      continue;
    }

    if (inString) {
      current += ch;
      continue;
    }

    // Outside strings - handle structural characters
    if (ch === '{') {
      current += ch;
      pushLine(current);
      current = '';
      indent++;
    } else if (ch === '}') {
      if (current.trim()) {
        pushLine(current);
        current = '';
      }
      // Check for continuation keywords: } else, } catch, } finally
      const rest = inner.slice(i + 1).trimStart();
      if (/^(else|catch|finally)\b/.test(rest)) {
        current = '}';
      } else {
        pushLine('}', true);
      }
    } else if (ch === ';') {
      current += ch;
      pushLine(current);
      current = '';
    } else {
      current += ch;
    }
  }

  // Push any remaining content
  if (current.trim()) {
    pushLine(current);
  }

  const formatted = result.join('\n');

  if (isExpression) {
    return `{{\n${formatted}\n}}`;
  }
  return formatted;
};

/**
 * Applies formatting to expression values, handling the {{ }} wrapper.
 */
const formatExpressionCode = (val: string): string => {
  if (!val) return val;
  return formatJavaScriptCode(val);
};

export const ExpressionEditorModal: React.FC<ExpressionEditorModalProps> = ({
  isOpen, initialValue, onClose, onSave, propertyContext,
  variables = [], components = [], pages = [],
}) => {
  // If initialValue is not an expression, wrap it in {{ }}
  const getInitialExpressionValue = (val: string): string => {
    if (!val) return '{{}}';
    // If already an expression, return as is
    if (val.startsWith('{{') && val.endsWith('}}')) {
      return val;
    }
    // Otherwise, wrap it in {{ }}
    return `{{${val}}}`;
  };

  const [value, setValue] = useState(formatExpressionCode(getInitialExpressionValue(initialValue)));
  const [showExamples, setShowExamples] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const extraLibDisposableRef = useRef<any>(null);
  const snippetDisposableRef = useRef<any>(null);
  const examples = generateExamples(propertyContext);
  const isEmpty = !value || value.trim() === '' || value.trim() === '{{}}' || value.trim() === '{{ }}';

  useEffect(() => {
    if (isOpen) {
      const newValue = getInitialExpressionValue(initialValue);
      setValue(formatExpressionCode(newValue));
      setShowExamples(false); // Hide examples by default
    }
  }, [isOpen, initialValue]);

  // Mark that expression editor is open so Editor.tsx can skip canvas shortcuts
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-expression-editor-open', 'true');
    }
    return () => {
      document.body.removeAttribute('data-expression-editor-open');
    };
  }, [isOpen]);

  // Update type definitions when scope changes
  useEffect(() => {
    if (!isOpen || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const typeDefs = generateTypeDefs(variables, components, pages);

    // Dispose previous extra lib if any
    if (extraLibDisposableRef.current) {
      extraLibDisposableRef.current.dispose();
    }

    extraLibDisposableRef.current = monaco.languages.typescript.javascriptDefaults.addExtraLib(
      typeDefs,
      'ts:expression-scope.d.ts'
    );
  }, [isOpen, variables, components, pages]);

  // Cleanup disposables on unmount
  useEffect(() => {
    return () => {
      if (extraLibDisposableRef.current) {
        extraLibDisposableRef.current.dispose();
        extraLibDisposableRef.current = null;
      }
      if (snippetDisposableRef.current) {
        snippetDisposableRef.current.dispose();
        snippetDisposableRef.current = null;
      }
    };
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JS defaults for expression editing
    const jsDefaults = monaco.languages.typescript.javascriptDefaults;
    jsDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    jsDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      allowJs: true,
    });

    // Add type definitions for intellisense
    const typeDefs = generateTypeDefs(variables, components, pages);
    if (extraLibDisposableRef.current) {
      extraLibDisposableRef.current.dispose();
    }
    extraLibDisposableRef.current = jsDefaults.addExtraLib(
      typeDefs,
      'ts:expression-scope.d.ts'
    );

    // Register snippet completion provider (only once)
    if (!snippetDisposableRef.current) {
      snippetDisposableRef.current = monaco.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems: (_model: any, position: any) => {
          const snippets = getSnippetSuggestions(monaco);
          return {
            suggestions: snippets.map((s: any) => ({
              ...s,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            })),
          };
        },
      });
    }

    // Focus the editor when it mounts
    editor.focus();
  };

  const insertExample = (exampleCode: string) => {
    // Remove {{ }} if present in current value
    let currentCode = value;
    if (currentCode.startsWith('{{') && currentCode.endsWith('}}')) {
      currentCode = currentCode.substring(2, currentCode.length - 2).trim();
    }
    
    // If empty, use the example code, otherwise append
    const newCode = currentCode === '' || currentCode === '{{}}' || currentCode === '{{ }}' 
      ? exampleCode 
      : currentCode + '\n' + exampleCode;
    
    setValue(`{{${newCode}}}`);
    setShowExamples(false);
    
    // Focus editor after insertion
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        // Move cursor to end
        const model = editorRef.current.getModel();
        const position = model.getPositionAt(model.getValueLength());
        editorRef.current.setPosition(position);
      }
    }, 100);
  };

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    let finalValue = value.trim();
    
    // If empty, save empty string (removes expression)
    if (!finalValue) {
      onSave('');
      return;
    }
    
    // If user manually removed {{ }}, treat as primitive value
    // Check if it looks like they want to remove the expression
    if (!finalValue.startsWith('{{') && !finalValue.endsWith('}}')) {
      // User typed a primitive value - save it as-is (removes expression)
      onSave(finalValue);
      return;
    }
    
    // Otherwise, ensure it's properly wrapped as an expression
    if (!finalValue.startsWith('{{')) {
      finalValue = `{{${finalValue}}}`;
    }
    if (!finalValue.endsWith('}}')) {
      finalValue = `${finalValue}}}`;
    }
    onSave(finalValue);
  };

  return (
    <div 
      className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-[9999] flex items-center justify-center p-4" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="expression-editor-title"
      onKeyDown={(e) => {
        // Stop all keyboard events from propagating to canvas
        e.stopPropagation();
      }}
      onKeyUp={(e) => {
        // Stop all keyboard events from propagating to canvas
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-2xl flex flex-col overflow-hidden"
        onKeyDown={(e) => {
          // Stop propagation within the modal content
          e.stopPropagation();
        }}
        onKeyUp={(e) => {
          // Stop propagation within the modal content
          e.stopPropagation();
        }}
      >
        <header className="flex items-center justify-between p-4 border-b border-ed-border">
          <h2 id="expression-editor-title" className="text-lg font-semibold text-ed-text">Edit Expression</h2>
          <button onClick={onClose} className="p-1 rounded-full text-ed-text-tertiary hover:bg-ed-bg-surface hover:text-ed-text-secondary" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-4 flex-grow bg-ed-bg-secondary flex flex-col">
          <div className="mb-2 text-xs text-ed-text-secondary">
            <p>Enter a JavaScript expression. The value will be automatically wrapped in <code className="bg-ed-bg-surface px-1 rounded">{'{{ }}'}</code> if not already wrapped.</p>
            <p className="mt-1">To remove the expression, delete all content and save, or edit the value directly in the input field.</p>
          </div>
          
          {/* Examples Panel */}
          {showExamples && examples.length > 0 && (
            <div className="mb-3 border border-ed-border-secondary rounded-lg bg-ed-accent-muted overflow-hidden">
              <div className="flex items-center justify-between p-2 bg-ed-accent-muted border-b border-ed-border-secondary">
                <h3 className="text-sm font-semibold text-ed-text">Quick Start Examples</h3>
                <button
                  onClick={() => setShowExamples(false)}
                  className="text-ed-accent-text hover:text-ed-accent-hover text-xs"
                  aria-label="Hide examples"
                >
                  Hide
                </button>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {examples.map((example, index) => (
                    <div
                      key={index}
                      className="border border-ed-border-secondary rounded-md bg-ed-bg hover:border-ed-accent hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => insertExample(example.code)}
                    >
                      <div className="p-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-ed-accent-text">{example.title}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-ed-accent-muted text-ed-accent-text rounded">
                                {example.category}
                              </span>
                            </div>
                            <p className="text-xs text-ed-text-secondary mb-2">{example.description}</p>
                            <pre className="text-xs bg-gray-900 text-green-300 p-2 rounded overflow-x-auto font-mono">
                              <code>{example.code}</code>
                            </pre>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              insertExample(example.code);
                            }}
                            className="ml-2 px-2 py-1 text-xs bg-ed-accent text-ed-text-inverse rounded hover:bg-ed-accent-hover transition-colors"
                            title="Insert example"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Show examples button when hidden */}
          {!showExamples && examples.length > 0 && (
            <button
              onClick={() => setShowExamples(true)}
              className="mb-2 text-xs text-ed-accent-text hover:text-ed-accent-hover underline"
            >
              Show Quick Start Examples
            </button>
          )}

          <div className="flex-1 border border-ed-border rounded-md overflow-hidden">
            <Editor
              height="400px"
              defaultLanguage="javascript"
              value={value}
              onChange={(newValue) => setValue(newValue || '')}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                acceptSuggestionOnEnter: 'on',
                snippetSuggestions: 'top',
                parameterHints: { enabled: true },
                hover: { enabled: true },
                contextmenu: true,
                folding: true,
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
              }}
            />
          </div>
        </main>
        <footer className="flex justify-end gap-3 p-4 bg-ed-bg-secondary border-t border-ed-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-tertiary">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover">Save</button>
        </footer>
      </div>
    </div>
  );
};