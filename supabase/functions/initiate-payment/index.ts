import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";

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
    if (!LENCO_TOKEN) {
      throw new Error("LENCO_API_TOKEN not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { items, email, card, billing, userId } = body;

    if (!items?.length || !email || !card || !billing) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: items, email, card, billing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total from ebook prices (server-side verification)
    const ebookIds = items.map((i: any) => i.id);
    const { data: ebooks, error: ebookError } = await supabase
      .from("ebooks")
      .select("id, price, title")
      .in("id", ebookIds);

    if (ebookError || !ebooks?.length) {
      return new Response(
        JSON.stringify({ error: "Invalid ebook items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const total = ebooks.reduce((sum: number, e: any) => sum + e.price, 0);
    const totalNaira = (total / 100).toFixed(2);
    const reference = `elib-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Create order in DB
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId || null,
        guest_email: userId ? null : email,
        total,
        status: "pending",
        payment_reference: reference,
        items: ebooks.map((e: any) => ({ id: e.id, title: e.title, price: e.price })),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert order items
    const orderItems = ebooks.map((e: any) => ({
      order_id: order.id,
      ebook_id: e.id,
      price: e.price,
    }));
    await supabase.from("order_items").insert(orderItems);

    // Get Lenco encryption key
    const encKeyRes = await fetch(`${LENCO_API_BASE}/encryption/key`, {
      headers: { Authorization: `Bearer ${LENCO_TOKEN}`, Accept: "application/json" },
    });
    const encKeyData = await encKeyRes.json();

    if (!encKeyData.status || !encKeyData.data) {
      console.error("Encryption key error:", encKeyData);
      return new Response(
        JSON.stringify({ error: "Failed to get encryption key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwkData = encKeyData.data;

    // Build redirect URL
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "";
    const redirectUrl = `${origin}/payment-verify`;

    // Build payload
    const payload = {
      reference,
      email,
      amount: totalNaira,
      currency: "NGN",
      bearer: "merchant",
      customer: {
        firstName: billing.firstName || email.split("@")[0],
        lastName: billing.lastName || "Customer",
      },
      billing: {
        streetAddress: billing.streetAddress || "N/A",
        city: billing.city || "Lagos",
        state: billing.state || "",
        postalCode: billing.postalCode || "100001",
        country: billing.country || "NG",
      },
      card: {
        number: card.number.replace(/\s/g, ""),
        cvv: card.cvv,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
      },
      redirectUrl,
    };

    // Encrypt with JWE
    const rsaPublicKey = await jose.importJWK(jwkData, "RSA-OAEP-256");
    const jwe = await new jose.CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(payload))
    )
      .setProtectedHeader({
        alg: "RSA-OAEP-256",
        enc: "A256GCM",
        cty: "application/json",
        kid: jwkData.kid,
      })
      .encrypt(rsaPublicKey);

    // Send to Lenco
    const lencoRes = await fetch(`${LENCO_API_BASE}/collections/card`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LENCO_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ encryptedPayload: jwe }),
    });

    const lencoData = await lencoRes.json();
    console.log("Lenco response:", JSON.stringify(lencoData));

    if (!lencoData.status) {
      // Update order as failed
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      return new Response(
        JSON.stringify({ error: lencoData.message || "Payment initiation failed", details: lencoData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentStatus = lencoData.data?.status;
    const lencoReference = lencoData.data?.lencoReference;

    // Update order with lenco reference
    await supabase
      .from("orders")
      .update({ payment_reference: `${reference}|${lencoReference || ""}` })
      .eq("id", order.id);

    // Handle 3DS redirect
    if (paymentStatus === "3ds-auth-required") {
      const redirectTo = lencoData.data?.meta?.authorization?.redirect;
      return new Response(
        JSON.stringify({
          status: "3ds-redirect",
          redirectUrl: redirectTo,
          orderId: order.id,
          reference,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle immediate success
    if (paymentStatus === "successful") {
      await supabase.from("orders").update({ status: "completed" }).eq("id", order.id);
      return new Response(
        JSON.stringify({ status: "success", orderId: order.id, reference }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pending or other
    return new Response(
      JSON.stringify({
        status: paymentStatus || "pending",
        orderId: order.id,
        reference,
        message: lencoData.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
