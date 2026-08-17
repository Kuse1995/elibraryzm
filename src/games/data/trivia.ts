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
    { q: "Who was Isaac's wife?", a: ["Rebekah", "Rachel", "Leah", "Zilpah"], correct: 0, ref: "Genesis 24:67" },
    { q: "What did Esau sell to Jacob for a meal?", a: ["His birthright", "His flock", "His tent", "His sword"], correct: 0, ref: "Genesis 25:33" },
    { q: "Who succeeded Moses and led Israel into Canaan?", a: ["Joshua", "Caleb", "Aaron", "Gideon"], correct: 0, ref: "Joshua 1:2" },
    { q: "Which judge of Israel made a rash vow about his daughter?", a: ["Jephthah", "Samson", "Ehud", "Barak"], correct: 0, ref: "Judges 11:30" },
    { q: "Who was the woman who hid the spies in Jericho?", a: ["Rahab", "Ruth", "Deborah", "Miriam"], correct: 0, ref: "Joshua 2:4" },
    { q: "How many sons did Jacob have?", a: ["Twelve", "Ten", "Seven", "Two"], correct: 0, ref: "Genesis 35:22" },
    { q: "Which king dreamed of a great statue that Daniel interpreted?", a: ["Nebuchadnezzar", "Belshazzar", "Darius", "Cyrus"], correct: 0, ref: "Daniel 2:31" },
    { q: "What did the people build in Shinar to reach the heavens?", a: ["A tower", "A wall", "A palace", "A bridge"], correct: 0, ref: "Genesis 11:4" },
    { q: "Who was the strongest man, whose power was in his hair?", a: ["Samson", "Saul", "Goliath", "Boaz"], correct: 0, ref: "Judges 16:17" },
    { q: "Which prophet was taken up in a chariot of fire?", a: ["Elijah", "Elisha", "Isaiah", "Hosea"], correct: 0, ref: "2 Kings 2:11" },
    { q: "What sign did God give Noah after the flood?", a: ["A rainbow", "A star", "A dove", "A rock"], correct: 0, ref: "Genesis 9:13" },
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
    { q: "Who wrote the book of Revelation?", a: ["John", "Peter", "Paul", "Luke"], correct: 0, ref: "Revelation 1:1" },
    { q: "In which city were believers first called Christians?", a: ["Antioch", "Jerusalem", "Corinth", "Ephesus"], correct: 0, ref: "Acts 11:26" },
    { q: "Who travelled with Paul on his second journey after Barnabas?", a: ["Silas", "Timothy", "Mark", "Titus"], correct: 0, ref: "Acts 15:40" },
    { q: "What shook the prison doors open while Paul and Silas prayed?", a: ["An earthquake", "A storm", "A flood", "A wind"], correct: 0, ref: "Acts 16:26" },
    { q: "Which young leader received two letters from Paul?", a: ["Timothy", "Philemon", "Jude", "Luke"], correct: 0, ref: "1 Timothy 1:2" },
    { q: "Who was the runaway slave Paul asked to be forgiven?", a: ["Onesimus", "Epaphras", "Aquila", "Felix"], correct: 0, ref: "Philemon 10" },
    { q: "What is the last book of the Bible?", a: ["Revelation", "Jude", "Acts", "Hebrews"], correct: 0 },
    { q: "Which couple made tents alongside Paul?", a: ["Aquila and Priscilla", "Ananias and Sapphira", "Zechariah and Elizabeth", "Felix and Drusilla"], correct: 0, ref: "Acts 18:2-3" },
    { q: "Who lied about their offering and fell down dead?", a: ["Ananias and Sapphira", "Aquila and Priscilla", "Hophni and Phinehas", "Hymenaeus and Alexander"], correct: 0, ref: "Acts 5:5" },
    { q: "Which island was John on when he saw the vision of Revelation?", a: ["Patmos", "Cyprus", "Crete", "Malta"], correct: 0, ref: "Revelation 1:9" },
    { q: "Who did Paul heal in Lystra?", a: ["A man lame from birth", "A blind beggar", "A leper", "A paralyzed widow"], correct: 0, ref: "Acts 14:8-10" },
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
    { q: "How many lepers thanked Jesus after being healed?", a: ["One", "All ten", "Three", "None"], correct: 0, ref: "Luke 17:15-16" },
    { q: "What did Jesus wash to teach his disciples humility?", a: ["Their feet", "Their hands", "Their clothes", "The temple steps"], correct: 0, ref: "John 13:5" },
    { q: "Who helped the wounded man on the road to Jericho?", a: ["A Samaritan", "A priest", "A Levite", "A soldier"], correct: 0, ref: "Luke 10:33" },
    { q: "Where did Jesus meet the woman at the well?", a: ["Sychar in Samaria", "Bethany in Judea", "Capernaum in Galilee", "Jericho"], correct: 0, ref: "John 4:5" },
    { q: "What did Jesus say would happen to the temple in Jerusalem?", a: ["Not one stone would be left on another", "It would shine with gold", "It would float on water", "It would be moved"], correct: 0, ref: "Matthew 24:2" },
    { q: "Which tree did Jesus wither on the road to Jerusalem?", a: ["A fig tree", "An olive tree", "A cedar", "A palm"], correct: 0, ref: "Mark 11:13-14" },
    { q: "How many years had the woman bled before touching Jesus' garment?", a: ["Twelve", "Seven", "Three", "Twenty"], correct: 0, ref: "Mark 5:25" },
    { q: "Who did Jesus call 'the rock' on which he would build his church?", a: ["Peter", "John", "Andrew", "James"], correct: 0, ref: "Matthew 16:18" },
    { q: "What job did the father in the Prodigal Son give the returning son?", a: ["None - he welcomed him as a son", "Servant in the fields", "Keeper of the flocks", "Steward of the house"], correct: 0, ref: "Luke 15:22" },
    { q: "Which two men appeared with Jesus at the transfiguration?", a: ["Moses and Elijah", "Abraham and David", "Isaiah and Jeremiah", "Enoch and Elisha"], correct: 0, ref: "Matthew 17:3" },
    { q: "What did Jesus say he is 'the way, the truth, and'?", a: ["The life", "The light", "The door", "The word"], correct: 0, ref: "John 14:6" },
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
