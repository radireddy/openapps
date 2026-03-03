
import React, { useState } from 'react';

interface CreateAppModalProps {
  onClose: () => void;
  onCreate: (appName: string) => void;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({ onClose, onCreate }) => {
  const [appName, setAppName] = useState('');

  const handleCreate = () => {
    if (appName.trim()) {
      onCreate(appName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-md border border-ed-border" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-ed-text mb-4">Create New Application</h2>
          <p className="text-sm text-ed-text-secondary mb-4">Enter a name for your new app. You can change this later.</p>
          <input
            type="text"
            value={appName}
            onChange={e => setAppName(e.target.value)}
            className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
            placeholder="e.g., Customer Dashboard"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <div className="flex justify-end gap-3 p-4 bg-ed-bg-secondary border-t border-ed-border rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-hover">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!appName.trim()} className="px-4 py-2 text-sm font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover disabled:opacity-50">
            Create App
          </button>
        </div>
      </div>
    </div>
  );
};