export interface TimelineEvent {
  text: string;
  ref: string;
}

export interface TimelineRound {
  title: string;
  events: TimelineEvent[];
}

export const TIMELINE_ROUNDS: TimelineRound[] = [
  {
    title: "Beginnings",
    events: [
      { text: "God creates the heavens and the earth", ref: "Genesis 1:1" },
      { text: "Adam and Eve eat the forbidden fruit", ref: "Genesis 3:6" },
      { text: "Noah's family enters the ark", ref: "Genesis 7:7" },
      { text: "The Tower of Babel is abandoned", ref: "Genesis 11:8" },
      { text: "God calls Abram from Haran", ref: "Genesis 12:1" },
      { text: "Joseph is sold into Egypt", ref: "Genesis 37:28" },
    ],
  },
  {
    title: "The Patriarchs",
    events: [
      { text: "Abraham entertains three visitors at Mamre", ref: "Genesis 18:1" },
      { text: "God promises Abraham a son named Isaac", ref: "Genesis 18:10" },
      { text: "Isaac is born to Sarah in old age", ref: "Genesis 21:2" },
      { text: "A bride, Rebekah, is found for Isaac", ref: "Genesis 24:61" },
      { text: "Jacob receives Isaac's blessing", ref: "Genesis 27:27" },
      { text: "Jacob wrestles with God at Peniel", ref: "Genesis 32:24" },
    ],
  },
  {
    title: "Exodus",
    events: [
      { text: "Moses is found in a basket", ref: "Exodus 2:5" },
      { text: "Moses meets God at the burning bush", ref: "Exodus 3:2" },
      { text: "The ten plagues fall on Egypt", ref: "Exodus 7:14" },
      { text: "Israel crosses the Red Sea", ref: "Exodus 14:22" },
      { text: "The Ten Commandments are given at Sinai", ref: "Exodus 20:1" },
      { text: "Israel wanders forty years in the wilderness", ref: "Numbers 14:33" },
    ],
  },
  {
    title: "The Promised Land",
    events: [
      { text: "Moses views the land from Mount Nebo", ref: "Deuteronomy 34:1" },
      { text: "Joshua sends spies into Jericho", ref: "Joshua 2:1" },
      { text: "Israel crosses the Jordan on dry ground", ref: "Joshua 3:14" },
      { text: "The walls of Jericho fall", ref: "Joshua 6:20" },
      { text: "The sun stands still at Gibeon", ref: "Joshua 10:13" },
      { text: "The land is divided among the tribes", ref: "Joshua 14:5" },
    ],
  },
  {
    title: "Judges & Kings",
    events: [
      { text: "Deborah judges Israel", ref: "Judges 4:4" },
      { text: "Gideon defeats the Midianites", ref: "Judges 7:22" },
      { text: "Samuel anoints Saul king", ref: "1 Samuel 10:1" },
      { text: "David defeats Goliath", ref: "1 Samuel 17:49" },
      { text: "David becomes king of Israel", ref: "2 Samuel 5:3" },
      { text: "Solomon builds the temple", ref: "1 Kings 6:1" },
    ],
  },
  {
    title: "The Divided Kingdom",
    events: [
      { text: "The kingdom divides under Rehoboam", ref: "1 Kings 12:16" },
      { text: "Jeroboam sets up golden calves", ref: "1 Kings 12:28" },
      { text: "Asa does what is right in Judah", ref: "1 Kings 15:11" },
      { text: "Ahab and Jezebel promote Baal worship", ref: "1 Kings 16:30" },
      { text: "Elijah announces a great drought", ref: "1 Kings 17:1" },
      { text: "Micaiah foretells Ahab's defeat", ref: "1 Kings 22:8" },
    ],
  },
  {
    title: "The Prophets",
    events: [
      { text: "Elijah is fed by ravens", ref: "1 Kings 17:6" },
      { text: "Elijah defeats the prophets of Baal", ref: "1 Kings 18:38" },
      { text: "Elijah goes up in a whirlwind", ref: "2 Kings 2:11" },
      { text: "Isaiah sees the Lord in the temple", ref: "Isaiah 6:1" },
      { text: "Jeremiah is called to speak God's word", ref: "Jeremiah 1:4" },
      { text: "Daniel survives the lions' den", ref: "Daniel 6:22" },
    ],
  },
  {
    title: "Exile & Return",
    events: [
      { text: "Shadrach, Meshach and Abednego survive the furnace", ref: "Daniel 3:25" },
      { text: "Jerusalem falls and Judah is exiled", ref: "2 Kings 25:11" },
      { text: "Daniel reads the writing on the wall", ref: "Daniel 5:5" },
      { text: "Cyrus decrees that the exiles may return", ref: "Ezra 1:1" },
      { text: "The temple foundation is rebuilt", ref: "Ezra 3:10" },
      { text: "Nehemiah rebuilds Jerusalem's walls", ref: "Nehemiah 6:15" },
    ],
  },
  {
    title: "The Birth of Jesus",
    events: [
      { text: "The angel Gabriel visits Mary", ref: "Luke 1:26" },
      { text: "Jesus is born in Bethlehem", ref: "Luke 2:7" },
      { text: "Shepherds visit the manger", ref: "Luke 2:15" },
      { text: "Jesus is presented at the temple", ref: "Luke 2:22" },
      { text: "Wise men bring gifts", ref: "Matthew 2:11" },
      { text: "The family flees to Egypt", ref: "Matthew 2:14" },
    ],
  },
  {
    title: "The Ministry of Jesus",
    events: [
      { text: "John baptises Jesus", ref: "Matthew 3:16" },
      { text: "Jesus is tempted in the wilderness", ref: "Matthew 4:1" },
      { text: "Water becomes wine at Cana", ref: "John 2:9" },
      { text: "Jesus preaches the Sermon on the Mount", ref: "Matthew 5:1" },
      { text: "Five thousand are fed", ref: "John 6:11" },
      { text: "Jesus is transfigured on the mountain", ref: "Matthew 17:2" },
    ],
  },
  {
    title: "Miracles of Jesus",
    events: [
      { text: "Jesus cleanses a leper", ref: "Matthew 8:3" },
      { text: "A paralytic is lowered through the roof and healed", ref: "Mark 2:4" },
      { text: "Jesus raises Jairus' daughter", ref: "Mark 5:41" },
      { text: "Jesus heals a man born blind", ref: "John 9:7" },
      { text: "Jesus raises Lazarus from the dead", ref: "John 11:43" },
      { text: "The temple curtain tears when Jesus dies", ref: "Matthew 27:51" },
    ],
  },
  {
    title: "Easter Week",
    events: [
      { text: "Jesus rides into Jerusalem", ref: "Matthew 21:9" },
      { text: "Jesus clears the temple courts", ref: "Matthew 21:12" },
      { text: "The Last Supper", ref: "Matthew 26:26" },
      { text: "Jesus is arrested in Gethsemane", ref: "Matthew 26:50" },
      { text: "Jesus is crucified at Golgotha", ref: "Matthew 27:35" },
      { text: "Jesus rises from the dead", ref: "Matthew 28:6" },
    ],
  },
  {
    title: "The Early Church",
    events: [
      { text: "Jesus ascends to heaven", ref: "Acts 1:9" },
      { text: "The Spirit falls at Pentecost", ref: "Acts 2:4" },
      { text: "Stephen becomes the first martyr", ref: "Acts 7:59" },
      { text: "Saul meets Jesus on the Damascus road", ref: "Acts 9:4" },
      { text: "Peter shares the gospel with Cornelius", ref: "Acts 10:34" },
      { text: "Paul begins his first missionary journey", ref: "Acts 13:2" },
    ],
  },
  {
    title: "Paul's Journeys",
    events: [
      { text: "Paul and Barnabas are sent from Antioch", ref: "Acts 13:3" },
      { text: "The Jerusalem council decides on the Gentiles", ref: "Acts 15:19" },
      { text: "Paul crosses into Europe (Macedonia)", ref: "Acts 16:9" },
      { text: "Paul preaches at the Areopagus in Athens", ref: "Acts 17:22" },
      { text: "Paul is arrested in Jerusalem", ref: "Acts 21:33" },
      { text: "Paul is shipwrecked on the way to Rome", ref: "Acts 27:41" },
    ],
  },
  {
    title: "The Church Grows",
    events: [
      { text: "Barnabas encourages the believers in Antioch", ref: "Acts 11:23" },
      { text: "Peter is freed from prison by an angel", ref: "Acts 12:7" },
      { text: "Paul heals a lame man in Lystra", ref: "Acts 14:10" },
      { text: "Paul and Silas sing in prison at Philippi", ref: "Acts 16:25" },
      { text: "Paul raises Eutychus in Troas", ref: "Acts 20:10" },
      { text: "Paul preaches boldly in Rome", ref: "Acts 28:30" },
    ],
  },
];
