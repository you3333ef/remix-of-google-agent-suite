import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, RotateCcw, Copy, ThumbsUp, ThumbsDown, StopCircle, ChevronDown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Agent, Message } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { aiProviders, getProviderById, defaultProvider, defaultModel } from '@/data/aiProviders';

interface ChatUIProps {
  activeAgent: Agent;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function ChatUI({ activeAgent }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const currentProvider = getProviderById(selectedProvider);

  // Load user settings
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;
    
    const { data: settings } = await supabase
      .from('user_settings')
      .select('api_keys, preferred_ai_provider, preferred_agent')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      if (settings.api_keys && typeof settings.api_keys === 'object') {
        setApiKeys(settings.api_keys as Record<string, string>);
      }
      if (settings.preferred_ai_provider) {
        setSelectedProvider(settings.preferred_ai_provider);
      }
      if (settings.preferred_agent) {
        setSelectedModel(settings.preferred_agent);
      }
    }
  };

  // Initial greeting
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm ${activeAgent.name}. I'm here to help you with ${activeAgent.tools.join(', ')}. How can I assist you today?`,
      timestamp: new Date(),
      agentId: activeAgent.id,
    }]);
  }, [activeAgent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const requestBody: any = { 
        messages: apiMessages,
        agentId: activeAgent.id,
        agentName: activeAgent.name,
        agentTools: activeAgent.tools,
        provider: selectedProvider,
        model: selectedModel,
      };

      // Include API key for non-Lovable providers
      if (selectedProvider !== 'lovable' && apiKeys[selectedProvider]) {
        requestBody.apiKey = apiKeys[selectedProvider];
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(requestBody),
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

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = getProviderById(providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Model Selector Header */}
      <div className="px-4 py-2 border-b border-border/60 bg-card/30">
        <button
          onClick={() => setShowModelSelector(!showModelSelector)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{currentProvider?.icon}</span>
          <span className="font-medium">{currentProvider?.name}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs">{currentProvider?.models.find(m => m.id === selectedModel)?.name || selectedModel}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showModelSelector && "rotate-180")} />
        </button>

        {showModelSelector && (
          <div className="mt-3 p-3 bg-card rounded-lg border border-border/60 space-y-3 animate-fade-in">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Provider</label>
              <Select value={selectedProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="bg-secondary/50 border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {aiProviders.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <span className="flex items-center gap-2">
                        <span>{provider.icon}</span>
                        <span>{provider.name}</span>
                        {provider.id !== 'lovable' && !apiKeys[provider.id] && (
                          <span className="text-xs text-muted-foreground">(needs API key)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-secondary/50 border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {currentProvider?.models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">- {model.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProvider !== 'lovable' && !apiKeys[selectedProvider] && (
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <Settings2 className="h-3 w-3" />
                Add your API key in Settings to use this provider
              </p>
            )}
          </div>
        )}
      </div>

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
                disabled={!input.trim() || (selectedProvider !== 'lovable' && !apiKeys[selectedProvider])}
                className="rounded-xl shadow-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>
            Using <span className="text-foreground/80 font-medium">{currentProvider?.name}</span>
            {' • '}
            <span className="text-foreground/60">{currentProvider?.models.find(m => m.id === selectedModel)?.name}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
