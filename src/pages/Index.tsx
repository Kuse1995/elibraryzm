import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Book, ArrowRight, Sparkles } from "lucide-react";
import EbookCard from "@/components/EbookCard";
import { CATEGORIES } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: featured = [] } = useQuery({
    queryKey: ["ebooks", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .eq("featured", true)
        .eq("approval_status", "approved")
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="container relative py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Your Christian Digital Library</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Nourish Your Faith<br />
            <span className="text-accent">One Page at a Time</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Discover a curated collection of Christian ebooks — devotionals, Bible studies,
            fiction, and more — to inspire your spiritual journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 text-base px-8">
                Browse Ebooks <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" className="border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 text-base px-8">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">Explore by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/browse?category=${encodeURIComponent(cat)}`} className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border hover:border-accent hover:shadow-md transition-all text-center group">
              <Book className="h-8 w-8 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="font-medium text-sm">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="bg-secondary/50 py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold">Featured Ebooks</h2>
              <Link to="/browse"><Button variant="ghost" className="gap-1 text-accent hover:text-accent/80">View All <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((ebook) => (
                <EbookCard key={ebook.id} ebook={ebook} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Start Your Spiritual Reading Journey</h2>
          <p className="text-muted-foreground mb-6">Create a free account to track your purchases, build your library, and get personalized recommendations.</p>
          <Link to="/auth"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8">Get Started Today</Button></Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
