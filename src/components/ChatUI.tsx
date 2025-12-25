import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Sparkles, RotateCcw, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agent, Message } from '@/types/agent';
import { cn } from '@/lib/utils';

interface ChatUIProps {
  activeAgent: Agent;
}

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
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update welcome message when agent changes
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm ${activeAgent.name}. I'm here to help you with ${activeAgent.tools.join(', ')}. How can I assist you today?`,
      timestamp: new Date(),
      agentId: activeAgent.id,
    }]);
  }, [activeAgent]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `I understand you want to ${input.toLowerCase()}. Let me analyze this using my ${activeAgent.tools[0]} capabilities...`,
        `Great question! Using my integration with ${activeAgent.provider.toUpperCase()}, I can help you with that. Here's what I found...`,
        `I'm processing your request through my ${activeAgent.tools.join(' and ')} tools. This will just take a moment...`,
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        agentId: activeAgent.id,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Avatar */}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0",
              message.role === 'user'
                ? "bg-primary text-primary-foreground"
                : `bg-gradient-to-br ${activeAgent.color}`
            )}>
              {message.role === 'user' ? '👤' : activeAgent.avatar}
            </div>

            {/* Message Content */}
            <div className={cn(
              "max-w-[80%] group",
              message.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm",
                message.role === 'user'
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-foreground rounded-bl-md"
              )}>
                {message.content}
              </div>

              {/* Message Actions */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-gradient-to-br",
              activeAgent.color
            )}>
              {activeAgent.avatar}
            </div>
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="glass-panel p-2 flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
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
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon">
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              variant="neon"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="rounded-xl"
            >
              {isTyping ? (
                <Sparkles className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Powered by {activeAgent.provider.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
