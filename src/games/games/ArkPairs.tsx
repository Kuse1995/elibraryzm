import { useEffect, useRef, useState } from "react";
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
  { emoji: "🦒", name: "Giraffe", fact: "A giraffe's neck has only 7 bones — the same as yours!" },
  { emoji: "🐵", name: "Monkey", fact: "Monkeys use their tails like an extra hand." },
  { emoji: "🦓", name: "Zebra", fact: "Every zebra has a different stripe pattern — like a fingerprint." },
  { emoji: "🐪", name: "Camel", fact: "Camels can go for weeks without water in the desert." },
  { emoji: "🐑", name: "Sheep", fact: "Sheep remember the faces of their friends for years." },
  { emoji: "🐄", name: "Cow", fact: "Cows have best friends and get stressed when separated." },
  { emoji: "🐖", name: "Pig", fact: "Pigs are smarter than many dogs — they can learn tricks!" },
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

function ArkScene({ rain }: { rain: boolean }) {
  return (
    <div className="scene-deco">
      {rain && (
        <>
          {[6, 14, 24, 34, 44, 55, 66, 78, 88].map((left, i) => (
            <span key={i} className="raindrop" style={{ left: left + "%", top: 0, animationDelay: (i * 0.13).toFixed(2) + "s" }} />
          ))}
        </>
      )}
      <span className="cloud" style={{ top: "10%", width: 130, height: 30, animationDuration: "36s", opacity: 0.5 }} />
      <span className="cloud" style={{ top: "20%", width: 80, height: 20, animationDuration: "50s", animationDelay: "-22s", opacity: 0.35 }} />
      <span className="cloud" style={{ top: "8%", right: "10%", width: 100, height: 24, animationDuration: "42s", animationDelay: "-10s", opacity: 0.45 }} />
      <span className="floaty absolute" style={{ bottom: "12%", left: "8%", fontSize: 40, opacity: 0.6 }}>🐘</span>
      <span className="floaty absolute" style={{ bottom: "16%", right: "10%", fontSize: 32, opacity: 0.5, animationDelay: "-3s" }}>🦒</span>
    </div>
  );
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
  const lockRef = useRef(false);

  const matchedCount = cards.filter((c) => c.matched).length / 2;

  const start = (lvl: { id: string; label: string; pairs: number; par: number }) => {
    const animals = shuffle(ANIMALS).slice(0, lvl.pairs);
    const deck = shuffle([...animals, ...animals]).map((animal, i) => ({
      id: i,
      animal,
      flipped: false,
      matched: false,
    }));
    lockRef.current = false;
    setLevel(lvl);
    setCards(deck);
    setOpen([]);
    setMoves(0);
    setFact(null);
    setWon(false);
    sound.play("click");
  };

  const flip = (id: number) => {
    if (won || lockRef.current || !cards[id] || cards[id].flipped || cards[id].matched) return;
    lockRef.current = true;
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
          lockRef.current = false;
        }, 450);
      } else {
        setTimeout(() => {
          sound.play("wrong");
          setCards((cur) => cur.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)));
          setOpen([]);
          lockRef.current = false;
        }, 900);
      }
    } else {
      lockRef.current = false;
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

  const cols = level && level.pairs === 6 ? 4 : level && level.pairs === 9 ? 6 : 6;

  if (!level) {
    return (
      <div className="game-scene scene-ark text-white">
        <ArkScene rain={false} />
        <div className="relative max-w-2xl mx-auto text-center py-12 px-4">
          <div className="text-6xl mb-4 floaty inline-block drop-shadow-xl">🚢</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Noah's Ark Pairs</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Find all the animal pairs before the rain stops. Best score: {stats.best || "—"} · played {stats.plays}×
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => start(lvl)}
                className="group rounded-2xl bg-white/95 text-slate-800 p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 transition-all duration-200"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform floaty">
                  {lvl.pairs === 6 ? "🐤" : lvl.pairs === 9 ? "🦆" : "🌊"}
                </div>
                <div className="font-bold mb-1">{lvl.label}</div>
                <div className="text-sm text-slate-500">{lvl.pairs} pairs · {lvl.par} moves par</div>
                <div className="mt-3 inline-block rounded-full bg-navy text-white text-xs font-semibold px-4 py-1.5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  Start
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm font-semibold mb-2">
          <span className="rounded-full bg-navy text-white px-3 py-1">Pairs: {matchedCount}/{level.pairs}</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-slate-700">Moves: {moves}</span>
        </div>
        <div className="relative h-5 rounded-full bg-white border-2 border-slate-200 overflow-visible">
          <div className="rainbow-bar h-full rounded-full" style={{ width: (matchedCount / level.pairs) * 100 + "%" }} />
          <span className="absolute -top-3 text-xl transition-all duration-500 drop-shadow" style={{ left: "calc(" + (matchedCount / level.pairs) * 100 + "% - 14px)" }}>
            🚢
          </span>
        </div>
      </div>

      {fact && (
        <div className="mb-4 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900 animate-fade-in">
          <span className="mr-1 text-lg">{fact.emoji}</span>
          <strong>{fact.name}:</strong> {fact.fact}
        </div>
      )}

      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: "repeat(" + cols + ", minmax(0, 1fr))" }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={"tile-3d aspect-[3/4] " + (card.flipped || card.matched ? "flipped" : "")}
            aria-label={card.flipped || card.matched ? card.animal.name : "Hidden card"}
          >
            <div className="tile-inner">
              <span className="tile-face tile-front">
                <span className="text-2xl sm:text-3xl text-white/70">❓</span>
              </span>
              <span className={"tile-face tile-back " + (card.matched ? "bg-emerald-50 border-2 border-emerald-300" : "bg-white border-2 border-sky-200 shadow-md")}>
                <span className="text-3xl sm:text-4xl drop-shadow">{card.animal.emoji}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {won && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="panel-glass max-w-md w-full p-8 text-center pop-in">
            <div className="text-6xl mb-3 bounce-in inline-block">🌈</div>
            <h3 className="font-display text-2xl font-bold mb-1">The rain has stopped!</h3>
            <p className="text-muted-foreground mb-4">
              You found all {level.pairs} pairs in {moves} moves.
            </p>
            <div className="flex justify-center gap-1 text-3xl mb-5">
              {[1, 2, 3].map((s) => (
                <span key={s} className={(s <= stars ? "bounce-in" : "opacity-20 grayscale")} style={s <= stars ? { animationDelay: (s * 0.15).toFixed(2) + "s" } : undefined}>⭐</span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-5 italic">
              "I will remember my covenant... I have set my rainbow in the clouds." — Genesis 9:13-14
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => start(level)} className="btn-gold">
                Play again
              </button>
              <button onClick={() => setLevel(null)} className="btn-ghost-light !text-slate-700 !border-slate-300">
                Levels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
