import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Lock,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useReaderSubscription } from "@/hooks/useReaderSubscription";
import { JONAH_CHAPTERS, JONAH_STAGES, JonahAdventureScene } from "./JonahAdventureScene";

type Screen = "boot" | "play" | "select" | "complete" | "gate";

const PROGRESS_KEY = "jonah-fling-progress";
const STARS_KEY = "jonah-fling-stars";
const STAGES_PER_CHAPTER = 5;
const TOTAL_STAGES = JONAH_STAGES.length;

function readProgress(): number {
  try {
    return Math.max(0, Number(localStorage.getItem(PROGRESS_KEY) ?? 0) || 0);
  } catch {
    return 0;
  }
}

function readStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STARS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function totalStars(stars: Record<string, number>): number {
  return Object.values(stars).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export default function JonahAdventure() {
  const parentRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<JonahAdventureScene | null>(null);
  const decidedRef = useRef(false);

  const [screen, setScreen] = useState<Screen>("boot");
  const [stageId, setStageId] = useState(0);
  const [lastStars, setLastStars] = useState(0);
  const [muted, setMuted] = useState(false);
  const [stars, setStars] = useState<Record<string, number>>(readStars);
  const [progress, setProgress] = useState(readProgress);
  const [gameReady, setGameReady] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { isActive, isLoading: subLoading } = useReaderSubscription();
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    if (!parentRef.current || sceneRef.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentRef.current,
      width: 480,
      height: 800,
      backgroundColor: "#17556e",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      scene: [
        new JonahAdventureScene({
          onReady: () => {
            if (!sceneRef.current) {
              sceneRef.current = game.scene.getScene<JonahAdventureScene>("jonah-adventure-scene");
            }
            setGameReady(true);
          },
          onStageComplete: (id, earned) => {
            setStageId(id);
            setLastStars(earned);
            setStars((prev) => {
              const next = { ...prev, [String(id)]: Math.max(earned, Number(prev[String(id)]) || 0) };
              try {
                localStorage.setItem(STARS_KEY, JSON.stringify(next));
              } catch {
                /* storage unavailable */
              }
              return next;
            });
            setProgress((p) => {
              const next = Math.max(p, id);
              try {
                localStorage.setItem(PROGRESS_KEY, String(next));
              } catch {
                /* storage unavailable */
              }
              return next;
            });
            sceneRef.current?.scene.pause();
            setScreen("complete");
          },
        }),
      ],
    });
    sceneRef.current = game.scene.getScene<JonahAdventureScene>("jonah-adventure-scene");
    return () => {
      decidedRef.current = false;
      setGameReady(false);
      sceneRef.current = null;
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (!gameReady || decidedRef.current || authLoading || !sceneRef.current) return;
    if (!user) {
      decidedRef.current = true;
      const start = Math.min(progress + 1, STAGES_PER_CHAPTER - 1);
      setStageId(start);
      setScreen("play");
      sceneRef.current.startStage(start);
      return;
    }
    if (subLoading) return;
    decidedRef.current = true;
    if (isActive) {
      sceneRef.current.scene.pause();
      setScreen("select");
    } else {
      const start = Math.min(progress + 1, STAGES_PER_CHAPTER - 1);
      setStageId(start);
      setScreen("play");
      sceneRef.current.startStage(start);
    }
  }, [gameReady, authLoading, user, subLoading, isActive, progress]);

  const begin = (id: number) => {
    if (!sceneRef.current) return;
    const beyondFree = id >= STAGES_PER_CHAPTER;
    if (beyondFree && !isActiveRef.current) {
      setScreen("gate");
      return;
    }
    setStageId(id);
    setScreen("play");
    if (sceneRef.current.scene.isPaused()) sceneRef.current.scene.resume();
    sceneRef.current.startStage(id);
  };

  const backToSelect = () => {
    sceneRef.current?.scene.pause();
    setScreen("select");
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      sceneRef.current?.setMuted(next);
      return next;
    });
  };

  const handleNext = () => {
    const nextId = stageId + 1;
    if (nextId >= TOTAL_STAGES) {
      setScreen("select");
      return;
    }
    if (nextId >= STAGES_PER_CHAPTER && !isActiveRef.current) {
      setScreen("gate");
      return;
    }
    begin(nextId);
  };

  const chaptersUnlocked = isActiveRef.current ? 3 : 1;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-4 py-6">
      <div
        className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border bg-[#17556e] shadow-2xl"
        style={{ aspectRatio: "480 / 800" }}
      >
        <div ref={parentRef} className="absolute inset-0" style={{ touchAction: "none" }} />

        {screen === "boot" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#17556e]">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
            <p className="font-display text-lg font-bold text-white">Loading Jonah's adventure...</p>
          </div>
        )}

        {screen === "play" && (
          <>
            <button
              onClick={backToSelect}
              className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Stages
            </button>
            <button
              onClick={toggleMute}
              className="absolute right-2 top-2 z-20 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="absolute bottom-2 left-2 right-2 z-20 rounded-xl bg-black/55 px-3 py-2 text-center text-xs font-medium text-white backdrop-blur-sm">
              Drag back on Jonah, then release to fling him · collect the ⭐ stars · land in the whale to finish the stage
            </div>
          </>
        )}

        {screen === "complete" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
            <div className="w-full rounded-3xl border bg-card p-6 text-center shadow-2xl">
              <div className="mb-1 text-5xl">🐋</div>
              <h2 className="font-display text-2xl font-bold">Stage Complete!</h2>
              <p className="mb-3 text-sm text-muted-foreground">{JONAH_STAGES[stageId]?.name}</p>
              <div className="mb-2 text-4xl tracking-widest">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < lastStars ? "" : "opacity-25 grayscale"}>
                    ⭐
                  </span>
                ))}
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Total stars: {totalStars(stars)} / {TOTAL_STAGES * 3}
              </p>
              <div className="flex flex-col gap-2">
                {stageId + 1 < TOTAL_STAGES ? (
                  <Button onClick={handleNext}>Next stage</Button>
                ) : (
                  <Button onClick={() => setScreen("select")}>Choose a stage</Button>
                )}
                <Button variant="outline" onClick={() => begin(stageId)}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Replay stage
                </Button>
                <Button variant="ghost" onClick={() => setScreen("select")}>
                  All stages
                </Button>
              </div>
            </div>
          </div>
        )}

        {screen === "gate" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
            <div className="w-full rounded-3xl border bg-card p-6 text-center shadow-2xl">
              <div className="mb-1 text-5xl">🐋</div>
              <h2 className="font-display text-2xl font-bold">Well done, Jonah!</h2>
              <p className="mb-4 mt-2 text-sm leading-relaxed text-muted-foreground">
                You finished <span className="font-semibold text-foreground">The Storm</span> — all 5 free stages.
                The Belly and Nineveh, 10 more physics puzzles, unlock with All-Access.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/all-access">
                  <Button className="w-full">Unlock with All-Access — K10/month or K100/year</Button>
                </Link>
                {!user && (
                  <Link to="/auth?redirect=/games/jonah-adventure">
                    <Button variant="outline" className="w-full">
                      Create a free account
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={() => setScreen("select")}>
                  Back to stages
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {screen === "select" && (
        <div className="mt-6 w-full max-w-[400px]">
          <div className="mb-5 text-center">
            <h1 className="font-display text-3xl font-bold">Jonah & the Whale</h1>
            <p className="text-sm text-muted-foreground">15 physics puzzles · drag, fling, bounce</p>
            <div className="mt-3 inline-block rounded-2xl bg-accent/15 px-6 py-3 text-3xl font-black tracking-wider text-accent">
              ⭐ {totalStars(stars)}/{TOTAL_STAGES * 3}
            </div>
          </div>

          {!isActive && (
            <div className="mb-5 rounded-2xl border bg-card p-4 text-sm">
              <p className="font-semibold">The Storm is free — all 5 stages.</p>
              <p className="text-muted-foreground">
                The Belly and Nineveh unlock with All-Access —{" "}
                <Link to="/all-access" className="font-semibold text-accent underline">
                  K10/month or K100/year
                </Link>
                .
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {JONAH_CHAPTERS.map((chapter, ci) => {
              const locked = ci + 1 > chaptersUnlocked;
              return (
                <div key={chapter} className="rounded-2xl border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">
                      {ci + 1}. {chapter}
                    </h3>
                    {locked ? (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        <Lock className="h-3 w-3" /> All-Access
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {JONAH_STAGES.slice(ci * STAGES_PER_CHAPTER, ci * STAGES_PER_CHAPTER + STAGES_PER_CHAPTER).map(
                      (st, si) => {
                        const id = ci * STAGES_PER_CHAPTER + si;
                        const stStars = Number(stars[String(id)]) || 0;
                        return (
                          <button
                            key={id}
                            onClick={() => begin(id)}
                            title={st.name}
                            className={
                              "flex flex-col items-center rounded-xl border py-2 transition-all " +
                              (stStars > 0
                                ? "border-accent/50 bg-accent/10 hover:bg-accent/20"
                                : locked
                                  ? "cursor-not-allowed border-muted bg-muted/40 opacity-70"
                                  : "border bg-background hover:bg-accent/10")
                            }
                          >
                            <span className="text-sm font-bold">{id + 1}</span>
                            <span className={"text-[11px] leading-none " + (stStars > 0 ? "" : "opacity-30 grayscale")}>
                              {stStars > 0 ? "⭐".repeat(stStars) : "☆"}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 text-center">
            <Link to="/games" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              ← Back to all games
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
