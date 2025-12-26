import { useState } from 'react';
import { Plus, FolderPlus, FileCode, Bot, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SidebarCreatePanelProps {
  projectId?: string;
  onFileCreated?: () => void;
  onAgentCreated?: () => void;
}

export default function SidebarCreatePanel({ projectId, onFileCreated, onAgentCreated }: SidebarCreatePanelProps) {
  const [isFileOpen, setIsFileOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [isGeneratingFileName, setIsGeneratingFileName] = useState(false);
  const [isGeneratingAgentName, setIsGeneratingAgentName] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateName = async (type: 'file' | 'agent') => {
    const setGenerating = type === 'file' ? setIsGeneratingFileName : setIsGeneratingAgentName;
    const setName = type === 'file' ? setFileName : setAgentName;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('code-completion', {
        body: { type: 'name', nameType: type },
      });

      if (error) throw error;

      const suggestion = data?.suggestion?.replace(/['"]/g, '').trim();
      if (suggestion) {
        if (type === 'file') {
          // Add appropriate extension
          const name = suggestion.toLowerCase().replace(/\s+/g, '-');
          setName(`${name}.ts`);
        } else {
          setName(suggestion);
        }
      }
    } catch (error) {
      console.error('Error generating name:', error);
      // Fallback to random name
      const fallback = type === 'file' 
        ? `new-file-${Date.now().toString(36)}.ts`
        : `Agent ${Math.floor(Math.random() * 1000)}`;
      setName(fallback);
    }
    setGenerating(false);
  };

  const createFile = async () => {
    if (!fileName.trim() || !projectId || !user) return;

    setIsCreatingFile(true);
    try {
      const { error } = await supabase.from('files').insert({
        name: fileName.trim(),
        file_type: 'file',
        path: `/${fileName.trim()}`,
        project_id: projectId,
        user_id: user.id,
        content: '',
      });

      if (error) throw error;

      toast({ title: 'Created', description: `${fileName} created successfully` });
      setFileName('');
      setIsFileOpen(false);
      onFileCreated?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create file', variant: 'destructive' });
    }
    setIsCreatingFile(false);
  };

  const createAgent = async () => {
    if (!agentName.trim() || !user) return;

    setIsCreatingAgent(true);
    try {
      const { error } = await supabase.from('custom_agents').insert({
        name: agentName.trim(),
        description: agentDescription.trim() || null,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: 'Created', description: `${agentName} agent created` });
      setAgentName('');
      setAgentDescription('');
      setIsAgentOpen(false);
      onAgentCreated?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create agent', variant: 'destructive' });
    }
    setIsCreatingAgent(false);
  };

  return (
    <div className="px-3 py-2 space-y-2 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Quick Create
      </p>

      {/* Create File */}
      <Collapsible open={isFileOpen} onOpenChange={setIsFileOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-sm",
              isFileOpen && "bg-secondary"
            )}
          >
            <FileCode className="h-4 w-4 text-primary" />
            New File
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="flex gap-1">
            <Input
              placeholder="filename.ts"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFile()}
              className="h-8 text-sm"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => generateName('file')}
              disabled={isGeneratingFileName}
              title="Generate name with AI"
            >
              {isGeneratingFileName ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
            </Button>
          </div>
          <Button
            size="sm"
            onClick={createFile}
            disabled={!fileName.trim() || !projectId || isCreatingFile}
            className="w-full gap-1"
          >
            {isCreatingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Create File
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Create Agent */}
      <Collapsible open={isAgentOpen} onOpenChange={setIsAgentOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-sm",
              isAgentOpen && "bg-secondary"
            )}
          >
            <Bot className="h-4 w-4 text-accent" />
            New Agent
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="flex gap-1">
            <Input
              placeholder="Agent name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="h-8 text-sm"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => generateName('agent')}
              disabled={isGeneratingAgentName}
              title="Generate name with AI"
            >
              {isGeneratingAgentName ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              )}
            </Button>
          </div>
          <Textarea
            placeholder="Description (optional)"
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
            className="h-16 text-sm resize-none"
          />
          <Button
            size="sm"
            onClick={createAgent}
            disabled={!agentName.trim() || isCreatingAgent}
            className="w-full gap-1"
          >
            {isCreatingAgent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Create Agent
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
