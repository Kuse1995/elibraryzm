import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Volume2, VolumeX, Info } from "lucide-react";
import { useState, type ReactNode } from "react";
import { sound } from "./sound";

interface GameShellProps {
  title: string;
  emoji: string;
  children: ReactNode;
  onRestart?: () => void;
  instructions?: ReactNode;
  headerRight?: ReactNode;
}

export default function GameShell({ title, emoji, children, onRestart, instructions, headerRight }: GameShellProps) {
  const [muted, setMuted] = useState(sound.isMuted());
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-[70vh]">
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/games"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-accent shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Games
            </Link>
            <span className="text-lg">{emoji}</span>
            <h1 className="font-display font-semibold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {headerRight}
            {instructions && (
              <button
                onClick={() => setShowHelp(true)}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="How to play"
              >
                <Info className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => {
                const m = !muted;
                setMuted(m);
                sound.setMuted(m);
              }}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            {onRestart && (
              <button
                onClick={onRestart}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Restart"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showHelp && instructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div className="max-w-md w-full rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-3">How to play</h3>
            <div className="text-sm text-muted-foreground space-y-2">{instructions}</div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full rounded-lg bg-accent text-accent-foreground py-2 font-semibold hover:bg-accent/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="container py-6">{children}</div>
    </div>
  );
}
