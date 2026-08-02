import { useRef, useState } from "react";
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

function VerseScene() {
  return (
    <div className="scene-deco">
      <span className="cloud" style={{ top: "10%", width: 120, height: 28, animationDuration: "38s", opacity: 0.5 }} />
      <span className="cloud" style={{ top: "22%", right: "8%", width: 80, height: 20, animationDuration: "48s", animationDelay: "-16s", opacity: 0.35 }} />
      <span className="floaty absolute" style={{ top: "12%", left: "10%", fontSize: 32, opacity: 0.45 }}>📖</span>
      <span className="floaty absolute" style={{ bottom: "12%", right: "10%", fontSize: 28, opacity: 0.4, animationDelay: "-2s" }}>🕊️</span>
    </div>
  );
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
  const busyRef = useRef(false);

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
    busyRef.current = false;
    setIdx(0);
    setPicked([]);
    setAttempts(0);
    setScore(0);
    setSolvedRefs([]);
    setPhase("play");
    sound.play("click");
  };

  const tapWord = (i: number) => {
    if (phase !== "play" || !current || busyRef.current) return;
    if (picked.includes(i)) return;
    sound.play("pop");
    setPicked((p) => [...p, i]);
  };

  const untap = (slot: number) => {
    if (busyRef.current) return;
    setPicked((p) => p.filter((_, j) => j !== slot));
    sound.play("click");
  };

  const check = () => {
    if (!current || picked.length !== current.words.length || busyRef.current) return;
    busyRef.current = true;
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
          busyRef.current = false;
        }, 1500);
      }
    } else {
      sound.play("wrong");
      setShake(true);
      setAttempts((a) => a + 1);
      setTimeout(() => {
        setShake(false);
        setPicked([]);
        busyRef.current = false;
      }, 700);
    }
  };

  if (phase === "menu") {
    return (
      <div className="game-scene scene-verse text-white">
        <VerseScene />
        <div className="relative max-w-2xl mx-auto text-center py-12 px-4">
          <div className="text-6xl mb-4 floaty inline-block drop-shadow-xl">📖</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Verse Scramble</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            The words of a well-known verse are out of order. Tap them in the right sequence
            and carry the scripture with you. Best: {stats.best || "—"} · played {stats.plays}×
          </p>
          <button onClick={start} className="btn-gold text-lg">
            Unscramble 🧩
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="panel-scroll p-6 text-center">
          <div className="text-6xl mb-3 bounce-in inline-block">🧠</div>
          <h3 className="font-display text-2xl font-bold mb-1">Scripture mastered!</h3>
          <p className="text-muted-foreground mb-6">You unscrambled {solvedRefs.length} of {ROUNDS} verses · {score} points</p>
          <div className="rounded-2xl bg-white/70 border border-amber-900/10 p-5 mb-6 text-left space-y-2">
            {round
              .filter((r) => solvedRefs.includes(r.reference))
              .map((r) => (
                <p key={r.reference} className="text-sm">
                  <strong className="text-amber-600">{r.reference}</strong> — {VERSE_DISPLAY[r.reference]}
                </p>
              ))}
          </div>
          <button onClick={start} className="btn-gold text-lg">
            Play again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm font-semibold">
        <span className="rounded-full bg-navy text-white px-3 py-1">Verse {idx + 1} of {ROUNDS}</span>
        <span className="rounded-full bg-secondary px-3 py-1 text-slate-700">Score {score}</span>
      </div>

      <div className="panel-scroll p-6 mb-4 text-center">
        <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">{current.reference}</span>
        <div className={"mt-4 min-h-[110px] flex flex-wrap items-center justify-center gap-2 mb-2 " + (shake ? "animate-[shake_0.4s_ease-in-out]" : "")}>
          {current.words.map((_, slot) => (
            <button
              key={slot}
              onClick={() => untap(slot)}
              className="word-pill min-w-[4.5rem]"
            >
              {picked[slot] !== undefined ? current.shuffled[picked[slot]] : "· · ·"}
            </button>
          ))}
        </div>
        <p className="text-xs text-amber-800/70 mb-1">Tap a filled word above to put it back</p>
      </div>

      <div className="panel-glass p-5 mb-4 flex flex-wrap justify-center gap-2">
        {current.shuffled.map((word, i) => (
          <button
            key={i}
            onClick={() => tapWord(i)}
            disabled={picked.includes(i)}
            className={"word-pill " + (picked.includes(i) ? "used" : "")}
          >
            {word}
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={check}
          disabled={picked.length !== current.words.length}
          className="btn-gold text-lg"
        >
          Check verse
        </button>
        <p className="mt-2 text-xs text-muted-foreground">First try: 50 pts · second: 30 · after: 15</p>
      </div>
    </div>
  );
}
