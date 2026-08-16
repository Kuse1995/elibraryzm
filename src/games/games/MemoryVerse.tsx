import { useMemo, useRef, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { MEMORY_VERSES } from "../data/memoryVerses";

const BEST_KEY = "memory-verse-best";

function readBest(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function stripWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hiddenAt(stage: number, i: number): boolean {
  if (stage === 1) return (i + 1) % 4 === 0;
  if (stage === 2) return i % 2 === 1;
  return (i + 1) % 4 !== 0;
}

function hintFor(word: string): string {
  const stripped = stripWord(word);
  return stripped.charAt(0) + "_".repeat(Math.max(1, stripped.length - 1));
}

function MemoryScene() {
  return (
    <div className="scene-deco">
      <span className="star" style={{ top: "10%", left: "14%" }} />
      <span className="star" style={{ top: "20%", left: "76%", animationDelay: "-1.4s" }} />
      <span className="floaty absolute" style={{ top: "12%", left: "9%", fontSize: 32, opacity: 0.5 }}>🧠</span>
      <span className="floaty absolute" style={{ bottom: "12%", right: "9%", fontSize: 28, opacity: 0.4, animationDelay: "-2s" }}>✍️</span>
    </div>
  );
}

type Phase = "select" | "read" | "type" | "done";

export default function MemoryVerse() {
  const [phase, setPhase] = useState<Phase>("select");
  const [verseRef, setVerseRef] = useState("");
  const [stage, setStage] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<("correct" | "wrong")[]>([]);
  const [acc, setAcc] = useState({ asked: 0, correct: 0 });
  const [best, setBest] = useState<Record<string, number>>(readBest);
  const inputRef = useRef<HTMLInputElement>(null);

  const verse = useMemo(() => MEMORY_VERSES.find((v) => v.reference === verseRef), [verseRef]);
  const words = useMemo(() => (verse ? verse.text.split(" ") : []), [verse]);
  const hiddenIdx = useMemo(
    () => (stage >= 1 ? words.map((_, i) => i).filter((i) => hiddenAt(stage, i)) : []),
    [stage, words]
  );

  const answered = results.length;
  const currentWordIdx = hiddenIdx[answered];
  const accPct = acc.asked > 0 ? Math.round((acc.correct / acc.asked) * 100) : 0;

  const pick = (ref: string) => {
    setVerseRef(ref);
    setStage(0);
    setResults([]);
    setAcc({ asked: 0, correct: 0 });
    setInput("");
    setPhase("read");
    sound.play("click");
  };

  const beginTyping = () => {
    setStage(1);
    setResults([]);
    setAcc({ asked: 0, correct: 0 });
    setInput("");
    setPhase("type");
    sound.play("click");
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const submitWord = () => {
    if (phase !== "type" || currentWordIdx === undefined) return;
    const given = stripWord(input);
    if (!given) return;
    const ok = given === stripWord(words[currentWordIdx]);
    sound.play(ok ? "correct" : "wrong");
    const nextResults: ("correct" | "wrong")[] = [...results, ok ? "correct" : "wrong"];
    setResults(nextResults);
    setAcc((a) => ({ asked: a.asked + 1, correct: a.correct + (ok ? 1 : 0) }));
    setInput("");
    if (nextResults.length >= hiddenIdx.length) {
      setTimeout(() => {
        if (stage >= 3) {
          setBest((prev) => {
            const finalPct = Math.round(((acc.correct + (ok ? 1 : 0)) / (acc.asked + 1)) * 100);
            const next = { ...prev, [verseRef]: Math.max(prev[verseRef] ?? 0, finalPct) };
            try {
              localStorage.setItem(BEST_KEY, JSON.stringify(next));
            } catch {
              /* storage unavailable */
            }
            return next;
          });
          setPhase("done");
          confettiBurst(90);
        } else {
          setStage((s) => s + 1);
          setResults([]);
          setInput("");
          setTimeout(() => inputRef.current?.focus(), 60);
        }
      }, 500);
    } else {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  if (phase === "select") {
    return (
      <div className="game-scene scene-memory text-white">
        <MemoryScene />
        <div className="relative mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="floaty mb-4 inline-block text-6xl drop-shadow-xl">🧠</div>
          <h2 className="font-display mb-2 text-2xl font-bold md:text-3xl">Memory Verse</h2>
          <p className="mx-auto mb-8 max-w-md text-white/80">
            “I have hidden your word in my heart.” Read a verse, then type it back as the words
            disappear — three rounds of recall. Stars for accuracy, best scores saved.
          </p>
          <div className="mb-8 grid gap-3 text-left sm:grid-cols-2">
            {MEMORY_VERSES.map((v) => (
              <button
                key={v.reference}
                onClick={() => pick(v.reference)}
                className="card-shine rounded-2xl bg-white/90 p-4 shadow-lg transition-all hover:scale-[1.02]"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-amber-700">{v.reference}</span>
                  {best[v.reference] !== undefined && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Best {best[v.reference]}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{v.text.split(" ").slice(0, 8).join(" ")}…</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => pick(MEMORY_VERSES[Math.floor(Math.random() * MEMORY_VERSES.length)].reference)}
            className="btn-ghost-light"
          >
            Surprise me ✨
          </button>
        </div>
      </div>
    );
  }

  if (phase === "read" && verse) {
    return (
      <div className="game-scene scene-memory text-white">
        <MemoryScene />
        <div className="relative mx-auto max-w-2xl px-4 py-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
            {verse.reference}
          </span>
          <div className="panel-scroll p-6 text-left">
            <p className="text-lg leading-relaxed">“{verse.text}”</p>
            <p className="mt-2 text-sm font-semibold text-amber-600">— {verse.reference}</p>
          </div>
          <p className="mt-5 text-sm text-white/75">Read it slowly — the words will start disappearing.</p>
          <button onClick={beginTyping} className="btn-gold mt-4 text-lg">
            I'm ready — hide the words ✍️
          </button>
        </div>
      </div>
    );
  }

  if (phase === "type" && verse) {
    const currentHint = currentWordIdx !== undefined ? hintFor(words[currentWordIdx]) : "";
    return (
      <div className="game-scene scene-memory text-white">
        <MemoryScene />
        <div className="relative mx-auto max-w-2xl px-4 py-10">
          <div className="mb-4 flex items-center justify-between text-sm font-semibold">
            <span className="rounded-full bg-navy px-3 py-1 text-white">
              Round {stage} of 3 · {answered}/{hiddenIdx.length} words
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-slate-700">{verse.reference}</span>
          </div>

          <div className="panel-scroll p-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-lg leading-relaxed">
              {words.map((w, i) => {
                const hid = hiddenAt(stage, i);
                if (!hid) {
                  return (
                    <span key={i} className="text-foreground">
                      {w}
                    </span>
                  );
                }
                const ansIndex = hiddenIdx.indexOf(i);
                if (ansIndex < answered) {
                  const ok = results[ansIndex] === "correct";
                  return (
                    <span
                      key={i}
                      className={
                        "rounded-lg px-1.5 py-0.5 font-semibold " +
                        (ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700 line-through")
                      }
                    >
                      {w}
                    </span>
                  );
                }
                const isCurrent = ansIndex === answered;
                return (
                  <span
                    key={i}
                    className={
                      "rounded-lg border-2 px-1.5 py-0.5 font-mono text-sm tracking-widest " +
                      (isCurrent
                        ? "border-accent bg-accent/15 font-bold text-accent"
                        : "border-dashed border-slate-300/60 text-slate-500")
                    }
                  >
                    {hintFor(w)}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitWord();
              }}
              placeholder={currentHint || "Type the missing word"}
              autoCapitalize="none"
              autoCorrect="off"
              className="flex-1 rounded-xl border-2 border-white/30 bg-white/90 px-4 py-3 text-lg font-semibold text-slate-800 outline-none focus:border-accent"
            />
            <button onClick={submitWord} disabled={!stripWord(input)} className="btn-gold px-5 py-3 text-base">
              Enter ⏎
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-white/70">Press Enter to lock in each word.</p>
        </div>
      </div>
    );
  }

  // done
  const stars = accPct >= 90 ? 3 : accPct >= 70 ? 2 : 1;
  return (
    <div className="mx-auto max-w-lg">
      <div className="panel-scroll p-6 text-center">
        <div className="bounce-in mb-2 inline-block text-6xl">{stars >= 2 ? "🌟" : "🧠"}</div>
        <h3 className="font-display text-2xl font-bold">Verse memorised!</h3>
        <p className="mb-1 text-sm text-muted-foreground">
          {verseRef} — {acc.correct} of {acc.asked} words · {accPct}%
        </p>
        <div className="mb-4 text-3xl tracking-widest">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < stars ? "" : "opacity-25 grayscale"}>
              ⭐
            </span>
          ))}
        </div>
        <div className="mb-6 rounded-2xl bg-white/70 border border-amber-900/10 p-5 text-left">
          <p className="text-sm">
            <strong className="text-amber-600">{verseRef}</strong> — “{verse?.text}”
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => pick(verseRef)} className="btn-gold">
            Try again
          </button>
          <button onClick={() => setPhase("select")} className="btn-ghost-light">
            Another verse
          </button>
        </div>
      </div>
    </div>
  );
}
