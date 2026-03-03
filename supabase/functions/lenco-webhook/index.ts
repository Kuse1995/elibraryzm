import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Lenco webhook received:", JSON.stringify(body));

    const { event, data } = body;

    if (!data?.reference) {
      return new Response(
        JSON.stringify({ error: "Missing reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reference = data.reference;

    // Find order by reference (stored as "reference|lencoReference")
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .like("payment_reference", `${reference}%`);

    const order = orders?.[0];
    if (!order) {
      console.log("Order not found for reference:", reference);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let newStatus = order.status;

    if (event === "collection.successful" || data.status === "successful") {
      newStatus = "completed";
    } else if (event === "collection.failed" || data.status === "failed") {
      newStatus = "failed";
    }

    if (newStatus !== order.status) {
      await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", order.id);
      console.log(`Order ${order.id} updated to ${newStatus}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
