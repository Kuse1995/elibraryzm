export type Audience = "Kids" | "Family" | "Teens & Adults";

export interface GameMeta {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  audience: Audience;
  difficulty: 1 | 2 | 3;
  emoji: string;
  gradient: string;
  accent: string;
  /** Premium games: Level 1 is a free demo for everyone, the rest unlocks with All-Access. */
  premium?: boolean;
}

export const GAMES: GameMeta[] = [
  {
    slug: "ark-adventure",
    title: "Noah's Ark Adventure",
    tagline: "Run, jump and save the animals",
    description: "Our premium adventure: gather every animal pair, brave the storm and outrun the flood. Level 1 is free for everyone - the full journey unlocks with All-Access.",
    audience: "Kids",
    difficulty: 2,
    emoji: "🌈",
    gradient: "from-cyan-400 via-sky-500 to-blue-700",
    accent: "#22D3EE",
    premium: true,
  },
  {
    slug: "jonah-adventure",
    title: "Jonah & the Whale",
    tagline: "Drag, aim, release",
    description: "Our premium physics puzzle: fling Jonah across 15 hand-crafted stages - bounce pads, rolling barrels, water and starfish. The Storm is free - The Belly and Nineveh unlock with All-Access.",
    audience: "Kids",
    difficulty: 2,
    emoji: "🐋",
    gradient: "from-blue-400 via-indigo-500 to-purple-700",
    accent: "#60A5FA",
    premium: true,
  },
  {
    slug: "bible-merge",
    title: "Bible Merge",
    tagline: "Merge, grow, discover the rainbow",
    description: "Our premium merge puzzle: match seeds to sprouts, sprouts to plants, and grow your way to the rainbow across 15 relaxing levels. The Garden is free - The Fields and The Promise unlock with All-Access.",
    audience: "Kids",
    difficulty: 1,
    emoji: "🌱",
    gradient: "from-lime-400 via-emerald-500 to-teal-700",
    accent: "#34D399",
    premium: true,
  },
  {
    slug: "ark-pairs",
    title: "Noah's Ark Pairs",
    tagline: "Memory match on the ark",
    description: "Flip the animal cards and find every pair before the rain stops. Three levels, animal facts, and a rainbow finish.",
    audience: "Kids",
    difficulty: 1,
    emoji: "🐘",
    gradient: "from-sky-500 via-blue-600 to-indigo-700",
    accent: "#38BDF8",
  },
  {
    slug: "fruit-garden",
    title: "Fruit of the Spirit Garden",
    tagline: "Grow your garden with good choices",
    description: "Real-life situations, one right response. Collect all nine fruits and watch your tree bloom with Galatians 5.",
    audience: "Kids",
    difficulty: 1,
    emoji: "🍇",
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    accent: "#34D399",
  },
  {
    slug: "david-goliath",
    title: "David & Goliath",
    tagline: "Aim. Trust. Throw.",
    description: "Drag the sling, aim true, and bring down the giant. Five smooth stones, three difficulty levels.",
    audience: "Family",
    difficulty: 2,
    emoji: "🪨",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    accent: "#FBBF24",
  },
  {
    slug: "bible-trivia",
    title: "Bible Scholar Trivia",
    tagline: "Timed questions across the Bible",
    description: "Old Testament, New Testament, or the life of Jesus - timed questions, streaks, lifelines and a scholar grade.",
    audience: "Teens & Adults",
    difficulty: 2,
    emoji: "📜",
    gradient: "from-violet-500 via-purple-600 to-indigo-800",
    accent: "#A78BFA",
  },
  {
    slug: "who-am-i",
    title: "Who Am I?",
    tagline: "Guess the Bible hero from the hints",
    description: "Five clues, one character. Reveal hints, spell the name, and earn your place among the faithful.",
    audience: "Teens & Adults",
    difficulty: 2,
    emoji: "🕵️",
    gradient: "from-slate-600 via-slate-700 to-slate-900",
    accent: "#94A3B8",
  },
  {
    slug: "verse-scramble",
    title: "Verse Scramble",
    tagline: "Unscramble scripture, word by word",
    description: "Put the words back in order, then carry the verse with you. Ten memorised passages to master.",
    audience: "Family",
    difficulty: 3,
    emoji: "📖",
    gradient: "from-cyan-500 via-sky-600 to-blue-800",
    accent: "#22D3EE",
  },
  {
    slug: "verse-wordle",
    title: "Verse Wordle",
    tagline: "One Bible word a day - can you guess it?",
    description: "Six tries to find today's five-letter Bible word. Green is the right letter in the right place, gold is the right letter in the wrong place. Every answer unlocks a verse.",
    audience: "Teens & Adults",
    difficulty: 2,
    emoji: "🟩",
    gradient: "from-emerald-500 via-green-600 to-teal-700",
    accent: "#10B981",
  },
  {
    slug: "bible-timeline",
    title: "Bible Timeline",
    tagline: "Put Bible history back in order",
    description: "Six events per round, three rounds per game - swap the events back into true Bible order against the clock. Speed and accuracy earn the points.",
    audience: "Teens & Adults",
    difficulty: 2,
    emoji: "🕰️",
    gradient: "from-amber-500 via-orange-600 to-rose-600",
    accent: "#F59E0B",
  },
  {
    slug: "memory-verse",
    title: "Memory Verse",
    tagline: "Hide the Word in your heart",
    description: "Read a verse, then type it back as the words disappear - three rounds of recall with stars for accuracy. Track your best score for every verse.",
    audience: "Teens & Adults",
    difficulty: 3,
    emoji: "🧠",
    gradient: "from-violet-500 via-purple-600 to-indigo-700",
    accent: "#8B5CF6",
  },
];

export function gameBySlug(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}
