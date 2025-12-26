import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  agentId?: string;
  agentName?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
}

// Provider API endpoints
const PROVIDER_ENDPOINTS: Record<string, string> = {
  lovable: 'https://ai.gateway.lovable.dev/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  together: 'https://api.together.xyz/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  cohere: 'https://api.cohere.ai/v1/chat',
};

async function callLovableAI(messages: any[], model: string, systemPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  return await fetch(PROVIDER_ENDPOINTS.lovable, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'google/gemini-2.5-flash',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callOpenAI(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  return await fetch(PROVIDER_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callAnthropic(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  const response = await fetch(PROVIDER_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      stream: true,
    }),
  });
  return response;
}

async function callGroq(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  return await fetch(PROVIDER_ENDPOINTS.groq, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callMistral(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  return await fetch(PROVIDER_ENDPOINTS.mistral, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'mistral-small-latest',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callTogether(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  return await fetch(PROVIDER_ENDPOINTS.together, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callOpenRouter(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  return await fetch(PROVIDER_ENDPOINTS.openrouter, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://agentic-max.lovable.app',
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callPerplexity(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  return await fetch(PROVIDER_ENDPOINTS.perplexity, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'sonar',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callCohere(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  const response = await fetch(PROVIDER_ENDPOINTS.cohere, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'command-r',
      preamble: systemPrompt,
      message: messages[messages.length - 1]?.content || '',
      chat_history: messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'USER' : 'CHATBOT',
        message: m.content,
      })),
      stream: true,
    }),
  });
  return response;
}

async function callGoogle(messages: any[], model: string, systemPrompt: string, apiKey: string) {
  const modelId = model || 'gemini-2.0-flash';
  const url = `${PROVIDER_ENDPOINTS.google}/${modelId}:streamGenerateContent?key=${apiKey}&alt=sse`;
  
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  return await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
    }),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agentId, agentName, provider, model, apiKey } = await req.json() as ChatRequest;
    
    const selectedProvider = provider || 'lovable';
    console.log(`Chat request - Provider: ${selectedProvider}, Model: ${model}, Agent: ${agentName || agentId}`);
    console.log(`Messages count: ${messages?.length || 0}`);

    const systemPrompt = `You are ${agentName || 'an AI assistant'}, a powerful AI agent in the Agentic Max platform. You help users with various tasks including:
- Web development and code generation
- API integrations and automation
- Website cloning and analysis
- App building and testing
- Deep research and strategic thinking

Be helpful, concise, and proactive. When discussing technical topics, provide working code examples.
Format your responses with markdown for better readability.`;

    let response: Response;

    // Route to appropriate provider
    switch (selectedProvider) {
      case 'openai':
        if (!apiKey) throw new Error('OpenAI API key is required');
        response = await callOpenAI(messages, model || '', systemPrompt, apiKey);
        break;
      case 'anthropic':
        if (!apiKey) throw new Error('Anthropic API key is required');
        response = await callAnthropic(messages, model || '', systemPrompt, apiKey);
        break;
      case 'google':
        if (!apiKey) throw new Error('Google AI API key is required');
        response = await callGoogle(messages, model || '', systemPrompt, apiKey);
        break;
      case 'groq':
        if (!apiKey) throw new Error('Groq API key is required');
        response = await callGroq(messages, model || '', systemPrompt, apiKey);
        break;
      case 'mistral':
        if (!apiKey) throw new Error('Mistral API key is required');
        response = await callMistral(messages, model || '', systemPrompt, apiKey);
        break;
      case 'together':
        if (!apiKey) throw new Error('Together AI API key is required');
        response = await callTogether(messages, model || '', systemPrompt, apiKey);
        break;
      case 'openrouter':
        if (!apiKey) throw new Error('OpenRouter API key is required');
        response = await callOpenRouter(messages, model || '', systemPrompt, apiKey);
        break;
      case 'perplexity':
        if (!apiKey) throw new Error('Perplexity API key is required');
        response = await callPerplexity(messages, model || '', systemPrompt, apiKey);
        break;
      case 'cohere':
        if (!apiKey) throw new Error('Cohere API key is required');
        response = await callCohere(messages, model || '', systemPrompt, apiKey);
        break;
      case 'lovable':
      default:
        response = await callLovableAI(messages, model || 'google/gemini-2.5-flash', systemPrompt);
        break;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${selectedProvider} API error:`, response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: 'Invalid API key. Please check your settings.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: `AI service error: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Streaming response started');
    
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
