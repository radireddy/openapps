import React, { useState } from 'react';

interface ColorPickerEnhancedProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  contrastAgainst?: string;
}

export const ColorPickerEnhanced: React.FC<ColorPickerEnhancedProps> = ({
  label,
  value,
  onChange,
}) => {
  const [copied, setCopied] = useState(false);
  const isHex = /^#[0-9a-fA-F]{3,8}$/.test(value);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mb-2.5">
      <label className="block text-[11px] font-medium text-ed-text-secondary mb-1">{label}</label>
      <div className="flex items-center gap-1.5">
        {isHex && (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="p-0.5 h-7 w-7 block bg-ed-bg border border-ed-border cursor-pointer rounded"
            title={`Select ${label} color`}
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 bg-ed-bg-secondary border border-ed-border rounded p-1.5 text-[11px] text-ed-text font-mono focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-border-focus"
          spellCheck={false}
        />
        <button
          onClick={handleCopy}
          className="p-1 rounded text-ed-text-tertiary hover:text-ed-text hover:bg-ed-bg-hover"
          title="Copy value"
        >
          {copied ? (
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
