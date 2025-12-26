import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, PanelLeftClose, PanelLeft, Settings, 
  MessageSquare, Code, Eye, Terminal as TerminalIcon, Bot,
  Copy, FolderOpen, LogOut, Sparkles, Search, Globe, Mail, Map
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
import DeepResearchTool from './DeepResearchTool';
import ToolSetupDialog from './ToolSetupDialog';
import SidebarCreatePanel from './SidebarCreatePanel';
import DNSManager from './DNSManager';
import EmailManager from './EmailManager';
import GoogleMapsManager from './GoogleMapsManager';
import { defaultAgents } from '@/data/agents';
import { Agent, Tool } from '@/types/agent';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type ActivePanel = 'chat' | 'code' | 'preview' | 'terminal' | 'clone' | 'research' | 'dns' | 'email' | 'maps';
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
  const [rightPanelMode, setRightPanelMode] = useState<'code' | 'preview' | 'split' | 'clone' | 'research' | 'dns' | 'email' | 'maps'>('split');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('tools');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [clonedHtml, setClonedHtml] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [setupTool, setSetupTool] = useState<Tool | null>(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);

    switch (toolId) {
      case 'web-clone':
        setRightPanelMode('clone');
        setActivePanel('clone');
        return;
      case 'terminal':
        setRightPanelMode('split');
        setActivePanel('terminal');
        return;
      case 'code-editor':
        setRightPanelMode('code');
        setActivePanel('code');
        return;
      case 'ai-chat':
        setActivePanel('chat');
        return;
      case 'deep-research':
        setRightPanelMode('research');
        setActivePanel('research');
        return;
      case 'dns':
        setRightPanelMode('dns');
        setActivePanel('dns');
        return;
      case 'email':
        setRightPanelMode('email');
        setActivePanel('email');
        return;
      case 'google-maps':
        setRightPanelMode('maps');
        setActivePanel('maps');
        return;
      default:
        return;
    }
  };

  const handleSetupTool = (tool: Tool) => {
    setSetupTool(tool);
  };

  const handleSetupComplete = (toolId: string) => {
    // Tool is now configured - could update local state or refetch
    console.log(`Tool ${toolId} setup complete`);
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
    { id: 'research' as const, icon: Search, label: 'Research' },
    { id: 'dns' as const, icon: Globe, label: 'DNS' },
    { id: 'email' as const, icon: Mail, label: 'Email' },
    { id: 'maps' as const, icon: Map, label: 'Maps' },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-border/60 flex items-center justify-between px-4 bg-card/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-display font-bold gradient-text">Agentic Max</h1>
            </div>
          </div>
        </div>

        {/* Mobile Panel Switcher */}
        <div className="flex lg:hidden items-center gap-0.5 bg-secondary/80 rounded-lg p-0.5 backdrop-blur-sm">
          {panelButtons.slice(0, 4).map((panel) => {
            const Icon = panel.icon;
            return (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={cn(
                  "p-2 rounded-md transition-all duration-200",
                  activePanel === panel.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* Desktop Right Panel Mode */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-secondary/80 rounded-lg p-0.5 backdrop-blur-sm">
            {['code', 'split', 'preview', 'clone', 'research', 'dns', 'email', 'maps'].map((mode) => (
              <button
                key={mode}
                onClick={() => setRightPanelMode(mode as typeof rightPanelMode)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 capitalize",
                  rightPanelMode === mode 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border/60" />

          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>

          {user && (
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out" className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "w-72 border-r border-border/60 bg-sidebar flex flex-col shrink-0 transition-all duration-300",
          "absolute lg:relative z-40 h-[calc(100vh-3.5rem)] lg:h-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-0 lg:overflow-hidden"
        )}>
          {/* Sidebar Toggle (Desktop) */}
          <Button
            variant="glass"
            size="icon-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-9 top-3 hidden lg:flex z-10"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>

          <div className={cn("flex flex-col h-full", !sidebarOpen && "lg:hidden")}>
            {/* Agent Selector */}
            <div className="p-3 border-b border-border/60">
              <AgentSelector activeAgent={activeAgent} onSelectAgent={setActiveAgent} />
            </div>

            {/* Sidebar Tabs */}
            <div className="flex border-b border-border/60">
              <button
                onClick={() => setSidebarTab('tools')}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium transition-all duration-200 relative",
                  sidebarTab === 'tools'
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tools
                </span>
                {sidebarTab === 'tools' && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setSidebarTab('files')}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium transition-all duration-200 relative",
                  sidebarTab === 'files'
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Files
                </span>
                {sidebarTab === 'files' && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
              {sidebarTab === 'tools' ? (
                <ToolsSidebar 
                  onToolSelect={handleToolSelect} 
                  onSetupTool={handleSetupTool}
                />
              ) : (
                <FileExplorer onFileSelect={handleFileSelect} />
              )}
            </div>

            {/* Quick Create Panel */}
            <SidebarCreatePanel 
              onFileCreated={() => {}}
              onAgentCreated={() => {}}
            />
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Chat Panel (Mobile & Desktop) */}
        <div className={cn(
          "flex-1 flex flex-col lg:max-w-lg lg:border-r lg:border-border/60",
          activePanel !== 'chat' && "hidden lg:flex"
        )}>
          <ChatUI activeAgent={activeAgent} />
        </div>

        {/* Right Panels (Desktop: Code/Preview, Mobile: Based on activePanel) */}
        <div className={cn(
          "flex-1 flex-col lg:flex bg-background",
          activePanel === 'chat' && "hidden lg:flex"
        )}>
          {/* Mobile: Show based on activePanel */}
          <div className="lg:hidden h-full">
            {activePanel === 'code' && (
              <MonacoEditor 
                fileId={selectedFileId || undefined}
                fileName={selectedFileName}
                initialContent={selectedFileContent}
              />
            )}
            {activePanel === 'preview' && <PreviewPane htmlContent={clonedHtml} />}
            {activePanel === 'terminal' && <TerminalComponent />}
            {activePanel === 'clone' && <WebCloneTool onCodeGenerated={handleCodeGenerated} />}
            {activePanel === 'research' && <DeepResearchTool />}
            {activePanel === 'dns' && <DNSManager />}
            {activePanel === 'email' && <EmailManager />}
            {activePanel === 'maps' && <GoogleMapsManager />}
          </div>

          {/* Desktop: Show based on rightPanelMode */}
          <div className="hidden lg:flex flex-col h-full">
            {rightPanelMode === 'code' && (
              <MonacoEditor 
                fileId={selectedFileId || undefined}
                fileName={selectedFileName}
                initialContent={selectedFileContent}
              />
            )}
            {rightPanelMode === 'preview' && <PreviewPane htmlContent={clonedHtml} />}
            {rightPanelMode === 'clone' && <WebCloneTool onCodeGenerated={handleCodeGenerated} />}
            {rightPanelMode === 'research' && <DeepResearchTool />}
            {rightPanelMode === 'dns' && <DNSManager />}
            {rightPanelMode === 'email' && <EmailManager />}
            {rightPanelMode === 'maps' && <GoogleMapsManager />}
            {rightPanelMode === 'split' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                  <MonacoEditor 
                    fileId={selectedFileId || undefined}
                    fileName={selectedFileName}
                    initialContent={selectedFileContent}
                  />
                </div>
                <div className="h-64 border-t border-border/60">
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
      <ToolSetupDialog 
        tool={setupTool} 
        isOpen={!!setupTool} 
        onClose={() => setSetupTool(null)}
        onSetupComplete={handleSetupComplete}
      />
    </div>
  );
}
