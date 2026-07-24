import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import logo from "@/assets/elibrary-logo.png";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { items } = useCart();
  const { user, isAdmin, isAuthor, signOut } = useAuth();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/browse", label: "Browse" },
    ...(user ? [{ to: "/my-library", label: "My Library" }] : []),
    ...(isAuthor ? [{ to: "/author", label: "Author Portal" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="E Library" className="h-10 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  location.pathname === l.to ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {user ? (
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline text-sm font-medium text-foreground">
                  {user.user_metadata?.display_name || user.email?.split("@")[0]}
                </span>
                <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 py-3 space-y-2">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-accent">
                {l.label}
              </Link>
            ))}
            {user && (
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="block py-2 text-sm font-medium text-destructive">
                Sign Out
              </button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-primary text-primary-foreground">
        <div className="container py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={logo} alt="E Library" className="h-10 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="text-sm text-primary-foreground/70">Your Christian Digital Library — Inspiring faith through the written word.</p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-primary-foreground/70">
                <Link to="/browse" className="block hover:text-accent">Browse Ebooks</Link>
                {user ? (
                  <Link to="/my-library" className="block hover:text-accent">My Library</Link>
                ) : (
                  <Link to="/auth" className="block hover:text-accent">Sign In</Link>
                )}
                <Link to="/whatsapp" className="block hover:text-accent">Subscribe on WhatsApp</Link>
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">Categories</h4>
              <div className="space-y-2 text-sm text-primary-foreground/70">
                <p>Devotionals</p><p>Bible Study</p><p>Christian Fiction</p><p>Children</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} E Library. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
