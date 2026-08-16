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
];
