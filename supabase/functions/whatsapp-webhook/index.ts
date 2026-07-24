import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KIMI_MODEL = "kimi-k3";
const KIMI_BASE = "https://api.moonshot.ai/v1";
const KIMI_TIMEOUT_MS = 6500;
const LENCO_API_BASE = "https://api.lenco.co/access/v2";
const PUBLIC_ORIGIN = Deno.env.get("PUBLIC_APP_URL") || "https://elibraryzm.lovable.app";
const HUMAN_HANDOFF_CONTACT = "Abraham on +260 972 064 502";
const HUMAN_HANDOFF_REGEX = /\b(human|agent|real person|manager|owner|abraham|complain|complaint|refund|speak to (a )?(person|human|someone|manager|human being)|talk to (a )?(person|human|someone|manager|human being)|call me|call back|phone me|whatsapp abraham)\b/i;

function classifyIntent(text: string, stage?: string): "buying" | "browsing" | "human_request" | "other" {
  const t = (text || "").toLowerCase().trim();
  if (HUMAN_HANDOFF_REGEX.test(t)) return "human_request";
  if (stage === "awaiting_payment_details" || stage === "payment_pending" || stage === "confirm_upsell") return "buying";
  if (/^(buy|mtn|airtel|pay|order)\b/.test(t)) return "buying";
  if (/^(catalog|catalogue|list|books|menu|browse|show)\b/.test(t)) return "browsing";
  if (/\b(book|read|devotional|prayer|marriage|youth|children|worship|faith|bible|christian|verse|topic|recommend|suggest)\b/.test(t)) return "browsing";
  if (/^(hi|hie|hello|hey|good morning|good afternoon|good evening|thanks|thank you)$/i.test(t)) return "browsing";
  return "other";
}

async function logWaMessage(
  supabase: any,
  phone: string,
  direction: "in" | "out",
  body: string,
  intent: string,
  profileName: string | null,
  mediaCount = 0,
) {
  try {
    await supabase.from("whatsapp_messages").insert({
      phone_e164: phone,
      profile_name: profileName,
      direction,
      body: body || "",
      intent,
      media_count: mediaCount,
    });
  } catch (e) {
    console.error("logWaMessage failed", e);
  }
}

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  description: string | null;
  cover_url?: string | null;
};

type ReplyMsg = { body: string; media?: string[] };

type ConvoState = {
  history?: { role: string; text: string }[];
  stage?: "idle" | "confirm_upsell" | "awaiting_payment_details" | "payment_pending";
  cart?: { ebookId: string; discounted: boolean }[];
  upsell_ebook_id?: string | null;
  discount_percent?: number;
  pending_order_id?: string | null;
};

function normalizeZambianPhone(raw: string, operator: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  const local = digits.startsWith("260") ? `0${digits.slice(3)}` : digits;
  const prefixes = operator === "mtn" ? ["096", "076"] : ["097", "077"];
  const network = operator === "mtn" ? "MTN" : "Airtel";

  if (!/^0\d{9}$/.test(local)) {
    return { error: `Please send a valid 10-digit ${network} number, e.g. ${operator === "mtn" ? "096" : "097"}1234567.` };
  }
  if (!prefixes.includes(local.slice(0, 3))) {
    return { error: `${network} numbers should start with ${prefixes.join(" or ")}.` };
  }
  return { phone: local };
}

