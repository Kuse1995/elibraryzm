import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LENCO_API_BASE = "https://api.lenco.co/access/v2";

function lencoFailureReason(payload: any) {
  return payload?.reasonForFailure || payload?.failureReason || payload?.reason || payload?.message || "Payment failed";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();
    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find order in DB
    const { data: order, error: queryError } = await supabase
      .from("orders")
      .select("id, status, payment_reference, failure_reason")
      .ilike("payment_reference", `${reference}%`)
      .maybeSingle();

    if (queryError) {
      console.error("Query error:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to check status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ status: "not_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already completed, or failed with a saved reason, return immediately
    if (order.status === "completed" || (order.status === "failed" && order.failure_reason)) {
      return new Response(
        JSON.stringify({ status: order.status, failure_reason: order.failure_reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Order is still pending — actively check Lenco API
    const LENCO_TOKEN = Deno.env.get("LENCO_API_TOKEN");
    if (!LENCO_TOKEN) {
      // Can't poll Lenco, just return DB status
      return new Response(
        JSON.stringify({ status: order.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract both references; Lenco sometimes resolves by the app reference and sometimes by its own reference.
    const originalRef = order.payment_reference?.split("|")[0] || reference;
    const lencoRef = order.payment_reference?.split("|")[1] || "";

    try {
      const refsToCheck = [...new Set([originalRef, lencoRef].filter(Boolean))];
      const collections: any[] = [];

      for (const refToCheck of refsToCheck) {
        const lencoRes = await fetch(
          `${LENCO_API_BASE}/collections?reference=${encodeURIComponent(refToCheck)}`,
          {
            headers: {
              Authorization: `Bearer ${LENCO_TOKEN}`,
              Accept: "application/json",
            },
          }
        );

        const lencoData = await lencoRes.json();
        console.log("Lenco status check response:", JSON.stringify({ refToCheck, lencoData }));
        const dataRows = Array.isArray(lencoData.data) ? lencoData.data : [lencoData.data];
        collections.push(...dataRows.filter(Boolean));
      }

      const collection = collections.find((c: any) => c?.reference === originalRef || c?.lencoReference === lencoRef || c?.id === lencoRef) || collections[0];
      const lencoStatus = collection?.status;
      const lencoReason = collection ? lencoFailureReason(collection) : undefined;

      if (lencoStatus === "successful") {
        await supabase
          .from("orders")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", order.id);
        console.log(`Order ${order.id} marked completed via Lenco poll`);
        return new Response(
          JSON.stringify({ status: "completed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (lencoStatus === "failed") {
        const reason = lencoReason || "Payment failed or the phone prompt expired.";
        await supabase
          .from("orders")
          .update({ status: "failed", failure_reason: reason, updated_at: new Date().toISOString() })
          .eq("id", order.id);
        console.log(`Order ${order.id} marked failed via Lenco poll`);
        return new Response(
          JSON.stringify({ status: "failed", failure_reason: reason }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (lencoErr) {
      console.error("Lenco poll error:", lencoErr);
    }

    // Still pending
    return new Response(
      JSON.stringify({
        status: order.status,
        failure_reason: order.status === "failed"
          ? order.failure_reason || "Payment failed or the phone prompt expired."
          : order.failure_reason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
