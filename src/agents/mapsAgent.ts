// Google Maps Agent Engine with ReAct Loop
import { supabase } from '@/integrations/supabase/client';

export interface MapsAgentTool {
  name: string;
  description: string;
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface MapsAgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  result: any;
}

export interface ReActStep {
  type: 'think' | 'act' | 'observe' | 'answer';
  content: string;
  toolCall?: ToolCall;
  toolResult?: any;
}

export interface MapsAgentConfig {
  apiKey: string;
  userId: string;
  maxIterations?: number;
  verbose?: boolean;
}

export class GoogleMapsAgent {
  private config: MapsAgentConfig;
  private conversationHistory: MapsAgentMessage[] = [];
  private tools: Map<string, MapsAgentTool> = new Map();

  constructor(config: MapsAgentConfig) {
    this.config = {
      maxIterations: 5,
      verbose: true,
      ...config,
    };
    this.initializeTools();
  }

  private initializeTools() {
    // Places Search Tool
    this.tools.set('places_search', {
      name: 'places_search',
      description: 'Search for places near a location. Use for finding restaurants, cafes, hotels, etc.',
      execute: async (params) => {
        const { data, error } = await supabase.functions.invoke('google-maps', {
          body: {
            action: 'search',
            apiKey: this.config.apiKey,
            query: params.query,
            location: params.location,
          },
        });
        if (error) throw error;
        return data?.data || data;
      },
    });

    // Place Details Tool
    this.tools.set('place_details', {
      name: 'place_details',
      description: 'Get detailed information about a specific place including reviews, hours, photos.',
      execute: async (params) => {
        const { data, error } = await supabase.functions.invoke('google-maps', {
          body: {
            action: 'placeDetails',
            apiKey: this.config.apiKey,
            placeId: params.placeId,
          },
        });
        if (error) throw error;
        return data?.data || data;
      },
    });

    // Geocode Tool
    this.tools.set('geocode', {
      name: 'geocode',
      description: 'Convert a street address to latitude/longitude coordinates.',
      execute: async (params) => {
        const { data, error } = await supabase.functions.invoke('google-maps', {
          body: {
            action: 'geocode',
            apiKey: this.config.apiKey,
            address: params.address,
          },
        });
        if (error) throw error;
        return data?.data || data;
      },
    });

    // Reverse Geocode Tool
    this.tools.set('reverse_geocode', {
      name: 'reverse_geocode',
      description: 'Convert coordinates to a human-readable address.',
      execute: async (params) => {
        const { data, error } = await supabase.functions.invoke('google-maps', {
          body: {
            action: 'reverseGeocode',
            apiKey: this.config.apiKey,
            lat: params.lat,
            lng: params.lng,
          },
        });
        if (error) throw error;
        return data?.data || data;
      },
    });

    // Directions Tool
    this.tools.set('routes', {
      name: 'routes',
      description: 'Get directions and route between two locations. Supports driving, walking, transit modes.',
      execute: async (params) => {
        const { data, error } = await supabase.functions.invoke('google-maps', {
          body: {
            action: 'directions',
            apiKey: this.config.apiKey,
            params: {
              origin: params.origin,
              destination: params.destination,
              mode: params.mode || 'driving',
            },
          },
        });
        if (error) throw error;
        return data?.data || data;
      },
    });

    // Distance Matrix Tool
    this.tools.set('distance_matrix', {
      name: 'distance_matrix',
      description: 'Calculate travel time and distance between multiple origins and destinations.',
      execute: async (params) => {
        const { data, error } = await supabase.functions.invoke('google-maps', {
          body: {
            action: 'distanceMatrix',
            apiKey: this.config.apiKey,
            params: {
              origins: params.origins,
              destinations: params.destinations,
              mode: params.mode || 'driving',
            },
          },
        });
        if (error) throw error;
        return data?.data || data;
      },
    });
  }

