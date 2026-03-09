import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Phone, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuthorWalletProps {
  userId: string;
}

const AuthorWallet = ({ userId }: AuthorWalletProps) => {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">("mtn");

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ["author-earnings", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("calculate_author_earnings", { _author_id: userId });
      if (error) throw error;
      return data?.[0] || { total_sales: 0, platform_fees: 0, net_earnings: 0, payout_requests_total: 0, available_balance: 0 };
    },
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useQuery({
    queryKey: ["author-payouts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const requestPayout = useMutation({
    mutationFn: async () => {
      if (!earnings || earnings.available_balance < 10000) {
        throw new Error("Minimum payout is K100");
      }
      const { error } = await supabase.from("payout_requests").insert({
        user_id: userId,
        amount: earnings.available_balance,
        phone_number: phone,
        payment_method: paymentMethod,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout request submitted!");
      queryClient.invalidateQueries({ queryKey: ["author-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["author-earnings"] });
      setPhone("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const availableKwacha = ((earnings?.available_balance || 0) / 100).toFixed(2);
  const canRequestPayout = (earnings?.available_balance || 0) >= 10000;

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-xl font-bold">K{((earnings?.total_sales || 0) / 100).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Platform Fees</p>
            <p className="text-xl font-bold text-destructive">-K{((earnings?.platform_fees || 0) / 100).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Net Earnings</p>
            <p className="text-xl font-bold">K{((earnings?.net_earnings || 0) / 100).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-xl font-bold text-green-600">K{availableKwacha}</p>
          </CardContent>
        </Card>
      </div>

      {/* Request Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          {!canRequestPayout ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Minimum not reached</p>
                <p className="text-sm text-muted-foreground">You need at least K100 available balance to request a payout. Current: K{availableKwacha}</p>
              </div>
            </div>
          ) : (
            <form className="space-y-4 max-w-md" onSubmit={(e) => { e.preventDefault(); requestPayout.mutate(); }}>
              <div className="p-4 rounded-lg bg-accent/10 text-center">
                <p className="text-sm text-muted-foreground">Payout Amount</p>
                <p className="text-2xl font-bold text-accent">K{availableKwacha}</p>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "mtn" | "airtel")} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mtn" id="payout-mtn" />
                    <Label htmlFor="payout-mtn" className="cursor-pointer font-normal">MTN Mobile Money</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="airtel" id="payout-airtel" />
                    <Label htmlFor="payout-airtel" className="cursor-pointer font-normal">Airtel Money</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout-phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="payout-phone" type="tel" placeholder="0977XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" required />
                </div>
              </div>

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={requestPayout.isPending}>
                {requestPayout.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Request Payout"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      {payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>K{(p.amount / 100).toLocaleString()}</TableCell>
                  <TableCell className="uppercase">{p.payment_method}</TableCell>
                  <TableCell>{p.phone_number}</TableCell>
                  <TableCell><Badge variant={statusColor(p.status) as any}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default AuthorWallet;
