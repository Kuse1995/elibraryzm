export interface WordleEntry {
  word: string;
  verse: string;
  reference: string;
}

export const WORDLE_WORDS: WordleEntry[] = [
  { word: "GRACE", verse: "For by grace you have been saved through faith.", reference: "Ephesians 2:8" },
  { word: "FAITH", verse: "Faith is the assurance of things hoped for, the conviction of things not seen.", reference: "Hebrews 11:1" },
  { word: "PEACE", verse: "Peace I leave with you; my peace I give to you.", reference: "John 14:27" },
  { word: "MERCY", verse: "Be merciful, even as your Father is merciful.", reference: "Luke 6:36" },
  { word: "GLORY", verse: "The heavens declare the glory of God.", reference: "Psalm 19:1" },
  { word: "LIGHT", verse: "The Lord is my light and my salvation.", reference: "Psalm 27:1" },
  { word: "TRUST", verse: "Trust in the Lord with all your heart.", reference: "Proverbs 3:5" },
  { word: "HONOR", verse: "Honor your father and your mother.", reference: "Exodus 20:12" },
  { word: "PRAISE", verse: "Let everything that has breath praise the Lord.", reference: "Psalm 150:6" },
  { word: "BLESS", verse: "Bless the Lord, O my soul.", reference: "Psalm 103:1" },
  { word: "JESUS", verse: "Jesus Christ is the same yesterday and today and forever.", reference: "Hebrews 13:8" },
  { word: "MOSES", verse: "The Lord used to speak to Moses face to face.", reference: "Exodus 33:11" },
  { word: "DAVID", verse: "David strengthened himself in the Lord his God.", reference: "1 Samuel 30:6" },
  { word: "JONAH", verse: "The word of the Lord came to Jonah.", reference: "Jonah 1:1" },
  { word: "PETER", verse: "Peter said to them, 'Repent and be baptized.'", reference: "Acts 2:38" },
  { word: "SARAH", verse: "Is anything too hard for the Lord?", reference: "Genesis 18:14" },
  { word: "ABRAM", verse: "Abram believed the Lord, and he counted it to him as righteousness.", reference: "Genesis 15:6" },
  { word: "ISAAC", verse: "I am the God of Abraham, the God of Isaac, and the God of Jacob.", reference: "Exodus 3:6" },
  { word: "JACOB", verse: "I am with you and will keep you wherever you go.", reference: "Genesis 28:15" },
  { word: "NAOMI", verse: "Where you go I will go, and where you lodge I will lodge.", reference: "Ruth 1:16" },
  { word: "AARON", verse: "Aaron shall bear their names before the Lord.", reference: "Exodus 28:12" },
  { word: "STONE", verse: "The stone that the builders rejected has become the cornerstone.", reference: "Psalm 118:22" },
  { word: "CROSS", verse: "Take up your cross and follow me.", reference: "Matthew 16:24" },
  { word: "WORDS", verse: "Heaven and earth will pass away, but my words will not pass away.", reference: "Matthew 24:35" },
  { word: "SHEEP", verse: "The good shepherd lays down his life for the sheep.", reference: "John 10:11" },
  { word: "VOICE", verse: "My sheep hear my voice, and I know them.", reference: "John 10:27" },
  { word: "WHEAT", verse: "He will gather his wheat into the barn.", reference: "Matthew 3:12" },
  { word: "TRUTH", verse: "I am the way, and the truth, and the life.", reference: "John 14:6" },
  { word: "HEART", verse: "Blessed are the pure in heart, for they shall see God.", reference: "Matthew 5:8" },
  { word: "HOUSE", verse: "As for me and my house, we will serve the Lord.", reference: "Joshua 24:15" },
  { word: "SWORD", verse: "The word of God is living and active, sharper than any two-edged sword.", reference: "Hebrews 4:12" },
  { word: "WATER", verse: "Whoever drinks of the water that I give him will never be thirsty again.", reference: "John 4:14" },
  { word: "ANGEL", verse: "The angel of the Lord encamps around those who fear him.", reference: "Psalm 34:7" },
  { word: "TABLE", verse: "You prepare a table before me in the presence of my enemies.", reference: "Psalm 23:5" },
];

const EPOCH = Date.UTC(2026, 0, 1);

export function dailyWordle(): WordleEntry {
  const now = new Date();
  const utc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.max(0, Math.floor((utc - EPOCH) / 86400000));
  return WORDLE_WORDS[days % WORDLE_WORDS.length];
}
