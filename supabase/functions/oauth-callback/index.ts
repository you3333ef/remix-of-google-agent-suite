import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, access_token, refresh_token, expires_in, scope } = await req.json();

    if (!user_id) {
      console.error("Missing user_id in request");
      return new Response(
        JSON.stringify({ error: "Missing user data" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing OAuth callback for user: ${user_id}`);

    // 1. Save/Update OAuth tokens
    if (access_token) {
      const expiresAt = expires_in 
        ? new Date(Date.now() + expires_in * 1000).toISOString()
        : null;

      const { error: tokenError } = await supabase
        .from("user_google_tokens")
        .upsert({
          user_id,
          access_token,
          refresh_token: refresh_token || null,
          expires_at: expiresAt,
          scope: scope || "",
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (tokenError) {
        console.error("Error saving tokens:", tokenError);
      } else {
        console.log("OAuth tokens saved successfully");
      }
    }

    // 2. Check if user already has a maps conversation
    const { data: existingConversation } = await supabase
      .from("maps_conversations")
      .select("id")
      .eq("user_id", user_id)
      .limit(1)
      .single();

    let conversationId = existingConversation?.id;

    // 3. Auto-create first maps conversation if none exists
    if (!conversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from("maps_conversations")
        .insert({
          user_id,
          title: "My Maps Session",
          messages: [],
        })
        .select("id")
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
      } else {
        conversationId = newConversation?.id;
        console.log("Created new maps conversation:", conversationId);
      }
    }

    // 4. Ensure user has a profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user_id)
      .single();

    if (!profile) {
      // Profile will be created by the handle_new_user trigger
      console.log("Profile will be created by trigger");
    }

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversationId,
        message: "OAuth setup completed successfully"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("OAuth callback error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
