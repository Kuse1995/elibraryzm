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
    const failureReason = data.reasonForFailure || data.failureReason || data.reason || data.message || null;

    if (event === "collection.successful" || data.status === "successful") {
      newStatus = "completed";
    } else if (event === "collection.failed" || data.status === "failed") {
      newStatus = "failed";
    }

    if (newStatus !== order.status || (newStatus === "failed" && failureReason && failureReason !== order.failure_reason)) {
      await supabase
        .from("orders")
        .update({
          status: newStatus,
          failure_reason: newStatus === "failed" ? failureReason || order.failure_reason : order.failure_reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      console.log(`Order ${order.id} updated to ${newStatus}`);

      if (newStatus === "failed" && order.whatsapp_phone) {
        await sendWhatsApp(
          order.whatsapp_phone,
          `Sorry, the payment failed${failureReason ? `: ${failureReason}` : ""}. Reply MTN or AIRTEL followed by your number to try again, or reply CANCEL to start over.`,
        );
      }

      // Auto-notify automation platform on completed sales
      if (newStatus === "completed") {
        // WhatsApp order? Deliver PDFs back over WhatsApp.
        if (order.whatsapp_phone) {
          try {
            await deliverWhatsAppDownloads(supabase, order);
          } catch (waErr) {
            console.error("WhatsApp delivery failed (non-blocking):", waErr);
          }
        }

        try {
          const automationApiKey = Deno.env.get("AUTOMATION_API_KEY");
          const { data: automationEnabled } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "automation_enabled")
            .single();

          if (automationApiKey && automationEnabled?.value === "true") {
            // Fetch order items with ebook details
            const { data: orderItems } = await supabase
              .from("order_items")
              .select("*, ebooks(*)")
              .eq("order_id", order.id);

            const items = (orderItems || []).map((item: any) => ({
              title: item.ebooks?.title || "Unknown",
              author: item.ebooks?.author || "Unknown",
              price: item.price,
            }));

            await fetch("https://dzheddvoiauevcayifev.supabase.co/functions/v1/agent-api", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": automationApiKey,
              },
              body: JSON.stringify({
                action: "record_sale",
                customer_email: order.guest_email || "registered_user",
                items,
                total: order.total,
                order_id: order.id,
              }),
            });
            console.log(`Automation notified for order ${order.id}`);
          }
        } catch (autoErr) {
          console.error("Automation sync failed (non-blocking):", autoErr);
        }
      }
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

function normalizeFilePath(fileUrl: string) {
  let path = fileUrl.trim().split("?")[0].split("#")[0];
  const marker = "/storage/v1/object/";
  const idx = path.indexOf(marker);
  if (idx >= 0) {
    path = path.slice(idx + marker.length);
    path = path.replace(/^(public|sign)\/ebook-files\//, "");
  }
  path = path.replace(/^\/+/, "");
  while (path.startsWith("ebook-files/")) path = path.slice("ebook-files/".length);
  return decodeURIComponent(path);
}

async function deliverWhatsAppDownloads(supabase: any, order: any) {
  const { data: items } = await supabase
    .from("order_items")
    .select("ebook:ebooks(id,title,author,file_url,cover_url)")
    .eq("order_id", order.id);
  if (!items?.length) return;

  await sendWhatsApp(order.whatsapp_phone, "🎉 Payment received! Sending your book(s) now…");

  for (const it of items) {
    const e = it.ebook;
    if (!e?.file_url) continue;
    const path = normalizeFilePath(e.file_url);
    const { data: signed } = await supabase.storage
      .from("ebook-files")
      .createSignedUrl(path, 60 * 60 * 24);
    if (!signed?.signedUrl) continue;
    await sendWhatsApp(
      order.whatsapp_phone,
      `📖 *${e.title}* — ${e.author}`,
      [signed.signedUrl],
    );
  }
  await sendWhatsApp(
    order.whatsapp_phone,
    "Thank you for supporting Christian authors! 🙏 Reply CATALOG to browse more books.",
  );

  // Update the ongoing conversation state
  await supabase
    .from("whatsapp_conversations")
    .upsert(
      {
        phone_e164: order.whatsapp_phone,
        state: { history: [], stage: "idle", cart: [], pending_order_id: null },
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "phone_e164" },
    );
}

async function sendWhatsApp(toE164: string, body: string, mediaUrls: string[] = []) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!sid || !token || !from) {
    console.error("Twilio env vars missing; cannot send WhatsApp");
    return;
  }
  const fromWa = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  const toWa = toE164.startsWith("whatsapp:") ? toE164 : `whatsapp:${toE164}`;
  const form = new URLSearchParams({ From: fromWa, To: toWa, Body: body });
  for (const url of mediaUrls) form.append("MediaUrl", url);
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!res.ok) {
    console.error("Twilio send failed", res.status, await res.text());
  }
}
