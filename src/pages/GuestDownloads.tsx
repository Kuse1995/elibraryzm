import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface EbookDownload {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  download_url: string | null;
}

const GuestDownloads = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || "";
  const [email, setEmail] = useState("");
  const [ebooks, setEbooks] = useState<EbookDownload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !reference) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("guest-download-links", {
        body: { reference, email: email.trim() },
      });

      if (fnError) {
        setError("Failed to verify your purchase. Please try again.");
      } else if (data?.error) {
        setError(data.error);
      } else {
        setEbooks(data.ebooks || []);
        setFetched(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2">Download Your Ebooks</h1>
      <p className="text-muted-foreground mb-8">
        Enter the email you used during checkout to access your purchased ebooks.
      </p>

      {!fetched ? (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Payment Reference</label>
                <Input value={reference} disabled className="bg-muted" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter the email used at checkout"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Access Downloads
              </Button>
            </form>
          </CardContent>
        </Card>
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
                  <a href={ebook.download_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="w-full gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </a>
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

export default GuestDownloads;
