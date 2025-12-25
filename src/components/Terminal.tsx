import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TerminalProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
  timestamp: Date;
}

export default function TerminalComponent({ isExpanded, onToggleExpand }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'Agentic Max Terminal v1.0.0', timestamp: new Date() },
    { type: 'output', content: 'Type "help" for available commands.', timestamp: new Date() },
    { type: 'output', content: '─'.repeat(50), timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    setLines(prev => [...prev, { type: 'input', content: `$ ${cmd}`, timestamp: new Date() }]);
    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Simple command simulation
    switch (trimmedCmd) {
      case 'help':
        setLines(prev => [...prev, 
          { type: 'output', content: 'Available commands:', timestamp: new Date() },
          { type: 'output', content: '  help     - Show this help message', timestamp: new Date() },
          { type: 'output', content: '  clear    - Clear terminal', timestamp: new Date() },
          { type: 'output', content: '  agents   - List available agents', timestamp: new Date() },
          { type: 'output', content: '  tools    - List available tools', timestamp: new Date() },
          { type: 'output', content: '  status   - Show system status', timestamp: new Date() },
        ]);
        break;
      case 'clear':
        setLines([]);
        break;
      case 'agents':
        setLines(prev => [...prev,
          { type: 'success', content: '✓ Manus       [ONLINE]  OpenAI', timestamp: new Date() },
          { type: 'success', content: '✓ Capy.ai     [ONLINE]  Anthropic', timestamp: new Date() },
          { type: 'success', content: '✓ Same.new    [ONLINE]  OpenRouter', timestamp: new Date() },
          { type: 'success', content: '✓ Cursor      [ONLINE]  Anthropic', timestamp: new Date() },
          { type: 'success', content: '✓ Bolt.DIY    [ONLINE]  Bolt', timestamp: new Date() },
        ]);
        break;
      case 'tools':
        setLines(prev => [...prev,
          { type: 'output', content: 'Google APIs: Maps, Analytics, Ads, Business, Merchant', timestamp: new Date() },
          { type: 'output', content: 'Development: Terminal, Code Editor, Web Clone, App Builder', timestamp: new Date() },
          { type: 'output', content: 'Communication: Email, DNS', timestamp: new Date() },
          { type: 'output', content: 'AI: Chat, Deep Research', timestamp: new Date() },
          { type: 'output', content: 'Automation: Testing, Workflows', timestamp: new Date() },
        ]);
        break;
      case 'status':
        setLines(prev => [...prev,
          { type: 'success', content: '● System Status: OPERATIONAL', timestamp: new Date() },
          { type: 'output', content: '  CPU: 23%  |  Memory: 4.2GB  |  Network: Connected', timestamp: new Date() },
          { type: 'output', content: '  Active Agents: 5  |  Queued Tasks: 0', timestamp: new Date() },
        ]);
        break;
      default:
        if (trimmedCmd) {
          setLines(prev => [...prev, 
            { type: 'error', content: `Command not found: ${cmd}`, timestamp: new Date() },
            { type: 'output', content: 'Type "help" for available commands.', timestamp: new Date() },
          ]);
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className={cn(
      "flex flex-col glass-panel overflow-hidden transition-all duration-300 bg-background",
      isExpanded ? "fixed inset-4 z-50" : "h-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-neon-green" />
          <span className="text-sm font-medium text-foreground font-mono">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onToggleExpand}>
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm cursor-text scrollbar-thin"
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "leading-6",
              line.type === 'input' && "text-primary",
              line.type === 'output' && "text-muted-foreground",
              line.type === 'error' && "text-destructive",
              line.type === 'success' && "text-neon-green"
            )}
          >
            {line.content}
          </div>
        ))}
        
        {/* Input Line */}
        <div className="flex items-center leading-6">
          <span className="text-primary">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-foreground caret-primary"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
