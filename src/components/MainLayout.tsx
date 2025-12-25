import { useState } from 'react';
import { 
  Menu, X, PanelLeftClose, PanelLeft, Plus, Settings, 
  MessageSquare, Code, Eye, Terminal as TerminalIcon, Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AgentSelector from './AgentSelector';
import ToolsSidebar from './ToolsSidebar';
import ChatUI from './ChatUI';
import CodeEditor from './CodeEditor';
import PreviewPane from './PreviewPane';
import TerminalComponent from './Terminal';
import AgentBuilder from './AgentBuilder';
import { defaultAgents } from '@/data/agents';
import { Agent } from '@/types/agent';
import { cn } from '@/lib/utils';

type ActivePanel = 'chat' | 'code' | 'preview' | 'terminal';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAgent, setActiveAgent] = useState<Agent>(defaultAgents[0]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [showAgentBuilder, setShowAgentBuilder] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'code' | 'preview' | 'split'>('split');

  const panelButtons = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'code' as const, icon: Code, label: 'Code' },
    { id: 'preview' as const, icon: Eye, label: 'Preview' },
    { id: 'terminal' as const, icon: TerminalIcon, label: 'Terminal' },
  ];

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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold gradient-text">Agentic Max</h1>
            </div>
          </div>
        </div>

        {/* Mobile Panel Switcher */}
        <div className="flex lg:hidden items-center gap-1 bg-secondary rounded-lg p-0.5">
          {panelButtons.map((panel) => {
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
          </div>

          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
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

            {/* Tools */}
            <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
              <ToolsSidebar />
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
            {activePanel === 'code' && <CodeEditor />}
            {activePanel === 'preview' && <PreviewPane />}
            {activePanel === 'terminal' && <TerminalComponent />}
          </div>

          {/* Desktop: Show based on rightPanelMode */}
          <div className="hidden lg:flex flex-col h-full">
            {rightPanelMode === 'code' && (
              <CodeEditor />
            )}
            {rightPanelMode === 'preview' && (
              <PreviewPane />
            )}
            {rightPanelMode === 'split' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                  <CodeEditor />
                </div>
                <div className="h-64 border-t border-border">
                  <TerminalComponent />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Builder Modal */}
      <AgentBuilder isOpen={showAgentBuilder} onClose={() => setShowAgentBuilder(false)} />
    </div>
  );
}
