import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTOMATION_API_URL =
  "https://dzheddvoiauevcayifev.supabase.co/functions/v1/agent-api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AUTOMATION_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Automation API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub as string;

    // Check admin role
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, payload } = body;

    // Forward request to automation platform
    const response = await fetch(AUTOMATION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ action, ...(payload || {}) }),
    });

    const responseData = await response.json();

    // If syncing catalog, update last sync time
    if (action === "list_products" || action === "sync_catalog") {
      await serviceClient
        .from("site_settings")
        .upsert({ key: "automation_last_sync", value: new Date().toISOString() });
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Automation sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
