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
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus, BookOpen, ShoppingBag, DollarSign, Shield } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);

  const { data: ebooks = [], isLoading } = useQuery({
    queryKey: ["admin-ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const addEbook = useMutation({
    mutationFn: async () => {
      let cover_url = "";
      let file_url = "";

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("ebook-covers").upload(path, coverFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("ebook-covers").getPublicUrl(path);
        cover_url = urlData.publicUrl;
      }

      if (ebookFile) {
        const ext = ebookFile.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("ebook-files").upload(path, ebookFile);
        if (uploadErr) throw uploadErr;
        file_url = path;
      }

      const { error } = await supabase.from("ebooks").insert({
        title,
        author,
        category: category || "Devotionals",
        price: Math.round(parseFloat(price) * 100),
        description,
        featured,
        cover_url,
        file_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ebook added successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-ebooks"] });
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
      setTitle(""); setAuthor(""); setCategory(""); setPrice(""); setDescription(""); setFeatured(false);
      setCoverFile(null); setEbookFile(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteEbook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ebooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ebook deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-ebooks"] });
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (authLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="container py-20 text-center">
        <Shield className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Admin Access Required</h1>
        <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  const totalRevenue = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage your ELibrary platform</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10"><BookOpen className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Total Ebooks</p><p className="text-2xl font-bold">{ebooks.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10"><ShoppingBag className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{orders.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10"><DollarSign className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">₦{(totalRevenue / 100).toLocaleString()}</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ebooks">
        <TabsList>
          <TabsTrigger value="ebooks">Manage Ebooks</TabsTrigger>
          <TabsTrigger value="add">Add Ebook</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="ebooks" className="mt-6">
          <Card>
            {isLoading ? (
              <CardContent className="p-10 text-center text-muted-foreground">Loading...</CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ebooks.map((ebook) => (
                    <TableRow key={ebook.id}>
                      <TableCell className="font-medium">{ebook.title}</TableCell>
                      <TableCell>{ebook.author}</TableCell>
                      <TableCell><Badge variant="secondary">{ebook.category}</Badge></TableCell>
                      <TableCell>₦{(ebook.price / 100).toLocaleString()}</TableCell>
                      <TableCell>{ebook.featured ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteEbook.mutate(ebook.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Add New Ebook</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4 max-w-xl" onSubmit={(e) => { e.preventDefault(); addEbook.mutate(); }}>
                <div className="space-y-2"><Label>Title</Label><Input placeholder="Ebook title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Author</Label><Input placeholder="Author name" value={author} onChange={(e) => setAuthor(e.target.value)} required /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Price (₦)</Label><Input type="number" step="0.01" placeholder="e.g. 15.00" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Ebook description..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={featured} onCheckedChange={setFeatured} />
                  <Label>Featured on homepage</Label>
                </div>
                <div className="space-y-2"><Label>Cover Image</Label><Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} /></div>
                <div className="space-y-2"><Label>Ebook File (PDF)</Label><Input type="file" accept=".pdf,.epub" onChange={(e) => setEbookFile(e.target.files?.[0] || null)} /></div>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={addEbook.isPending}>
                  {addEbook.isPending ? "Adding..." : "Add Ebook"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>No orders yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell>{order.guest_email || "Registered user"}</TableCell>
                      <TableCell>₦{(order.total / 100).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={order.status === "completed" ? "default" : "secondary"}>{order.status}</Badge></TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
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

export default Admin;
