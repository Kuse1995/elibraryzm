import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const contentType = req.headers.get("content-type") ?? "";
    let from = "";
    let body = "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      from = String(form.get("From") ?? "").replace(/^whatsapp:/, "");
      body = String(form.get("Body") ?? "").trim();
    } else {
      const j = await req.json();
      from = String(j.From ?? "").replace(/^whatsapp:/, "");
      body = String(j.Body ?? "").trim();
    }
    if (!from) return twiml("");

    // Opt-out
    if (/^(stop|unsubscribe|opt.?out)$/i.test(body)) {
      await supabase
        .from("whatsapp_subscribers")
        .upsert({ phone_e164: from, opted_out_at: new Date().toISOString() } as any, {
          onConflict: "phone_e164",
        });
      return twiml("You've been unsubscribed. Reply START anytime to opt back in. 🙏");
    }
    if (/^start$/i.test(body)) {
      await supabase
        .from("whatsapp_subscribers")
        .upsert({ phone_e164: from, opted_in_at: new Date().toISOString(), opted_out_at: null, source: "whatsapp_reply" } as any, {
          onConflict: "phone_e164",
        });
      return twiml("Welcome back to E Library. Ask me about any Christian ebook and I'll help you find and buy it! 📖");
    }

    // Ensure subscriber row exists
    await supabase
      .from("whatsapp_subscribers")
      .upsert({ phone_e164: from, source: "whatsapp_inbound" } as any, { onConflict: "phone_e164" });

    // Load conversation state
    const { data: convo } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_e164", from)
      .maybeSingle();
    const history: { role: string; text: string }[] = convo?.state?.history ?? [];

    // Fetch approved books to ground the agent
    const { data: books } = await supabase
      .from("ebooks")
      .select("id,title,author,category,price,description")
      .eq("approval_status", "approved")
      .limit(50);

    const publicOrigin = Deno.env.get("PUBLIC_APP_URL") || "https://elibraryzm.lovable.app";
    const catalog = (books ?? [])
      .map((b: any) => `- ${b.title} by ${b.author} (${b.category}) — K${(b.price / 100).toFixed(2)} — ${publicOrigin}/ebook/${b.id}`)
      .join("\n");

    const reply = await askGemini(
      `You are the friendly WhatsApp shopping assistant for E Library, a Christian ebook marketplace in Zambia (currency Kwacha / K).
You help people discover, ask questions about, and buy Christian ebooks. Keep replies concise (<= 4 short lines), warm, and always end with a helpful next step or a book link when relevant.
To let someone buy a book, share the direct link from the catalog below — checkout happens on the website.
Never invent books or prices; only reference the catalog.

Catalog:
${catalog || "(catalog empty)"}
`,
      history,
      body,
    );

    const newHistory = [...history, { role: "user", text: body }, { role: "assistant", text: reply }].slice(-20);
    await supabase
      .from("whatsapp_conversations")
      .upsert(
        {
          phone_e164: from,
          state: { history: newHistory },
          last_message_at: new Date().toISOString(),
        } as any,
        { onConflict: "phone_e164" },
      );

    return twiml(reply);
  } catch (err) {
    console.error("whatsapp-webhook error", err);
    return twiml("Sorry, something went wrong. Please try again shortly.");
  }
});

async function askGemini(system: string, history: { role: string; text: string }[], userMsg: string): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return "The assistant is temporarily unavailable.";
  const contents = [
    ...history.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.text }] })),
    { role: "user", parts: [{ text: userMsg }] },
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
      }),
    },
  );
  if (!res.ok) {
    console.error("gemini error", res.status, await res.text());
    return "Sorry, I couldn't reach my assistant right now.";
  }
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n").trim() ||
    "Sorry, I didn't catch that."
  );
}

function twiml(message: string) {
  const safe = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response>${message ? `<Message>${safe}</Message>` : ""}</Response>`;
  return new Response(body, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
}