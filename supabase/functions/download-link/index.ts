import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeFilePath = (fileUrl: string) => {
  let path = fileUrl.trim().split("?")[0].split("#")[0];

  const storageMarker = "/storage/v1/object/";
  const markerIndex = path.indexOf(storageMarker);
  if (markerIndex >= 0) {
    path = path.slice(markerIndex + storageMarker.length);
    path = path.replace(/^(public|sign)\/ebook-files\//, "");
  }

  path = path.replace(/^\/+/, "");
  while (path.startsWith("ebook-files/")) {
    path = path.slice("ebook-files/".length);
  }

  return decodeURIComponent(path);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("download-link missing backend environment configuration");
      return jsonResponse({ error: "Download service is not configured." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Please sign in to download this ebook." }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      return jsonResponse({ error: "Please sign in again to download this ebook." }, 401);
    }

    const { ebookId } = await req.json();
    if (!ebookId || typeof ebookId !== "string") {
      return jsonResponse({ error: "Missing ebook ID." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: ebook, error: ebookError } = await supabase
      .from("ebooks")
      .select("id, title, price, file_url, approval_status")
      .eq("id", ebookId)
      .maybeSingle();

    if (ebookError) {
      console.error("download-link ebook lookup failed", ebookError);
      return jsonResponse({ error: "Could not load ebook details." }, 500);
    }

    if (!ebook || ebook.approval_status !== "approved") {
      return jsonResponse({ error: "This ebook is not available for download." }, 404);
    }

    if (!ebook.file_url) {
      return jsonResponse({ error: "No file has been uploaded for this ebook yet." }, 404);
    }

    let allowed = ebook.price === 0;

    if (!allowed) {
      const { data: purchase, error: purchaseError } = await supabase
        .from("order_items")
        .select("id, order:orders!inner(user_id, status)")
        .eq("ebook_id", ebook.id)
        .eq("order.user_id", user.id)
        .eq("order.status", "completed")
        .limit(1)
        .maybeSingle();

      if (purchaseError) {
        console.error("download-link purchase check failed", purchaseError);
        return jsonResponse({ error: "Could not verify your access to this ebook." }, 500);
      }

      allowed = !!purchase;
    }

    if (!allowed) {
      return jsonResponse({ error: "You do not have access to download this ebook." }, 403);
    }

    const filePath = normalizeFilePath(ebook.file_url);
    const { data: signedData, error: signedError } = await supabase.storage
      .from("ebook-files")
      .createSignedUrl(filePath, 900);

    if (signedError || !signedData?.signedUrl) {
      console.error("download-link signed URL failed", {
        ebookId: ebook.id,
        storedFileUrl: ebook.file_url,
        normalizedPath: filePath,
        message: signedError?.message,
      });
      return jsonResponse({ error: "The ebook file could not be found in storage. Please contact support." }, 404);
    }

    return jsonResponse({
      title: ebook.title,
      download_url: signedData.signedUrl,
      expires_in: 900,
    });
  } catch (error) {
    console.error("download-link error", error);
    return jsonResponse({ error: "Could not generate download link." }, 500);
  }
});