import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const KIMI_TEXT_MODEL = "kimi-k3";
const KIMI_BASE = "https://api.moonshot.ai/v1";
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-lite-image";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const directionGuidance: Record<string, string> = {
  sales: "Persuasive, benefit-driven, ends with a clear CTA to buy the book.",
  educational: "Teach one insight, verse, or takeaway from the book. Warm, informative.",
  entertainment: "Storytelling / uplifting / relatable tone. Hook readers.",
  mixed: "Blend a relatable hook with one takeaway and a soft CTA.",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function pickDirection(schedule: any): string {
  if (schedule.mode === "template") {
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const key = days[new Date().getUTCDay()];
    const t = schedule.template || {};
    if (t[key]) return t[key];
  }
  const mix = schedule.mix || { sales: 50, educational: 30, entertainment: 20 };
  const entries = Object.entries(mix) as [string, number][];
  const total = entries.reduce((s, [, v]) => s + Number(v || 0), 0) || 1;
  let r = Math.random() * total;
  for (const [k, v] of entries) {
    r -= Number(v || 0);
    if (r <= 0) return k;
  }
  return "mixed";
}

function isDue(schedule: any): boolean {
  if (!schedule.active) return false;
  const perWeek = Math.max(1, Math.min(21, schedule.posts_per_week || 3));
  const gapMs = (7 * 24 * 60 * 60 * 1000) / perWeek;
  if (!schedule.last_run_at) return true;
  return Date.now() - new Date(schedule.last_run_at).getTime() >= gapMs;
}

async function callGemini(apiKey: string, model: string, body: unknown) {
  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function callKimi(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${KIMI_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: KIMI_TEXT_MODEL,
      reasoning_effort: "low",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Kimi ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const moonshotKey = Deno.env.get("MOONSHOT_API_KEY");
    const internalSecret = Deno.env.get("AUTOMATION_API_KEY");
    if (!geminiKey) return json({ error: "GEMINI_API_KEY missing" }, 500);
    if (!moonshotKey) return json({ error: "MOONSHOT_API_KEY missing" }, 500);

    const { data: schedules, error } = await service
      .from("post_schedules")
      .select("*")
      .eq("active", true);
    if (error) throw error;

    const results: any[] = [];
    for (const sch of schedules ?? []) {
      if (!isDue(sch)) continue;
      const targets: string[] = sch.target_account_ids ?? [];
      if (targets.length === 0) {
        results.push({ schedule: sch.id, skipped: "no target accounts" });
        continue;
      }
      try {
        // Pick a random approved ebook from this owner
        const { data: books } = await service
          .from("ebooks")
          .select("id,title,author,description,category,price")
          .eq("submitted_by", sch.owner_user_id)
          .eq("approval_status", "approved");
        const ebook = books && books.length ? books[Math.floor(Math.random() * books.length)] : null;

        const direction = pickDirection(sch);
        // 2026-08-18: every ebook is free - never quote a price in captions.
        const bookBlock = ebook
          ? `Book: "${ebook.title}" by ${ebook.author}. Category: ${ebook.category}. It is completely FREE on elibrary.live. ${ebook.description ?? ""}`
          : "Promote the E Library Christian ebook library (Zambia) - every book is free at elibrary.live.";

        const captionPrompt = `You write social media posts for E Library, a Christian ebook marketplace in Zambia (Kwacha / K).
${bookBlock}

Direction: ${direction.toUpperCase()} — ${directionGuidance[direction] ?? ""}
${sch.audience ? `Audience: ${sch.audience}\n` : ""}${sch.style_hints ? `Style hints: ${sch.style_hints}\n` : ""}
Write ONE post (max ~180 words) with an attention-grabbing first line, body copy, and 3-6 hashtags on the last line. Plain text only.`;

        const caption: string = await callKimi(moonshotKey, captionPrompt);

        // Generate images
        const imageCount = Math.max(1, Math.min(10, sch.image_count || 1));
        const uploadedPaths: string[] = [];
        for (let i = 0; i < imageCount; i++) {
          const imgPrompt = `Marketing image for E Library. ${bookBlock}. Direction: ${direction}. ${sch.style_hints ?? ""}. Portrait 4:5, warm, high-quality, no text overlay unless subtle.`;
          const imgRes = await callGemini(geminiKey, GEMINI_IMAGE_MODEL, {
            contents: [{ role: "user", parts: [{ text: imgPrompt }] }],
          });
          const parts = imgRes?.candidates?.[0]?.content?.parts ?? [];
          const imgPart = parts.find((p: any) => p.inlineData || p.inline_data);
          const inline = imgPart?.inlineData ?? imgPart?.inline_data;
          if (!inline?.data) continue;
          const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
          const bytes = Uint8Array.from(atob(inline.data), (c) => c.charCodeAt(0));
          const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
          const path = `${sch.owner_user_id}/auto-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
          const { error: upErr } = await service.storage
            .from("marketing-media")
            .upload(path, bytes, { contentType: mime });
          if (!upErr) uploadedPaths.push(path);
        }

        // Insert marketing_posts row
        const { data: inserted, error: insErr } = await service
          .from("marketing_posts")
          .insert({
            owner_user_id: sch.owner_user_id,
            ebook_id: ebook?.id ?? null,
            caption,
            image_urls: uploadedPaths,
            direction,
            status: "draft",
          })
          .select("id")
          .single();
        if (insErr) throw insErr;

        // Invoke publish-post internally
        const pubRes = await fetch(`${supabaseUrl}/functions/v1/publish-post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": internalSecret ?? "",
          },
          body: JSON.stringify({ postId: inserted!.id, accountIds: targets }),
        });
        const pubJson = await pubRes.json().catch(() => ({}));

        await service
          .from("post_schedules")
          .update({ last_run_at: new Date().toISOString() })
          .eq("id", sch.id);

        results.push({ schedule: sch.id, postId: inserted!.id, publish: pubJson });
      } catch (e: any) {
        results.push({ schedule: sch.id, error: e.message });
      }
    }

    return json({ ok: true, results });
  } catch (e: any) {
    return json({ error: e.message ?? String(e) }, 500);
  }
});