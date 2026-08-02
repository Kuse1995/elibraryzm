import { useEffect, useMemo, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { useGameStats } from "../useGameStats";
import { CHARACTERS, type Character } from "../data/whoami";

const ROUNDS = 6;
const DECOY_COUNT = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBank(name: string): { letter: string; id: number }[] {
  const letters = name.toLowerCase().replace(/[^a-z]/g, "").split("");
  const decoys: string[] = [];
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  while (decoys.length < DECOY_COUNT) {
    const l = alphabet[Math.floor(Math.random() * 26)];
    if (!letters.includes(l) && !decoys.includes(l)) decoys.push(l);
  }
  return shuffle([...letters, ...decoys]).map((letter, id) => ({ letter, id }));
}

function DetectiveScene() {
  return (
    <div className="scene-deco">
      {[
        { top: "10%", left: "6%", size: 5, delay: "0s" },
        { top: "20%", left: "18%", size: 3, delay: "0.8s" },
        { top: "8%", left: "44%", size: 4, delay: "1.4s" },
        { top: "14%", left: "72%", size: 5, delay: "0.5s" },
        { top: "8%", left: "90%", size: 4, delay: "1.1s" },
        { top: "26%", left: "34%", size: 3, delay: "1.9s" },
      ].map((s, i) => (
        <span key={i} className="star" style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }} />
      ))}
      <span className="floaty absolute" style={{ top: "12%", right: "12%", fontSize: 34, opacity: 0.45 }}>🔍</span>
    </div>
  );
}

