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
    description: 'Access 300+ models from all providers',
    apiKeyPlaceholder: 'sk-or-...',
    apiKeyPrefix: 'sk-or-',
    docsUrl: 'https://openrouter.ai/docs',
    models: [
      // === FREE MODELS ===
      { id: 'google/gemma-3-1b-it:free', name: '🆓 Gemma 3 1B', description: 'Free - Google compact', contextWindow: '32K', capabilities: ['free'] },
      { id: 'google/gemma-3-4b-it:free', name: '🆓 Gemma 3 4B', description: 'Free - Google efficient', contextWindow: '32K', capabilities: ['free'] },
      { id: 'google/gemma-3-12b-it:free', name: '🆓 Gemma 3 12B', description: 'Free - Google capable', contextWindow: '32K', capabilities: ['free'] },
      { id: 'google/gemma-3-27b-it:free', name: '🆓 Gemma 3 27B', description: 'Free - Google powerful', contextWindow: '32K', capabilities: ['free'] },
      { id: 'meta-llama/llama-3.2-1b-instruct:free', name: '🆓 Llama 3.2 1B', description: 'Free - Meta compact', contextWindow: '128K', capabilities: ['free'] },
      { id: 'meta-llama/llama-3.2-3b-instruct:free', name: '🆓 Llama 3.2 3B', description: 'Free - Meta efficient', contextWindow: '128K', capabilities: ['free'] },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: '🆓 Llama 3.1 8B', description: 'Free - Meta capable', contextWindow: '128K', capabilities: ['free'] },
      { id: 'meta-llama/llama-4-scout:free', name: '🆓 Llama 4 Scout', description: 'Free - Meta latest', contextWindow: '512K', capabilities: ['free'] },
      { id: 'meta-llama/llama-4-maverick:free', name: '🆓 Llama 4 Maverick', description: 'Free - Meta advanced', contextWindow: '256K', capabilities: ['free'] },
      { id: 'qwen/qwen3-4b:free', name: '🆓 Qwen 3 4B', description: 'Free - Alibaba compact', contextWindow: '32K', capabilities: ['free'] },
      { id: 'qwen/qwen3-8b:free', name: '🆓 Qwen 3 8B', description: 'Free - Alibaba efficient', contextWindow: '32K', capabilities: ['free'] },
      { id: 'qwen/qwen3-14b:free', name: '🆓 Qwen 3 14B', description: 'Free - Alibaba capable', contextWindow: '32K', capabilities: ['free'] },
      { id: 'qwen/qwen3-30b-a3b:free', name: '🆓 Qwen 3 30B', description: 'Free - Alibaba MoE', contextWindow: '32K', capabilities: ['free'] },
      { id: 'qwen/qwen3-32b:free', name: '🆓 Qwen 3 32B', description: 'Free - Alibaba powerful', contextWindow: '32K', capabilities: ['free'] },
      { id: 'qwen/qwen3-235b-a22b:free', name: '🆓 Qwen 3 235B', description: 'Free - Alibaba largest', contextWindow: '32K', capabilities: ['free'] },
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: '🆓 Qwen 2.5 72B', description: 'Free - Alibaba previous', contextWindow: '128K', capabilities: ['free'] },
      { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: '🆓 Qwen 2.5 Coder 32B', description: 'Free - Code specialist', contextWindow: '32K', capabilities: ['free', 'code'] },
      { id: 'qwen/qwq-32b:free', name: '🆓 QwQ 32B', description: 'Free - Reasoning model', contextWindow: '32K', capabilities: ['free', 'reasoning'] },
      { id: 'deepseek/deepseek-chat-v3-0324:free', name: '🆓 DeepSeek V3', description: 'Free - DeepSeek capable', contextWindow: '64K', capabilities: ['free'] },
      { id: 'deepseek/deepseek-r1:free', name: '🆓 DeepSeek R1', description: 'Free - DeepSeek reasoning', contextWindow: '64K', capabilities: ['free', 'reasoning'] },
      { id: 'deepseek/deepseek-r1-0528:free', name: '🆓 DeepSeek R1 0528', description: 'Free - Latest reasoning', contextWindow: '64K', capabilities: ['free', 'reasoning'] },
      { id: 'microsoft/phi-4:free', name: '🆓 Phi-4', description: 'Free - Microsoft compact', contextWindow: '16K', capabilities: ['free'] },
      { id: 'microsoft/phi-4-reasoning:free', name: '🆓 Phi-4 Reasoning', description: 'Free - Microsoft reasoning', contextWindow: '16K', capabilities: ['free', 'reasoning'] },
      { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: '🆓 Mistral Small 3.1', description: 'Free - Mistral efficient', contextWindow: '96K', capabilities: ['free'] },
      { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: '🆓 Hermes 3 405B', description: 'Free - NousResearch', contextWindow: '128K', capabilities: ['free'] },
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', name: '🆓 Nemotron 70B', description: 'Free - NVIDIA optimized', contextWindow: '128K', capabilities: ['free'] },
      { id: 'openchat/openchat-7b:free', name: '🆓 OpenChat 7B', description: 'Free - Open source', contextWindow: '8K', capabilities: ['free'] },
      { id: 'rekaai/reka-flash-3:free', name: '🆓 Reka Flash 3', description: 'Free - Reka AI', contextWindow: '32K', capabilities: ['free'] },
      { id: 'moonshotai/moonlight-16b-a3b-instruct:free', name: '🆓 Moonlight 16B', description: 'Free - Moonshot AI', contextWindow: '8K', capabilities: ['free'] },
      { id: 'bytedance-research/ui-tars-72b:free', name: '🆓 UI-TARS 72B', description: 'Free - UI generation', contextWindow: '32K', capabilities: ['free', 'vision'] },
      { id: 'allenai/molmo-7b-d:free', name: '🆓 Molmo 7B', description: 'Free - Allen AI vision', contextWindow: '4K', capabilities: ['free', 'vision'] },
      
      // === ANTHROPIC MODELS ===
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Latest Anthropic flagship', contextWindow: '200K' },
      { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Extended thinking', contextWindow: '200K' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Previous flagship', contextWindow: '200K' },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', description: 'Fast and efficient', contextWindow: '200K' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude 3', contextWindow: '200K' },
      
      // === OPENAI MODELS ===
      { id: 'openai/gpt-4.1', name: 'GPT-4.1', description: 'Latest GPT-4 series', contextWindow: '1M' },
      { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Efficient GPT-4.1', contextWindow: '1M' },
      { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', description: 'Compact GPT-4.1', contextWindow: '1M' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Multimodal flagship', contextWindow: '128K' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast multimodal', contextWindow: '128K' },
      { id: 'openai/o1', name: 'o1', description: 'Advanced reasoning', contextWindow: '200K' },
      { id: 'openai/o1-mini', name: 'o1 Mini', description: 'Fast reasoning', contextWindow: '128K' },
      { id: 'openai/o1-pro', name: 'o1 Pro', description: 'Pro reasoning', contextWindow: '200K' },
      { id: 'openai/o3', name: 'o3', description: 'Latest reasoning', contextWindow: '200K' },
      { id: 'openai/o3-mini', name: 'o3 Mini', description: 'Efficient reasoning', contextWindow: '200K' },
      { id: 'openai/o4-mini', name: 'o4 Mini', description: 'Next-gen reasoning', contextWindow: '200K' },
      
      // === GOOGLE MODELS ===
      { id: 'google/gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro', description: 'Most capable Gemini', contextWindow: '1M' },
      { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', description: 'Fast Gemini 2.5', contextWindow: '1M' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Previous gen', contextWindow: '1M' },
      { id: 'google/gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', description: 'Reasoning model', contextWindow: '1M' },
      
      // === META LLAMA MODELS ===
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', description: 'Latest Llama flagship', contextWindow: '256K' },
      { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', description: 'Extended context', contextWindow: '512K' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: 'Powerful open model', contextWindow: '128K' },
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', description: 'Largest Llama', contextWindow: '128K' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'Efficient large', contextWindow: '128K' },
      
      // === DEEPSEEK MODELS ===
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', description: 'Latest DeepSeek', contextWindow: '64K' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', description: 'Reasoning model', contextWindow: '64K' },
      { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek R1 0528', description: 'Latest R1 update', contextWindow: '64K' },
      { id: 'deepseek/deepseek-prover-v2', name: 'DeepSeek Prover V2', description: 'Math specialist', contextWindow: '64K' },
      
      // === QWEN MODELS ===
      { id: 'qwen/qwen3-235b-a22b', name: 'Qwen 3 235B', description: 'Largest Qwen MoE', contextWindow: '32K' },
      { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B', description: 'Powerful dense', contextWindow: '32K' },
      { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', description: 'Multilingual expert', contextWindow: '128K' },
      { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', description: 'Code specialist', contextWindow: '32K' },
      { id: 'qwen/qwq-32b', name: 'QwQ 32B', description: 'Reasoning model', contextWindow: '32K' },
      
      // === MISTRAL MODELS ===
      { id: 'mistralai/mistral-large-2411', name: 'Mistral Large', description: 'Most capable Mistral', contextWindow: '128K' },
      { id: 'mistralai/mistral-medium-3', name: 'Mistral Medium 3', description: 'Balanced performance', contextWindow: '128K' },
      { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1', description: 'Efficient model', contextWindow: '96K' },
      { id: 'mistralai/codestral-2501', name: 'Codestral', description: 'Code specialist', contextWindow: '256K' },
      { id: 'mistralai/ministral-8b', name: 'Ministral 8B', description: 'Compact model', contextWindow: '128K' },
      
      // === COHERE MODELS ===
      { id: 'cohere/command-r-plus-08-2024', name: 'Command R+', description: 'Most capable Cohere', contextWindow: '128K' },
      { id: 'cohere/command-r-08-2024', name: 'Command R', description: 'Balanced Cohere', contextWindow: '128K' },
      { id: 'cohere/command-a', name: 'Command A', description: 'Latest architecture', contextWindow: '128K' },
      
      // === MICROSOFT MODELS ===
      { id: 'microsoft/phi-4', name: 'Phi-4', description: 'Compact and capable', contextWindow: '16K' },
      { id: 'microsoft/phi-4-reasoning', name: 'Phi-4 Reasoning', description: 'Enhanced reasoning', contextWindow: '16K' },
      { id: 'microsoft/phi-4-reasoning-plus', name: 'Phi-4 Reasoning Plus', description: 'Advanced reasoning', contextWindow: '16K' },
      { id: 'microsoft/mai-ds-r1', name: 'MAI DS R1', description: 'Distilled reasoning', contextWindow: '128K' },
      
      // === NVIDIA MODELS ===
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', description: 'NVIDIA optimized', contextWindow: '128K' },
      { id: 'nvidia/llama-3.3-nemotron-super-49b-v1', name: 'Nemotron Super 49B', description: 'Super efficient', contextWindow: '128K' },
      
      // === PERPLEXITY MODELS ===
      { id: 'perplexity/sonar-pro', name: 'Sonar Pro', description: 'Search-enhanced', contextWindow: '127K' },
      { id: 'perplexity/sonar', name: 'Sonar', description: 'Fast search', contextWindow: '127K' },
      { id: 'perplexity/sonar-reasoning-pro', name: 'Sonar Reasoning Pro', description: 'Deep reasoning', contextWindow: '127K' },
      { id: 'perplexity/sonar-reasoning', name: 'Sonar Reasoning', description: 'Reasoning with search', contextWindow: '127K' },
      { id: 'perplexity/sonar-deep-research', name: 'Sonar Deep Research', description: 'Expert research', contextWindow: '127K' },
      
      // === X.AI GROK MODELS ===
      { id: 'x-ai/grok-3-beta', name: 'Grok 3 Beta', description: 'Latest Grok', contextWindow: '131K' },
      { id: 'x-ai/grok-3-mini-beta', name: 'Grok 3 Mini', description: 'Compact Grok', contextWindow: '131K' },
      { id: 'x-ai/grok-2-vision-1212', name: 'Grok 2 Vision', description: 'Multimodal Grok', contextWindow: '32K' },
      
      // === OTHER NOTABLE MODELS ===
      { id: 'amazon/nova-pro-v1', name: 'Amazon Nova Pro', description: 'AWS flagship', contextWindow: '300K' },
      { id: 'amazon/nova-lite-v1', name: 'Amazon Nova Lite', description: 'AWS efficient', contextWindow: '300K' },
      { id: 'inflection/inflection-3-productivity', name: 'Inflection 3', description: 'Productivity focus', contextWindow: '8K' },
      { id: 'databricks/dbrx-instruct', name: 'DBRX', description: 'Databricks MoE', contextWindow: '32K' },
      { id: 'ai21/jamba-1.6-large', name: 'Jamba 1.6 Large', description: 'AI21 hybrid', contextWindow: '256K' },
      { id: 'thudm/glm-4-plus', name: 'GLM-4 Plus', description: 'Zhipu AI', contextWindow: '128K' },
      
      // === VISION MODELS ===
      { id: 'openai/gpt-4o:extended', name: 'GPT-4o Extended', description: 'Extended vision', contextWindow: '128K', capabilities: ['vision'] },
      { id: 'anthropic/claude-3.5-sonnet:beta', name: 'Claude 3.5 Vision', description: 'Vision capable', contextWindow: '200K', capabilities: ['vision'] },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Vision', description: 'Multimodal Gemini', contextWindow: '1M', capabilities: ['vision'] },
      { id: 'qwen/qwen-2-vl-72b-instruct', name: 'Qwen 2 VL 72B', description: 'Vision-language', contextWindow: '32K', capabilities: ['vision'] },
      
      // === CODE MODELS ===
      { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', description: 'Code generation', contextWindow: '64K', capabilities: ['code'] },
      { id: 'mistralai/codestral-2501', name: 'Codestral Latest', description: 'Mistral code', contextWindow: '256K', capabilities: ['code'] },
      { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen Coder 32B', description: 'Alibaba code', contextWindow: '32K', capabilities: ['code'] },
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
