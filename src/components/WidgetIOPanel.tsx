
import React, { useState } from 'react';
import { WidgetInput, WidgetOutput } from '@/types';

interface WidgetIOPanelProps {
  inputs: WidgetInput[];
  outputs: WidgetOutput[];
  onUpdateInputs: (inputs: WidgetInput[]) => void;
  onUpdateOutputs: (outputs: WidgetOutput[]) => void;
}

const INPUT_TYPES: WidgetInput['type'][] = ['string', 'number', 'boolean', 'array', 'object', 'color'];
const OUTPUT_TYPES: WidgetOutput['type'][] = ['string', 'number', 'boolean', 'array', 'object'];

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span
    style={{
      fontSize: '10px',
      padding: '1px 5px',
      borderRadius: '3px',
      backgroundColor: '#e5e7eb',
      color: '#6b7280',
      fontWeight: 500,
      lineHeight: '16px',
      whiteSpace: 'nowrap',
    }}
  >
    {type}
  </span>
);

export const WidgetIOPanel: React.FC<WidgetIOPanelProps> = ({
  inputs,
  outputs,
  onUpdateInputs,
  onUpdateOutputs,
}) => {
  const [activeTab, setActiveTab] = useState<'inputs' | 'outputs'>('inputs');
  const [editingInputId, setEditingInputId] = useState<string | null>(null);
  const [editingOutputId, setEditingOutputId] = useState<string | null>(null);

  // Input form state
  const [inputName, setInputName] = useState('');
  const [inputType, setInputType] = useState<WidgetInput['type']>('string');
  const [inputDescription, setInputDescription] = useState('');
  const [inputDefaultValue, setInputDefaultValue] = useState('');
  const [inputRequired, setInputRequired] = useState(false);
  const [showInputForm, setShowInputForm] = useState(false);

  // Output form state
  const [outputName, setOutputName] = useState('');
  const [outputType, setOutputType] = useState<WidgetOutput['type']>('string');
  const [outputDescription, setOutputDescription] = useState('');
  const [outputExpression, setOutputExpression] = useState('');
  const [showOutputForm, setShowOutputForm] = useState(false);

  // --- Input helpers ---

  const resetInputForm = () => {
    setInputName('');
    setInputType('string');
    setInputDescription('');
    setInputDefaultValue('');
    setInputRequired(false);
    setEditingInputId(null);
    setShowInputForm(false);
  };

  const handleEditInput = (input: WidgetInput) => {
    setEditingInputId(input.id);
    setInputName(input.name);
    setInputType(input.type);
    setInputDescription(input.description || '');
    setInputDefaultValue(input.defaultValue !== undefined ? String(input.defaultValue) : '');
    setInputRequired(input.required);
    setShowInputForm(true);
  };

  const handleSaveInput = () => {
    if (!inputName.trim()) return;

    if (editingInputId) {
      const updated = inputs.map(inp =>
        inp.id === editingInputId
          ? {
              ...inp,
              name: inputName.trim(),
              type: inputType,
              description: inputDescription.trim() || undefined,
              defaultValue: inputDefaultValue || undefined,
              required: inputRequired,
            }
          : inp
      );
      onUpdateInputs(updated);
    } else {
      const newInput: WidgetInput = {
        id: `input_${Date.now()}`,
        name: inputName.trim(),
        type: inputType,
        description: inputDescription.trim() || undefined,
        defaultValue: inputDefaultValue || undefined,
        required: inputRequired,
      };
      onUpdateInputs([...inputs, newInput]);
    }
    resetInputForm();
  };

  const handleDeleteInput = (inputId: string) => {
    if (confirm('Delete this input?')) {
      onUpdateInputs(inputs.filter(i => i.id !== inputId));
      if (editingInputId === inputId) resetInputForm();
    }
  };

  // --- Output helpers ---

  const resetOutputForm = () => {
    setOutputName('');
    setOutputType('string');
    setOutputDescription('');
    setOutputExpression('');
    setEditingOutputId(null);
    setShowOutputForm(false);
  };

  const handleEditOutput = (output: WidgetOutput) => {
    setEditingOutputId(output.id);
    setOutputName(output.name);
    setOutputType(output.type);
    setOutputDescription(output.description || '');
    setOutputExpression(output.expression || '');
    setShowOutputForm(true);
  };

  const handleSaveOutput = () => {
    if (!outputName.trim()) return;

    if (editingOutputId) {
      const updated = outputs.map(out =>
        out.id === editingOutputId
          ? {
              ...out,
              name: outputName.trim(),
              type: outputType,
              description: outputDescription.trim() || undefined,
              expression: outputExpression.trim() || undefined,
            }
          : out
      );
      onUpdateOutputs(updated);
    } else {
      const newOutput: WidgetOutput = {
        id: `output_${Date.now()}`,
        name: outputName.trim(),
        type: outputType,
        description: outputDescription.trim() || undefined,
        expression: outputExpression.trim() || undefined,
      };
      onUpdateOutputs([...outputs, newOutput]);
    }
    resetOutputForm();
  };

  const handleDeleteOutput = (outputId: string) => {
    if (confirm('Delete this output?')) {
      onUpdateOutputs(outputs.filter(o => o.id !== outputId));
      if (editingOutputId === outputId) resetOutputForm();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex border-b border-ed-border shrink-0">
        <button
          onClick={() => setActiveTab('inputs')}
          className={`flex-1 px-3 py-2 text-sm font-semibold text-center transition-colors ${
            activeTab === 'inputs'
              ? 'text-ed-accent border-b-2 border-ed-accent'
              : 'text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover'
          }`}
        >
          Inputs ({inputs.length})
        </button>
        <button
          onClick={() => setActiveTab('outputs')}
          className={`flex-1 px-3 py-2 text-sm font-semibold text-center transition-colors ${
            activeTab === 'outputs'
              ? 'text-ed-accent border-b-2 border-ed-accent'
              : 'text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover'
          }`}
        >
          Outputs ({outputs.length})
        </button>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        {activeTab === 'inputs' ? (
          <>
            {/* Help text */}
            <p className="text-xs text-ed-text-tertiary mb-3">
              Define what data this widget accepts. Use <code className="px-1 py-0.5 bg-ed-bg-secondary rounded text-ed-accent text-[10px] font-mono">{'{{inputs.name}}'}</code> inside the widget to reference these values.
            </p>

            {/* Add button */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-ed-text-secondary uppercase tracking-wider">Inputs</h3>
              {!showInputForm && (
                <button
                  onClick={() => { resetInputForm(); setShowInputForm(true); }}
                  className="p-1 rounded-md text-ed-accent hover:bg-ed-accent-muted"
                  aria-label="Add new input"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            {/* Input form (add/edit) */}
            {showInputForm && (
              <div className="p-3 mb-4 bg-ed-bg-secondary border border-ed-border rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-ed-text">
                    {editingInputId ? 'Edit Input' : 'Add Input'}
                  </h4>
                  <button
                    onClick={resetInputForm}
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
                  placeholder="Input name..."
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                  autoFocus
                />
                <select
                  value={inputType}
                  onChange={e => setInputType(e.target.value as WidgetInput['type'])}
                  className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                >
                  {INPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={inputDescription}
                  onChange={e => setInputDescription(e.target.value)}
                  className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                />
                <input
                  type="text"
                  placeholder="Default value (optional)"
                  value={inputDefaultValue}
                  onChange={e => setInputDefaultValue(e.target.value)}
                  className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                />
                <label className="flex items-center gap-2 text-sm text-ed-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputRequired}
                    onChange={e => setInputRequired(e.target.checked)}
                    className="rounded border-ed-border text-ed-accent focus:ring-ed-accent"
                  />
                  Required
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={resetInputForm}
                    className="flex-1 bg-ed-bg-tertiary text-ed-text-secondary text-sm font-semibold py-2 rounded-md hover:bg-ed-bg-hover"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInput}
                    disabled={!inputName.trim()}
                    className="flex-1 bg-ed-accent text-ed-text-inverse text-sm font-semibold py-2 rounded-md hover:bg-ed-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingInputId ? 'Save Changes' : 'Add Input'}
                  </button>
                </div>
              </div>
            )}

            {/* Input list */}
            <div className="space-y-2">
              {inputs
                .filter(i => editingInputId !== i.id)
                .map(inp => (
                  <div key={inp.id} className="p-2 border border-ed-border rounded-md bg-ed-bg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm text-ed-text">{inp.name}</p>
                          <TypeBadge type={inp.type} />
                          {inp.required && (
                            <span className="text-[10px] font-bold text-ed-danger">*</span>
                          )}
                        </div>
                        {inp.description && (
                          <p className="text-xs text-ed-text-tertiary mt-0.5 truncate">{inp.description}</p>
                        )}
                        {inp.defaultValue !== undefined && (
                          <p className="text-xs text-ed-text-tertiary mt-0.5 truncate">
                            <span style={{ color: '#6b7280' }}>default: </span>
                            {String(inp.defaultValue)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEditInput(inp)}
                          className="p-1 rounded text-ed-accent hover:bg-ed-accent-muted"
                          aria-label={`Edit ${inp.name}`}
                          title="Edit input"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteInput(inp.id)}
                          className="p-1 rounded text-ed-danger hover:bg-ed-danger-muted"
                          aria-label={`Delete ${inp.name}`}
                          title="Delete input"
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

            {inputs.length === 0 && !showInputForm && (
              <p className="text-xs text-ed-text-tertiary text-center py-4">
                No inputs defined yet. Click + to add one.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Outputs tab */}
            <p className="text-xs text-ed-text-tertiary mb-3">
              Define what values this widget exposes to consuming apps.
            </p>

            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-ed-text-secondary uppercase tracking-wider">Outputs</h3>
              {!showOutputForm && (
                <button
                  onClick={() => { resetOutputForm(); setShowOutputForm(true); }}
                  className="p-1 rounded-md text-ed-accent hover:bg-ed-accent-muted"
                  aria-label="Add new output"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            {/* Output form (add/edit) */}
            {showOutputForm && (
              <div className="p-3 mb-4 bg-ed-bg-secondary border border-ed-border rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-ed-text">
                    {editingOutputId ? 'Edit Output' : 'Add Output'}
                  </h4>
                  <button
                    onClick={resetOutputForm}
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
                  placeholder="Output name..."
                  value={outputName}
                  onChange={e => setOutputName(e.target.value)}
                  className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                  autoFocus
                />
                <select
                  value={outputType}
                  onChange={e => setOutputType(e.target.value as WidgetOutput['type'])}
                  className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                >
                  {OUTPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={outputDescription}
                  onChange={e => setOutputDescription(e.target.value)}
                  className="w-full p-2 border border-ed-border rounded-md text-sm bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                />
                <input
                  type="text"
                  placeholder="Expression (e.g., {{dataStore.total}})"
                  value={outputExpression}
                  onChange={e => setOutputExpression(e.target.value)}
                  className="w-full p-2 border border-ed-border rounded-md text-sm font-mono bg-ed-bg text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                />
                <div className="flex gap-2">
                  <button
                    onClick={resetOutputForm}
                    className="flex-1 bg-ed-bg-tertiary text-ed-text-secondary text-sm font-semibold py-2 rounded-md hover:bg-ed-bg-hover"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOutput}
                    disabled={!outputName.trim()}
                    className="flex-1 bg-ed-accent text-ed-text-inverse text-sm font-semibold py-2 rounded-md hover:bg-ed-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingOutputId ? 'Save Changes' : 'Add Output'}
                  </button>
                </div>
              </div>
            )}

            {/* Output list */}
            <div className="space-y-2">
              {outputs
                .filter(o => editingOutputId !== o.id)
                .map(out => (
                  <div key={out.id} className="p-2 border border-ed-border rounded-md bg-ed-bg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm text-ed-text">{out.name}</p>
                          <TypeBadge type={out.type} />
                        </div>
                        {out.description && (
                          <p className="text-xs text-ed-text-tertiary mt-0.5 truncate">{out.description}</p>
                        )}
                        {out.expression && (
                          <p className="text-xs text-ed-text-tertiary mt-0.5 truncate font-mono">
                            <span style={{ color: '#6b7280' }}>expr: </span>
                            {out.expression}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEditOutput(out)}
                          className="p-1 rounded text-ed-accent hover:bg-ed-accent-muted"
                          aria-label={`Edit ${out.name}`}
                          title="Edit output"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteOutput(out.id)}
                          className="p-1 rounded text-ed-danger hover:bg-ed-danger-muted"
                          aria-label={`Delete ${out.name}`}
                          title="Delete output"
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

            {outputs.length === 0 && !showOutputForm && (
              <p className="text-xs text-ed-text-tertiary text-center py-4">
                No outputs defined yet. Click + to add one.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
