export interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  cover_url: string;
  file_url: string;
  category: string;
  featured: boolean;
  created_at: string;
}

export const CATEGORIES = [
  "Devotionals",
  "Bible Study",
  "Christian Fiction",
  "Children",
  "Theology",
  "Prayer",
] as const;

export type Category = (typeof CATEGORIES)[number];
