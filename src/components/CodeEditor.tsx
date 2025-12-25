import { useState, useEffect } from 'react';
import { Play, Copy, Download, Maximize2, Minimize2, Save, FileCode, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  fileId?: string;
  initialContent?: string;
  fileName?: string;
}

export default function CodeEditor({ isExpanded, onToggleExpand, fileId, initialContent, fileName: propFileName }: CodeEditorProps) {
  const [code, setCode] = useState(initialContent || '// Start coding here...\n');
  const [language, setLanguage] = useState('typescript');
  const [fileName, setFileName] = useState(propFileName || 'untitled.ts');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(fileId || null);
  const { toast } = useToast();
  const { user } = useAuth();

  const languages = [
    { id: 'typescript', label: 'TypeScript', ext: '.ts' },
    { id: 'javascript', label: 'JavaScript', ext: '.js' },
    { id: 'python', label: 'Python', ext: '.py' },
    { id: 'html', label: 'HTML', ext: '.html' },
    { id: 'css', label: 'CSS', ext: '.css' },
    { id: 'json', label: 'JSON', ext: '.json' },
  ];

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
      // Detect language from extension
      const ext = propFileName.split('.').pop()?.toLowerCase();
      const lang = languages.find(l => l.ext === `.${ext}`);
      if (lang) setLanguage(lang.id);
    }
  }, [propFileName]);

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
      
      const ext = data.name.split('.').pop()?.toLowerCase();
      const lang = languages.find(l => l.ext === `.${ext}`);
      if (lang) setLanguage(lang.id);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setHasChanges(true);
  };

  const saveFile = async () => {
    if (!currentFileId || !user) {
      toast({ title: "Info", description: "Create a file in the explorer first" });
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
      toast({ title: "Saved", description: `${fileName} saved successfully` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save file", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: "Code copied to clipboard" });
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
          <div className="relative">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-secondary">
              {languages.find(l => l.id === language)?.label}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
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
          <Button variant="ghost" size="icon-sm" title="Run code">
            <Play className="h-3.5 w-3.5 text-neon-green" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggleExpand}>
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Line Numbers + Code Area */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="flex min-h-full">
          {/* Line Numbers */}
          <div className="flex flex-col py-3 px-2 bg-secondary/30 text-muted-foreground text-xs font-mono text-right select-none border-r border-border">
            {code.split('\n').map((_, i) => (
              <div key={i} className="leading-6 px-1">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="flex-1 p-3 bg-transparent text-foreground font-mono text-sm leading-6 resize-none outline-none"
            spellCheck={false}
          />
        </div>
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
