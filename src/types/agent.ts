export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  tools: string[];
  provider: AIProvider;
  status: 'online' | 'offline' | 'busy';
  color: string;
}

export type AIProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'meta' 
  | 'mistral' 
  | 'openrouter' 
  | 'bolt';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
}

export type ToolCategory = 
  | 'google' 
  | 'communication' 
  | 'development' 
  | 'ai' 
  | 'automation';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}
