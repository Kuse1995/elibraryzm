import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  // Ensure leading +
  const e164 = digits.startsWith("+") ? digits : `+${digits.replace(/^0+/, "")}`;
  // Basic E.164 sanity: + then 8-15 digits
  if (!/^\+\d{8,15}$/.test(e164)) return null;
  return e164;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const phone = normalizePhone(String(body.phone ?? ""));
    if (!phone) return json({ error: "Valid phone number required (E.164 format, e.g. +2607...)" }, 400);

    const source = typeof body.source === "string" ? body.source.slice(0, 64) : "web";
    const tags = Array.isArray(body.tags) ? body.tags.slice(0, 10).map((t: any) => String(t).slice(0, 32)) : [];

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing } = await service
      .from("whatsapp_subscribers")
      .select("id, opted_out_at")
      .eq("phone_e164", phone)
      .maybeSingle();

    if (existing) {
      await service
        .from("whatsapp_subscribers")
        .update({ opted_in_at: new Date().toISOString(), opted_out_at: null, source, tags })
        .eq("id", existing.id);
    } else {
      await service.from("whatsapp_subscribers").insert({
        phone_e164: phone,
        opted_in_at: new Date().toISOString(),
        source,
        tags,
      });
    }

    return json({ ok: true, phone });
  } catch (e) {
    console.error("whatsapp-optin error", e);
    return json({ error: (e as Error).message }, 500);
  }
});