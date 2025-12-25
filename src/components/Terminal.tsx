import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
    { type: 'system', content: 'Agentic Max Terminal v1.0.0 - AI-Powered Shell', timestamp: new Date() },
    { type: 'output', content: 'Connected to AI backend. Type commands or ask questions.', timestamp: new Date() },
    { type: 'output', content: '─'.repeat(50), timestamp: new Date() },
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

    // Handle built-in commands
    if (trimmedCmd.toLowerCase() === 'clear') {
      setLines([]);
      return;
    }

    if (trimmedCmd.toLowerCase() === 'help') {
      setLines(prev => [...prev,
        { type: 'output', content: 'Built-in commands:', timestamp: new Date() },
        { type: 'output', content: '  clear    - Clear terminal', timestamp: new Date() },
        { type: 'output', content: '  help     - Show this help', timestamp: new Date() },
        { type: 'output', content: '', timestamp: new Date() },
        { type: 'output', content: 'Or ask any question - AI will respond!', timestamp: new Date() },
      ]);
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
            content: `You are a terminal assistant. Respond concisely to this command/question: ${trimmedCmd}. If it's a code question, provide working examples. Use plain text, no markdown formatting.`
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

      // Add response lines
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
          {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
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
              "leading-6 whitespace-pre-wrap",
              line.type === 'input' && "text-primary",
              line.type === 'output' && "text-muted-foreground",
              line.type === 'error' && "text-destructive",
              line.type === 'success' && "text-neon-green",
              line.type === 'system' && "text-accent"
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
            disabled={isProcessing}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
