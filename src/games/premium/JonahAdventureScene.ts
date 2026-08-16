import Phaser from "phaser";

export interface StageDef {
  name: string;
  hint: string;
  goalKind: "whale" | "light" | "gate";
  start: { x: number; y: number };
  goal: { x: number; y: number };
  stars: { x: number; y: number }[];
  boxes?: { x: number; y: number; w: number; h: number }[];
  rocks?: { x: number; y: number; r: number }[];
  barrels?: { x: number; y: number }[];
  pads?: { x: number; y: number }[];
  water?: { x: number; y: number; w: number; h: number }[];
  hazards?: { x: number; y: number }[];
}

export const JONAH_CHAPTERS = ["The Storm", "The Belly", "Nineveh"] as const;

export const JONAH_STAGES: StageDef[] = [
  // ---- Chapter 1: The Storm ----
  {
    name: "First Fling",
    hint: "Drag back, then release to fling Jonah",
    goalKind: "whale",
    start: { x: 90, y: 640 },
    goal: { x: 400, y: 600 },
    stars: [{ x: 180, y: 520 }, { x: 280, y: 460 }, { x: 370, y: 520 }],
  },
  {
    name: "Over the Rail",
    hint: "Clear the gap between the decks",
    goalKind: "whale",
    start: { x: 90, y: 620 },
    goal: { x: 400, y: 540 },
    stars: [{ x: 150, y: 480 }, { x: 260, y: 500 }, { x: 360, y: 460 }],
    boxes: [
      { x: 90, y: 700, w: 180, h: 120 },
      { x: 360, y: 700, w: 120, h: 120 },
    ],
  },
  {
    name: "The Toss",
    hint: "Mind the rolling barrels",
    goalKind: "whale",
    start: { x: 90, y: 600 },
    goal: { x: 410, y: 620 },
    stars: [{ x: 200, y: 500 }, { x: 300, y: 480 }, { x: 360, y: 540 }],
    boxes: [{ x: 90, y: 700, w: 180, h: 120 }],
    barrels: [{ x: 150, y: 600 }, { x: 330, y: 690 }],
  },
  {
    name: "The Waves",
    hint: "Swim and float through the water",
    goalKind: "whale",
    start: { x: 90, y: 660 },
    goal: { x: 410, y: 600 },
    stars: [{ x: 150, y: 500 }, { x: 250, y: 460 }, { x: 350, y: 500 }],
    water: [{ x: 240, y: 650, w: 400, h: 220 }],
    rocks: [{ x: 180, y: 620, r: 24 }, { x: 290, y: 580, r: 20 }],
  },
  {
    name: "Into the Whale",
    hint: "Slip through the mouth, dodge the starfish",
    goalKind: "whale",
    start: { x: 80, y: 620 },
    goal: { x: 360, y: 560 },
    stars: [{ x: 150, y: 470 }, { x: 330, y: 450 }, { x: 200, y: 560 }],
    boxes: [
      { x: 270, y: 520, w: 40, h: 480 },
      { x: 440, y: 520, w: 40, h: 480 },
    ],
    hazards: [{ x: 330, y: 640 }],
  },
  // ---- Chapter 2: The Belly ----
  {
    name: "Inside",
    hint: "Ride the bounce pad to the light",
    goalKind: "light",
    start: { x: 80, y: 640 },
    goal: { x: 400, y: 250 },
    stars: [{ x: 150, y: 380 }, { x: 300, y: 320 }, { x: 400, y: 430 }],
    boxes: [{ x: 140, y: 260, w: 680, h: 30 }],
    pads: [{ x: 250, y: 690 }],
  },
  {
    name: "The Churn",
    hint: "Climb the ledges past the barrels",
    goalKind: "light",
    start: { x: 90, y: 560 },
    goal: { x: 410, y: 300 },
    stars: [{ x: 250, y: 450 }, { x: 340, y: 380 }, { x: 180, y: 420 }],
    boxes: [
      { x: 110, y: 600, w: 220, h: 40 },
      { x: 380, y: 480, w: 120, h: 40 },
    ],
    barrels: [{ x: 200, y: 540 }, { x: 350, y: 700 }],
  },
  {
    name: "Bubble Lift",
    hint: "Chain the bounce pads to the top",
    goalKind: "light",
    start: { x: 80, y: 640 },
    goal: { x: 410, y: 220 },
    stars: [{ x: 250, y: 560 }, { x: 120, y: 440 }, { x: 330, y: 300 }],
    pads: [{ x: 140, y: 680 }, { x: 300, y: 540 }, { x: 170, y: 400 }],
  },
  {
    name: "The Ribs",
    hint: "Weave between the whale's ribs",
    goalKind: "light",
    start: { x: 80, y: 640 },
    goal: { x: 400, y: 300 },
    stars: [{ x: 120, y: 380 }, { x: 240, y: 300 }, { x: 360, y: 440 }],
    rocks: [
      { x: 170, y: 480, r: 28 },
      { x: 170, y: 600, r: 28 },
      { x: 310, y: 420, r: 28 },
      { x: 310, y: 540, r: 28 },
      { x: 310, y: 660, r: 28 },
    ],
  },
  {
    name: "The Spout",
    hint: "Climb the steps and escape to the light",
    goalKind: "light",
    start: { x: 80, y: 560 },
    goal: { x: 240, y: 190 },
    stars: [{ x: 140, y: 480 }, { x: 240, y: 380 }, { x: 400, y: 340 }],
    boxes: [
      { x: 70, y: 660, w: 140, h: 200 },
      { x: 220, y: 560, w: 120, h: 400 },
      { x: 360, y: 460, w: 120, h: 600 },
    ],
    pads: [{ x: 300, y: 500 }],
  },
  // ---- Chapter 3: Nineveh ----
  {
    name: "Ashore",
    hint: "Cross the dunes to the city gate",
    goalKind: "gate",
    start: { x: 80, y: 620 },
    goal: { x: 410, y: 480 },
    stars: [{ x: 160, y: 500 }, { x: 280, y: 460 }, { x: 360, y: 520 }],
    boxes: [
      { x: 240, y: 660, w: 160, h: 200 },
      { x: 420, y: 640, w: 120, h: 240 },
    ],
  },
  {
    name: "The Market",
    hint: "Bounce from stall to stall",
    goalKind: "gate",
    start: { x: 80, y: 640 },
    goal: { x: 400, y: 250 },
    stars: [{ x: 250, y: 480 }, { x: 330, y: 400 }, { x: 120, y: 380 }],
    boxes: [
      { x: 190, y: 600, w: 100, h: 40 },
      { x: 330, y: 520, w: 90, h: 40 },
      { x: 220, y: 420, w: 100, h: 40 },
    ],
    barrels: [{ x: 240, y: 690 }],
  },
  {
    name: "The Walls",
    hint: "Over the wall, through the gate",
    goalKind: "gate",
    start: { x: 80, y: 620 },
    goal: { x: 240, y: 300 },
    stars: [{ x: 110, y: 340 }, { x: 300, y: 300 }, { x: 240, y: 150 }],
    boxes: [
      { x: 40, y: 480, w: 100, h: 560 },
      { x: 370, y: 480, w: 100, h: 560 },
    ],
    pads: [{ x: 240, y: 700 }],
  },
  {
    name: "The King's Tower",
    hint: "Climb the platforms to the tower top",
    goalKind: "gate",
    start: { x: 80, y: 600 },
    goal: { x: 380, y: 250 },
    stars: [{ x: 140, y: 560 }, { x: 140, y: 420 }, { x: 140, y: 300 }],
    boxes: [
      { x: 320, y: 500, w: 120, h: 520 },
      { x: 100, y: 640, w: 160, h: 40 },
      { x: 100, y: 500, w: 160, h: 40 },
      { x: 100, y: 360, w: 160, h: 40 },
    ],
    pads: [{ x: 250, y: 600 }, { x: 250, y: 440 }],
  },
  {
    name: "Nineveh Repents",
    hint: "One last flight to the great gate",
    goalKind: "gate",
    start: { x: 80, y: 640 },
    goal: { x: 400, y: 200 },
    stars: [{ x: 220, y: 560 }, { x: 120, y: 400 }, { x: 260, y: 260 }],
    pads: [{ x: 140, y: 660 }, { x: 300, y: 560 }, { x: 160, y: 440 }, { x: 340, y: 320 }],
  },
];

