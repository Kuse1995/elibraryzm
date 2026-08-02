import { useEffect, useMemo, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { useGameStats } from "../useGameStats";
import { TRIVIA_CATEGORIES, TIMER_BY_DIFFICULTY, questionPool, type TriviaCategory } from "../data/trivia";

interface Difficulty {
  id: string;
  label: string;
}

const DIFFICULTIES: Difficulty[] = [
  { id: "easy", label: "Easy" },
  { id: "normal", label: "Normal" },
  { id: "hard", label: "Hard" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface RoundQuestion {
  q: string;
  a: string[];
  correct: number;
  ref?: string;
}

function buildRound(category: TriviaCategory | "mixed"): RoundQuestion[] {
  const pool = questionPool(category);
  const picked = shuffle(pool).slice(0, 10);
  return picked.map((item) => {
    const order = shuffle([0, 1, 2, 3]);
    return {
      q: item.q,
      ref: item.ref,
      a: order.map((i) => item.a[i]),
      correct: order.indexOf(item.correct),
    };
  });
}

function grade(score: number): { g: string; msg: string } {
  if (score >= 1300) return { g: "S", msg: "A true Bible scholar!" };
  if (score >= 1050) return { g: "A", msg: "Outstanding - keep studying!" };
  if (score >= 800) return { g: "B", msg: "Very good, well done!" };
  if (score >= 550) return { g: "C", msg: "Good effort - try again to improve." };
  return { g: "D", msg: "Keep going - every scholar starts somewhere." };
}

export default function BibleTrivia() {
  const { stats, record } = useGameStats("bible-trivia");
  const [phase, setPhase] = useState<"menu" | "play" | "done">("menu");
  const [category, setCategory] = useState<TriviaCategory | "mixed">("mixed");
  const [difficulty, setDifficulty] = useState("normal");
  const [round, setRound] = useState<RoundQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [picked, setPicked] = useState<number | null>(null);
  const [fifty, setFifty] = useState(true);
  const [skip, setSkip] = useState(true);
  const [hidden, setHidden] = useState<number[]>([]);

  const question = round[idx];
  const total = round.length;
  const timer = useMemo(() => TIMER_BY_DIFFICULTY[difficulty] || 15, [difficulty]);

  const start = () => {
    setRound(buildRound(category));
    setIdx(0);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setPicked(null);
    setHidden([]);
    setFifty(true);
    setSkip(true);
    setTimeLeft(timer);
    setPhase("play");
    sound.play("click");
  };

  useEffect(() => {
    if (phase !== "play" || picked !== null || !question) return;
    setTimeLeft(timer);
    const t = setInterval(() => {
      setTimeLeft((n) => {
        if (n <= 1) {
          clearInterval(t);
          answer(-1);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, picked, question, timer]);

  const answer = (choice: number) => {
    if (picked !== null) return;
    setPicked(choice);
    if (choice === question.correct) {
      sound.play("correct");
      const gain = 100 + streak * 10;
      setScore((s) => s + gain);
      setStreak((s) => s + 1);
      setCorrectCount((n) => n + 1);
    } else {
      sound.play("wrong");
      setStreak(0);
    }
    setTimeout(next, 1600);
  };

  const next = () => {
    if (idx + 1 >= total) {
      setPhase("done");
      const finalScore = score;
      const g = grade(finalScore);
      if (g.g === "S" || g.g === "A") {
        sound.play("win");
        confettiBurst(120);
      }
      record(finalScore);
    } else {
      setIdx((n) => n + 1);
      setPicked(null);
      setHidden([]);
    }
  };

  const useFifty = () => {
    if (!fifty || picked !== null) return;
    setFifty(false);
    const wrong = [0, 1, 2, 3].filter((i) => i !== question.correct);
    const removed = shuffle(wrong).slice(0, 2);
    setHidden(removed);
    sound.play("reveal");
  };

  const useSkip = () => {
    if (!skip || picked !== null) return;
    setSkip(false);
    setStreak(0);
    sound.play("whoosh");
    setPicked(-2);
    setTimeout(next, 500);
  };

  if (phase === "menu") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">📜</div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Bible Scholar Trivia</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Ten questions, a ticking clock, and lifelines for the tough ones. Earn your scholar grade.
          Best: {stats.best || "—"} · played {stats.plays}×
        </p>
        <div className="mb-3 text-left text-sm font-semibold text-muted-foreground">Choose a category</div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {TRIVIA_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id as TriviaCategory | "mixed")}
              className={`rounded-xl border-2 p-4 transition-all ${category === c.id ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-card hover:border-accent/50"}`}
            >
              <div className="text-2xl mb-1">{c.emoji}</div>
              <div className="font-semibold text-sm">{c.label}</div>
            </button>
          ))}
        </div>
        <div className="mb-8 text-left text-sm font-semibold text-muted-foreground">Difficulty</div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`rounded-xl border-2 py-3 transition-all ${difficulty === d.id ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-card hover:border-accent/50"}`}
            >
              {d.label}
              <span className="block text-xs text-muted-foreground">{TIMER_BY_DIFFICULTY[d.id]}s each</span>
            </button>
          ))}
        </div>
        <button onClick={start} className="rounded-full bg-accent px-10 py-3 text-lg font-semibold text-accent-foreground hover:bg-accent/90 shadow-lg">
          Begin the test ✍️
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const g = grade(score);
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-3">{g.g === "S" ? "🏆" : g.g === "A" ? "🥇" : g.g === "B" ? "🥈" : g.g === "C" ? "🥉" : "📖"}</div>
        <h3 className="font-display text-2xl font-bold mb-1">Grade: {g.g}</h3>
        <p className="text-muted-foreground mb-4">{g.msg}</p>
        <div className="grid grid-cols-2 gap-3 mb-6 text-center">
          <div className="rounded-xl bg-secondary p-4">
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
          <div className="rounded-xl bg-secondary p-4">
            <div className="text-2xl font-bold">{correctCount}/{total}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
        </div>
        <button onClick={start} className="rounded-full bg-accent px-10 py-3 text-lg font-semibold text-accent-foreground hover:bg-accent/90 shadow-lg">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {idx + 1} of {total}</span>
        <span>Score {score} {streak > 1 && <span className="text-accent font-semibold">· streak {streak}🔥</span>}</span>
      </div>

      <div className="mb-5">
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
            style={{ width: `${(idx / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
            {question.ref || "Scripture"}
          </span>
          <span className={`text-sm font-bold ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}>
            ⏱ {timeLeft}s
          </span>
        </div>
        <h3 className="text-xl font-semibold leading-snug">{question.q}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.a.map((opt, i) => {
          if (hidden.includes(i)) return null;
          let cls = "border-border bg-card hover:border-accent hover:shadow-md";
          if (picked !== null) {
            if (i === question.correct) cls = "border-emerald-400 bg-emerald-50";
            else if (i === picked) cls = "border-red-300 bg-red-50";
            else cls = "border-border bg-card opacity-50";
          }
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => answer(i)}
              className={`rounded-xl border-2 p-4 text-left font-medium transition-all ${cls}`}
            >
              <span className="mr-2 text-accent font-bold">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {picked === null && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={useFifty}
            disabled={!fifty}
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-30"
          >
            50:50 {fifty ? "" : "(used)"}
          </button>
          <button
            onClick={useSkip}
            disabled={!skip}
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-30"
          >
            Skip {skip ? "" : "(used)"}
          </button>
        </div>
      )}

      {picked === -1 && (
        <p className="mt-4 text-center text-sm font-medium text-red-500">Time's up! The answer was {question.a[question.correct]}.</p>
      )}
      {picked === -2 && <p className="mt-4 text-center text-sm font-medium text-muted-foreground">Question skipped.</p>}
    </div>
  );
}
