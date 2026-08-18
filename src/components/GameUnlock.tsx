import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Gamepad2, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameAccess } from "@/hooks/useGameAccess";

export default function GameUnlock({ title, emoji }: { title?: string; emoji?: string }) {
  const { user } = useAuth();
  const { claim } = useGameAccess();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 9) {
      setError("Please enter your full phone number, e.g. 0977 123 456.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await claim(phone);
    setBusy(false);
    if (res.ok) {
      setDone(true);
    } else if (res.reason === "no_pass") {
      setError(
        "Every game is free now - just reload the games page and play. No pass needed anymore."
      );
    } else {
      setError("Could not check your number just now - please try again in a moment.");
    }
  };

  if (done) {
    return (
      <div className="container py-16 md:py-24 text-center max-w-2xl">
        <div className="panel-glass p-10 rounded-3xl">
          <div className="floaty inline-block text-6xl mb-4">🎉</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">You're in!</h1>
          <p className="text-muted-foreground mb-6">
            Your games pass is unlocked{title ? " - enjoy " + title : ""}. Play as much as you like,
            any time - it's yours forever as our thank-you for reading.
          </p>
          <Link to={title ? undefined : "/games"} onClick={() => { if (title) window.location.reload(); }} className="btn-gold inline-block">
            {title ? "Start playing now" : "Back to games"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 max-w-2xl">
      <div className="panel-glass rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#12294d] to-[#1d4a80] text-white p-8 md:p-10 text-center relative">
          <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-sm" />
          <div className="floaty inline-block text-6xl mb-3">{emoji || "🎮"}</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {title ? title + " is locked" : "Games are a reader perk"}
          </h1>
          <p className="text-white/85 max-w-xl mx-auto">
            {title
              ? "This game is completely free - unlock it in seconds."
              : "All our Bible games are free for everyone, forever."}
          </p>
        </div>
        <div className="p-8 md:p-10">
          <div className="flex flex-wrap justify-center gap-2 text-sm mb-6">
            <span className="rounded-full bg-accent/10 text-accent px-3 py-1.5 font-semibold">🎮 6 games</span>
            <span className="rounded-full bg-accent/10 text-accent px-3 py-1.5 font-semibold">♾️ Free forever</span>
            <span className="rounded-full bg-accent/10 text-accent px-3 py-1.5 font-semibold">👨‍👩‍👧‍👦 All ages</span>
            <span className="rounded-full bg-accent/10 text-accent px-3 py-1.5 font-semibold">📖 No ads</span>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm font-semibold text-muted-foreground">
              Already bought a book? Enter the phone number you ordered with
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="e.g. 0977 123 456"
              className="w-full rounded-xl border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn-gold w-full justify-center disabled:opacity-60"
            >
              {busy ? "Checking…" : "Unlock my games"}
            </button>
          </form>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-4 w-4" /> Everything is free now
            </span>
            <Link to="/browse" className="font-semibold text-accent hover:underline inline-flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Browse free ebooks
            </Link>
            {!user && (
              <>
                <span className="hidden sm:inline">·</span>
                <Link to="/auth" className="font-semibold text-accent hover:underline">
                  Create an account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
