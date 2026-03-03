
import React, { useState, useEffect } from 'react';

interface JSONEditorModalProps {
  isOpen: boolean;
  initialValue: any;
  variableName: string;
  variableType: string;
  onClose: () => void;
  onSave: (newValue: any) => void;
}

export const JSONEditorModal: React.FC<JSONEditorModalProps> = ({ 
  isOpen, 
  initialValue, 
  variableName,
  variableType,
  onClose, 
  onSave 
}) => {
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFormatted, setIsFormatted] = useState(false);

  // Initialize JSON string from initial value
  useEffect(() => {
    if (isOpen) {
      try {
        let valueToFormat = initialValue;
        
        // If initialValue is already a string, try to parse it first
        if (typeof initialValue === 'string') {
          const trimmed = initialValue.trim();
          if (trimmed) {
            try {
              valueToFormat = JSON.parse(trimmed);
            } catch {
              // If parsing fails, use the string as-is
              valueToFormat = initialValue;
            }
          } else {
            valueToFormat = variableType === 'array_of_objects' ? [] : (variableType === 'array' ? [] : {});
          }
        }
        
        // Format the value as JSON
        const formatted = JSON.stringify(valueToFormat, null, 2);
        setJsonString(formatted);
        setError(null);
        setIsFormatted(true);
      } catch (e) {
        // If initialValue is not valid JSON, show it as-is
        setJsonString(typeof initialValue === 'string' ? initialValue : JSON.stringify(initialValue, null, 2));
        setError(null);
        setIsFormatted(false);
      }
    }
  }, [isOpen, initialValue, variableType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, jsonString]);

  const validateJSON = (jsonStr: string): { valid: boolean; parsed?: any; error?: string } => {
    if (!jsonStr.trim()) {
      // Empty string - return default based on type
      const defaultValue = variableType === 'array_of_objects' || variableType === 'array' ? [] : {};
      return { valid: true, parsed: defaultValue };
    }

    try {
      const parsed = JSON.parse(jsonStr);
      
      // For array_of_objects, validate that it's an array of objects
      if (variableType === 'array_of_objects') {
        if (!Array.isArray(parsed)) {
          return { valid: false, error: 'Value must be an array' };
        }
        if (!parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
          return { valid: false, error: 'All items in the array must be objects' };
        }
      }
      
      // For array type, validate that it's an array
      if (variableType === 'array' && !Array.isArray(parsed)) {
        return { valid: false, error: 'Value must be an array' };
      }
      
      // For object type, validate that it's an object (not array)
      if (variableType === 'object' && (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null)) {
        return { valid: false, error: 'Value must be an object' };
      }
      
      return { valid: true, parsed };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Invalid JSON syntax' };
    }
  };

  const handleFormat = () => {
    const validation = validateJSON(jsonString);
    if (validation.valid && validation.parsed) {
      setJsonString(JSON.stringify(validation.parsed, null, 2));
      setError(null);
      setIsFormatted(true);
    } else {
      setError(validation.error || 'Cannot format invalid JSON');
    }
  };

  const handleSave = () => {
    const validation = validateJSON(jsonString);
    if (validation.valid && validation.parsed !== undefined) {
      onSave(validation.parsed);
      onClose();
    } else {
      setError(validation.error || 'Invalid JSON');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setJsonString(newValue);
    setIsFormatted(false);
    
    // Clear error on change
    if (error) {
      const validation = validateJSON(newValue);
      if (validation.valid) {
        setError(null);
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  const getPlaceholder = () => {
    switch (variableType) {
      case 'array_of_objects':
        return '[\n  {"id": 1, "name": "Item 1"},\n  {"id": 2, "name": "Item 2"}\n]';
      case 'array':
        return '["item1", "item2", "item3"]';
      case 'object':
        return '{\n  "key1": "value1",\n  "key2": "value2"\n}';
      default:
        return 'Enter JSON...';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="json-editor-title"
    >
      <div 
        className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-ed-border">
          <div>
            <h2 id="json-editor-title" className="text-lg font-semibold text-ed-text">
              Edit JSON: {variableName}
            </h2>
            <p className="text-xs text-ed-text-secondary mt-1">Type: {variableType}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-ed-text-tertiary hover:bg-ed-bg-surface hover:text-ed-text-secondary" 
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <main className="p-4 flex-grow bg-ed-bg-secondary flex flex-col min-h-0">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs text-ed-text-secondary">
              <p>Edit JSON value. Press <kbd className="bg-ed-bg-surface px-1.5 py-0.5 rounded text-xs">Ctrl/Cmd + S</kbd> to save, <kbd className="bg-ed-bg-surface px-1.5 py-0.5 rounded text-xs">Esc</kbd> to cancel.</p>
            </div>
            <button
              onClick={handleFormat}
              disabled={isFormatted}
              className="px-3 py-1.5 text-xs font-medium text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Format JSON
            </button>
          </div>
          
          {error && (
            <div className="mb-3 p-3 bg-ed-danger-muted border border-ed-danger/20 rounded-md">
              <p className="text-sm text-ed-danger font-medium">Error: {error}</p>
            </div>
          )}
          
          <textarea
            value={jsonString}
            onChange={handleChange}
            className={`w-full flex-grow p-3 font-mono text-sm bg-gray-900 text-green-300 rounded-md border ${
              error ? 'border-ed-danger' : 'border-ed-border-secondary'
            } focus:outline-none focus:ring-2 focus:ring-ed-accent resize-none`}
            placeholder={getPlaceholder()}
            autoFocus
            spellCheck={false}
          />
        </main>
        
        <footer className="flex justify-end gap-3 p-4 bg-ed-bg-secondary border-t border-ed-border">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-tertiary"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-4 py-2 text-sm font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!error}
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};

