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
      <div className="sticky top-16 z-40 border-b border-white/10 bg-gradient-to-r from-[#12294d] to-[#1d4a80] text-white shadow-lg">
        <div className="container flex h-14 items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/games"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Games
            </Link>
            <span className="text-lg drop-shadow">{emoji}</span>
            <h1 className="font-display font-semibold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {headerRight}
            {instructions && (
              <button
                onClick={() => setShowHelp(true)}
                className="rounded-full p-2 text-white/85 hover:bg-white/15"
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
              className="rounded-full p-2 text-white/85 hover:bg-white/15"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            {onRestart && (
              <button
                onClick={onRestart}
                className="rounded-full p-2 text-white/85 hover:bg-white/15"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div className="panel-glass max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-lg">How to play</h3>
              <button onClick={() => setShowHelp(false)} className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">{instructions}</div>
            <button
              onClick={() => setShowHelp(false)}
              className="btn-gold mt-5 w-full"
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
