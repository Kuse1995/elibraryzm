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
import {
  BIBLE_MERGE_LEVELS,
  BIBLE_MERGE_WORLDS,
  MERGE_TIERS,
  BibleMergeScene,
  readMergeCollection,
} from "./BibleMergeScene";

type Screen = "boot" | "play" | "select" | "complete" | "gate";

const PROGRESS_KEY = "bible-merge-progress";
const STARS_KEY = "bible-merge-stars";
const LEVELS_PER_WORLD = 5;
const TOTAL_LEVELS = BIBLE_MERGE_LEVELS.length;

function readProgress(): number {
  try {
    return Number(localStorage.getItem(PROGRESS_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function readStars(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STARS_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function totalStars(stars: Record<string, number>): number {
  return Object.values(stars).reduce((a, b) => a + (Number(b) || 0), 0);
}

export default function BibleMerge() {
  const parentRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BibleMergeScene | null>(null);
  const decidedRef = useRef(false);

  const [screen, setScreen] = useState<Screen>("boot");
  const [levelId, setLevelId] = useState(0);
  const [lastStars, setLastStars] = useState(0);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(readProgress);
  const [stars, setStars] = useState<Record<string, number>>(readStars);
  const [collection, setCollection] = useState<number[]>(readMergeCollection);
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
      backgroundColor: "#2f7f5f",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [
        new BibleMergeScene({
          onReady: () => {
            if (!sceneRef.current) {
              sceneRef.current = game.scene.getScene<BibleMergeScene>("bible-merge-scene");
            }
            setGameReady(true);
          },
          onLevelComplete: (id, earned) => {
            setLevelId(id);
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
            setCollection(readMergeCollection());
            sceneRef.current?.scene.pause();
            setScreen("complete");
          },
        }),
      ],
    });
    sceneRef.current = game.scene.getScene<BibleMergeScene>("bible-merge-scene");
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
      const start = Math.min(progress + 1, LEVELS_PER_WORLD - 1);
      setLevelId(start);
      setScreen("play");
      sceneRef.current.startLevel(start);
      return;
    }
    if (subLoading) return;
    decidedRef.current = true;
    if (isActive) {
      sceneRef.current.scene.pause();
      setScreen("select");
    } else {
      const start = Math.min(progress + 1, LEVELS_PER_WORLD - 1);
      setLevelId(start);
      setScreen("play");
      sceneRef.current.startLevel(start);
    }
  }, [gameReady, authLoading, user, subLoading, isActive, progress]);

  const begin = (id: number) => {
    if (!sceneRef.current) return;
    const beyondFree = id >= LEVELS_PER_WORLD;
    if (beyondFree && !isActiveRef.current) {
      setScreen("gate");
      return;
    }
    setLevelId(id);
    setScreen("play");
    if (sceneRef.current.scene.isPaused()) sceneRef.current.scene.resume();
    sceneRef.current.startLevel(id);
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
    const nextId = levelId + 1;
    if (nextId >= TOTAL_LEVELS) {
      setScreen("select");
      return;
    }
    if (nextId >= LEVELS_PER_WORLD && !isActiveRef.current) {
      setScreen("gate");
      return;
    }
    begin(nextId);
  };

  const worldsUnlocked = isActiveRef.current ? 3 : 1;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-4 py-6">
      <div
        className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border bg-[#2f7f5f] shadow-2xl"
        style={{ aspectRatio: "480 / 800" }}
      >
        <div ref={parentRef} className="absolute inset-0" style={{ touchAction: "none" }} />

        {screen === "boot" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#2f7f5f]">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-200" />
            <p className="font-display text-lg font-bold text-white">Planting the garden...</p>
          </div>
        )}

        {screen === "play" && (
          <>
            <button
              onClick={backToSelect}
              className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Levels
            </button>
            <button
              onClick={toggleMute}
              className="absolute right-2 top-2 z-20 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="absolute bottom-2 left-2 right-2 z-20 rounded-xl bg-black/55 px-3 py-2 text-center text-xs font-medium text-white backdrop-blur-sm">
              Tap one item, then tap its match to grow it · merge seeds into sprouts, sprouts into plants... all the way to the rainbow 🌈
            </div>
          </>
        )}

        {screen === "complete" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
            <div className="w-full rounded-3xl border bg-card p-6 text-center shadow-2xl">
              <div className="mb-1 text-5xl">🌱</div>
              <h2 className="font-display text-2xl font-bold">Level Complete!</h2>
              <p className="mb-3 text-sm text-muted-foreground">{BIBLE_MERGE_LEVELS[levelId]?.name}</p>
              <div className="mb-2 text-4xl tracking-widest">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < lastStars ? "" : "opacity-25 grayscale"}>
                    ⭐
                  </span>
                ))}
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Total stars: {totalStars(stars)} / {TOTAL_LEVELS * 3}
              </p>
              <div className="flex flex-col gap-2">
                {levelId + 1 < TOTAL_LEVELS ? (
                  <Button onClick={handleNext}>Next level</Button>
                ) : (
                  <Button onClick={() => setScreen("select")}>Choose a level</Button>
                )}
                <Button variant="outline" onClick={() => begin(levelId)}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Replay level
                </Button>
                <Button variant="ghost" onClick={() => setScreen("select")}>
                  All levels
                </Button>
              </div>
            </div>
          </div>
        )}

        {screen === "gate" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
            <div className="w-full rounded-3xl border bg-card p-6 text-center shadow-2xl">
              <div className="mb-1 text-5xl">🌻</div>
              <h2 className="font-display text-2xl font-bold">Well done, gardener!</h2>
              <p className="mb-4 mt-2 text-sm leading-relaxed text-muted-foreground">
                You finished <span className="font-semibold text-foreground">The Garden</span> — all 5
                levels. The Fields and The Promise, 10 more levels up to the rainbow, are free too.
              </p>
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => setScreen("play")}>Keep Playing — it's free</Button>
                {!user && (
                  <Link to="/auth?redirect=/games/bible-merge">
                    <Button variant="outline" className="w-full">
                      Create a free account
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={() => setScreen("select")}>
                  Back to levels
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {screen === "select" && (
        <div className="mt-6 w-full max-w-[400px]">
          <div className="mb-5 text-center">
            <h1 className="font-display text-3xl font-bold">Bible Merge</h1>
            <p className="text-sm text-muted-foreground">15 levels · merge, grow, discover the rainbow</p>
            <div className="mt-3 inline-block rounded-2xl bg-accent/15 px-6 py-3 text-3xl font-black tracking-wider text-accent">
              ⭐ {totalStars(stars)}/{TOTAL_LEVELS * 3}
            </div>
          </div>

          <div className="mb-5 rounded-2xl border bg-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">🌱 Garden Book</h3>
            <div className="flex items-center justify-between gap-1">
              {MERGE_TIERS.map((tier, i) => {
                const found = collection.includes(i);
                return (
                  <div
                    key={tier.name}
                    title={tier.name}
                    className={
                      "flex flex-col items-center rounded-xl border px-2 py-1.5 " +
                      (found ? "border-accent/40 bg-accent/10" : "border-muted bg-muted/40")
                    }
                  >
                    <span className={"text-2xl " + (found ? "" : "opacity-30 grayscale")}>
                      {found ? tier.emoji : "❓"}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{tier.name}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Grow each plant for the first time to fill your Garden Book.
            </p>
          </div>

          {!isActive && (
            <div className="mb-5 rounded-2xl border bg-card p-4 text-sm">
              <p className="font-semibold">The Garden is free — all 5 levels.</p>
              <p className="text-muted-foreground">
                The Fields and The Promise are free too — every world is free.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {BIBLE_MERGE_WORLDS.map((world, wi) => {
              const locked = wi + 1 > worldsUnlocked;
              return (
                <div key={world.name} className="rounded-2xl border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">
                      {world.emoji} {wi + 1}. {world.name}
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
                    {BIBLE_MERGE_LEVELS.slice(wi * LEVELS_PER_WORLD, wi * LEVELS_PER_WORLD + LEVELS_PER_WORLD).map(
                      (lv, li) => {
                        const id = wi * LEVELS_PER_WORLD + li;
                        const lvStars = Number(stars[String(id)]) || 0;
                        return (
                          <button
                            key={id}
                            onClick={() => begin(id)}
                            title={lv.name}
                            className={
                              "flex flex-col items-center rounded-xl border py-2 transition-all " +
                              (lvStars > 0
                                ? "border-accent/50 bg-accent/10 hover:bg-accent/20"
                                : locked
                                  ? "cursor-not-allowed border-muted bg-muted/40 opacity-70"
                                  : "border bg-background hover:bg-accent/10")
                            }
                          >
                            <span className="text-sm font-bold">{id + 1}</span>
                            <span className={"text-[11px] leading-none " + (lvStars > 0 ? "" : "opacity-30 grayscale")}>
                              {lvStars > 0 ? "⭐".repeat(lvStars) : "☆"}
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
