import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingCart, BookOpen, Loader2, Smartphone, Ban } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Cart = () => {
  const { items, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");

  const email = user?.email || guestEmail;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!phone) {
      toast.error("Please enter your mobile money phone number");
      return;
    }
    if (paymentMethod === "bank") {
      toast.info("Bank transfers are coming soon!");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("initiate-payment", {
        body: {
          items: items.map((i) => ({ id: i.id })),
          email,
          userId: user?.id || null,
          paymentMethod,
          phone,
        },
      });

      if (error) throw new Error(error.message);

      if (data.status === "successful") {
        clearCart();
        toast.success("Payment successful!");
        navigate(`/payment-verify?status=successful&reference=${data.reference}`);
        return;
      }

      if (data.status === "pay-offline") {
        toast.info("Please check your phone and approve the payment to complete the transaction.");
        navigate(`/payment-verify?status=pending&reference=${data.reference}`);
        return;
      }

      if (data.status === "otp-required") {
        toast.info("An OTP has been sent to your phone. Please complete payment.");
        navigate(`/payment-verify?status=otp&reference=${data.reference}&lencoReference=${data.lencoReference}`);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

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
              <span className="font-semibold whitespace-nowrap">K{(item.price / 100).toLocaleString()}</span>
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
            <span className="text-accent">K{(total / 100).toLocaleString()}</span>
          </div>

          {!user && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email for delivery</label>
              <Input type="email" placeholder="your@email.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Payment Method</h3>
            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="w-full">
                <TabsTrigger value="mtn" className="flex-1 gap-2">
                  <Smartphone className="h-4 w-4" /> MTN MoMo
                </TabsTrigger>
                <TabsTrigger value="airtel" className="flex-1 gap-2">
                  <Smartphone className="h-4 w-4" /> Airtel Money
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex-1 gap-2" disabled>
                  <Ban className="h-4 w-4" /> Bank Transfer
                  <Badge variant="secondary" className="text-xs ml-1">Soon</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mtn" className="mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">MTN Mobile Money Number</label>
                  <Input
                    type="tel"
                    placeholder="e.g. 0971234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                    maxLength={15}
                  />
                </div>
              </TabsContent>

              <TabsContent value="airtel" className="mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Airtel Money Number</label>
                  <Input
                    type="tel"
                    placeholder="e.g. 0971234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                    maxLength={15}
                  />
                </div>
              </TabsContent>

              <TabsContent value="bank" className="mt-4">
                <div className="text-center py-6 text-muted-foreground">
                  <Ban className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="font-medium">Bank Transfer Coming Soon</p>
                  <p className="text-sm">We're working on adding bank transfer support.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
            onClick={handleCheckout}
            disabled={loading || paymentMethod === "bank"}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
            ) : (
              <>Pay K{(total / 100).toLocaleString()}</>
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
