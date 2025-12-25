import { useState, useEffect } from 'react';
import { 
  FolderOpen, File, ChevronRight, ChevronDown, Plus, 
  Trash2, Edit3, FileCode, FileText, Image, FolderPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FileNode {
  id: string;
  name: string;
  file_type: 'file' | 'folder';
  path: string;
  content: string | null;
  parent_id: string | null;
  children?: FileNode[];
}

interface FileExplorerProps {
  projectId?: string;
  onFileSelect?: (file: FileNode) => void;
}

const fileIcons: Record<string, React.ReactNode> = {
  ts: <FileCode className="h-4 w-4 text-blue-400" />,
  tsx: <FileCode className="h-4 w-4 text-blue-400" />,
  js: <FileCode className="h-4 w-4 text-yellow-400" />,
  jsx: <FileCode className="h-4 w-4 text-yellow-400" />,
  html: <FileText className="h-4 w-4 text-orange-400" />,
  css: <FileText className="h-4 w-4 text-purple-400" />,
  json: <FileText className="h-4 w-4 text-green-400" />,
  md: <FileText className="h-4 w-4 text-muted-foreground" />,
  png: <Image className="h-4 w-4 text-pink-400" />,
  jpg: <Image className="h-4 w-4 text-pink-400" />,
  svg: <Image className="h-4 w-4 text-pink-400" />,
};

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return fileIcons[ext || ''] || <File className="h-4 w-4 text-muted-foreground" />;
}

export default function FileExplorer({ projectId, onFileSelect }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<{ type: 'file' | 'folder'; parentId: string | null } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (projectId && user) {
      loadFiles();
    }
  }, [projectId, user]);

  const loadFiles = async () => {
    if (!projectId || !user) return;

    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('file_type', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error loading files:', error);
      return;
    }

    // Build tree structure
    const fileMap = new Map<string, FileNode>();
    const rootFiles: FileNode[] = [];

    data?.forEach(file => {
      const fileNode: FileNode = {
        id: file.id,
        name: file.name,
        file_type: file.file_type as 'file' | 'folder',
        path: file.path,
        content: file.content,
        parent_id: file.parent_id,
        children: file.file_type === 'folder' ? [] : undefined,
      };
      fileMap.set(file.id, fileNode);
    });

    fileMap.forEach(file => {
      if (file.parent_id && fileMap.has(file.parent_id)) {
        fileMap.get(file.parent_id)?.children?.push(file);
      } else if (!file.parent_id) {
        rootFiles.push(file);
      }
    });

    setFiles(rootFiles);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFileClick = (file: FileNode) => {
    if (file.file_type === 'folder') {
      toggleFolder(file.id);
    } else {
      setSelectedFile(file.id);
      onFileSelect?.(file);
    }
  };

  const createItem = async () => {
    if (!newItemName.trim() || !projectId || !user || !isCreating) return;

    const path = isCreating.parentId 
      ? `${files.find(f => f.id === isCreating.parentId)?.path || ''}/${newItemName}`
      : `/${newItemName}`;

    const { error } = await supabase.from('files').insert({
      name: newItemName.trim(),
      file_type: isCreating.type,
      path,
      parent_id: isCreating.parentId,
      project_id: projectId,
      user_id: user.id,
      content: isCreating.type === 'file' ? '' : null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadFiles();
      setIsCreating(null);
      setNewItemName('');
    }
  };

  const deleteItem = async (id: string, name: string) => {
    const { error } = await supabase.from('files').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${name} deleted` });
      loadFiles();
    }
  };

  const renameItem = async (id: string) => {
    if (!editName.trim()) return;

    const { error } = await supabase.from('files').update({ name: editName.trim() }).eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadFiles();
      setEditingId(null);
      setEditName('');
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div
          onClick={() => handleFileClick(node)}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
            "hover:bg-secondary",
            selectedFile === node.id && "bg-primary/10 text-primary"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {node.file_type === 'folder' ? (
            <>
              {expandedFolders.has(node.id) ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              <FolderOpen className={cn(
                "h-4 w-4",
                expandedFolders.has(node.id) ? "text-primary" : "text-yellow-500"
              )} />
            </>
          ) : (
            <>
              <span className="w-3" />
              {getFileIcon(node.name)}
            </>
          )}

          {editingId === node.id ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') renameItem(node.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              onBlur={() => renameItem(node.id)}
              className="h-6 text-xs px-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm flex-1 truncate">{node.name}</span>
          )}

          <div className="hidden group-hover:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(node.id);
                setEditName(node.name);
              }}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-5 w-5 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(node.id, node.name);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {node.file_type === 'folder' && expandedFolders.has(node.id) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Files
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCreating({ type: 'file', parentId: null })}
            title="New File"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCreating({ type: 'folder', parentId: null })}
            title="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {isCreating && (
          <div className="px-2 py-1">
            <div className="flex items-center gap-2 px-2">
              {isCreating.type === 'folder' ? (
                <FolderOpen className="h-4 w-4 text-yellow-500" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground" />
              )}
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createItem();
                  if (e.key === 'Escape') {
                    setIsCreating(null);
                    setNewItemName('');
                  }
                }}
                placeholder={isCreating.type === 'folder' ? 'Folder name' : 'File name'}
                className="h-6 text-xs"
                autoFocus
              />
            </div>
          </div>
        )}

        {files.length > 0 ? (
          renderFileTree(files)
        ) : (
          <div className="px-3 py-8 text-center text-muted-foreground text-sm">
            {projectId ? 'No files yet' : 'Select a project'}
          </div>
        )}
      </div>
    </div>
  );
}
