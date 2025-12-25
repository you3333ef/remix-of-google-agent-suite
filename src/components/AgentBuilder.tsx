import { useState } from 'react';
import { X, Bot, Wand2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiProviders } from '@/data/agents';
import { AIProvider } from '@/types/agent';
import { cn } from '@/lib/utils';

interface AgentBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentBuilder({ isOpen, onClose }: AgentBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [avatar, setAvatar] = useState('🤖');

  const availableTools = [
    'Google Maps', 'Analytics', 'Ads', 'Business Profile',
    'Terminal', 'Code Editor', 'Web Clone', 'App Builder',
    'Email', 'DNS', 'Testing', 'Automation'
  ];

  const avatarOptions = ['🤖', '🦾', '🧠', '⚡', '🔮', '🎯', '🚀', '🌟', '💎', '🔥'];

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool)
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    );
  };

  const handleCreate = () => {
    console.log('Creating agent:', { name, description, selectedProvider, selectedTools, avatar });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl glass-panel max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create Custom Agent</h2>
              <p className="text-sm text-muted-foreground">Build your own AI agent with custom tools</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {/* Avatar Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Avatar</label>
            <div className="flex items-center gap-2 flex-wrap">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={cn(
                    "w-12 h-12 rounded-xl text-2xl transition-all duration-200",
                    avatar === emoji
                      ? "bg-primary/20 border-2 border-primary scale-110"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Assistant"
              className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent specializes in..."
              rows={3}
              className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          {/* AI Provider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {aiProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id as AIProvider)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl transition-all duration-200",
                    selectedProvider === provider.id
                      ? "bg-primary/20 border border-primary"
                      : "bg-secondary hover:bg-secondary/80 border border-transparent"
                  )}
                >
                  <span className="text-lg">{provider.icon}</span>
                  <span className={cn("text-sm font-medium", provider.color)}>{provider.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tools Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tools & Capabilities</label>
            <div className="flex flex-wrap gap-2">
              {availableTools.map((tool) => (
                <button
                  key={tool}
                  onClick={() => toggleTool(tool)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                    selectedTools.includes(tool)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {selectedTools.includes(tool) && <span className="mr-1">✓</span>}
                  {tool}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/30">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="agent"
            onClick={handleCreate}
            disabled={!name.trim()}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Create Agent
          </Button>
        </div>
      </div>
    </div>
  );
}
