export interface VersePuzzle {
  reference: string;
  words: string[];
}

export const VERSES: VersePuzzle[] = [
  { reference: "John 3:16", words: ["For", "God", "so", "loved", "the", "world"] },
  { reference: "Philippians 4:13", words: ["I", "can", "do", "all", "things", "through", "Christ"] },
  { reference: "Proverbs 3:5", words: ["Trust", "in", "the", "Lord", "with", "all", "your", "heart"] },
  { reference: "Genesis 1:1", words: ["In", "the", "beginning", "God", "created", "the", "heavens"] },
  { reference: "Psalm 23:1", words: ["The", "Lord", "is", "my", "shepherd"] },
  { reference: "Joshua 1:9", words: ["Be", "strong", "and", "courageous", "do", "not", "be", "afraid"] },
  { reference: "Psalm 119:105", words: ["Your", "word", "is", "a", "lamp", "to", "my", "feet"] },
  { reference: "Matthew 5:14", words: ["You", "are", "the", "light", "of", "the", "world"] },
  { reference: "Romans 8:28", words: ["All", "things", "work", "together", "for", "good"] },
  { reference: "Galatians 5:22", words: ["The", "fruit", "of", "the", "Spirit", "is", "love", "joy", "peace"] },
];

export const VERSE_DISPLAY: Record<string, string> = {
  "John 3:16": "For God so loved the world.",
  "Philippians 4:13": "I can do all things through Christ.",
  "Proverbs 3:5": "Trust in the Lord with all your heart.",
  "Genesis 1:1": "In the beginning God created the heavens.",
  "Psalm 23:1": "The Lord is my shepherd.",
  "Joshua 1:9": "Be strong and courageous, do not be afraid.",
  "Psalm 119:105": "Your word is a lamp to my feet.",
  "Matthew 5:14": "You are the light of the world.",
  "Romans 8:28": "All things work together for good.",
  "Galatians 5:22": "The fruit of the Spirit is love, joy, peace.",
};