export interface JonahAdventureCallbacks {
  onReady: () => void;
  onStageComplete: (stageId: number, stars: number) => void;
}

const W = 480;
const H = 800;
const FLOOR_Y = 760;
const LAUNCH_SCALE = 6.5;
const MAX_LAUNCH = 1050;

const CHAPTER_BG: Record<string, { top: number; deep: number; floor: number; decor: "storm" | "belly" | "city" }> = {
  0: { top: 0x17556e, deep: 0x0f3a4c, floor: 0x2a5d73, decor: "storm" },
  1: { top: 0x6e3a5e, deep: 0x4a2640, floor: 0x5a3050, decor: "belly" },
  2: { top: 0x2f7fa8, deep: 0x1e5c80, floor: 0xd9c07a, decor: "city" },
};

export class JonahAdventureScene extends Phaser.Scene {
  private cbs: JonahAdventureCallbacks;
  private stageId = 0;
  private stage: StageDef = JONAH_STAGES[0];

  private jonah!: Phaser.GameObjects.Container;
  private jonahBody!: Phaser.Physics.Arcade.Body;
  private startX = 0;
  private startY = 0;
  private starsCollected = 0;
  private starsLeft!: Phaser.GameObjects.Text;
  private idle = true;
  private completed = false;

  private dragStart = new Phaser.Math.Vector2();
  private dragging = false;
  private dots: Phaser.GameObjects.Arc[] = [];

