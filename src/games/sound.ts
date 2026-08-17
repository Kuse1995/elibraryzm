// Sound effects: CC0 samples (Kenney "Interface Sounds") with a Web Audio
// synth fallback for browsers that cannot decode OGG (e.g. iOS Safari).
type SoundName = "click" | "correct" | "wrong" | "win" | "whoosh" | "pop" | "reveal";

const STORE_KEY = "elibrary.games.muted";

const SAMPLES: Record<SoundName, string> = {
  click: "/game-audio/click.ogg",
  pop: "/game-audio/pop.ogg",
  correct: "/game-audio/correct.ogg",
  wrong: "/game-audio/wrong.ogg",
  reveal: "/game-audio/reveal.ogg",
  whoosh: "/game-audio/whoosh.ogg",
  win: "/game-audio/win.ogg",
};

const buffers: Partial<Record<SoundName, AudioBuffer | null>> = {};
let decoding = false;

let ctx: AudioContext | null = null;
let muted = typeof localStorage !== "undefined" && localStorage.getItem(STORE_KEY) === "1";

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.16) {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Lazily decode every sample once; a sound that fails to decode is stored as
// null so its calls fall through to the synth tone.
function loadSamples() {
  if (decoding || typeof window === "undefined") return;
  const c = ensureCtx();
  if (!c) return;
  decoding = true;
  (Object.keys(SAMPLES) as SoundName[]).forEach((name) => {
    fetch(SAMPLES[name])
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("http " + r.status))))
      .then((ab) => c.decodeAudioData(ab))
      .then((buf) => {
        buffers[name] = buf;
      })
      .catch(() => {
        buffers[name] = null;
      });
  });
}

function playSample(name: SoundName): boolean {
  const c = ensureCtx();
  if (!c) return false;
  const buf = buffers[name];
  if (buf === undefined) {
    loadSamples();
    return false; // first tap primes the cache; synth covers it
  }
  if (!buf) return false;
  try {
    const src = c.createBufferSource();
    const gain = c.createGain();
    gain.gain.value = 0.5;
    src.buffer = buf;
    src.connect(gain).connect(c.destination);
    src.start();
    return true;
  } catch {
    return false;
  }
}

function synth(name: SoundName) {
  switch (name) {
    case "click":
      tone(520, 0, 0.08, "triangle", 0.1);
      break;
    case "pop":
      tone(660, 0, 0.09, "triangle", 0.14);
      tone(880, 0.05, 0.09, "triangle", 0.1);
      break;
    case "correct":
      tone(523.25, 0, 0.12, "sine", 0.16);
      tone(659.25, 0.1, 0.12, "sine", 0.16);
      tone(783.99, 0.2, 0.22, "sine", 0.16);
      break;
    case "wrong":
      tone(196, 0, 0.18, "sawtooth", 0.08);
      tone(155.56, 0.12, 0.24, "sawtooth", 0.07);
      break;
    case "reveal":
      tone(440, 0, 0.1, "sine", 0.09);
      tone(554.37, 0.09, 0.12, "sine", 0.09);
      break;
    case "whoosh":
      tone(300, 0, 0.15, "sine", 0.05);
      tone(600, 0.08, 0.12, "sine", 0.04);
      break;
    case "win":
      tone(523.25, 0, 0.14, "sine", 0.16);
      tone(659.25, 0.12, 0.14, "sine", 0.16);
      tone(783.99, 0.24, 0.14, "sine", 0.16);
      tone(1046.5, 0.36, 0.42, "sine", 0.18);
      break;
  }
}

export const sound = {
  isMuted(): boolean {
    return muted;
  },
  setMuted(m: boolean) {
    muted = m;
    try {
      localStorage.setItem(STORE_KEY, m ? "1" : "0");
    } catch {
      // storage unavailable - sound still works this session
    }
  },
  play(name: SoundName) {
    if (muted) return;
    try {
      if (!playSample(name)) synth(name);
    } catch {
      // audio is optional - never break the game
    }
  },
};

export default sound;
