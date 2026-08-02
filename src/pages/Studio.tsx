import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  PenLine, Sparkles, MessageCircle, CheckCircle2, Loader2, Clock3,
  BookOpen, Palette, Send, Star, Building2, ArrowRight, Phone, Users, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_FEES = { standard: 25000, star: 30000, premium: 80000 };
const DEFAULT_WHATSAPP = "+15557797636";
const DEFAULT_DELIVERY_HOURS = "48";

type TierKey = "standard" | "star" | "premium";

const TIER_META: Record<TierKey, { label: string; icon: any; tagline: string; features: string[] }> = {
  standard: {
    label: "Idea to Book",
    icon: BookOpen,
    tagline: "You share the idea - we write, illustrate and design the whole book.",
    features: [
      "Full manuscript written by our writers",
      "Custom cover + inside illustrations",
      "Typeset PDF delivered on WhatsApp",
      "Published in the E Library store (optional)",
    ],
  },
  star: {
    label: "Star of the Story",
    icon: Star,
    tagline: "A personalised children's book starring your child - the perfect gift.",
    features: [
      "Your child is the main character",
      "Their name woven through the story",
      "Bright, age-appropriate illustrations",
      "A keepsake PDF family and friends will love",
    ],
  },
  premium: {
    label: "Church & School Pack",
    icon: Building2,
    tagline: "Volume projects for churches, schools and ministries.",
    features: [
      "10+ copies with bulk discount",
      "Curriculum or sermon-series themes",
      "Branding on the cover",
      "Print-ready formatting included",
    ],
  },
};

