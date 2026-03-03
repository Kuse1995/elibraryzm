import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingCart, BookOpen, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Cart = () => {
  const { items, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardExpiryMonth, setCardExpiryMonth] = useState("");
  const [cardExpiryYear, setCardExpiryYear] = useState("");

  // Billing fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const email = user?.email || guestEmail;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!cardNumber || !cardCvv || !cardExpiryMonth || !cardExpiryYear) {
      toast.error("Please fill in all card details");
      return;
    }
    if (!firstName || !lastName) {
      toast.error("Please enter your first and last name");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("initiate-payment", {
        body: {
          items: items.map((i) => ({ id: i.id })),
          email,
          userId: user?.id || null,
          card: {
            number: cardNumber,
            cvv: cardCvv,
            expiryMonth: cardExpiryMonth,
            expiryYear: cardExpiryYear,
          },
          billing: {
            firstName,
            lastName,
            streetAddress: streetAddress || "N/A",
            city: city || "Lagos",
            postalCode: postalCode || "100001",
            country: "NG",
          },
        },
      });

      if (error) throw new Error(error.message);

      if (data.status === "3ds-redirect" && data.redirectUrl) {
        // Redirect to 3DS authentication
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.status === "success") {
        clearCart();
        toast.success("Payment successful!");
        navigate(`/payment-verify?status=successful&reference=${data.reference}`);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Pending
      toast.info("Payment is being processed...");
      navigate(`/payment-verify?status=pending&reference=${data.reference}`);
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
        <CardContent className="p-6 space-y-5">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-accent">₦{(total / 100).toLocaleString()}</span>
          </div>

          {!user && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email for delivery</label>
              <Input type="email" placeholder="your@email.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Billing Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <Input placeholder="Street Address" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input placeholder="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Card Details</h3>
            <Input
              placeholder="Card Number *"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))}
              maxLength={19}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="MM *" value={cardExpiryMonth} onChange={(e) => setCardExpiryMonth(e.target.value.replace(/\D/g, ""))} maxLength={2} />
              <Input placeholder="YY *" value={cardExpiryYear} onChange={(e) => setCardExpiryYear(e.target.value.replace(/\D/g, ""))} maxLength={4} />
              <Input placeholder="CVV *" type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))} maxLength={4} />
            </div>
          </div>

          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
            ) : (
              <>Pay ₦{(total / 100).toLocaleString()}</>
            )}
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
