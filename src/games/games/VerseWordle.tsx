import { useEffect, useMemo, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { dailyWordle } from "../data/wordle";

type LetterState = "green" | "yellow" | "gray";
type Phase = "playing" | "won" | "lost";

const WORD_LEN = 5;
const TRIES = 6;
const STATS_KEY = "verse-wordle-stats";

interface WordleStats {
  played: number;
  wins: number;
  streak: number;
  bestStreak: number;
  lastDate: string;
  lastWord: string;
  lastWon: boolean;
}

const EMPTY_STATS: WordleStats = { played: 0, wins: 0, streak: 0, bestStreak: 0, lastDate: "", lastWord: "", lastWon: false };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readStats(): WordleStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...EMPTY_STATS, ...(JSON.parse(raw) as Partial<WordleStats>) } : EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
}

function evaluate(guess: string, answer: string): LetterState[] {
  const res: LetterState[] = Array(WORD_LEN).fill("gray");
  const ans = answer.split("");
  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === ans[i]) {
      res[i] = "green";
      ans[i] = "";
    }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (res[i] !== "green") {
      const j = ans.indexOf(guess[i]);
      if (j !== -1) {
        res[i] = "yellow";
        ans[j] = "";
      }
    }
  }
  return res;
}

const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

function WordleScene() {
  return (
    <div className="scene-deco">
      <span className="star" style={{ top: "10%", left: "12%" }} />
      <span className="star" style={{ top: "18%", left: "28%", animationDelay: "-1s" }} />
      <span className="star" style={{ top: "8%", left: "72%", animationDelay: "-0.4s" }} />
      <span className="star" style={{ top: "22%", left: "88%", animationDelay: "-1.8s" }} />
      <span className="floaty absolute" style={{ top: "14%", left: "8%", fontSize: 34, opacity: 0.5 }}>📖</span>
      <span className="floaty absolute" style={{ bottom: "14%", right: "8%", fontSize: 30, opacity: 0.4, animationDelay: "-2s" }}>🕊️</span>
    </div>
  );
}