  getToolDefinitions() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
    }));
  }

  async executeTool(name: string, params: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    if (this.config.verbose) {
      console.log(`[MapsAgent] Executing tool: ${name}`, params);
    }
    
    try {
      const result = await tool.execute(params);
      if (this.config.verbose) {
        console.log(`[MapsAgent] Tool result:`, result);
      }
      return result;
    } catch (error) {
      console.error(`[MapsAgent] Tool error:`, error);
      throw error;
    }
  }

  async processUserRequest(userMessage: string): Promise<AsyncGenerator<ReActStep>> {
    this.conversationHistory.push({ role: 'user', content: userMessage });
    return this.runReActLoop(userMessage);
  }

  private async *runReActLoop(userMessage: string): AsyncGenerator<ReActStep> {
    const maxIterations = this.config.maxIterations || 5;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      iteration++;
      
      // THINK: Analyze what to do
      const thinkStep: ReActStep = {
        type: 'think',
        content: `Analyzing request: "${userMessage}". Determining best approach...`,
      };
      yield thinkStep;
      
      // Determine action based on user message
      const action = this.determineAction(userMessage);
      
      if (action.tool) {
        // ACT: Execute the tool
        const actStep: ReActStep = {
          type: 'act',
          content: `Calling ${action.tool} with parameters`,
          toolCall: {
            id: `call_${Date.now()}`,
            name: action.tool,
            arguments: action.params,
          },
        };
        yield actStep;
        
        try {
          const result = await this.executeTool(action.tool, action.params);
          
          // OBSERVE: Analyze results
          const observeStep: ReActStep = {
            type: 'observe',
            content: `Received results from ${action.tool}`,
            toolResult: result,
          };
          yield observeStep;
          
          // ANSWER: Provide final response
          const answerStep: ReActStep = {
            type: 'answer',
            content: this.formatResponse(action.tool, result),
          };
          yield answerStep;
          
          return;
        } catch (error) {
          const errorStep: ReActStep = {
            type: 'answer',
            content: `Error executing ${action.tool}: ${(error as Error).message}`,
          };
          yield errorStep;
          return;
        }
      } else {
        // No tool needed, provide direct answer
        const answerStep: ReActStep = {
          type: 'answer',
          content: action.response || 'I can help you with Google Maps tasks like finding places, getting directions, geocoding addresses, and more. What would you like to do?',
        };
        yield answerStep;
        return;
      }
    }
  }

  private determineAction(message: string): { tool?: string; params?: any; response?: string } {
    const lowerMessage = message.toLowerCase();
    
    // Places search patterns
    if (lowerMessage.includes('find') || lowerMessage.includes('search') || 
        lowerMessage.includes('where') || lowerMessage.includes('near')) {
      const query = message.replace(/find|search|where|near|me/gi, '').trim();
      return {
        tool: 'places_search',
        params: { query: query || message },
      };
    }
    
    // Directions patterns
    if (lowerMessage.includes('direction') || lowerMessage.includes('route') ||
        lowerMessage.includes('how to get') || lowerMessage.includes('navigate')) {
      const parts = message.split(/to|from/i);
      if (parts.length >= 2) {
        return {
          tool: 'routes',
          params: {
            origin: parts[0].replace(/direction|route|how to get|navigate/gi, '').trim(),
            destination: parts[1].trim(),
            mode: lowerMessage.includes('walk') ? 'walking' : 
                  lowerMessage.includes('transit') ? 'transit' : 'driving',
          },
        };
      }
    }
    
    // Geocoding patterns
    if (lowerMessage.includes('coordinates') || lowerMessage.includes('geocode') ||
        lowerMessage.includes('lat') || lowerMessage.includes('lng')) {
      if (lowerMessage.includes('address') && (lowerMessage.includes('what') || lowerMessage.includes('reverse'))) {
        // Reverse geocoding - extract coordinates
        const coordMatch = message.match(/([-]?\d+\.?\d*)[,\s]+([-]?\d+\.?\d*)/);
        if (coordMatch) {
          return {
            tool: 'reverse_geocode',
            params: { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) },
          };
        }
      } else {
        // Forward geocoding
        const address = message.replace(/coordinates|geocode|lat|lng|of|for|get/gi, '').trim();
        return {
          tool: 'geocode',
          params: { address },
        };
      }
    }
    
    // Distance matrix patterns
    if (lowerMessage.includes('distance') || lowerMessage.includes('how far')) {
      const parts = message.split(/to|from|between/i);
      if (parts.length >= 2) {
        return {
          tool: 'distance_matrix',
          params: {
            origins: [parts[0].replace(/distance|how far/gi, '').trim()],
            destinations: [parts[1].trim()],
          },
        };
      }
    }
    
    // Default response
    return {
      response: `I understand you want to: "${message}". I can help you with:
• **Finding places** - restaurants, cafes, hotels near you
• **Getting directions** - routes between locations
• **Geocoding** - convert addresses to coordinates
• **Distance calculation** - how far between points

Please be more specific about what you'd like to do.`,
    };
  }

  private formatResponse(tool: string, result: any): string {
    switch (tool) {
      case 'places_search': {
        const places = result.results?.slice(0, 5) || [];
        if (places.length === 0) return 'No places found for your search.';
        
        let response = `Found ${places.length} places:\n\n`;
        places.forEach((p: any, i: number) => {
          response += `**${i + 1}. ${p.name}**\n`;
          response += `📍 ${p.formatted_address || p.vicinity}\n`;
          if (p.rating) response += `⭐ ${p.rating} rating\n`;
          response += '\n';
        });
        return response;
      }
      
      case 'geocode': {
        if (result.location) {
          return `**Geocoding Result**\n\n📍 **Address:** ${result.formattedAddress}\n🌐 **Coordinates:** ${result.location.lat}, ${result.location.lng}`;
        }
        return 'Could not geocode the address.';
      }
      
      case 'reverse_geocode': {
        if (result.formattedAddress) {
          return `**Reverse Geocoding Result**\n\n📍 **Address:** ${result.formattedAddress}`;
        }
        return 'Could not find address for these coordinates.';
      }
      
      case 'routes': {
        if (result.routes?.[0]?.legs?.[0]) {
          const leg = result.routes[0].legs[0];
          let response = `**Directions Found**\n\n`;
          response += `📏 **Distance:** ${leg.distance.text}\n`;
          response += `⏱️ **Duration:** ${leg.duration.text}\n\n`;
          response += `**Steps:**\n`;
          leg.steps.slice(0, 5).forEach((step: any, i: number) => {
            response += `${i + 1}. ${step.html_instructions.replace(/<[^>]*>/g, '')}\n`;
          });
          return response;
        }
        return 'Could not find a route.';
      }
      
      case 'distance_matrix': {
        if (result.rows?.[0]?.elements?.[0]) {
          const element = result.rows[0].elements[0];
          if (element.status === 'OK') {
            return `**Distance:** ${element.distance.text}\n**Duration:** ${element.duration.text}`;
          }
        }
        return 'Could not calculate distance.';
      }
      
      default:
        return JSON.stringify(result, null, 2);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// Hook for using the Maps Agent
export function createMapsAgent(config: MapsAgentConfig): GoogleMapsAgent {
  return new GoogleMapsAgent(config);
}
