import React, { useState, useEffect, useRef } from 'react';
import { PropertyMetadata, PropertyContext } from './metadata';
import { ComponentProps } from '../../types';

export interface PropertyInputProps {
  metadata: PropertyMetadata;
  value: any;
  onChange: (value: any) => void;
  context: PropertyContext;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  error?: string;
  isMixed?: boolean; // True when multiple components have different values
}

/**
 * Base property input component that renders based on metadata type
 */
export const PropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  onOpenExpressionEditor,
  error,
  isMixed = false,
}) => {
  // Use custom renderer if provided
  if (metadata.customRenderer) {
    const CustomRenderer = metadata.customRenderer;
    return (
      <CustomRenderer
        metadata={metadata}
        value={value}
        onChange={onChange}
        context={context}
        onOpenExpressionEditor={onOpenExpressionEditor}
        error={error}
        isMixed={isMixed}
      />
    );
  }

  // Render based on type
  switch (metadata.type) {
    case 'string':
      return (
        <StringPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          onOpenExpressionEditor={onOpenExpressionEditor}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'number':
      return (
        <NumberPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'boolean':
      return (
        <BooleanPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'color':
      return (
        <ColorPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          onOpenExpressionEditor={onOpenExpressionEditor}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'dropdown':
      return (
        <DropdownPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'expression':
    case 'code':
      return (
        <ExpressionPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          onOpenExpressionEditor={onOpenExpressionEditor}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'composite':
      return (
        <CompositePropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          error={error}
          isMixed={isMixed}
        />
      );
    default:
      return (
        <div className="text-ed-danger text-xs">
          Unsupported property type: {metadata.type}
        </div>
      );
  }
};

/**
 * String input with optional expression support
 */
const StringPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  onOpenExpressionEditor,
  error,
  isMixed,
}) => {
  const supportsExpression = metadata.supportsExpression ?? false;
  const isExpression = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
  const [isFxMode, setIsFxMode] = useState(isExpression);

  useEffect(() => {
    const isExpr = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
    setIsFxMode(isExpr);
  }, [value]);

  const handleToggleFx = () => {
    if (isFxMode) {
      const cleanValue = value.replace(/^\{\{|\}\}$/g, '').trim();
      onChange(cleanValue);
    } else {
      onChange(`{{${value}}}`);
    }
    setIsFxMode(!isFxMode);
  };

  const inputId = `prop-${metadata.id}`;
  const displayValue = isMixed ? '— Mixed —' : (value ?? '');

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-ed-text-secondary mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-ed-text-tertiary" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <div className="flex items-center">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-ed-bg-secondary border rounded-l-md p-2 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent ${
            error ? 'border-ed-danger' : 'border-ed-border'
          } ${isMixed ? 'italic text-ed-text-tertiary' : ''}`}
          placeholder={metadata.placeholder}
          disabled={isMixed}
        />
        {supportsExpression && (
          <>
            <button
              onClick={handleToggleFx}
              className={`px-2 py-2 border-t border-b border-l ${
                isFxMode
                  ? 'bg-ed-accent-muted text-ed-accent-text border-ed-accent'
                  : 'bg-ed-bg-tertiary text-ed-text-secondary border-ed-border hover:bg-ed-bg-surface'
              } ${!(onOpenExpressionEditor && isFxMode) ? 'border-r rounded-r-md' : ''}`}
              title="Toggle JavaScript Expression"
            >
              <span className="font-mono text-xs font-bold">fx</span>
            </button>
            {onOpenExpressionEditor && isFxMode && (
              <button
                onClick={() => onOpenExpressionEditor(value, onChange)}
                className="p-2 border-t border-b border-r rounded-r-md bg-ed-bg-tertiary text-ed-text-secondary border-ed-border hover:bg-ed-bg-surface"
                title="Open Expression Editor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
      {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Number input
 */
const NumberPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  // Use empty string for mixed values to avoid HTML5 number input validation error
  // The placeholder will show "— Mixed —" via CSS or we can show it in a label
  const displayValue = isMixed ? '' : (value ?? metadata.defaultValue ?? 0);

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-ed-text-secondary mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-ed-text-tertiary" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      {isMixed && (
        <div className="text-xs text-ed-text-tertiary italic mb-1">— Mixed —</div>
      )}
      <input
        id={inputId}
        type="number"
        value={displayValue}
        onChange={(e) => {
          // Guard against parsing "— Mixed —" or empty strings
          const numValue = e.target.value === '' || e.target.value === '— Mixed —' 
            ? 0 
            : parseFloat(e.target.value) || 0;
          onChange(numValue);
        }}
        className={`w-full bg-ed-bg-secondary border rounded-md p-2 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent ${
          error ? 'border-ed-danger' : 'border-ed-border'
        } ${isMixed ? 'italic text-ed-text-tertiary' : ''}`}
        placeholder={isMixed ? '— Mixed —' : metadata.placeholder}
        disabled={isMixed}
      />
      {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Boolean toggle input
 */
const BooleanPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  const isChecked = isMixed ? false : (value ?? metadata.defaultValue ?? false);

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="flex items-center">
        <input
          id={inputId}
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
          className="mr-2"
          disabled={isMixed}
        />
        <span className="text-xs font-medium text-ed-text-secondary">
          {metadata.label}
          {metadata.tooltip && (
            <span className="ml-1 text-ed-text-tertiary" title={metadata.tooltip}>
              ℹ️
            </span>
          )}
        </span>
      </label>
      {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Color picker input with expression support
 */
const ColorPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  onOpenExpressionEditor,
  error,
  isMixed,
}) => {
  const supportsExpression = metadata.supportsExpression ?? false;
  const isExpression = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
  const [isFxMode, setIsFxMode] = useState(isExpression);

  useEffect(() => {
    const isExpr = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
    setIsFxMode(isExpr);
  }, [value]);

  const handleToggleFx = () => {
    if (isFxMode) {
      const cleanValue = value.replace(/^\{\{|\}\}$/g, '').trim();
      onChange(cleanValue);
    } else {
      onChange(`{{${value}}}`);
    }
    setIsFxMode(!isFxMode);
  };

  const inputId = `prop-${metadata.id}`;
  // Convert 'transparent' to rgba(0,0,0,0) for color input compatibility
  // HTML5 color inputs require hex format, so we use a fallback
  const getColorValue = (val: any): string => {
    if (isMixed) return '#000000';
    if (!val || val === 'transparent') return '#000000'; // Use black with opacity 0 as fallback
    if (typeof val === 'string' && val.startsWith('{{')) return '#000000'; // Expression mode
    return val ?? '#000000';
  };
  
  // Get the hex value for display (normalize to uppercase, ensure # prefix)
  const getHexValue = (val: any): string => {
    if (isMixed) return '— Mixed —';
    if (!val || val === 'transparent') return '#000000';
    if (typeof val === 'string' && val.startsWith('{{')) return val; // Keep expressions as-is
    // Ensure value has # prefix and is uppercase
    const hex = val.toString().trim();
    if (hex.startsWith('#')) {
      return hex.toUpperCase();
    }
    // If it's a valid hex without #, add it
    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return `#${hex.toUpperCase()}`;
    }
    return hex;
  };
  
  const displayValue = getColorValue(value);
  const hexValue = getHexValue(value);
  const [copied, setCopied] = useState(false);
  const [hexInput, setHexInput] = useState(hexValue);

  // Update hex input when value changes
  useEffect(() => {
    setHexInput(getHexValue(value));
  }, [value]);

  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(hexValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePasteHex = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    // Validate hex format
    if (/^#?[0-9A-Fa-f]{6}$/.test(pasted)) {
      const normalized = pasted.startsWith('#') ? pasted.toUpperCase() : `#${pasted.toUpperCase()}`;
      onChange(normalized);
      setHexInput(normalized);
    }
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim();
    setHexInput(newValue);
    
    // If it's a valid hex format, apply it
    if (/^#?[0-9A-Fa-f]{0,6}$/.test(newValue)) {
      if (newValue.length === 6 || (newValue.startsWith('#') && newValue.length === 7)) {
        const normalized = newValue.startsWith('#') ? newValue.toUpperCase() : `#${newValue.toUpperCase()}`;
        if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
          onChange(normalized);
        }
      }
    }
  };

  const handleHexInputBlur = () => {
    // Normalize on blur
    const normalized = hexInput.startsWith('#') ? hexInput.toUpperCase() : `#${hexInput.toUpperCase()}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      onChange(normalized);
      setHexInput(normalized);
    } else {
      // Revert to current value if invalid
      setHexInput(getHexValue(value));
    }
  };

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-ed-text-secondary mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-ed-text-tertiary" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      {/* Hex input as primary/default input */}
      {!isFxMode && !isMixed && (
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={hexInput}
              onChange={handleHexInputChange}
              onBlur={handleHexInputBlur}
              onPaste={handlePasteHex}
              placeholder="#000000"
              className="w-full bg-ed-bg-secondary border border-ed-border rounded-l-md px-3 py-2 text-sm font-mono text-ed-text-secondary focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent"
              disabled={isMixed}
            />
            {/* Color preview swatch */}
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-ed-border pointer-events-none"
              style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : displayValue }}
            />
          </div>
          <input
            type="color"
            value={typeof displayValue === 'string' ? displayValue.toUpperCase() : displayValue}
            onChange={(e) => {
              // If user selects a color, use it directly
              const newValue = e.target.value;
              onChange(newValue);
              setHexInput(newValue.toUpperCase());
            }}
            className="w-12 h-10 bg-ed-bg-secondary border border-ed-border rounded-md cursor-pointer"
            disabled={isMixed}
            title="Color picker"
          />
          <button
            onClick={handleCopyHex}
            className="px-3 py-2 text-xs bg-ed-bg-tertiary hover:bg-ed-bg-surface border border-ed-border rounded-md text-ed-text-secondary transition-colors"
            title="Copy hex value"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      )}
      {/* Expression mode input */}
      {isFxMode && (
        <div className="flex items-center">
          <input
            id={inputId}
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-ed-bg-secondary border rounded-l-md p-2 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent ${
              error ? 'border-ed-danger' : 'border-ed-border'
            }`}
            placeholder={metadata.placeholder || '{{ expression }}'}
            disabled={isMixed}
          />
          {supportsExpression && (
            <>
              <button
                onClick={handleToggleFx}
                className={`px-2 py-2 border-t border-b border-l ${
                  isFxMode
                    ? 'bg-ed-accent-muted text-ed-accent-text border-ed-accent'
                    : 'bg-ed-bg-tertiary text-ed-text-secondary border-ed-border hover:bg-ed-bg-surface'
                } ${!(onOpenExpressionEditor && isFxMode) ? 'border-r rounded-r-md' : ''}`}
                title="Toggle JavaScript Expression"
              >
                <span className="font-mono text-xs font-bold">fx</span>
              </button>
              {onOpenExpressionEditor && isFxMode && (
                <button
                  onClick={() => onOpenExpressionEditor(value, onChange)}
                  className="p-2 border-t border-b border-r rounded-r-md bg-ed-bg-tertiary text-ed-text-secondary border-ed-border hover:bg-ed-bg-surface"
                  title="Open Expression Editor"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      )}
      {/* Mixed state display */}
      {isMixed && (
        <div className="text-xs text-ed-text-tertiary italic py-2">— Mixed —</div>
      )}
      {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Dropdown/select input
 */
const DropdownPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  let options: Array<{ value: string; label: string }> = [];

  if (metadata.options) {
    if (typeof metadata.options === 'function') {
      options = metadata.options(context);
    } else {
      options = metadata.options;
    }
  }

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-ed-text-secondary mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-ed-text-tertiary" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <select
        id={inputId}
        value={isMixed ? '' : (value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-ed-bg-secondary border rounded-md p-2 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent ${
          error ? 'border-ed-danger' : 'border-ed-border'
        } ${isMixed ? 'italic text-ed-text-tertiary' : ''}`}
        disabled={isMixed}
      >
        {isMixed && <option value="">— Mixed —</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Expression input (always supports expressions)
 */
const ExpressionPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  onOpenExpressionEditor,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  const displayValue = isMixed ? '— Mixed —' : (value ?? '');

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-ed-text-secondary mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-ed-text-tertiary" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <div className="flex items-center">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-ed-bg-secondary border rounded-l-md p-2 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent ${
            error ? 'border-ed-danger' : 'border-ed-border'
          } ${isMixed ? 'italic text-ed-text-tertiary' : ''}`}
          placeholder={metadata.placeholder || '{{ expression }}'}
          disabled={isMixed}
        />
        {onOpenExpressionEditor && (
          <button
            onClick={() => onOpenExpressionEditor(value || '', onChange)}
            className="p-2 border-t border-b border-r rounded-r-md bg-ed-bg-tertiary text-ed-text-secondary border-ed-border hover:bg-ed-bg-surface"
            title="Open Expression Editor"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
            </svg>
          </button>
        )}
      </div>
      {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Composite input (multi-field like padding)
 */
const CompositePropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  if (!metadata.compositeFields) {
    return <div className="text-ed-danger text-xs">Composite property missing field definitions</div>;
  }

  const compositeValue = value || {};
  const handleFieldChange = (fieldId: string, fieldValue: any) => {
    onChange({ ...compositeValue, [fieldId]: fieldValue });
  };

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label className="block text-xs font-medium text-ed-text-secondary mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-ed-text-tertiary" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {metadata.compositeFields.map((field) => (
          <div key={field.id}>
            <label className="block text-xs text-ed-text-tertiary mb-1">{field.label}</label>
            <input
              type={field.type}
              value={isMixed ? '' : (compositeValue[field.id] ?? field.defaultValue ?? '')}
              onChange={(e) => {
                // Guard against parsing "—" or "— Mixed —" for number fields
                if (field.type === 'number') {
                  const numValue = e.target.value === '' || e.target.value === '—' || e.target.value === '— Mixed —'
                    ? 0
                    : parseFloat(e.target.value) || 0;
                  handleFieldChange(field.id, numValue);
                } else {
                  handleFieldChange(field.id, e.target.value);
                }
              }}
              className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent"
              placeholder={isMixed ? '—' : ''}
              disabled={isMixed}
            />
          </div>
        ))}
      </div>
      {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Custom renderer for width/height properties that supports both px and % values
 */
export const WidthHeightPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  // Normalize value - handle both number and string types, ensure it's always a valid string
  const normalizeValue = (val: any): string => {
    if (isMixed) return '— Mixed —';
    if (val === null || val === undefined) return metadata.defaultValue ?? '100%';
    if (typeof val === 'number') return `${val}px`; // Convert number to px string
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return metadata.defaultValue ?? '100%';
      return trimmed; // Return the string as-is
    }
    return String(val); // Fallback: convert to string
  };
  const displayValue = normalizeValue(value);

  // Validate that the value is in the format: number + 'px', number + '%', or 'auto'
  const validateValue = (val: string): boolean => {
    if (!val || val.trim() === '') return false;
    const trimmed = val.trim();
    if (trimmed === 'auto') return true;
    const match = trimmed.match(/^(\d+(?:\.\d+)?)(px|%)$/);
    return match !== null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim();
    if (newValue === '') {
      onChange(metadata.defaultValue || '100%');
      return;
    }
    
    // If it's a valid format (number + px or %), use it
    if (validateValue(newValue)) {
      onChange(newValue);
    } else {
      // Allow typing - don't auto-convert while user is typing
      // This allows users to type "50%" without it being converted to "50px" first
      // Only store the raw value while typing
      onChange(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    
    // If empty on blur, restore to current value or default
    if (val === '') {
      const currentValue = value;
      if (currentValue && typeof currentValue === 'string' && currentValue.trim()) {
        // Restore to current value if it exists
        onChange(currentValue);
      } else {
        // Use default if no current value
        onChange(metadata.defaultValue || '100%');
      }
      return;
    }
    
    // On blur, normalize the value
    if (validateValue(val)) {
      // Valid format, keep it as is (normalized)
      onChange(val);
    } else {
      // Try to parse and normalize
      const numValue = parseFloat(val);
      if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
        // If it's just a number, default to px
        onChange(`${numValue}px`);
      } else {
        // Check if it ends with % or px but has invalid format
        if (val.endsWith('%')) {
          const num = parseFloat(val.slice(0, -1));
          if (!isNaN(num) && isFinite(num) && num >= 0) {
            onChange(`${num}%`);
            return;
          }
        } else if (val.endsWith('px')) {
          const num = parseFloat(val.slice(0, -2));
          if (!isNaN(num) && isFinite(num) && num >= 0) {
            onChange(`${num}px`);
            return;
          }
        }
        // Invalid format, revert to current value or default
        const currentValue = value;
        if (currentValue && typeof currentValue === 'string' && currentValue.trim()) {
          onChange(currentValue);
        } else {
          onChange(metadata.defaultValue || '100%');
        }
      }
    }
  };

  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-ed-text-secondary mb-1">
        <span className="flex items-center gap-1">
          {metadata.label}
          {metadata.tooltip && (
            <span className="relative" ref={tooltipRef}>
              <span 
                className="ml-1 text-ed-accent-text cursor-help hover:text-ed-accent-hover transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
                title="Click for more info"
              >
                ℹ️
              </span>
              {showTooltip && (
                <div className="absolute z-50 left-0 mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none">
                  {metadata.tooltip}
                </div>
              )}
            </span>
          )}
        </span>
      </label>
      {isMixed && (
        <div className="text-xs text-ed-text-tertiary italic mb-1">— Mixed —</div>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full bg-ed-bg-secondary border rounded-md p-2 pr-16 text-sm text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent ${
            error ? 'border-ed-danger' : 'border-ed-border'
          } ${isMixed ? 'italic text-ed-text-tertiary' : ''}`}
          placeholder={metadata.placeholder || 'e.g. 400px or 50%'}
          disabled={isMixed}
        />
        {/* Unit indicator - shows current unit or placeholder */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-ed-text-tertiary pointer-events-none">
          {displayValue && displayValue !== '— Mixed —' && !isMixed ? (
            <>
              {displayValue.endsWith('%') ? (
                <span className="text-ed-text-secondary font-medium">%</span>
              ) : displayValue.endsWith('px') ? (
                <span className="text-ed-text-secondary font-medium">px</span>
              ) : (
                <span className="text-ed-text-tertiary">px / %</span>
              )}
            </>
          ) : (
            <span className="text-ed-text-tertiary">px / %</span>
          )}
        </div>
      </div>
      {/* Helper text showing format */}
      <div className="text-xs text-ed-text-tertiary mt-1">
        Format: <span className="font-mono">400px</span> or <span className="font-mono">50%</span>
      </div>
      {error && <div className="text-ed-danger text-xs mt-1">{error}</div>}
    </div>
  );
};

