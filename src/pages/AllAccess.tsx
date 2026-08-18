import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Gamepad2, Sparkles, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * 2026-08-18 (Abraham's call): we don't charge for the gospel. Every ebook and
 * every Bible game on E Library is FREE - the only step is creating a free
 * account. This page used to sell the K10/month All-Access subscription; the
 * payment flow is retired. Paid services (designs, custom books from the
 * Studio) are separate and unchanged.
 */
const AllAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container max-w-2xl py-12">
      <div className="text-center mb-8">
        <Sparkles className="h-12 w-12 text-accent mx-auto mb-3" />
        <h1 className="font-display text-3xl font-bold">Everything is Free</h1>
        <p className="text-muted-foreground mt-2">
          "Freely you have received; freely give." — Matthew 10:8
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-center text-sm">
        {["Every ebook, free", "Every Bible game, free", "Just create a free account"].map((f) => (
          <div key={f} className="rounded-lg border bg-muted/30 p-3 flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="text-center py-10 space-y-4">
          <p className="text-lg font-semibold">
            {user ? "The whole library is yours 🙏" : "Create your free account and start reading 🙏"}
          </p>
          <p className="text-muted-foreground">
            All our Christian ebooks and Bible games are free for every family.
            An account simply keeps your downloads in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/browse")}>
              <BookOpen className="h-4 w-4 mr-2" /> Browse the Library
            </Button>
            <Button variant="outline" onClick={() => navigate("/games")}>
              <Gamepad2 className="h-4 w-4 mr-2" /> Play the Games
            </Button>
            {!user && (
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Create Free Account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllAccess;
