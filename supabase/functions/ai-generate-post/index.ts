import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEXT_MODEL = "google/gemini-2.5-flash";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1";

type GenerateBody = {
  ebookId?: string | null;
  direction?: "sales" | "educational" | "entertainment" | "mixed";
  imageCount?: number;
  styleHints?: string;
  audience?: string;
  extraPrompt?: string;
};

const directionGuidance: Record<string, string> = {
  sales: "Persuasive, benefit-driven, ends with a clear CTA to buy the book. Include a link placeholder {BOOK_URL}.",
  educational: "Teach one insight, verse, or takeaway from the book. Warm, informative, non-pushy. Mention the book once at the end.",
  entertainment: "Storytelling / uplifting / relatable tone. Hook the reader in the first line. Soft mention of the book at the end.",
  mixed: "Blend a personal, relatable hook with one educational nugget and end with a subtle CTA to check out the book.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as GenerateBody;
    const direction = body.direction ?? "sales";
    const imageCount = Math.min(Math.max(body.imageCount ?? 1, 1), 10);

    let ebook: any = null;
    if (body.ebookId) {
      const { data } = await supabase
        .from("ebooks")
        .select("id,title,author,description,category,price,cover_url")
        .eq("id", body.ebookId)
        .maybeSingle();
      ebook = data;
    }

    const bookBlock = ebook
      ? `Book: "${ebook.title}" by ${ebook.author}. Category: ${ebook.category}. Price: K${(ebook.price / 100).toFixed(2)}. Description: ${ebook.description ?? ""}`
      : "No specific book selected. Promote the E Library Christian ebook marketplace (Zambia).";

    // ---------- Caption ----------
    const captionPrompt = `You write social media posts for E Library, a Christian ebook marketplace in Zambia (currency: Kwacha / K).
${bookBlock}

Direction: ${direction.toUpperCase()} — ${directionGuidance[direction]}
${body.audience ? `Audience: ${body.audience}\n` : ""}${body.styleHints ? `Style hints: ${body.styleHints}\n` : ""}${body.extraPrompt ? `Extra instructions: ${body.extraPrompt}\n` : ""}
Write ONE post (max ~180 words) with:
- an attention-grabbing first line
- body copy
- 3-6 relevant hashtags on the last line
Return plain text only, no JSON, no markdown fences.`;

    const captionRes = await fetch(`${AI_GATEWAY}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: "user", content: captionPrompt }],
        temperature: 0.9,
      }),
    });
    if (!captionRes.ok) {
      const t = await captionRes.text();
      console.error("Caption error", captionRes.status, t);
      if (captionRes.status === 429) return json({ error: "Rate limit hit. Please try again shortly." }, 429);
      if (captionRes.status === 402) return json({ error: "AI credits exhausted. Add credits in workspace settings." }, 402);
      return json({ error: "Caption generation failed", details: t }, 502);
    }
    const captionData = await captionRes.json();
    const caption: string = captionData?.choices?.[0]?.message?.content?.trim() ?? "";

    // ---------- Images ----------
    const imagePromptBase = `Create a striking social media image for a Christian ebook post.
${bookBlock}
Direction: ${direction}. ${body.styleHints ?? ""}
High quality, warm inspirational lighting, clear focal point, minimal text overlay, portrait 4:5 friendly composition. No watermark.`;

    const images: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      const imgRes = await fetch(`${AI_GATEWAY}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          messages: [
            { role: "user", content: `${imagePromptBase}\nVariation ${i + 1} of ${imageCount}.` },
          ],
          modalities: ["image", "text"],
        }),
      });
      if (!imgRes.ok) {
        const t = await imgRes.text();
        console.error("Image error", imgRes.status, t);
        continue;
      }
      const imgData = await imgRes.json();
      const imgUrl = imgData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imgUrl) images.push(imgUrl);
    }

    return json({ caption, images, direction, ebookId: body.ebookId ?? null });
  } catch (err) {
    console.error("ai-generate-post error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}