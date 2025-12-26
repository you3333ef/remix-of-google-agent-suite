import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TerminalProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  content: string;
  timestamp: Date;
}

export default function TerminalComponent({ isExpanded, onToggleExpand }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', content: '▸ Agentic Max Terminal v1.0.0', timestamp: new Date() },
    { type: 'output', content: 'Connected to AI backend. Type "help" for available commands.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const processCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    setLines(prev => [...prev, { type: 'input', content: `$ ${cmd}`, timestamp: new Date() }]);
    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    if (trimmedCmd.toLowerCase() === 'clear') {
      setLines([
        { type: 'system', content: '▸ Terminal cleared', timestamp: new Date() },
      ]);
      return;
    }

    if (trimmedCmd.toLowerCase() === 'help') {
      setLines(prev => [...prev,
        { type: 'output', content: '', timestamp: new Date() },
        { type: 'system', content: 'Available Commands:', timestamp: new Date() },
        { type: 'output', content: '  clear      Clear the terminal', timestamp: new Date() },
        { type: 'output', content: '  help       Show this help message', timestamp: new Date() },
        { type: 'output', content: '  date       Show current date/time', timestamp: new Date() },
        { type: 'output', content: '  whoami     Show current user info', timestamp: new Date() },
        { type: 'output', content: '', timestamp: new Date() },
        { type: 'success', content: 'Tip: You can also ask AI questions directly!', timestamp: new Date() },
      ]);
      return;
    }

    if (trimmedCmd.toLowerCase() === 'date') {
      setLines(prev => [...prev, { 
        type: 'success', 
        content: new Date().toLocaleString(), 
        timestamp: new Date() 
      }]);
      return;
    }

    if (trimmedCmd.toLowerCase() === 'whoami') {
      setLines(prev => [...prev, { 
        type: 'success', 
        content: 'agentic-max-user @ development', 
        timestamp: new Date() 
      }]);
      return;
    }

    // Send to AI for processing
    setIsProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `You are a terminal assistant. Respond concisely and helpfully to: ${trimmedCmd}. Keep responses brief and use plain text.`
          }],
          agentName: 'Terminal AI',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process command');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let textBuffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });
          
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch { /* ignore */ }
          }
        }
      }

      const responseLines = fullResponse.split('\n').filter(l => l.trim());
      responseLines.forEach(line => {
        setLines(prev => [...prev, { type: 'success', content: line, timestamp: new Date() }]);
      });

    } catch (error) {
      setLines(prev => [...prev, { 
        type: 'error', 
        content: `Error: ${(error as Error).message}`, 
        timestamp: new Date() 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      processCommand(input);
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

  const clearTerminal = () => {
    setLines([{ type: 'system', content: '▸ Terminal cleared', timestamp: new Date() }]);
  };

  return (
    <div className={cn(
      "flex flex-col overflow-hidden transition-all duration-300 bg-background border-t border-border/40",
      isExpanded ? "fixed inset-4 z-50 rounded-xl border" : "h-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-destructive/80" />
            <span className="w-3 h-3 rounded-full bg-neon-orange/80" />
            <span className="w-3 h-3 rounded-full bg-neon-green/80" />
          </div>
          <span className="text-sm font-medium text-foreground font-mono ml-2">Terminal</span>
          {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary ml-2" />}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={clearTerminal} className="text-muted-foreground hover:text-foreground">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground">
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm cursor-text scrollbar-thin bg-background"
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "leading-6 whitespace-pre-wrap",
              line.type === 'input' && "text-primary font-medium",
              line.type === 'output' && "text-muted-foreground",
              line.type === 'error' && "text-destructive",
              line.type === 'success' && "text-neon-green",
              line.type === 'system' && "text-accent font-semibold"
            )}
          >
            {line.content}
          </div>
        ))}
        
        {/* Input Line */}
        <div className="flex items-center leading-6 mt-1">
          <span className="text-primary font-medium">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-foreground caret-primary"
            disabled={isProcessing}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
