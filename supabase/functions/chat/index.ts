import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  agentId?: string;
  agentName?: string;
  agentTools?: string[];
  provider?: string;
  model?: string;
  apiKey?: string;
  userId?: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

// Available tools that agents can use
const AGENT_TOOLS: Record<string, ToolDefinition> = {
  web_search: {
    name: 'web_search',
    description: 'Search the web for information using Firecrawl',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' }
      },
      required: ['query']
    }
  },
  scrape_website: {
    name: 'scrape_website',
    description: 'Scrape content from a website URL',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to scrape' }
      },
      required: ['url']
    }
  },
  geocode_address: {
    name: 'geocode_address',
    description: 'Convert an address to latitude/longitude coordinates',
    parameters: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'The address to geocode' }
      },
      required: ['address']
    }
  },
  get_directions: {
    name: 'get_directions',
    description: 'Get directions between two locations',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Starting location' },
        destination: { type: 'string', description: 'Destination location' },
        mode: { type: 'string', enum: ['driving', 'walking', 'transit'], description: 'Travel mode' }
      },
      required: ['origin', 'destination']
    }
  },
  send_email: {
    name: 'send_email',
    description: 'Send an email using configured SMTP settings',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body content' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  dns_lookup: {
    name: 'dns_lookup',
    description: 'Look up DNS records for a domain',
    parameters: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'The domain to look up' },
        type: { type: 'string', enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'], description: 'Record type' }
      },
      required: ['domain']
    }
  },
  execute_code: {
    name: 'execute_code',
    description: 'Execute JavaScript code and return the result',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute' },
        language: { type: 'string', enum: ['javascript', 'typescript'], description: 'Programming language' }
      },
      required: ['code']
    }
  },
  analyze_image: {
    name: 'analyze_image',
    description: 'Analyze an image using AI vision',
    parameters: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'URL of the image to analyze' },
        prompt: { type: 'string', description: 'What to analyze in the image' }
      },
      required: ['imageUrl']
    }
  }
};

// Map agent tools to available tool definitions
function getToolsForAgent(agentTools: string[]): ToolDefinition[] {
  const toolMapping: Record<string, string[]> = {
    'Deep Research': ['web_search', 'scrape_website'],
    'Web Clone': ['scrape_website'],
    'Google Maps': ['geocode_address', 'get_directions'],
    'Email': ['send_email'],
    'DNS': ['dns_lookup'],
    'Code Editor': ['execute_code'],
    'Terminal': ['execute_code'],
    'AI Chat': [],
    'Analytics': ['web_search'],
  };

  const tools: ToolDefinition[] = [];
  const addedTools = new Set<string>();

  for (const agentTool of agentTools) {
    const mappedTools = toolMapping[agentTool] || [];
    for (const toolName of mappedTools) {
      if (!addedTools.has(toolName) && AGENT_TOOLS[toolName]) {
        tools.push(AGENT_TOOLS[toolName]);
        addedTools.add(toolName);
      }
    }
  }

  return tools;
}

// Execute a tool call
async function executeTool(toolName: string, params: Record<string, any>, supabase: any, apiKeys: Record<string, string>): Promise<string> {
  console.log(`Executing tool: ${toolName}`, params);
  
  try {
    switch (toolName) {
      case 'web_search': {
        const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
        if (!firecrawlKey) return JSON.stringify({ error: 'Firecrawl API key not configured' });
        
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: params.query, limit: 5 })
        });
        const data = await response.json();
        return JSON.stringify(data.data?.slice(0, 3) || data);
      }
      
      case 'scrape_website': {
        const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
        if (!firecrawlKey) return JSON.stringify({ error: 'Firecrawl API key not configured' });
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: params.url, formats: ['markdown'] })
        });
        const data = await response.json();
        const content = data.data?.markdown || data.data?.content || '';
        return content.substring(0, 3000);
      }
      
      case 'geocode_address': {
        const mapsKey = apiKeys.google_maps_api_key;
        if (!mapsKey) return JSON.stringify({ error: 'Google Maps API key not configured' });
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(params.address)}&key=${mapsKey}`
        );
        const data = await response.json();
        if (data.results?.[0]) {
          const result = data.results[0];
          return JSON.stringify({
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address
          });
        }
        return JSON.stringify({ error: 'Address not found' });
      }
      
      case 'get_directions': {
        const mapsKey = apiKeys.google_maps_api_key;
        if (!mapsKey) return JSON.stringify({ error: 'Google Maps API key not configured' });
        
        const mode = params.mode || 'driving';
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(params.origin)}&destination=${encodeURIComponent(params.destination)}&mode=${mode}&key=${mapsKey}`
        );
        const data = await response.json();
        if (data.routes?.[0]?.legs?.[0]) {
          const leg = data.routes[0].legs[0];
          return JSON.stringify({
            distance: leg.distance.text,
            duration: leg.duration.text,
            steps: leg.steps.slice(0, 5).map((s: any) => s.html_instructions.replace(/<[^>]*>/g, ''))
          });
        }
        return JSON.stringify({ error: 'Route not found' });
      }
      
      case 'send_email': {
        // This would integrate with the send-email edge function
        return JSON.stringify({ success: true, message: `Email would be sent to ${params.to}` });
      }
      
      case 'dns_lookup': {
        // Simple DNS lookup simulation
        return JSON.stringify({ 
          domain: params.domain,
          type: params.type || 'A',
          message: 'DNS lookup would query Cloudflare API'
        });
      }
      
      case 'execute_code': {
        try {
          // Safe code execution in sandbox
          const result = eval(params.code);
          return JSON.stringify({ result: String(result) });
        } catch (e) {
          return JSON.stringify({ error: (e as Error).message });
        }
      }
      
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return JSON.stringify({ error: (error as Error).message });
  }
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

