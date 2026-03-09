import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, BarChart3, Shield, Loader2, DollarSign, ShoppingBag, Wallet } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AuthorDashboard = () => {
  const { user, isAuthor, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Submit form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);

  // Fetch author's books
  const { data: myBooks = [], isLoading: booksLoading } = useQuery({
    queryKey: ["author-books", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .eq("submitted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAuthor,
  });

  // Fetch sales data for author's approved books
  const { data: salesData = [] } = useQuery({
    queryKey: ["author-sales", user?.id],
    queryFn: async () => {
      const approvedBookIds = myBooks.filter(b => b.approval_status === "approved").map(b => b.id);
      if (approvedBookIds.length === 0) return [];

      const { data, error } = await supabase
        .from("order_items")
        .select("*, orders!inner(status, created_at)")
        .in("ebook_id", approvedBookIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAuthor && myBooks.length > 0,
  });

  const submitBook = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      let cover_url = "";
      let file_url = "";

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `author-${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("ebook-covers").upload(path, coverFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("ebook-covers").getPublicUrl(path);
        cover_url = urlData.publicUrl;
      }

      if (ebookFile) {
        const ext = ebookFile.name.split(".").pop();
        const path = `author-${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("ebook-files").upload(path, ebookFile);
        if (uploadErr) throw uploadErr;
        file_url = path;
      }

      const { error } = await supabase.from("ebooks").insert({
        title,
        author: author || user.user_metadata?.display_name || user.email?.split("@")[0] || "Unknown",
        category: category || "Devotionals",
        price: Math.round(parseFloat(price) * 100),
        description,
        featured: false,
        cover_url,
        file_url,
        submitted_by: user.id,
        approval_status: "pending",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book submitted for review!");
      queryClient.invalidateQueries({ queryKey: ["author-books"] });
      setTitle(""); setAuthor(""); setCategory(""); setPrice(""); setDescription("");
      setCoverFile(null); setEbookFile(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (authLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  if (!user || !isAuthor) {
    return (
      <div className="container py-20 text-center">
        <Shield className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Author Access Required</h1>
        <p className="text-muted-foreground mb-6">You need author privileges to access this portal.</p>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  const completedSales = salesData.filter((s: any) => s.orders?.status === "completed");
  const totalRevenue = completedSales.reduce((sum: number, s: any) => sum + s.price, 0);
  const totalSalesCount = completedSales.length;

  // Per-book breakdown
  const bookSales = myBooks
    .filter(b => b.approval_status === "approved")
    .map(book => {
      const bookItems = completedSales.filter((s: any) => s.ebook_id === book.id);
      return {
        ...book,
        salesCount: bookItems.length,
        revenue: bookItems.reduce((sum: number, s: any) => sum + s.price, 0),
      };
    });

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Author Portal</h1>
      <p className="text-muted-foreground mb-8">Manage your submissions and track sales</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10"><BookOpen className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">My Books</p><p className="text-2xl font-bold">{myBooks.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10"><ShoppingBag className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-bold">{totalSalesCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10"><DollarSign className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">K{(totalRevenue / 100).toLocaleString()}</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="books">
        <TabsList>
          <TabsTrigger value="books">My Books</TabsTrigger>
          <TabsTrigger value="submit">Submit Book</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="mt-6">
          {booksLoading ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : myBooks.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>You haven't submitted any books yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell><Badge variant="secondary">{book.category}</Badge></TableCell>
                      <TableCell>K{(book.price / 100).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusColor(book.approval_status as string) as any}>
                          {book.approval_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(book.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Submit a New Book</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4 max-w-xl" onSubmit={(e) => { e.preventDefault(); submitBook.mutate(); }}>
                <div className="space-y-2"><Label>Title</Label><Input placeholder="Book title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Author Name</Label><Input placeholder="Author name" value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Suggested Price (K)</Label><Input type="number" step="0.01" placeholder="e.g. 15.00" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe your book..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="space-y-2"><Label>Cover Image</Label><Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} /></div>
                <div className="space-y-2"><Label>Book File (PDF)</Label><Input type="file" accept=".pdf,.epub" onChange={(e) => setEbookFile(e.target.files?.[0] || null)} /></div>
                <p className="text-sm text-muted-foreground">Your book will be reviewed by our team before it appears on the website.</p>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={submitBook.isPending}>
                  {submitBook.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit for Review"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          {bookSales.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>No approved books yet. Sales data will appear here once your books are live.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Sales by Book</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookSales.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.salesCount}</TableCell>
                      <TableCell>K{(book.revenue / 100).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthorDashboard;
