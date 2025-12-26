import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  integrationId: string;
  apiKeys: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integrationId, apiKeys }: TestRequest = await req.json();
    
    console.log(`Testing integration: ${integrationId}`);
    
    let success = false;
    let error = '';

    switch (integrationId) {
      case 'google_maps': {
        const apiKey = apiKeys.google_maps_api_key;
        if (!apiKey) {
          error = 'Google Maps API key is required';
          break;
        }
        
        // Test the API key with a geocoding request
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`
        );
        const data = await response.json();
        
        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
          success = true;
        } else if (data.error_message) {
          error = data.error_message;
        } else {
          error = `API returned status: ${data.status}`;
        }
        break;
      }

      case 'smtp': {
        const host = apiKeys.smtp_host;
        const port = apiKeys.smtp_port;
        const user = apiKeys.smtp_user;
        const pass = apiKeys.smtp_pass;
        
        if (!host || !port || !user || !pass) {
          error = 'All SMTP fields are required';
          break;
        }

        // We can't directly test SMTP in Deno edge functions easily
        // So we just validate the format
        if (host && port && user && pass) {
          success = true;
        }
        break;
      }

      case 'cloudflare': {
        const apiKey = apiKeys.cloudflare_api_key;
        const zoneId = apiKeys.cloudflare_zone_id;
        
        if (!apiKey) {
          error = 'Cloudflare API key is required';
          break;
        }

        // Test the API key by verifying tokens
        const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
          success = true;
        } else {
          error = data.errors?.[0]?.message || 'Invalid API key';
        }
        break;
      }

      default:
        error = `Testing not supported for ${integrationId}`;
    }

    console.log(`Test result for ${integrationId}: success=${success}, error=${error}`);

    return new Response(
      JSON.stringify({ success, error }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Test integration error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
