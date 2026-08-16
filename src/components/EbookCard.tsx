import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, BookOpen, Download } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type Ebook = Tables<"ebooks">;

const EbookCard = ({ ebook }: { ebook: Ebook }) => {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.id === ebook.id);
  const isFree = ebook.price === 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: ebook.id, title: ebook.title, author: ebook.author, price: ebook.price, cover_url: ebook.cover_url || "" });
    toast.success(`"${ebook.title}" added to cart`);
  };

  return (
    <Link to={`/ebook/${ebook.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full">
        <div className="aspect-[3/4] bg-secondary flex items-center justify-center overflow-hidden">
          {ebook.cover_url ? (
            <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="h-16 w-16 text-muted-foreground/40" />
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-medium text-accent uppercase tracking-wider">{ebook.category}</p>
          <h3 className="font-display font-semibold text-base leading-tight line-clamp-2 group-hover:text-accent transition-colors">{ebook.title}</h3>
          <p className="text-sm text-muted-foreground">{ebook.author}</p>
          <div className="flex items-center justify-between pt-2">
            {isFree ? (
              <span className="font-semibold text-lg text-accent">Free</span>
            ) : (
              <span className="font-semibold text-lg">K{(ebook.price / 100).toLocaleString()}</span>
            )}
            {isFree ? (
              <Button size="sm" variant="default" className="gap-1">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            ) : (
              <Button size="sm" variant={inCart ? "secondary" : "default"} onClick={handleAdd} disabled={inCart} className="gap-1">
                <ShoppingCart className="h-3.5 w-3.5" />
                {inCart ? "Added" : "Add"}
              </Button>
            )}
          </div>
          {!isFree && (
            <p className="text-xs text-muted-foreground">Included in All-Access · K10/month</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default EbookCard;
