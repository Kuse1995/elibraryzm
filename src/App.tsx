import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import EbookDetail from "./pages/EbookDetail";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import MyLibrary from "./pages/MyLibrary";
import Admin from "./pages/Admin";
import PaymentVerify from "./pages/PaymentVerify";
import Downloads from "./pages/Downloads";
import AuthorDashboard from "./pages/AuthorDashboard";
import UpgradeToAuthor from "./pages/UpgradeToAuthor";
import WhatsAppSubscribe from "./pages/WhatsAppSubscribe";
import Games from "./pages/Games";
import Studio from "./pages/Studio";
import GamePage from "./pages/GamePage";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/ebook/:id" element={<EbookDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/my-library" element={<MyLibrary />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/author" element={<AuthorDashboard />} />
                <Route path="/upgrade-to-author" element={<UpgradeToAuthor />} />
                <Route path="/payment-verify" element={<PaymentVerify />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/whatsapp" element={<WhatsAppSubscribe />} />
                <Route path="/games" element={<Games />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/games/:slug" element={<GamePage />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
