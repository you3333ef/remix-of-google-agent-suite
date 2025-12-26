import { useState, useCallback, useRef } from 'react';
import { GoogleMapsAgent, createMapsAgent, ReActStep, MapsAgentConfig } from '@/agents/mapsAgent';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface MapsAgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  steps?: ReActStep[];
  isStreaming?: boolean;
}

export interface UseMapsAgentReturn {
  messages: MapsAgentMessage[];
  isProcessing: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  agent: GoogleMapsAgent | null;
  initializeAgent: (apiKey: string) => void;
}

export function useMapsAgent(): UseMapsAgentReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MapsAgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const agentRef = useRef<GoogleMapsAgent | null>(null);

  const initializeAgent = useCallback((apiKey: string) => {
    if (!user) return;

    const config: MapsAgentConfig = {
      apiKey,
      userId: user.id,
      maxIterations: 5,
      verbose: true,
    };

    agentRef.current = createMapsAgent(config);
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!agentRef.current || !content.trim()) return;

    const userMessage: MapsAgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    const assistantMessage: MapsAgentMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      steps: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const stepGenerator = await agentRef.current.processUserRequest(content);
      const steps: ReActStep[] = [];
      let finalContent = '';

      for await (const step of stepGenerator) {
        steps.push(step);

        if (step.type === 'answer') {
          finalContent = step.content;
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, steps: [...steps], content: finalContent }
              : msg
          )
        );
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } catch (error) {
      console.error('[useMapsAgent] Error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: `Error: ${(error as Error).message}`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    agentRef.current?.clearHistory();
  }, []);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearMessages,
    agent: agentRef.current,
    initializeAgent,
  };
}
