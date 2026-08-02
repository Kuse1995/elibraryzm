import { useEffect, useRef, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { useGameStats } from "../useGameStats";
import { FRUITS, SCENARIOS } from "../data/fruit";

function GardenScene() {
  return (
    <div className="scene-deco">
      <span className="sun" style={{ top: "-34px", right: "10%", width: 92, height: 92 }} />
      <span className="cloud" style={{ top: "12%", left: "8%", width: 110, height: 26, animationDuration: "40s", opacity: 0.85 }} />
      <span className="cloud" style={{ top: "22%", right: "20%", width: 70, height: 18, animationDuration: "50s", animationDelay: "-18s", opacity: 0.7 }} />
      <span className="floaty absolute" style={{ top: "18%", left: "16%", fontSize: 34, opacity: 0.5 }}>🦋</span>
      <span className="floaty absolute" style={{ bottom: "14%", right: "12%", fontSize: 30, opacity: 0.5, animationDelay: "-2.5s" }}>🐝</span>
    </div>
  );
}

export default function FruitGarden() {
  const { stats, record } = useGameStats("fruit-garden");
  const [stage, setStage] = useState<"intro" | "play" | "done">("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState(0);
  const [disabled, setDisabled] = useState<number[]>([]);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [lesson, setLesson] = useState<string | null>(null);
  const busyRef = useRef(false);

  const scenario = SCENARIOS[index];
  const collected = picked.length;

  const start = () => {
    busyRef.current = false;
    setIndex(0);
    setPicked([]);
    setFirstTry(0);
    setDisabled([]);
    setLesson(null);
    setWrongId(null);
    setStage("play");
    sound.play("click");
  };

  const choose = (i: number, good: boolean) => {
    if (busyRef.current) return;
    if (good) {
      busyRef.current = true;
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
          busyRef.current = false;
        } else {
          setStage("done");
          const clean = firstTry + (isFirst ? 1 : 0);
          const stars = clean >= 9 ? 3 : clean >= 7 ? 2 : 1;
          sound.play("win");
          confettiBurst(120, 0.5, 0.35);
          record(clean * 100 + stars * 100);
          busyRef.current = false;
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
    // end screen handles itself
  }, [stage]);

  if (stage === "intro") {
    return (
      <div className="game-scene scene-garden">
        <GardenScene />
        <div className="relative max-w-2xl mx-auto text-center py-12 px-4">
          <div className="text-6xl mb-4 floaty inline-block drop-shadow">🌱</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Fruit of the Spirit Garden</h2>
          <p className="text-slate-700 mb-6 max-w-lg mx-auto">
            Nine real-life situations, nine fruits. Make the right choice, collect the fruit,
            and watch your tree grow into a garden of the Spirit.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {FRUITS.map((f) => (
              <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-white/85 border border-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
                <span>{f.emoji}</span> {f.name}
              </span>
            ))}
          </div>
          <button onClick={start} className="btn-gold text-lg">
            Plant my seed 🌱
          </button>
          {stats.plays > 0 && (
            <p className="mt-4 text-sm text-slate-600">Best: {stats.best} pts · played {stats.plays}×</p>
          )}
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="game-scene scene-garden px-6 py-10 text-center">
          <GardenScene />
          <div className="relative">
            <div className="text-7xl mb-4 bounce-in inline-block">🌳</div>
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">Your garden is blooming!</h3>
            <p className="text-slate-700 mb-4">
              You collected all nine fruits of the Spirit.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {FRUITS.map((f) => (
                <span key={f.id} className={"inline-flex items-center gap-1 rounded-full " + f.color + " px-3 py-1.5 text-sm text-white shadow-lg"}>
                  <span>{f.emoji}</span> {f.name}
                </span>
              ))}
            </div>
            <blockquote className="rounded-xl bg-white/85 border border-white p-5 mb-6 italic text-slate-600 shadow-md">
              "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness,
              faithfulness, gentleness and self-control." — Galatians 5:22-23
            </blockquote>
            <button onClick={start} className="btn-gold text-lg">
              Grow another garden
            </button>
          </div>
        </div>
      </div>
    );
  }

  const treeEmoji = collected < 1 ? "🌱" : collected < 3 ? "🌿" : collected < 6 ? "🪴" : "🌳";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm font-semibold">
        <span className="rounded-full bg-navy text-white px-3 py-1">Fruit {index + 1} of {SCENARIOS.length}</span>
        <span className="rounded-full bg-secondary px-3 py-1 text-slate-700">Collected: {collected} 🧺</span>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_230px]">
        <div className="space-y-4">
          <div className="panel-glass p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-3xl">{scenario.emoji}</span>
              <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
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
                  className={"rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-all hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-35 disabled:pointer-events-none " + (isWrong ? "border-red-400 animate-[shake_0.4s_ease-in-out]" : "border-slate-200")}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="font-semibold text-slate-800">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {lesson && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900 animate-fade-in shadow-sm">
              🌟 {lesson}
            </div>
          )}
        </div>

        <div className="game-scene scene-garden p-5 text-center h-fit">
          <GardenScene />
          <div className="relative">
            <div className="text-7xl leading-none mb-2 drop-shadow">{treeEmoji}</div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-900 mb-3">My garden</p>
            <div className="flex flex-wrap justify-center gap-2 min-h-[70px]">
              {FRUITS.slice(0, collected).map((f, i) => (
                <span key={i} className="text-2xl pop-in" style={{ animationDelay: (i * 0.06).toFixed(2) + "s" }}>{f.emoji}</span>
              ))}
              {collected === 0 && <span className="text-xs text-emerald-900/60 py-4">Pick the right response to grow your first fruit</span>}
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {FRUITS.map((f) => (
                <span
                  key={f.id}
                  className={"rounded p-1 text-lg " + (picked.includes(f.emoji) ? f.color + " text-white shadow" : "bg-white/70 opacity-40")}
                  title={f.name}
                >
                  {f.emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
