import Phaser from "phaser";

export type ArkLevelMode = "day" | "storm" | "flood";

export interface ArkLevelDef {
  name: string;
  subtitle: string;
  baseSpeed: number;
  jumpVelocity: number;
  gravity: number;
  spawnMs: number;
  animalGoal: number;
  skyTop: number;
  skyBottom: number;
  groundColor: number;
  grassColor: number;
  mode: ArkLevelMode;
}

export const ARK_LEVELS: ArkLevelDef[] = [
  {
    name: "The Call",
    subtitle: "Gather the first animal pairs",
    baseSpeed: 215,
    jumpVelocity: -780,
    gravity: 1650,
    spawnMs: 1200,
    animalGoal: 6,
    skyTop: 0x6fc3f2,
    skyBottom: 0xcfeeff,
    groundColor: 0x57a44e,
    grassColor: 0x6fc464,
    mode: "day",
  },
  {
    name: "The Storm",
    subtitle: "Hold on through the rain",
    baseSpeed: 300,
    jumpVelocity: -820,
    gravity: 1750,
    spawnMs: 950,
    animalGoal: 8,
    skyTop: 0x2e3c58,
    skyBottom: 0x61779a,
    groundColor: 0x3f6140,
    grassColor: 0x4f7a4e,
    mode: "storm",
  },
  {
    name: "The Flood",
    subtitle: "Outrun the rising water",
    baseSpeed: 350,
    jumpVelocity: -840,
    gravity: 1850,
    spawnMs: 850,
    animalGoal: 8,
    skyTop: 0x20394f,
    skyBottom: 0x4a708f,
    groundColor: 0x3a5a3a,
    grassColor: 0x4a7048,
    mode: "flood",
  },
];

export interface ArkAdventureCallbacks {
  onReady: () => void;
  onLevelComplete: (levelIndex: number, animalsSaved: number, stars: number, score: number) => void;
  onGameOver: (levelIndex: number, animalsSaved: number) => void;
}

export const ARK_ANIMALS = ["🦁", "🐘", "🦒", "🐒", "🕊️", "🐐", "🦓", "🐰"];
export const ARK_GALLERY_KEY = "ark-gallery";

const ANIMALS = ARK_ANIMALS;
const HAZARDS = ["🪨", "🪵", "🌵"];
const POWERUPS = [
  { emoji: "🛡️", kind: "shield" },
  { emoji: "🧲", kind: "magnet" },
  { emoji: "⏳", kind: "slow" },
];

export function readArkGallery(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ARK_GALLERY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}
const RAINBOW = [0xff6b6b, 0xffb84d, 0xffe14d, 0x7bd97b, 0x6db8ff, 0x9d7bff];

const W = 480;
const H = 800;
const GROUND_H = 90;
const GROUND_TOP = H - GROUND_H;

export class ArkAdventureScene extends Phaser.Scene {
  private cbs: ArkAdventureCallbacks;
  private levelIndex = 1;
  private def: ArkLevelDef = ARK_LEVELS[0];

  private noah!: Phaser.GameObjects.Container;
  private shadow!: Phaser.GameObjects.Ellipse;
  private items!: Phaser.Physics.Arcade.Group;
  private stones: Phaser.GameObjects.Arc[] = [];
  private clouds: Phaser.GameObjects.Text[] = [];

  private hearts = 3;
  private animalsCollected = 0;
  private heartsText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private powerText!: Phaser.GameObjects.Text;
  private lastPowerLine = "";

  private score = 0;
  private combo = 0;
  private comboTimerUntil = 0;
  private shieldActive = false;
  private magnetUntil = 0;
  private slowUntil = 0;
  private shieldAura?: Phaser.GameObjects.Ellipse;

  private spawnEvent?: Phaser.Time.TimerEvent;
  private lightningEvent?: Phaser.Time.TimerEvent;
  private rain?: Phaser.GameObjects.Particles.ParticleEmitter;

  private water?: Phaser.GameObjects.Rectangle;
  private foam?: Phaser.GameObjects.Rectangle;
  private waterWaves: Phaser.GameObjects.Ellipse[] = [];
  private waterTop = H + 40;

