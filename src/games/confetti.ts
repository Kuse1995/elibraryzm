// Zero-dependency confetti burst on a temporary canvas overlay.
const COLORS = ["#E9B949", "#F5D67B", "#1E3A5F", "#FFFFFF", "#6BA368", "#C96F4A"];

export function confettiBurst(count = 90, originX = 0.5, originY = 0.4) {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const g = canvas.getContext("2d");
  if (!g) {
    canvas.remove();
    return;
  }
  g.scale(dpr, dpr);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const parts = Array.from({ length: count }, () => ({
    x: W * originX + (Math.random() - 0.5) * 60,
    y: H * originY + (Math.random() - 0.5) * 40,
    vx: (Math.random() - 0.5) * 14,
    vy: -(Math.random() * 13 + 5),
    size: 5 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }));
  let raf = 0;
  const started = performance.now();
  const DURATION = 2600;
  const frame = (now: number) => {
    g.clearRect(0, 0, W, H);
    const t = (now - started) / DURATION;
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += 0.15 + p.vr;
      const life = Math.max(0, 1 - t);
      g.save();
      g.globalAlpha = life;
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillStyle = p.color;
      g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
      g.restore();
    }
    if (t < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };
  raf = requestAnimationFrame(frame);
}
