import { useState } from 'react';
import { Bot, ChevronDown, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent';
import { defaultAgents } from '@/data/agents';
import { cn } from '@/lib/utils';

interface AgentSelectorProps {
  activeAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

export default function AgentSelector({ activeAgent, onSelectAgent }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel p-2 animate-scale-in">
          <div className="text-xs text-muted-foreground px-3 py-2 flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Available Agents
          </div>
          {defaultAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                onSelectAgent(agent);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
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
            </button>
          ))}
          
          <div className="border-t border-border mt-2 pt-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary border border-dashed border-border">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-sm">Create Custom Agent</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
