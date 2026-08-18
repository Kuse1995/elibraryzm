import { Navigate, useParams } from "react-router-dom";
import type { ComponentType } from "react";
import { gameBySlug } from "@/games/registry";
import GameShell from "@/games/GameShell";
import ArkPairs from "@/games/games/ArkPairs";
import FruitGarden from "@/games/games/FruitGarden";
import DavidGoliath from "@/games/games/DavidGoliath";
import BibleTrivia from "@/games/games/BibleTrivia";
import WhoAmI from "@/games/games/WhoAmI";
import VerseScramble from "@/games/games/VerseScramble";
import ArkAdventure from "@/games/premium/ArkAdventure";
import JonahAdventure from "@/games/premium/JonahAdventure";
import BibleMerge from "@/games/premium/BibleMerge";
import VerseWordle from "@/games/games/VerseWordle";
import BibleTimeline from "@/games/games/BibleTimeline";
import MemoryVerse from "@/games/games/MemoryVerse";

const GAME_COMPONENTS: Record<string, ComponentType> = {
  "ark-adventure": ArkAdventure,
  "jonah-adventure": JonahAdventure,
  "bible-merge": BibleMerge,
  "verse-wordle": VerseWordle,
  "bible-timeline": BibleTimeline,
  "memory-verse": MemoryVerse,
  "ark-pairs": ArkPairs,
  "fruit-garden": FruitGarden,
  "david-goliath": DavidGoliath,
  "bible-trivia": BibleTrivia,
  "who-am-i": WhoAmI,
  "verse-scramble": VerseScramble,
};

const HELP: Record<string, React.ReactNode> = {
  "ark-adventure": (
    <ul className="list-disc pl-5">
      <li>Tap to jump - and tap again in the air for a double jump.</li>
      <li>Collect animals fast to build your combo score, and grab power-ups: 🛡️ shield, 🧲 animal magnet, ⏳ slow-mo.</li>
      <li>Hearts left at the finish earn your stars, and every animal joins your Ark Gallery. Level 1 is free for everyone.</li>
    </ul>
  ),
  "jonah-adventure": (
    <ul className="list-disc pl-5">
      <li>Drag back on Jonah and release to fling him - the dotted trail shows where he'll fly.</li>
      <li>Collect the 3 ⭐ stars and land in the whale to finish each stage.</li>
      <li>Bounce pads launch you high, barrels roll, water makes you float - watch out for starfish! The Storm is free, The Belly and Nineveh unlock with All-Access.</li>
    </ul>
  ),
  "bible-merge": (
    <ul className="list-disc pl-5">
      <li>Tap one item, then tap its match to grow it.</li>
      <li>Seeds become sprouts, sprouts become plants - all the way to the rainbow.</li>
      <li>No losing - just keep growing. The Garden is free, The Fields and The Promise unlock with All-Access.</li>
    </ul>
  ),
  "ark-pairs": (
    <ul className="list-disc pl-5">
      <li>Flip two cards at a time to find matching animal pairs.</li>
      <li>Each pair you find fills the ark a little more.</li>
      <li>Finish within the par moves to earn all three stars.</li>
    </ul>
  ),
  "fruit-garden": (
    <ul className="list-disc pl-5">
      <li>Read each real-life situation carefully.</li>
      <li>Pick the response that grows a fruit of the Spirit.</li>
      <li>Collect all nine fruits to bloom your garden.</li>
    </ul>
  ),
  "david-goliath": (
    <ul className="list-disc pl-5">
      <li>Press and drag on the scene to pull the sling back.</li>
      <li>The dotted trail shows where your stone will fly.</li>
      <li>Release when Goliath is in your sights - hit him to win.</li>
    </ul>
  ),
  "bible-trivia": (
    <ul className="list-disc pl-5">
      <li>Answer 10 timed questions from the chosen category.</li>
      <li>Answer quickly in a row to build a streak bonus.</li>
      <li>Use 50:50 to remove two wrong answers, or Skip to move on.</li>
    </ul>
  ),
  "who-am-i": (
    <ul className="list-disc pl-5">
      <li>A Bible hero is hiding behind five clues.</li>
      <li>Reveal more hints for help - each one costs 20 points.</li>
      <li>Spell the name with the letter tiles. Three wrong letters ends the round.</li>
    </ul>
  ),
  "verse-scramble": (
    <ul className="list-disc pl-5">
      <li>Each verse is shown with its words mixed up.</li>
      <li>Tap the words in the correct order, then check.</li>
      <li>First-try answers score the most points.</li>
    </ul>
  ),
  "verse-wordle": (
    <ul className="list-disc pl-5">
      <li>Guess today's five-letter Bible word in six tries.</li>
      <li>Green means right letter, right place - gold means right letter, wrong place.</li>
      <li>Every answer unlocks a verse, and your daily streak is saved.</li>
    </ul>
  ),
  "bible-timeline": (
    <ul className="list-disc pl-5">
      <li>Six Bible events per round, shown out of order.</li>
      <li>Tap two events to swap them into true Bible order.</li>
      <li>Check your order against the clock - wrong checks cost points.</li>
    </ul>
  ),
  "memory-verse": (
    <ul className="list-disc pl-5">
      <li>Read a verse slowly, then the words start disappearing.</li>
      <li>Type each missing word and press Enter.</li>
      <li>Three rounds of recall - stars for accuracy, best scores saved.</li>
    </ul>
  ),
};

export default function GamePage() {
  const { slug = "" } = useParams();
  const meta = gameBySlug(slug);
  if (!meta) return <Navigate to="/games" replace />;
  const Game = GAME_COMPONENTS[meta.slug];

  // 2026-08-18: all games are free for everyone - no unlock wall anymore.
  return (
    <GameShell title={meta.title} emoji={meta.emoji} instructions={HELP[meta.slug]}>
      <Game />
    </GameShell>
  );
}
