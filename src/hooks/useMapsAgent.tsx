import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface MapsAgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallResult[];
  isStreaming?: boolean;
}

export interface ToolCallResult {
  name: string;
  args: Record<string, any>;
  result?: any;
}

export interface UseMapsAgentReturn {
  messages: MapsAgentMessage[];
  isProcessing: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  isReady: boolean;
}

export function useMapsAgent(): UseMapsAgentReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MapsAgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Auto-initialize when user is available
  useEffect(() => {
    if (user) {
      setIsReady(true);
      console.log('[MapsAgent] Ready for user:', user.id);
    }
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user) return;

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
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      conversationHistory.push({ role: 'user', content: content.trim() });

      // Call the maps-agent edge function
      const { data, error } = await supabase.functions.invoke('maps-agent', {
        body: {
          messages: conversationHistory,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      // Update assistant message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: data.content,
                toolCalls: data.toolCalls,
                isStreaming: false,
              }
            : msg
        )
      );

    } catch (error: any) {
      console.error('[useMapsAgent] Error:', error);
      
      let errorMessage = error.message || 'An error occurred';
      
      // Handle specific error types
      if (error.message?.includes('Rate limit')) {
        toast({
          title: 'Rate Limit',
          description: 'Too many requests. Please wait a moment.',
          variant: 'destructive',
        });
      } else if (error.message?.includes('credits')) {
        toast({
          title: 'Credits Exhausted',
          description: 'AI credits depleted. Please add funds.',
          variant: 'destructive',
        });
      } else if (error.message?.includes('GOOGLE_MAPS_API_KEY')) {
        errorMessage = 'Google Maps API is not configured. Please contact the administrator.';
      }
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: `❌ ${errorMessage}`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  }, [user, messages, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearMessages,
    isReady,
  };
}