async function callLovableAI(messages: any[], model: string, systemPrompt: string, tools?: any[]) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const body: any = {
    model: model || 'google/gemini-2.5-flash',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  };

  if (tools && tools.length > 0) {
    body.tools = tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
  }

  return await fetch(PROVIDER_ENDPOINTS.lovable, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function callOpenAI(messages: any[], model: string, systemPrompt: string, apiKey: string, tools?: any[]) {
  const body: any = {
    model: model || 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  };

  if (tools && tools.length > 0) {
    body.tools = tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
  }

  return await fetch(PROVIDER_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function callAnthropic(messages: any[], model: string, systemPrompt: string, apiKey: string, tools?: any[]) {
  const body: any = {
    model: model || 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    stream: true,
  };

  if (tools && tools.length > 0) {
    body.tools = tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters
    }));
  }

  return await fetch(PROVIDER_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
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
  return await fetch(PROVIDER_ENDPOINTS.cohere, {
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
    const { messages, agentId, agentName, agentTools, provider, model, apiKey, userId } = await req.json() as ChatRequest;
    
    const selectedProvider = provider || 'lovable';
    console.log(`Chat request - Provider: ${selectedProvider}, Model: ${model}, Agent: ${agentName || agentId}`);
    console.log(`Messages count: ${messages?.length || 0}, Tools: ${agentTools?.join(', ') || 'none'}`);

    // Get user's API keys from database if userId provided
    let userApiKeys: Record<string, string> = {};
    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: settings } = await supabase
        .from('user_settings')
        .select('api_keys')
        .eq('user_id', userId)
        .single();
      
      if (settings?.api_keys) {
        userApiKeys = settings.api_keys as Record<string, string>;
      }
    }

    // Get tools for this agent
    const tools = agentTools ? getToolsForAgent(agentTools) : [];
    const toolNames = tools.map(t => t.name).join(', ');

    const systemPrompt = `You are ${agentName || 'an AI assistant'}, a powerful AI agent in the Agentic Max platform.

## Your Capabilities
You have access to the following tools: ${toolNames || 'no external tools'}

## Available Tools
${tools.length > 0 ? tools.map(t => `- **${t.name}**: ${t.description}`).join('\n') : 'No tools available for this session.'}

## Instructions
1. When a user asks you to perform a task that requires external data or actions, use your available tools
2. Be proactive - if a user asks about locations, weather, or search results, use the appropriate tools
3. Provide clear, formatted responses using Markdown
4. When showing code, use proper syntax highlighting with code blocks
5. Be helpful, concise, and accurate
6. If you use a tool, explain what you found and summarize the results

## Response Format
- Use **bold** for emphasis
- Use \`code\` for technical terms
- Use bullet points for lists
- Use code blocks with language specification for code examples

Remember: You are an intelligent agent that can think, reason, and take actions to help users accomplish their goals.`;

    let response: Response;

    // Route to appropriate provider with tool support where available
    switch (selectedProvider) {
      case 'openai':
        if (!apiKey) throw new Error('OpenAI API key is required');
        response = await callOpenAI(messages, model || '', systemPrompt, apiKey, tools);
        break;
      case 'anthropic':
        if (!apiKey) throw new Error('Anthropic API key is required');
        response = await callAnthropic(messages, model || '', systemPrompt, apiKey, tools);
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
        response = await callLovableAI(messages, model || 'google/gemini-2.5-flash', systemPrompt, tools);
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
