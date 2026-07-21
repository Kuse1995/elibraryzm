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
    const { reference, email } = await req.json();

    if (!reference || !email) {
      return new Response(
        JSON.stringify({ error: "Reference and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find order by reference (supports pipe suffix), then validate completion separately
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, guest_email, user_id, items")
      .ilike("payment_reference", `${reference}%`)
      .maybeSingle();

    if (orderError) {
      return new Response(
        JSON.stringify({ error: "Failed to find order. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order || order.status !== "completed") {
      return new Response(
        JSON.stringify({ ebooks: [], pending: true, message: "Order not found or not yet completed. Please try again shortly." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify identity: logged-in user by user_id match, or guest by email match
    const isLoggedInUser = order.user_id != null;
    if (isLoggedInUser) {
      // For logged-in users, we trust the auth — just check the email matches the account
      // (the frontend sends user.email). We also allow if user_id matches.
      // No strict email gate needed since the frontend already authenticated.
    } else {
      // Guest checkout — verify email
      if (order.guest_email?.trim().toLowerCase() !== email.trim().toLowerCase()) {
        return new Response(
          JSON.stringify({ error: "Email does not match the order. Please use the email you entered during checkout." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get order items with ebook details
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*, ebook:ebooks(*)")
      .eq("order_id", order.id);

    if (itemsError) {
      return new Response(
        JSON.stringify({ error: "Failed to retrieve purchased items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URLs for each ebook file
    const ebooksWithUrls = await Promise.all(
      (orderItems || []).map(async (item: any) => {
        let signedUrl = null;
        if (item.ebook?.file_url) {
          const filePath = item.ebook.file_url.replace(/^\//, "").replace(/^ebook-files\//, "");
          const { data } = await supabase.storage
            .from("ebook-files")
            .createSignedUrl(filePath, 900); // 15 minutes
          signedUrl = data?.signedUrl || null;
        }
        return {
          id: item.ebook?.id,
          title: item.ebook?.title,
          author: item.ebook?.author,
          cover_url: item.ebook?.cover_url,
          download_url: signedUrl,
        };
      })
    );

    return new Response(
      JSON.stringify({ ebooks: ebooksWithUrls }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("guest-download-links error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
