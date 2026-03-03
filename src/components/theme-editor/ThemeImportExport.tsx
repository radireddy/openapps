import React, { useRef } from 'react';
import { Theme } from '@/types';

interface ThemeImportExportProps {
  theme: Theme;
  onImport: (theme: Theme) => void;
}

export const ThemeImportExport: React.FC<ThemeImportExportProps> = ({ theme, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(theme, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Basic validation: check for required top-level keys
        if (parsed.colors && parsed.font && parsed.border && parsed.radius && parsed.spacing) {
          onImport(parsed);
        } else {
          alert('Invalid theme file: missing required properties (colors, font, border, radius, spacing).');
        }
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be imported again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ed-text-secondary bg-ed-bg border border-ed-border rounded hover:bg-ed-bg-hover"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
      <label className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ed-text-secondary bg-ed-bg border border-ed-border rounded hover:bg-ed-bg-hover cursor-pointer">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  );
};
