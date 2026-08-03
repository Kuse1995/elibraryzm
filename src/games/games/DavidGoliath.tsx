import { useEffect, useRef, useState } from "react";
import { sound } from "../sound";
import { confettiBurst } from "../confetti";
import { useGameStats } from "../useGameStats";

const W = 760;
const H = 430;
const GROUND = 330;

interface Level {
  id: string;
  label: string;
  speed: number;
  range: number;
  stones: number;
  hitRadius: number;
}

const LEVELS: Level[] = [
  { id: "easy", label: "The Valley", speed: 0.5, range: 85, stones: 5, hitRadius: 56 },
  { id: "medium", label: "The Hills", speed: 1.0, range: 65, stones: 5, hitRadius: 48 },
  { id: "hard", label: "The Battle Line", speed: 1.7, range: 50, stones: 4, hitRadius: 40 },
];

const TAUNTS = [
  "Is that all you have?",
  "Come here, little boy!",
  "I will feed you to the birds!",
  "My sword is bigger than you!",
];

interface Stone {
  x: number;
  y: number;
}

interface Flight {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
}

export default function DavidGoliath() {
  const { stats, record } = useGameStats("david-goliath");
  const [level, setLevel] = useState<Level | null>(null);
  const [phase, setPhase] = useState<"menu" | "aim" | "fly" | "hit" | "won" | "lost">("menu");
  const [stonesLeft, setStonesLeft] = useState(5);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [stone, setStone] = useState<Stone | null>(null);
  const [trail, setTrail] = useState<Stone[]>([]);
  const [hits, setHits] = useState(0);

  const sceneRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const goliathRef = useRef({ x: W * 0.7, t: 0 });
  const flightRef = useRef<Flight | null>(null);
  const [goliathX, setGoliathX] = useState(W * 0.7);
  const [goliathFallen, setGoliathFallen] = useState(false);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);

  const start = (lvl: Level) => {
    setLevel(lvl);
    setPhase("aim");
    setStonesLeft(lvl.stones);
    setTaunt(null);
    setStone(null);
    setTrail([]);
    setHits(0);
    setGoliathFallen(false);
    goliathRef.current = { x: W * 0.7, t: Math.random() * 10 };
    setGoliathX(W * 0.7);
    sound.play("click");
  };

  // Goliath patrol loop (runs while aiming or flying)
  useEffect(() => {
    if (!level || phase === "won" || phase === "lost") return;
    let raf = 0;
    const loop = () => {
      const g = goliathRef.current;
      g.t += level.speed;
      g.x = W * 0.7 + Math.sin(g.t) * level.range;
      setGoliathX(g.x);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [level, phase]);

  // Stone flight
  useEffect(() => {
    if (phase !== "fly" || !level) return;
    let raf = 0;
    const t0 = performance.now();
    let hit = false;
    const loop = (now: number) => {
      const dt = (now - t0) / 16.667;
      const f = flightRef.current;
      if (!f || hit) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const x = f.x0 + f.vx * dt;
      const y = f.y0 + f.vy * dt + 0.5 * 0.55 * dt * dt;
      setStone({ x, y });
      const gx = goliathRef.current.x;
      const hitY = GROUND - 135;
      const dist = Math.hypot(x - gx, y - hitY);
      if (dist < level.hitRadius) {
        hit = true;
        setPhase("hit");
        setGoliathFallen(true);
        sound.play("win");
        confettiBurst(110, gx / W, 0.25);
        setHits((h) => h + 1);
        setTimeout(() => {
          setPhase("won");
          record(700 + hits * 200);
        }, 1400);
        return;
      }
      if (y > GROUND + 10 || x > W + 20) {
        hit = true;
        setStone(null);
        setPhase("aim");
        const left = stonesLeft - 1;
        setStonesLeft(left);
        setTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
        sound.play("wrong");
        if (left <= 0) {
          setTimeout(() => setPhase("lost"), 900);
        }
        setTimeout(() => setTaunt(null), 2600);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, level, hits, record]);

  const aimFromEvent = (e: React.PointerEvent) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const scale = W / rect.width;
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale };
  };

  const onDown = (e: React.PointerEvent) => {
    if (phase !== "aim" || !level) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = aimFromEvent(e);
    dragRef.current = p;
    lastPointRef.current = p;
    setDragPoint(p);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current || phase !== "aim") return;
    const p = aimFromEvent(e);
    lastPointRef.current = p;
    setDragPoint(p);
    const pull = Math.min(220, Math.hypot(p.x - 150, p.y - 240));
    const dirX = p.x - 150 < 0 ? 1 : -1;
    const vx = dirX * pull * 0.16;
    const vy = -pull * 0.14;
    const preview: Stone[] = [];
    for (let i = 1; i <= 14; i++) {
      const t = i * 2.2;
      preview.push({ x: 150 + vx * t, y: 240 + vy * t + 0.5 * 0.55 * t * t });
    }
    setTrail(preview);
  };

  const onUp = () => {
    if (!dragRef.current || phase !== "aim" || !level) return;
    const p = lastPointRef.current || dragRef.current;
    dragRef.current = null;
    lastPointRef.current = null;
    setDragPoint(null);
    const sx = 150;
    const sy = 240;
    const pull = Math.min(220, Math.hypot(p.x - sx, p.y - sy));
    const dirX = p.x - sx < 0 ? 1 : -1;
    flightRef.current = { x0: sx, y0: sy, vx: dirX * pull * 0.16, vy: -pull * 0.14 };
    setTrail([]);
    setPhase("fly");
    sound.play("whoosh");
  };

  if (!level) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">🪨</div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">David & Goliath</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Drag the sling back, aim at the giant, and release. Five smooth stones -
          one is all it takes. Best: {stats.best || "—"} · played {stats.plays}×
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {LEVELS.map((lvl) => (
            <button key={lvl.id} onClick={() => start(lvl)} className="rounded-xl border bg-card p-6 hover:border-accent hover:shadow-md transition-all">
              <div className="text-4xl mb-3">{lvl.id === "easy" ? "🌄" : lvl.id === "medium" ? "⛰️" : "⚔️"}</div>
              <div className="font-semibold mb-1">{lvl.label}</div>
              <div className="text-sm text-muted-foreground">{lvl.stones} stones · {lvl.speed === 0.5 ? "slow" : lvl.speed === 1 ? "steady" : "fast"} giant</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold">
        <span className="rounded-full bg-navy text-white px-3 py-1">{"🪨".repeat(Math.max(0, stonesLeft)) || "No stones left"}</span>
        <span className="rounded-full bg-secondary px-3 py-1 text-slate-700">{level.label}</span>
      </div>

      <div
        ref={sceneRef}
        className="relative w-full overflow-hidden rounded-2xl border shadow-lg select-none"
        style={{ aspectRatio: `${W}/${H}`, touchAction: "none", cursor: phase === "aim" ? "crosshair" : "default" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#fef3c7" />
            </linearGradient>
            <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86c06b" />
              <stop offset="100%" stopColor="#4d8f4e" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#sky)" />
          <circle cx="640" cy="80" r="38" fill="#fde047" opacity="0.9" />
          <path d="M0 260 Q 200 180 420 250 T 760 240 L 760 330 L 0 330 Z" fill="url(#hill)" opacity="0.85" />
          <path d="M0 300 Q 260 250 520 300 T 760 290 L 760 330 L 0 330 Z" fill="#5d9e58" />
          <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="#8b5e3c" opacity="0.85" />
          <rect x="0" y={GROUND} width={W} height="10" fill="#6d4527" />

          {/* David figure */}
          <g transform="translate(110, 200)">
            <circle cx="0" cy="-58" r="14" fill="#d9a066" />
            <rect x="-11" y="-44" width="22" height="34" rx="8" fill="#e7e5e4" />
            <rect x="-13" y="-10" width="26" height="30" rx="6" fill="#1e3a5f" />
            <rect x="-13" y="20" width="9" height="26" fill="#d9a066" />
            <rect x="4" y="20" width="9" height="26" fill="#d9a066" />
          </g>

          {/* Slingshot */}
          <g>
            <rect x="146" y="250" width="6" height="80" rx="3" fill="#92400e" />
            <path d="M149 250 L 130 208" stroke="#92400e" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M152 250 L 172 208" stroke="#92400e" strokeWidth="5" strokeLinecap="round" fill="none" />
            {dragPoint ? (
              <>
                <line x1="130" y1="208" x2={dragPoint.x} y2={dragPoint.y} stroke="#b45309" strokeWidth="3" />
                <line x1="172" y1="208" x2={dragPoint.x} y2={dragPoint.y} stroke="#b45309" strokeWidth="3" />
                <circle cx={dragPoint.x} cy={dragPoint.y} r="9" fill="#78716c" stroke="#57534e" strokeWidth="2" />
              </>
            ) : (
              <circle cx="150" cy="240" r="9" fill="#78716c" stroke="#57534e" strokeWidth="2" />
            )}
          </g>

          {/* Trajectory preview */}
          {trail.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#1e3a5f" opacity={0.35 - i * 0.02} />
          ))}

          {/* Flying stone */}
          {stone && <circle cx={stone.x} cy={stone.y} r="8" fill="#78716c" stroke="#44403c" strokeWidth="2" />}

          {/* Goliath */}
          <g transform={`translate(${goliathX}, 0)`} style={{ transformOrigin: `${goliathX}px ${GROUND}px`, transition: goliathFallen ? "transform 1s ease-in" : "none", transform: goliathFallen ? "rotate(78deg)" : "none" }}>
            <rect x="-26" y={GROUND - 14} width="18" height="14" rx="4" fill="#57534e" />
            <rect x="8" y={GROUND - 14} width="18" height="14" rx="4" fill="#57534e" />
            <rect x="-34" y={GROUND - 150} width="68" height="122" rx="16" fill="#9ca3af" />
            <rect x="-28" y={GROUND - 142} width="20" height="60" rx="8" fill="#d1d5db" opacity="0.6" />
            <circle cx="0" cy={GROUND - 176} r="24" fill="#d9a066" />
            <circle cx="8" cy={GROUND - 182} r="4" fill="#3f3f46" />
            <circle cx="-8" cy={GROUND - 182} r="4" fill="#3f3f46" />
            <path d="M -24 -196 L 0 -214 L 24 -196 Z" fill="#7c3aed" />
            <circle cx="34" cy={GROUND - 120} r="36" fill="#b45309" stroke="#92400e" strokeWidth="4" />
            <circle cx="34" cy={GROUND - 120} r="22" fill="#d97706" opacity="0.5" />
            <line x1="40" y1={GROUND - 140} x2="74" y2={GROUND - 250} stroke="#57534e" strokeWidth="5" />
            <polygon points="74,-250 84,-240 74,-232" fill="#e5e7eb" />
          </g>

          {/* Taunt bubble */}
          {taunt && (
            <g>
              <rect x={goliathX + 60} y="60" width="210" height="52" rx="14" fill="white" stroke="#d6d3d1" strokeWidth="2" />
              <circle cx={goliathX + 84} cy="116" r="7" fill="white" stroke="#d6d3d1" strokeWidth="2" />
              <circle cx={goliathX + 70} cy="128" r="4" fill="white" stroke="#d6d3d1" strokeWidth="2" />
              <text x={goliathX + 72} y="90" fontSize="17" fontWeight="600" fill="#44403c">{taunt}</text>
            </g>
          )}
        </svg>

        <div className="scene-deco" style={{ zIndex: 5 }}>
          <span className="cloud" style={{ top: "8%", left: "4%", width: 90, height: 22, animationDuration: "30s", opacity: 0.55 }} />
          <span className="cloud" style={{ top: "18%", right: "6%", width: 60, height: 15, animationDuration: "42s", animationDelay: "-12s", opacity: 0.4 }} />
        </div>

        {phase === "aim" && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-navy/85 border border-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur shadow-lg">
            🎯 Drag the sling back, then release to throw
          </div>
        )}
      </div>

      {(phase === "won" || phase === "lost") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel-glass max-w-md w-full p-8 text-center pop-in">
            <div className="text-6xl mb-3 bounce-in inline-block">{phase === "won" ? "🏆" : "🪨"}</div>
            <h3 className="font-display text-2xl font-bold mb-2">
              {phase === "won" ? "The giant has fallen!" : "Goliath still stands"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {phase === "won"
                ? `You brought him down with the stone! (${hits} hit${hits > 1 ? "s" : ""})`
                : "Run out of stones - try again, shepherd boy!"}
            </p>
            <p className="text-sm italic text-muted-foreground mb-5">
              "The battle is the Lord's." — 1 Samuel 17:47
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => start(level)} className="btn-gold">
                Play again
              </button>
              <button onClick={() => setLevel(null)} className="rounded-full border-2 border-slate-200 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
                Levels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
