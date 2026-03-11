export const CATEGORIES = [
  "Devotionals",
  "Bible Study",
  "Christian Fiction",
  "Children",
  "Theology",
  "Prayer",
  "Free Resources",
] as const;

export type Category = (typeof CATEGORIES)[number];
