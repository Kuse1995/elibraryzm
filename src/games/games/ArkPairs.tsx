import { useEffect, useMemo, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { useGameStats } from "../useGameStats";

interface Animal {
  emoji: string;
  name: string;
  fact: string;
}

const ANIMALS: Animal[] = [
  { emoji: "🦁", name: "Lion", fact: "A lion's roar can be heard up to 8 km away!" },
  { emoji: "🐘", name: "Elephant", fact: "Elephants are the biggest land animals on earth." },
  { emoji: "🦒", name: "Giraffe", fact: "A giraffe's neck has only 7 bones - the same as yours!" },
  { emoji: "🐵", name: "Monkey", fact: "Monkeys use their tails like an extra hand." },
  { emoji: "🦓", name: "Zebra", fact: "Every zebra has a different stripe pattern - like a fingerprint." },
  { emoji: "🐪", name: "Camel", fact: "Camels can go for weeks without water in the desert." },
  { emoji: "🐑", name: "Sheep", fact: "Sheep remember the faces of their friends for years." },
  { emoji: "🐄", name: "Cow", fact: "Cows have best friends and get stressed when separated." },
  { emoji: "🐖", name: "Pig", fact: "Pigs are smarter than many dogs - they can learn tricks!" },
  { emoji: "🦆", name: "Duck", fact: "Ducklings can swim within a day of hatching." },
  { emoji: "🐢", name: "Turtle", fact: "Some turtles live for more than 100 years." },
  { emoji: "🦉", name: "Owl", fact: "Owls can turn their heads almost all the way around." },
];

const LEVELS = [
  { id: "easy", label: "Little Ark", pairs: 6, par: 9 },
  { id: "medium", label: "Bigger Boat", pairs: 9, par: 16 },
  { id: "hard", label: "Flood Time", pairs: 12, par: 24 },
];

interface Card {
  id: number;
  animal: Animal;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ArkPairs() {
  const { stats, record } = useGameStats("ark-pairs");
  const [level, setLevel] = useState<{ id: string; label: string; pairs: number; par: number } | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [fact, setFact] = useState<Animal | null>(null);
  const [won, setWon] = useState(false);
  const [stars, setStars] = useState(0);

  const matchedCount = cards.filter((c) => c.matched).length / 2;

  const start = (lvl: { id: string; label: string; pairs: number; par: number }) => {
    const animals = shuffle(ANIMALS).slice(0, lvl.pairs);
    const deck = shuffle([...animals, ...animals]).map((animal, i) => ({
      id: i,
      animal,
      flipped: false,
      matched: false,
    }));
    setLevel(lvl);
    setCards(deck);
    setOpen([]);
    setMoves(0);
    setFact(null);
    setWon(false);
    sound.play("click");
  };

  const flip = (id: number) => {
    if (won || open.length === 2 || cards[id].flipped || cards[id].matched) return;
    sound.play("pop");
    const next = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(next);
    const ids = [...open, id];
    setOpen(ids);
    if (ids.length === 2) {
      const [a, b] = ids;
      const ca = next[a];
      const cb = next[b];
      setMoves((m) => m + 1);
      if (ca.animal.name === cb.animal.name) {
        setTimeout(() => {
          sound.play("correct");
          setFact(ca.animal);
          setCards((cur) => cur.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)));
          setOpen([]);
        }, 450);
      } else {
        setTimeout(() => {
          sound.play("wrong");
          setCards((cur) => cur.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)));
          setOpen([]);
        }, 900);
      }
    }
  };

  useEffect(() => {
    if (!fact) return;
    const t = setTimeout(() => setFact(null), 2600);
    return () => clearTimeout(t);
  }, [fact]);

  useEffect(() => {
    if (!level || cards.length === 0) return;
    if (matchedCount === level.pairs && !won) {
      const earned = moves <= level.par ? 3 : moves <= Math.ceil(level.par * 1.6) ? 2 : 1;
      setStars(earned);
      setWon(true);
      sound.play("win");
      confettiBurst(110);
      record(Math.max(0, 1000 - moves * 20) + earned * 100);
    }
  }, [matchedCount, won, level, cards.length, moves, record]);

  if (!level) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">🚢</div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Noah's Ark Pairs</h2>
        <p className="text-muted-foreground mb-8">
          Find all the animal pairs before the rain stops. Best score: {stats.best || "—"} · played {stats.plays}×
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => start(lvl)}
              className="group rounded-xl border bg-card p-6 hover:border-accent hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {lvl.pairs === 6 ? "🐤" : lvl.pairs === 9 ? "🦆" : "🌊"}
              </div>
              <div className="font-semibold mb-1">{lvl.label}</div>
              <div className="text-sm text-muted-foreground">{lvl.pairs} pairs · {lvl.par} moves par</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Pairs: {matchedCount}/{level.pairs}</span>
          <span>Moves: {moves}</span>
        </div>
        <div className="relative h-4 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 transition-all duration-500"
            style={{ width: `${(matchedCount / level.pairs) * 100}%` }}
          />
          <span className="absolute -top-1 text-lg transition-all duration-500" style={{ left: `calc(${(matchedCount / level.pairs) * 100}% - 12px)` }}>
            🚢
          </span>
        </div>
      </div>

      {fact && (
        <div className="mb-4 rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900 animate-fade-in">
          <span className="mr-1 text-lg">{fact.emoji}</span>
          <strong>{fact.name}:</strong> {fact.fact}
        </div>
      )}

      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${level.pairs === 6 ? 4 : 6}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={`aspect-[3/4] rounded-xl border-2 transition-all duration-300 ${
              card.matched
                ? "border-emerald-300 bg-emerald-50 opacity-60"
                : card.flipped
                ? "border-accent bg-card shadow-md"
                : "border-primary/20 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 hover:border-accent hover:shadow-md"
            }`}
            style={{ transform: card.flipped ? "rotateY(180deg)" : "none", transformStyle: "preserve-3d" }}
          >
            <span
              className="flex h-full w-full items-center justify-center text-3xl sm:text-4xl"
              style={{ backfaceVisibility: "hidden" }}
            >
              {card.flipped || card.matched ? card.animal.emoji : "❓"}
            </span>
          </button>
        ))}
      </div>

      {won && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full rounded-2xl bg-card p-8 text-center shadow-2xl animate-fade-in">
            <div className="text-6xl mb-3">🌈</div>
            <h3 className="font-display text-2xl font-bold mb-1">The rain has stopped!</h3>
            <p className="text-muted-foreground mb-4">
              You found all {level.pairs} pairs in {moves} moves.
            </p>
            <div className="flex justify-center gap-1 text-3xl mb-5">
              {[1, 2, 3].map((s) => (
                <span key={s} className={s <= stars ? "" : "opacity-20 grayscale"}>⭐</span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-5 italic">
              "I will remember my covenant... I have set my rainbow in the clouds." — Genesis 9:13-14
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => start(level)} className="rounded-lg bg-accent px-6 py-2.5 font-semibold text-accent-foreground hover:bg-accent/90">
                Play again
              </button>
              <button onClick={() => setLevel(null)} className="rounded-lg border px-6 py-2.5 font-semibold hover:bg-muted">
                Levels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
