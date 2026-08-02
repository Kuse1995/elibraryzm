export interface TriviaQuestion {
  q: string;
  a: string[];
  correct: number;
  ref?: string;
}

export type TriviaCategory = "old" | "new" | "jesus";

export const TRIVIA_CATEGORIES: { id: TriviaCategory | "mixed"; label: string; emoji: string }[] = [
  { id: "old", label: "Old Testament", emoji: "📜" },
  { id: "new", label: "New Testament", emoji: "✉️" },
  { id: "jesus", label: "Life of Jesus", emoji: "🕊️" },
  { id: "mixed", label: "Mixed", emoji: "🌟" },
];

export const TRIVIA: Record<TriviaCategory, TriviaQuestion[]> = {
  old: [
    { q: "Who built the ark?", a: ["Noah", "Moses", "Abraham", "David"], correct: 0, ref: "Genesis 6" },
    { q: "How many days and nights did it rain on the earth?", a: ["40", "7", "12", "100"], correct: 0, ref: "Genesis 7:12" },
    { q: "Who was thrown into the lions' den?", a: ["Daniel", "Joseph", "Jonah", "Samson"], correct: 0, ref: "Daniel 6" },
    { q: "What did David use to defeat Goliath?", a: ["A sling and a stone", "A sword", "A spear", "A bow"], correct: 0, ref: "1 Samuel 17" },
    { q: "Who led the people of Israel out of Egypt?", a: ["Moses", "Joshua", "Aaron", "Caleb"], correct: 0, ref: "Exodus 12" },
    { q: "What is the first book of the Bible?", a: ["Genesis", "Exodus", "Psalms", "Matthew"], correct: 0 },
    { q: "Who was sold into slavery by his own brothers?", a: ["Joseph", "Benjamin", "Judah", "Simeon"], correct: 0, ref: "Genesis 37" },
    { q: "What did God give to Moses on Mount Sinai?", a: ["The Ten Commandments", "A golden calf", "A map", "A sword"], correct: 0, ref: "Exodus 20" },
    { q: "Who was the first king of Israel?", a: ["Saul", "David", "Solomon", "Rehoboam"], correct: 0, ref: "1 Samuel 10" },
    { q: "What fell down when Joshua's army marched around it?", a: ["The walls of Jericho", "A tower", "A gate", "The temple"], correct: 0, ref: "Joshua 6" },
    { q: "Who was swallowed by a great fish?", a: ["Jonah", "Peter", "Elijah", "Job"], correct: 0, ref: "Jonah 1" },
    { q: "Who was Abraham's wife?", a: ["Sarah", "Rebekah", "Rachel", "Leah"], correct: 0, ref: "Genesis 17" },
    { q: "What did Elijah call down from heaven on Mount Carmel?", a: ["Fire", "Rain", "Lightning", "Bread"], correct: 0, ref: "1 Kings 18" },
    { q: "Who was David's closest friend?", a: ["Jonathan", "Saul", "Absalom", "Nathan"], correct: 0, ref: "1 Samuel 18" },
    { q: "What happened to Samson when Delilah cut his hair?", a: ["He lost his strength", "He became king", "He grew taller", "He went blind instantly"], correct: 0, ref: "Judges 16" },
    { q: "How many days did God use to create the world before resting?", a: ["Six", "Seven", "Ten", "One"], correct: 0, ref: "Genesis 1-2" },
  ],
  new: [
    { q: "How many disciples did Jesus choose?", a: ["Twelve", "Ten", "Seven", "Seventy"], correct: 0, ref: "Luke 6:13" },
    { q: "Who denied Jesus three times?", a: ["Peter", "John", "James", "Thomas"], correct: 0, ref: "Luke 22" },
    { q: "Who wrote most of the letters in the New Testament?", a: ["Paul", "Peter", "John", "Luke"], correct: 0 },
    { q: "On which day was Jesus raised from the dead?", a: ["The third day", "The seventh day", "The next day", "The fortieth day"], correct: 0, ref: "Luke 24" },
    { q: "Who was the first martyr of the church?", a: ["Stephen", "Peter", "James", "Barnabas"], correct: 0, ref: "Acts 7" },
    { q: "What did Jesus turn water into at the wedding in Cana?", a: ["Wine", "Milk", "Honey", "Oil"], correct: 0, ref: "John 2" },
    { q: "Who baptised Jesus?", a: ["John the Baptist", "Peter", "Andrew", "Eli"], correct: 0, ref: "Matthew 3" },
    { q: "Where was Jesus born?", a: ["Bethlehem", "Nazareth", "Jerusalem", "Capernaum"], correct: 0, ref: "Matthew 2" },
    { q: "Which book tells the story of the early church?", a: ["Acts", "Romans", "Revelation", "Hebrews"], correct: 0 },
    { q: "What does the word 'gospel' mean?", a: ["Good news", "Holy book", "New law", "Great story"], correct: 0 },
    { q: "Who was the tax collector who climbed a tree to see Jesus?", a: ["Zacchaeus", "Matthew", "Levi", "Simon"], correct: 0, ref: "Luke 19" },
    { q: "How many books are in the New Testament?", a: ["27", "39", "12", "66"], correct: 0 },
    { q: "Who was Paul's first missionary companion?", a: ["Barnabas", "Silas", "Timothy", "Luke"], correct: 0, ref: "Acts 13" },
    { q: "Which fruit of the Spirit is listed first in Galatians 5?", a: ["Love", "Joy", "Peace", "Kindness"], correct: 0, ref: "Galatians 5:22" },
    { q: "Who was chosen to replace Judas as an apostle?", a: ["Matthias", "Barsabbas", "Silas", "Mark"], correct: 0, ref: "Acts 1" },
    { q: "What happened to the believers on the day of Pentecost?", a: ["They received the Holy Spirit", "They built a temple", "They wrote letters", "They sailed to Rome"], correct: 0, ref: "Acts 2" },
  ],
  jesus: [
    { q: "How many people did Jesus feed with five loaves and two fish?", a: ["5,000", "500", "50", "15,000"], correct: 0, ref: "John 6" },
    { q: "What did Jesus ride into Jerusalem on Palm Sunday?", a: ["A donkey", "A horse", "A camel", "A chariot"], correct: 0, ref: "Matthew 21" },
    { q: "Which disciple walked on the water towards Jesus?", a: ["Peter", "John", "Andrew", "Philip"], correct: 0, ref: "Matthew 14" },
    { q: "Who betrayed Jesus for thirty pieces of silver?", a: ["Judas Iscariot", "Caiaphas", "Herod", "Pilate"], correct: 0, ref: "Matthew 26" },
    { q: "What was Jesus' first miracle?", a: ["Water into wine", "Healing a blind man", "Calming the storm", "Feeding 5,000"], correct: 0, ref: "John 2" },
    { q: "Who asked Jesus, 'What is truth?'", a: ["Pontius Pilate", "Herod", "Nicodemus", "Caiaphas"], correct: 0, ref: "John 18" },
    { q: "How many days did Jesus fast in the wilderness?", a: ["40", "7", "21", "3"], correct: 0, ref: "Matthew 4" },
    { q: "Which parable tells of a father and two sons?", a: ["The Prodigal Son", "The Good Samaritan", "The Sower", "The Lost Sheep"], correct: 0, ref: "Luke 15" },
    { q: "Who were Jesus' earthly parents?", a: ["Mary and Joseph", "Mary and Zachariah", "Elizabeth and Joseph", "Anna and Joseph"], correct: 0, ref: "Luke 2" },
    { q: "What did Jesus say is the greatest commandment?", a: ["Love the Lord your God", "Honour your parents", "Do not steal", "Keep the Sabbath"], correct: 0, ref: "Matthew 22" },
    { q: "What did Jesus command Lazarus to do?", a: ["Come out", "Get up and walk", "Open your eyes", "Be healed"], correct: 0, ref: "John 11" },
    { q: "Which sea did Jesus calm with just three words?", a: ["The Sea of Galilee", "The Red Sea", "The Dead Sea", "The Mediterranean"], correct: 0, ref: "Mark 4" },
    { q: "At what age did Jesus amaze the teachers in the temple?", a: ["Twelve", "Eight", "Twenty", "Thirty"], correct: 0, ref: "Luke 2" },
    { q: "What does Jesus call Himself in John 10:11?", a: ["The Good Shepherd", "The Great King", "The Light Bearer", "The Teacher"], correct: 0, ref: "John 10:11" },
    { q: "Where was Jesus crucified?", a: ["Golgotha", "Bethany", "Nazareth", "Emmaus"], correct: 0, ref: "Matthew 27" },
    { q: "What did Jesus say to the storm?", a: ["Peace, be still", "Go away", "Stop now", "Silence, winds"], correct: 0, ref: "Mark 4:39" },
  ],
};

export function questionPool(category: TriviaCategory | "mixed"): TriviaQuestion[] {
  if (category === "mixed") {
    return [...TRIVIA.old, ...TRIVIA.new, ...TRIVIA.jesus];
  }
  return TRIVIA[category];
}

export const TIMER_BY_DIFFICULTY: Record<string, number> = {
  easy: 20,
  normal: 15,
  hard: 10,
};
