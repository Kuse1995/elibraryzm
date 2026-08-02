import { Link } from "react-router-dom";
import { ArrowRight, Gamepad2, Sparkles, Trophy } from "lucide-react";
import { GAMES, type GameMeta } from "@/games/registry";
import { getAllStats } from "@/games/useGameStats";

const AUDIENCE_STYLES: Record<string, string> = {
  Kids: "bg-emerald-100 text-emerald-800",
  Family: "bg-sky-100 text-sky-800",
  "Teens & Adults": "bg-violet-100 text-violet-800",
};

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Difficulty ${level}/3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= level ? "bg-accent" : "bg-muted-foreground/30"}`} />
      ))}
    </span>
  );
}

function GameCard({ game }: { game: GameMeta }) {
  const stats = getAllStats()[game.slug];
  return (
    <Link
      to={`/games/${game.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className={`relative bg-gradient-to-br ${game.gradient} p-8 text-center overflow-hidden`}>
        <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/15" />
        <div className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-black/10" />
        <span className="relative inline-block text-6xl drop-shadow-lg transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
          {game.emoji}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${AUDIENCE_STYLES[game.audience]}`}>
            {game.audience}
          </span>
          <DifficultyDots level={game.difficulty} />
        </div>
        <h3 className="font-display text-lg font-bold mb-1">{game.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-1">{game.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {stats && stats.plays > 0 ? (
              <>
                <Trophy className="mr-1 inline h-3.5 w-3.5 text-accent" />
                Best {stats.best} · {stats.plays} play{stats.plays > 1 ? "s" : ""}
              </>
            ) : (
              "Not played yet"
            )}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground group-hover:bg-accent/90">
            Play <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Games() {
  const all = getAllStats();
  const totalPlays = Object.values(all).reduce((sum, s) => sum + s.plays, 0);

  return (
    <div>
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-16 h-56 w-56 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-8 right-16 h-72 w-72 rounded-full bg-sky-400 blur-3xl" />
        </div>
        <div className="container relative py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Brand new · free · no sign-up needed</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-5 leading-tight">
            Play. Learn.<br />
            <span className="text-accent">Grow in Faith.</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Six beautifully-made Bible games for Zambian families - memory, trivia,
            scripture and adventure, all rooted in God's Word.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="rounded-full bg-primary-foreground/10 px-4 py-2">🎮 {GAMES.length} games</span>
            <span className="rounded-full bg-primary-foreground/10 px-4 py-2">🔥 {totalPlays} plays so far</span>
            <span className="rounded-full bg-primary-foreground/10 px-4 py-2">👨‍👩‍👧‍👦 For kids, teens & adults</span>
          </div>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="bg-secondary/50 py-14">
        <div className="container max-w-4xl text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Love the stories? Read the books.</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Every game comes from a Bible story you can own. Browse our ebooks - some are
            free - and get instant delivery on WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 font-semibold text-accent-foreground hover:bg-accent/90">
                Browse Ebooks <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link to="/whatsapp">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-primary/20 px-8 py-3 font-semibold hover:bg-primary/5">
                <Gamepad2 className="h-4 w-4" /> Get games & books on WhatsApp
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
