import React from 'react';

interface AIChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  hasMessages?: boolean;
}

export const AIChatButton: React.FC<AIChatButtonProps> = ({ onClick, isOpen, hasMessages }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 rounded-full
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        transition-all duration-200
        ${isOpen
          ? 'bg-ed-bg-tertiary text-ed-text-secondary hover:bg-ed-bg-hover rotate-0'
          : 'bg-ed-accent text-ed-text-inverse hover:bg-ed-accent-hover'
        }
      `}
      aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      data-testid="ai-chat-button"
    >
      {isOpen ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          {hasMessages && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-ed-warning rounded-full border-2 border-ed-bg" />
          )}
        </>
      )}
    </button>
  );
};
