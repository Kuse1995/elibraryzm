import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen, Phone, Loader2, CheckCircle, Crown, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const UpgradeToAuthor = () => {
  const { user, isAuthor, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">("mtn");
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: subscriptionFee } = useQuery({
    queryKey: ["site-settings", "author_subscription_fee"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "author_subscription_fee").single();
      return parseInt(data?.value || "5000");
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("subscription_expires_at").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const feeKwacha = ((subscriptionFee || 5000) / 100).toFixed(2);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
        const { data, error } = await supabase.functions.invoke("subscription-payment", {
          body: { action: "check-status", reference: ref, userId: user!.id },
        });
        if (error) return;
        if (data?.status === "completed") {
          clearInterval(pollRef.current!);
          setPaymentStatus("completed");
          toast.success("Author subscription activated!");
          setTimeout(() => navigate("/author"), 2000);
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
    if (!user) { toast.error("Please sign in first"); return; }
    if (!phone) { toast.error("Enter your phone number"); return; }

    setLoading(true);
    setPaymentStatus("initiating");

    try {
      const { data, error } = await supabase.functions.invoke("subscription-payment", {
        body: { userId: user.id, phone, paymentMethod },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReference(data.reference);

      if (data.status === "successful") {
        setPaymentStatus("completed");
        toast.success("Author subscription activated!");
        setTimeout(() => navigate("/author"), 2000);
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

  if (authLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <Crown className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Become an Author</h1>
        <p className="text-muted-foreground mb-6">Sign in to subscribe as an author and start publishing.</p>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  if (isAuthor && profile?.subscription_expires_at) {
    const expiresAt = new Date(profile.subscription_expires_at);
    const isActive = expiresAt > new Date();
    if (isActive) {
      return (
        <div className="container py-20 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">You're Already an Author!</h1>
          <p className="text-muted-foreground mb-2">Your subscription is active until {expiresAt.toLocaleDateString()}.</p>
          <Button onClick={() => navigate("/author")} className="mt-4">Go to Author Dashboard</Button>
        </div>
      );
    }
  }

  // Grandfathered authors (no subscription_expires_at but has author role)
  if (isAuthor && !profile?.subscription_expires_at) {
    return (
      <div className="container py-20 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Grandfathered Author</h1>
        <p className="text-muted-foreground mb-2">You have lifetime author access with a reduced platform fee of 10%.</p>
        <Button onClick={() => navigate("/author")} className="mt-4">Go to Author Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-12">
      <div className="text-center mb-8">
        <Crown className="h-12 w-12 text-accent mx-auto mb-3" />
        <h1 className="font-display text-3xl font-bold">Become an Author</h1>
        <p className="text-muted-foreground mt-2">
          Subscribe for K{feeKwacha}/year to publish and sell your ebooks on our platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Author Subscription</CardTitle>
          <CardDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>Publish unlimited ebooks</li>
              <li>Track your sales & revenue</li>
              <li>Request payouts via Mobile Money</li>
              <li>15% platform fee on sales</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentStatus === "completed" ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold">Subscription Activated!</p>
              <p className="text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
          ) : paymentStatus === "failed" ? (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold">Payment Failed</p>
              <Button className="mt-4" onClick={() => setPaymentStatus(null)}>Try Again</Button>
            </div>
          ) : paymentStatus === "pending" ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
              <p className="text-lg font-semibold">Waiting for Payment</p>
              <p className="text-muted-foreground">Check your phone and approve the payment of K{feeKwacha}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-lg bg-accent/10 text-center">
                <p className="text-sm text-muted-foreground">Yearly Subscription</p>
                <p className="text-3xl font-bold text-accent">K{feeKwacha}</p>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "mtn" | "airtel")} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mtn" id="mtn" />
                    <Label htmlFor="mtn" className="cursor-pointer font-normal">MTN Mobile Money</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="airtel" id="airtel" />
                    <Label htmlFor="airtel" className="cursor-pointer font-normal">Airtel Money</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0977XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</> : `Pay K${feeKwacha} & Subscribe`}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradeToAuthor;
