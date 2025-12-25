import { useState, useEffect } from 'react';
import { Bot, ChevronDown, Sparkles, Check, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Agent } from '@/types/agent';
import { defaultAgents } from '@/data/agents';
import { cn } from '@/lib/utils';

interface AgentSelectorProps {
  activeAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

export default function AgentSelector({ activeAgent, onSelectAgent }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customAgents, setCustomAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadCustomAgents();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCustomAgents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const agents: Agent[] = (data || []).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
        avatar: a.avatar,
        tools: a.tools || [],
        provider: a.provider as Agent['provider'],
        status: 'online' as const,
        color: a.color,
      }));

      setCustomAgents(agents);
    } catch (error) {
      console.error('Error loading custom agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('custom_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      setCustomAgents(prev => prev.filter(a => a.id !== agentId));
      
      if (activeAgent.id === agentId) {
        onSelectAgent(defaultAgents[0]);
      }
      
      toast({ title: "Deleted", description: "Agent deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete agent", variant: "destructive" });
    }
  };

  return (
    <div className="relative">
      <Button
        variant="glass"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between h-14 px-4"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br",
            activeAgent.color
          )}>
            {activeAgent.avatar}
          </div>
          <div className="text-left">
            <div className="font-semibold text-foreground">{activeAgent.name}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[140px]">
              {activeAgent.description}
            </div>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel p-2 animate-scale-in max-h-80 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Default Agents */}
                <div className="text-xs text-muted-foreground px-3 py-2 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  Default Agents
                </div>
                {defaultAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
                      activeAgent.id === agent.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-secondary"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br",
                      agent.color
                    )}>
                      {agent.avatar}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm flex items-center gap-2">
                        {agent.name}
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          agent.status === 'online' ? 'bg-neon-green' : 'bg-muted'
                        )} />
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {agent.provider.toUpperCase()}
                      </div>
                    </div>
                    {activeAgent.id === agent.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}

                {/* Custom Agents */}
                {customAgents.length > 0 && (
                  <>
                    <div className="text-xs text-muted-foreground px-3 py-2 flex items-center gap-2 mt-2 border-t border-border">
                      <Bot className="h-3 w-3" />
                      Your Agents
                    </div>
                    {customAgents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          onSelectAgent(agent);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
                          activeAgent.id === agent.id
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-secondary"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br",
                          agent.color
                        )}>
                          {agent.avatar}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-foreground text-sm flex items-center gap-2">
                            {agent.name}
                            <span className="w-2 h-2 rounded-full bg-neon-green" />
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {agent.tools?.slice(0, 2).join(', ') || 'Custom Agent'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {activeAgent.id === agent.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={(e) => deleteAgent(agent.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
