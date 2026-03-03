
import React, { useState, useEffect } from 'react';

interface RenameAppModalProps {
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
  title?: string;
}

export const RenameAppModal: React.FC<RenameAppModalProps> = ({ currentName, onClose, onSave, title = 'Rename Application' }) => {
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  const handleSave = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      onSave(newName.trim());
    } else if (newName.trim() === currentName) {
      onClose(); // No change, just close
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-md border border-ed-border" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-ed-text mb-4">{title}</h2>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="flex justify-end gap-3 p-4 bg-ed-bg-secondary border-t border-ed-border rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-hover">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!newName.trim()} className="px-4 py-2 text-sm font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover disabled:opacity-50">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};