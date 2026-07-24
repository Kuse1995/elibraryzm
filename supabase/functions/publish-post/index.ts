import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authed = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await authed.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { postId, accountIds } = await req.json();
    if (!postId || !Array.isArray(accountIds) || accountIds.length === 0) {
      return json({ error: "postId and accountIds required" }, 400);
    }

    const { data: post, error: postErr } = await service
      .from("marketing_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();
    if (postErr || !post) return json({ error: "Post not found" }, 404);
    if (post.owner_user_id !== userId) {
      const { data: isAdmin } = await service.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
    }

    const { data: accounts, error: accErr } = await service
      .from("social_accounts")
      .select("*")
      .in("id", accountIds);
    if (accErr || !accounts?.length) return json({ error: "Accounts not found" }, 404);

    // Generate signed URLs for images (1h)
    const signedImageUrls: string[] = [];
    for (const path of post.image_urls ?? []) {
      const { data: signed } = await service.storage
        .from("marketing-media")
        .createSignedUrl(path, 3600);
      if (signed?.signedUrl) signedImageUrls.push(signed.signedUrl);
    }

    const results: Record<string, any> = { ...(post.platform_post_ids ?? {}) };
    const errors: Record<string, string> = {};

    for (const acc of accounts) {
      try {
        if (acc.platform === "facebook_page") {
          results[acc.id] = await publishFacebook(acc, post.caption, signedImageUrls);
        } else if (acc.platform === "instagram") {
          results[acc.id] = await publishInstagram(acc, post.caption, signedImageUrls);
        } else if (acc.platform === "whatsapp") {
          results[acc.id] = await publishWhatsappBroadcast(post.caption, signedImageUrls[0]);
        }
      } catch (e: any) {
        console.error("publish error", acc.platform, e);
        errors[acc.id] = e.message || String(e);
      }
    }

    const anySuccess = Object.keys(results).length > 0;
    await service
      .from("marketing_posts")
      .update({
        status: anySuccess && Object.keys(errors).length === 0 ? "published" : anySuccess ? "published" : "failed",
        published_at: anySuccess ? new Date().toISOString() : null,
        platform_post_ids: results,
        error: Object.keys(errors).length ? JSON.stringify(errors) : null,
      })
      .eq("id", postId);

    return json({ results, errors });
  } catch (err) {
    console.error("publish-post error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

async function publishFacebook(acc: any, caption: string, imageUrls: string[]) {
  const token = acc.access_token;
  if (!token) throw new Error("Missing page access token");
  const base = `https://graph.facebook.com/v20.0/${acc.external_id}`;

  if (imageUrls.length === 0) {
    const res = await fetch(`${base}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: caption, access_token: token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
  }

  if (imageUrls.length === 1) {
    const res = await fetch(`${base}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrls[0], caption, access_token: token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
  }

  // Multi-image: upload unpublished photos, then create feed post referencing them
  const mediaIds: string[] = [];
  for (const url of imageUrls) {
    const r = await fetch(`${base}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, published: false, access_token: token }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(d));
    mediaIds.push(d.id);
  }
  const feedRes = await fetch(`${base}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: caption,
      attached_media: mediaIds.map((id) => ({ media_fbid: id })),
      access_token: token,
    }),
  });
  const feedData = await feedRes.json();
  if (!feedRes.ok) throw new Error(JSON.stringify(feedData));
  return feedData;
}

async function publishInstagram(acc: any, caption: string, imageUrls: string[]) {
  const token = acc.access_token;
  if (!token) throw new Error("Missing IG access token");
  if (imageUrls.length === 0) throw new Error("Instagram requires at least one image");
  const igUserId = acc.external_id;
  const base = `https://graph.facebook.com/v20.0/${igUserId}`;

  const createContainer = async (params: Record<string, string>) => {
    const res = await fetch(`${base}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, access_token: token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data.id as string;
  };

  let creationId: string;
  if (imageUrls.length === 1) {
    creationId = await createContainer({ image_url: imageUrls[0], caption });
  } else {
    const children: string[] = [];
    for (const url of imageUrls.slice(0, 10)) {
      const id = await createContainer({ image_url: url, is_carousel_item: "true" });
      children.push(id);
    }
    creationId = await createContainer({
      media_type: "CAROUSEL",
      caption,
      children: children.join(","),
    });
  }

  const pubRes = await fetch(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  const pubData = await pubRes.json();
  if (!pubRes.ok) throw new Error(JSON.stringify(pubData));
  return pubData;
}

async function publishWhatsappBroadcast(caption: string, imageUrl: string | undefined) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!sid || !token || !from) throw new Error("Twilio not configured");

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: subs } = await supabase
    .from("whatsapp_subscribers")
    .select("phone_e164")
    .is("opted_out_at", null);

  const results: { to: string; sid?: string; error?: string }[] = [];
  const auth = btoa(`${sid}:${token}`);
  for (const s of subs ?? []) {
    const body = new URLSearchParams({
      To: `whatsapp:${s.phone_e164}`,
      From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      Body: caption,
    });
    if (imageUrl) body.append("MediaUrl", imageUrl);
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const d = await r.json();
    if (!r.ok) results.push({ to: s.phone_e164, error: d.message || JSON.stringify(d) });
    else results.push({ to: s.phone_e164, sid: d.sid });
  }
  return { sent: results.filter((r) => r.sid).length, failed: results.filter((r) => r.error).length };
}