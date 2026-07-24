import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, Copy, Link as LinkIcon, Search, ArrowUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-wa-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 15000,
  });

  const nameForPhone = (phone: string) => {
    const sub = (subscribers as any[]).find((s) => s.phone_e164 === phone);
    return sub?.display_name || null;
  };

  const intentBadge = (intent: string) => {
    switch (intent) {
      case "buying":
        return <Badge className="bg-accent text-accent-foreground">Buying</Badge>;
      case "browsing":
        return <Badge variant="secondary">Browsing</Badge>;
      case "human_request":
        return <Badge variant="destructive">Wants human</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

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

      <ConversationsInbox
        messages={messages as any[]}
        subscribers={subscribers as any[]}
        intentBadge={intentBadge}
      />
    </div>
  );
};

export default WhatsAppAdmin;

type WaMessage = {
  id: string;
  phone_e164: string;
  profile_name: string | null;
  direction: "in" | "out";
  body: string;
  intent: string;
  media_count: number;
  created_at: string;
};

type Thread = {
  phone: string;
  name: string;
  messages: WaMessage[];
  last: WaMessage;
  intents: Set<string>;
  inboundCount: number;
};

function ConversationsInbox({
  messages,
  subscribers,
  intentBadge,
}: {
  messages: any[];
  subscribers: any[];
  intentBadge: (i: string) => JSX.Element;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent">("name");
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  const nameForPhone = (phone: string) => {
    const sub = subscribers.find((s) => s.phone_e164 === phone);
    return sub?.display_name || null;
  };

  const threads: Thread[] = useMemo(() => {
    const map = new Map<string, Thread>();
    for (const m of messages as WaMessage[]) {
      const key = m.phone_e164;
      const displayName =
        m.profile_name || nameForPhone(key) || key;
      if (!map.has(key)) {
        map.set(key, {
          phone: key,
          name: displayName,
          messages: [],
          last: m,
          intents: new Set(),
          inboundCount: 0,
        });
      }
      const t = map.get(key)!;
      t.messages.push(m);
      t.intents.add(m.intent);
      if (m.direction === "in") t.inboundCount++;
      if (new Date(m.created_at) > new Date(t.last.created_at)) {
        t.last = m;
        if (m.profile_name) t.name = m.profile_name;
      }
    }
    // Sort each thread's messages chronologically (oldest first)
    for (const t of map.values()) {
      t.messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    }
    return Array.from(map.values());
  }, [messages, subscribers]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let arr = threads.filter((t) => {
      if (intentFilter !== "all" && !t.intents.has(intentFilter)) return false;
      if (!s) return true;
      return (
        t.name.toLowerCase().includes(s) ||
        t.phone.toLowerCase().includes(s) ||
        t.messages.some((m) => (m.body || "").toLowerCase().includes(s))
      );
    });
    arr.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime();
    });
    return arr;
  }, [threads, search, sortBy, intentFilter]);

  useEffect(() => {
    if (!activePhone && filtered.length > 0) {
      setActivePhone(filtered[0].phone);
    }
    if (activePhone && !filtered.some((t) => t.phone === activePhone) && filtered.length > 0) {
      setActivePhone(filtered[0].phone);
    }
  }, [filtered, activePhone]);

  const active = filtered.find((t) => t.phone === activePhone) || null;

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.phone, active?.messages.length]);

  const dominantIntent = (t: Thread) => {
    // pick most recent non-"other" intent for badge
    for (let i = t.messages.length - 1; i >= 0; i--) {
      const it = t.messages[i].intent;
      if (it && it !== "other") return it;
    }
    return t.last.intent || "other";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversations Inbox</CardTitle>
        <CardDescription>
          Grouped by customer. Click a name on the left to read the full chat. Grace hands off to Abraham on +260 972 064 502 when a customer asks for a human.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, number, or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="md:w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name (A–Z)</SelectItem>
              <SelectItem value="recent">Sort: Most recent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={intentFilter} onValueChange={setIntentFilter}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All intents</SelectItem>
              <SelectItem value="buying">Buying</SelectItem>
              <SelectItem value="browsing">Browsing</SelectItem>
              <SelectItem value="human_request">Wants human</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] gap-4 border rounded-lg overflow-hidden bg-background min-h-[520px]">
          {/* Contact list */}
          <div className="border-b md:border-b-0 md:border-r bg-muted/30">
            <ScrollArea className="h-[520px]">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No conversations match.
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((t) => {
                    const isActive = t.phone === activePhone;
                    return (
                      <li key={t.phone}>
                        <button
                          onClick={() => setActivePhone(t.phone)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            isActive ? "bg-accent/10" : "hover:bg-muted/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm truncate">{t.name}</div>
                              <div className="font-mono text-xs text-muted-foreground truncate">
                                {t.phone}
                              </div>
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {t.last.direction === "in" ? "" : "Grace: "}
                                {t.last.body?.slice(0, 60) ||
                                  (t.last.media_count ? "📎 media" : "—")}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {intentBadge(dominantIntent(t))}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(t.last.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </div>

          {/* Thread */}
          <div className="flex flex-col min-h-[520px]">
            {active ? (
              <>
                <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/20">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{active.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {active.phone} · {active.inboundCount} message
                      {active.inboundCount === 1 ? "" : "s"} received
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from(active.intents).slice(0, 3).map((i) => (
                      <span key={i}>{intentBadge(i)}</span>
                    ))}
                  </div>
                </div>
                <ScrollArea className="flex-1 h-[460px] px-4 py-4 bg-background">
                  <div className="space-y-3">
                    {active.messages.map((m, idx) => {
                      const prev = active.messages[idx - 1];
                      const showDay =
                        !prev ||
                        new Date(prev.created_at).toDateString() !==
                          new Date(m.created_at).toDateString();
                      return (
                        <div key={m.id}>
                          {showDay && (
                            <div className="text-center my-3">
                              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {new Date(m.created_at).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex ${
                              m.direction === "in" ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                                m.direction === "in"
                                  ? "bg-muted text-foreground rounded-tl-sm"
                                  : "bg-accent text-accent-foreground rounded-tr-sm"
                              }`}
                            >
                              {m.body ||
                                (m.media_count
                                  ? `📎 ${m.media_count} media attachment${
                                      m.media_count > 1 ? "s" : ""
                                    }`
                                  : "—")}
                              <div
                                className={`text-[10px] mt-1 ${
                                  m.direction === "in"
                                    ? "text-muted-foreground"
                                    : "text-accent-foreground/70"
                                }`}
                              >
                                {new Date(m.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {m.direction === "out" && " · Grace"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollBottomRef} />
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8 text-center">
                <div>
                  <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  Select a conversation to read the chat.
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}