  private barrels: Phaser.Physics.Arcade.Group | null = null;
  private waterZones: { rect: Phaser.GameObjects.Rectangle; bounds: Phaser.Geom.Rectangle }[] = [];
  private statics!: Phaser.Physics.Arcade.StaticGroup;

  private muted = false;
  private audio?: AudioContext;

  constructor(cbs: JonahAdventureCallbacks) {
    super({ key: "jonah-adventure-scene" });
    this.cbs = cbs;
  }

  init(data: { stage?: number }) {
    this.stageId = data?.stage ?? 0;
  }

  create() {
    this.stage = JONAH_STAGES[Math.min(this.stageId, JONAH_STAGES.length - 1)];
    this.starsCollected = 0;
    this.idle = true;
    this.completed = false;
    this.waterZones = [];
    this.dots = [];

    const theme = CHAPTER_BG[Math.floor(this.stageId / 5)] ?? CHAPTER_BG[0];
    this.cameras.main.setBackgroundColor(theme.top);
    this.physics.world.gravity.y = 1500;

    this.statics = this.physics.add.staticGroup();
    this.buildBackdrop(theme);
    this.buildJonah();
    this.buildBodies();
    this.buildGoal();
    this.buildHud();
    this.buildInput();
    this.showIntro();

    this.cbs.onReady();
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta, 33);

    // water buoyancy: strong upward push so Jonah floats instead of sinking
    const inWater = this.waterZones.find((z) => z.bounds.contains(this.jonah.x, this.jonah.y));
    if (inWater) {
      const v = this.jonahBody.velocity;
      this.jonahBody.setVelocityY(Phaser.Math.Clamp(v.y - 70, -80, 90));
      this.jonahBody.setVelocityX(v.x * 0.985);
    }

    // idle detection for re-flinging
    if (!this.completed) {
      const speed = this.jonahBody.velocity.length();
      if (!this.idle && speed < 25) this.idle = true;
      if (this.idle && speed > 60) this.idle = false;
    }
    this.jonah.setRotation(Phaser.Math.Clamp(this.jonahBody.velocity.x * -0.0004, -0.5, 0.5));

