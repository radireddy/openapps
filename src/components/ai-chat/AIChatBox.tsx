import React, { useEffect, useRef } from 'react';
import { useAIChat, UseAIChatOptions } from '@/hooks/useAIChat';
import { AIChatMessage } from './AIChatMessage';
import { AIChatInput } from './AIChatInput';
import type { AIMode } from '@/services/ai';

interface AIChatBoxProps extends UseAIChatOptions {
  isOpen: boolean;
  onClose: () => void;
}

const modeLabels: Record<AIMode, string> = {
  'app-create': 'AI App Creator',
  'app-edit': 'AI App Editor',
  'theme': 'AI Theme Generator',
  'template': 'AI App Creator',
};

const modeDescriptions: Record<AIMode, string> = {
  'app-create': 'Describe the app you want to build.',
  'app-edit': 'Tell me what to change — I\'ll update your app.',
  'theme': 'Describe the visual style you want.',
  'template': 'Describe the app you want to create.',
};

const examplePrompts: Record<AIMode, string[]> = {
  'app-create': [
    'A contact form with name, email, and message fields',
    'A dashboard with stats cards and a data table',
    'An employee directory with search and filters',
  ],
  'app-edit': [
    'Add a submit button at the end',
    'Change the layout to 2 columns',
    'Add a header with the title "My App"',
    'Change button color to green',
  ],
  'theme': [
    'A modern dark theme with blue accents',
    'A warm sunset theme with orange and coral tones',
    'A clean minimal light theme with green accents',
  ],
  'template': [
    'A user registration form with email, password, and profile fields',
    'A project management dashboard with task list and progress bars',
    'A settings page with account preferences and notifications',
    'An e-commerce product listing with filters and a shopping cart',
  ],
};

export const AIChatBox: React.FC<AIChatBoxProps> = ({ isOpen, onClose, mode, onAppGenerated, onThemeGenerated, onTemplateGenerated, currentApp, currentPageId }) => {
  const chatOptions: UseAIChatOptions = { mode, onAppGenerated, onThemeGenerated, onTemplateGenerated, currentApp, currentPageId };
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat(chatOptions);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleExampleClick = (prompt: string) => {
    if (!isLoading) {
      sendMessage(prompt);
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[520px] h-[600px] bg-ed-bg border border-ed-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-ed-fade-in-up"
      data-testid="ai-chat-box"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ed-border bg-ed-bg shrink-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-ed-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <h3 className="text-sm font-semibold text-ed-text">{modeLabels[mode]}</h3>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-md text-ed-text-tertiary hover:text-ed-text-secondary hover:bg-ed-bg-hover transition-colors"
              title="Clear chat"
              aria-label="Clear chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-ed-text-tertiary hover:text-ed-text-secondary hover:bg-ed-bg-hover transition-colors"
            aria-label="Close AI chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col h-full">
            {/* Welcome section */}
            <div className="flex flex-col items-center text-center pt-6 pb-4">
              <div className="w-12 h-12 rounded-xl bg-ed-accent/10 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ed-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <p className="text-sm text-ed-text font-semibold mb-1">
                {mode === 'app-edit' ? 'How can I help?' : 'What would you like to create?'}
              </p>
              <p className="text-xs text-ed-text-tertiary max-w-[300px]">
                {modeDescriptions[mode]}
              </p>
            </div>

            {/* Example prompts */}
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-ed-text-tertiary uppercase tracking-wider mb-2 px-1">
                Try an example
              </p>
              <div className="flex flex-col gap-1.5">
                {examplePrompts[mode].map((prompt: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(prompt)}
                    disabled={isLoading}
                    className="text-left px-3 py-2.5 text-xs text-ed-text-secondary bg-ed-bg-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover hover:border-ed-accent/30 hover:text-ed-text transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-ed-text-tertiary group-hover:text-ed-accent shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>{prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map(msg => <AIChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <AIChatInput onSend={sendMessage} isLoading={isLoading} mode={mode} />
    </div>
  );
};
