import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';

export interface MapsConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface MapsConversation {
  id: string;
  title: string;
  messages: MapsConversationMessage[];
  created_at: string;
  updated_at: string;
}

export interface UseMapsConversationReturn {
  conversation: MapsConversation | null;
  conversations: MapsConversation[];
  loading: boolean;
  error: string | null;
  createConversation: (title?: string) => Promise<MapsConversation | null>;
  loadConversation: (id: string) => Promise<void>;
  loadOrCreateConversation: () => Promise<MapsConversation | null>;
  updateMessages: (messages: MapsConversationMessage[]) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export function useMapsConversation(): UseMapsConversationReturn {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<MapsConversation | null>(null);
  const [conversations, setConversations] = useState<MapsConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse messages from JSON safely
  const parseMessages = (json: Json): MapsConversationMessage[] => {
    if (!json || !Array.isArray(json)) return [];
    return json.map((item) => {
      const obj = item as Record<string, unknown>;
      return {
        role: (obj.role as 'user' | 'assistant' | 'system') || 'user',
        content: (obj.content as string) || '',
        timestamp: (obj.timestamp as string) || new Date().toISOString(),
      };
    });
  };

  // Load all conversations for the user
  const refreshConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('maps_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const parsed = (data || []).map((conv) => ({
        id: conv.id,
        title: conv.title,
        messages: parseMessages(conv.messages),
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      }));

      setConversations(parsed);
    } catch (err) {
      console.error('[useMapsConversation] Error loading conversations:', err);
      setError((err as Error).message);
    }
  }, [user]);

  // Load a specific conversation
  const loadConversation = useCallback(async (id: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('maps_conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setConversation({
          id: data.id,
          title: data.title,
          messages: parseMessages(data.messages),
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (err) {
      console.error('[useMapsConversation] Error loading conversation:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string): Promise<MapsConversation | null> => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('maps_conversations')
        .insert({
          user_id: user.id,
          title: title || 'New Maps Session',
          messages: [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        const newConv: MapsConversation = {
          id: data.id,
          title: data.title,
          messages: [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setConversation(newConv);
        setConversations((prev) => [newConv, ...prev]);
        return newConv;
      }
    } catch (err) {
      console.error('[useMapsConversation] Error creating conversation:', err);
      setError((err as Error).message);
    }
    return null;
  }, [user]);

  // Load existing conversation or create new one
  const loadOrCreateConversation = useCallback(async (): Promise<MapsConversation | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      // Check if user has any conversations
      const { data, error: fetchError } = await supabase
        .from('maps_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const conv: MapsConversation = {
          id: data[0].id,
          title: data[0].title,
          messages: parseMessages(data[0].messages),
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
        };
        setConversation(conv);
        return conv;
      } else {
        // Create first conversation
        return await createConversation('My Maps Session');
      }
    } catch (err) {
      console.error('[useMapsConversation] Error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
    return null;
  }, [user, createConversation]);

  // Update messages in current conversation
  const updateMessages = useCallback(async (messages: MapsConversationMessage[]) => {
    if (!user || !conversation) return;

    try {
      const { error: updateError } = await supabase
        .from('maps_conversations')
        .update({
          messages: messages as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setConversation((prev) => prev ? { ...prev, messages } : null);
    } catch (err) {
      console.error('[useMapsConversation] Error updating messages:', err);
      setError((err as Error).message);
    }
  }, [user, conversation]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('maps_conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversation?.id === id) {
        setConversation(null);
      }
    } catch (err) {
      console.error('[useMapsConversation] Error deleting conversation:', err);
      setError((err as Error).message);
    }
  }, [user, conversation]);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshConversations();
      setLoading(false);
    }
  }, [user, refreshConversations]);

  return {
    conversation,
    conversations,
    loading,
    error,
    createConversation,
    loadConversation,
    loadOrCreateConversation,
    updateMessages,
    deleteConversation,
    refreshConversations,
  };
}
