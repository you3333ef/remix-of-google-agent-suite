import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, X, PanelLeftClose, PanelLeft, Plus, Settings, 
  MessageSquare, Code, Eye, Terminal as TerminalIcon, Bot,
  Copy, FolderOpen, LogOut, LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AgentSelector from './AgentSelector';
import ToolsSidebar from './ToolsSidebar';
import ChatUI from './ChatUI';
import MonacoEditor from './MonacoEditor';
import PreviewPane from './PreviewPane';
import TerminalComponent from './Terminal';
import AgentBuilder from './AgentBuilder';
import FileExplorer from './FileExplorer';
import SettingsPanel from './SettingsPanel';
import WebCloneTool from './WebCloneTool';
import { defaultAgents } from '@/data/agents';
import { Agent } from '@/types/agent';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/hooks/useProject';
import { cn } from '@/lib/utils';

type ActivePanel = 'chat' | 'code' | 'preview' | 'terminal' | 'clone';
type SidebarTab = 'tools' | 'files';

interface ExtendedAgent extends Agent {
  systemPrompt?: string;
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAgent, setActiveAgent] = useState<ExtendedAgent>(defaultAgents[0]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [showAgentBuilder, setShowAgentBuilder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'code' | 'preview' | 'split' | 'clone'>('split');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('tools');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [clonedHtml, setClonedHtml] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const { user, signOut, loading } = useAuth();
  const { activeProject, isLoading: projectLoading } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect to projects if no active project
  useEffect(() => {
    if (!loading && !projectLoading && user && !activeProject) {
      navigate('/projects');
    }
  }, [activeProject, loading, projectLoading, user, navigate]);

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    if (toolId === 'web-clone') {
      setRightPanelMode('clone');
      setActivePanel('clone');
    }
  };

  const handleFileSelect = (file: { id: string; name: string; content: string | null }) => {
    setSelectedFileId(file.id);
    setSelectedFileName(file.name);
    setSelectedFileContent(file.content || '');
    setRightPanelMode('code');
    setActivePanel('code');
  };

  const handleCodeGenerated = (html: string) => {
    setClonedHtml(html);
    setRightPanelMode('preview');
  };

  const panelButtons = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'code' as const, icon: Code, label: 'Code' },
    { id: 'preview' as const, icon: Eye, label: 'Preview' },
    { id: 'terminal' as const, icon: TerminalIcon, label: 'Terminal' },
    { id: 'clone' as const, icon: Copy, label: 'Clone' },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-2">
            <Link to="/projects" className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center hover:scale-105 transition-transform">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <h1 className="text-lg font-bold gradient-text">Agentic Max</h1>
              {activeProject && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <Link 
                    to="/projects" 
                    className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    {activeProject.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Panel Switcher */}
        <div className="flex lg:hidden items-center gap-1 bg-secondary rounded-lg p-0.5">
          {panelButtons.slice(0, 4).map((panel) => {
            const Icon = panel.icon;
            return (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  activePanel === panel.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* Desktop Right Panel Mode */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setRightPanelMode('code')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                rightPanelMode === 'code' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Code
            </button>
            <button
              onClick={() => setRightPanelMode('split')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                rightPanelMode === 'split' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Split
            </button>
            <button
              onClick={() => setRightPanelMode('preview')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                rightPanelMode === 'preview' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Preview
            </button>
            <button
              onClick={() => setRightPanelMode('clone')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                rightPanelMode === 'clone' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Clone
            </button>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>

          {user && (
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "w-72 border-r border-border bg-sidebar flex flex-col shrink-0 transition-all duration-300",
          "absolute lg:relative z-40 h-[calc(100vh-3.5rem)] lg:h-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-0 lg:overflow-hidden"
        )}>
          {/* Sidebar Toggle (Desktop) */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-8 top-2 hidden lg:flex bg-card border border-border rounded-lg z-10"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>

          <div className={cn("flex flex-col h-full", !sidebarOpen && "lg:hidden")}>
            {/* Agent Selector */}
            <div className="p-3 border-b border-border">
              <AgentSelector activeAgent={activeAgent} onSelectAgent={setActiveAgent} />
            </div>

            {/* Sidebar Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setSidebarTab('tools')}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  sidebarTab === 'tools'
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tools
              </button>
              <button
                onClick={() => setSidebarTab('files')}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  sidebarTab === 'files'
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                Files
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
              {sidebarTab === 'tools' ? (
                <ToolsSidebar onToolSelect={handleToolSelect} />
              ) : (
                <FileExplorer projectId={activeProject?.id} onFileSelect={handleFileSelect} />
              )}
            </div>

            {/* Create Agent Button */}
            <div className="p-3 border-t border-border">
              <Button
                variant="agent"
                className="w-full gap-2"
                onClick={() => setShowAgentBuilder(true)}
              >
                <Plus className="h-4 w-4" />
                Create Agent
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Chat Panel (Mobile & Desktop) */}
        <div className={cn(
          "flex-1 flex flex-col lg:max-w-lg lg:border-r lg:border-border",
          activePanel !== 'chat' && "hidden lg:flex"
        )}>
          <ChatUI activeAgent={activeAgent} />
        </div>

        {/* Right Panels (Desktop: Code/Preview, Mobile: Based on activePanel) */}
        <div className={cn(
          "flex-1 flex-col lg:flex",
          activePanel === 'chat' && "hidden lg:flex"
        )}>
          {/* Mobile: Show based on activePanel */}
          <div className="lg:hidden h-full">
            {activePanel === 'code' && (
              <MonacoEditor 
                fileId={selectedFileId || undefined}
                fileName={selectedFileName}
                initialContent={selectedFileContent}
                projectId={activeProject?.id}
              />
            )}
            {activePanel === 'preview' && <PreviewPane htmlContent={clonedHtml} />}
            {activePanel === 'terminal' && <TerminalComponent />}
            {activePanel === 'clone' && <WebCloneTool onCodeGenerated={handleCodeGenerated} />}
          </div>

          {/* Desktop: Show based on rightPanelMode */}
          <div className="hidden lg:flex flex-col h-full">
            {rightPanelMode === 'code' && (
              <MonacoEditor 
                fileId={selectedFileId || undefined}
                fileName={selectedFileName}
                initialContent={selectedFileContent}
                projectId={activeProject?.id}
              />
            )}
            {rightPanelMode === 'preview' && <PreviewPane htmlContent={clonedHtml} />}
            {rightPanelMode === 'clone' && <WebCloneTool onCodeGenerated={handleCodeGenerated} />}
            {rightPanelMode === 'split' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                  <MonacoEditor 
                    fileId={selectedFileId || undefined}
                    fileName={selectedFileName}
                    initialContent={selectedFileContent}
                    projectId={activeProject?.id}
                  />
                </div>
                <div className="h-64 border-t border-border">
                  <TerminalComponent />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AgentBuilder isOpen={showAgentBuilder} onClose={() => setShowAgentBuilder(false)} />
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
