import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Image as ImageIcon, Facebook, Instagram, Send, Link2, Trash2, MessageCircle, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Direction = "sales" | "educational" | "entertainment" | "mixed";

interface Props {
  userId: string;
  isAdmin?: boolean;
}

const MarketingStudio = ({ userId, isAdmin }: Props) => {
  const qc = useQueryClient();
  const [ebookId, setEbookId] = useState<string>("");
  const [direction, setDirection] = useState<Direction>("sales");
  const [imageCount, setImageCount] = useState(1);
  const [styleHints, setStyleHints] = useState("");
  const [audience, setAudience] = useState("");
  const [extraPrompt, setExtraPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string[]>>({});

  // Auto-pilot state
  const [autoActive, setAutoActive] = useState(false);
  const [autoMode, setAutoMode] = useState<"mix" | "template">("mix");
  const [autoPostsPerWeek, setAutoPostsPerWeek] = useState(3);
  const [autoImageCount, setAutoImageCount] = useState(1);
  const [autoStyleHints, setAutoStyleHints] = useState("");
  const [autoAudience, setAutoAudience] = useState("");
  const [autoMixSales, setAutoMixSales] = useState(50);
  const [autoMixEdu, setAutoMixEdu] = useState(30);
  const [autoMixEnt, setAutoMixEnt] = useState(20);
  const [autoTargets, setAutoTargets] = useState<string[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const { data: accounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ["social-accounts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("id,platform,display_name,external_id,created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: myBooks = [] } = useQuery({
    queryKey: ["marketing-books", userId, isAdmin],
    queryFn: async () => {
      const q = supabase.from("ebooks").select("id,title,author,approval_status").eq("approval_status", "approved");
      if (!isAdmin) q.eq("submitted_by", userId);
      const { data, error } = await q.order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: drafts = [] } = useQuery({
    queryKey: ["marketing-posts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: schedule } = useQuery({
    queryKey: ["post-schedule", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_schedules")
        .select("*")
        .eq("owner_user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setAutoActive(!!data.active);
        setAutoMode((data.mode as any) ?? "mix");
        setAutoPostsPerWeek(data.posts_per_week ?? 3);
        setAutoImageCount((data as any).image_count ?? 1);
        setAutoStyleHints((data as any).style_hints ?? "");
        setAutoAudience((data as any).audience ?? "");
        setAutoTargets(((data as any).target_account_ids ?? []) as string[]);
        const m: any = data.mix ?? {};
        setAutoMixSales(m.sales ?? 50);
        setAutoMixEdu(m.educational ?? 30);
        setAutoMixEnt(m.entertainment ?? 20);
      }
      return data;
    },
  });

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const payload = {
        owner_user_id: userId,
        active: autoActive,
        mode: autoMode,
        posts_per_week: autoPostsPerWeek,
        image_count: autoImageCount,
        style_hints: autoStyleHints || null,
        audience: autoAudience || null,
        target_account_ids: autoTargets,
        mix: { sales: autoMixSales, educational: autoMixEdu, entertainment: autoMixEnt },
      };
      const { error } = await supabase
        .from("post_schedules")
        .upsert(payload as any, { onConflict: "owner_user_id" });
      if (error) throw error;
      toast.success(autoActive ? "Auto-pilot enabled" : "Schedule saved");
      qc.invalidateQueries({ queryKey: ["post-schedule", userId] });
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSavingSchedule(false);
    }
  };

  const toggleAutoTarget = (id: string) => {
    setAutoTargets((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const connectMeta = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-oauth?action=start&return_to=${encodeURIComponent(window.location.pathname)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || "Could not start Meta connect");
    }
  };

  const disconnectAccount = async (id: string) => {
    if (!confirm("Disconnect this account?")) return;
    const { error } = await supabase.from("social_accounts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Disconnected");
    refetchAccounts();
  };

  const toggleAccountForPost = (postId: string, accId: string) => {
    setSelectedAccounts((s) => {
      const cur = s[postId] ?? [];
      return { ...s, [postId]: cur.includes(accId) ? cur.filter((x) => x !== accId) : [...cur, accId] };
    });
  };

  const publishDraft = async (postId: string) => {
    const accountIds = selectedAccounts[postId] ?? [];
    if (accountIds.length === 0) return toast.error("Select at least one account");
    setPublishingId(postId);
    try {
      const { data, error } = await supabase.functions.invoke("publish-post", {
        body: { postId, accountIds },
      });
      if (error) throw error;
      if (data?.errors && Object.keys(data.errors).length) {
        toast.error(`Published with errors: ${Object.values(data.errors).join("; ")}`);
      } else {
        toast.success("Published!");
      }
      qc.invalidateQueries({ queryKey: ["marketing-posts", userId] });
    } catch (e: any) {
      toast.error(e.message || "Publish failed");
    } finally {
      setPublishingId(null);
    }
  };

  const iconFor = (platform: string) =>
    platform === "facebook_page" ? <Facebook className="h-3.5 w-3.5" /> :
    platform === "instagram" ? <Instagram className="h-3.5 w-3.5" /> :
    <MessageCircle className="h-3.5 w-3.5" />;

  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-post", {
        body: {
          ebookId: ebookId || null,
          direction,
          imageCount,
          styleHints,
          audience,
          extraPrompt,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCaption(data.caption || "");
      setImages(data.images || []);
      toast.success(`Generated caption + ${data.images?.length ?? 0} image(s)`);
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = async () => {
    if (!caption && images.length === 0) {
      toast.error("Nothing to save yet");
      return;
    }
    setSaving(true);
    try {
      // Upload data-URL images to marketing-media bucket, collect storage paths
      const uploaded: string[] = [];
      for (const dataUrl of images) {
        const m = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (!m) continue;
        const mime = m[1];
        const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("marketing-media")
          .upload(path, bytes, { contentType: mime });
        if (upErr) throw upErr;
        uploaded.push(path);
      }

      const { error } = await supabase.from("marketing_posts").insert({
        owner_user_id: userId,
        ebook_id: ebookId || null,
        caption,
        image_urls: uploaded,
        direction,
        status: "draft",
      } as any);
      if (error) throw error;
      toast.success("Draft saved");
      setCaption("");
      setImages([]);
      qc.invalidateQueries({ queryKey: ["marketing-posts", userId] });
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Connected accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts connected yet.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between border rounded-md p-2">
                  <div className="flex items-center gap-2 text-sm">
                    {iconFor(a.platform)}
                    <span className="font-medium">{a.display_name || a.external_id}</span>
                    <Badge variant="outline" className="text-xs">{a.platform}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => disconnectAccount(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={connectMeta}>
              <Facebook className="h-4 w-4 mr-2" /> Connect Facebook & Instagram
            </Button>
            <p className="text-xs text-muted-foreground self-center">
              WhatsApp broadcasts use the shared Twilio sender configured for E Library.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> AI Post Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Book (optional)</Label>
              <Select value={ebookId} onValueChange={setEbookId}>
                <SelectTrigger><SelectValue placeholder="Promote a specific book" /></SelectTrigger>
                <SelectContent>
                  {myBooks.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of images (1–10)</Label>
              <Input type="number" min={1} max={10} value={imageCount} onChange={(e) => setImageCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
            </div>
            <div className="space-y-2">
              <Label>Audience (optional)</Label>
              <Input placeholder="e.g. young Christian mothers" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Style hints (optional)</Label>
            <Input placeholder="e.g. warm, cinematic, watercolor, gold accents" value={styleHints} onChange={(e) => setStyleHints(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Extra instructions (optional)</Label>
            <Textarea rows={2} placeholder="Anything specific you want in the caption or images" value={extraPrompt} onChange={(e) => setExtraPrompt(e.target.value)} />
          </div>
          <Button onClick={generate} disabled={generating} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate post</>}
          </Button>
        </CardContent>
      </Card>

      {(caption || images.length > 0) && (
        <Card>
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea rows={8} value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((src, i) => (
                  <div key={i} className="relative aspect-[4/5] overflow-hidden rounded-md border bg-muted">
                    <img src={src} alt={`Generated ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={saveDraft} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save draft</>}
              </Button>
              <Button variant="outline" onClick={() => { setCaption(""); setImages([]); }}>Discard</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Save first, then publish from the Recent drafts list below.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent drafts</CardTitle></CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2"><ImageIcon className="h-4 w-4" /> No drafts yet.</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((d: any) => (
                <div key={d.id} className="border rounded-md p-3 space-y-2">
                  <p className="text-sm line-clamp-3 whitespace-pre-wrap">{d.caption || <em className="text-muted-foreground">No caption</em>}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                    <Badge variant="secondary">{d.direction}</Badge>
                    <Badge variant={d.status === "published" ? "default" : d.status === "failed" ? "destructive" : "outline"}>{d.status}</Badge>
                    <span>{new Date(d.created_at).toLocaleString()}</span>
                    <span>{d.image_urls?.length ?? 0} image(s)</span>
                  </div>
                  {d.status !== "published" && (
                    <>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {accounts.map((a: any) => {
                          const active = (selectedAccounts[d.id] ?? []).includes(a.id);
                          return (
                            <button
                              key={a.id}
                              onClick={() => toggleAccountForPost(d.id, a.id)}
                              className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded border ${active ? "bg-accent text-accent-foreground border-accent" : "bg-background"}`}
                            >
                              {iconFor(a.platform)} {a.display_name || a.platform}
                            </button>
                          );
                        })}
                        {accounts.length === 0 && (
                          <span className="text-xs text-muted-foreground">Connect an account above to publish.</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => publishDraft(d.id)}
                        disabled={publishingId === d.id || (selectedAccounts[d.id]?.length ?? 0) === 0}
                      >
                        {publishingId === d.id ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing…</> : <><Send className="h-4 w-4 mr-2" />Publish now</>}
                      </Button>
                    </>
                  )}
                  {d.error && <p className="text-xs text-destructive">{d.error}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingStudio;