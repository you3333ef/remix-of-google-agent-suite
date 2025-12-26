import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<void>;
  isProcessing: boolean;
  isSettingUp: boolean;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [hasSetup, setHasSetup] = useState(false);
  const { session, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-setup after Google OAuth login
  useEffect(() => {
    const runOAuthSetup = async () => {
      if (!session?.user?.id || hasSetup || isSettingUp) return;
      
      // Check if this is a Google OAuth session
      const isGoogleAuth = session.user.app_metadata?.provider === 'google' || 
                           session.user.identities?.some(i => i.provider === 'google');
      
      if (!isGoogleAuth) return;

      setIsSettingUp(true);
      console.log('[GoogleAuth] Starting automatic OAuth setup...');

      try {
        // Call the OAuth callback edge function
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
          console.error('[GoogleAuth] OAuth callback error:', error);
          toast({
            title: "Setup Warning",
            description: "Some features may need manual setup",
            variant: "destructive",
          });
        } else {
          console.log('[GoogleAuth] OAuth setup completed:', data);
          setHasSetup(true);
          
          // Auto-redirect to maps with conversation
          if (data?.conversation_id) {
            toast({
              title: "Welcome!",
              description: "Your Maps session is ready",
            });
            navigate(`/maps?conversation=${data.conversation_id}`);
          } else {
            navigate('/maps');
          }
        }
      } catch (err) {
        console.error('[GoogleAuth] Setup error:', err);
      } finally {
        setIsSettingUp(false);
      }
    };

    runOAuthSetup();
  }, [session, hasSetup, isSettingUp, toast, navigate]);

  const signInWithGoogle = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile',
        },
      });

      if (error) {
        console.error('[GoogleAuth] OAuth error:', error);
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('[GoogleAuth] Sign in error:', err);
      toast({
        title: "Error",
        description: "Failed to initiate Google sign-in",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    signInWithGoogle,
    isProcessing,
    isSettingUp,
  };
}
