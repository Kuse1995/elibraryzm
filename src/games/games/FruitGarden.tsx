import { useEffect, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { useGameStats } from "../useGameStats";
import { FRUITS, SCENARIOS } from "../data/fruit";

export default function FruitGarden() {
  const { stats, record } = useGameStats("fruit-garden");
  const [stage, setStage] = useState<"intro" | "play" | "done">("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState(0);
  const [disabled, setDisabled] = useState<number[]>([]);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [lesson, setLesson] = useState<string | null>(null);

  const scenario = SCENARIOS[index];
  const collected = picked.length;

  const start = () => {
    setIndex(0);
    setPicked([]);
    setFirstTry(0);
    setDisabled([]);
    setStage("play");
    sound.play("click");
  };

  const choose = (i: number, good: boolean) => {
    if (good) {
      sound.play("correct");
      const isFirst = disabled.length === 0;
      if (isFirst) setFirstTry((n) => n + 1);
      const fruit = FRUITS.find((f) => f.name.toLowerCase() === scenario.fruit.toLowerCase());
      setPicked((p) => (fruit ? [...p, fruit.emoji] : p));
      setLesson(scenario.lesson);
      setDisabled([]);
      setTimeout(() => {
        setLesson(null);
        if (index + 1 < SCENARIOS.length) {
          setIndex((n) => n + 1);
        } else {
          setStage("done");
          const stars = firstTry + (isFirst ? 1 : 0) >= 9 ? 3 : firstTry + (isFirst ? 1 : 0) >= 7 ? 2 : 1;
          sound.play("win");
          confettiBurst(120, 0.5, 0.35);
          record((firstTry + (isFirst ? 1 : 0)) * 100 + 100);
        }
      }, 1400);
    } else {
      sound.play("wrong");
      setWrongId(i);
      setDisabled((d) => [...d, i]);
      setTimeout(() => setWrongId(null), 500);
    }
  };

  useEffect(() => {
    if (stage !== "done") return;
    // nothing extra - end screen handles itself
  }, [stage]);

  if (stage === "intro") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Fruit of the Spirit Garden</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Nine real-life situations, nine fruits. Make the right choice, collect the fruit,
          and watch your tree grow into a garden of the Spirit.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {FRUITS.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
              <span>{f.emoji}</span> {f.name}
            </span>
          ))}
        </div>
        <button onClick={start} className="rounded-full bg-accent px-10 py-3 text-lg font-semibold text-accent-foreground hover:bg-accent/90 shadow-lg">
          Plant my seed 🌱
        </button>
        {stats.plays > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">Best: {stats.best} pts · played {stats.plays}×</p>
        )}
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-7xl mb-4">🌳</div>
        <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">Your garden is blooming!</h3>
        <p className="text-muted-foreground mb-4">
          You collected all nine fruits of the Spirit.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {FRUITS.map((f) => (
            <span key={f.id} className={`inline-flex items-center gap-1 rounded-full ${f.color} px-3 py-1.5 text-sm text-white shadow`}>
              <span>{f.emoji}</span> {f.name}
            </span>
          ))}
        </div>
        <blockquote className="rounded-xl bg-secondary/60 p-5 mb-6 italic text-muted-foreground">
          "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness,
          faithfulness, gentleness and self-control." — Galatians 5:22-23
        </blockquote>
        <button onClick={start} className="rounded-full bg-accent px-10 py-3 text-lg font-semibold text-accent-foreground hover:bg-accent/90 shadow-lg">
          Grow another garden
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Fruit {index + 1} of {SCENARIOS.length}</span>
        <span>Collected: {collected} 🧺</span>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-3xl">{scenario.emoji}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Choose the fruit
              </span>
            </div>
            <p className="text-lg font-medium leading-snug">{scenario.situation}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {scenario.options.map((opt, i) => {
              const isWrong = wrongId === i;
              return (
                <button
                  key={i}
                  disabled={disabled.includes(i)}
                  onClick={() => choose(i, opt.good)}
                  className={`rounded-xl border-2 bg-card p-4 text-left transition-all hover:border-accent hover:shadow-md disabled:opacity-35 disabled:pointer-events-none ${
                    isWrong ? "border-red-400 animate-[shake_0.4s_ease-in-out]" : "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="font-medium">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {lesson && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900 animate-fade-in">
              🌟 {lesson}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-sky-100 to-emerald-100 border border-emerald-200 p-5 text-center">
          <div className="text-7xl leading-none mb-2">{collected < 1 ? "🌱" : collected < 3 ? "🌿" : collected < 6 ? "🌳" : "🌳"}</div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-3">My garden</p>
          <div className="flex flex-wrap justify-center gap-2 min-h-[70px]">
            {FRUITS.slice(0, collected).map((f, i) => (
              <span key={i} className="text-2xl animate-fade-in">{f.emoji}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {FRUITS.map((f) => (
              <span
                key={f.id}
                className={`rounded p-1 text-lg ${picked.includes(f.emoji) ? f.color + " text-white" : "bg-white/60 opacity-40"}`}
                title={f.name}
              >
                {f.emoji}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
