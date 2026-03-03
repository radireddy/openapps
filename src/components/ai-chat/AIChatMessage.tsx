import React from 'react';
import type { ChatMessage } from '@/hooks/useAIChat';

interface AIChatMessageProps {
  message: ChatMessage;
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`
          max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed
          ${isUser
            ? 'bg-ed-accent text-ed-text-inverse rounded-br-sm'
            : isError
              ? 'bg-ed-danger-muted text-ed-danger border border-ed-danger/20 rounded-bl-sm'
              : 'bg-ed-bg-tertiary text-ed-text rounded-bl-sm'
          }
        `}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span
          className={`block text-[10px] mt-1 ${
            isUser ? 'text-ed-text-inverse/60' : isError ? 'text-ed-danger/60' : 'text-ed-text-tertiary'
          }`}
        >
          {time}
        </span>
      </div>
    </div>
  );
};