  private invulnUntil = 0;
  private airJumps = 0;
  private jumpStartTime = 0;
  private dead = false;
  private finished = false;
  private muted = false;
  private elapsed = 0;
  private worldSpeed = 0;
  private targetSpeed = 0;
  private steerX: number | null = null;
  private keysCursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keysAD?: Record<string, Phaser.Input.Keyboard.Key>;
  private audio?: AudioContext;

  constructor(cbs: ArkAdventureCallbacks) {
    super({ key: "ark-adventure-scene" });
    this.cbs = cbs;
  }

  init(data: { level?: number }) {
    this.levelIndex = data?.level ?? 1;
  }

  create() {
    this.def = ARK_LEVELS[this.levelIndex - 1] ?? ARK_LEVELS[0];
    this.hearts = 3;
    this.animalsCollected = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimerUntil = 0;
    this.shieldActive = false;
    this.magnetUntil = 0;
    this.slowUntil = 0;
    this.lastPowerLine = "";
    this.removeShieldAura();
    this.invulnUntil = 0;
    this.airJumps = 0;
    this.dead = false;
    this.finished = false;
    this.elapsed = 0;
    this.worldSpeed = 0;
    this.targetSpeed = 0;
    this.waterTop = H + 40;
    this.stones = [];
    this.clouds = [];
    this.waterWaves = [];

    this.physics.world.gravity.y = this.def.gravity;
    this.cameras.main.setBackgroundColor(this.def.skyTop);

    this.buildWorld();
    this.buildNoah();
    this.buildHud();
    this.buildEffects();
    this.showIntro();

    this.items = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.noah, this.items, (_n, item) => {
      this.onTouch(item as Phaser.GameObjects.Text);
    });

