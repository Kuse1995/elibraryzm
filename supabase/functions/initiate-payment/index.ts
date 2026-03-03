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
    if (!LENCO_TOKEN) {
      throw new Error("LENCO_API_TOKEN not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { items, email, userId, paymentMethod, phone } = body;

    if (!items?.length || !email || !phone || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: items, email, phone, paymentMethod" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["mtn", "airtel"].includes(paymentMethod)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment method. Use 'mtn' or 'airtel'." }),
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
    const totalKwacha = (total / 100).toFixed(2);
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

    // Send mobile money collection request to Lenco
    const lencoPayload = {
      reference,
      amount: totalKwacha,
      currency: "ZMW",
      bearer: "merchant",
      phone,
      operator: paymentMethod, // "mtn" or "airtel"
      country: "ZM",
    };

    console.log("Lenco mobile money request:", JSON.stringify(lencoPayload));

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
    console.log("Lenco response:", JSON.stringify(lencoData));

    if (!lencoData.status) {
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

    // Handle statuses
    if (paymentStatus === "successful") {
      await supabase.from("orders").update({ status: "completed" }).eq("id", order.id);
      return new Response(
        JSON.stringify({ status: "successful", orderId: order.id, reference }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (paymentStatus === "otp-required") {
      return new Response(
        JSON.stringify({ status: "otp-required", orderId: order.id, reference, lencoReference }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (paymentStatus === "pay-offline") {
      return new Response(
        JSON.stringify({ status: "pay-offline", orderId: order.id, reference, message: "Check your phone to approve payment" }),
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
