import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  isLoading: boolean;
  refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadActiveProject = async () => {
    if (!user) {
      setActiveProject(null);
      setIsLoading(false);
      return;
    }

    try {
      // Get user settings to find active project
      const { data: settings } = await supabase
        .from('user_settings')
        .select('active_project_id')
        .eq('user_id', user.id)
        .single();

      if (settings?.active_project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('id', settings.active_project_id)
          .single();

        if (project) {
          setActiveProject(project);
        } else {
          // Project doesn't exist, clear the setting
          await supabase
            .from('user_settings')
            .update({ active_project_id: null })
            .eq('user_id', user.id);
          setActiveProject(null);
        }
      } else {
        setActiveProject(null);
      }
    } catch (error) {
      console.error('Error loading active project:', error);
      setActiveProject(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProject = async () => {
    await loadActiveProject();
  };

  useEffect(() => {
    loadActiveProject();
  }, [user]);

  const handleSetActiveProject = async (project: Project | null) => {
    setActiveProject(project);
    
    if (user) {
      await supabase
        .from('user_settings')
        .update({ active_project_id: project?.id || null })
        .eq('user_id', user.id);
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      activeProject, 
      setActiveProject: handleSetActiveProject, 
      isLoading,
      refreshProject 
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
