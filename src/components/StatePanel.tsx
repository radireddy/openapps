
import React, { useState, useEffect } from 'react';
import { AppVariable, AppVariableType } from '../types';

interface StatePanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  variables: AppVariable[];
  onAddVariable: (variable: AppVariable) => void;
  onUpdateVariable: (variableId: string, updates: Partial<AppVariable>) => void;
  onDeleteVariable: (variableId: string) => void;
  variableState?: Record<string, any>;
}

export const StatePanel: React.FC<StatePanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  variables,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
  variableState = {},
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const [varName, setVarName] = useState('');
  const [varType, setVarType] = useState<AppVariableType>(AppVariableType.STRING);
  const [varValue, setVarValue] = useState('');

  // When editing a variable, populate the form
  useEffect(() => {
    if (editingVariableId) {
      const variable = variables.find(v => v.id === editingVariableId);
      if (variable) {
        setVarName(variable.name);
        setVarType(variable.type);
        // Format the value for display
        let displayValue = '';
        if (variable.initialValue !== null && variable.initialValue !== undefined) {
          if (typeof variable.initialValue === 'string') {
            displayValue = variable.initialValue;
          } else if (typeof variable.initialValue === 'object') {
            try {
              displayValue = JSON.stringify(variable.initialValue, null, 2);
            } catch {
              displayValue = String(variable.initialValue);
            }
          } else {
            displayValue = String(variable.initialValue);
          }
        }
        setVarValue(displayValue);
        setShowForm(true);
      }
    }
  }, [editingVariableId, variables]);

  const resetForm = () => {
    setVarName('');
    setVarType(AppVariableType.STRING);
    setVarValue('');
    setEditingVariableId(null);
    setShowForm(false);
  };

  const handleSaveVariable = () => {
    if (!varName.trim()) return;

    if (editingVariableId) {
      // Update existing variable
      const updates: Partial<AppVariable> = {
        name: varName.trim(),
        type: varType,
        initialValue: varValue,
      };
      onUpdateVariable(editingVariableId, updates);
    } else {
      // Create new variable
      onAddVariable({
        id: `var_${Date.now()}`,
        name: varName.trim(),
        type: varType,
        initialValue: varValue,
      });
    }
    resetForm();
  };

  const handleStartAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditVariable = (variable: AppVariable) => {
    setEditingVariableId(variable.id);
  };
  
  const getInitialValuePlaceholder = () => {
    switch (varType) {
        case AppVariableType.OBJECT: return 'e.g., {"key": "value"}';
        case AppVariableType.ARRAY: return 'e.g., ["item1", "item2"]';
        case AppVariableType.ARRAY_OF_OBJECTS: return 'e.g., [{"id": 1, "name": "Item 1"}]';
        case AppVariableType.BOOLEAN: return 'e.g., true or false';
        case AppVariableType.NUMBER: return 'e.g., 123';
        default: return 'e.g., Hello World';
    }
  }

  const formatValuePreview = (value: any, type: AppVariableType): string => {
    if (value === null || value === undefined) return 'null';
    const isComplexType = type === AppVariableType.OBJECT || 
                         type === AppVariableType.ARRAY || 
                         type === AppVariableType.ARRAY_OF_OBJECTS;
    if (isComplexType) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        const jsonStr = JSON.stringify(parsed);
        return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
      } catch {
        return String(value).substring(0, 50);
      }
    }
    return String(value).substring(0, 50);
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3">
        <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-md hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-text"
            aria-label="Expand State Panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="p-3 flex-1 min-h-0 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-ed-text-secondary uppercase tracking-wider">App State</h3>
                {!showForm && (
                  <button 
                      onClick={handleStartAdd}
                      className="p-1 rounded-md text-ed-accent hover:bg-ed-accent-muted"
                      aria-label="Add new app variable"
                  >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                  </button>
                )}
            </div>

            {showForm && (
                <div className="p-3 mb-4 bg-ed-bg-secondary border border-ed-border rounded-md space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-ed-text">
                        {editingVariableId ? 'Edit Variable' : 'Add Variable'}
                      </h4>
                      <button
                        onClick={resetForm}
                        className="p-1 rounded text-ed-text-tertiary hover:text-ed-text-secondary"
                        aria-label="Cancel"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Variable name..."
                        value={varName}
                        onChange={e => setVarName(e.target.value)}
                        className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                        autoFocus
                    />
                     <select
                        value={varType}
                        onChange={e => setVarType(e.target.value as AppVariableType)}
                        className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                        disabled={!!editingVariableId}
                    >
                        {Object.values(AppVariableType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea
                        placeholder={`Initial value... ${getInitialValuePlaceholder()}`}
                        value={varValue}
                        onChange={e => setVarValue(e.target.value)}
                        className="w-full p-2 border border-ed-border rounded-md text-sm font-mono bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                        rows={varType === AppVariableType.OBJECT || varType === AppVariableType.ARRAY || varType === AppVariableType.ARRAY_OF_OBJECTS ? 6 : 2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-ed-bg-tertiary text-ed-text-secondary text-sm font-semibold py-2 rounded-md hover:bg-ed-bg-hover"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveVariable}
                        disabled={!varName.trim()}
                        className="flex-1 bg-ed-accent text-ed-text-inverse text-sm font-semibold py-2 rounded-md hover:bg-ed-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingVariableId ? 'Save Changes' : 'Add Variable'}
                      </button>
                    </div>
                </div>
            )}
            
            <div className="space-y-2">
                {variables
                    .filter(v => editingVariableId !== v.id)
                    .map(v => (
                    <div key={v.id} className="p-2 border border-ed-border rounded-md bg-ed-bg">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-sm text-ed-text">{v.name}</p>
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      backgroundColor: '#e5e7eb',
                                      color: '#6b7280',
                                      fontWeight: 500,
                                      lineHeight: '16px',
                                      whiteSpace: 'nowrap',
                                    }}>{v.type}</span>
                                </div>
                                <p className="text-xs text-ed-text-tertiary mt-1 truncate" title={String(v.initialValue)}>
                                    <span style={{ color: '#6b7280' }}>= </span>
                                    {formatValuePreview(variableState[v.name] ?? v.initialValue, v.type)}
                                </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                                <button
                                    onClick={() => handleEditVariable(v)}
                                    className="p-1 rounded text-ed-accent hover:bg-ed-accent-muted"
                                    aria-label={`Edit ${v.name}`}
                                    title="Edit variable"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm(`Delete variable "${v.name}"?`)) {
                                            onDeleteVariable(v.id);
                                        }
                                    }}
                                    className="p-1 rounded text-ed-danger hover:bg-ed-danger-muted"
                                    aria-label={`Delete ${v.name}`}
                                    title="Delete variable"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};