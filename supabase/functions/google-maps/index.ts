import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapsRequest {
  action: 'geocode' | 'directions' | 'places' | 'getApiKey';
  userId: string;
  params?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, userId, params }: MapsRequest = await req.json();
    
    console.log(`Google Maps action: ${action} for user: ${userId}`);
    
    // Get user's Google Maps API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.api_keys) {
      throw new Error('Google Maps API key not found. Please configure it in settings.');
    }

    const apiKeys = settings.api_keys as Record<string, string>;
    const mapsApiKey = apiKeys.google_maps_api_key;

    if (!mapsApiKey) {
      throw new Error('Google Maps API key is not configured.');
    }

    let result: any;

    switch (action) {
      case 'getApiKey':
        // Return the API key for client-side map rendering
        result = { apiKey: mapsApiKey };
        break;

      case 'geocode': {
        const address = params?.address;
        if (!address) throw new Error('Address is required for geocoding');
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${mapsApiKey}`
        );
        result = await response.json();
        break;
      }

      case 'directions': {
        const { origin, destination, mode = 'driving' } = params || {};
        if (!origin || !destination) {
          throw new Error('Origin and destination are required for directions');
        }
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${mapsApiKey}`
        );
        result = await response.json();
        break;
      }

      case 'places': {
        const { query, location, radius = 5000 } = params || {};
        if (!query) throw new Error('Query is required for places search');
        
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${mapsApiKey}`;
        if (location) {
          url += `&location=${location}&radius=${radius}`;
        }
        
        const response = await fetch(url);
        result = await response.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Google Maps ${action} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Google Maps error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
