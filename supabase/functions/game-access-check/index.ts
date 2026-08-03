import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ok = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional caller identity (Supabase-js attaches the user JWT).
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    let userId: string | null = null;
    if (token) {
      try {
        const authClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: userData } = await authClient.auth.getUser(token);
        userId = userData?.user?.id ?? null;
      } catch {
        userId = null;
      }
    }

    // mode "me": signed-in user asking whether their account is unlocked.
    if (body.mode === "me") {
      if (!userId) return ok({ granted: false, reason: "not_signed_in" });
      const { data: mine } = await supabase
        .from("game_access")
        .select("id")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();
      return ok({ granted: !!mine });
    }

    // Phone claim: normalize to the last 9 digits (Zambian mobile).
    const rawPhone = String(body.phone || "").trim();
    const canon = rawPhone.replace(/\D/g, "").slice(-9);
    if (canon.length < 9) {
      return ok({ granted: false, reason: "invalid_phone" }, 400);
    }

    // Already granted to this signed-in account?
    if (userId) {
      const { data: byUser } = await supabase
        .from("game_access")
        .select("id")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();
      if (byUser) return ok({ granted: true, already: true });
    }

    // Find an active grant by phone (stored as +2609XXXXXXXX or 09XXXXXXXX).
    const { data: rows, error: searchError } = await supabase
      .from("game_access")
      .select("id, user_id, phone, active")
      .ilike("phone", "%" + canon + "%")
      .limit(10);
    if (searchError) {
      return ok({ error: "Failed to look up your games pass. Please try again." }, 500);
    }
    const row = (rows || []).find(
      (r: any) =>
        r.active !== false &&
        String(r.phone || "").replace(/\D/g, "").endsWith(canon)
    );
    if (!row) {
      return ok({ granted: false, reason: "no_pass" });
    }

    // Bind to the signed-in account so future logins work without re-entry.
    if (userId && !row.user_id) {
      await supabase.from("game_access").update({ user_id: userId }).eq("id", row.id);
    }
    return ok({ granted: true });
  } catch (e) {
    console.error("game-access-check error:", e);
    return ok({ error: "Internal server error" }, 500);
  }
});
