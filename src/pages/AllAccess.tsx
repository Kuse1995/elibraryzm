import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen, Phone, Loader2, CheckCircle, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useReaderSubscription } from "@/hooks/useReaderSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Plan = "monthly" | "yearly";

const AllAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const { isActive, expiresAt, refetch: refetchSub } = useReaderSubscription();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan>("yearly");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">("mtn");
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: fees } = useQuery({
    queryKey: ["site-settings", "reader-fees"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["reader_subscription_fee_monthly", "reader_subscription_fee_yearly"]);
      return {
        monthly: parseInt(data?.find((s) => s.key === "reader_subscription_fee_monthly")?.value || "1000") / 100,
        yearly: parseInt(data?.find((s) => s.key === "reader_subscription_fee_yearly")?.value || "10000") / 100,
      };
    },
  });

  const monthlyK = (fees?.monthly ?? 10).toFixed(0);
  const yearlyK = (fees?.yearly ?? 100).toFixed(0);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const onActivated = () => {
    setPaymentStatus("completed");
    refetchSub();
    toast.success("All-Access activated! Enjoy the whole library. God bless you!");
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
        const { data, error } = await supabase.functions.invoke("reader-subscription", {
          body: { action: "check-status", reference: ref, userId: user!.id, plan },
        });
        if (error) return;
        if (data?.status === "completed") {
          clearInterval(pollRef.current!);
          onActivated();
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
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (!phone) {
      toast.error("Enter your mobile money number");
      return;
    }

    setLoading(true);
    setPaymentStatus("initiating");

    try {
      const { data, error } = await supabase.functions.invoke("reader-subscription", {
        body: { userId: user.id, phone, paymentMethod, plan },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.status === "successful") {
        onActivated();
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

  if (authLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <Sparkles className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">All-Access Library</h1>
        <p className="text-muted-foreground mb-6">
          Create a free account, then unlock everything for K{monthlyK} a month.
        </p>
        <Button onClick={() => navigate("/auth")} className="bg-accent text-accent-foreground hover:bg-accent/90">
          Create Free Account
        </Button>
      </div>
    );
  }

  const priceLabel = plan === "monthly" ? `K${monthlyK}/month` : `K${yearlyK}/year`;

  return (
    <div className="container max-w-2xl py-12">
      <div className="text-center mb-8">
        <Sparkles className="h-12 w-12 text-accent mx-auto mb-3" />
        <h1 className="font-display text-3xl font-bold">All-Access Library</h1>
        <p className="text-muted-foreground mt-2">
          Every ebook. Every game. New titles every month. One small price.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-center text-sm">
        {["Every ebook included", "Every Bible game included", "New titles every month"].map((f) => (
          <div key={f} className="rounded-lg border bg-muted/30 p-3 flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      {paymentStatus === "completed" || isActive ? (
        <Card>
          <CardContent className="text-center py-10">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">You have All-Access!</p>
            {expiresAt && (
              <p className="text-muted-foreground mt-1">Active until {expiresAt.toLocaleDateString()}.</p>
            )}
            {isActive && paymentStatus !== "completed" && (
              <p className="text-sm text-muted-foreground mt-3">
                Paying again simply adds more time on top - you never lose days you've paid for.
              </p>
            )}
            <Button className="mt-6" onClick={() => navigate("/browse")}>
              <BookOpen className="h-4 w-4 mr-2" /> Start Reading
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose your plan</CardTitle>
            <CardDescription>Cancel anytime. We never auto-charge your phone.</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStatus === "failed" ? (
              <div className="text-center py-6">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                <p className="font-semibold">Payment Failed</p>
                <Button className="mt-4" variant="outline" onClick={() => setPaymentStatus(null)}>
                  Try Again
                </Button>
              </div>
            ) : paymentStatus === "pending" ? (
              <div className="text-center py-6">
                <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-3" />
                <p className="font-semibold">Waiting for Payment</p>
                <p className="text-muted-foreground mt-1">
                  Check your phone and approve the {priceLabel} payment request.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlan("yearly")}
                    className={`relative rounded-lg border-2 p-4 text-left transition-colors ${
                      plan === "yearly" ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                    }`}
                  >
                    <span className="absolute -top-2.5 left-3 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold px-2 py-0.5">
                      BEST VALUE - 2 MONTHS FREE
                    </span>
                    <p className="text-sm text-muted-foreground">Yearly</p>
                    <p className="text-2xl font-bold">K{yearlyK}</p>
                    <p className="text-xs text-muted-foreground">per year</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlan("monthly")}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      plan === "monthly" ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                    }`}
                  >
                    <p className="text-sm text-muted-foreground">Monthly</p>
                    <p className="text-2xl font-bold">K{monthlyK}</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as "mtn" | "airtel")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mtn" id="sub-mtn" />
                      <Label htmlFor="sub-mtn" className="cursor-pointer font-normal">
                        MTN Mobile Money
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="airtel" id="sub-airtel" />
                      <Label htmlFor="sub-airtel" className="cursor-pointer font-normal">
                        Airtel Money
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Money Number</Label>
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

                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${priceLabel} & Unlock Everything`
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You approve every payment on your phone - nothing is ever charged automatically.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AllAccess;
