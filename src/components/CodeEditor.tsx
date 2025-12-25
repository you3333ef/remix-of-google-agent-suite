import { useState } from 'react';
import { Play, Copy, Download, Maximize2, Minimize2, RotateCcw, Code, FileCode, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sampleCode = `// Agentic Max - AI Agent Controller
import { GoogleAPIs } from './services/google';
import { AIProvider } from './providers';

interface AgentConfig {
  name: string;
  provider: AIProvider;
  tools: string[];
}

export class AgenticController {
  private agents: Map<string, AgentConfig> = new Map();
  private googleServices: GoogleAPIs;

  constructor() {
    this.googleServices = new GoogleAPIs();
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents() {
    // Initialize Manus Agent
    this.agents.set('manus', {
      name: 'Manus',
      provider: 'openai',
      tools: ['Google APIs', 'Web Clone', 'Analytics']
    });

    // Initialize Capy.ai Agent  
    this.agents.set('capy', {
      name: 'Capy.ai',
      provider: 'anthropic',
      tools: ['App Builder', 'Terminal', 'Testing']
    });
  }

  async executeTask(agentId: string, task: string) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    console.log(\`Executing: \${task}\`);
    // Deep research & strategic thinking...
    return await this.processWithAI(agent, task);
  }
}`;

interface CodeEditorProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function CodeEditor({ isExpanded, onToggleExpand }: CodeEditorProps) {
  const [code, setCode] = useState(sampleCode);
  const [language, setLanguage] = useState('typescript');
  const [fileName, setFileName] = useState('agent_controller.ts');

  const languages = [
    { id: 'typescript', label: 'TypeScript', ext: '.ts' },
    { id: 'javascript', label: 'JavaScript', ext: '.js' },
    { id: 'python', label: 'Python', ext: '.py' },
    { id: 'html', label: 'HTML', ext: '.html' },
    { id: 'css', label: 'CSS', ext: '.css' },
  ];

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className={cn(
      "flex flex-col glass-panel overflow-hidden transition-all duration-300",
      isExpanded ? "fixed inset-4 z-50" : "h-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{fileName}</span>
          <div className="relative">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-secondary">
              {languages.find(l => l.id === language)?.label}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={copyCode} title="Copy code">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Download">
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
            onChange={(e) => setCode(e.target.value)}
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
            <span className="w-2 h-2 rounded-full bg-neon-green" />
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}
