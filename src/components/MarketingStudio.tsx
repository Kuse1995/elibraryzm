import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Image as ImageIcon } from "lucide-react";
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
              Publishing to Facebook, Instagram and WhatsApp will be enabled in the next step, once your Meta App and Twilio sender are wired up.
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
                <div key={d.id} className="flex items-start justify-between border rounded-md p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{d.caption || <em className="text-muted-foreground">No caption</em>}</p>
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{d.direction}</Badge>
                      <Badge variant="outline">{d.status}</Badge>
                      <span>{new Date(d.created_at).toLocaleString()}</span>
                      <span>{d.image_urls?.length ?? 0} image(s)</span>
                    </div>
                  </div>
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