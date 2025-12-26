import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, RotateCcw, Copy, ThumbsUp, ThumbsDown, StopCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agent, Message } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatUIProps {
  activeAgent: Agent;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function ChatUI({ activeAgent }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm ${activeAgent.name}. I'm here to help you with ${activeAgent.tools.join(', ')}. How can I assist you today?`,
      timestamp: new Date(),
      agentId: activeAgent.id,
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm ${activeAgent.name}. I'm here to help you with ${activeAgent.tools.join(', ')}. How can I assist you today?`,
      timestamp: new Date(),
      agentId: activeAgent.id,
    }]);
  }, [activeAgent]);

  const stopStreaming = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsStreaming(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const controller = new AbortController();
    setAbortController(controller);

    const apiMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: 'user', content: currentInput });

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: apiMessages,
          agentId: activeAgent.id,
          agentName: activeAgent.name,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const updateAssistantMessage = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && !last.agentId) {
            return prev.map((m, i) => 
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant' as const,
            content: assistantContent,
            timestamp: new Date(),
          }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              updateAssistantMessage(assistantContent + content);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, agentId: activeAgent.id } : m
          );
        }
        return prev;
      });

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error('Chat error:', error);
        toast({
          title: "Error",
          description: (error as Error).message || "Failed to send message",
          variant: "destructive"
        });
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied", description: "Message copied to clipboard" });
  };

  const regenerateMessage = async () => {
    if (isStreaming || messages.length < 2) return;
    
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMessageIndex === -1) return;
    
    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = messages[actualIndex];
    
    setMessages(prev => prev.slice(0, actualIndex));
    setInput(lastUserMessage.content);
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm",
              message.role === 'user'
                ? "bg-primary text-primary-foreground"
                : `bg-gradient-to-br ${activeAgent.color}`
            )}>
              {message.role === 'user' ? '👤' : activeAgent.avatar}
            </div>

            <div className={cn(
              "max-w-[80%] group",
              message.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
                message.role === 'user'
                  ? "bg-primary text-primary-foreground rounded-br-lg shadow-lg"
                  : "bg-card border border-border/60 text-foreground rounded-bl-lg shadow-md"
              )}>
                {message.content}
              </div>

              {message.role === 'assistant' && (
                <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => copyMessage(message.content)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={regenerateMessage}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3 animate-fade-in">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-gradient-to-br shadow-sm",
              activeAgent.color
            )}>
              {activeAgent.avatar}
            </div>
            <div className="bg-card border border-border/60 rounded-2xl rounded-bl-lg px-4 py-3 shadow-md">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="glass-panel p-2.5 flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeAgent.name}...`}
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-sm py-2 px-2 max-h-32 scrollbar-thin"
              style={{ minHeight: '40px' }}
              disabled={isStreaming}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isStreaming ? (
              <Button
                variant="destructive"
                size="icon"
                onClick={stopStreaming}
                className="rounded-xl shadow-lg"
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="neon"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="rounded-xl shadow-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Powered by <span className="text-foreground/80 font-medium">{activeAgent.provider.toUpperCase()}</span></span>
        </div>
      </div>
    </div>
  );
}
