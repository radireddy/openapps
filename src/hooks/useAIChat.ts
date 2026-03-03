import { useState, useCallback } from 'react';
import { AppDefinition, GlobalTheme, AppTemplate } from '@/types';
import { generateAppLayout } from '@/services/ai/appGenerationService';
import { generateTheme } from '@/services/ai/themeGenerationService';
import { generateTemplate } from '@/services/ai/templateGenerationService';
import type { AIMode } from '@/services/ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
  metadata?: {
    type: 'app' | 'theme' | 'template';
    applied?: boolean;
  };
}

export interface UseAIChatOptions {
  mode: AIMode;
  onAppGenerated?: (app: AppDefinition) => void;
  onThemeGenerated?: (theme: GlobalTheme) => void;
  onTemplateGenerated?: (template: AppTemplate) => void;
  currentApp?: AppDefinition;
  currentPageId?: string;
}

export interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (prompt: string) => Promise<void>;
  clearMessages: () => void;
  error: string | null;
}

function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useAIChat(options: UseAIChatOptions): UseAIChatReturn {
  const { mode, onAppGenerated, onThemeGenerated, onTemplateGenerated, currentApp, currentPageId } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      if ((mode === 'app-create' || mode === 'app-edit') && currentApp && currentPageId) {
        const result = await generateAppLayout(trimmed, currentApp, currentPageId);
        if (result) {
          onAppGenerated?.(result);
          setMessages(prev => [...prev, {
            id: createMessageId(),
            role: 'assistant',
            content: 'Done! I\'ve updated the app based on your request.',
            timestamp: Date.now(),
            metadata: { type: 'app', applied: true },
          }]);
        } else {
          throw new Error('AI returned no result. Please try again.');
        }
      } else if (mode === 'theme') {
        const theme = await generateTheme(trimmed);
        onThemeGenerated?.(theme);
        setMessages(prev => [...prev, {
          id: createMessageId(),
          role: 'assistant',
          content: `Generated theme "${theme.name}" (${theme.type}). ${theme.description || ''}`,
          timestamp: Date.now(),
          metadata: { type: 'theme', applied: true },
        }]);
      } else if (mode === 'template') {
        const template = await generateTemplate(trimmed);
        onTemplateGenerated?.(template);
        setMessages(prev => [...prev, {
          id: createMessageId(),
          role: 'assistant',
          content: `Created template "${template.name}". ${template.description || ''}`,
          timestamp: Date.now(),
          metadata: { type: 'template', applied: true },
        }]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMsg);
      setMessages(prev => [...prev, {
        id: createMessageId(),
        role: 'error',
        content: errorMsg,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [mode, currentApp, currentPageId, onAppGenerated, onThemeGenerated, onTemplateGenerated]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages, error };
}