const Studio = () => {
  const [tier, setTier] = useState<TierKey>("standard");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idea, setIdea] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">("mtn");
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["site-settings", "studio"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["studio_standard_fee", "studio_star_fee", "studio_premium_fee", "studio_delivery_hours", "studio_whatsapp_number"]);
      const map: Record<string, string> = {};
      (data || []).forEach((s) => (map[s.key] = s.value));
      return map;
    },
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ["ebooks", "studio-portfolio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("id, title, cover_url, category")
        .eq("approval_status", "approved")
        .not("cover_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const fees = {
    standard: Number(settings?.studio_standard_fee || DEFAULT_FEES.standard),
    star: Number(settings?.studio_star_fee || DEFAULT_FEES.star),
    premium: Number(settings?.studio_premium_fee || DEFAULT_FEES.premium),
  };
  const deliveryHours = settings?.studio_delivery_hours || DEFAULT_DELIVERY_HOURS;
  const waNumber = settings?.studio_whatsapp_number || DEFAULT_WHATSAPP;
  const waDigits = waNumber.replace(/[^\d]/g, "");
  const waLink = "https://wa.me/" + waDigits + "?text=" + encodeURIComponent("Hi E Library Studio! I have a book idea I would love to bring to life.");

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const chooseTier = (t: TierKey) => {
    setTier(t);
    setPaymentStatus(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startPolling = (ref: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        clearInterval(pollRef.current!);
        setPaymentStatus("timeout");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("studio-order", {
          body: { action: "check-status", reference: ref },
        });
        if (error) return;
        if (data?.status === "completed") {
          clearInterval(pollRef.current!);
          setPaymentStatus("completed");
          toast.success("Payment received! Your book is now in production.");
        } else if (data?.status === "failed") {
          clearInterval(pollRef.current!);
          setPaymentStatus("failed");
          toast.error("Payment failed. Please try again.");
        }
      } catch {}
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Enter your phone number");
      return;
    }
    if (idea.trim().length < 10) {
      toast.error("Tell us a bit more about your book idea (at least 10 characters)");
      return;
    }

    setLoading(true);
    setPaymentStatus("initiating");
    try {
      const { data, error } = await supabase.functions.invoke("studio-order", {
        body: {
          action: "initiate",
          tier,
          idea: idea.trim(),
          customerName: name.trim() || null,
          phone,
          paymentMethod,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReference(data.reference);
      if (data.status === "successful") {
        setPaymentStatus("completed");
        toast.success("Payment received! Your book is now in production.");
      } else {
        setPaymentStatus("pending");
        toast.info(data.message || "Check your phone to approve payment");
        startPolling(data.reference);
      }
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
      setPaymentStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const kwacha = (ngwee: number) => "K" + (ngwee / 100).toFixed(2).replace(/\.00$/, "");

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="container relative py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-gold" />
            <span>NEW - E Library Book Studio</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your Book Idea,<br />
            <span className="text-gold">Brought to Life</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Tell us your idea on WhatsApp or in the form below. Our writers and illustrators
            turn it into a beautiful Christian ebook - delivered to your phone as a PDF.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 gap-2 text-base px-8" onClick={() => chooseTier("standard")}>
              Start Your Book <ArrowRight className="h-4 w-4" />
            </Button>
            <a href={waLink} target="_blank" rel="noreferrer">
              <Button size="lg" className="border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 text-base px-8 gap-2">
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b bg-card">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-6 py-6 text-center">
          <div className="flex flex-col items-center gap-1">
            <Clock3 className="h-6 w-6 text-accent" />
            <span className="text-sm font-semibold">Delivery in ~{deliveryHours}h</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Phone className="h-6 w-6 text-accent" />
            <span className="text-sm font-semibold">MTN MoMo / Airtel Money</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Palette className="h-6 w-6 text-accent" />
            <span className="text-sm font-semibold">Written + Illustrated</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <span className="text-sm font-semibold">PDF on WhatsApp</span>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="container py-16" id="tiers">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Choose Your Service</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every book is written, illustrated and delivered as a beautiful PDF - you keep the
            rights and can publish it in the E Library store to earn from sales.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(Object.keys(TIER_META) as TierKey[]).map((key) => {
            const meta = TIER_META[key];
            const Icon = meta.icon;
            const popular = key === "star";
            return (
              <Card key={key} className={"relative flex flex-col " + (popular ? "border-gold shadow-lg" : "")}>
                {popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground gap-1">
                    <Star className="h-3 w-3" /> Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className={"h-6 w-6 " + (popular ? "text-gold" : "text-accent")} />
                    <CardTitle className="font-display">{meta.label}</CardTitle>
                  </div>
                  <CardDescription>{meta.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <p className="text-3xl font-bold mb-4">
                    {kwacha(fees[key])}
                    <span className="text-sm font-normal text-muted-foreground ml-1">one-off</span>
                  </p>
                  <ul className="space-y-2 mb-6 text-sm">
                    {meta.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-auto w-full" variant={popular ? "default" : "outline"} onClick={() => chooseTier(key)}>
                    Choose {meta.label}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 py-16">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { n: "1", icon: Send, title: "Send Your Idea", text: "Use the form below or message us on WhatsApp with your book idea - any topic, any length." },
              { n: "2", icon: Phone, title: "Approve Payment", text: "Pay securely with MTN Mobile Money or Airtel Money. A payment request is sent straight to your phone." },
              { n: "3", icon: PenLine, title: "We Write & Illustrate", text: "Our writers craft the story while illustrators create the cover and inside art - typically within " + deliveryHours + " hours." },
              { n: "4", icon: BookOpen, title: "PDF Delivered", text: "Your finished book lands in your WhatsApp chat as a PDF. Publish it in the store to earn from sales." },
            ].map((s) => (
              <div key={s.n} className="text-center p-6 rounded-xl bg-card border">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center relative">
                  <s.icon className="h-6 w-6 text-accent" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-gold-foreground text-xs font-bold flex items-center justify-center">{s.n}</span>
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Books We've Made</h2>
              <p className="text-muted-foreground">A taste of the books already published in the E Library.</p>
            </div>
            <Link to="/browse">
              <Button variant="ghost" className="gap-1 text-accent hover:text-accent/80">
                View Store <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {portfolio.map((ebook) => (
              <Link key={ebook.id} to={"/ebook/" + ebook.id} className="group">
                <div className="rounded-xl overflow-hidden border bg-card shadow-sm group-hover:shadow-md group-hover:border-accent transition-all aspect-[3/4]">
                  <img src={ebook.cover_url} alt={ebook.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <p className="mt-2 text-sm font-medium line-clamp-1">{ebook.title}</p>
                <p className="text-xs text-muted-foreground">{ebook.category}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Order form */}
      <section className="bg-primary text-primary-foreground py-16" ref={formRef} id="order">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold">Start Your Book Today</h2>
            <p className="text-primary-foreground/80 mt-2">
              Fill in your idea below - payment is only requested after we confirm your order.
            </p>
          </div>

          <Card className="bg-background text-foreground">
            <CardContent className="pt-6">
              {paymentStatus === "completed" ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-1">Payment Received!</p>
                  <p className="text-muted-foreground mb-4">
                    Your book is now in production with our writers and illustrators. Expect delivery in about{" "}
                    {deliveryHours} hours.
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">Order reference: {reference}</p>
                  <a href={waLink} target="_blank" rel="noreferrer">
                    <Button className="gap-2">
                      <MessageCircle className="h-4 w-4" /> Chat With Us on WhatsApp
                    </Button>
                  </a>
                </div>
              ) : paymentStatus === "failed" || paymentStatus === "timeout" ? (
                <div className="text-center py-10">
                  <p className="text-lg font-semibold mb-1">
                    {paymentStatus === "timeout" ? "Still Waiting for Payment" : "Payment Failed"}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {paymentStatus === "timeout"
                      ? "We could not confirm your payment yet. Your order is saved - approve it in your mobile money app or contact us on WhatsApp."
                      : "Please try again or reach us on WhatsApp for help."}
                  </p>
                  <Button onClick={() => setPaymentStatus(null)}>Try Again</Button>
                </div>
              ) : paymentStatus === "pending" || paymentStatus === "initiating" ? (
                <div className="text-center py-10">
                  <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-1">Waiting for Payment</p>
                  <p className="text-muted-foreground">
                    Check your phone and approve the payment request
                    {tier && " (" + kwacha(fees[tier]) + ")"}. We will confirm automatically.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <RadioGroup value={tier} onValueChange={(v) => setTier(v as TierKey)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(Object.keys(TIER_META) as TierKey[]).map((key) => {
                        const meta = TIER_META[key];
                        const Icon = meta.icon;
                        return (
                          <label
                            key={key}
                            className={
                              "flex flex-col items-start gap-1 rounded-lg border p-3 cursor-pointer transition-colors " +
                              (tier === key ? "border-accent bg-accent/5" : "hover:border-accent/50")
                            }
                          >
                            <RadioGroupItem value={key} className="sr-only" />
                            <Icon className="h-5 w-5 text-accent" />
                            <span className="text-sm font-semibold">{meta.label}</span>
                            <span className="text-xs text-muted-foreground">{kwacha(fees[key])}</span>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studio-name">Your Name (optional)</Label>
                      <Input id="studio-name" placeholder="e.g. Mwamba" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studio-phone">WhatsApp Number</Label>
                      <Input
                        id="studio-phone"
                        type="tel"
                        placeholder="0977XXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studio-idea">Your Book Idea</Label>
                    <Textarea
                      id="studio-idea"
                      rows={4}
                      placeholder="e.g. A bedtime story for my 6-year-old daughter about a brave little girl who learns that God is always with her, with gentle rhymes and bright jungle illustrations..."
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Be as detailed as you like - the more you share, the better the book.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "mtn" | "airtel")} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mtn" id="studio-mtn" />
                        <Label htmlFor="studio-mtn" className="cursor-pointer font-normal">MTN Mobile Money</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="airtel" id="studio-airtel" />
                        <Label htmlFor="studio-airtel" className="cursor-pointer font-normal">Airtel Money</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} size="lg">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Starting Your Book...
                      </>
                    ) : (
                      <>
                        <PenLine className="h-4 w-4 mr-2" /> Order My Book - {kwacha(fees[tier])}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    <Users className="h-3 w-3 inline mr-1" />
                    No account needed. You keep full rights to your book.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Prefer to Just Chat?</h2>
          <p className="text-muted-foreground mb-6">
            Message us on WhatsApp and describe your idea - we will handle the rest and send you a
            payment request when your book is ready to start.
          </p>
          <a href={waLink} target="_blank" rel="noreferrer">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 gap-2">
              <MessageCircle className="h-5 w-5" /> Message Us on WhatsApp
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Studio;
