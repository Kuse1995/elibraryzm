export interface FruitScenario {
  fruit: string;
  emoji: string;
  situation: string;
  options: { label: string; emoji: string; good: boolean }[];
  lesson: string;
}

export const FRUITS: { id: string; name: string; emoji: string; color: string }[] = [
  { id: "love", name: "Love", emoji: "❤️", color: "bg-red-500" },
  { id: "joy", name: "Joy", emoji: "😊", color: "bg-yellow-400" },
  { id: "peace", name: "Peace", emoji: "🕊️", color: "bg-sky-400" },
  { id: "patience", name: "Patience", emoji: "⏳", color: "bg-orange-400" },
  { id: "kindness", name: "Kindness", emoji: "🤝", color: "bg-pink-400" },
  { id: "goodness", name: "Goodness", emoji: "⭐", color: "bg-purple-400" },
  { id: "faithfulness", name: "Faithfulness", emoji: "🦁", color: "bg-blue-600" },
  { id: "gentleness", name: "Gentleness", emoji: "🐑", color: "bg-teal-400" },
  { id: "self-control", name: "Self-Control", emoji: "🍬", color: "bg-indigo-500" },
];

export const SCENARIOS: FruitScenario[] = [
  {
    fruit: "Love",
    emoji: "❤️",
    situation: "Your little brother knocks over the tower you spent an hour building. What do you do?",
    options: [
      { label: "Forgive him and build together", emoji: "🤗", good: true },
      { label: "Shout at him", emoji: "😡", good: false },
      { label: "Push him away", emoji: "🙅", good: false },
      { label: "Tell him he is the worst", emoji: "😤", good: false },
    ],
    lesson: "Love is patient and kind. (1 Corinthians 13:4)",
  },
  {
    fruit: "Joy",
    emoji: "😊",
    situation: "It is raining hard on the day of your school sports. You really wanted to play outside. What can you do?",
    options: [
      { label: "Enjoy the games inside instead", emoji: "🎉", good: true },
      { label: "Complain all day", emoji: "😩", good: false },
      { label: "Blame everyone", emoji: "☝️", good: false },
      { label: "Refuse to talk to anyone", emoji: "🤐", good: false },
    ],
    lesson: "The joy of the Lord is your strength. (Nehemiah 8:10)",
  },
  {
    fruit: "Peace",
    emoji: "🕊️",
    situation: "There is a loud thunderstorm at night and you feel scared in your room. What helps?",
    options: [
      { label: "Remember God is with me", emoji: "🙏", good: true },
      { label: "Panic and scream", emoji: "😱", good: false },
      { label: "Hide under the bed all night", emoji: "🛏️", good: false },
      { label: "Worry until morning", emoji: "😟", good: false },
    ],
    lesson: "Peace is a gift from Jesus - do not let your heart be troubled. (John 14:27)",
  },
  {
    fruit: "Patience",
    emoji: "⏳",
    situation: "You are waiting for your turn on the swing and someone is taking a very long time. What do you do?",
    options: [
      { label: "Wait calmly for my turn", emoji: "🧘", good: true },
      { label: "Push them off the swing", emoji: "💢", good: false },
      { label: "Complain loudly to everyone", emoji: "📢", good: false },
      { label: "Go home angry", emoji: "🚶", good: false },
    ],
    lesson: "Patience waits without complaining - the Lord is good to those who wait. (Lamentations 3:25)",
  },
  {
    fruit: "Kindness",
    emoji: "🤝",
    situation: "A new student is sitting alone at lunch and looks lonely. What do you do?",
    options: [
      { label: "Invite them to sit with me", emoji: "🪑", good: true },
      { label: "Laugh at them", emoji: "😂", good: false },
      { label: "Pretend I did not see them", emoji: "🙈", good: false },
      { label: "Stare until they leave", emoji: "👀", good: false },
    ],
    lesson: "Be kind to one another, tender-hearted. (Ephesians 4:32)",
  },
  {
    fruit: "Goodness",
    emoji: "⭐",
    situation: "You find a K5 note on the floor at the shop. No one is looking. What do you do?",
    options: [
      { label: "Give it to the shopkeeper", emoji: "🛍️", good: true },
      { label: "Keep it quietly", emoji: "🤫", good: false },
      { label: "Spend it on sweets", emoji: "🍬", good: false },
      { label: "Hide it for later", emoji: "🙊", good: false },
    ],
    lesson: "Do what is right even when no one is watching - goodness is from the Lord. (Psalm 23:6)",
  },
  {
    fruit: "Faithfulness",
    emoji: "🦁",
    situation: "You promised to feed the dog every evening, but your friends call you to come and play. What do you do?",
    options: [
      { label: "Feed the dog first, then play", emoji: "🐕", good: true },
      { label: "Go play and 'forget'", emoji: "🏃", good: false },
      { label: "Ask your sister to lie for you", emoji: "🙄", good: false },
      { label: "Blame the dog for not reminding you", emoji: "😼", good: false },
    ],
    lesson: "A faithful person keeps their promises. (Proverbs 20:6)",
  },
  {
    fruit: "Gentleness",
    emoji: "🐑",
    situation: "Your friend is crying because they lost their favourite book. What do you do?",
    options: [
      { label: "Speak softly and help them look", emoji: "🔍", good: true },
      { label: "Tell them it is just a book", emoji: "🗣️", good: false },
      { label: "Laugh and walk away", emoji: "🚶", good: false },
      { label: "Ignore them", emoji: "🙉", good: false },
    ],
    lesson: "A gentle answer turns away anger. (Proverbs 15:1)",
  },
  {
    fruit: "Self-Control",
    emoji: "🍬",
    situation: "The sweets jar is open and you were told to take only one. No one is watching. What do you do?",
    options: [
      { label: "Take just one", emoji: "🍭", good: true },
      { label: "Grab a whole handful", emoji: "✊", good: false },
      { label: "Take the jar to my room", emoji: "🏠", good: false },
      { label: "Eat them all quickly", emoji: "😋", good: false },
    ],
    lesson: "Self-control is a fruit of the Spirit - guard your heart. (Proverbs 25:28)",
  },
];
