import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, RefreshCw, BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface EbookDownload {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  download_url: string | null;
}

const Downloads = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { user } = useAuth();

  const reference = searchParams.get("reference") || "";
  const urlStatus = searchParams.get("status");

  const [paymentStatus, setPaymentStatus] = useState<string>(urlStatus || "pending");
  const [ebooks, setEbooks] = useState<EbookDownload[]>([]);
  const [guestEmail, setGuestEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartCleared, setCartCleared] = useState(false);
  const [checking, setChecking] = useState(false);

  const isCompleted = paymentStatus === "completed" || paymentStatus === "successful";
  const isFailed = paymentStatus === "failed";
  const isPending = !isCompleted && !isFailed;

  // Poll payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!reference) return null;
    try {
      const { data, error } = await supabase.functions.invoke("check-payment-status", {
        body: { reference },
      });
      if (error) return null;
      return data?.status || null;
    } catch {
      return null;
    }
  }, [reference]);

  useEffect(() => {
    if (!isPending || !reference) return;

    const poll = async () => {
      const status = await checkPaymentStatus();
      if (status === "completed" || status === "successful") setPaymentStatus("completed");
      else if (status === "failed") setPaymentStatus("failed");
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isPending, reference, checkPaymentStatus]);

  // Clear cart on success
  useEffect(() => {
    if (isCompleted && !cartCleared) {
      clearCart();
      setCartCleared(true);
    }
  }, [isCompleted, cartCleared, clearCart]);

  // Auto-fetch for logged-in users
  useEffect(() => {
    if (!isCompleted || !user || !reference) return;
    fetchLoggedInDownloads();
  }, [isCompleted, user, reference]);

  const fetchLoggedInDownloads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("guest-download-links", {
        body: { reference, email: user!.email },
      });
      if (fnError || data?.error) {
        setError(data?.error || "Failed to load downloads.");
      } else {
        setEbooks(data.ebooks || []);
      }
    } catch {
      setError("Something went wrong loading your downloads.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim() || !reference) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("guest-download-links", {
        body: { reference, email: guestEmail.trim() },
      });
      if (fnError || data?.error) {
        setError(data?.error || "Failed to verify your purchase.");
      } else {
        setEbooks(data.ebooks || []);
        setEmailSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    const status = await checkPaymentStatus();
    if (status === "completed" || status === "successful") setPaymentStatus("completed");
    else if (status === "failed") setPaymentStatus("failed");
    setChecking(false);
  };

  // PENDING STATE
  if (isPending) {
    return (
      <div className="container py-20 max-w-lg text-center">
        <Card>
          <CardContent className="p-8 space-y-6">
            <Loader2 className="h-16 w-16 text-accent mx-auto animate-spin" />
            <h1 className="font-display text-2xl font-bold">Processing Payment...</h1>
            <p className="text-muted-foreground">
              Please check your phone and approve the payment prompt. This page will update automatically.
            </p>
            {reference && <p className="text-sm text-muted-foreground">Reference: {reference}</p>}
            <Button variant="outline" onClick={handleManualCheck} disabled={checking}>
              {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Check Status
            </Button>
            <Link to="/browse">
              <Button variant="ghost">Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FAILED STATE
  if (isFailed) {
    return (
      <div className="container py-20 max-w-lg text-center">
        <Card>
          <CardContent className="p-8 space-y-6">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="font-display text-2xl font-bold">Payment Failed</h1>
            <p className="text-muted-foreground">
              Something went wrong with your payment. Please try again.
            </p>
            {reference && <p className="text-sm text-muted-foreground">Reference: {reference}</p>}
            <Link to="/browse">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Browse Ebooks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // COMPLETED — show downloads
  return (
    <div className="container py-10 max-w-2xl">
      <div className="text-center mb-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h1 className="font-display text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground">
          Thank you for your purchase! Your ebooks are now in your library.
        </p>
        {reference && <p className="text-sm text-muted-foreground mt-1">Reference: {reference}</p>}
        <Link to="/my-library">
          <Button size="lg" className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
            <BookOpen className="h-5 w-5" /> Go to My Library
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground mt-3">
          You can always access your purchased ebooks from <strong>My Library</strong>.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading your downloads...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={fetchLoggedInDownloads}>Retry</Button>
        </div>
      ) : ebooks.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No downloadable ebooks found for this order.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {ebooks.map((ebook) => (
            <Card key={ebook.id} className="overflow-hidden">
              <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
                {ebook.cover_url ? (
                  <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-display font-semibold">{ebook.title}</h3>
                <p className="text-sm text-muted-foreground">{ebook.author}</p>
                {ebook.download_url ? (
                  <Button
                    size="sm"
                    className="w-full gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={async () => {
                      try {
                        const response = await fetch(ebook.download_url!);
                        if (!response.ok) throw new Error("download_failed");

                        const blob = await response.blob();
                        const objectUrl = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = objectUrl;
                        link.download = `${ebook.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        URL.revokeObjectURL(objectUrl);
                      } catch {
                        window.open(ebook.download_url!, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <Download className="h-4 w-4" /> Download
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Download not available</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Downloads;
