import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LENCO_API_BASE = "https://api.lenco.co/access/v2";

const PLANS = {
  monthly: { feeKey: "reader_subscription_fee_monthly", daysKey: "reader_subscription_days_monthly", defaultFeeNgwee: 1000, defaultDays: 30 },
  yearly: { feeKey: "reader_subscription_fee_yearly", daysKey: "reader_subscription_days_yearly", defaultFeeNgwee: 10000, defaultDays: 365 },
} as const;

type Plan = keyof typeof PLANS;

// All-Access reader subscription. Like subscription-payment, but it ONLY
// extends profiles.reader_expires_at - it never grants the author role.
// Renewals stack from the current expiry when still active, and each
// reference is applied once (reader_last_sub_ref) so polling cannot
// double-credit the same payment.
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
    const { action, userId, phone, paymentMethod, reference, plan: rawPlan } = body;
    const plan: Plan = rawPlan === "yearly" ? "yearly" : "monthly";
    const cfg = PLANS[plan];

    const loadDays = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [cfg.daysKey]);
      return parseInt(
        data?.find((s: any) => s.key === cfg.daysKey)?.value || String(cfg.defaultDays)
      );
    };

    const extendSubscription = async (userId: string, ref: string) => {
      // Already applied this exact reference? Then this is a re-poll, not a new payment.
      const { data: profile } = await supabase
        .from("profiles")
        .select("reader_expires_at, reader_last_sub_ref")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile?.reader_last_sub_ref === ref) return;

      const days = await loadDays();
      // Renewals stack: pay early, keep the days you already paid for.
      const current = profile?.reader_expires_at ? new Date(profile.reader_expires_at) : null;
      const base = current && current > new Date() ? current : new Date();
      const expiresAt = new Date(base);
      expiresAt.setDate(expiresAt.getDate() + days);

      await supabase
        .from("profiles")
        .update({ reader_expires_at: expiresAt.toISOString(), reader_last_sub_ref: ref })
        .eq("user_id", userId);
    };

    // --- CHECK STATUS ---
    if (action === "check-status") {
      if (!reference || !userId) {
        return new Response(
          JSON.stringify({ error: "Missing reference or userId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("reader_expires_at, reader_last_sub_ref")
        .eq("user_id", userId)
        .maybeSingle();

      if (
        profile?.reader_last_sub_ref === reference &&
        profile?.reader_expires_at &&
        new Date(profile.reader_expires_at) > new Date()
      ) {
        return new Response(
          JSON.stringify({ status: "completed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
          await extendSubscription(userId, reference);
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

    const { data: feeSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", cfg.feeKey)
      .single();

    const feeNgwee = parseInt(feeSetting?.value || String(cfg.defaultFeeNgwee));
    const feeKwacha = (feeNgwee / 100).toFixed(2);
    const subReference = `readersub-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Zambian mobile money numbers: 09XXXXXXXX (local) or +2609XXXXXXXX.
    let local = String(phone).replace(/[^\d+]/g, "");
    if (local.startsWith("+260")) local = "0" + local.slice(4);
    if (local.startsWith("260")) local = "0" + local.slice(3);
    if (!/^0(7\d|9\d)\d{7}$/.test(local)) {
      return new Response(
        JSON.stringify({ error: "Enter a valid Zambian MTN or Airtel number (e.g. 0977XXXXXXX)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lencoPayload = {
      reference: subReference,
      amount: feeKwacha,
      currency: "ZMW",
      bearer: "merchant",
      phone: local,
      operator: paymentMethod,
      country: "ZM",
    };

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

    if (!lencoData.status) {
      return new Response(
        JSON.stringify({ error: lencoData.message || "Payment initiation failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentStatus = lencoData.data?.status;

    if (paymentStatus === "successful") {
      await extendSubscription(userId, subReference);
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
    console.error("Reader subscription payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
