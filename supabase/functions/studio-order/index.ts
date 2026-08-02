import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LENCO_API_BASE = "https://api.lenco.co/access/v2";
const TIERS = ["standard", "star", "premium"];
const TIER_FEE_KEYS = {
  standard: "studio_standard_fee",
  star: "studio_star_fee",
  premium: "studio_premium_fee",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function tierFee(supabase, tier) {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", TIER_FEE_KEYS[tier])
    .maybeSingle();
  return parseInt(data?.value || "25000");
}

async function setting(supabase, key, fallback) {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return data?.value || fallback;
}

async function sendWhatsApp(toE164, body) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!sid || !token || !from) return;
  const fromWa = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  const toWa = toE164.startsWith("whatsapp:") ? toE164 : `whatsapp:${toE164}`;
  const form = new URLSearchParams({ From: fromWa, To: toWa, Body: body });
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) console.error("studio twilio send failed", res.status, await res.text());
}

async function markPaid(supabase, order) {
  await supabase
    .from("studio_orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("reference", order.reference);
  const hours = await setting(supabase, "studio_delivery_hours", "48");
  const amount = (order.amount_ngwee / 100).toFixed(2);
  await sendWhatsApp(
    order.phone,
    "Payment received! Your book order is now in production with our writers and illustrators. Delivery in about " +
      hours +
      " hours. Thank you for supporting Christian publishing!"
  );
  console.log(`studio order ${order.reference} paid (K${amount})`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const LENCO_TOKEN = Deno.env.get("LENCO_API_TOKEN") || Deno.env.get("LENCO_API_KEY");
    if (!LENCO_TOKEN) throw new Error("LENCO_API_TOKEN not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const body = await req.json();
    const { action, reference, tier, idea, customerName, phone, paymentMethod } = body;

    // --- CHECK STATUS ---
    if (action === "check-status") {
      if (!reference) return json({ error: "Missing reference" }, 400);
      const { data: order } = await supabase.from("studio_orders").select("*").eq("reference", reference).maybeSingle();
      if (!order) return json({ status: "not_found" }, 404);
      if (order.status === "paid") return json({ status: "completed" });
      if (order.status === "failed") return json({ status: "failed" });

      try {
        const lencoRes = await fetch(
          `${LENCO_API_BASE}/collections?reference=${encodeURIComponent(reference)}`,
          { headers: { Authorization: `Bearer ${LENCO_TOKEN}`, Accept: "application/json" } }
        );
        const lencoData = await lencoRes.json();
        const collections = Array.isArray(lencoData.data) ? lencoData.data : [lencoData.data];
        const collection = collections.find((c) => c?.reference === reference);
        const lencoStatus = collection?.status;

        if (lencoStatus === "successful") {
          await markPaid(supabase, order);
          return json({ status: "completed" });
        }
        if (lencoStatus === "failed") {
          await supabase
            .from("studio_orders")
            .update({ status: "failed", updated_at: new Date().toISOString() })
            .eq("reference", reference);
          return json({ status: "failed" });
        }
      } catch (err) {
        console.error("studio lenco poll error:", err);
      }
      return json({ status: "pending" });
    }

    // --- INITIATE ---
    if (action !== "initiate") return json({ error: "Unknown action" }, 400);
    if (!TIERS.includes(tier)) return json({ error: "Invalid tier" }, 400);
    if (!phone) return json({ error: "Phone number required" }, 400);
    if (!idea || String(idea).trim().length < 10) {
      return json({ error: "Tell us a bit about your book idea (at least 10 characters)" }, 400);
    }
    if (!["mtn", "airtel"].includes(paymentMethod)) return json({ error: "Invalid payment method" }, 400);

    const feeNgwee = await tierFee(supabase, tier);
    const feeKwacha = (feeNgwee / 100).toFixed(2);
    const studioReference = `STU-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const { data: order, error: insertError } = await supabase
      .from("studio_orders")
      .insert({
        reference: studioReference,
        tier,
        customer_name: customerName || null,
        phone: String(phone).replace(/[^\d+]/g, ""),
        payment_method: paymentMethod,
        idea: String(idea).trim(),
        amount_ngwee: feeNgwee,
        status: "awaiting_payment",
      })
      .select("*")
      .single();
    if (insertError) throw new Error("order insert failed: " + insertError.message);

    const lencoPayload = {
      reference: studioReference,
      amount: feeKwacha,
      currency: "ZMW",
      bearer: "merchant",
      phone: order.phone,
      operator: paymentMethod,
      country: "ZM",
      description: `E Library Studio ${tier} order`,
    };
    console.log("studio payment request:", JSON.stringify(lencoPayload));

    const lencoRes = await fetch(`${LENCO_API_BASE}/collections/mobile-money`, {
      method: "POST",
      headers: { Authorization: `Bearer ${LENCO_TOKEN}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lencoPayload),
    });
    const lencoData = await lencoRes.json();
    console.log("studio lenco response:", JSON.stringify(lencoData));

    if (!lencoData.status) {
      await supabase.from("studio_orders").update({ status: "failed", notes: lencoData.message || "lenco rejected" }).eq("reference", studioReference);
      return json({ error: lencoData.message || "Payment initiation failed" }, 400);
    }

    const paymentStatus = lencoData.data?.status;
    if (paymentStatus === "successful") {
      await markPaid(supabase, order);
      return json({ status: "successful", reference: studioReference });
    }

    return json({
      status: paymentStatus || "pending",
      reference: studioReference,
      message: paymentStatus === "pay-offline" ? "Check your phone to approve payment" : lencoData.message,
    });
  } catch (error) {
    console.error("studio-order error:", error);
    return json({ error: error.message || "Internal server error" }, 500);
  }
});
