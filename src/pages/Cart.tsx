import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Gift } from "lucide-react";

/**
 * 2026-08-18 (Abraham's call): every ebook is free, so there is no checkout
 * anymore. The route stays so old links land somewhere honest. Downloading
 * happens straight from each book's page with a free account.
 */
const Cart = () => {
  return (
    <div className="container py-20 text-center">
      <Gift className="h-16 w-16 text-accent mx-auto mb-4" />
      <h1 className="font-display text-2xl font-bold mb-2">No Cart Needed — Everything is Free</h1>
      <p className="text-muted-foreground mb-6">
        Every ebook on E Library is free. Just create a free account and download from any book's page.
      </p>
      <Link to="/browse">
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <BookOpen className="h-4 w-4 mr-2" /> Browse the Library
        </Button>
      </Link>
    </div>
  );
};

export default Cart;