function lencoFailureReason(payload: any) {
  const reason = payload?.data?.reasonForFailure || payload?.data?.failureReason || payload?.data?.reason || payload?.data?.message || payload?.message || "Payment failed";
  if (String(reason).trim().toLowerCase() === "failed") {
    return "The mobile money prompt was not completed. Please confirm the phone has MTN/Airtel Mobile Money active, keep the phone unlocked, and try again.";
  }
  return reason;
}

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
    let profileName: string | null = null;
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      from = String(form.get("From") ?? "").replace(/^whatsapp:/, "");
      body = String(form.get("Body") ?? "").trim();
      const pn = String(form.get("ProfileName") ?? "").trim();
      profileName = pn || null;
    } else {
      const j = await req.json();
      from = String(j.From ?? "").replace(/^whatsapp:/, "");
      body = String(j.Body ?? "").trim();
      profileName = (j.ProfileName ? String(j.ProfileName).trim() : null) || null;
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
      .upsert(
        {
          phone_e164: from,
          source: "whatsapp_inbound",
          ...(profileName ? { display_name: profileName } : {}),
        } as any,
        { onConflict: "phone_e164" },
      );

    // Load conversation state
    const { data: convo } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_e164", from)
      .maybeSingle();
    const state: ConvoState = (convo?.state as ConvoState) ?? {};
    const history = state.history ?? [];
    state.cart = state.cart ?? [];

    // Log inbound message
    const inboundIntent = classifyIntent(body, state.stage);
    await logWaMessage(supabase, from, "in", body, inboundIntent, profileName);

    // Human handoff — short-circuit before other logic (but not while a payment prompt is live)
    if (inboundIntent === "human_request" && state.stage !== "payment_pending") {
      const handoff = `No problem — I'll pass you on to a human. 🙏\n\nPlease contact *${HUMAN_HANDOFF_CONTACT}* on WhatsApp or by call. He'll take it from here.\n\nIf you'd like to keep browsing books, reply *CATALOG* anytime.`;
      await supabase
        .from("whatsapp_conversations")
        .upsert(
          {
            phone_e164: from,
            state: { ...state, history: [...history, { role: "user", text: body }, { role: "assistant", text: handoff }].slice(-20) },
            last_message_at: new Date().toISOString(),
          } as any,
          { onConflict: "phone_e164" },
        );
      await logWaMessage(supabase, from, "out", handoff, "human_request", profileName);
      return twiml(handoff);
    }

    // Fetch approved books to ground the agent
    const { data: books } = await supabase
      .from("ebooks")
      .select("id,title,author,category,price,description,cover_url")
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
    let extraMessages: ReplyMsg[] = [];
    const currentCartTotal = state.cart.length
      ? cartTotalCents(state.cart, bookList, discountPercent)
      : 0;

    // CANCEL — reset
    if (/^(cancel|reset|start over|clear)$/i.test(lower)) {
      state.cart = [];
      state.stage = "idle";
      state.pending_order_id = null;
      state.upsell_ebook_id = null;
      reply = "Cart cleared. What would you like to explore? Ask for a topic (e.g. 'prayer', 'marriage', 'youth') or reply CATALOG to see books.";
    }

    // Quick greetings should never wait on AI — Twilio can drop slow webhook replies.
    else if (/^(hi|hie|hello|hey|bello|good morning|good afternoon|good evening)$/i.test(lower) && state.stage !== "confirm_upsell") {
      if (state.stage === "payment_pending") {
        reply = "Hi, I'm here. Your payment is still being checked — once it is confirmed, I'll send the download link here. If you want to start over, reply CANCEL.";
      } else if (state.stage === "awaiting_payment_details" && state.cart.length > 0) {
        reply = `${cartSummary(state.cart, bookList, discountPercent)}\n\nTo pay, reply with your operator and Mobile Money number:\n• *MTN 096xxxxxxx*\n• *AIRTEL 097xxxxxxx*`;
      } else {
        reply = `Hi there! 👋 I'm Grace from E Library.\n\nReply *CATALOG* to see all ${bookList.length} books, or tell me what kind of Christian book you're looking for.`;
      }
    }

    // Recovery: old free-resource carts could be left waiting for payment.
    // If a cart is already K0, deliver it immediately on the next message.
    else if (state.cart.length > 0 && currentCartTotal === 0 && state.stage !== "confirm_upsell") {
      const r = await fulfillFreeOrder(supabase, state.cart, bookList, from);
      reply = r.text;
      extraMessages = r.docs;
      state.cart = [];
      state.stage = "idle";
      state.pending_order_id = null;
      state.upsell_ebook_id = null;
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
        const cartTotal = cartTotalCents(state.cart, bookList, discountPercent);
        if (cartTotal === 0) {
          // All-free order — deliver immediately, skip upsell + payment
          const r = await fulfillFreeOrder(supabase, state.cart, bookList, from);
          reply = r.text;
          extraMessages = r.docs;
          state.cart = [];
          state.stage = "idle";
          state.pending_order_id = null;
          state.upsell_ebook_id = null;
        } else {
          // Pick upsell suggestion (different book, prefer same category, must be paid)
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
          // Attach covers: picked book(s) + upsell
          const coverUrls = [...picked, upsell]
            .map((b) => b.cover_url)
            .filter((u): u is string => !!u);
          if (coverUrls.length) extraMessages = [{ body: "", media: coverUrls.slice(0, 4) }];
          } else {
          state.stage = "awaiting_payment_details";
          reply = `${cartSummary(state.cart, bookList, discountPercent)}\n\nTo pay, reply with your operator and Mobile Money number:\n• *MTN 096xxxxxxx*\n• *AIRTEL 097xxxxxxx*`;
          const coverUrls = picked.map((b) => b.cover_url).filter((u): u is string => !!u);
          if (coverUrls.length) extraMessages = [{ body: "", media: coverUrls.slice(0, 4) }];
          }
        }
      }
    }

    // YES/NO for upsell
    else if (state.stage === "confirm_upsell" && /^(yes|y|sure|ok|okay|add)$/i.test(lower)) {
      if (state.upsell_ebook_id) {
        state.cart!.push({ ebookId: state.upsell_ebook_id, discounted: true });
      }
      state.upsell_ebook_id = null;
      if (cartTotalCents(state.cart!, bookList, discountPercent) === 0) {
        const r = await fulfillFreeOrder(supabase, state.cart!, bookList, from);
        reply = r.text;
        extraMessages = r.docs;
        state.cart = [];
        state.stage = "idle";
        state.pending_order_id = null;
      } else {
        state.stage = "awaiting_payment_details";
        reply = `Added! ✅\n\n${cartSummary(state.cart!, bookList, discountPercent)}\n\nTo pay, reply with your operator and Mobile Money number:\n• *MTN 096xxxxxxx*\n• *AIRTEL 097xxxxxxx*`;
      }
    } else if (state.stage === "confirm_upsell" && /^(no|n|skip|nope)$/i.test(lower)) {
      state.upsell_ebook_id = null;
      if (cartTotalCents(state.cart!, bookList, discountPercent) === 0) {
        const r = await fulfillFreeOrder(supabase, state.cart!, bookList, from);
        reply = r.text;
        extraMessages = r.docs;
        state.cart = [];
        state.stage = "idle";
      } else {
        state.stage = "awaiting_payment_details";
        reply = `No worries.\n\n${cartSummary(state.cart!, bookList, discountPercent)}\n\nTo pay, reply with your operator and Mobile Money number:\n• *MTN 096xxxxxxx*\n• *AIRTEL 097xxxxxxx*`;
      }
    }

    // Payment: MTN/AIRTEL <phone>
    else if (/^(mtn|airtel)\b/i.test(lower) && state.cart!.length > 0) {
      const opMatch = lower.match(/^(mtn|airtel)/i);
      const phoneMatch = body.match(/(\+?\d[\d\s-]{7,})/);
      if (!opMatch) {
        reply = "Please start with MTN or AIRTEL followed by your mobile money number.";
      } else {
      const operator = opMatch[1].toLowerCase();
      const phone = phoneMatch ? phoneMatch[1].replace(/[^\d+]/g, "") : "";
      if (cartTotalCents(state.cart!, bookList, discountPercent) === 0) {
        const r = await fulfillFreeOrder(supabase, state.cart!, bookList, from);
        reply = r.text;
        extraMessages = r.docs;
        state.cart = [];
        state.stage = "idle";
        state.pending_order_id = null;
        state.upsell_ebook_id = null;
      } else if (!phone || phone.replace(/\D/g, "").length < 9) {
        reply = "Please include your full mobile money number, e.g. MTN 0961234567";
      } else {
        const normalized = normalizeZambianPhone(phone, operator);
        if (normalized.error || !normalized.phone) {
          reply = normalized.error || "Please send a valid mobile money number.";
        } else {
        const result = await createLencoOrder(supabase, state.cart!, from, normalized.phone, operator, discountPercent);
        if (result.error) {
          reply = `Sorry, payment couldn't be started: ${result.error}. Reply MTN or AIRTEL followed by your number to try again.`;
        } else {
          state.pending_order_id = result.orderId!;
          state.stage = "payment_pending";
          reply = `📲 Payment request sent to ${normalized.phone.slice(-3).padStart(normalized.phone.length, "•")}.\n\nTotal: *${money(result.total!)}*\n\nApprove the prompt on your phone. I'll send your download link here as soon as payment completes. 🙌`;
        }
        }
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

      reply = await askKimi(
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

    // Log outbound reply
    const outboundIntent = classifyIntent(body, state.stage);
    await logWaMessage(supabase, from, "out", reply, outboundIntent, profileName, extraMessages.reduce((n, m) => n + (m.media?.length ?? 0), 0));

    return twiml(reply, extraMessages);
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

function cartTotalCents(
  cart: { ebookId: string; discounted: boolean }[],
  books: Book[],
  discountPercent: number,
) {
  let total = 0;
  for (const item of cart) {
    const b = books.find((x) => x.id === item.ebookId);
    if (!b) continue;
    const price = item.discounted
      ? Math.floor(b.price * (100 - discountPercent) / 100)
      : b.price;
    total += price;
  }
  return total;
}

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

async function fulfillFreeOrder(
  supabase: any,
  cart: { ebookId: string; discounted: boolean }[],
  books: Book[],
  waPhone: string,
): Promise<{ text: string; docs: ReplyMsg[] }> {
  const ids = [...new Set(cart.map((c) => c.ebookId))];
  const { data: ebooks } = await supabase
    .from("ebooks")
    .select("id, title, author, file_url, price, cover_url")
    .in("id", ids);
  if (!ebooks?.length) return { text: "Sorry, I couldn't find those books. Reply CATALOG to try again.", docs: [] };

  const reference = `wa-free-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: order } = await supabase
    .from("orders")
    .insert({
      user_id: null,
      guest_email: `${waPhone.replace(/\D/g, "")}@whatsapp.local`,
      whatsapp_phone: waPhone,
      total: 0,
      status: "completed",
      payment_reference: reference,
      items: ebooks.map((e: any) => ({ id: e.id, title: e.title, price: 0 })),
    })
    .select()
    .single();
  if (order) {
    await supabase.from("order_items").insert(
      ebooks.map((e: any) => ({ order_id: order.id, ebook_id: e.id, price: 0 })),
    );
  }

  const docs: ReplyMsg[] = [];
  for (const e of ebooks as any[]) {
    if (!e.file_url) continue;
    const path = normalizeFilePath(e.file_url);
    const { data: signed } = await supabase.storage
      .from("ebook-files")
      .createSignedUrl(path, 60 * 60 * 24);
    if (signed?.signedUrl) {
      docs.push({ body: `📖 *${e.title}* — ${e.author}`, media: [signed.signedUrl] });
    }
  }
  return {
    text: "🎉 Here are your free downloads — enjoy! 🙏\n\nReply CATALOG to browse more books.",
    docs,
  };
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
  if (!lencoRes.ok || !lencoData.status) {
    const reason = lencoFailureReason(lencoData) || `payment initiation failed (${lencoRes.status})`;
    await supabase.from("orders").update({ status: "failed", failure_reason: reason }).eq("id", order.id);
    return { error: reason };
  }
  const paymentStatus = lencoData.data?.status;
  if (paymentStatus === "failed") {
    const reason = lencoFailureReason(lencoData);
    await supabase.from("orders").update({ status: "failed", failure_reason: reason }).eq("id", order.id);
    return { error: reason };
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

async function askKimi(system: string, history: { role: string; text: string }[], userMsg: string): Promise<string> {
  const key = Deno.env.get("MOONSHOT_API_KEY");
  if (!key) return "The assistant is temporarily unavailable.";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KIMI_TIMEOUT_MS);
  const messages = [
    { role: "system", content: system },
    ...history.map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.text })),
    { role: "user", content: userMsg },
  ];
  try {
    const res = await fetch(`${KIMI_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: KIMI_MODEL,
        reasoning_effort: "low",
        messages,
      }),
    });
    if (!res.ok) {
      console.error("kimi error", res.status, await res.text());
      return "I'm here, but my assistant is slow right now. Reply *CATALOG* to browse books, or *BUY <number>* if you already know the book you want.";
    }
    const data = await res.json();
    return (data?.choices?.[0]?.message?.content ?? "").trim() || "I'm here. Reply *CATALOG* to browse books, or tell me what kind of Christian book you're looking for.";
  } catch (err) {
    console.error("kimi timeout/error", err);
    return "I'm here, but taking a bit long to think. Reply *CATALOG* to browse books, or tell me the topic you need help with.";
  } finally {
    clearTimeout(timeoutId);
  }
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function twiml(message: string, extras: ReplyMsg[] = []) {
  const messages: string[] = [];
  if (message) messages.push(`<Message>${xmlEscape(message)}</Message>`);
  for (const m of extras) {
    const parts: string[] = [];
    if (m.body) parts.push(xmlEscape(m.body));
    for (const url of m.media ?? []) parts.push(`<Media>${xmlEscape(url)}</Media>`);
    if (parts.length) messages.push(`<Message>${parts.join("")}</Message>`);
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response>${messages.join("")}</Response>`;
  return new Response(body, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
}