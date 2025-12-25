import { Agent, Tool } from '@/types/agent';

export const defaultAgents: Agent[] = [
  {
    id: 'manus',
    name: 'Manus',
    description: 'Full Google Services Integration & Web Automation',
    avatar: '🤖',
    tools: ['Google APIs', 'Web Clone', 'Analytics', 'Maps'],
    provider: 'openai',
    status: 'online',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'capy',
    name: 'Capy.ai',
    description: 'App Builder & Testing Automation Expert',
    avatar: '🦫',
    tools: ['App Builder', 'Terminal', 'Testing', 'CI/CD'],
    provider: 'anthropic',
    status: 'online',
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'same',
    name: 'Same.new',
    description: 'Code Editor & Live Preview Specialist',
    avatar: '⚡',
    tools: ['Code Editor', 'Preview', 'Deploy', 'Git'],
    provider: 'openrouter',
    status: 'online',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-Powered Coding Assistant',
    avatar: '🎯',
    tools: ['AI Coding', 'Terminal', 'Debugging', 'Refactor'],
    provider: 'anthropic',
    status: 'online',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'bolt',
    name: 'Bolt.DIY',
    description: 'No-Code Website & App Generator',
    avatar: '⚙️',
    tools: ['Website Builder', 'Components', 'Templates', 'Export'],
    provider: 'bolt',
    status: 'online',
    color: 'from-yellow-500 to-orange-600',
  },
];

export const tools: Tool[] = [
  // Google APIs
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Location services & mapping',
    icon: '🗺️',
    category: 'google',
  },
  {
    id: 'google-analytics',
    name: 'Analytics',
    description: 'Website & app analytics',
    icon: '📊',
    category: 'google',
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Advertising management',
    icon: '📢',
    category: 'google',
  },
  {
    id: 'google-business',
    name: 'Business Profile',
    description: 'Business listing management',
    icon: '🏢',
    category: 'google',
  },
  {
    id: 'google-merchant',
    name: 'Merchant Center',
    description: 'Product feed management',
    icon: '🛒',
    category: 'google',
  },
  {
    id: 'search-console',
    name: 'Search Console',
    description: 'SEO & search performance',
    icon: '🔍',
    category: 'google',
  },
  // Communication
  {
    id: 'email',
    name: 'Email Manager',
    description: 'SMTP & Gmail integration',
    icon: '📧',
    category: 'communication',
  },
  {
    id: 'dns',
    name: 'DNS Manager',
    description: 'Domain & DNS configuration',
    icon: '🌐',
    category: 'communication',
  },
  // Development
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Command line interface',
    icon: '💻',
    category: 'development',
  },
  {
    id: 'code-editor',
    name: 'Code Editor',
    description: 'Full-featured code editor',
    icon: '📝',
    category: 'development',
  },
  {
    id: 'web-clone',
    name: 'Web Clone',
    description: 'Clone any website',
    icon: '📋',
    category: 'development',
  },
  {
    id: 'app-builder',
    name: 'App Builder',
    description: 'Native/Hybrid app builder',
    icon: '📱',
    category: 'development',
  },
  // AI
  {
    id: 'ai-chat',
    name: 'AI Chat',
    description: 'Multi-provider AI chat',
    icon: '🤖',
    category: 'ai',
  },
  {
    id: 'deep-research',
    name: 'Deep Research',
    description: 'Strategic analysis & research',
    icon: '🔬',
    category: 'ai',
  },
  // Automation
  {
    id: 'automation',
    name: 'Automation',
    description: 'Task automation & workflows',
    icon: '⚙️',
    category: 'automation',
  },
  {
    id: 'testing',
    name: 'Testing',
    description: 'Automated testing suite',
    icon: '🧪',
    category: 'automation',
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
