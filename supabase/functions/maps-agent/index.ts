import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
}

const MAPS_TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "places_search",
      description: "Search for places like restaurants, cafes, hotels, etc. near a location or by query.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query like 'coffee shops' or 'restaurants'" },
          location: { type: "string", description: "Location to search near (optional)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "place_details",
      description: "Get detailed information about a specific place including reviews, hours, photos.",
      parameters: {
        type: "object",
        properties: {
          placeId: { type: "string", description: "Google Place ID" },
        },
        required: ["placeId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "geocode",
      description: "Convert a street address to latitude/longitude coordinates.",
      parameters: {
        type: "object",
        properties: {
          address: { type: "string", description: "Street address to geocode" },
        },
        required: ["address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reverse_geocode",
      description: "Convert coordinates to a human-readable address.",
      parameters: {
        type: "object",
        properties: {
          lat: { type: "number", description: "Latitude" },
          lng: { type: "number", description: "Longitude" },
        },
        required: ["lat", "lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "routes",
      description: "Get directions and route between two locations. Supports driving, walking, transit modes.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Starting location" },
          destination: { type: "string", description: "End location" },
          mode: { type: "string", enum: ["driving", "walking", "transit"], description: "Travel mode" },
        },
        required: ["origin", "destination"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "distance_matrix",
      description: "Calculate travel time and distance between multiple origins and destinations.",
      parameters: {
        type: "object",
        properties: {
          origins: { type: "array", items: { type: "string" }, description: "List of origin addresses" },
          destinations: { type: "array", items: { type: "string" }, description: "List of destination addresses" },
          mode: { type: "string", enum: ["driving", "walking", "transit"], description: "Travel mode" },
        },
        required: ["origins", "destinations"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "nearby_search",
      description: "Find places near a specific location by type.",
      parameters: {
        type: "object",
        properties: {
          lat: { type: "number", description: "Latitude" },
          lng: { type: "number", description: "Longitude" },
          type: { type: "string", description: "Place type like 'restaurant', 'cafe', 'hotel'" },
          radius: { type: "number", description: "Search radius in meters (default 5000)" },
        },
        required: ["lat", "lng"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are an expert Google Maps Assistant with full access to Google Maps Platform APIs.
You help users with location-based tasks like:
- Finding places (restaurants, cafes, hotels, etc.)
- Getting directions and routes
- Geocoding addresses to coordinates
- Calculating distances between locations
- Getting detailed place information

ALWAYS use the available tools to provide accurate, real-time information.
Be helpful, concise, and provide actionable results.
Format responses clearly with relevant emojis and bullet points.
If the user's location is needed but not provided, ask for it.`;

async function executeMapsTool(toolName: string, args: Record<string, any>, mapsApiKey: string): Promise<any> {
  console.log(`[MapsAgent] Executing tool: ${toolName}`, args);
  
  const actionMap: Record<string, string> = {
    'places_search': 'search',
    'place_details': 'placeDetails',
    'geocode': 'geocode',
    'reverse_geocode': 'reverseGeocode',
    'routes': 'directions',
    'distance_matrix': 'distanceMatrix',
    'nearby_search': 'nearbySearch',
  };

  const action = actionMap[toolName] || toolName;
  
  // Call google-maps edge function internally
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/google-maps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      action,
      ...args,
      params: args,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Maps API error: ${errorText}`);
  }

  const result = await response.json();
  return result.data || result;
}

function formatToolResult(toolName: string, result: any): string {
  switch (toolName) {
    case 'places_search':
    case 'nearby_search': {
      const places = result.results?.slice(0, 5) || [];
      if (places.length === 0) return 'No places found.';
      
      let formatted = `Found ${result.results?.length || 0} places:\n\n`;
      places.forEach((p: any, i: number) => {
        formatted += `${i + 1}. **${p.name}**\n`;
        formatted += `   📍 ${p.formatted_address || p.vicinity}\n`;
        if (p.rating) formatted += `   ⭐ ${p.rating} (${p.user_ratings_total || 0} reviews)\n`;
        if (p.opening_hours?.open_now !== undefined) {
          formatted += `   🕐 ${p.opening_hours.open_now ? 'Open now' : 'Closed'}\n`;
        }
        formatted += '\n';
      });
      return formatted;
    }
    
    case 'place_details': {
      const place = result.place || result;
      if (!place) return 'Place details not found.';
      
      let formatted = `**${place.name}**\n\n`;
      formatted += `📍 ${place.formatted_address}\n`;
      if (place.rating) formatted += `⭐ ${place.rating} (${place.user_ratings_total} reviews)\n`;
      if (place.formatted_phone_number) formatted += `📞 ${place.formatted_phone_number}\n`;
      if (place.website) formatted += `🌐 ${place.website}\n`;
      if (place.opening_hours?.weekday_text) {
        formatted += `\n🕐 **Hours:**\n`;
        place.opening_hours.weekday_text.forEach((day: string) => {
          formatted += `   ${day}\n`;
        });
      }
      return formatted;
    }
    
    case 'geocode': {
      if (result.location) {
        return `📍 **${result.formattedAddress}**\n🌐 Coordinates: ${result.location.lat}, ${result.location.lng}`;
      }
      return 'Could not geocode the address.';
    }
    
    case 'reverse_geocode': {
      if (result.formattedAddress) {
        return `📍 **Address:** ${result.formattedAddress}`;
      }
      return 'Could not find address for these coordinates.';
    }
    
    case 'routes': {
      if (result.routes?.[0]?.legs?.[0]) {
        const leg = result.routes[0].legs[0];
        let formatted = `**Route Found**\n\n`;
        formatted += `📏 **Distance:** ${leg.distance.text}\n`;
        formatted += `⏱️ **Duration:** ${leg.duration.text}\n\n`;
        formatted += `**Steps:**\n`;
        leg.steps.slice(0, 7).forEach((step: any, i: number) => {
          const instruction = step.html_instructions.replace(/<[^>]*>/g, '');
          formatted += `${i + 1}. ${instruction} (${step.distance.text})\n`;
        });
        if (leg.steps.length > 7) {
          formatted += `... and ${leg.steps.length - 7} more steps\n`;
        }
        return formatted;
      }
      return 'Could not find a route.';
    }
    
    case 'distance_matrix': {
      if (result.rows?.[0]?.elements?.[0]) {
        const element = result.rows[0].elements[0];
        if (element.status === 'OK') {
          return `📏 **Distance:** ${element.distance.text}\n⏱️ **Duration:** ${element.duration.text}`;
        }
      }
      return 'Could not calculate distance.';
    }
    
    default:
      return JSON.stringify(result, null, 2);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = false } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured. Please contact administrator.');
    }

    console.log('[MapsAgent] Processing request with', messages.length, 'messages');

    // Initial LLM call with tools
    const llmResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools: MAPS_TOOLS,
        tool_choice: 'auto',
      }),
    });

    if (!llmResponse.ok) {
      if (llmResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (llmResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await llmResponse.text();
      console.error('[MapsAgent] LLM error:', errorText);
      throw new Error('AI service error');
    }

    const llmData = await llmResponse.json();
    const choice = llmData.choices?.[0];
    
    if (!choice) {
      throw new Error('No response from AI');
    }

    const assistantMessage = choice.message;
    const toolCalls = assistantMessage.tool_calls;

    // If no tool calls, return the direct response
    if (!toolCalls || toolCalls.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          content: assistantMessage.content,
          toolCalls: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute tool calls
    const toolResults: any[] = [];
    
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      let args: Record<string, any>;
      
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }
      
      try {
        const result = await executeMapsTool(toolName, args, GOOGLE_MAPS_API_KEY);
        const formattedResult = formatToolResult(toolName, result);
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolName,
          content: formattedResult,
          rawData: result,
        });
      } catch (error) {
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolName,
          content: `Error: ${(error as Error).message}`,
        });
      }
    }

    // Second LLM call with tool results
    const finalMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
      assistantMessage,
      ...toolResults.map(tr => ({
        role: 'tool' as const,
        tool_call_id: tr.tool_call_id,
        content: tr.content,
      })),
    ];

    const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: finalMessages,
      }),
    });

    if (!finalResponse.ok) {
      const errorText = await finalResponse.text();
      console.error('[MapsAgent] Final LLM error:', errorText);
      
      // Return tool results if final call fails
      return new Response(
        JSON.stringify({
          success: true,
          content: toolResults.map(tr => tr.content).join('\n\n'),
          toolCalls: toolCalls.map((tc: any, i: number) => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments || '{}'),
            result: toolResults[i]?.rawData,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const finalData = await finalResponse.json();
    const finalContent = finalData.choices?.[0]?.message?.content || '';

    console.log('[MapsAgent] Request completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        content: finalContent,
        toolCalls: toolCalls.map((tc: any, i: number) => ({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments || '{}'),
          result: toolResults[i]?.rawData,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MapsAgent] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
