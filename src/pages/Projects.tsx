import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, MoreVertical, Trash2, Edit2, Clock, ArrowRight, Bot, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load projects', variant: 'destructive' });
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  };

  const createProject = async () => {
    if (!newProjectName.trim() || !user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create project', variant: 'destructive' });
    } else if (data) {
      setProjects([data, ...projects]);
      setShowCreateDialog(false);
      setNewProjectName('');
      setNewProjectDescription('');
      toast({ title: 'Success', description: 'Project created successfully' });
    }
  };

  const updateProject = async () => {
    if (!editingProject || !newProjectName.trim()) return;

    const { error } = await supabase
      .from('projects')
      .update({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
      })
      .eq('id', editingProject.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update project', variant: 'destructive' });
    } else {
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, name: newProjectName.trim(), description: newProjectDescription.trim() || null }
          : p
      ));
      setShowEditDialog(false);
      setEditingProject(null);
      setNewProjectName('');
      setNewProjectDescription('');
      toast({ title: 'Success', description: 'Project updated successfully' });
    }
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
      toast({ title: 'Success', description: 'Project deleted successfully' });
    }
  };

  const openProject = async (project: Project) => {
    if (user) {
      await supabase
        .from('user_settings')
        .update({ active_project_id: project.id })
        .eq('user_id', user.id);
    }
    navigate('/');
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description || '');
    setShowEditDialog(true);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
            <Bot className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold gradient-text">Agentic Max</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Development</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Your Workspace</span>
            </div>
            <h2 className="text-4xl font-display font-bold text-foreground tracking-tight">Projects</h2>
            <p className="text-muted-foreground text-lg">Create and manage your development projects</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2 shadow-lg">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 max-w-md h-12 bg-card/60 border-border/60 focus:border-primary/50"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel p-6 animate-pulse">
                <div className="h-12 w-12 bg-secondary rounded-xl mb-4" />
                <div className="h-6 bg-secondary rounded-lg w-3/4 mb-3" />
                <div className="h-4 bg-secondary rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
              <Folder className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-3">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {searchQuery ? 'Try a different search term' : 'Create your first project to start building with AI-powered development tools'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className={cn(
                  "glass-panel-hover p-6 cursor-pointer group card-glow animate-fade-in",
                  `stagger-${Math.min(index + 1, 5)}`
                )}
                onClick={() => openProject(project)}
                style={{ opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center group-hover:from-primary/25 group-hover:to-accent/25 transition-colors duration-300">
                    <Folder className="h-7 w-7 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(project); }}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="text-lg font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 text-primary" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create New Project</DialogTitle>
            <DialogDescription>
              Give your project a name and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2.5 block">
                Project Name
              </label>
              <Input
                placeholder="My Awesome Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                className="h-11 bg-secondary/50 border-border focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2.5 block">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                placeholder="A brief description of your project..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="h-11 bg-secondary/50 border-border focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2.5 block">
                Project Name
              </label>
              <Input
                placeholder="My Awesome Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateProject()}
                className="h-11 bg-secondary/50 border-border focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2.5 block">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                placeholder="A brief description of your project..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="h-11 bg-secondary/50 border-border focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateProject} disabled={!newProjectName.trim()}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
