import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, BookOpen, Loader2, Phone, Gift, Download } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReaderSubscription } from "@/hooks/useReaderSubscription";

const normalizeZambianMobileMoneyNumber = (raw: string, method: "mtn" | "airtel") => {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("260") ? `0${digits.slice(3)}` : digits;
  const mtnPrefixes = ["096", "076"];
  const airtelPrefixes = ["097", "077"];
  const prefixes = method === "mtn" ? mtnPrefixes : airtelPrefixes;
  const network = method === "mtn" ? "MTN" : "Airtel";

  if (!/^0\d{9}$/.test(local)) {
    return { error: `Enter a valid 10-digit Zambian ${network} number, e.g. ${method === "mtn" ? "096" : "097"}1234567.` };
  }
  if (!prefixes.includes(local.slice(0, 3))) {
    return { error: `${network} numbers should start with ${prefixes.join(" or ")}.` };
  }
  return { phone: local };
};

const EbookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive: readerActive } = useReaderSubscription();

  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">("mtn");
  const [loading, setLoading] = useState(false);
  const [includeUpsell, setIncludeUpsell] = useState(false);

  const { data: ebook, isLoading } = useQuery({
    queryKey: ["ebook", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch discount percentage from site_settings
  const { data: discountPercent = 50 } = useQuery({
    queryKey: ["site-settings", "upsell_discount_percent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "upsell_discount_percent").single();
      if (error) return 50;
      return parseInt(data.value) || 50;
    },
  });

  // Fetch a suggested upsell ebook (same category first, fallback to any)
  const { data: upsellEbook } = useQuery({
    queryKey: ["upsell-ebook", id, ebook?.category],
    queryFn: async () => {
      // Try same category first
      const { data: sameCat } = await supabase
        .from("ebooks")
        .select("id, title, author, price, cover_url, category")
        .eq("category", ebook!.category)
        .neq("id", id!)
        .limit(5);

      if (sameCat && sameCat.length > 0) {
        return sameCat[Math.floor(Math.random() * sameCat.length)];
      }

      // Fallback: any other ebook
      const { data: anyBook } = await supabase
        .from("ebooks")
        .select("id, title, author, price, cover_url, category")
        .neq("id", id!)
        .limit(5);

      if (anyBook && anyBook.length > 0) {
        return anyBook[Math.floor(Math.random() * anyBook.length)];
      }

      return null;
    },
    enabled: !!ebook,
  });

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  if (!ebook) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Ebook Not Found</h1>
        <Link to="/browse"><Button>Back to Browse</Button></Link>
      </div>
    );
  }

  const upsellPrice = upsellEbook ? Math.floor(upsellEbook.price * (100 - discountPercent) / 100) : 0;
  const displayTotal = includeUpsell && upsellEbook
    ? ebook.price + upsellPrice
    : ebook.price;

  const handleBuyNow = async () => {
    if (!user) {
      toast.error("Please sign in to purchase");
      return;
    }
    const normalized = normalizeZambianMobileMoneyNumber(phone, paymentMethod);
    if (normalized.error || !normalized.phone) {
      toast.error(normalized.error || "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const items = [{ id: ebook.id }];
      const discountItems = includeUpsell && upsellEbook ? [{ id: upsellEbook.id }] : [];

      const { data, error } = await supabase.functions.invoke("initiate-payment", {
        body: {
          items,
          discountItems,
          email: user.email,
          userId: user.id,
          paymentMethod,
          phone: normalized.phone,
        },
      });

      if (error) {
        try {
          const ctx: any = (error as any).context;
          if (ctx?.text) {
            const body = await ctx.text();
            const parsed = JSON.parse(body);
            throw new Error(parsed.error || parsed.failure_reason || error.message);
          }
        } catch (parseErr: any) {
          if (parseErr?.message) throw parseErr;
        }
        throw error;
      }

      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        status: data.status || "pending",
        reference: data.reference || "",
      });
      navigate(`/payment-verify?${params.toString()}`);
    } catch (err: any) {
      toast.error(err.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Browse
      </Link>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-[3/4] bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
          {ebook.cover_url ? (
            <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <BookOpen className="h-24 w-24 text-muted-foreground/30" />
          )}
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-accent uppercase tracking-wider mb-2">{ebook.category}</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{ebook.title}</h1>
            <p className="text-lg text-muted-foreground">by {ebook.author}</p>
          </div>
          <div className="text-3xl font-bold text-accent">
            {ebook.price === 0 ? "Free" : readerActive ? "Included" : `K${(ebook.price / 100).toLocaleString()}`}
          </div>
          <p className="text-muted-foreground leading-relaxed">{ebook.description}</p>

          {/* Upsell Offer — hide for free items */}
          {ebook.price > 0 && upsellEbook && (
            <div className="border border-accent/30 rounded-lg p-4 bg-accent/5 space-y-3">
              <div className="flex items-center gap-2 text-accent font-semibold">
                <Gift className="h-5 w-5" />
                <span>Special Offer — {discountPercent}% Off!</span>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={includeUpsell}
                  onCheckedChange={(checked) => setIncludeUpsell(!!checked)}
                  className="mt-1"
                />
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {upsellEbook.cover_url ? (
                    <img
                      src={upsellEbook.cover_url}
                      alt={upsellEbook.title}
                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">Add "{upsellEbook.title}"</p>
                    <p className="text-sm text-muted-foreground">by {upsellEbook.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground line-through">
                        K{(upsellEbook.price / 100).toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-accent">
                        K{(upsellPrice / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Buy / Download Form */}
          {ebook.price === 0 || readerActive ? (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold">
                {readerActive && ebook.price !== 0 ? "Included with All-Access" : "Download Free"}
              </h3>
              {!user ? (
                <div className="text-center space-y-4 py-4">
                  <p className="text-muted-foreground">
                    Create an account to download. Your resources will be saved to your library.
                  </p>
                  <Link to={`/auth?redirect=/ebook/${id}`}>
                    <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Create Account to Download
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                  disabled={loading}
                  onClick={async () => {
                    if (!ebook.file_url) {
                      toast.error("File not available yet");
                      return;
                    }
                    setLoading(true);
                    try {
                      const { data: linkData, error } = await supabase.functions.invoke("download-link", {
                        body: { ebookId: ebook.id },
                      });
                      if (error || linkData?.error || !linkData?.download_url) {
                        throw new Error(linkData?.error || "Could not generate download link");
                      }
                      const response = await fetch(linkData.download_url);
                      if (!response.ok) throw new Error("Download failed");
                      const blob = await response.blob();
                      const objectUrl = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = objectUrl;
                      a.download = `${ebook.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(objectUrl);
                      toast.success("Download started!");
                    } catch (err: any) {
                      toast.error(err.message || "Download failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                  <>
                    <Download className="h-5 w-5" />
                    {readerActive && ebook.price !== 0 ? "Download Now" : "Download Free"}
                  </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold">Buy Now</h3>

              <Link to="/all-access">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <Gift className="h-4 w-4" />
                  Get All-Access — every book + all games, K10/month or K100/year
                </Button>
              </Link>

              {!user ? (
                <div className="text-center space-y-4 py-4">
                  <p className="text-muted-foreground">
                    Create an account to purchase. Your ebooks will be saved to your library forever.
                  </p>
                  <Link to={`/auth?redirect=/ebook/${id}`}>
                    <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Create Account to Purchase
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={paymentMethod === "mtn" ? "0961234567" : "0971234567"}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={paymentMethod === "mtn" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaymentMethod("mtn")}
                        className={paymentMethod === "mtn" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}
                      >
                        MTN
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMethod === "airtel" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaymentMethod("airtel")}
                        className={paymentMethod === "airtel" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                      >
                        Airtel
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleBuyNow}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Buy Now — K${(displayTotal / 100).toLocaleString()}`
                    )}
                  </Button>

                  {includeUpsell && upsellEbook && (
                    <p className="text-xs text-muted-foreground text-center">
                      Includes "{upsellEbook.title}" at {discountPercent}% off
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EbookDetail;
