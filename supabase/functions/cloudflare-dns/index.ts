import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DNSRequest {
  action: 'listRecords' | 'createRecord' | 'updateRecord' | 'deleteRecord' | 'listZones';
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

    const { action, userId, params }: DNSRequest = await req.json();
    
    console.log(`Cloudflare DNS action: ${action} for user: ${userId}`);
    
    // Get user's Cloudflare API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.api_keys) {
      throw new Error('Cloudflare API key not found. Please configure it in settings.');
    }

    const apiKeys = settings.api_keys as Record<string, string>;
    const cfApiKey = apiKeys.cloudflare_api_key;
    const cfZoneId = apiKeys.cloudflare_zone_id;

    if (!cfApiKey) {
      throw new Error('Cloudflare API key is not configured.');
    }

    const headers = {
      'Authorization': `Bearer ${cfApiKey}`,
      'Content-Type': 'application/json',
    };

    let result: any;
    const baseUrl = 'https://api.cloudflare.com/client/v4';

    switch (action) {
      case 'listZones': {
        const response = await fetch(`${baseUrl}/zones`, { headers });
        result = await response.json();
        break;
      }

      case 'listRecords': {
        const zoneId = params?.zoneId || cfZoneId;
        if (!zoneId) throw new Error('Zone ID is required');
        
        const response = await fetch(`${baseUrl}/zones/${zoneId}/dns_records`, { headers });
        result = await response.json();
        break;
      }

      case 'createRecord': {
        const zoneId = params?.zoneId || cfZoneId;
        if (!zoneId) throw new Error('Zone ID is required');
        
        const { type, name, content, ttl = 1, proxied = false } = params || {};
        if (!type || !name || !content) {
          throw new Error('Type, name, and content are required for creating a record');
        }
        
        const response = await fetch(`${baseUrl}/zones/${zoneId}/dns_records`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ type, name, content, ttl, proxied }),
        });
        result = await response.json();
        break;
      }

      case 'updateRecord': {
        const zoneId = params?.zoneId || cfZoneId;
        const { recordId, type, name, content, ttl = 1, proxied = false } = params || {};
        
        if (!zoneId || !recordId) throw new Error('Zone ID and Record ID are required');
        if (!type || !name || !content) {
          throw new Error('Type, name, and content are required for updating a record');
        }
        
        const response = await fetch(`${baseUrl}/zones/${zoneId}/dns_records/${recordId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ type, name, content, ttl, proxied }),
        });
        result = await response.json();
        break;
      }

      case 'deleteRecord': {
        const zoneId = params?.zoneId || cfZoneId;
        const { recordId } = params || {};
        
        if (!zoneId || !recordId) throw new Error('Zone ID and Record ID are required');
        
        const response = await fetch(`${baseUrl}/zones/${zoneId}/dns_records/${recordId}`, {
          method: 'DELETE',
          headers,
        });
        result = await response.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Cloudflare DNS ${action} completed successfully`);

    return new Response(
      JSON.stringify({ success: result.success, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Cloudflare DNS error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
