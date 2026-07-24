import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-2.5-flash";
const LENCO_API_BASE = "https://api.lenco.co/access/v2";
const PUBLIC_ORIGIN = Deno.env.get("PUBLIC_APP_URL") || "https://elibraryzm.lovable.app";

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  description: string | null;
};

type ConvoState = {
  history?: { role: string; text: string }[];
  stage?: "idle" | "confirm_upsell" | "awaiting_payment_details" | "payment_pending";
  cart?: { ebookId: string; discounted: boolean }[];
  upsell_ebook_id?: string | null;
  discount_percent?: number;
  pending_order_id?: string | null;
};

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
    const state: ConvoState = (convo?.state as ConvoState) ?? {};
    const history = state.history ?? [];
    state.cart = state.cart ?? [];

    // Fetch approved books to ground the agent
    const { data: books } = await supabase
      .from("ebooks")
      .select("id,title,author,category,price,description")
      .eq("approval_status", "approved")
      .limit(200);
    const bookList: Book[] = (books ?? []) as any;

    // Read discount percent
    const { data: discountRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "upsell_discount_percent")
      .maybeSingle();
    const discountPercent = Math.min(99, Math.max(1, parseInt(discountRow?.value ?? "50") || 50));
    state.discount_percent = discountPercent;

    // ===== DETERMINISTIC COMMANDS =====
    const lower = body.toLowerCase().trim();
    let reply: string | null = null;

    // CANCEL — reset
    if (/^(cancel|reset|start over|clear)$/i.test(lower)) {
      state.cart = [];
      state.stage = "idle";
      state.pending_order_id = null;
      state.upsell_ebook_id = null;
      reply = "Cart cleared. What would you like to explore? Ask for a topic (e.g. 'prayer', 'marriage', 'youth') or reply CATALOG to see books.";
    }

    // CATALOG / LIST
    else if (/^(catalog|catalogue|list|books|menu)$/i.test(lower)) {
      reply = formatCatalogShort(bookList);
    }

    // BUY <numbers> — accepts "BUY 1", "BUY 1 3", "BUY 1,3"
    else if (/^buy\b/i.test(lower)) {
      const nums = (lower.match(/\d+/g) || []).map((n) => parseInt(n) - 1);
      const picked = nums.map((i) => bookList[i]).filter(Boolean);
      if (!picked.length) {
        reply = "Please tell me which book number to buy. Reply CATALOG to see the list, then e.g. BUY 1";
      } else {
        state.cart = picked.map((b) => ({ ebookId: b.id, discounted: false }));
        // Pick upsell suggestion (different book, prefer same category)
        const cartIds = new Set(state.cart.map((c) => c.ebookId));
        const upsell =
          bookList.find((b) => !cartIds.has(b.id) && b.price > 0 && picked.some((p) => p.category === b.category)) ||
          bookList.find((b) => !cartIds.has(b.id) && b.price > 0);
        if (upsell) {
          state.upsell_ebook_id = upsell.id;
          state.stage = "confirm_upsell";
          const orig = money(upsell.price);
          const disc = money(Math.floor(upsell.price * (100 - discountPercent) / 100));
          reply = `Great choice! 🎉\n\n${cartSummary(state.cart, bookList, discountPercent)}\n\n📚 *Special offer:* Add "${upsell.title}" by ${upsell.author} for *${disc}* (was ${orig}, ${discountPercent}% off)?\n\nReply YES to add it, or NO to skip.`;
        } else {
          state.stage = "awaiting_payment_details";
          reply = `${cartSummary(state.cart, bookList, discountPercent)}\n\nTo pay, reply with your operator and Mobile Money number:\n• *MTN 0977xxxxxxx*\n• *AIRTEL 0977xxxxxxx*`;
        }
      }
    }

    // YES/NO for upsell
    else if (state.stage === "confirm_upsell" && /^(yes|y|sure|ok|okay|add)$/i.test(lower)) {
      if (state.upsell_ebook_id) {
        state.cart!.push({ ebookId: state.upsell_ebook_id, discounted: true });
      }
      state.upsell_ebook_id = null;
      state.stage = "awaiting_payment_details";
      reply = `Added! ✅\n\n${cartSummary(state.cart!, bookList, discountPercent)}\n\nTo pay, reply with your operator and Mobile Money number:\n• *MTN 0977xxxxxxx*\n• *AIRTEL 0977xxxxxxx*`;
    } else if (state.stage === "confirm_upsell" && /^(no|n|skip|nope)$/i.test(lower)) {
      state.upsell_ebook_id = null;
      state.stage = "awaiting_payment_details";
      reply = `No worries.\n\n${cartSummary(state.cart!, bookList, discountPercent)}\n\nTo pay, reply with your operator and Mobile Money number:\n• *MTN 0977xxxxxxx*\n• *AIRTEL 0977xxxxxxx*`;
    }

    // Payment: MTN/AIRTEL <phone>
    else if (/^(mtn|airtel)\b/i.test(lower) && state.cart!.length > 0) {
      const opMatch = lower.match(/^(mtn|airtel)/i);
      const phoneMatch = body.match(/(\+?\d[\d\s-]{7,})/);
      const operator = opMatch![1].toLowerCase();
      const phone = phoneMatch ? phoneMatch[1].replace(/[^\d+]/g, "") : "";
      if (!phone || phone.replace(/\D/g, "").length < 9) {
        reply = "Please include your full mobile money number, e.g. MTN 0977123456";
      } else {
        const result = await createLencoOrder(supabase, state.cart!, from, phone, operator, discountPercent);
        if (result.error) {
          reply = `Sorry, payment couldn't be started: ${result.error}. Reply MTN or AIRTEL followed by your number to try again.`;
        } else {
          state.pending_order_id = result.orderId!;
          state.stage = "payment_pending";
          reply = `📲 Payment request sent to ${phone.slice(-3).padStart(phone.length, "•")}.\n\nTotal: *${money(result.total!)}*\n\nApprove the prompt on your phone. I'll send your download link here as soon as payment completes. 🙌`;
        }
      }
    }

    // ===== FALLBACK: Gemini agent =====
    if (reply === null) {
      const catalog = formatCatalog(bookList);
      const cartLine = state.cart!.length
        ? `\n\nCurrent cart: ${cartSummary(state.cart!, bookList, discountPercent)}`
        : "";
      const stageHint =
        state.stage === "awaiting_payment_details"
          ? "\n\nThe customer has picked books and needs to send 'MTN <number>' or 'AIRTEL <number>' to pay."
          : state.stage === "payment_pending"
          ? "\n\nAn order is awaiting payment approval. Reassure them and offer to help."
          : "";

      reply = await askGemini(
        `You are "Grace" — a warm, friendly Zambian shop assistant for *E Library*, a Christian ebook store. You chat on WhatsApp like a real person, not a bot.

PERSONALITY
- Human, warm, encouraging. Speak like a friend at church — never robotic or salesy.
- Zambian-friendly English. A light "🙏", "📖", or "✨" now and then is fine. Don't overdo emojis.
- Short messages. 1–3 short sentences per reply. Break lines naturally. No walls of text, no long lists unless the customer asks.
- Never pushy. Recommend, don't pressure.
- If you don't know something, say so kindly. Never invent a book, price, author, or promise.

WHAT YOU KNOW
- You know every book on the E Library platform (listed below with number, title, author, category, price in Kwacha, and description).
- Prices are in Zambian Kwacha (K). Payment is by MTN or Airtel Mobile Money, right here in this chat.
- Recommend based on what the customer shares — their season of life, struggles, interests, or a topic. Pick 1–3 best-fit books from the catalog and say briefly *why* each one fits them.

HOW TO HELP THEM BUY (this is important)
- Each book has a number in the catalog. To buy, they simply reply *BUY <number>* — e.g. "BUY 3", or "BUY 1 4" for more than one.
- After they say BUY, the system automatically offers a ${discountPercent}% off second book, then asks for their MTN/Airtel number. You don't need to ask for payment details yourself.
- They can reply *CATALOG* to see everything, or *CANCEL* to start over.
- Always end your message with one clear, gentle next step — e.g. suggesting a specific book number to try, or a question to understand them better.

SPIRITUAL CARE
- If someone shares a struggle (grief, marriage, fear, doubt, finances, parenting…), respond first with 1 short caring sentence, maybe a short verse reference, *then* suggest a book that speaks to it.

CATALOG (${bookList.length} books available):
${catalog}
${cartLine}${stageHint}

Remember: short, warm, human. One clear next step. Only real books from the catalog above.`,
        history,
        body,
      );
    }

    const newHistory = [...history, { role: "user", text: body }, { role: "assistant", text: reply }].slice(-20);
    state.history = newHistory;
    await supabase
      .from("whatsapp_conversations")
      .upsert(
        {
          phone_e164: from,
          state,
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

function money(cents: number) {
  return `K${(cents / 100).toFixed(2)}`;
}

function formatCatalog(books: Book[]) {
  if (!books.length) return "(catalog empty)";
  return books
    .map((b, i) => {
      const desc = (b.description ?? "").replace(/\s+/g, " ").trim().slice(0, 140);
      const priceLabel = b.price > 0 ? money(b.price) : "Free";
      return `${i + 1}. *${b.title}* — ${b.author} · ${b.category} · ${priceLabel}${desc ? `\n   ${desc}` : ""}`;
    })
    .join("\n");
}

function formatCatalogShort(books: Book[]) {
  if (!books.length) return "(catalog empty)";
  return (
    "📖 *E Library catalog*\n\n" +
    books
      .map((b, i) => `${i + 1}. ${b.title} — ${b.author} · ${b.price > 0 ? money(b.price) : "Free"}`)
      .join("\n") +
    "\n\nReply *BUY <number>* to purchase, or ask me for a recommendation."
  );
}

function cartSummary(
  cart: { ebookId: string; discounted: boolean }[],
  books: Book[],
  discountPercent: number,
) {
  const lines: string[] = [];
  let total = 0;
  for (const item of cart) {
    const b = books.find((x) => x.id === item.ebookId);
    if (!b) continue;
    const price = item.discounted
      ? Math.floor(b.price * (100 - discountPercent) / 100)
      : b.price;
    total += price;
    lines.push(`• ${b.title} — ${money(price)}${item.discounted ? ` (${discountPercent}% off)` : ""}`);
  }
  lines.push(`\n*Total: ${money(total)}*`);
  return lines.join("\n");
}

async function createLencoOrder(
  supabase: any,
  cart: { ebookId: string; discounted: boolean }[],
  waPhone: string,
  payPhone: string,
  operator: string,
  discountPercent: number,
): Promise<{ orderId?: string; total?: number; error?: string }> {
  const LENCO_TOKEN = Deno.env.get("LENCO_API_TOKEN");
  if (!LENCO_TOKEN) return { error: "payments not configured" };

  const ids = [...new Set(cart.map((c) => c.ebookId))];
  const { data: ebooks } = await supabase
    .from("ebooks")
    .select("id, price, title")
    .in("id", ids);
  if (!ebooks?.length) return { error: "books not found" };
  const map = new Map(ebooks.map((e: any) => [e.id, e]));

  let total = 0;
  const orderItems: any[] = [];
  for (const item of cart) {
    const e: any = map.get(item.ebookId);
    if (!e) continue;
    const price = item.discounted
      ? Math.floor(e.price * (100 - discountPercent) / 100)
      : e.price;
    total += price;
    orderItems.push({ id: e.id, title: e.title, price, discounted: item.discounted });
  }
  if (total <= 0) return { error: "invalid cart" };

  const reference = `wa-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: null,
      guest_email: `${waPhone.replace(/\D/g, "")}@whatsapp.local`,
      whatsapp_phone: waPhone,
      total,
      status: "pending",
      payment_reference: reference,
      items: orderItems,
    })
    .select()
    .single();
  if (orderError || !order) return { error: "could not create order" };

  await supabase.from("order_items").insert(
    orderItems.map((it: any) => ({ order_id: order.id, ebook_id: it.id, price: it.price })),
  );

  const lencoRes = await fetch(`${LENCO_API_BASE}/collections/mobile-money`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LENCO_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      reference,
      amount: (total / 100).toFixed(2),
      currency: "ZMW",
      bearer: "merchant",
      phone: payPhone,
      operator,
      country: "ZM",
    }),
  });
  const lencoData = await lencoRes.json();
  if (!lencoData.status) {
    await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
    return { error: lencoData.message || "payment initiation failed" };
  }
  const lencoReference = lencoData.data?.lencoReference;
  if (lencoReference) {
    await supabase
      .from("orders")
      .update({ payment_reference: `${reference}|${lencoReference}` })
      .eq("id", order.id);
  }
  return { orderId: order.id, total };
}

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