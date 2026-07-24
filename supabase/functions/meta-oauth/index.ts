import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "start";

  const appId = Deno.env.get("META_APP_ID");
  const appSecret = Deno.env.get("META_APP_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const service = createClient(supabaseUrl, serviceKey);

  if (!appId || !appSecret) return json({ error: "META_APP_ID / META_APP_SECRET not configured" }, 500);

  const redirectUri = `${supabaseUrl}/functions/v1/meta-oauth?action=callback`;

  try {
    if (action === "start") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
      const authed = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims } = await authed.auth.getClaims(authHeader.replace("Bearer ", ""));
      if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
      const returnTo = url.searchParams.get("return_to") || "";
      const state = btoa(JSON.stringify({ uid: claims.claims.sub, returnTo, n: crypto.randomUUID() }));

      const authUrl = new URL("https://www.facebook.com/v20.0/dialog/oauth");
      authUrl.searchParams.set("client_id", appId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", SCOPES);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("state", state);
      return json({ url: authUrl.toString() });
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) return htmlResponse("Missing code/state", 400);
      let parsed: { uid: string; returnTo?: string };
      try {
        parsed = JSON.parse(atob(state));
      } catch {
        return htmlResponse("Invalid state", 400);
      }

      // Exchange code -> short-lived user token
      const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", appId);
      tokenUrl.searchParams.set("client_secret", appSecret);
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("code", code);
      const tokRes = await fetch(tokenUrl.toString());
      if (!tokRes.ok) return htmlResponse(`Token exchange failed: ${await tokRes.text()}`, 400);
      const shortTok = await tokRes.json();

      // Upgrade to long-lived user token
      const longUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
      longUrl.searchParams.set("grant_type", "fb_exchange_token");
      longUrl.searchParams.set("client_id", appId);
      longUrl.searchParams.set("client_secret", appSecret);
      longUrl.searchParams.set("fb_exchange_token", shortTok.access_token);
      const longRes = await fetch(longUrl.toString());
      const longTok = longRes.ok ? await longRes.json() : shortTok;
      const userToken: string = longTok.access_token;

      // Fetch pages the user manages
      const pagesRes = await fetch(
        `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${userToken}`,
      );
      if (!pagesRes.ok) return htmlResponse(`Pages fetch failed: ${await pagesRes.text()}`, 400);
      const pagesData = await pagesRes.json();
      const pages = pagesData.data ?? [];

      let saved = 0;
      for (const page of pages) {
        await service.from("social_accounts").upsert(
          {
            owner_user_id: parsed.uid,
            platform: "facebook_page",
            external_id: page.id,
            display_name: page.name,
            access_token: page.access_token,
            metadata: { user_token: userToken },
          } as any,
          { onConflict: "external_id,platform" as any },
        );
        saved++;
        if (page.instagram_business_account?.id) {
          await service.from("social_accounts").upsert(
            {
              owner_user_id: parsed.uid,
              platform: "instagram",
              external_id: page.instagram_business_account.id,
              display_name: page.instagram_business_account.username,
              access_token: page.access_token, // IG uses page token
              metadata: { page_id: page.id },
            } as any,
            { onConflict: "external_id,platform" as any },
          );
          saved++;
        }
      }

      const back = parsed.returnTo || "/author";
      return htmlResponse(
        `<script>window.location.replace(${JSON.stringify(back + "?meta=connected&count=" + saved)});</script>Connected ${saved} account(s). Redirecting…`,
      );
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("meta-oauth error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function htmlResponse(html: string, status = 200) {
  return new Response(`<!doctype html><meta charset="utf-8">${html}`, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}