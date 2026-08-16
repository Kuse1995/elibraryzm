import Phaser from "phaser";

export type JonahLevelMode = "storm" | "belly" | "shore";

export interface JonahLevelDef {
  name: string;
  subtitle: string;
  baseSpeed: number;
  spawnMs: number;
  fishGoal: number;
  waterTop: number;
  waterDeep: number;
  groundColor: number;
  mode: JonahLevelMode;
}

export const JONAH_LEVELS: JonahLevelDef[] = [
  {
    name: "The Storm",
    subtitle: "Swim through the raging sea",
    baseSpeed: 200,
    spawnMs: 1250,
    fishGoal: 6,
    waterTop: 0x17556e,
    waterDeep: 0x0f3a4c,
    groundColor: 0x2a5d73,
    mode: "storm",
  },
  {
    name: "The Belly",
    subtitle: "Escape the whale's belly",
    baseSpeed: 260,
    spawnMs: 1000,
    fishGoal: 8,
    waterTop: 0x6e3a5e,
    waterDeep: 0x4a2640,
    groundColor: 0x5a3050,
    mode: "belly",
  },
  {
    name: "Nineveh",
    subtitle: "Delivered to the shore",
    baseSpeed: 300,
    spawnMs: 900,
    fishGoal: 8,
    waterTop: 0x1e7fb0,
    waterDeep: 0x14607f,
    groundColor: 0xd9c07a,
    mode: "shore",
  },
];

export interface JonahAdventureCallbacks {
  onReady: () => void;
  onLevelComplete: (levelIndex: number, fishSaved: number) => void;
  onGameOver: (levelIndex: number, fishSaved: number) => void;
}

const HAZARDS_BY_MODE: Record<JonahLevelMode, string[]> = {
  storm: ["🪨", "🌿", "jelly"],
  belly: ["📦", "🪵", "jelly"],
  shore: ["🪨", "🌿", "jelly"],
};

const W = 480;
const H = 800;
const GROUND_H = 90;
const GROUND_TOP = H - GROUND_H;
const TOP_CLAMP = 150;

export class JonahAdventureScene extends Phaser.Scene {
  private cbs: JonahAdventureCallbacks;
  private levelIndex = 1;
  private def: JonahLevelDef = JONAH_LEVELS[0];

  private jonah!: Phaser.GameObjects.Container;
  private shadow!: Phaser.GameObjects.Ellipse;
  private items!: Phaser.Physics.Arcade.Group;
  private stones: Phaser.GameObjects.Arc[] = [];
  private bubbles: Phaser.GameObjects.Arc[] = [];

  private hearts = 3;
  private fishSaved = 0;
  private heartsText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;

  private spawnEvent?: Phaser.Time.TimerEvent;
  private lightningEvent?: Phaser.Time.TimerEvent;
  private bubbleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private spoutEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  private holding = false;
  private invulnUntil = 0;
  private dead = false;
  private finished = false;
  private muted = false;
  private elapsed = 0;
  private worldSpeed = 0;
  private targetSpeed = 0;
  private audio?: AudioContext;

  constructor(cbs: JonahAdventureCallbacks) {
    super({ key: "jonah-adventure-scene" });
    this.cbs = cbs;
  }

  init(data: { level?: number }) {
    this.levelIndex = data?.level ?? 1;
  }

  create() {
    this.def = JONAH_LEVELS[this.levelIndex - 1] ?? JONAH_LEVELS[0];
    this.hearts = 3;
    this.fishSaved = 0;
    this.invulnUntil = 0;
    this.dead = false;
    this.finished = false;
    this.holding = false;
    this.elapsed = 0;
    this.worldSpeed = 0;
    this.targetSpeed = 0;
    this.stones = [];
    this.bubbles = [];

    this.cameras.main.setBackgroundColor(this.def.waterTop);

    this.buildWorld();
    this.buildJonah();
    this.buildHud();
    this.buildEffects();
    this.showIntro();

    this.items = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.jonah, this.items, (_j, item) => {
      this.onTouch(item as Phaser.GameObjects.Text | Phaser.GameObjects.Container);
    });

