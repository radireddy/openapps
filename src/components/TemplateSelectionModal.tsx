import React from 'react';
import { AppTemplate } from '../types';

interface TemplateSelectionModalProps {
  templates: AppTemplate[];
  onClose: () => void;
  onSelect: (template: AppTemplate) => void;
}

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ templates, onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="template-selection-title">
      <div className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-4xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-ed-border">
          <h2 id="template-selection-title" className="text-lg font-semibold text-ed-text">Create App from Template</h2>
          <button onClick={onClose} className="p-1 rounded-full text-ed-text-tertiary hover:bg-ed-bg-surface hover:text-ed-text-secondary" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {templates.map(template => (
                <div key={template.id} onClick={() => onSelect(template)} className="bg-ed-bg border border-ed-border rounded-lg shadow-ed-sm hover:shadow-ed-lg hover:border-ed-accent transition-all flex flex-col cursor-pointer group">
                    <div className="aspect-video bg-ed-bg-tertiary rounded-t-lg overflow-hidden">
                        <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-4 flex-grow">
                        <h3 className="text-md font-bold text-ed-text mb-1 truncate group-hover:text-ed-accent-text">{template.name}</h3>
                        <p className="text-xs text-ed-text-secondary flex-grow">{template.description}</p>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6">
              <h3 className="text-xl font-semibold text-ed-text">No Templates Available</h3>
              <p className="mt-2 text-ed-text-secondary">Save an existing app as a template from the dashboard to see it here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};