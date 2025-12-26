export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextWindow?: string;
  capabilities?: string[];
}

export interface AIProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  apiKeyPlaceholder: string;
  apiKeyPrefix: string;
  docsUrl: string;
  models: AIModel[];
}

export const aiProviders: AIProvider[] = [
  {
    id: 'lovable',
    name: 'Lovable AI',
    icon: '💜',
    color: 'text-purple-400',
    description: 'Built-in AI (no API key required)',
    apiKeyPlaceholder: '',
    apiKeyPrefix: '',
    docsUrl: 'https://docs.lovable.dev',
    models: [
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and efficient' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable' },
      { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Fastest' },
      { id: 'openai/gpt-5', name: 'GPT-5', description: 'Powerful all-rounder' },
      { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Cost-efficient' },
      { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', description: 'Fastest OpenAI' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🧠',
    color: 'text-green-400',
    description: 'GPT models from OpenAI',
    apiKeyPlaceholder: 'sk-...',
    apiKeyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/docs',
    models: [
      { id: 'gpt-5-2025-08-07', name: 'GPT-5', description: 'Flagship model', contextWindow: '128K' },
      { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini', description: 'Fast & efficient', contextWindow: '128K' },
      { id: 'gpt-5-nano-2025-08-07', name: 'GPT-5 Nano', description: 'Ultra-fast', contextWindow: '128K' },
      { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1', description: 'Reliable', contextWindow: '128K' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal', contextWindow: '128K' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast multimodal', contextWindow: '128K' },
      { id: 'o3-2025-04-16', name: 'O3', description: 'Advanced reasoning', contextWindow: '200K' },
      { id: 'o4-mini-2025-04-16', name: 'O4 Mini', description: 'Fast reasoning', contextWindow: '200K' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🔮',
    color: 'text-orange-400',
    description: 'Claude models from Anthropic',
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyPrefix: 'sk-ant-',
    docsUrl: 'https://docs.anthropic.com',
    models: [
      { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5', description: 'Most capable', contextWindow: '200K' },
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'Highly intelligent', contextWindow: '200K' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest', contextWindow: '200K' },
    ],
  },
  {
    id: 'google',
    name: 'Google AI',
    icon: '🌐',
    color: 'text-blue-400',
    description: 'Gemini models from Google',
    apiKeyPlaceholder: 'AIza...',
    apiKeyPrefix: 'AIza',
    docsUrl: 'https://ai.google.dev/docs',
    models: [
      { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro', description: 'Most capable', contextWindow: '1M' },
      { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', description: 'Fast & efficient', contextWindow: '1M' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Previous gen', contextWindow: '1M' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🌊',
    color: 'text-cyan-400',
    description: 'Open-weight models from Mistral',
    apiKeyPlaceholder: 'your-api-key',
    apiKeyPrefix: '',
    docsUrl: 'https://docs.mistral.ai',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Most capable', contextWindow: '128K' },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', description: 'Balanced', contextWindow: '32K' },
      { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Fast', contextWindow: '32K' },
      { id: 'codestral-latest', name: 'Codestral', description: 'Code specialist', contextWindow: '32K' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    color: 'text-yellow-400',
    description: 'Ultra-fast inference',
    apiKeyPlaceholder: 'gsk_...',
    apiKeyPrefix: 'gsk_',
    docsUrl: 'https://console.groq.com/docs',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Most capable', contextWindow: '128K' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Ultra-fast', contextWindow: '128K' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Efficient MoE', contextWindow: '32K' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Compact', contextWindow: '8K' },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    icon: '🤝',
    color: 'text-pink-400',
    description: 'Open source models',
    apiKeyPlaceholder: 'your-api-key',
    apiKeyPrefix: '',
    docsUrl: 'https://docs.together.ai',
    models: [
      { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B', description: 'Largest open', contextWindow: '128K' },
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B', description: 'Balanced', contextWindow: '128K' },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B', description: 'Strong multilingual', contextWindow: '32K' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'Efficient', contextWindow: '64K' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    color: 'text-indigo-400',
    description: 'Access multiple providers',
    apiKeyPlaceholder: 'sk-or-...',
    apiKeyPrefix: 'sk-or-',
    docsUrl: 'https://openrouter.ai/docs',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Via OpenRouter' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Via OpenRouter' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', description: 'Via OpenRouter' },
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', description: 'Via OpenRouter' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: '🔍',
    color: 'text-emerald-400',
    description: 'AI-powered search',
    apiKeyPlaceholder: 'pplx-...',
    apiKeyPrefix: 'pplx-',
    docsUrl: 'https://docs.perplexity.ai',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', description: 'Multi-step reasoning with citations' },
      { id: 'sonar', name: 'Sonar', description: 'Fast search for everyday questions' },
      { id: 'sonar-reasoning', name: 'Sonar Reasoning', description: 'Chain-of-thought with search' },
      { id: 'sonar-deep-research', name: 'Sonar Deep Research', description: 'Expert research' },
    ],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    icon: '🔷',
    color: 'text-sky-400',
    description: 'Enterprise AI models',
    apiKeyPlaceholder: 'your-api-key',
    apiKeyPrefix: '',
    docsUrl: 'https://docs.cohere.com',
    models: [
      { id: 'command-r-plus', name: 'Command R+', description: 'Most capable', contextWindow: '128K' },
      { id: 'command-r', name: 'Command R', description: 'Balanced', contextWindow: '128K' },
      { id: 'command-light', name: 'Command Light', description: 'Fast', contextWindow: '4K' },
    ],
  },
];

export const getProviderById = (id: string): AIProvider | undefined => {
  return aiProviders.find(p => p.id === id);
};

export const getModelById = (providerId: string, modelId: string): AIModel | undefined => {
  const provider = getProviderById(providerId);
  return provider?.models.find(m => m.id === modelId);
};

export const defaultProvider = 'lovable';
export const defaultModel = 'google/gemini-2.5-flash';
