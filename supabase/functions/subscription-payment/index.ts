import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LENCO_API_BASE = "https://api.lenco.co/access/v2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LENCO_TOKEN = Deno.env.get("LENCO_API_TOKEN");
    if (!LENCO_TOKEN) throw new Error("LENCO_API_TOKEN not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, userId, phone, paymentMethod, reference } = body;

    // --- CHECK STATUS ---
    if (action === "check-status") {
      if (!reference || !userId) {
        return new Response(
          JSON.stringify({ error: "Missing reference or userId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check profile subscription status first
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_expires_at")
        .eq("user_id", userId)
        .single();

      if (profile?.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date()) {
        return new Response(
          JSON.stringify({ status: "completed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Poll Lenco
      try {
        const lencoRes = await fetch(
          `${LENCO_API_BASE}/collections?reference=${encodeURIComponent(reference)}`,
          {
            headers: {
              Authorization: `Bearer ${LENCO_TOKEN}`,
              Accept: "application/json",
            },
          }
        );
        const lencoData = await lencoRes.json();
        const collections = Array.isArray(lencoData.data) ? lencoData.data : [lencoData.data];
        const collection = collections.find((c: any) => c?.reference === reference);
        const lencoStatus = collection?.status;

        if (lencoStatus === "successful") {
          // Activate subscription
          const { data: settings } = await supabase
            .from("site_settings")
            .select("key, value")
            .in("key", ["author_subscription_duration_days"]);

          const days = parseInt(settings?.find((s: any) => s.key === "author_subscription_duration_days")?.value || "365");
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);

          await supabase
            .from("profiles")
            .update({ subscription_expires_at: expiresAt.toISOString() })
            .eq("user_id", userId);

          // Grant author role if not already
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", userId)
            .eq("role", "author")
            .maybeSingle();

          if (!existingRole) {
            await supabase.from("user_roles").insert({ user_id: userId, role: "author" });
          }

          console.log(`Author subscription activated for ${userId}, expires ${expiresAt.toISOString()}`);
          return new Response(
            JSON.stringify({ status: "completed" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (lencoStatus === "failed") {
          return new Response(
            JSON.stringify({ status: "failed" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        console.error("Lenco poll error:", err);
      }

      return new Response(
        JSON.stringify({ status: "pending" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- INITIATE PAYMENT ---
    if (!userId || !phone || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, phone, paymentMethod" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["mtn", "airtel"].includes(paymentMethod)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get subscription fee
    const { data: feeSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "author_subscription_fee")
      .single();

    const feeNgwee = parseInt(feeSetting?.value || "5000");
    const feeKwacha = (feeNgwee / 100).toFixed(2);
    const subReference = `sub-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const lencoPayload = {
      reference: subReference,
      amount: feeKwacha,
      currency: "ZMW",
      bearer: "merchant",
      phone,
      operator: paymentMethod,
      country: "ZM",
    };

    console.log("Subscription payment request:", JSON.stringify(lencoPayload));

    const lencoRes = await fetch(`${LENCO_API_BASE}/collections/mobile-money`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LENCO_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(lencoPayload),
    });

    const lencoData = await lencoRes.json();
    console.log("Lenco subscription response:", JSON.stringify(lencoData));

    if (!lencoData.status) {
      return new Response(
        JSON.stringify({ error: lencoData.message || "Payment initiation failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentStatus = lencoData.data?.status;

    if (paymentStatus === "successful") {
      // Immediate success - activate subscription
      const { data: settings } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["author_subscription_duration_days"]);

      const days = parseInt(settings?.find((s: any) => s.key === "author_subscription_duration_days")?.value || "365");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      await supabase
        .from("profiles")
        .update({ subscription_expires_at: expiresAt.toISOString() })
        .eq("user_id", userId);

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "author")
        .maybeSingle();

      if (!existingRole) {
        await supabase.from("user_roles").insert({ user_id: userId, role: "author" });
      }

      return new Response(
        JSON.stringify({ status: "successful", reference: subReference }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        status: paymentStatus || "pending",
        reference: subReference,
        message: paymentStatus === "pay-offline" ? "Check your phone to approve payment" : lencoData.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Subscription payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
