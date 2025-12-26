import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<void>;
  isProcessing: boolean;
  setupOAuthCallback: () => Promise<void>;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  const signInWithGoogle = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile',
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Sign in error:', err);
      toast({
        title: "Error",
        description: "Failed to initiate Google sign-in",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const setupOAuthCallback = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Call the OAuth callback edge function to set up user data
      const { data, error } = await supabase.functions.invoke('oauth-callback', {
        body: {
          user_id: session.user.id,
          access_token: session.provider_token,
          refresh_token: session.provider_refresh_token,
          expires_in: session.expires_in,
          scope: 'email profile',
        },
      });

      if (error) {
        console.error('OAuth callback error:', error);
      } else {
        console.log('OAuth setup completed:', data);
      }
    } catch (err) {
      console.error('Setup callback error:', err);
    }
  }, [session]);

  return {
    signInWithGoogle,
    isProcessing,
    setupOAuthCallback,
  };
}