    // keep Jonah on the stage
    if (this.jonah.y > H + 160 || this.jonah.x < -200 || this.jonah.x > W + 200) this.returnToStart(false);
  }

  // ---- world ----

  private buildBackdrop(theme: { top: number; deep: number; floor: number; decor: string }) {
    this.add.rectangle(W / 2, H / 2, W, H, theme.top).setDepth(0);
    this.add.rectangle(W / 2, H * 0.7, W, H * 0.6, theme.deep, 0.5).setDepth(0);

    if (theme.decor === "storm") {
      this.add.rectangle(W / 2, 30, W, 60, 0x2e6d8f).setDepth(1);
      const rainCfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
        x: 0,
        y: 0,
        emitZone: { type: "random", source: new Phaser.Geom.Rectangle(0, -20, W, 20) },
        speedY: { min: 500, max: 700 },
        lifespan: 900,
        quantity: 1,
        frequency: 60,
        scale: { min: 0.6, max: 1.2 },
        alpha: { start: 0.35, end: 0 },
        tint: 0x9ec9ff,
      };
      this.add.particles(0, 0, this.ensureDot(), rainCfg).setDepth(3);
    } else if (theme.decor === "belly") {
      const rib = (x: number) => {
        this.add.rectangle(x, H / 2, 30, H, 0x8a4a72).setDepth(1);
      };
      rib(12);
      rib(W - 12);
      const bg = this.add.text(W / 2, 150, "🫧", { fontSize: "36px" }).setAlpha(0.3).setDepth(1);
      this.tweens.add({ targets: bg, y: 130, yoyo: true, repeat: -1, duration: 1600 });
    } else {
      // city: warm sun
      const sun = this.add.text(70, 90, "☀️", { fontSize: "52px" }).setDepth(0).setAlpha(0.9);
      this.tweens.add({ targets: sun, y: 80, yoyo: true, repeat: -1, duration: 1800 });
      this.add.rectangle(W - 70, 320, 90, 460, 0xd9a85a, 0.35).setDepth(1);
    }

    // floor
    this.add.rectangle(W / 2, FLOOR_Y + 20, W, 80, theme.floor).setDepth(1);
    this.add.rectangle(W / 2, FLOOR_Y + 2, W, 6, 0xffffff, 0.15).setDepth(2);
    const floorStatic = this.add.rectangle(W / 2, FLOOR_Y + 40, W, 80, 0x000000, 0);
    this.statics.add(floorStatic);
    (floorStatic.body as Phaser.Physics.Arcade.StaticBody).bounce.set(0.4);
  }

  private ensureDot(): string {
    if (!this.textures.exists("dot")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 3);
      g.generateTexture("dot", 6, 6);
      g.destroy();
    }
    return "dot";
  }

  private buildBodies() {
    const statics = this.statics;
    const makeBox = (b: { x: number; y: number; w: number; h: number }) => {
      const rect = this.add.rectangle(b.x, b.y, b.w, b.h, 0x9c6b3c).setStrokeStyle(3, 0x6b4423).setDepth(2);
      statics.add(rect);
      const body = rect.body as Phaser.Physics.Arcade.StaticBody;
      body.bounce.set(0.35);
    };
    this.stage.boxes?.forEach(makeBox);

    this.stage.rocks?.forEach((r) => {
      const rock = this.add.circle(r.x, r.y, r.r, 0x8a97a5).setStrokeStyle(3, 0x5d6a78).setDepth(2);
      statics.add(rock);
      (rock.body as Phaser.Physics.Arcade.StaticBody).bounce.set(0.3);
      this.add.circle(r.x - r.r * 0.3, r.y - r.r * 0.3, r.r * 0.22, 0x6d7a88).setDepth(3);
    });

    this.stage.hazards?.forEach((hz) => {
      this.buildStarfish(hz.x, hz.y);
      const hit = this.add.zone(hz.x, hz.y, 46, 46);
      statics.add(hit);
      (hit.body as Phaser.Physics.Arcade.StaticBody).bounce.set(0.6);
    });

    this.stage.pads?.forEach((p) => {
      const pad = this.add.circle(p.x, p.y, 20, 0xffd76a).setStrokeStyle(4, 0xf0a832).setDepth(2);
      statics.add(pad);
      (pad.body as Phaser.Physics.Arcade.StaticBody).bounce.set(1.35);
      this.tweens.add({
        targets: pad,
        scaleX: 1.12,
        scaleY: 1.12,
        yoyo: true,
        repeat: -1,
        duration: 500,
        ease: "Sine.easeInOut",
      });
    });

    this.stage.water?.forEach((wtr) => {
      const rect = this.add.rectangle(wtr.x, wtr.y, wtr.w, wtr.h, 0x1e7fb0, 0.55).setDepth(2);
      const topLine = this.add.rectangle(wtr.x, wtr.y - wtr.h / 2, wtr.w, 6, 0xbfe3ff, 0.7).setDepth(3);
      this.tweens.add({ targets: topLine, y: wtr.y - wtr.h / 2 + 4, yoyo: true, repeat: -1, duration: 900 });
      this.waterZones.push({
        rect,
        bounds: new Phaser.Geom.Rectangle(wtr.x - wtr.w / 2, wtr.y - wtr.h / 2, wtr.w, wtr.h),
      });
    });

    this.barrels = this.physics.add.group({ allowGravity: true });
    this.stage.barrels?.forEach((b) => {
      const barrel = this.add.container(b.x, b.y).setDepth(3);
      const body = this.add.ellipse(0, 0, 36, 36, 0xa0522d).setStrokeStyle(3, 0x6b3a1a);
      const hoop = this.add.rectangle(0, -14, 38, 5, 0x5d3a1a);
      const hoop2 = this.add.rectangle(0, 14, 38, 5, 0x5d3a1a);
      barrel.add([body, hoop, hoop2]);
      this.physics.add.existing(barrel);
      const phBody = barrel.body as Phaser.Physics.Arcade.Body;
      phBody.setCircle(18, -18, -18);
      phBody.setBounce(0.4);
      phBody.setFriction(0.5, 0.1);
      this.barrels.add(barrel);
    });
    if (this.barrels) {
      this.physics.add.collider(this.barrels, this.statics);
      this.physics.add.collider(this.jonah, this.barrels);
    }

    // stars
    this.stage.stars.forEach((s) => {
      const star = this.add.text(s.x, s.y, "⭐", { fontSize: "40px" }).setOrigin(0.5).setDepth(3);
      this.tweens.add({ targets: star, scaleX: 1.2, scaleY: 1.2, yoyo: true, repeat: -1, duration: 600, ease: "Sine.easeInOut" });
      const trigger = this.add.zone(s.x, s.y, 56, 56);
      this.physics.add.existing(trigger, true);
      trigger.setData("starVisual", star);
      this.physics.add.overlap(this.jonah, trigger, (_j, t) => {
        const vis = (t as Phaser.GameObjects.Zone).getData("starVisual") as Phaser.GameObjects.Text;
        if (!vis.active) return;
        vis.destroy();
        t.destroy();
        this.starsCollected += 1;
        this.updateHud();
        this.sparkleBurst(s.x, s.y, 14);
        this.sfxCollect();
      });
    });
  }

  private buildStarfish(x: number, y: number): Phaser.GameObjects.Container {
    const sf = this.add.container(x, y).setDepth(3);
    const g = this.add.graphics();
    g.fillStyle(0xe86f6f, 1);
    const points = 10;
    const outer = 26;
    const inner = 12;
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.fillStyle(0xf5f5f5, 1);
    g.fillCircle(0, 0, 8);
    sf.add(g);
    return sf;
  }

  private buildJonah() {
    this.startX = this.stage.start.x;
    this.startY = this.stage.start.y;
    this.jonah = this.add.container(this.startX, this.startY).setDepth(5);
    const robe = this.add.rectangle(0, 0, 26, 28, 0xd97b3f).setStrokeStyle(2, 0xa85a26);
    const head = this.add.circle(0, -20, 11, 0xf2c194);
    const beard = this.add.ellipse(0, -14, 15, 11, 0xf5f5f5);
    const eyeL = this.add.circle(-4, -22, 1.8, 0x222222);
    const eyeR = this.add.circle(4, -22, 1.8, 0x222222);
    this.jonah.add([robe, head, beard, eyeL, eyeR]);

    this.physics.add.existing(this.jonah);
    this.jonahBody = this.jonah.body as Phaser.Physics.Arcade.Body;
    this.jonahBody.setCircle(15, -15, -15);
    this.jonahBody.setBounce(0.5);
    this.jonahBody.setFriction(0.3, 0.02);
    this.physics.add.collider(this.jonah, this.statics);
  }

  private buildGoal() {
    const { goal, goalKind } = this.stage;
    const g = this.add.container(goal.x, goal.y).setDepth(4);
    if (goalKind === "whale") {
      const body = this.add.ellipse(0, 10, 110, 66, 0x23456e);
      const belly = this.add.ellipse(0, 26, 84, 32, 0x9ec9e8);
      const eye = this.add.circle(-34, -6, 7, 0xffffff);
      const pupil = this.add.circle(-36, -6, 3, 0x111111);
      const mouth = this.add.circle(30, 10, 20, 0x0d1b2a);
      g.add([body, belly, eye, pupil, mouth]);
      this.tweens.add({ targets: g, scaleX: 1.06, scaleY: 1.06, yoyo: true, repeat: -1, duration: 700, ease: "Sine.easeInOut" });
    } else if (goalKind === "light") {
      const glow = this.add.circle(0, 0, 40, 0xfff2b0, 0.35);
      const beam = this.add.rectangle(0, 26, 60, 90, 0xfff2b0, 0.3);
      g.add([beam, glow]);
      this.tweens.add({ targets: glow, alpha: 0.15, yoyo: true, repeat: -1, duration: 800 });
    } else {
      const wall = this.add.rectangle(0, 10, 100, 60, 0xd9a85a).setStrokeStyle(3, 0x8a6a3a);
      const arch = this.add.arc(0, -14, 30, Math.PI, Math.PI * 2, false, 0x0d1b2a);
      const door = this.add.rectangle(0, 24, 34, 24, 0x0d1b2a);
      g.add([wall, door, arch]);
      this.tweens.add({ targets: g, y: goal.y - 6, yoyo: true, repeat: -1, duration: 900, ease: "Sine.easeInOut" });
    }
    const ring = this.add.circle(0, 0, 46, 0xffffff, 0.18).setStrokeStyle(3, 0xffffff, 0.6);
    g.add(ring);

    const trigger = this.add.zone(goal.x, goal.y, 88, 88);
    this.physics.add.existing(trigger, true);
    this.physics.add.overlap(this.jonah, trigger, () => this.completeStage());
  }

  private buildHud() {
    this.starsLeft = this.add.text(16, 12, "⭐ 0/3", { fontSize: "30px" }).setDepth(10);
    this.add
      .text(W / 2, 14, `${Math.floor(this.stageId / 5) + 1}-${(this.stageId % 5) + 1} ${this.stage.name}`, {
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#00000088",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  private updateHud() {
    this.starsLeft.setText(`⭐ ${this.starsCollected}/3`);
  }

  private showIntro() {
    const intro = this.add
      .text(W / 2, H * 0.3, `${this.stage.name}\n${this.stage.hint}`, {
        fontSize: "28px",
        color: "#ffffff",
        stroke: "#000000aa",
        strokeThickness: 6,
        align: "center",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: intro, alpha: 0, delay: 1800, duration: 500, onComplete: () => intro.destroy() });
  }

  // ---- input: fling ----

  private buildInput() {
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.dragStart.set(p.x, p.y);
      this.dragging = true;
      this.buildDots();
      this.placeDots(this.dragStart, this.dragStart);
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.placeDots(this.dragStart, new Phaser.Math.Vector2(p.x, p.y));
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.hideDots();
      const vec = new Phaser.Math.Vector2(this.dragStart.x - p.x, this.dragStart.y - p.y);
      const len = vec.length();
      if (len < 25 || this.completed) return;
      const speed = Math.min(len * LAUNCH_SCALE, MAX_LAUNCH);
      vec.normalize().scale(speed);
      this.jonahBody.setVelocity(vec.x, vec.y);
      this.idle = false;
      this.sfxFling();
      this.stretchFx();
    });
    this.input.on("pointerupoutside", () => {
      this.dragging = false;
      this.hideDots();
    });
  }

  private buildDots() {
    for (let i = 0; i < 14; i++) {
      const dot = this.add.circle(0, 0, 4, 0xffffff, 0.55).setDepth(6).setVisible(false);
      this.dots.push(dot);
    }
  }

  private placeDots(from: Phaser.Math.Vector2, to: Phaser.Math.Vector2) {
    const vec = new Phaser.Math.Vector2(from.x - to.x, from.y - to.y);
    const len = vec.length();
    if (len < 25) {
      this.hideDots();
      return;
    }
    const speed = Math.min(len * LAUNCH_SCALE, MAX_LAUNCH);
    const vx = (vec.x / len) * speed;
    const vy = (vec.y / len) * speed;
    let px = this.jonah.x;
    let py = this.jonah.y;
    let cvx = vx;
    let cvy = vy;
    this.dots.forEach((dot, i) => {
      cvx *= 0.985;
      cvy += this.physics.world.gravity.y * 0.055;
      px += cvx * 0.055;
      py += cvy * 0.055;
      dot.setPosition(px, py);
      dot.setVisible(i > 1);
      dot.setAlpha(0.6 - i * 0.03);
    });
  }

  private hideDots() {
    this.dots.forEach((d) => d.setVisible(false));
  }

  // ---- stage outcomes ----

  private completeStage() {
    if (this.completed) return;
    this.completed = true;
    this.jonahBody.setVelocity(0, 0);
    this.sfxWin();
    this.confettiBurst(this.stage.goal.x, this.stage.goal.y, 60);
    const msg = this.add
      .text(W / 2, H * 0.35, "Stage complete!", {
        fontSize: "36px",
        color: "#ffffff",
        stroke: "#000000aa",
        strokeThickness: 8,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setScale(0.3);
    this.tweens.add({ targets: msg, scaleX: 1, scaleY: 1, duration: 500, ease: "Back.easeOut" });
    this.time.delayedCall(1500, () => this.cbs.onStageComplete(this.stageId, this.starsCollected));
  }

  private returnToStart(animate: boolean) {
    this.jonahBody.setVelocity(0, 0);
    this.jonahBody.reset(this.startX, this.startY);
    this.idle = true;
    if (animate) {
      this.splashBurst(this.startX, this.startY);
      this.sfxSplash();
      this.tweens.add({ targets: this.jonah, scaleX: 0.8, scaleY: 0.8, yoyo: true, repeat: 1, duration: 130 });
    }
  }

  // ---- juice ----

  private stretchFx() {
    this.tweens.add({ targets: this.jonah, scaleX: 1.25, scaleY: 0.8, yoyo: true, duration: 150 });
  }

  private sparkleBurst(x: number, y: number, count: number) {
    const cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x,
      y,
      speed: { min: 60, max: 240 },
      angle: { min: 200, max: 340 },
      gravityY: 420,
      lifespan: { min: 400, max: 800 },
      scale: { min: 0.3, max: 0.9 },
      tint: [0xffe9a3, 0xffffff, 0xffd76a],
      quantity: count,
      emitting: false,
    };
    const e = this.add.particles(0, 0, this.ensureDot(), cfg);
    e.explode(count, x, y);
    this.time.delayedCall(1600, () => e.destroy());
  }

  private splashBurst(x: number, y: number) {
    const cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x,
      y,
      speed: { min: 100, max: 320 },
      angle: { min: 220, max: 320 },
      gravityY: 900,
      lifespan: { min: 500, max: 1000 },
      scale: { min: 0.4, max: 1.1 },
      alpha: { start: 0.9, end: 0 },
      tint: 0xbfe3ff,
      quantity: 26,
      emitting: false,
    };
    const e = this.add.particles(0, 0, this.ensureDot(), cfg);
    e.explode(26, x, y);
    this.time.delayedCall(1800, () => e.destroy());
  }

  private confettiBurst(x: number, y: number, count: number) {
    const cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x,
      y,
      speed: { min: 160, max: 480 },
      angle: { min: 215, max: 325 },
      gravityY: 620,
      lifespan: { min: 700, max: 1500 },
      scale: { min: 0.4, max: 1.1 },
      tint: [0xff6b6b, 0xffb84d, 0xffe14d, 0x7bd97b, 0x6db8ff, 0x9d7bff],
      quantity: count,
      emitting: false,
    };
    const e = this.add.particles(0, 0, this.ensureDot(), cfg);
    e.explode(count, x, y);
    this.time.delayedCall(2400, () => e.destroy());
  }

  // ---- sound ----

  private ensureAudio() {
    if (!this.audio) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.audio = new Ctor();
    }
    if (this.audio && this.audio.state === "suspended") void this.audio.resume();
  }

  private tone(freq: number, freqEnd: number, dur: number, type: OscillatorType = "sine", vol = 0.08) {
    if (this.muted) return;
    try {
      this.ensureAudio();
      if (!this.audio) return;
      const ctx = this.audio;
      const o = ctx.createOscillator();
      const gain = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(30, freq), ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(gain);
      gain.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur + 0.02);
    } catch {
      /* audio unavailable - game continues silently */
    }
  }

  private sfxFling() {
    this.tone(200, 480, 0.16, "triangle", 0.06);
  }

  private sfxCollect() {
    this.tone(660, 990, 0.12, "triangle", 0.07);
    this.time.delayedCall(90, () => this.tone(990, 1320, 0.16, "triangle", 0.06));
  }

  private sfxSplash() {
    this.tone(500, 180, 0.25, "sine", 0.07);
  }

  private sfxWin() {
    this.tone(523, 523, 0.15, "triangle", 0.07);
    this.time.delayedCall(150, () => this.tone(659, 659, 0.15, "triangle", 0.07));
    this.time.delayedCall(300, () => this.tone(784, 784, 0.2, "triangle", 0.07));
    this.time.delayedCall(480, () => this.tone(1047, 1047, 0.35, "triangle", 0.08));
  }

  // ---- public API ----

  startStage(stageId: number) {
    this.stageId = stageId;
    this.scene.restart({ stage: stageId });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }
}
