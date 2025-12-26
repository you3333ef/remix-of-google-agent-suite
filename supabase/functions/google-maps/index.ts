import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapsRequest {
  action: 'geocode' | 'reverseGeocode' | 'directions' | 'places' | 'search' | 'getApiKey';
  apiKey?: string;
  userId?: string;
  query?: string;
  location?: { lat: number; lng: number };
  address?: string;
  lat?: number;
  lng?: number;
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

    const requestData: MapsRequest = await req.json();
    const { action, apiKey, userId, query, location, address, lat, lng, params } = requestData;
    
    console.log(`Google Maps action: ${action}`);
    
    // Get API key either from request or from user settings
    let mapsApiKey = apiKey;
    
    if (!mapsApiKey && userId) {
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('api_keys')
        .eq('user_id', userId)
        .single();

      if (!settingsError && settings?.api_keys) {
        const apiKeys = settings.api_keys as Record<string, string>;
        mapsApiKey = apiKeys.google_maps_api_key;
      }
    }

    if (!mapsApiKey) {
      throw new Error('Google Maps API key not found. Please configure it in settings.');
    }

    let result: any;

    switch (action) {
      case 'getApiKey':
        result = { apiKey: mapsApiKey };
        break;

      case 'geocode': {
        const addr = address || params?.address;
        if (!addr) throw new Error('Address is required for geocoding');
        
        console.log(`Geocoding address: ${addr}`);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${mapsApiKey}`
        );
        const geocodeResult = await response.json();
        
        if (geocodeResult.status === 'OK' && geocodeResult.results.length > 0) {
          const firstResult = geocodeResult.results[0];
          result = {
            success: true,
            location: firstResult.geometry.location,
            formattedAddress: firstResult.formatted_address,
            placeId: firstResult.place_id,
            addressComponents: firstResult.address_components,
            allResults: geocodeResult.results
          };
        } else {
          result = {
            success: false,
            error: geocodeResult.status,
            message: geocodeResult.error_message || 'No results found'
          };
        }
        break;
      }

      case 'reverseGeocode': {
        const latitude = lat || params?.lat;
        const longitude = lng || params?.lng;
        
        if (latitude === undefined || longitude === undefined) {
          throw new Error('Latitude and longitude are required for reverse geocoding');
        }
        
        console.log(`Reverse geocoding: ${latitude}, ${longitude}`);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${mapsApiKey}`
        );
        const reverseResult = await response.json();
        
        if (reverseResult.status === 'OK' && reverseResult.results.length > 0) {
          const firstResult = reverseResult.results[0];
          result = {
            success: true,
            formattedAddress: firstResult.formatted_address,
            placeId: firstResult.place_id,
            addressComponents: firstResult.address_components,
            allResults: reverseResult.results
          };
        } else {
          result = {
            success: false,
            error: reverseResult.status,
            message: reverseResult.error_message || 'No results found'
          };
        }
        break;
      }

      case 'search': {
        const searchQuery = query || params?.query;
        if (!searchQuery) throw new Error('Query is required for search');
        
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${mapsApiKey}`;
        if (location) {
          url += `&location=${location.lat},${location.lng}&radius=5000`;
        }
        
        console.log(`Searching places: ${searchQuery}`);
        const response = await fetch(url);
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
        const { query: placesQuery, location: placesLocation, radius = 5000 } = params || {};
        if (!placesQuery) throw new Error('Query is required for places search');
        
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placesQuery)}&key=${mapsApiKey}`;
        if (placesLocation) {
          url += `&location=${placesLocation}&radius=${radius}`;
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
