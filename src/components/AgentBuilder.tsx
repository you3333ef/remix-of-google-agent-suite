import React, { useState, forwardRef } from 'react';
import { X, Bot, Wand2, Loader2 } from 'lucide-react';
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

const AgentBuilder = forwardRef<HTMLDivElement, AgentBuilderProps>(
  ({ isOpen, onClose, onAgentCreated }, ref) => {
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
      'AI Chat',
      'Web Clone',
      'Code Editor',
      'Terminal',
      'File Explorer',
      'Settings',
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
      <div ref={ref} className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-2xl glass-panel max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Create Custom Agent</h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Build your own AI agent with custom tools</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 scrollbar-thin">
            {/* Avatar Selection */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Avatar</label>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={cn(
                      "w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl text-lg sm:text-2xl transition-all duration-200",
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
              <label className="text-xs sm:text-sm font-medium text-foreground">Color Theme</label>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br transition-all duration-200",
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
              <label className="text-xs sm:text-sm font-medium text-foreground">Agent Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Research Assistant"
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this agent specializes in..."
                rows={2}
                className="text-sm min-h-[60px] sm:min-h-[80px]"
              />
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">System Prompt (Optional)</label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Custom instructions for the AI..."
                rows={3}
                className="text-sm min-h-[70px] sm:min-h-[90px]"
              />
            </div>

            {/* AI Provider */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">AI Provider</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {aiProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id as AIProvider)}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200",
                      selectedProvider === provider.id
                        ? "bg-primary/20 border border-primary"
                        : "bg-secondary hover:bg-secondary/80 border border-transparent"
                    )}
                  >
                    <span className="text-base sm:text-lg">{provider.icon}</span>
                    <span className={cn("text-xs sm:text-sm font-medium truncate", provider.color)}>{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Selection */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Tools & Capabilities</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {availableTools.map((tool) => (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={cn(
                      "px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200",
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
          <div className="flex items-center justify-between p-3 sm:p-4 border-t border-border bg-secondary/30">
            <Button variant="ghost" onClick={onClose} size="sm" className="text-xs sm:text-sm">
              Cancel
            </Button>
            <Button
              variant="agent"
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10"
            >
              {isCreating ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              {isCreating ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

AgentBuilder.displayName = 'AgentBuilder';

export default AgentBuilder;
