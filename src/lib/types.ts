export const CATEGORIES = [
  "Devotionals",
  "Bible Study",
  "Christian Fiction",
  "Children",
  "Theology",
  "Prayer",
] as const;

export type Category = (typeof CATEGORIES)[number];
