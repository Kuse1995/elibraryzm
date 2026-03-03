import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingCart, BookOpen } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const Cart = () => {
  const { items, removeItem, clearCart, total } = useCart();
  const [guestEmail, setGuestEmail] = useState("");

  const handleCheckout = () => {
    if (items.length === 0) return;
    // TODO: Integrate Lenco checkout
    toast.info("Payment integration coming soon! Lenco checkout will be connected.");
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-6">Browse our collection and add ebooks to your cart.</p>
        <Link to="/browse"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Browse Ebooks</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-8">Your Cart</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-16 h-20 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                {item.cover_url ? (
                  <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover rounded" />
                ) : (
                  <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.author}</p>
              </div>
              <span className="font-semibold whitespace-nowrap">₦{(item.price / 100).toLocaleString()}</span>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-accent">₦{(total / 100).toLocaleString()}</span>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Email for delivery (guest checkout)</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </div>

          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
            onClick={handleCheckout}
          >
            Pay with Lenco — ₦{(total / 100).toLocaleString()}
          </Button>

          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground">
              Clear Cart
            </Button>
            <Link to="/browse">
              <Button variant="ghost" size="sm" className="text-accent">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cart;