export default function WhoAmI() {
  const { stats, record } = useGameStats("who-am-i");
  const [phase, setPhase] = useState<"menu" | "play" | "done">("menu");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [idx, setIdx] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(1);
  const [bank, setBank] = useState<{ letter: string; id: number }[]>([]);
  const [used, setUsed] = useState<number[]>([]);
  const [answer, setAnswer] = useState<number[]>([]); // bank tile ids in order
  const [wrongPicks, setWrongPicks] = useState(0);
  const [total, setTotal] = useState(0);
  const [solved, setSolved] = useState(0);
  const [roundOver, setRoundOver] = useState<"win" | "lost" | null>(null);
  const [shake, setShake] = useState(false);

  const character = characters[idx];

  const start = () => {
    setCharacters(shuffle(CHARACTERS).slice(0, ROUNDS));
    setIdx(0);
    setTotal(0);
    setSolved(0);
    setPhase("play");
    sound.play("click");
  };

  useEffect(() => {
    if (phase !== "play" || !character) return;
    setHintsUsed(1);
    setBank(buildBank(character.name));
    setUsed([]);
    setAnswer([]);
    setWrongPicks(0);
    setRoundOver(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  const bankById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const tile of bank) map[tile.id] = tile.letter;
    return map;
  }, [bank]);

  const tapLetter = (id: number) => {
    if (roundOver || used.includes(id) || answer.length >= character.name.length) return;
    sound.play("pop");
    setUsed((u) => [...u, id]);
    setAnswer((a) => [...a, id]);
  };

  const tapSlot = (slot: number) => {
    if (roundOver) return;
    const id = answer[slot];
    setAnswer((a) => a.filter((_, j) => j !== slot));
    setUsed((u) => u.filter((x) => x !== id));
    sound.play("click");
  };

  const nextHint = () => {
    if (hintsUsed >= character.hints.length) return;
    setHintsUsed((h) => h + 1);
    sound.play("reveal");
  };

  const check = () => {
    if (roundOver || answer.length !== character.name.length) return;
    const guess = answer.map((id) => bankById[id] || "").join("").toLowerCase();
    if (guess === character.name.toLowerCase()) {
      sound.play("correct");
      const points = Math.max(10, 100 - (hintsUsed - 1) * 20 - wrongPicks * 5);
      setTotal((t) => t + points);
      setSolved((n) => n + 1);
      setRoundOver("win");
      if (idx + 1 >= ROUNDS) {
        setTimeout(() => {
          setPhase("done");
          confettiBurst(110);
          record(total + points);
        }, 1600);
      } else {
        setTimeout(() => {
          setIdx((n) => n + 1);
        }, 1600);
      }
    } else {
      sound.play("wrong");
      setShake(true);
      setWrongPicks((w) => w + 1);
      setTimeout(() => setShake(false), 500);
      setUsed([]);
      setAnswer([]);
      if (wrongPicks + 1 >= 3) {
        setRoundOver("lost");
        setTimeout(() => {
          if (idx + 1 >= ROUNDS) {
            setPhase("done");
            record(total);
          } else {
            setIdx((n) => n + 1);
          }
        }, 2200);
      }
    }
  };

  if (phase === "menu") {
    return (
      <div className="game-scene scene-detect text-white">
        <DetectiveScene />
        <div className="relative max-w-2xl mx-auto text-center py-12 px-4">
          <div className="text-6xl mb-4 floaty inline-block drop-shadow-xl">🕵️</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Who Am I?</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Six Bible heroes, five clues each. Reveal hints (each costs points),
            spell the name, and join the hall of the faithful.
          </p>
          <button onClick={start} className="btn-gold text-lg">
            Start investigating 🔍
          </button>
          {stats.plays > 0 && <p className="mt-4 text-sm text-white/60">Best: {stats.best} pts · played {stats.plays}×</p>}
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="max-w-md mx-auto">
        <div className="game-scene scene-detect text-white px-6 py-10 text-center">
          <DetectiveScene />
          <div className="relative">
            <div className="text-6xl mb-3 bounce-in inline-block">🏅</div>
            <h3 className="font-display text-2xl font-bold mb-1">Case closed!</h3>
            <p className="text-white/80 mb-6">You identified {solved} of {ROUNDS} Bible heroes.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-4">
                <div className="text-3xl font-bold text-amber-300">{total}</div>
                <div className="text-xs text-white/60">Points</div>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-4">
                <div className="text-3xl font-bold text-amber-300">{solved}/{ROUNDS}</div>
                <div className="text-xs text-white/60">Solved</div>
              </div>
            </div>
            <button onClick={start} className="btn-gold text-lg">
              Play again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm font-semibold">
        <span className="rounded-full bg-navy text-white px-3 py-1">Mystery {idx + 1} of {ROUNDS}</span>
        <span className="rounded-full bg-secondary px-3 py-1 text-slate-700">Points {total} · solved {solved}</span>
      </div>

      <div className="panel-dark p-6 mb-4 text-center text-white">
        <div className="text-5xl mb-3 floaty inline-block">{character.emoji}</div>
        <div className="mx-auto mb-4 max-w-md space-y-2">
          {character.hints.slice(0, hintsUsed).map((h, i) => (
            <p key={i} className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm animate-fade-in">
              <span className="font-bold text-amber-300 mr-1">{i + 1}.</span> {h}
            </p>
          ))}
          {hintsUsed < character.hints.length && (
            <button
              onClick={nextHint}
              className="rounded-full bg-white/10 border border-white/25 px-5 py-1.5 text-sm font-semibold text-white/85 hover:bg-white/20"
            >
              Reveal hint {hintsUsed + 1} (−20 pts)
            </button>
          )}
        </div>
      </div>

      <div className={"panel-glass p-6 mb-4 " + (shake ? "animate-[shake_0.4s_ease-in-out]" : "")}>
        <div className="flex justify-center gap-1.5 mb-4 min-h-[44px] flex-wrap">
          {Array.from({ length: character.name.length }).map((_, i) => (
            <button
              key={i}
              onClick={() => tapSlot(i)}
              className="h-12 w-10 rounded-lg border-2 border-dashed border-slate-400/60 text-lg font-bold uppercase bg-slate-50 text-slate-800 hover:border-amber-400 transition-colors shadow-inner"
            >
              {answer[i] !== undefined ? bankById[answer[i]] || "" : ""}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {bank.map((tile) => (
            <button
              key={tile.id}
              disabled={used.includes(tile.id) || roundOver !== null}
              onClick={() => tapLetter(tile.id)}
              className="tile-wood h-12 w-10 text-lg font-bold uppercase"
            >
              {tile.letter}
            </button>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={check}
            disabled={answer.length !== character.name.length || roundOver !== null}
            className="btn-gold"
          >
            Check answer
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Wrong letters: {wrongPicks}/3</p>
        </div>
      </div>

      {roundOver === "lost" && (
        <p className="text-center font-medium text-red-500 animate-fade-in">
          It was {character.name} {character.emoji}! {character.hints[character.hints.length - 1]}
        </p>
      )}
    </div>
  );
}
