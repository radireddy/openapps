import React from 'react';

interface DeleteConfirmationModalProps {
  appName: string;
  onClose: () => void;
  onConfirm: () => void;
  /** Optional custom message. Falls back to the default delete confirmation text. */
  message?: React.ReactNode;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ appName, onClose, onConfirm, message }) => {
  return (
    <div className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-md border border-ed-border" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-ed-danger-muted sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-ed-danger" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-bold text-ed-text" id="delete-modal-title">
                    Delete Application
                </h3>
                <div className="mt-2">
                    {message ? (
                      <div className="text-sm text-ed-text-secondary">{message}</div>
                    ) : (
                      <p className="text-sm text-ed-text-secondary">
                        Are you sure you want to delete <span className="font-semibold">{appName}</span>? This action is permanent and cannot be undone.
                      </p>
                    )}
                </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-ed-bg-secondary border-t border-ed-border rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-hover">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-ed-danger rounded-md hover:opacity-90">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};