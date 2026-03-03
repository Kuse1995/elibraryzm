import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BookOpen, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const EbookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">("mtn");
  const [loading, setLoading] = useState(false);

  const { data: ebook, isLoading } = useQuery({
    queryKey: ["ebook", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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

  const handleBuyNow = async () => {
    const buyerEmail = user?.email || email;
    if (!buyerEmail) {
      toast.error("Please enter your email address");
      return;
    }
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("initiate-payment", {
        body: {
          items: [{ id: ebook.id }],
          email: buyerEmail,
          userId: user?.id || null,
          paymentMethod,
          phone,
        },
      });

      if (error) throw error;

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
          <div className="text-3xl font-bold text-accent">K{(ebook.price / 100).toLocaleString()}</div>
          <p className="text-muted-foreground leading-relaxed">{ebook.description}</p>

          {/* Buy Now Form */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold">Buy Now</h3>

            {!user && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0977123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                `Buy Now — K${(ebook.price / 100).toLocaleString()}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbookDetail;
