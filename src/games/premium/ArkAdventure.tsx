import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useReaderSubscription } from "@/hooks/useReaderSubscription";
import { ARK_ANIMALS, ARK_LEVELS, ArkAdventureScene, readArkGallery } from "./ArkAdventureScene";

type Screen = "boot" | "play" | "select" | "levelComplete" | "gate" | "gameOver";

const PROGRESS_KEY = "ark-adventure-progress";
const BEST_KEY = "ark-adventure-best";

interface BestEntry {
  stars: number;
  score: number;
}

function readProgress(): number {
  try {
    return Number(localStorage.getItem(PROGRESS_KEY) ?? 1) || 1;
  } catch {
    return 1;
  }
}

function readBest(): Record<string, BestEntry> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as Record<string, BestEntry>) : {};
  } catch {
    return {};
  }
}

function galleryTotal(gallery: Record<string, number>): number {
  return Object.values(gallery).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export default function ArkAdventure() {
  const parentRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ArkAdventureScene | null>(null);
  const decidedRef = useRef(false);

  const [screen, setScreen] = useState<Screen>("boot");
  const [level, setLevel] = useState(1);
  const [animals, setAnimals] = useState(0);
  const [stars, setStars] = useState(0);
  const [score, setScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(readProgress);
  const [best, setBest] = useState<Record<string, BestEntry>>(readBest);
  const [gallery, setGallery] = useState<Record<string, number>>(readArkGallery);
  const [gameReady, setGameReady] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { isActive, isLoading: subLoading } = useReaderSubscription();
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const bestRef = useRef(best);
  bestRef.current = best;

  useEffect(() => {
    if (!parentRef.current || sceneRef.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentRef.current,
      width: 480,
      height: 800,
      backgroundColor: "#20394f",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 1650 }, debug: false } },
      scene: [
        new ArkAdventureScene({
          onReady: () => {
            if (!sceneRef.current) {
              sceneRef.current = game.scene.getScene<ArkAdventureScene>("ark-adventure-scene");
            }
            setGameReady(true);
          },
          onLevelComplete: (lvl, saved, earnedStars, earnedScore) => {
            setLevel(lvl);
            setAnimals(saved);
            setStars(earnedStars);
            setScore(earnedScore);
            const prevEntry = bestRef.current[String(lvl)] ?? { stars: 0, score: 0 };
            setNewBest(earnedStars > prevEntry.stars || earnedScore > prevEntry.score);
            setProgress((p) => {
              const next = Math.max(p, lvl);
              try {
                localStorage.setItem(PROGRESS_KEY, String(next));
              } catch {
                /* storage unavailable */
              }
              return next;
            });
            setBest((prev) => {
              const old = prev[String(lvl)] ?? { stars: 0, score: 0 };
              const next = {
                ...prev,
                [String(lvl)]: { stars: Math.max(old.stars, earnedStars), score: Math.max(old.score, earnedScore) },
              };
              try {
                localStorage.setItem(BEST_KEY, JSON.stringify(next));
              } catch {
                /* storage unavailable */
              }
              return next;
            });
            setGallery(readArkGallery());
            sceneRef.current?.scene.pause();
            setScreen(isActiveRef.current ? "levelComplete" : "gate");
          },
          onGameOver: (lvl, saved) => {
            setLevel(lvl);
            setAnimals(saved);
            sceneRef.current?.scene.pause();
            setScreen("gameOver");
          },
        }),
      ],
    });
    sceneRef.current = game.scene.getScene<ArkAdventureScene>("ark-adventure-scene");
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
      setScreen("play");
      setLevel(1);
      sceneRef.current.startLevel(1);
      return;
    }
    if (subLoading) return;
    decidedRef.current = true;
    if (isActive) {
      sceneRef.current.scene.pause();
      setScreen("select");
    } else {
      setScreen("play");
      setLevel(1);
      sceneRef.current.startLevel(1);
    }
  }, [gameReady, authLoading, user, subLoading, isActive]);

  const begin = (lvl: number) => {
    const s = sceneRef.current;
    if (!s) return;
    setLevel(lvl);
    setScreen("play");
    setGallery(readArkGallery());
    if (s.scene.isPaused()) s.scene.resume();
    s.startLevel(lvl);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sceneRef.current?.setMuted(next);
  };

  const levelName = ARK_LEVELS[level - 1]?.name ?? "The Call";

  return (
    <div
      className="relative mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl bg-[#10233d]"
      style={{ aspectRatio: "480 / 800" }}
    >
      <div ref={parentRef} className="absolute inset-0" style={{ touchAction: "none" }} />

      {screen === "play" && (
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute top-3 right-3 z-20 rounded-full bg-white/85 p-2 text-navy shadow-md hover:bg-white"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}

      {screen === "boot" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/80" />
        </div>
      )}

      {screen === "select" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#10233d]/95 p-6 text-white">
          <div className="text-4xl">⛵</div>
          <h2 className="font-display text-2xl font-bold">Noah's Ark Adventure</h2>
          <p className="text-sm text-white/75 mb-2">Three levels. Choose where to begin.</p>
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            {ARK_LEVELS.map((lvlDef, i) => {
              const lvl = i + 1;
              const cleared = progress >= lvl;
              const entry = best[String(lvl)];
              return (
                <button
                  key={lvl}
                  onClick={() => begin(lvl)}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 text-left hover:bg-white/20 transition-colors"
                >
                  <span>
                    <span className="block font-semibold">Level {lvl} — {lvlDef.name}</span>
                    <span className="block text-xs text-white/70">{lvlDef.subtitle}</span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    {entry && entry.stars > 0 ? (
                      <>
                        <span className="text-sm tracking-tight">{"⭐".repeat(entry.stars)}</span>
                        {entry.score > 0 && <span className="text-[11px] text-white/70">Best {entry.score}</span>}
                      </>
                    ) : cleared ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    ) : (
                      <Play className="h-5 w-5 shrink-0 text-amber-300" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full max-w-xs rounded-xl bg-white/10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Ark Gallery</h3>
              <span className="text-xs text-white/70">{galleryTotal(gallery)} saved</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {ARK_ANIMALS.map((a) => {
                const count = Number(gallery[a]) || 0;
                return (
                  <div key={a} className="flex flex-col items-center rounded-lg bg-white/5 py-1.5">
                    <span className={"text-2xl " + (count > 0 ? "" : "opacity-30 grayscale")}>{a}</span>
                    <span className="text-[10px] text-white/70">{count > 0 ? `x${count}` : "—"}</span>
                  </div>
                );
              })}
            </div>
            {galleryTotal(gallery) === 0 && (
              <p className="mt-2 text-[11px] text-white/60">Every animal you save in a level joins the ark here.</p>
            )}
          </div>
        </div>
      )}

      {screen === "gate" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#10233d]/95 p-6 text-center text-white">
          <div className="text-5xl">🌈</div>
          <h2 className="font-display text-2xl font-bold leading-tight">
            Well done, Noah!
          </h2>
          <p className="text-white/85">
            You saved {animals} animal{animals === 1 ? "" : "s"} in Level 1 — {levelName}.
            The Storm and The Flood unlock with All-Access, together with every book and all our games.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            <Link to="/all-access" className="w-full">
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Unlock with All-Access — K10/month or K100/year <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {!user && (
              <Link to="/auth?redirect=/games/ark-adventure" className="w-full">
                <Button variant="outline" size="lg" className="w-full">
                  Create a free account
                </Button>
              </Link>
            )}
            <Button variant="ghost" onClick={() => begin(1)} className="w-full text-white/80 hover:text-white">
              <RotateCcw className="h-4 w-4" /> Replay Level 1
            </Button>
          </div>
        </div>
      )}

      {screen === "levelComplete" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#10233d]/95 p-6 text-center text-white">
          <div className="text-5xl">{level >= 3 ? "🌈" : "🎉"}</div>
          <h2 className="font-display text-2xl font-bold">
            {level >= 3 ? "You finished the adventure!" : `Level ${level} complete!`}
          </h2>
          <p className="text-white/85">
            {level >= 3
              ? "Noah's family is safe and the rainbow shines — God keeps His promises."
              : `You saved ${animals} animals in ${levelName}. The journey continues!`}
          </p>
          <div className="text-3xl tracking-widest">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < stars ? "" : "opacity-30 grayscale"}>
                ⭐
              </span>
            ))}
          </div>
          <div
            className={
              "rounded-full px-4 py-1 text-sm font-bold " +
              (newBest ? "bg-amber-400 text-amber-950" : "bg-white/10")
            }
          >
            Score {score}
            {newBest && " · New best!"}
          </div>
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            {level < 3 ? (
              <Button size="lg" onClick={() => begin(level + 1)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Continue — Level {level + 1}: {ARK_LEVELS[level].name} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" onClick={() => begin(1)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <RotateCcw className="h-4 w-4" /> Play again
              </Button>
            )}
            <Button variant="ghost" onClick={() => setScreen("select")} className="w-full text-white/80 hover:text-white">
              Choose level
            </Button>
          </div>
        </div>
      )}

      {screen === "gameOver" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#10233d]/95 p-6 text-center text-white">
          <div className="text-5xl">🙏</div>
          <h2 className="font-display text-2xl font-bold">Oh no — Noah fell!</h2>
          <p className="text-white/85">
            You saved {animals} animal{animals === 1 ? "" : "s"} on {levelName}. Try again — God is with you.
          </p>
          <div className="rounded-full bg-white/10 px-4 py-1 text-sm font-bold">Score {score}</div>
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            <Button size="lg" onClick={() => begin(level)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
            {isActive && (
              <Button variant="ghost" onClick={() => setScreen("select")} className="w-full text-white/80 hover:text-white">
                Choose level
              </Button>
            )}
            <Link to="/games" className="w-full">
              <Button variant="ghost" className="w-full text-white/80 hover:text-white">
                Back to games
              </Button>
            </Link>
          </div>
        </div>
      )}

      {screen === "play" && (
        <p className="px-4 py-2 text-center text-xs text-muted-foreground bg-card">
          Slide (or ◀ ▶ / A-D) to move · tap to jump · tap again in the air for a double jump · collect animals, dodge rocks · grab 🛡️ 🧲 ⏳ power-ups
        </p>
      )}
    </div>
  );
}
