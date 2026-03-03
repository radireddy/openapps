import React, { useState, useRef, useEffect } from 'react';
import type { AIMode } from '@/services/ai';

interface AIChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  mode: AIMode;
}

const placeholderMap: Record<AIMode, string> = {
  'app-create': 'Describe the app you want to create...',
  'app-edit': 'e.g., Add a button, change layout to 2 columns...',
  'theme': 'Describe the theme you want...',
  'template': 'Describe what you want to build...',
};

export const AIChatInput: React.FC<AIChatInputProps> = ({ onSend, isLoading, mode }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !isLoading) {
      onSend(trimmed);
      setValue('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-ed-border bg-ed-bg">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholderMap[mode]}
        disabled={isLoading}
        rows={3}
        className="flex-1 resize-none bg-ed-bg-secondary border border-ed-border rounded-lg px-3 py-2.5 text-sm text-ed-text placeholder-ed-text-tertiary focus:outline-none focus:ring-1 focus:ring-ed-accent/40 focus:border-ed-border-focus disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="ai-chat-input"
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-ed-accent text-ed-text-inverse hover:bg-ed-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Send message"
        data-testid="ai-chat-send"
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        )}
      </button>
    </div>
  );
};
