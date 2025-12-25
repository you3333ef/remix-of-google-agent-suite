import { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Save, Copy, Download, Maximize2, Minimize2, FileCode, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MonacoEditorProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  fileId?: string;
  initialContent?: string;
  fileName?: string;
  projectId?: string;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { lineNumber: number; column: number };
}

const CURSOR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

export default function MonacoEditor({ 
  isExpanded, 
  onToggleExpand, 
  fileId, 
  initialContent, 
  fileName: propFileName,
  projectId 
}: MonacoEditorProps) {
  const [code, setCode] = useState(initialContent || '// Start coding here...\n');
  const [language, setLanguage] = useState('typescript');
  const [fileName, setFileName] = useState(propFileName || 'untitled.ts');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(fileId || null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const editorRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  useEffect(() => {
    if (fileId) {
      loadFile(fileId);
    }
  }, [fileId]);

  useEffect(() => {
    if (initialContent !== undefined) {
      setCode(initialContent);
      setHasChanges(false);
    }
  }, [initialContent]);

  useEffect(() => {
    if (propFileName) {
      setFileName(propFileName);
      setLanguage(getLanguageFromExtension(propFileName));
    }
  }, [propFileName]);

  // Realtime collaboration setup
  useEffect(() => {
    if (!projectId || !fileId || !user) return;

    const userColor = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
    const channel = supabase.channel(`file-${fileId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: Collaborator[] = Object.entries(state)
          .filter(([key]) => key !== user.id)
          .map(([key, value]: [string, any]) => ({
            id: key,
            name: value[0]?.name || 'Anonymous',
            color: value[0]?.color || '#888',
            cursor: value[0]?.cursor,
          }));
        setCollaborators(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id) {
          toast({
            title: 'User joined',
            description: `${newPresences[0]?.name || 'Someone'} started editing`,
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key !== user.id) {
          toast({
            title: 'User left',
            description: `${leftPresences[0]?.name || 'Someone'} stopped editing`,
          });
        }
      })
      .on('broadcast', { event: 'code_change' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setCode(payload.content);
        }
      })
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setCollaborators(prev => 
            prev.map(c => 
              c.id === payload.userId 
                ? { ...c, cursor: payload.cursor }
                : c
            )
          );
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({
            name: user.email?.split('@')[0] || 'User',
            color: userColor,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [projectId, fileId, user]);

  const loadFile = async (id: string) => {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (data && !error) {
      setCode(data.content || '');
      setFileName(data.name);
      setCurrentFileId(data.id);
      setHasChanges(false);
      setLanguage(getLanguageFromExtension(data.name));
    }
  };

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode === undefined) return;
    setCode(newCode);
    setHasChanges(true);

    // Broadcast changes to other users
    if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'code_change',
        payload: { userId: user.id, content: newCode },
      });
    }
  };

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Track cursor position for collaboration
    editor.onDidChangeCursorPosition((e) => {
      if (channelRef.current && user) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor_move',
          payload: {
            userId: user.id,
            cursor: { lineNumber: e.position.lineNumber, column: e.position.column },
          },
        });
      }
    });
  };

  const saveFile = async () => {
    if (!currentFileId || !user) {
      toast({ title: 'Info', description: 'Create a file in the explorer first' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('files')
        .update({ content: code, updated_at: new Date().toISOString() })
        .eq('id', currentFileId);

      if (error) throw error;
      
      setHasChanges(false);
      toast({ title: 'Saved', description: `${fileName} saved successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save file', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied', description: 'Code copied to clipboard' });
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, currentFileId]);

  return (
    <div className={cn(
      "flex flex-col glass-panel overflow-hidden transition-all duration-300",
      isExpanded ? "fixed inset-4 z-50" : "h-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {fileName}
            {hasChanges && <span className="text-primary ml-1">●</span>}
          </span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Collaborators */}
          {collaborators.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex -space-x-1">
                {collaborators.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-foreground border-2 border-background"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {c.name[0].toUpperCase()}
                  </div>
                ))}
              </div>
              {collaborators.length > 3 && (
                <span className="text-xs text-muted-foreground">+{collaborators.length - 3}</span>
              )}
            </div>
          )}

          {isConnected && (
            <div className="flex items-center gap-1 text-xs text-neon-green mr-2">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              Live
            </div>
          )}

          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={saveFile} 
            disabled={!hasChanges || isSaving}
            title="Save (Ctrl+S)"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={copyCode} title="Copy code">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={downloadCode} title="Download">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggleExpand}>
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            tabSize: 2,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className={cn("w-2 h-2 rounded-full", hasChanges ? "bg-yellow-500" : "bg-neon-green")} />
            {hasChanges ? 'Modified' : 'Saved'}
          </span>
        </div>
      </div>
    </div>
  );
}
