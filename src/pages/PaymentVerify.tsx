import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [processed, setProcessed] = useState(false);
  const [resolvedStatus, setResolvedStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const urlStatus = searchParams.get("status");
  const reference = searchParams.get("reference");
  const errorMessage = searchParams.get("errorMessage");

  const status = resolvedStatus || urlStatus;
  const isSuccess = status === "successful" || status === "completed";
  const isFailed = status === "failed";
  const isPending = !isSuccess && !isFailed;

  const checkOrderStatus = useCallback(async () => {
    if (!reference) return null;
    try {
      const { data, error } = await supabase.functions.invoke("check-payment-status", {
        body: { reference },
      });
      if (error) {
        console.error("Status check error:", error);
        return null;
      }
      return data?.status || null;
    } catch (e) {
      console.error("Status check failed:", e);
      return null;
    }
  }, [reference]);

  // Poll when pending
  useEffect(() => {
    if (!isPending || !reference) return;

    const poll = async () => {
      const dbStatus = await checkOrderStatus();
      if (dbStatus === "completed") setResolvedStatus("completed");
      else if (dbStatus === "failed") setResolvedStatus("failed");
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isPending, reference, checkOrderStatus]);

  // Clear cart on success and auto-redirect
  useEffect(() => {
    if (isSuccess && !processed) {
      clearCart();
      setProcessed(true);
      const timer = setTimeout(() => navigate("/my-library"), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, processed, clearCart, navigate]);

  const handleManualCheck = async () => {
    setChecking(true);
    const dbStatus = await checkOrderStatus();
    if (dbStatus === "completed") setResolvedStatus("completed");
    else if (dbStatus === "failed") setResolvedStatus("failed");
    setChecking(false);
  };

  return (
    <div className="container py-20 max-w-lg text-center">
      <Card>
        <CardContent className="p-8 space-y-6">
          {isSuccess && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="font-display text-2xl font-bold">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Redirecting to your library...
              </p>
              <p className="text-sm text-muted-foreground">Reference: {reference}</p>
            </>
          )}

          {isFailed && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <h1 className="font-display text-2xl font-bold">Payment Failed</h1>
              <p className="text-muted-foreground">
                {errorMessage || "Something went wrong with your payment. Please try again."}
              </p>
              {reference && <p className="text-sm text-muted-foreground">Reference: {reference}</p>}
              <Link to="/browse"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Browse Ebooks</Button></Link>
            </>
          )}

          {isPending && (
            <>
              <Loader2 className="h-16 w-16 text-accent mx-auto animate-spin" />
              <h1 className="font-display text-2xl font-bold">Processing Payment...</h1>
              <p className="text-muted-foreground">
                Your payment is being processed. This page will update automatically.
              </p>
              <Button variant="outline" onClick={handleManualCheck} disabled={checking}>
                {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Check Payment Status
              </Button>
              <Link to="/browse"><Button variant="ghost">Continue Shopping</Button></Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentVerify;
