import { useEffect, useMemo, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { useGameStats } from "../useGameStats";
import { VERSES, VERSE_DISPLAY } from "../data/verses";

const ROUNDS = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VerseScramble() {
  const { stats, record } = useGameStats("verse-scramble");
  const [phase, setPhase] = useState<"menu" | "play" | "done">("menu");
  const [round, setRound] = useState<{ reference: string; words: string[]; shuffled: string[] }[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(false);
  const [solvedRefs, setSolvedRefs] = useState<string[]>([]);

  const current = round[idx];

  const start = () => {
    const pickedVerses = shuffle(VERSES).slice(0, ROUNDS);
    setRound(
      pickedVerses.map((v) => {
        let scrambled = shuffle(v.words);
        if (scrambled.join(" ") === v.words.join(" ")) {
          scrambled = shuffle(scrambled);
        }
        return { reference: v.reference, words: v.words, shuffled: scrambled };
      })
    );
    setIdx(0);
    setPicked([]);
    setAttempts(0);
    setScore(0);
    setSolvedRefs([]);
    setPhase("play");
    sound.play("click");
  };

  const tapWord = (i: number) => {
    if (phase !== "play" || !current) return;
    sound.play("pop");
    setPicked((p) => [...p, i]);
  };

  const untap = (slot: number) => {
    setPicked((p) => p.filter((_, j) => j !== slot));
    sound.play("click");
  };

  const check = () => {
    if (!current || picked.length !== current.words.length) return;
    const guess = picked.map((i) => current.shuffled[i]).join(" ");
    if (guess === current.words.join(" ")) {
      sound.play("correct");
      const gain = attempts === 0 ? 50 : attempts === 1 ? 30 : 15;
      setScore((s) => s + gain);
      setSolvedRefs((r) => [...r, current.reference]);
      if (idx + 1 >= ROUNDS) {
        setTimeout(() => {
          setPhase("done");
          confettiBurst(110);
          record(score + gain);
        }, 1500);
      } else {
        setTimeout(() => {
          setIdx((n) => n + 1);
          setPicked([]);
          setAttempts(0);
        }, 1500);
      }
    } else {
      sound.play("wrong");
      setShake(true);
      setAttempts((a) => a + 1);
      setTimeout(() => {
        setShake(false);
        setPicked([]);
      }, 700);
    }
  };

  if (phase === "menu") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">📖</div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Verse Scramble</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The words of a well-known verse are out of order. Tap them in the right sequence
          and carry the scripture with you. Best: {stats.best || "—"} · played {stats.plays}×
        </p>
        <button onClick={start} className="rounded-full bg-accent px-10 py-3 text-lg font-semibold text-accent-foreground hover:bg-accent/90 shadow-lg">
          Unscramble 🧩
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="text-6xl mb-3">🧠</div>
        <h3 className="font-display text-2xl font-bold mb-1">Scripture mastered!</h3>
        <p className="text-muted-foreground mb-6">You unscrambled {solvedRefs.length} of {ROUNDS} verses · {score} points</p>
        <div className="rounded-2xl border bg-card p-5 mb-6 text-left space-y-2">
          {round
            .filter((r) => solvedRefs.includes(r.reference))
            .map((r) => (
              <p key={r.reference} className="text-sm">
                <strong className="text-accent">{r.reference}</strong> — {VERSE_DISPLAY[r.reference]}
              </p>
            ))}
        </div>
        <button onClick={start} className="rounded-full bg-accent px-10 py-3 text-lg font-semibold text-accent-foreground hover:bg-accent/90 shadow-lg">
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Verse {idx + 1} of {ROUNDS}</span>
        <span>Score {score}</span>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm mb-4 text-center">
        <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">{current.reference}</span>
        <div className={`mt-4 min-h-[120px] flex flex-wrap items-center justify-center gap-2 ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
          {picked.length === 0 && <span className="text-sm text-muted-foreground">Tap the words below in the right order…</span>}
          {picked.map((chipIdx, slot) => (
            <button
              key={slot}
              onClick={() => untap(slot)}
              className="rounded-lg border-2 border-accent bg-accent/10 px-3 py-2 font-semibold text-sm hover:bg-accent/20 transition-colors"
            >
              {current.shuffled[chipIdx]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {current.shuffled.map((w, i) => (
          <button
            key={i}
            disabled={picked.includes(i)}
            onClick={() => tapWord(i)}
            className="rounded-lg border bg-card px-3 py-2 font-semibold text-sm hover:border-accent hover:shadow-md disabled:opacity-25 transition-all"
          >
            {w}
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={check}
          disabled={picked.length !== current.words.length}
          className="rounded-full bg-accent px-10 py-3 font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-30 shadow-lg"
        >
          Check verse
        </button>
        {attempts > 0 && <p className="mt-2 text-xs text-muted-foreground">Attempts: {attempts}</p>}
      </div>
    </div>
  );
}
