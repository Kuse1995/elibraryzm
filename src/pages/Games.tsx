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
    <span className="inline-flex items-center gap-0.5" title={"Difficulty " + level + "/3"}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={"h-1.5 w-1.5 rounded-full " + (i <= level ? "bg-accent" : "bg-muted-foreground/30")} />
      ))}
    </span>
  );
}

function GameCard({ game }: { game: GameMeta }) {
  const stats = getAllStats()[game.slug];
  return (
    <Link
      to={"/games/" + game.slug}
      className="card-shine group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-navy/20"
    >
      <div className={"relative bg-gradient-to-br " + game.gradient + " p-8 text-center overflow-hidden"}>
        <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/20 blur-sm" />
        <div className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-black/10 blur-sm" />
        <div className="absolute top-4 left-4 h-2 w-2 rounded-full bg-white/60" />
        <div className="absolute bottom-5 right-6 h-1.5 w-1.5 rounded-full bg-white/50" />
        <span className="floaty relative inline-block text-6xl drop-shadow-xl group-hover:scale-125 transition-transform duration-300">
          {game.emoji}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            {game.premium && (
              <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-950">PREMIUM</span>
            )}
            <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + AUDIENCE_STYLES[game.audience]}>
              {game.audience}
            </span>
          </span>
          <DifficultyDots level={game.difficulty} />
        </div>
        <h3 className="font-display text-lg font-bold mb-1">{game.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{game.description}</p>
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
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/40 group-hover:bg-accent/90">
            Play <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function HeroDecor() {
  return (
    <div className="scene-deco">
      {[
        { top: "8%", left: "6%", size: 7, delay: "0s" },
        { top: "18%", left: "16%", size: 4, delay: "0.6s" },
        { top: "6%", left: "38%", size: 5, delay: "1.2s" },
        { top: "14%", left: "58%", size: 4, delay: "0.3s" },
        { top: "8%", left: "78%", size: 6, delay: "0.9s" },
        { top: "22%", left: "90%", size: 5, delay: "1.5s" },
        { top: "30%", left: "28%", size: 4, delay: "1.8s" },
      ].map((s, i) => (
        <span key={i} className="star" style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }} />
      ))}
      <span className="cloud" style={{ top: "12%", width: 110, height: 26, animationDuration: "34s", opacity: 0.35 }} />
      <span className="cloud" style={{ top: "24%", width: 70, height: 18, animationDuration: "48s", animationDelay: "-20s", opacity: 0.25 }} />
      <span className="floaty absolute" style={{ top: "12%", right: "12%", fontSize: 44, opacity: 0.5 }}>🎮</span>
      <span className="floaty absolute" style={{ bottom: "14%", left: "10%", fontSize: 36, opacity: 0.45, animationDelay: "-2s" }}>📖</span>
    </div>
  );
}

export default function Games() {
  const all = getAllStats();
  const totalPlays = Object.values(all).reduce((sum, s) => sum + s.plays, 0);

  return (
    <div>
      <section className="game-scene scene-trivia text-white">
        <HeroDecor />
        <div className="container relative py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm mb-6 backdrop-blur">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Free to start · unlocked with any purchase or All-Access</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-5 leading-tight drop-shadow-lg">
            Play. Learn.<br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-300 bg-clip-text text-transparent">Grow in Faith.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Beautifully-made Bible games for Zambian families — memory, trivia,
            scripture, word puzzles and adventure, all rooted in God's Word.
            Buy any ebook (from K15) and every game unlocks for you, free forever.
            Our premium adventures — Noah's Ark, Jonah & the Whale and Bible Merge — are included with All-Access — K10 a month or K100 a year.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="rounded-full bg-white/10 border border-white/20 px-4 py-2 backdrop-blur">🎮 {GAMES.length} games</span>
            <span className="rounded-full bg-white/10 border border-white/20 px-4 py-2 backdrop-blur">🔥 {totalPlays} plays so far</span>
            <span className="rounded-full bg-white/10 border border-white/20 px-4 py-2 backdrop-blur">👨‍👩‍👧‍👦 For kids, teens & adults</span>
          </div>
          <div className="mt-9">
            <a href="#games-grid" className="btn-gold">
              Choose a game <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="games-grid" className="container py-14 scroll-mt-24">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Pick your adventure</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Every game is free, works on any phone, and teaches the Word of God through play.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="container max-w-4xl">
          <div className="game-scene scene-garden px-6 py-12 text-center">
            <div className="scene-deco">
              <span className="sun" style={{ top: "-30px", right: "8%", width: 84, height: 84 }} />
              <span className="cloud" style={{ top: "18%", left: "6%", width: 90, height: 22, animationDuration: "40s" }} />
              <span className="cloud" style={{ top: "10%", right: "22%", width: 60, height: 16, animationDuration: "52s", animationDelay: "-18s", opacity: 0.8 }} />
            </div>
            <div className="relative">
              <div className="text-5xl mb-4 floaty inline-block">📚</div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Love the stories? Read the books.</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Every game comes from a Bible story you can own. Browse our ebooks — some are
                free — and get instant delivery on WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/browse" className="btn-gold">
                  Browse Ebooks <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/whatsapp" className="btn-navy">
                  <Gamepad2 className="h-4 w-4" /> Get games & books on WhatsApp
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
