import { useEffect, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { useGameStats } from "../useGameStats";
import { TIMELINE_ROUNDS, TimelineRound } from "../data/timeline";

const ROUNDS_PER_GAME = 3;

function shuffledOrder(len: number): number[] {
  const idx = Array.from({ length: len }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  if (idx.every((v, i) => v === i)) {
    [idx[0], idx[1]] = [idx[1], idx[0]];
  }
  return idx;
}

function TimelineScene() {
  return (
    <div className="scene-deco">
      <span className="star" style={{ top: "12%", left: "16%" }} />
      <span className="star" style={{ top: "20%", left: "80%", animationDelay: "-1.2s" }} />
      <span className="floaty absolute" style={{ top: "12%", right: "10%", fontSize: 34, opacity: 0.5 }}>🕰️</span>
      <span className="floaty absolute" style={{ bottom: "12%", left: "8%", fontSize: 30, opacity: 0.4, animationDelay: "-2s" }}>📜</span>
    </div>
  );
}

export default function BibleTimeline() {
  const { stats, record } = useGameStats("bible-timeline");
  const [phase, setPhase] = useState<"menu" | "play" | "done">("menu");
  const [rounds, setRounds] = useState<TimelineRound[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [results, setResults] = useState<TimelineRound[]>([]);

  const round = rounds[roundIdx];

  const start = () => {
    const picked = shuffledOrder(TIMELINE_ROUNDS.length)
      .slice(0, ROUNDS_PER_GAME)
      .map((i) => TIMELINE_ROUNDS[i]);
    setRounds(picked);
    setRoundIdx(0);
    setOrder(shuffledOrder(picked[0].events.length));
    setSelected(null);
    setWrongFlash([]);
    setScore(0);
    setElapsed(0);
    setWrongChecks(0);
    setResults([]);
    setPhase("play");
    sound.play("click");
  };

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase, roundIdx]);

  const tapCard = (i: number) => {
    if (phase !== "play" || !round) return;
    if (selected === null) {
      setSelected(i);
      sound.play("click");
      return;
    }
    if (selected === i) {
      setSelected(null);
      return;
    }
    setOrder((o) => {
      const next = [...o];
      [next[selected], next[i]] = [next[i], next[selected]];
      return next;
    });
    setSelected(null);
    sound.play("pop");
  };

  const check = () => {
    if (!round) return;
    const correct = order.every((v, i) => v === i);
    if (correct) {
      sound.play("correct");
      const gain = Math.max(100, 1000 - elapsed * 10 - wrongChecks * 150);
      const newScore = score + gain;
      setScore(newScore);
      setResults((r) => [...r, round]);
      confettiBurst(60);
      if (roundIdx + 1 >= ROUNDS_PER_GAME) {
        setTimeout(() => {
          setPhase("done");
          record(newScore);
        }, 900);
      } else {
        const nextRound = rounds[roundIdx + 1];
        setTimeout(() => {
          setRoundIdx((n) => n + 1);
          setOrder(shuffledOrder(nextRound.events.length));
          setSelected(null);
          setElapsed(0);
          setWrongChecks(0);
          setWrongFlash([]);
        }, 900);
      }
    } else {
      sound.play("wrong");
      setWrongChecks((c) => c + 1);
      setWrongFlash(order.map((_, i) => i).filter((i) => order[i] !== i));
      setTimeout(() => setWrongFlash([]), 1100);
    }
  };

  if (phase === "menu") {
    return (
      <div className="game-scene scene-timeline text-white">
        <TimelineScene />
        <div className="relative mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="floaty mb-4 inline-block text-6xl drop-shadow-xl">🕰️</div>
          <h2 className="font-display mb-2 text-2xl font-bold md:text-3xl">Bible Timeline</h2>
          <p className="mx-auto mb-8 max-w-md text-white/80">
            Bible history, scrambled. Swap the events back into the true order — three rounds of six
            events, and the clock is running. Speed and accuracy earn the points.
            Best: {stats.best || "—"} · played {stats.plays}×
          </p>
          <button onClick={start} className="btn-gold text-lg">
            Sort the events 📜
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const grade =
      score >= 2500 ? "Prophet of the Bible" : score >= 1800 ? "Bible Scholar" : score >= 1000 ? "Faithful Scribe" : "Eager Student";
    return (
      <div className="mx-auto max-w-lg">
        <div className="panel-scroll p-6 text-center">
          <div className="bounce-in mb-3 inline-block text-6xl">📜</div>
          <h3 className="font-display mb-1 text-2xl font-bold">History restored!</h3>
          <p className="mb-1 text-sm text-muted-foreground">{grade} · {score} points</p>
          <p className="mb-6 text-sm text-muted-foreground">Best: {stats.best || score}</p>
          <div className="mb-6 space-y-2 rounded-2xl bg-white/70 border border-amber-900/10 p-5 text-left">
            {results.map((r) => (
              <p key={r.title} className="text-sm">
                <span className="mr-1 text-emerald-600">✓</span>
                <strong className="text-amber-600">{r.title}</strong>{" "}
                <span className="text-muted-foreground">
                  — {r.events[0].ref} to {r.events[r.events.length - 1].ref}
                </span>
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
        <span className="min-w-0 rounded-full bg-navy px-3 py-1 text-white">
          Round {roundIdx + 1} of {ROUNDS_PER_GAME} — {round.title}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/70 px-3 py-1 text-slate-700">⏱ {elapsed}s</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-slate-700">Score {score}</span>
        </span>
      </div>

      <div className="mb-4 space-y-2">
        {order.map((eventIdx, pos) => {
          const ev = round.events[eventIdx];
          const isWrong = wrongFlash.includes(pos);
          return (
            <button
              key={pos}
              onClick={() => tapCard(pos)}
              className={
                "card-shine flex w-full items-center gap-3 rounded-xl border-2 bg-white/85 p-3 text-left shadow-md transition-all " +
                (selected === pos
                  ? "scale-[1.02] border-accent ring-2 ring-accent/40"
                  : isWrong
                    ? "animate-[shake_0.4s_ease-in-out] border-rose-500 bg-rose-50"
                    : "border-transparent hover:scale-[1.01]")
              }
            >
              <span
                className={
                  "flex h-8 w-8 flex-none items-center justify-center rounded-full font-display text-sm font-bold " +
                  (selected === pos ? "bg-accent text-white" : "bg-navy text-white")
                }
              >
                {pos + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800">{ev.text}</span>
              <span className="text-xs text-amber-700/70">{ev.ref}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-3 text-center text-xs text-muted-foreground">
        Tap two events to swap them — oldest at the top, latest at the bottom
      </p>

      <div className="text-center">
        <button onClick={check} className="btn-gold text-lg">
          Check order
        </button>
        <p className="mt-2 text-xs text-muted-foreground">Wrong checks cost points — be sure before you check.</p>
      </div>
    </div>
  );
}
