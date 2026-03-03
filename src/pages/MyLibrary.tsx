import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const MyLibrary = () => {
  // TODO: fetch purchased ebooks from database
  const purchases: any[] = [];

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold mb-2">My Library</h1>
      <p className="text-muted-foreground mb-8">Your purchased ebooks — download anytime.</p>

      {purchases.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">No Purchases Yet</h2>
          <p className="text-muted-foreground mb-6">
            Once you purchase ebooks, they'll appear here for download.
          </p>
          <Link to="/browse">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Browse Ebooks
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Purchased ebook cards will go here */}
        </div>
      )}
    </div>
  );
};

export default MyLibrary;