    this.spawnEvent = this.time.addEvent({
      delay: this.def.spawnMs,
      loop: true,
      callback: () => this.spawnItem(),
    });

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.steerX = p.x;
      this.tryJump();
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.steerX = p.x;
    });
    this.input.on("pointerup", () => {
      this.steerX = null;
      // Variable jump height: only cut the arc when the tap was held down.
      if (this.time.now - this.jumpStartTime < 100) return;
      const b = this.noah.body as Phaser.Physics.Arcade.Body;
      if (b.velocity.y < -260) b.setVelocityY(-260);
    });
    this.input.keyboard?.on("keydown-SPACE", () => this.tryJump());
    this.input.keyboard?.on("keydown-UP", () => this.tryJump());
    this.input.keyboard?.on("keydown-W", () => this.tryJump());
    this.keysCursors = this.input.keyboard?.createCursorKeys();
    this.keysAD = this.input.keyboard?.addKeys("A,D") as Record<string, Phaser.Input.Keyboard.Key>;

    this.cbs.onReady();
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta, 33);
    this.elapsed += dt;

    this.targetSpeed = this.dead || this.finished
      ? 0
      : Math.min(this.def.baseSpeed * 1.25, this.def.baseSpeed + this.elapsed * 3.5);
    this.worldSpeed = Phaser.Math.Linear(this.worldSpeed, this.targetSpeed, 0.055);
    const slowFactor = this.time.now < this.slowUntil ? 0.55 : 1;
    const px = (this.worldSpeed * slowFactor * dt) / 1000;

    this.stones.forEach((s) => {
      s.y += px;
      if (s.y > H + 20) {
        s.y = GROUND_TOP + 12;
        s.x = Phaser.Math.Between(20, W - 20);
      }
    });

    this.clouds.forEach((c) => {
      const depth = (c.getData("depth") as number) ?? 0.4;
      c.y += px * depth + (12 * dt) / 1000;
      if (c.y > H + 70) {
        c.y = -70;
        c.x = Phaser.Math.Between(20, W - 140);
      }
    });

    const magnetOn = this.time.now < this.magnetUntil;
    (this.items.getChildren() as Phaser.GameObjects.Text[]).forEach((t) => {
      const b = t.body as Phaser.Physics.Arcade.Body;
      b.setVelocityY(this.worldSpeed);
      if (magnetOn && t.getData("kind") === "animal" && Math.abs(t.x - this.noah.x) < 300) {
        t.x = Phaser.Math.Linear(t.x, this.noah.x, 0.08);
      }
      if (t.y > H + 80) t.destroy();
    });

    if (this.shieldAura) {
      this.shieldAura.x = this.noah.x;
      this.shieldAura.y = this.noah.y - 4;
      this.shieldAura.setAlpha(0.3 + Math.sin(this.time.now / 160) * 0.16);
    }

    if (this.combo > 0 && this.time.now > this.comboTimerUntil) {
      this.combo = 0;
      this.updateHud();
    }
    this.updatePowerHud();

    this.shadow.x = this.noah.x;
    const airHeight = GROUND_TOP - 37 - this.noah.y;
    const shScale = Math.max(0.35, 1 - airHeight / 420);
    this.shadow.setScale(shScale, shScale);
    this.shadow.setAlpha(0.25 * shScale);

    // horizontal control: slide on touch, arrows / A-D on keyboard
    if (!this.dead && !this.finished) {
      const b = this.noah.body as Phaser.Physics.Arcade.Body;
      const left = this.keysCursors?.left.isDown || this.keysAD?.A.isDown;
      const right = this.keysCursors?.right.isDown || this.keysAD?.D.isDown;
      let vx = 0;
      if (left) vx = -320;
      else if (right) vx = 320;
      else if (this.steerX !== null) vx = Phaser.Math.Clamp((this.steerX - this.noah.x) * 7, -460, 460);
      b.setVelocityX(vx);
    }

    this.updateFlood(dt);
  }

  // ---- world & actors ----

  private buildWorld() {
    this.add.rectangle(W / 2, H / 2, W, H, this.def.skyTop).setDepth(0);
    this.add.rectangle(W / 2, H * 0.62, W, H * 0.76, this.def.skyBottom, 0.75).setDepth(0);

    // sun / moon
    const celestial = this.def.mode === "day" ? "☀️" : "🌙";
    const orb = this.add.text(W - 74, 74, celestial, { fontSize: "58px" }).setDepth(0);
    this.tweens.add({ targets: orb, y: 64, yoyo: true, repeat: -1, duration: 1600, ease: "Sine.easeInOut" });

    // ground
    this.add.rectangle(W / 2, GROUND_TOP + GROUND_H / 2, W, GROUND_H, this.def.groundColor).setDepth(1);
    this.add.rectangle(W / 2, GROUND_TOP + 5, W, 10, this.def.grassColor).setDepth(2);

    const groundStatic = this.add.rectangle(W / 2, GROUND_TOP + GROUND_H / 2, W, GROUND_H, 0x000000, 0);
    this.physics.add.existing(groundStatic, true);

    // scrolling stones on the ground band
    for (let i = 0; i < 8; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(GROUND_TOP + 16, H - 10),
        Phaser.Math.Between(3, 6),
        0x000000,
        0.12
      );
      s.setDepth(2);
      this.stones.push(s);
    }

    // parallax clouds
    const stormy = this.def.mode !== "day";
    for (let i = 0; i < 6; i++) {
      const depth = 0.25 + Math.random() * 0.5;
      const cloud = this.add
        .text(Phaser.Math.Between(20, W - 120), Phaser.Math.Between(30, H - 160), "☁️", {
          fontSize: `${Math.round(30 + depth * 56)}px`,
        })
        .setAlpha(stormy ? 0.45 : 0.55 + depth * 0.3)
        .setDepth(0);
      cloud.setData("depth", depth);
      this.clouds.push(cloud);
    }

    this.noah = this.buildNoah();
    this.shadow = this.add.ellipse(W / 2, GROUND_TOP + 12, 46, 13, 0x000000, 0.25).setDepth(3);

    const g = groundStatic;
    this.physics.add.collider(this.noah, g);
  }

  private buildNoah(): Phaser.GameObjects.Container {
    const c = this.add.container(W / 2, GROUND_TOP - 37).setDepth(5);
    const staff = this.add.rectangle(20, -4, 5, 56, 0x9c7a44);
    const staffTop = this.add.circle(20, -33, 4, 0x9c7a44);
    const armR = this.add.rectangle(20, 10, 7, 16, 0x8a5a2f);
    const armL = this.add.rectangle(-16, 7, 7, 19, 0x8a5a2f);
    const robe = this.add.rectangle(0, 8, 38, 46, 0x8a5a2f).setStrokeStyle(3, 0x6b4423);
    const hood = this.add.circle(0, -20, 16, 0x8a5a2f).setStrokeStyle(3, 0x6b4423);
    const hoodTip = this.add.rectangle(0, -34, 5, 12, 0x8a5a2f);
    c.add([staff, staffTop, armR, armL, robe, hood, hoodTip]);

    this.physics.add.existing(c);
    const body = c.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 78);
    body.setOffset(-20, -39);
    // side walls via world bounds (jumps never reach the top edge)
    body.setCollideWorldBounds(true);
    return c;
  }

  private buildHud() {
    this.heartsText = this.add.text(16, 12, "", { fontSize: "30px" }).setDepth(10);
    this.progressText = this.add
      .text(W - 16, 14, `🐾 ${this.animalsCollected}/${this.def.animalGoal}`, { fontSize: "26px" })
      .setOrigin(1, 0)
      .setDepth(10);
    this.add
      .text(W / 2, 14, `Level ${this.levelIndex} — ${this.def.name}`, {
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#00000088",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.scoreText = this.add
      .text(W / 2, 42, "0", {
        fontSize: "38px",
        color: "#ffffff",
        stroke: "#000000aa",
        strokeThickness: 6,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.comboText = this.add
      .text(W / 2, 88, "", { fontSize: "22px", color: "#ffd76a", stroke: "#000000aa", strokeThickness: 5, fontStyle: "bold" })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.powerText = this.add
      .text(W / 2, 116, "", { fontSize: "26px" })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setVisible(false);
    this.updateHud();
  }

  private updateHud() {
    const left = Math.max(0, this.hearts);
    const heartsLine = "❤️".repeat(left) + "🖤".repeat(3 - left);
    if (this.heartsText.text !== heartsLine) this.heartsText.setText(heartsLine);
    const progressLine = `🐾 ${this.animalsCollected}/${this.def.animalGoal}`;
    if (this.progressText.text !== progressLine) this.progressText.setText(progressLine);
    const scoreLine = String(this.score);
    if (this.scoreText.text !== scoreLine) this.scoreText.setText(scoreLine);
    const comboLine = this.combo > 1 ? `x${this.combo} COMBO!` : "";
    if (this.comboText.text !== comboLine) this.comboText.setText(comboLine);
  }

  private updatePowerHud() {
    const now = this.time.now;
    const parts: string[] = [];
    if (this.shieldActive) parts.push("🛡️");
    if (now < this.magnetUntil) parts.push("🧲");
    if (now < this.slowUntil) parts.push("⏳");
    const line = parts.join(" ");
    if (line !== this.lastPowerLine) {
      this.lastPowerLine = line;
      this.powerText.setText(line);
      this.powerText.setVisible(line !== "");
    }
  }

  private buildEffects() {
    if (!this.textures.exists("dot")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 3);
      g.generateTexture("dot", 6, 6);
      g.destroy();
    }

    if (this.def.mode !== "day") {
      const rainCfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
        x: 0,
        y: 0,
        emitZone: { type: "random", source: new Phaser.Geom.Rectangle(0, -20, W, 20) },
        speedY: { min: 520, max: 760 },
        lifespan: 900,
        quantity: 2,
        frequency: 35,
        scale: { min: 0.8, max: 1.6 },
        alpha: { start: 0.5, end: 0.12 },
        tint: 0x9ec9ff,
      };
      this.rain = this.add.particles(0, 0, "dot", rainCfg).setDepth(4);
    }

    if (this.def.mode === "storm") {
      this.lightningEvent = this.time.addEvent({
        delay: 3200,
        loop: true,
        callback: () => this.lightningFlash(),
      });
    }

    if (this.def.mode === "flood") {
      this.water = this.add.rectangle(W / 2, this.waterTop + 140, W, 300, 0x1c5f95, 0.92).setDepth(6);
      this.foam = this.add.rectangle(W / 2, this.waterTop + 5, W, 10, 0xbfe3ff, 0.85).setDepth(7);
      for (let i = 0; i < 3; i++) {
        const wave = this.add.ellipse(
          60 + i * 180,
          this.waterTop + 2,
          Phaser.Math.Between(40, 70),
          8,
          0xffffff,
          0.5
        );
        wave.setDepth(7);
        this.waterWaves.push(wave);
      }
    }
  }

  private showIntro() {
    const intro = this.add
      .text(W / 2, H * 0.42, `Level ${this.levelIndex} — ${this.def.name}\n${this.def.subtitle}\nSlide or ◀ ▶ to move · tap to jump`, {
        fontSize: "34px",
        color: "#ffffff",
        stroke: "#000000aa",
        strokeThickness: 6,
        align: "center",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: intro, alpha: 0, delay: 1900, duration: 500, onComplete: () => intro.destroy() });
  }

  // ---- gameplay ----

  private spawnItem() {
    if (this.dead || this.finished) return;
    const roll = Math.random();
    const noActivePower = !this.shieldActive && this.time.now >= this.magnetUntil && this.time.now >= this.slowUntil;
    const wantPower = noActivePower && roll < 0.14;
    const wantAnimal = !wantPower && this.animalsCollected < this.def.animalGoal && roll < 0.62;
    let emoji: string;
    let kind: string;
    let powerKind = "";
    if (wantPower) {
      const p = POWERUPS[Phaser.Math.Between(0, POWERUPS.length - 1)];
      emoji = p.emoji;
      kind = "power";
      powerKind = p.kind;
    } else {
      kind = wantAnimal ? "animal" : "hazard";
      emoji = wantAnimal
        ? ANIMALS[Phaser.Math.Between(0, ANIMALS.length - 1)]
        : HAZARDS[Phaser.Math.Between(0, HAZARDS.length - 1)];
    }
    const x = Phaser.Math.Between(50, W - 50);
    const t = this.add.text(x, -70, emoji, { fontSize: "54px" }).setDepth(4);
    if (kind === "power") t.setOrigin(0.5);
    this.physics.add.existing(t);
    const body = t.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(48, 48);
    body.setOffset((t.width - 48) / 2, (t.height - 48) / 2);
    t.setData("kind", kind);
    if (kind === "power") t.setData("power", powerKind);
    if (wantAnimal) {
      this.tweens.add({ targets: t, scaleX: 1.1, scaleY: 1.1, yoyo: true, repeat: -1, duration: 320 });
    }
    if (kind === "power") {
      this.tweens.add({ targets: t, angle: 14, yoyo: true, repeat: -1, duration: 280, ease: "Sine.easeInOut" });
    }
    this.items.add(t);
  }

  private tryJump() {
    if (this.dead || this.finished) return;
    const body = this.noah.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) {
      this.jumpStartTime = this.time.now;
      body.setVelocityY(this.def.jumpVelocity);
      this.airJumps = 1;
      this.noah.setScale(1, 0.82);
      this.tweens.add({ targets: this.noah, scaleX: 1, scaleY: 1, duration: 190 });
      this.sfxJump();
    } else if (this.airJumps > 0) {
      this.jumpStartTime = this.time.now;
      this.airJumps -= 1;
      body.setVelocityY(this.def.jumpVelocity * 0.9);
      this.noah.setScale(0.9, 1.08);
      this.tweens.add({ targets: this.noah, scaleX: 1, scaleY: 1, duration: 190 });
      this.sparkleBurst(this.noah.x, this.noah.y + 20, 10);
      this.sfxJump();
    }
  }

  private onTouch(item: Phaser.GameObjects.Text) {
    if (this.dead || this.finished) return;
    const kind = item.getData("kind") as string;
    const powerKind = (item.getData("power") as string) ?? "";
    const emoji = item.text;
    const { x, y } = item;
    item.destroy();
    if (kind === "animal") {
      this.animalsCollected += 1;
      this.combo = this.time.now < this.comboTimerUntil ? Math.min(5, this.combo + 1) : 1;
      this.comboTimerUntil = this.time.now + 2200;
      const points = 10 * this.combo;
      this.score += points;
      this.updateHud();
      this.comboPopup(x, y, points);
      this.sparkleBurst(x, y, 16);
      this.sfxCollect();
      this.addGalleryAnimal(emoji);
      if (this.animalsCollected >= this.def.animalGoal) this.finishLevel();
    } else if (kind === "power") {
      this.applyPower(powerKind);
      this.sparkleBurst(x, y, 20);
      this.sfxPower();
    } else if (this.time.now > this.invulnUntil) {
      this.hit();
    }
  }

  private hit() {
    if (this.shieldActive) {
      this.shieldActive = false;
      this.removeShieldAura();
      this.combo = 0;
      this.invulnUntil = this.time.now + 900;
      this.updateHud();
      this.flashFx(0x66e0ff, 0.28);
      this.sfxShieldBreak();
      return;
    }
    this.hearts -= 1;
    this.combo = 0;
    this.updateHud();
    this.invulnUntil = this.time.now + 1400;
    this.cameras.main.shake(180, 0.008);
    this.flashFx(0xff3b30, 0.32);
    this.tweens.add({ targets: this.noah, alpha: 0.35, yoyo: true, repeat: 5, duration: 90 });
    this.sfxHit();
    if (this.hearts <= 0) this.die();
  }

  private die() {
    if (this.dead) return;
    this.dead = true;
    this.spawnEvent?.remove();
    this.rain?.stop();
    this.lightningEvent?.remove();
    this.flashFx(0xff3b30, 0.5);
    this.cameras.main.shake(400, 0.012);
    this.tweens.add({ targets: this.noah, angle: 95, y: this.noah.y + 26, duration: 420 });
    this.sfxDie();
    this.time.delayedCall(1500, () => this.cbs.onGameOver(this.levelIndex, this.animalsCollected));
  }

  private finishLevel() {
    if (this.finished) return;
    this.finished = true;
    this.spawnEvent?.remove();
    this.rain?.stop();
    this.lightningEvent?.remove();
    this.sfxWin();
    this.celebrate();
    this.time.delayedCall(1900, () =>
      this.cbs.onLevelComplete(this.levelIndex, this.animalsCollected, Math.max(1, this.hearts), this.score)
    );
  }

  private comboPopup(x: number, y: number, points: number) {
    const pop = this.add
      .text(x, y - 26, `+${points}`, {
        fontSize: this.combo > 1 ? "30px" : "24px",
        color: this.combo > 1 ? "#ffd76a" : "#ffffff",
        stroke: "#00000088",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.tweens.add({ targets: pop, y: y - 92, alpha: 0, duration: 750, onComplete: () => pop.destroy() });
  }

  private applyPower(power: string) {
    if (power === "shield") {
      this.shieldActive = true;
      this.removeShieldAura();
      this.shieldAura = this.add
        .ellipse(this.noah.x, this.noah.y - 4, 76, 76, 0x66e0ff, 0.3)
        .setStrokeStyle(3, 0x66e0ff, 0.8)
        .setDepth(4);
    } else if (power === "magnet") {
      this.magnetUntil = this.time.now + 6000;
    } else if (power === "slow") {
      this.slowUntil = this.time.now + 6000;
    }
    this.updatePowerHud();
  }

  private removeShieldAura() {
    if (this.shieldAura) {
      this.shieldAura.destroy();
      this.shieldAura = undefined;
    }
  }

  private addGalleryAnimal(emoji: string) {
    try {
      const gallery = readArkGallery();
      gallery[emoji] = (Number(gallery[emoji]) || 0) + 1;
      localStorage.setItem(ARK_GALLERY_KEY, JSON.stringify(gallery));
    } catch {
      /* storage unavailable */
    }
  }

  private celebrate() {
    const cx = W / 2;
    const ark = this.add.container(cx, -170).setDepth(8);
    const hull = this.add.rectangle(0, 0, 96, 44, 0x8a5a2f).setStrokeStyle(3, 0x5e3c1e);
    const deck = this.add.rectangle(0, -20, 104, 10, 0xa06a35);
    const cabin = this.add.rectangle(-14, -42, 34, 30, 0xa06a35).setStrokeStyle(3, 0x5e3c1e);
    const roof = this.add.rectangle(-14, -62, 44, 12, 0x6b4423);
    const dove = this.add.text(2, -74, "🕊️", { fontSize: "30px" });
    ark.add([hull, deck, cabin, roof, dove]);
    this.tweens.add({ targets: ark, y: GROUND_TOP - 58, duration: 950, ease: "Sine.easeOut" });

    const body = this.noah.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-460);
    this.noah.setScale(1, 0.85);
    this.tweens.add({ targets: this.noah, scaleX: 1, scaleY: 1, duration: 220 });

    if (this.def.mode === "flood") this.showRainbow();

    this.confettiBurst(cx, 220, 70);
    this.time.delayedCall(600, () => this.confettiBurst(110, 130, 40));
  }

  private showRainbow() {
    const g = this.add.graphics().setDepth(9);
    RAINBOW.forEach((color, i) => {
      g.lineStyle(9, color, 0.9);
      g.beginPath();
      g.arc(W / 2, 96, 62 + i * 14, Math.PI, Math.PI * 2);
      g.strokePath();
    });
    const msg = this.add
      .text(W / 2, 170, "THE RAINBOW!", {
        fontSize: "30px",
        color: "#ffffff",
        stroke: "#000000aa",
        strokeThickness: 6,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(9)
      .setScale(0.3);
    this.tweens.add({ targets: msg, scaleX: 1, scaleY: 1, duration: 500, ease: "Back.easeOut" });
  }

  private updateFlood(dt: number) {
    if (this.def.mode !== "flood") return;
    const rising = !this.dead && !this.finished && this.elapsed > 2600;
    if (rising) {
      const rise = Math.min(16, 6 + this.elapsed * 0.03);
      this.waterTop -= (rise * dt) / 1000;
    }
    if (this.water && this.foam) {
      this.water.y = this.waterTop + 140;
      this.foam.y = this.waterTop + 5;
    }
    this.waterWaves.forEach((wave, i) => {
      wave.y = this.waterTop + 2 + Math.sin(this.time.now / 380 + i * 2) * 4;
    });
    const body = this.noah.body as Phaser.Physics.Arcade.Body;
    if (
      this.waterTop < this.noah.y + 26 &&
      this.time.now > this.invulnUntil &&
      !this.dead &&
      !this.finished
    ) {
      this.hit();
      this.waterTop = this.noah.y + 240;
      body.setVelocityY(-560);
      this.airJumps = 1;
      this.flashFx(0x66ccff, 0.28);
    }
  }

  // ---- juice ----

  private flashFx(color: number, alpha: number) {
    const f = this.add.rectangle(W / 2, H / 2, W, H, color, alpha).setDepth(50);
    this.tweens.add({ targets: f, alpha: 0, duration: 260, onComplete: () => f.destroy() });
  }

  private lightningFlash() {
    this.flashFx(0xffffff, 0.3);
    this.sfxThunder();
  }

  private sparkleBurst(x: number, y: number, count: number) {
    const cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x,
      y,
      speed: { min: 60, max: 260 },
      angle: { min: 200, max: 340 },
      gravityY: 420,
      lifespan: { min: 400, max: 800 },
      scale: { min: 0.3, max: 0.9 },
      tint: [0xffe9a3, 0xffffff, 0xffd76a],
      quantity: count,
      emitting: false,
    };
    const e = this.add.particles(0, 0, "dot", cfg);
    e.explode(count, x, y);
    this.time.delayedCall(1600, () => e.destroy());
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
      tint: RAINBOW,
      quantity: count,
      emitting: false,
    };
    const e = this.add.particles(0, 0, "dot", cfg);
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

  private sfxJump() {
    this.tone(300, 620, 0.14, "triangle", 0.06);
  }

  private sfxCollect() {
    this.tone(660, 990, 0.12, "triangle", 0.07);
    this.time.delayedCall(90, () => this.tone(990, 1320, 0.16, "triangle", 0.06));
  }

  private sfxHit() {
    this.tone(200, 60, 0.3, "sawtooth", 0.09);
  }

  private sfxDie() {
    this.tone(300, 50, 0.6, "sawtooth", 0.1);
  }

  private sfxThunder() {
    this.tone(90, 35, 0.5, "sawtooth", 0.05);
  }

  private sfxWin() {
    this.tone(523, 523, 0.15, "triangle", 0.07);
    this.time.delayedCall(150, () => this.tone(659, 659, 0.15, "triangle", 0.07));
    this.time.delayedCall(300, () => this.tone(784, 784, 0.2, "triangle", 0.07));
    this.time.delayedCall(480, () => this.tone(1047, 1047, 0.35, "triangle", 0.08));
  }

  private sfxPower() {
    this.tone(520, 1040, 0.2, "triangle", 0.07);
  }

  private sfxShieldBreak() {
    this.tone(700, 180, 0.22, "square", 0.06);
  }

  // ---- public API for the React wrapper ----

  startLevel(level: number) {
    this.levelIndex = level;
    this.scene.restart({ level });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }
}