export default function VerseWordle() {
  const entry = useMemo(() => dailyWordle(), []);
  const [stats, setStats] = useState<WordleStats>(readStats);
  const [phase, setPhase] = useState<Phase>(() => {
    const s = readStats();
    if (s.lastDate === todayStr() && s.lastWord === entry.word) return s.lastWon ? "won" : "lost";
    return "playing";
  });
  const [guesses, setGuesses] = useState<string[]>([]);
  const [rows, setRows] = useState<LetterState[][]>([]);
  const [current, setCurrent] = useState("");
  const [shakeRow, setShakeRow] = useState(false);

  const submit = () => {
    if (phase !== "playing") return;
    if (current.length !== WORD_LEN) {
      setShakeRow(true);
      sound.play("wrong");
      setTimeout(() => setShakeRow(false), 450);
      return;
    }
    const states = evaluate(current, entry.word);
    const nextGuesses = [...guesses, current];
    setGuesses(nextGuesses);
    setRows((r) => [...r, states]);
    setCurrent("");
    if (current === entry.word) {
      finish(true);
    } else if (nextGuesses.length >= TRIES) {
      finish(false);
    } else {
      sound.play(states.some((s) => s !== "gray") ? "pop" : "click");
    }
  };

  const finish = (won: boolean) => {
    sound.play(won ? "win" : "wrong");
    if (won) confettiBurst(110);
    setPhase(won ? "won" : "lost");
    setStats((prev) => {
      let next: WordleStats;
      if (prev.lastDate === todayStr()) {
        next = { ...prev, lastWord: entry.word, lastWon: won };
      } else {
        const streak = won ? (prev.lastDate === yesterdayStr() ? prev.streak + 1 : 1) : 0;
        next = {
          ...prev,
          played: prev.played + 1,
          wins: prev.wins + (won ? 1 : 0),
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          lastDate: todayStr(),
          lastWord: entry.word,
          lastWon: won,
        };
      }
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      if (e.key === "Enter") {
        submit();
        return;
      }
      if (e.key === "Backspace") {
        setCurrent((c) => c.slice(0, -1));
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key) && current.length < WORD_LEN) {
        setCurrent((c) => c + e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pressKey = (key: string) => {
    if (phase !== "playing") return;
    if (key === "ENTER") {
      submit();
    } else if (key === "BACK") {
      setCurrent((c) => c.slice(0, -1));
    } else if (current.length < WORD_LEN) {
      sound.play("pop");
      setCurrent((c) => c + key);
    }
  };

  const keyStates: Record<string, LetterState | undefined> = {};
  const rank: Record<LetterState, number> = { green: 3, yellow: 2, gray: 1 };
  rows.forEach((row, ri) => {
    const guess = guesses[ri];
    if (!guess) return;
    [...guess].forEach((ch, i) => {
      const st = row[i];
      const prev = keyStates[ch];
      if (!prev || rank[st] > rank[prev]) keyStates[ch] = st;
    });
  });

  const keyClass = (key: string): string => {
    if (key === "ENTER" || key === "BACK") return "bg-white/15 text-white border-white/20";
    const st = keyStates[key];
    if (st === "green") return "bg-emerald-500 text-white border-emerald-600";
    if (st === "yellow") return "bg-amber-400 text-white border-amber-500";
    if (st === "gray") return "bg-slate-600/70 text-white/60 border-slate-500";
    return "bg-white/15 text-white border-white/20";
  };

  const tileClass = (state: LetterState | null, hasLetter: boolean): string => {
    if (state === "green") return "bg-emerald-500 border-emerald-600 text-white";
    if (state === "yellow") return "bg-amber-400 border-amber-500 text-white";
    if (state === "gray") return "bg-slate-600/80 border-slate-500 text-white";
    if (hasLetter) return "bg-white/20 border-white/70 text-white";
    return "bg-white/5 border-slate-300/40 text-white";
  };

  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  return (
    <div className="game-scene scene-wordle text-white">
      <WordleScene />
      <div className="relative mx-auto max-w-md px-4 py-8">
        {phase === "playing" ? (
          <>
            <div className="mb-5 text-center">
              <h2 className="font-display text-2xl font-bold">Verse Wordle</h2>
              <p className="text-sm text-white/75">Guess the five-letter Bible word — {TRIES} tries</p>
            </div>

            <div className="mb-5 flex flex-col gap-1.5">
              {Array.from({ length: TRIES }).map((_, r) => {
                const guess = guesses[r];
                const isActiveRow = r === guesses.length && phase === "playing";
                const letters = isActiveRow ? current.padEnd(WORD_LEN, " ").split("") : (guess ?? "").padEnd(WORD_LEN, " ").split("");
                return (
                  <div
                    key={r}
                    className={
                      "flex justify-center gap-1.5 " +
                      (r === guesses.length - 1 && !isActiveRow ? "pop-in " : "") +
                      (isActiveRow && shakeRow ? "animate-[shake_0.4s_ease-in-out]" : "")
                    }
                  >
                    {letters.map((ch, i) => (
                      <div
                        key={i}
                        className={
                          "flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl font-black uppercase " +
                          tileClass(isActiveRow ? null : (rows[r]?.[i] ?? null), ch.trim() !== "")
                        }
                      >
                        {ch.trim()}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              {KEY_ROWS.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-1.5">
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => pressKey(key)}
                      className={
                        "rounded-md border px-0 py-2.5 text-sm font-bold transition-transform active:scale-95 " +
                        keyClass(key) +
                        (key.length > 1 ? " flex-1 " : " w-8 flex-none ")
                      }
                    >
                      {key === "BACK" ? "⌫" : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-white/60">
              Green = right letter, right place · gold = right letter, wrong place
            </p>
          </>
        ) : (
          <div className="panel-scroll p-6 text-center">
            <div className="bounce-in mb-2 inline-block text-6xl">{phase === "won" ? "🎉" : "📖"}</div>
            <h3 className="font-display text-2xl font-bold">
              {phase === "won" ? "You found the word!" : "Today's word"}
            </h3>
            <div className="mt-3 flex justify-center gap-1.5">
              {entry.word.split("").map((ch, i) => (
                <div
                  key={i}
                  className="pop-in flex h-12 w-12 items-center justify-center rounded-lg border-2 border-emerald-600 bg-emerald-500 text-xl font-black text-white"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  {phase === "won" ? ch : ch}
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {phase === "lost" && "It was "}
              <strong className="text-foreground">{entry.word}</strong>
              {phase === "lost" && " — don't worry, a new word comes tomorrow."}
            </p>
            <div className="mt-5 rounded-2xl border bg-card p-5 text-left">
              <p className="text-base leading-relaxed">“{entry.verse}”</p>
              <p className="mt-2 text-sm font-semibold text-accent">— {entry.reference}</p>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 text-sm">
              <div className="rounded-xl bg-card p-3">
                <div className="font-display text-xl font-bold">{stats.played}</div>
                <div className="text-xs text-muted-foreground">Played</div>
              </div>
              <div className="rounded-xl bg-card p-3">
                <div className="font-display text-xl font-bold">{winRate}%</div>
                <div className="text-xs text-muted-foreground">Won</div>
              </div>
              <div className="rounded-xl bg-card p-3">
                <div className="font-display text-xl font-bold">🔥 {stats.streak}</div>
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
              <div className="rounded-xl bg-card p-3">
                <div className="font-display text-xl font-bold">{stats.bestStreak}</div>
                <div className="text-xs text-muted-foreground">Best</div>
              </div>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">⏳ A new word arrives tomorrow — come back and keep your streak.</p>
          </div>
        )}
      </div>
    </div>
  );
}
