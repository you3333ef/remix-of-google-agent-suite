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
  isAuthenticated: boolean;
}

export function useMapsAgent(): UseMapsAgentReturn {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MapsAgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check OAuth status when user is available
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        setIsReady(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        // Check if user has valid OAuth tokens
        const { data, error } = await supabase.functions.invoke('google-maps', {
          body: { 
            action: 'checkAuth',
            userId: user.id
          },
        });

        if (error) {
          console.error('[MapsAgent] Auth check error:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(data?.authenticated || false);
          console.log('[MapsAgent] OAuth status:', data?.authenticated ? 'Ready' : 'Not configured');
        }
        
        setIsReady(true);
      } catch (err) {
        console.error('[MapsAgent] Auth check failed:', err);
        setIsAuthenticated(false);
        setIsReady(true);
      }
    };

    checkAuth();
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

      // Call the maps-agent edge function with user ID for OAuth
      const { data, error } = await supabase.functions.invoke('maps-agent', {
        body: {
          messages: conversationHistory,
          userId: user.id, // Pass user ID for OAuth token lookup
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
      } else if (error.message?.includes('OAuth') || error.message?.includes('re-authenticate')) {
        errorMessage = 'جلسة Google منتهية. يرجى تسجيل الدخول مرة أخرى.';
        toast({
          title: 'مطلوب إعادة المصادقة',
          description: 'يرجى تسجيل الخروج وإعادة تسجيل الدخول باستخدام Google',
          variant: 'destructive',
        });
      } else if (error.message?.includes('authentication required')) {
        errorMessage = 'يرجى تسجيل الدخول باستخدام حساب Google للمتابعة.';
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
    isAuthenticated,
  };
}
