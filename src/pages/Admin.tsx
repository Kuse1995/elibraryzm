import { useState, useMemo } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, BookOpen, ShoppingBag, DollarSign, Shield, Users, Settings, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Ebook = Tables<"ebooks">;

const SubmissionsTab = ({ ebooks, queryClient }: { ebooks: Ebook[]; queryClient: any }) => {
  const pendingBooks = ebooks.filter((e: any) => e.approval_status === "pending");
  const [updating, setUpdating] = useState<string | null>(null);

  const handleApproval = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    const { error } = await supabase.from("ebooks").update({ approval_status: status } as any).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Book ${status}!`);
      queryClient.invalidateQueries({ queryKey: ["admin-ebooks"] });
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
    }
    setUpdating(null);
  };

  return (
    <TabsContent value="submissions" className="mt-6">
      {pendingBooks.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>No pending submissions.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions ({pendingBooks.length})</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingBooks.map((book: any) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell><Badge variant="secondary">{book.category}</Badge></TableCell>
                  <TableCell>K{(book.price / 100).toLocaleString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={updating === book.id}
                      onClick={() => handleApproval(book.id, "approved")}
                      className="gap-1"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={updating === book.id}
                      onClick={() => handleApproval(book.id, "rejected")}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </TabsContent>
  );
};

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Add form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);

  // Settings state
  const [discountPercent, setDiscountPercent] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editEbook, setEditEbook] = useState<Ebook | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);

  const openEdit = (ebook: Ebook) => {
    setEditEbook(ebook);
    setEditTitle(ebook.title);
    setEditAuthor(ebook.author);
    setEditCategory(ebook.category);
    setEditPrice((ebook.price / 100).toString());
    setEditDescription(ebook.description);
    setEditFeatured(ebook.featured);
    setEditOpen(true);
  };

  const { data: ebooks = [], isLoading } = useQuery({
    queryKey: ["admin-ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: upsellSetting } = useQuery({
    queryKey: ["site-settings", "upsell_discount_percent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "upsell_discount_percent").single();
      if (error) throw error;
      return data.value;
    },
    enabled: isAdmin,
  });

  // Sync fetched setting to local state
  useState(() => { if (upsellSetting) setDiscountPercent(upsellSetting); });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Derive customers from orders
  const customers = useMemo(() => {
    const customerMap = new Map<string, { email: string; orderCount: number; totalSpent: number; lastOrder: string }>();
    orders.forEach((order) => {
      const email = order.guest_email || "registered-user";
      if (email === "registered-user" && !order.user_id) return;
      const key = order.guest_email || order.user_id || "unknown";
      const existing = customerMap.get(key);
      const isCompleted = order.status === "completed";
      if (existing) {
        existing.orderCount += 1;
        if (isCompleted) existing.totalSpent += order.total;
        if (order.created_at > existing.lastOrder) {
          existing.lastOrder = order.created_at;
          if (order.guest_email) existing.email = order.guest_email;
        }
      } else {
        customerMap.set(key, {
          email: order.guest_email || `User ${order.user_id?.slice(0, 8)}...`,
          orderCount: 1,
          totalSpent: isCompleted ? order.total : 0,
          lastOrder: order.created_at,
        });
      }
    });
    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

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

  const updateEbook = useMutation({
    mutationFn: async () => {
      if (!editEbook) return;
      const { error } = await supabase.from("ebooks").update({
        title: editTitle,
        author: editAuthor,
        category: editCategory,
        price: Math.round(parseFloat(editPrice) * 100),
        description: editDescription,
        featured: editFeatured,
      }).eq("id", editEbook.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ebook updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-ebooks"] });
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
      setEditOpen(false);
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

  const completedOrders = orders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCustomers = customers.length;

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage your ELibrary platform</p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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
            <div className="p-3 rounded-lg bg-accent/10"><Users className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Customers</p><p className="text-2xl font-bold">{totalCustomers}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10"><DollarSign className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">K{(totalRevenue / 100).toLocaleString()}</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ebooks">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ebooks">Manage Ebooks</TabsTrigger>
          <TabsTrigger value="add">Add Ebook</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
                      <TableCell>K{(ebook.price / 100).toLocaleString()}</TableCell>
                      <TableCell>{ebook.featured ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(ebook)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
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
                <div className="space-y-2"><Label>Price (K)</Label><Input type="number" step="0.01" placeholder="e.g. 15.00" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
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

        <SubmissionsTab ebooks={ebooks} queryClient={queryClient} />

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
                      <TableCell>K{(order.total / 100).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={order.status === "completed" ? "default" : "secondary"}>{order.status}</Badge></TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          {customers.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>No customers yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold">{customers.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Avg. Spend per Customer</p>
                    <p className="text-2xl font-bold">
                      K{customers.length > 0 ? ((customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length) / 100).toFixed(2) : "0"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Est. Monthly Earnings</p>
                    <p className="text-2xl font-bold">
                      K{(totalRevenue / 100).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Last Purchase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{customer.email}</TableCell>
                        <TableCell>{customer.orderCount}</TableCell>
                        <TableCell>K{(customer.totalSpent / 100).toLocaleString()}</TableCell>
                        <TableCell>{new Date(customer.lastOrder).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>
        <UsersTab isAdmin={isAdmin} orders={orders} />
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Site Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4 max-w-sm" onSubmit={async (e) => {
                e.preventDefault();
                const val = parseInt(discountPercent);
                if (isNaN(val) || val < 1 || val > 99) {
                  toast.error("Enter a percentage between 1 and 99");
                  return;
                }
                setSavingSettings(true);
                const { error } = await supabase.from("site_settings").update({ value: val.toString() }).eq("key", "upsell_discount_percent");
                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success("Upsell discount updated!");
                  queryClient.invalidateQueries({ queryKey: ["site-settings"] });
                }
                setSavingSettings(false);
              }}>
                <div className="space-y-2">
                  <Label>Upsell Discount Percentage</Label>
                  <p className="text-sm text-muted-foreground">Customers are offered a second ebook at this discount when buying.</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={discountPercent || upsellSetting || "50"}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground font-medium">%</span>
                  </div>
                </div>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={savingSettings}>
                  {savingSettings ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Ebook Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Ebook</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateEbook.mutate(); }}>
            <div className="space-y-2"><Label>Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Author</Label><Input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Price (K)</Label><Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={editFeatured} onCheckedChange={setEditFeatured} />
              <Label>Featured</Label>
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={updateEbook.isPending}>
              {updateEbook.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
