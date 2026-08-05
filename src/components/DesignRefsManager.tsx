import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Style references for the AI design studio. These are NOT Canva-style
// templates: the AI copies the look (colours, composition, mood) while the
// studio's renderer draws the customer's text in code. Reference text is
// never copied.
type DesignRef = {
  id: string;
  name: string;
  tags: string[];
  storage_path: string;
  source: string;
  active: boolean;
  created_at: string;
};

const BUCKET = "design-refs";

export default function DesignRefsManager() {
  const { user } = useAuth();
  const [refs, setRefs] = useState<DesignRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("design_refs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100) as any;
    if (error) toast.error(error.message);
    else {
      const rows = (data || []) as DesignRef[];
      setRefs(rows);
      if (rows.length) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(rows.map((r) => r.storage_path), 3600);
        const map: Record<string, string> = {};
        (signed || []).forEach((s, i) => {
          if (s.signedUrl) map[rows[i].storage_path] = s.signedUrl;
        });
        setUrls(map);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const url = (r: DesignRef) => urls[r.storage_path] || "";

  const upload = async () => {
    if (!file) return toast.error("Choose an image first");
    if (!name.trim()) return toast.error("Give it a name so matching is easier");
    setUploading(true);
    try {
      const path = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${file.name.split(".").pop() || "jpg"}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const tagList = tags.split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      const { error: insErr } = await supabase
        .from("design_refs")
        .insert({ name: name.trim(), tags: tagList, storage_path: path, source: "site", active: true }) as any;
      if (insErr) throw insErr;
      toast.success("Reference saved - the AI picks it up automatically");
      setName(""); setTags(""); setFile(null);
      (document.getElementById("ref-file") as HTMLInputElement).value = "";
      load();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (r: DesignRef) => {
    if (!window.confirm(`Delete "${r.name}"?`)) return;
    const { error: delRow } = await supabase.from("design_refs").delete().eq("id", r.id) as any;
    if (!delRow) await supabase.storage.from(BUCKET).remove([r.storage_path]);
    if (delRow) toast.error(delRow.message); else { toast.success("Deleted"); load(); }
  };

  const toggle = async (r: DesignRef) => {
    const { error } = await supabase.from("design_refs").update({ active: !r.active }).eq("id", r.id) as any;
    if (!error) load();
  };

  const editable = !!user;

  return (
    <TabsContentWrapper>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Design References</CardTitle>
        <CardDescription>
          Upload posters/flyers you like. The AI copies the style (colours, composition, mood) - never the text.
          Tag with occasions: birthday, wedding, church, salon, logo, business, premium...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium Party Pink" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tags</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="birthday, premium, vibrant" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Image</Label>
            <Input id="ref-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <Button onClick={upload} disabled={uploading || !editable}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? "Uploading..." : "Upload reference"}
        </Button>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{loading ? "Loading..." : `${refs.length} reference(s)`}</p>
          <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>
        {loading ? (
          <div className="text-center text-muted-foreground py-10">Loading...</div>
        ) : refs.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            No references yet. Upload the first poster you want the AI to learn from.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {refs.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <img src={url(r)} alt={r.name} className="w-full h-64 object-cover bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <p className="font-medium text-sm truncate">{r.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {(r.tags || []).map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={r.active} onCheckedChange={() => toggle(r)} disabled={!editable} />
                      {r.active ? "Active" : "Paused"}
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => remove(r)} disabled={!editable}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </TabsContentWrapper>
  );
}

// thin wrapper so the manager renders inside an Admin <TabsContent value="refs">
function TabsContentWrapper({ children }: { children: React.ReactNode }) {
  return <Card className="mt-6">{children}</Card>;
}
