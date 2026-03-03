import React, { useState } from 'react';
import { typography } from '@/constants';

interface SaveAsPresetModalProps {
  defaultName: string;
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}

export const SaveAsPresetModal: React.FC<SaveAsPresetModalProps> = ({
  defaultName, onSave, onClose,
}) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-ed-bg border border-ed-border rounded-xl shadow-xl w-full max-w-md p-6"
      >
        <h2 className={`${typography.heading} ${typography.bold} text-ed-text mb-4`}>Save as Preset</h2>

        <label className={`block ${typography.caption} ${typography.semibold} text-ed-text-secondary mb-1`}>
          Name *
        </label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 ${typography.body} bg-ed-bg-secondary border border-ed-border rounded-lg text-ed-text mb-4 focus:outline-none focus:ring-2 focus:ring-ed-accent/30`}
          placeholder="My Preset"
        />

        <label className={`block ${typography.caption} ${typography.semibold} text-ed-text-secondary mb-1`}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={`w-full px-3 py-2 ${typography.body} bg-ed-bg-secondary border border-ed-border rounded-lg text-ed-text mb-4 focus:outline-none focus:ring-2 focus:ring-ed-accent/30 resize-none`}
          placeholder="Optional description..."
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 ${typography.body} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className={`px-4 py-2 ${typography.body} ${typography.semibold} text-ed-text-inverse bg-ed-accent rounded-lg hover:bg-ed-accent-hover disabled:opacity-50`}
          >
            Save Preset
          </button>
        </div>
      </form>
    </div>
  );
};
