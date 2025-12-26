import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapsRequest {
  action: 'geocode' | 'reverseGeocode' | 'directions' | 'places' | 'search' | 'checkAuth' | 'placeDetails' | 'distanceMatrix' | 'nearbySearch' | 'autocomplete';
  userId?: string;
  query?: string;
  location?: { lat: number; lng: number };
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  params?: Record<string, any>;
}

interface TokenData {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
}

// Google OAuth token refresh
async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret || !refreshToken) {
    console.error('[GoogleMaps] Missing OAuth credentials for token refresh');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleMaps] Token refresh failed:', errorText);
      return null;
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
    };
  } catch (error) {
    console.error('[GoogleMaps] Token refresh error:', error);
    return null;
  }
}

// Get valid OAuth token for user
async function getValidAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: tokenData, error } = await supabase
    .from('user_google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    console.error('[GoogleMaps] No tokens found for user:', userId);
    return null;
  }

  const { access_token, refresh_token, expires_at } = tokenData as TokenData;

  // Check if token is expired (with 5 min buffer)
  const isExpired = expires_at && new Date(expires_at).getTime() < Date.now() + 5 * 60 * 1000;

  if (!isExpired) {
    return access_token;
  }

  // Token expired, try to refresh
  if (!refresh_token) {
    console.error('[GoogleMaps] Token expired and no refresh token available');
    return null;
  }

  console.log('[GoogleMaps] Token expired, refreshing...');
  const newTokens = await refreshGoogleToken(refresh_token);

  if (!newTokens) {
    return null;
  }

  // Update tokens in database
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
  
  await supabase
    .from('user_google_tokens')
    .update({
      access_token: newTokens.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  console.log('[GoogleMaps] Token refreshed successfully');
  return newTokens.access_token;
}

// Make authenticated request to Google Maps API
async function makeGoogleMapsRequest(url: string, accessToken: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
  }

  return response.json();
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if it's a user JWT (not service role)
      if (token !== supabaseKey) {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      }
    }

    const requestData: MapsRequest = await req.json();
    const { action, userId: bodyUserId, query, location, address, lat, lng, placeId, params } = requestData;
    
    // Use userId from body if not in header
    userId = userId || bodyUserId || null;
    
    console.log(`[GoogleMaps] Action: ${action}, User: ${userId}`);

    // Check auth status - no API key needed, just OAuth
    if (action === 'checkAuth') {
      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, authenticated: false, message: 'Not authenticated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getValidAccessToken(supabase, userId);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          authenticated: !!accessToken,
          message: accessToken ? 'OAuth ready' : 'OAuth token not available'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For all other actions, require valid OAuth token
    if (!userId) {
      throw new Error('User authentication required. Please sign in with Google.');
    }

    const accessToken = await getValidAccessToken(supabase, userId);
    
    if (!accessToken) {
      throw new Error('Google OAuth token not available. Please re-authenticate with Google.');
    }

    let result: any;

    switch (action) {
      case 'geocode': {
        const addr = address || params?.address;
        if (!addr) throw new Error('Address is required for geocoding');
        
        console.log(`[GoogleMaps] Geocoding: ${addr}`);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}`;
        const geocodeResult = await makeGoogleMapsRequest(url, accessToken);
        
        if (geocodeResult.status === 'OK' && geocodeResult.results.length > 0) {
          const firstResult = geocodeResult.results[0];
          result = {
            success: true,
            location: firstResult.geometry.location,
            formattedAddress: firstResult.formatted_address,
            placeId: firstResult.place_id,
            addressComponents: firstResult.address_components,
            locationType: firstResult.geometry.location_type,
            viewport: firstResult.geometry.viewport,
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
        const latitude = lat ?? params?.lat;
        const longitude = lng ?? params?.lng;
        
        if (latitude === undefined || longitude === undefined) {
          throw new Error('Latitude and longitude are required for reverse geocoding');
        }
        
        console.log(`[GoogleMaps] Reverse geocoding: ${latitude}, ${longitude}`);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}`;
        const reverseResult = await makeGoogleMapsRequest(url, accessToken);
        
        if (reverseResult.status === 'OK' && reverseResult.results.length > 0) {
          const firstResult = reverseResult.results[0];
          result = {
            success: true,
            formattedAddress: firstResult.formatted_address,
            placeId: firstResult.place_id,
            addressComponents: firstResult.address_components,
            plusCode: reverseResult.plus_code,
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
        
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}`;
        if (location) {
          url += `&location=${location.lat},${location.lng}&radius=${params?.radius || 5000}`;
        }
        if (params?.type) {
          url += `&type=${params.type}`;
        }
        if (params?.openNow) {
          url += '&opennow=true';
        }
        if (params?.minPrice !== undefined) {
          url += `&minprice=${params.minPrice}`;
        }
        if (params?.maxPrice !== undefined) {
          url += `&maxprice=${params.maxPrice}`;
        }
        
        console.log(`[GoogleMaps] Text search: ${searchQuery}`);
        result = await makeGoogleMapsRequest(url, accessToken);
        break;
      }

      case 'nearbySearch': {
        const { lat: nlat, lng: nlng, radius = 5000, type, keyword } = params || {};
        if (!nlat || !nlng) throw new Error('Location is required for nearby search');
        
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${nlat},${nlng}&radius=${radius}`;
        if (type) url += `&type=${type}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        
        console.log(`[GoogleMaps] Nearby search at: ${nlat}, ${nlng}`);
        result = await makeGoogleMapsRequest(url, accessToken);
        break;
      }

      case 'placeDetails': {
        const pId = placeId || params?.placeId;
        if (!pId) throw new Error('Place ID is required for place details');
        
        const fields = params?.fields || 'name,formatted_address,geometry,rating,user_ratings_total,opening_hours,photos,reviews,price_level,website,formatted_phone_number,types';
        
        console.log(`[GoogleMaps] Place details: ${pId}`);
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pId}&fields=${fields}`;
        const detailsResult = await makeGoogleMapsRequest(url, accessToken);
        
        if (detailsResult.status === 'OK') {
          result = {
            success: true,
            place: detailsResult.result,
            htmlAttributions: detailsResult.html_attributions
          };
        } else {
          result = {
            success: false,
            error: detailsResult.status,
            message: detailsResult.error_message
          };
        }
        break;
      }

      case 'directions': {
        const { origin, destination, mode = 'driving', waypoints, alternatives, avoid, units, departureTime, arrivalTime } = params || {};
        if (!origin || !destination) {
          throw new Error('Origin and destination are required for directions');
        }
        
        let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`;
        
        if (waypoints && Array.isArray(waypoints) && waypoints.length > 0) {
          url += `&waypoints=optimize:true|${waypoints.map(w => encodeURIComponent(w)).join('|')}`;
        }
        if (alternatives) url += '&alternatives=true';
        if (avoid) url += `&avoid=${avoid}`;
        if (units) url += `&units=${units}`;
        if (departureTime) url += `&departure_time=${departureTime}`;
        if (arrivalTime) url += `&arrival_time=${arrivalTime}`;
        
        console.log(`[GoogleMaps] Directions: ${origin} -> ${destination} (${mode})`);
        result = await makeGoogleMapsRequest(url, accessToken);
        break;
      }

      case 'distanceMatrix': {
        const { origins, destinations, mode = 'driving' } = params || {};
        if (!origins || !destinations) {
          throw new Error('Origins and destinations are required for distance matrix');
        }
        
        const originsStr = Array.isArray(origins) ? origins.map(o => encodeURIComponent(o)).join('|') : encodeURIComponent(origins);
        const destinationsStr = Array.isArray(destinations) ? destinations.map(d => encodeURIComponent(d)).join('|') : encodeURIComponent(destinations);
        
        console.log(`[GoogleMaps] Distance matrix: ${originsStr} -> ${destinationsStr}`);
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${mode}`;
        result = await makeGoogleMapsRequest(url, accessToken);
        break;
      }

      case 'autocomplete': {
        const input = params?.input || query;
        if (!input) throw new Error('Input is required for autocomplete');
        
        let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}`;
        if (location) {
          url += `&location=${location.lat},${location.lng}&radius=${params?.radius || 50000}`;
        }
        if (params?.types) url += `&types=${params.types}`;
        if (params?.components) url += `&components=${params.components}`;
        
        console.log(`[GoogleMaps] Autocomplete: ${input}`);
        result = await makeGoogleMapsRequest(url, accessToken);
        break;
      }

      case 'places': {
        const { query: placesQuery, location: placesLocation, radius = 5000 } = params || {};
        if (!placesQuery) throw new Error('Query is required for places search');
        
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placesQuery)}`;
        if (placesLocation) {
          url += `&location=${placesLocation}&radius=${radius}`;
        }
        
        result = await makeGoogleMapsRequest(url, accessToken);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[GoogleMaps] ${action} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[GoogleMaps] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