    this.spawnEvent = this.time.addEvent({
      delay: this.def.spawnMs,
      loop: true,
      callback: () => this.spawnItem(),
    });

    this.input.on("pointerdown", () => {
      this.holding = true;
      this.sfxSwim();
    });
    this.input.on("pointerup", () => (this.holding = false));
    this.input.on("pointerupoutside", () => (this.holding = false));
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.holding = true;
      this.sfxSwim();
    });
    this.input.keyboard?.on("keydown-UP", () => {
      this.holding = true;
      this.sfxSwim();
    });
    this.input.keyboard?.on("keydown-W", () => {
      this.holding = true;
      this.sfxSwim();
    });
    this.input.keyboard?.on("keyup-SPACE", () => (this.holding = false));
    this.input.keyboard?.on("keyup-UP", () => (this.holding = false));
    this.input.keyboard?.on("keyup-W", () => (this.holding = false));

    this.cbs.onReady();
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta, 33);
    this.elapsed += dt;

    this.targetSpeed = this.dead || this.finished
      ? 0
      : Math.min(this.def.baseSpeed * 1.25, this.def.baseSpeed + this.elapsed * 3.2);
    this.worldSpeed = Phaser.Math.Linear(this.worldSpeed, this.targetSpeed, 0.055);
    const px = (this.worldSpeed * dt) / 1000;

    // Jonah swim physics: hold to rise, release to sink.
    if (!this.dead && !this.finished) {
      const body = this.jonah.body as Phaser.Physics.Arcade.Body;
      const target = this.holding ? -330 : 230;
      body.setVelocityY(Phaser.Math.Linear(body.velocity.y, target, 0.12));
      if (this.jonah.y < TOP_CLAMP) {
        this.jonah.y = TOP_CLAMP;
        body.setVelocityY(0);
      }
      this.jonah.setRotation(Phaser.Math.Clamp(body.velocity.y * -0.0006, -0.35, 0.35));
    }

    this.stones.forEach((s) => {
      s.y += px;
      if (s.y > H + 20) {
        s.y = GROUND_TOP + 12;
        s.x = Phaser.Math.Between(20, W - 20);
      }
    });

    this.bubbles.forEach((b) => {
      b.y += px + (26 * dt) / 1000;
      b.x += Math.sin((this.time.now + b.getData("seed")) / 320) * 0.4;
      if (b.y > H + 30) {
        b.y = Phaser.Math.Between(TOP_CLAMP, GROUND_TOP - 60);
        b.x = Phaser.Math.Between(20, W - 20);
      }
    });

    (this.items.getChildren() as (Phaser.GameObjects.Text | Phaser.GameObjects.Container)[]).forEach((t) => {
      const body = t.body as Phaser.Physics.Arcade.Body;
      body.setVelocityY(this.worldSpeed);
      const jelly = t.getData("jelly") as number | undefined;
      if (jelly !== undefined) {
        t.x = t.getData("baseX") + Math.sin((this.time.now + jelly) / 300) * 44;
      }
      if (t.y > H + 100) t.destroy();
    });

    this.shadow.x = this.jonah.x;
    const airHeight = GROUND_TOP - 37 - this.jonah.y;
    const shScale = Math.max(0.35, 1 - airHeight / 420);
    this.shadow.setScale(shScale, shScale);
    this.shadow.setAlpha(0.25 * shScale);

    if (this.bubbleEmitter) {
      this.bubbleEmitter.setPosition(this.jonah.x, this.jonah.y + 26);
      const body = this.jonah.body as Phaser.Physics.Arcade.Body;
      this.bubbleEmitter.emitting = !this.dead && !this.finished && body.velocity.y < -40;
    }
  }

  // ---- world & actors ----

  private buildWorld() {
    this.add.rectangle(W / 2, H / 2, W, H, this.def.waterTop).setDepth(0);
    this.add.rectangle(W / 2, H * 0.6, W, H * 0.8, this.def.waterDeep, 0.6).setDepth(0);

    if (this.def.mode === "storm") this.buildStormSurface();
    if (this.def.mode === "belly") this.buildBellyWalls();
    if (this.def.mode === "shore") this.buildShoreDecor();

    this.add.rectangle(W / 2, GROUND_TOP + GROUND_H / 2, W, GROUND_H, this.def.groundColor).setDepth(1);
    this.add.rectangle(W / 2, GROUND_TOP + 4, W, 8, 0xffffff, 0.12).setDepth(2);

    const groundStatic = this.add.rectangle(W / 2, GROUND_TOP + GROUND_H / 2, W, GROUND_H, 0x000000, 0);
    this.physics.add.existing(groundStatic, true);

    for (let i = 0; i < 8; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(GROUND_TOP + 14, H - 10),
        Phaser.Math.Between(3, 6),
        0x000000,
        0.14
      );
      s.setDepth(2);
      this.stones.push(s);
    }

    // ambient bubbles
    for (let i = 0; i < 10; i++) {
      const b = this.add.circle(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(TOP_CLAMP, GROUND_TOP - 40),
        Phaser.Math.Between(2, 5),
        0xffffff,
        0.18
      );
      b.setData("seed", Phaser.Math.Between(0, 1000));
      b.setDepth(2);
      this.bubbles.push(b);
    }

    this.jonah = this.buildJonah();
    this.shadow = this.add.ellipse(W / 2, GROUND_TOP + 12, 46, 13, 0x000000, 0.25).setDepth(3);
    this.physics.add.collider(this.jonah, groundStatic);
  }

  private buildStormSurface() {
    this.add.rectangle(W / 2, 45, W, 90, 0x2e6d8f).setDepth(6);
    const waveCrests: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 8; i++) {
      const crest = this.add.arc(20 + i * 66, 88, 26, Math.PI, Math.PI * 2, false, 0xd8f0ff, 0.85);
      crest.setDepth(7);
      waveCrests.push(crest);
    }
    this.tweens.addCounter({
      from: 0,
      to: 66,
      duration: 1400,
      repeat: -1,
      onUpdate: (tw) => {
        waveCrests.forEach((c, i) => {
          const base = 20 + i * 66;
          c.x = ((base + tw.getValue()) % W) - 26;
        });
      },
    });
    this.lightningEvent = this.time.addEvent({
      delay: 3600,
      loop: true,
      callback: () => this.lightningFlash(),
    });
  }

  private buildBellyWalls() {
    const rib = (x: number) => {
      this.add.rectangle(x, H / 2, 34, H, 0x8a4a72).setDepth(1);
      this.add.rectangle(x, H / 2, 8, H, 0x5a3050, 0.8).setDepth(1);
    };
    rib(16);
    rib(W - 16);
    this.add
      .text(W / 2, 130, "🫧", { fontSize: "40px" })
      .setDepth(2)
      .setAlpha(0.5);
  }

  private buildShoreDecor() {
    const coral = (x: number, color: number, size: number) => {
      const c = this.add.container(x, GROUND_TOP - size / 2);
      const stem = this.add.rectangle(0, 0, 8, size, color);
      const branches = [
        this.add.rectangle(-8, -size / 4, 8, size / 2, color),
        this.add.rectangle(8, -size / 5, 8, size / 2.4, color),
      ];
      c.add([stem, branches[0], branches[1]]);
      c.setDepth(2);
      this.tweens.add({ targets: branches, rotation: 0.06, yoyo: true, repeat: -1, duration: 900, ease: "Sine.easeInOut" });
    };
    coral(60, 0xe86f9e, 70);
    coral(W - 60, 0x7bd97b, 84);
    const sun = this.add.text(70, 110, "☀️", { fontSize: "52px" }).setDepth(0).setAlpha(0.9);
    this.tweens.add({ targets: sun, y: 100, yoyo: true, repeat: -1, duration: 1800, ease: "Sine.easeInOut" });
  }

  private buildJonah(): Phaser.GameObjects.Container {
    const c = this.add.container(W / 2, GROUND_TOP - 37).setDepth(5);
    const robe = this.add.rectangle(0, 8, 36, 44, 0xd97b3f).setStrokeStyle(3, 0xa85a26);
    const belt = this.add.rectangle(0, 2, 38, 6, 0x8a5a2f);
    const armL = this.add.rectangle(-22, -2, 7, 18, 0xd97b3f).setAngle(24);
    const armR = this.add.rectangle(22, -2, 7, 18, 0xd97b3f).setAngle(-24);
    const head = this.add.circle(0, -24, 13, 0xf2c194);
    const beard = this.add.ellipse(0, -17, 18, 14, 0xf5f5f5);
    const eyeL = this.add.circle(-4, -26, 2, 0x222222);
    const eyeR = this.add.circle(4, -26, 2, 0x222222);
    const mouth = this.add.arc(0, -20, 6, 0.2, Math.PI - 0.2, false, 0x8a5a2f);
    c.add([robe, belt, armL, armR, head, beard, eyeL, eyeR, mouth]);

    this.physics.add.existing(c);
    const body = c.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 78);
    body.setOffset(-20, -39);
    body.setAllowGravity(false);
    return c;
  }

  private buildHud() {
    this.heartsText = this.add.text(16, 12, "", { fontSize: "30px" }).setDepth(10);
    this.progressText = this.add
      .text(W - 16, 14, `🐟 ${this.fishSaved}/${this.def.fishGoal}`, { fontSize: "26px" })
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
    this.updateHud();
  }

  private updateHud() {
    const left = Math.max(0, this.hearts);
    this.heartsText.setText("❤️".repeat(left) + "🖤".repeat(3 - left));
    this.progressText.setText(`🐟 ${this.fishSaved}/${this.def.fishGoal}`);
  }

  private buildEffects() {
    if (!this.textures.exists("dot")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 3);
      g.generateTexture("dot", 6, 6);
      g.destroy();
    }
    const bubbleCfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: W / 2,
      y: GROUND_TOP - 60,
      speed: { min: 20, max: 70 },
      angle: { min: 240, max: 300 },
      lifespan: { min: 500, max: 1100 },
      scale: { min: 0.3, max: 0.9 },
      alpha: { start: 0.5, end: 0 },
      tint: 0xffffff,
      quantity: 2,
      frequency: 60,
      emitting: false,
    };
    this.bubbleEmitter = this.add.particles(0, 0, "dot", bubbleCfg).setDepth(4);
  }

  private showIntro() {
    const intro = this.add
      .text(W / 2, H * 0.42, `Level ${this.levelIndex} — ${this.def.name}\n${this.def.subtitle}`, {
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
    const wantFish = this.fishSaved < this.def.fishGoal && Math.random() < 0.58;
    const minX = this.def.mode === "belly" ? 70 : 50;
    const maxX = this.def.mode === "belly" ? W - 70 : W - 50;
    const x = Phaser.Math.Between(minX, maxX);
    if (wantFish) {
      const t = this.add.text(x, -70, "🐟", { fontSize: "52px" }).setDepth(4);
      this.physics.add.existing(t);
      const body = t.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(46, 46);
      body.setOffset((t.width - 46) / 2, (t.height - 46) / 2);
      t.setData("kind", "fish");
      this.tweens.add({ targets: t, scaleX: 1.1, scaleY: 1.1, yoyo: true, repeat: -1, duration: 320 });
      this.items.add(t);
      return;
    }
    const pool = HAZARDS_BY_MODE[this.def.mode];
    const pick = pool[Phaser.Math.Between(0, pool.length - 1)];
    if (pick === "jelly") {
      const jelly = this.add.container(x, -70).setDepth(4);
      const dome = this.add.circle(0, -12, 18, 0xe86f9e).setAlpha(0.95);
      const dome2 = this.add.circle(0, -6, 14, 0xf29bc0);
      const tentacle = this.add.rectangle(0, 18, 4, 34, 0xe86f9e).setAlpha(0.7);
      const tentacle2 = this.add.rectangle(-8, 16, 4, 26, 0xe86f9e).setAlpha(0.6);
      const tentacle3 = this.add.rectangle(8, 16, 4, 26, 0xe86f9e).setAlpha(0.6);
      jelly.add([dome, dome2, tentacle, tentacle2, tentacle3]);
      this.physics.add.existing(jelly);
      const body = jelly.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(44, 58);
      body.setOffset(-22, -30);
      jelly.setData("kind", "hazard");
      jelly.setData("baseX", x);
      jelly.setData("jelly", Phaser.Math.Between(0, 2000));
      this.items.add(jelly);
      return;
    }
    const t = this.add.text(x, -70, pick, { fontSize: "54px" }).setDepth(4);
    this.physics.add.existing(t);
    const body = t.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(48, 48);
    body.setOffset((t.width - 48) / 2, (t.height - 48) / 2);
    t.setData("kind", "hazard");
    this.items.add(t);
  }

  private onTouch(item: Phaser.GameObjects.Text | Phaser.GameObjects.Container) {
    if (this.dead || this.finished) return;
    const kind = item.getData("kind") as string;
    const { x, y } = item;
    item.destroy();
    if (kind === "fish") {
      this.fishSaved += 1;
      this.updateHud();
      this.sparkleBurst(x, y, 16);
      this.sfxCollect();
      if (this.fishSaved >= this.def.fishGoal) this.finishLevel();
    } else if (this.time.now > this.invulnUntil) {
      this.hit();
    }
  }

  private hit() {
    this.hearts -= 1;
    this.updateHud();
    this.invulnUntil = this.time.now + 1400;
    this.cameras.main.shake(180, 0.008);
    this.flashFx(0xff3b30, 0.32);
    this.tweens.add({ targets: this.jonah, alpha: 0.35, yoyo: true, repeat: 5, duration: 90 });
    this.sfxHit();
    if (this.hearts <= 0) this.die();
  }

  private die() {
    if (this.dead) return;
    this.dead = true;
    this.spawnEvent?.remove();
    this.lightningEvent?.remove();
    this.flashFx(0xff3b30, 0.5);
    this.cameras.main.shake(400, 0.012);
    this.tweens.add({ targets: this.jonah, angle: 95, y: this.jonah.y + 30, duration: 420 });
    this.sfxDie();
    this.time.delayedCall(1500, () => this.cbs.onGameOver(this.levelIndex, this.fishSaved));
  }

  private finishLevel() {
    if (this.finished) return;
    this.finished = true;
    this.spawnEvent?.remove();
    this.lightningEvent?.remove();
    this.sfxWin();
    if (this.def.mode === "shore") this.whaleFinale();
    else this.celebrate();
    this.time.delayedCall(this.def.mode === "shore" ? 3400 : 1900, () =>
      this.cbs.onLevelComplete(this.levelIndex, this.fishSaved)
    );
  }

  private celebrate() {
    this.confettiBurst(W / 2, 220, 60);
    if (this.def.mode === "storm") {
      // the big fish swims past behind Jonah
      const whale = this.add.container(W / 2, H + 200).setDepth(3);
      const body = this.add.ellipse(0, 0, 190, 90, 0x2c5f8a, 0.7);
      const belly = this.add.ellipse(0, 26, 150, 46, 0x9ec9e8, 0.6);
      const eye = this.add.circle(-62, -12, 7, 0xffffff, 0.8);
      whale.add([body, belly, eye]);
      this.tweens.add({ targets: whale, y: 300, duration: 1600, ease: "Sine.easeOut", onComplete: () => whale.destroy() });
    } else {
      // light beam from above — Jonah is escaping the belly
      const beam = this.add.rectangle(W / 2, 120, 180, 240, 0xfff2b0, 0.25).setDepth(3);
      this.tweens.add({ targets: beam, alpha: 0, duration: 1200, onComplete: () => beam.destroy() });
    }
  }

  private whaleFinale() {
    const cx = W / 2;
    // whale rises and swallows Jonah, then spouts him out above the screen
    const whale = this.add.container(cx, H + 220).setDepth(8);
    const body = this.add.ellipse(0, 0, 170, 96, 0x23456e);
    const belly = this.add.ellipse(0, 30, 140, 46, 0x9ec9e8);
    const eye = this.add.circle(-56, -14, 8, 0xffffff);
    const pupil = this.add.circle(-58, -14, 3, 0x111111);
    const tailL = this.add.triangle(-40, -80, 0, -30, -46, -14, -46, -46, 0x23456e);
    const tailR = this.add.triangle(-40, -80, 0, -30, -34, -14, -34, -46, 0x23456e);
    const smile = this.add.arc(-28, 18, 16, 0.15, Math.PI - 0.15, false, 0x111111);
    whale.add([tailL, tailR, body, belly, eye, pupil, smile]);

    this.tweens.add({
      targets: whale,
      y: this.jonah.y + 30,
      duration: 1100,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.tweens.add({ targets: this.jonah, alpha: 0, duration: 250 });
      },
    });
    this.tweens.add({
      targets: whale,
      y: 60,
      duration: 1100,
      delay: 1200,
      ease: "Sine.easeOut",
      onComplete: () => {
        // spout: Jonah launched up out of the whale
        this.jonah.setAlpha(1);
        this.jonah.setPosition(cx, 40);
        this.jonah.setRotation(-1.5);
        this.spoutBurst(cx, 30);
        this.tweens.add({
          targets: this.jonah,
          y: -140,
          rotation: -2.4,
          duration: 800,
          ease: "Sine.easeOut",
          onComplete: () => {
            const msg = this.add
              .text(cx, 200, "NINEVEH!", {
                fontSize: "44px",
                color: "#ffffff",
                stroke: "#000000aa",
                strokeThickness: 8,
                fontStyle: "bold",
              })
              .setOrigin(0.5)
              .setDepth(20)
              .setScale(0.3);
            this.tweens.add({ targets: msg, scaleX: 1, scaleY: 1, duration: 500, ease: "Back.easeOut" });
            this.confettiBurst(cx, 260, 80);
          },
        });
      },
    });
  }

  private spoutBurst(x: number, y: number) {
    const cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x,
      y,
      speed: { min: 120, max: 420 },
      angle: { min: 230, max: 310 },
      gravityY: 900,
      lifespan: { min: 600, max: 1200 },
      scale: { min: 0.4, max: 1.2 },
      alpha: { start: 0.9, end: 0 },
      tint: 0xffffff,
      quantity: 40,
      emitting: false,
    };
    const e = this.add.particles(0, 0, "dot", cfg);
    e.explode(40, x, y);
    this.time.delayedCall(2200, () => e.destroy());
  }

  // ---- juice ----

  private flashFx(color: number, alpha: number) {
    const f = this.add.rectangle(W / 2, H / 2, W, H, color, alpha).setDepth(50);
    this.tweens.add({ targets: f, alpha: 0, duration: 260, onComplete: () => f.destroy() });
  }

  private lightningFlash() {
    this.flashFx(0xffffff, 0.28);
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
      tint: [0xff6b6b, 0xffb84d, 0xffe14d, 0x7bd97b, 0x6db8ff, 0x9d7bff],
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

  private sfxSwim() {
    this.tone(240, 420, 0.12, "sine", 0.05);
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

  // ---- public API for the React wrapper ----

  startLevel(level: number) {
    this.levelIndex = level;
    this.scene.restart({ level });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }
}
