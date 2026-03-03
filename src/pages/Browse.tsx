import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import EbookCard from "@/components/EbookCard";
import { sampleEbooks } from "@/lib/sample-data";
import { CATEGORIES } from "@/lib/types";

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const [search, setSearch] = useState("");

  const filtered = sampleEbooks.filter((e) => {
    const matchCat = !activeCategory || e.category === activeCategory;
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.author.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Browse Ebooks</h1>
      <p className="text-muted-foreground mb-8">Find your next inspiring read</p>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!activeCategory ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchParams({})}
          >
            All
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchParams({ category: cat })}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No ebooks found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((ebook) => (
            <EbookCard key={ebook.id} ebook={ebook} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Browse;
