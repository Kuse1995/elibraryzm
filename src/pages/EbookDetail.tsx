import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, BookOpen } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EbookDetail = () => {
  const { id } = useParams();
  const { addItem, items } = useCart();

  const { data: ebook, isLoading } = useQuery({
    queryKey: ["ebook", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  if (!ebook) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Ebook Not Found</h1>
        <Link to="/browse"><Button>Back to Browse</Button></Link>
      </div>
    );
  }

  const inCart = items.some((i) => i.id === ebook.id);

  const handleAdd = () => {
    addItem({ id: ebook.id, title: ebook.title, author: ebook.author, price: ebook.price, cover_url: ebook.cover_url || "" });
    toast.success(`"${ebook.title}" added to cart`);
  };

  return (
    <div className="container py-10">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Browse
      </Link>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-[3/4] bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
          {ebook.cover_url ? (
            <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <BookOpen className="h-24 w-24 text-muted-foreground/30" />
          )}
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-accent uppercase tracking-wider mb-2">{ebook.category}</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{ebook.title}</h1>
            <p className="text-lg text-muted-foreground">by {ebook.author}</p>
          </div>
          <div className="text-3xl font-bold text-accent">K{(ebook.price / 100).toLocaleString()}</div>
          <p className="text-muted-foreground leading-relaxed">{ebook.description}</p>
          <div className="flex gap-3">
            <Button size="lg" onClick={handleAdd} disabled={inCart} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <ShoppingCart className="h-5 w-5" />
              {inCart ? "Already in Cart" : "Add to Cart"}
            </Button>
            {inCart && <Link to="/cart"><Button size="lg" variant="outline">View Cart</Button></Link>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbookDetail;
