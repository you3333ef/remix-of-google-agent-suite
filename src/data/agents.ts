import { Agent, Tool } from '@/types/agent';

export const defaultAgents: Agent[] = [
  {
    id: 'manus',
    name: 'Manus',
    description: 'AI assistant for chat, cloning, and coding',
    avatar: '🤖',
    tools: ['AI Chat', 'Web Clone', 'Code Editor', 'Terminal'],
    provider: 'openai',
    status: 'online',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'capy',
    name: 'Capy.ai',
    description: 'Fast coding helper with terminal guidance',
    avatar: '🦫',
    tools: ['Code Editor', 'Terminal', 'AI Chat'],
    provider: 'anthropic',
    status: 'online',
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'same',
    name: 'Same.new',
    description: 'Live editor + preview workflow assistant',
    avatar: '⚡',
    tools: ['Code Editor', 'Web Clone', 'AI Chat'],
    provider: 'openrouter',
    status: 'online',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'Refactoring and debugging assistant',
    avatar: '🎯',
    tools: ['AI Chat', 'Code Editor', 'Terminal'],
    provider: 'anthropic',
    status: 'online',
    color: 'from-orange-500 to-red-600',
  },
];

export const tools: Tool[] = [
  // AI
  {
    id: 'ai-chat',
    name: 'AI Chat',
    description: 'Multi-provider AI chat',
    icon: '🤖',
    category: 'ai',
  },

  // Development
  {
    id: 'web-clone',
    name: 'Web Clone',
    description: 'Clone a website into HTML',
    icon: '📋',
    category: 'development',
  },
  {
    id: 'code-editor',
    name: 'Code Editor',
    description: 'Edit project files',
    icon: '📝',
    category: 'development',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Command-like AI helper',
    icon: '💻',
    category: 'development',
  },
];

export const aiProviders = [
  { id: 'openai', name: 'OpenAI', icon: '🧠', color: 'text-green-400' },
  { id: 'anthropic', name: 'Anthropic', icon: '🔮', color: 'text-purple-400' },
  { id: 'meta', name: 'Meta AI', icon: '🌐', color: 'text-blue-400' },
  { id: 'mistral', name: 'Mistral', icon: '🌊', color: 'text-cyan-400' },
  { id: 'openrouter', name: 'OpenRouter', icon: '🔀', color: 'text-orange-400' },
  { id: 'bolt', name: 'Bolt', icon: '⚡', color: 'text-yellow-400' },
];
