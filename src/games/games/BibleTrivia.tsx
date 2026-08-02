import { useEffect, useMemo, useRef, useState } from "react";
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
  if (score >= 1050) return { g: "A", msg: "Outstanding — keep studying!" };
  if (score >= 800) return { g: "B", msg: "Very good, well done!" };
  if (score >= 550) return { g: "C", msg: "Good effort — try again to improve." };
  return { g: "D", msg: "Keep going — every scholar starts somewhere." };
}

function TriviaStars() {
  return (
    <div className="scene-deco">
      {[
        { top: "10%", left: "5%", size: 5, delay: "0s" },
        { top: "22%", left: "14%", size: 3, delay: "0.7s" },
        { top: "8%", left: "40%", size: 4, delay: "1.3s" },
        { top: "16%", left: "70%", size: 5, delay: "0.4s" },
        { top: "9%", left: "88%", size: 4, delay: "1s" },
        { top: "30%", left: "56%", size: 3, delay: "1.7s" },
      ].map((s, i) => (
        <span key={i} className="star" style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }} />
      ))}
      <span className="floaty absolute" style={{ top: "14%", right: "14%", fontSize: 34, opacity: 0.4 }}>🕊️</span>
      <span className="floaty absolute" style={{ bottom: "10%", left: "8%", fontSize: 30, opacity: 0.35, animationDelay: "-2.5s" }}>📜</span>
    </div>
  );
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
  const answeredRef = useRef(false);

  const question = round[idx];
  const total = round.length;
  const timer = useMemo(() => TIMER_BY_DIFFICULTY[difficulty] || 15, [difficulty]);

  const finish = (isLast: boolean, finalScore: number) => {
    if (isLast) {
      setPhase("done");
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

  const answer = (choice: number) => {
    if (answeredRef.current || picked !== null || !question) return;
    answeredRef.current = true;
    const correct = choice === question.correct;
    const gain = correct ? 100 + streak * 10 : 0;
    const newScore = score + gain;
    setPicked(choice);
    if (correct) {
      sound.play("correct");
      setScore(newScore);
      setStreak((s) => s + 1);
      setCorrectCount((n) => n + 1);
    } else {
      sound.play("wrong");
      setStreak(0);
    }
    setTimeout(() => finish(idx + 1 >= total, newScore), correct ? 1500 : 1900);
  };
  const answerRef = useRef(answer);
  answerRef.current = answer;

  useEffect(() => {
    if (phase !== "play" || picked !== null || !question) return;
    answeredRef.current = false;
    setTimeLeft(timer);
    const deadline = Date.now() + timer * 1000;
    const iv = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0 && !answeredRef.current) {
        answeredRef.current = true;
        clearInterval(iv);
        answerRef.current(-1);
      }
    }, 200);
    return () => clearInterval(iv);
  }, [phase, idx, picked, question, timer]);

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
    answeredRef.current = false;
    setTimeLeft(timer);
    setPhase("play");
    sound.play("click");
  };

  const useFifty = () => {
    if (!fifty || picked !== null || answeredRef.current) return;
    setFifty(false);
    const wrong = [0, 1, 2, 3].filter((i) => i !== question.correct);
    const removed = shuffle(wrong).slice(0, 2);
    setHidden(removed);
    sound.play("reveal");
  };

  const useSkip = () => {
    if (!skip || picked !== null || answeredRef.current) return;
    answeredRef.current = true;
    setSkip(false);
    setStreak(0);
    sound.play("whoosh");
    setPicked(-2);
    setTimeout(() => finish(idx + 1 >= total, score), 500);
  };

  if (phase === "menu") {
    return (
      <div className="game-scene scene-trivia text-white">
        <TriviaStars />
        <div className="relative max-w-2xl mx-auto text-center py-12 px-4">
          <div className="text-6xl mb-4 floaty inline-block drop-shadow-xl">📜</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Bible Scholar Trivia</h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            Ten questions, a ticking clock, and lifelines for the tough ones. Earn your scholar grade.
            Best: {stats.best || "—"} · played {stats.plays}×
          </p>

          <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-5 mb-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-3">Choose a category</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TRIVIA_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={"rounded-xl px-3 py-3 text-sm font-semibold transition-all " + (category === cat.id ? "bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/30 scale-105" : "bg-white/10 border border-white/15 hover:bg-white/20")}
                >
                  <span className="block text-xl mb-1">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-5 mb-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-3">Difficulty</p>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={"rounded-xl px-2 py-3 text-sm font-semibold transition-all " + (difficulty === d.id ? "bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/30" : "bg-white/10 border border-white/15 hover:bg-white/20")}
                >
                  {d.label}
                  <span className="block text-xs font-normal text-white/70 mt-0.5">{TIMER_BY_DIFFICULTY[d.id]}s each</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={start} className="btn-gold text-lg">
            Begin the test ✍️
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const g = grade(score);
    return (
      <div className="max-w-md mx-auto">
        <div className="game-scene scene-trivia text-white px-6 py-10 text-center">
          <TriviaStars />
          <div className="relative">
            <div className="text-6xl mb-3 bounce-in inline-block">
              {g.g === "S" ? "🏆" : g.g === "A" ? "🥇" : g.g === "B" ? "🥈" : g.g === "C" ? "🥉" : "📖"}
            </div>
            <h3 className="font-display text-2xl font-bold mb-1">Grade: {g.g}</h3>
            <p className="text-white/80 mb-6">{g.msg}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-4">
                <div className="text-3xl font-bold text-amber-300">{score}</div>
                <div className="text-xs text-white/60">Points</div>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-4">
                <div className="text-3xl font-bold text-amber-300">{correctCount}/{total}</div>
                <div className="text-xs text-white/60">Correct</div>
              </div>
            </div>
            <button onClick={start} className="btn-gold text-lg">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, (timeLeft / timer) * 100));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm font-semibold">
        <span className="rounded-full bg-navy text-white px-3 py-1">Question {idx + 1} of {total}</span>
        <span className="rounded-full bg-secondary px-3 py-1 text-slate-700">
          Score {score}{streak > 1 ? " · streak " + streak + " 🔥" : ""}
        </span>
      </div>

      <div className="timer-bar mb-5">
        <div className={"timer-fill " + (timeLeft <= 5 ? "danger" : "")} style={{ width: pct + "%" }} />
      </div>

      <div className="panel-glass p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
            {question.ref || "Scripture"}
          </span>
          <span className={"text-sm font-bold " + (timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-muted-foreground")}>
            ⏱ {timeLeft}s
          </span>
        </div>
        <h3 className="text-xl font-semibold leading-snug">{question.q}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.a.map((opt, i) => {
          if (hidden.includes(i)) return null;
          let cls = "border-slate-200 bg-white hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5";
          if (picked !== null) {
            if (i === question.correct) cls = "border-emerald-400 bg-emerald-50 shadow-md";
            else if (i === picked) cls = "border-red-300 bg-red-50";
            else cls = "border-slate-100 bg-white opacity-45";
          }
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => answer(i)}
              className={"rounded-xl border-2 p-4 text-left font-medium transition-all " + cls}
            >
              <span className="mr-2 font-bold text-amber-500">{String.fromCharCode(65 + i)}.</span>
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
            className="rounded-full border-2 border-slate-200 bg-white px-5 py-2 text-sm font-semibold shadow-sm hover:border-amber-400 hover:shadow-md disabled:opacity-30"
          >
            50:50 {fifty ? "" : "(used)"}
          </button>
          <button
            onClick={useSkip}
            disabled={!skip}
            className="rounded-full border-2 border-slate-200 bg-white px-5 py-2 text-sm font-semibold shadow-sm hover:border-amber-400 hover:shadow-md disabled:opacity-30"
          >
            Skip {skip ? "" : "(used)"}
          </button>
        </div>
      )}

      {picked === -1 && (
        <p className="mt-4 text-center text-sm font-medium text-red-500 animate-fade-in">Time's up! The answer was {question.a[question.correct]}.</p>
      )}
      {picked === -2 && <p className="mt-4 text-center text-sm font-medium text-muted-foreground animate-fade-in">Question skipped.</p>}
    </div>
  );
}
