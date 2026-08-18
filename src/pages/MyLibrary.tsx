import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MyLibrary = () => {
  const { user } = useAuth();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["my-purchases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*, ebook:ebooks(*), order:orders!inner(*)")
        .eq("order.user_id", user!.id)
        .eq("order.status", "completed");
      if (error) throw error;

      // Generate signed URLs for private ebook files
      const withSignedUrls = await Promise.all(
        (data || []).map(async (item: any) => {
          if (item.ebook?.file_url) {
            const filePath = item.ebook.file_url.replace(/^\//, "").replace(/^ebook-files\//, "");
            const { data: urlData } = await supabase.storage
              .from("ebook-files")
              .createSignedUrl(filePath, 900);
            return { ...item, ebook: { ...item.ebook, signed_url: urlData?.signedUrl || null } };
          }
          return { ...item, ebook: { ...item.ebook, signed_url: null } };
        })
      );
      return withSignedUrls;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Sign In Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your ebook history.</p>
        <Link to="/auth"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold mb-2">My Library</h1>
      <p className="text-muted-foreground mb-8">Your ebook history — download anytime.</p>

      <Card className="mb-8 border-accent/30">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Everything is Free</p>
              <p className="text-sm text-muted-foreground">
                Every ebook and every game is free with your account. Downloads from any
                book's page are saved to your device.
              </p>
            </div>
          </div>
          <Link to="/browse" className="shrink-0">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Browse Ebooks
            </Button>
          </Link>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading your library...</div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">No Downloads Yet</h2>
          <p className="text-muted-foreground mb-6">Every book is free — grab your first one from the library.</p>
          <Link to="/browse"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Browse Ebooks</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {purchases.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
                {item.ebook?.cover_url ? (
                  <img src={item.ebook.cover_url} alt={item.ebook.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-display font-semibold">{item.ebook?.title}</h3>
                <p className="text-sm text-muted-foreground">{item.ebook?.author}</p>
                {item.ebook?.signed_url && (
                  <a href={item.ebook.signed_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="w-full gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLibrary;
