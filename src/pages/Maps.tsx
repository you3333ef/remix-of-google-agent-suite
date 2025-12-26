import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMapsConversation } from '@/hooks/useMapsConversation';
import GoogleMapsManager from '@/components/GoogleMapsManager';
import { Loader2, MapPin } from 'lucide-react';

export default function Maps() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { 
    conversation, 
    loading: convLoading, 
    loadConversation, 
    loadOrCreateConversation 
  } = useMapsConversation();
  
  const [isInitializing, setIsInitializing] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Auto-load or create conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!user || authLoading) return;
      
      const conversationId = searchParams.get('conversation');
      
      if (conversationId) {
        await loadConversation(conversationId);
      } else {
        await loadOrCreateConversation();
      }
      
      setIsInitializing(false);
    };

    initConversation();
  }, [user, authLoading, searchParams, loadConversation, loadOrCreateConversation]);

  // Loading state
  if (authLoading || isInitializing || convLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse" />
          <div className="relative bg-gradient-to-br from-emerald-500 to-cyan-500 p-4 rounded-2xl">
            <MapPin className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Initializing Maps Agent...</span>
        </div>
        <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
          Setting up your personalized maps experience
        </p>
      </div>
    );
  }

  // Not logged in (shouldn't reach here due to redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen w-full">
      <GoogleMapsManager />
    </div>
  );
}
