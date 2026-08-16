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
import { JONAH_LEVELS, JonahAdventureScene } from "./JonahAdventureScene";

type Screen = "boot" | "play" | "select" | "levelComplete" | "gate" | "gameOver";

const PROGRESS_KEY = "jonah-adventure-progress";

function readProgress(): number {
  try {
    return Number(localStorage.getItem(PROGRESS_KEY) ?? 1) || 1;
  } catch {
    return 1;
  }
}

export default function JonahAdventure() {
  const parentRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<JonahAdventureScene | null>(null);
  const decidedRef = useRef(false);

  const [screen, setScreen] = useState<Screen>("boot");
  const [level, setLevel] = useState(1);
  const [fish, setFish] = useState(0);
  const [muted, setMuted] = useState(false);
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
          onLevelComplete: (lvl, saved) => {
            setLevel(lvl);
            setFish(saved);
            setProgress((p) => {
              const next = Math.max(p, lvl);
              try {
                localStorage.setItem(PROGRESS_KEY, String(next));
              } catch {
                /* storage unavailable */
              }
              return next;
            });
            sceneRef.current?.scene.pause();
            setScreen(isActiveRef.current ? "levelComplete" : "gate");
          },
          onGameOver: (lvl, saved) => {
            setLevel(lvl);
            setFish(saved);
            sceneRef.current?.scene.pause();
            setScreen("gameOver");
          },
        }),
      ],
    });
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
    if (s.scene.isPaused()) s.scene.resume();
    s.startLevel(lvl);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sceneRef.current?.setMuted(next);
  };

  const levelName = JONAH_LEVELS[level - 1]?.name ?? "The Storm";

  return (
    <div className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-2xl bg-[#0d3348]">
      <div ref={parentRef} className="relative w-full" style={{ height: "min(74vh, 720px)" }} />

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
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#0d3348]/95 p-6 text-white">
          <div className="text-4xl">🐋</div>
          <h2 className="font-display text-2xl font-bold">Jonah &amp; the Whale</h2>
          <p className="text-sm text-white/75 mb-2">Three levels. Choose where to begin.</p>
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            {JONAH_LEVELS.map((lvlDef, i) => {
              const lvl = i + 1;
              const cleared = progress >= lvl;
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
                  {cleared ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  ) : (
                    <Play className="h-5 w-5 shrink-0 text-amber-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {screen === "gate" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#0d3348]/95 p-6 text-center text-white">
          <div className="text-5xl">🐋</div>
          <h2 className="font-display text-2xl font-bold leading-tight">
            Well done, Jonah!
          </h2>
          <p className="text-white/85">
            You saved {fish} fish through {levelName}. The Belly and Nineveh unlock with
            All-Access, together with every book and all our games.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            <Link to="/all-access" className="w-full">
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Unlock with All-Access — K10/month or K100/year <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {!user && (
              <Link to="/auth?redirect=/games/jonah-adventure" className="w-full">
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
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#0d3348]/95 p-6 text-center text-white">
          <div className="text-5xl">{level >= 3 ? "🌅" : "🎉"}</div>
          <h2 className="font-display text-2xl font-bold">
            {level >= 3 ? "Jonah reached Nineveh!" : `Level ${level} complete!`}
          </h2>
          <p className="text-white/85">
            {level >= 3
              ? "God gave Nineveh a second chance — and He gives us one too."
              : `You saved ${fish} fish in ${levelName}. The journey continues!`}
          </p>
          <div className="flex w-full max-w-xs flex-col gap-2.5">
            {level < 3 ? (
              <Button size="lg" onClick={() => begin(level + 1)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Continue — Level {level + 1}: {JONAH_LEVELS[level].name} <ArrowRight className="h-4 w-4" />
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
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#0d3348]/95 p-6 text-center text-white">
          <div className="text-5xl">🙏</div>
          <h2 className="font-display text-2xl font-bold">Oh no — Jonah got caught!</h2>
          <p className="text-white/85">
            You saved {fish} fish on {levelName}. God still has a plan — try again.
          </p>
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
          Hold to swim up · release to dive · collect the fish, dodge the rocks
        </p>
      )}
    </div>
  );
}
