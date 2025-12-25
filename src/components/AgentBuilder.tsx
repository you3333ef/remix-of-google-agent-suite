import { useState, useEffect } from 'react';
import { X, Bot, Wand2, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { aiProviders } from '@/data/agents';
import { AIProvider } from '@/types/agent';
import { cn } from '@/lib/utils';

interface AgentBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated?: () => void;
}

export default function AgentBuilder({ isOpen, onClose, onAgentCreated }: AgentBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [avatar, setAvatar] = useState('🤖');
  const [selectedColor, setSelectedColor] = useState('from-cyan-500 to-blue-600');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const availableTools = [
    'Google Maps', 'Analytics', 'Ads', 'Business Profile',
    'Terminal', 'Code Editor', 'Web Clone', 'App Builder',
    'Email', 'DNS', 'Testing', 'Automation', 'AI Chat', 'Deep Research'
  ];

  const avatarOptions = ['🤖', '🦾', '🧠', '⚡', '🔮', '🎯', '🚀', '🌟', '💎', '🔥', '🦫', '🐙', '🦊', '🐺'];

  const colorOptions = [
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-yellow-500 to-orange-600',
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-cyan-600',
  ];

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool)
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    );
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSystemPrompt('');
    setSelectedProvider('openai');
    setSelectedTools([]);
    setAvatar('🤖');
    setSelectedColor('from-cyan-500 to-blue-600');
  };

  const handleCreate = async () => {
    if (!name.trim() || !user) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from('custom_agents').insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        avatar,
        tools: selectedTools,
        provider: selectedProvider,
        color: selectedColor,
        system_prompt: systemPrompt.trim() || null,
      });

      if (error) throw error;

      toast({ title: "Success!", description: `Agent "${name}" created successfully` });
      resetForm();
      onAgentCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({ title: "Error", description: "Failed to create agent", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
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

          {/* Color Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color Theme</label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br transition-all duration-200",
                    color,
                    selectedColor === color
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Agent Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Assistant"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent specializes in..."
              rows={2}
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">System Prompt (Optional)</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Custom instructions for the AI... e.g., 'You are an expert in Python development and always provide code examples.'"
              rows={3}
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
            disabled={!name.trim() || isCreating}
            className="gap-2"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {isCreating ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </div>
    </div>
  );
}
