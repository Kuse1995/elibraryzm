import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, CheckCircle2 } from "lucide-react";

const WhatsAppSubscribe = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("whatsapp-optin", {
      body: { phone, source: "web-footer" },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Could not join right now");
      return;
    }
    setDone(true);
    toast.success("You're in! We'll send new free titles on WhatsApp.");
  };

  return (
    <div className="container max-w-lg py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-accent" />
            <CardTitle>Get Free Books on WhatsApp</CardTitle>
          </div>
          <CardDescription>
            New free books, devotionals and Bible games - straight to your WhatsApp. Everything is free, always.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>You're in. Watch for a welcome message soon.</span>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+260 97 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use international format starting with +.
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Joining..." : "Join on WhatsApp"}
              </Button>
              <p className="text-xs text-muted-foreground">
                You can opt out any time by replying STOP on WhatsApp.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppSubscribe;