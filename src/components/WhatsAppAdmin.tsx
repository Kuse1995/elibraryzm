import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, Copy, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const WhatsAppAdmin = () => {
  const optinUrl = `${window.location.origin}/whatsapp`;
  const [broadcast, setBroadcast] = useState("");
  const [sending, setSending] = useState(false);

  const { data: subscribers = [], refetch: refetchSubs } = useQuery({
    queryKey: ["admin-wa-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_subscribers")
        .select("*")
        .order("opted_in_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["admin-wa-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: waAccount } = useQuery({
    queryKey: ["admin-wa-account"],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("platform", "whatsapp")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const activeSubs = subscribers.filter((s: any) => !s.opted_out_at);

  const sendBroadcast = async () => {
    if (!broadcast.trim()) {
      toast.error("Write a message first");
      return;
    }
    if (activeSubs.length === 0) {
      toast.error("No opted-in subscribers yet");
      return;
    }
    if (!waAccount) {
      toast.error("No WhatsApp account configured. Add a social_accounts row with platform=whatsapp.");
      return;
    }
    setSending(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { data: post, error: postErr } = await supabase
        .from("marketing_posts")
        .insert({
          owner_user_id: userRes.user!.id,
          caption: broadcast,
          image_urls: [],
          direction: "sales",
          status: "draft",
        })
        .select()
        .single();
      if (postErr || !post) throw postErr || new Error("Could not create broadcast draft");

      const { data, error } = await supabase.functions.invoke("publish-post", {
        body: { postId: post.id, accountIds: [waAccount.id] },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success(`Broadcast sent to ${activeSubs.length} subscribers.`);
      setBroadcast("");
    } catch (e: any) {
      toast.error(e.message || "Broadcast failed");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="h-4 w-4" /> Subscribers</div>
            <p className="text-2xl font-bold">{activeSubs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><MessageCircle className="h-4 w-4" /> Conversations</div>
            <p className="text-2xl font-bold">{conversations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><LinkIcon className="h-4 w-4" /> WhatsApp Sender</div>
            <p className="text-sm font-medium truncate">{waAccount?.display_name || "Not configured"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opt-in Link</CardTitle>
          <CardDescription>Share this link to collect WhatsApp subscribers.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input readOnly value={optinUrl} />
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(optinUrl); toast.success("Copied"); }}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Broadcast Message</CardTitle>
          <CardDescription>Send a message to all {activeSubs.length} opted-in subscribers via Twilio WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Message</Label>
            <Textarea rows={4} value={broadcast} onChange={(e) => setBroadcast(e.target.value)} placeholder="New devotional out this week — grab your copy..." />
          </div>
          <Button onClick={sendBroadcast} disabled={sending} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Send className="h-4 w-4 mr-1" /> {sending ? "Sending..." : "Send broadcast"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Subscribers</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opted in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No subscribers yet.</TableCell></TableRow>
            )}
            {subscribers.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm">{s.phone_e164}</TableCell>
                <TableCell>{s.source || "—"}</TableCell>
                <TableCell>
                  {s.opted_out_at ? <Badge variant="destructive">Opted out</Badge> : <Badge>Active</Badge>}
                </TableCell>
                <TableCell>{s.opted_in_at ? new Date(s.opted_in_at).toLocaleDateString() : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Conversations</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Last message</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No conversations yet.</TableCell></TableRow>
            )}
            {conversations.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.phone_e164}</TableCell>
                <TableCell>{c.last_message_at ? new Date(c.last_message_at).toLocaleString() : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
                  {c.state ? JSON.stringify(c.state).slice(0, 80) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default WhatsAppAdmin;