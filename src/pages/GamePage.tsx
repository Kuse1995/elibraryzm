import { Navigate, useParams } from "react-router-dom";
import type { ComponentType } from "react";
import { gameBySlug } from "@/games/registry";
import GameShell from "@/games/GameShell";
import GameUnlock from "@/components/GameUnlock";
import { useGameAccess } from "@/hooks/useGameAccess";
import ArkPairs from "@/games/games/ArkPairs";
import FruitGarden from "@/games/games/FruitGarden";
import DavidGoliath from "@/games/games/DavidGoliath";
import BibleTrivia from "@/games/games/BibleTrivia";
import WhoAmI from "@/games/games/WhoAmI";
import VerseScramble from "@/games/games/VerseScramble";
import ArkAdventure from "@/games/premium/ArkAdventure";

const GAME_COMPONENTS: Record<string, ComponentType> = {
  "ark-adventure": ArkAdventure,
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
      <li>Collect every animal Noah needs for the ark.</li>
      <li>Dodge the rocks and logs. Three hearts, three levels - Level 1 is free for everyone.</li>
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
};

export default function GamePage() {
  const { slug = "" } = useParams();
  const meta = gameBySlug(slug);
  const { unlocked, loading } = useGameAccess();
  if (!meta) return <Navigate to="/games" replace />;
  const Game = GAME_COMPONENTS[meta.slug];

  if (loading) {
    return <div className="container py-16 text-center text-muted-foreground">Loading your games…</div>;
  }
  // Premium games run their own model: Level 1 is a free demo, full game needs All-Access.
  if (!meta.premium && !unlocked) {
    return <GameUnlock title={meta.title} emoji={meta.emoji} />;
  }
  return (
    <GameShell title={meta.title} emoji={meta.emoji} instructions={HELP[meta.slug]}>
      <Game />
    </GameShell>
  );
}
