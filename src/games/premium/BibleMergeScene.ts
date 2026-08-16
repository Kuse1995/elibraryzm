import Phaser from "phaser";

export interface MergeTier {
  emoji: string;
  name: string;
  glow: number;
}

export const MERGE_TIERS: MergeTier[] = [
  { emoji: "🌰", name: "Seed", glow: 0xc9a26b },
  { emoji: "🌱", name: "Sprout", glow: 0x7bd97b },
  { emoji: "🌿", name: "Plant", glow: 0x34d399 },
  { emoji: "🌻", name: "Flower", glow: 0xffd76a },
  { emoji: "🍎", name: "Apple", glow: 0xff6b6b },
  { emoji: "🌈", name: "Rainbow", glow: 0x9d7bff },
];

export const BIBLE_MERGE_WORLDS = [
  { name: "The Garden", emoji: "🌱" },
  { name: "The Fields", emoji: "🌻" },
  { name: "The Promise", emoji: "🌈" },
];

export interface MergeLevelDef {
  name: string;
  hint: string;
  goalTier: number;
  goalCount: number;
  par: number;
  board: { col: number; row: number; tier: number }[];
}

export const BIBLE_MERGE_LEVELS: MergeLevelDef[] = [
  // ---- World 1: The Garden (free) ----
  {
    name: "First Seeds",
    hint: "Tap two seeds to grow a sprout",
    goalTier: 1,
    goalCount: 2,
    par: 4,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 2, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 1, row: 1, tier: 0 }, { col: 3, row: 1, tier: 0 }, { col: 5, row: 1, tier: 0 },
      { col: 0, row: 3, tier: 0 }, { col: 2, row: 3, tier: 0 },
    ],
  },
  {
    name: "Green Shoots",
    hint: "Grow three sprouts",
    goalTier: 1,
    goalCount: 3,
    par: 6,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 2, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 1, row: 2, tier: 0 }, { col: 3, row: 2, tier: 0 }, { col: 5, row: 2, tier: 0 },
      { col: 0, row: 4, tier: 0 }, { col: 2, row: 4, tier: 0 },
      { col: 2, row: 1, tier: 1 }, { col: 4, row: 1, tier: 1 },
    ],
  },
  {
    name: "Green Things",
    hint: "Two sprouts make a plant",
    goalTier: 2,
    goalCount: 2,
    par: 7,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 1, row: 0, tier: 0 }, { col: 2, row: 0, tier: 0 },
      { col: 0, row: 1, tier: 0 }, { col: 1, row: 1, tier: 0 }, { col: 2, row: 1, tier: 0 },
      { col: 3, row: 1, tier: 1 }, { col: 4, row: 1, tier: 1 },
      { col: 3, row: 2, tier: 1 }, { col: 4, row: 2, tier: 1 },
    ],
  },
  {
    name: "God Grows",
    hint: "Make three plants",
    goalTier: 2,
    goalCount: 3,
    par: 12,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 2, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 5, row: 0, tier: 0 }, { col: 1, row: 2, tier: 0 }, { col: 3, row: 2, tier: 0 },
      { col: 0, row: 4, tier: 0 }, { col: 4, row: 4, tier: 0 },
      { col: 2, row: 1, tier: 1 }, { col: 4, row: 1, tier: 1 }, { col: 1, row: 4, tier: 1 },
      { col: 3, row: 4, tier: 2 },
    ],
  },
  {
    name: "First Flower",
    hint: "Two plants make a flower",
    goalTier: 3,
    goalCount: 1,
    par: 9,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 2, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 1, row: 1, tier: 0 }, { col: 3, row: 1, tier: 0 }, { col: 5, row: 1, tier: 0 },
      { col: 1, row: 2, tier: 1 }, { col: 3, row: 2, tier: 1 }, { col: 0, row: 3, tier: 1 },
      { col: 4, row: 3, tier: 1 },
      { col: 2, row: 2, tier: 2 }, { col: 2, row: 4, tier: 2 }, { col: 4, row: 4, tier: 2 },
    ],
  },
  // ---- World 2: The Fields (All-Access) ----
  {
    name: "Blooming",
    hint: "Grow two flowers",
    goalTier: 3,
    goalCount: 2,
    par: 7,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 1, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 5, row: 0, tier: 0 },
      { col: 0, row: 1, tier: 1 }, { col: 2, row: 1, tier: 1 }, { col: 3, row: 1, tier: 1 },
      { col: 5, row: 1, tier: 1 }, { col: 1, row: 2, tier: 1 }, { col: 4, row: 2, tier: 1 },
      { col: 2, row: 3, tier: 2 }, { col: 3, row: 3, tier: 2 },
      { col: 1, row: 4, tier: 2 }, { col: 4, row: 4, tier: 2 },
    ],
  },
  {
    name: "Sunshine",
    hint: "Grow two flowers",
    goalTier: 3,
    goalCount: 2,
    par: 9,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 1, row: 1, tier: 0 }, { col: 3, row: 1, tier: 0 },
      { col: 2, row: 0, tier: 1 }, { col: 2, row: 1, tier: 1 },
      { col: 0, row: 2, tier: 2 }, { col: 2, row: 2, tier: 2 }, { col: 4, row: 2, tier: 2 },
      { col: 2, row: 3, tier: 3 },
    ],
  },
  {
    name: "Branches",
    hint: "Two flowers make an apple",
    goalTier: 4,
    goalCount: 1,
    par: 6,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 1, row: 0, tier: 0 }, { col: 3, row: 0, tier: 0 },
      { col: 4, row: 0, tier: 0 }, { col: 0, row: 1, tier: 0 }, { col: 4, row: 1, tier: 0 },
      { col: 1, row: 1, tier: 1 }, { col: 3, row: 1, tier: 1 },
      { col: 0, row: 2, tier: 1 }, { col: 4, row: 2, tier: 1 },
      { col: 2, row: 1, tier: 2 }, { col: 2, row: 2, tier: 2 },
      { col: 2, row: 3, tier: 3 },
    ],
  },
  {
    name: "Harvest",
    hint: "Grow two apples",
    goalTier: 4,
    goalCount: 2,
    par: 12,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 2, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 1, row: 1, tier: 0 }, { col: 3, row: 1, tier: 0 }, { col: 5, row: 1, tier: 0 },
      { col: 0, row: 2, tier: 1 }, { col: 2, row: 2, tier: 1 }, { col: 4, row: 2, tier: 1 },
      { col: 1, row: 3, tier: 2 }, { col: 3, row: 3, tier: 2 },
      { col: 2, row: 3, tier: 3 }, { col: 2, row: 4, tier: 3 },
    ],
  },
  {
    name: "Two by Two",
    hint: "Grow two apples",
    goalTier: 4,
    goalCount: 2,
    par: 18,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 1, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 5, row: 0, tier: 0 }, { col: 0, row: 2, tier: 0 }, { col: 5, row: 2, tier: 0 },
      { col: 1, row: 4, tier: 0 }, { col: 4, row: 4, tier: 0 },
      { col: 1, row: 1, tier: 1 }, { col: 4, row: 1, tier: 1 }, { col: 0, row: 3, tier: 1 },
      { col: 5, row: 3, tier: 1 },
      { col: 2, row: 1, tier: 2 }, { col: 3, row: 1, tier: 2 }, { col: 2, row: 3, tier: 2 },
      { col: 3, row: 3, tier: 2 },
    ],
  },
  // ---- World 3: The Promise (All-Access) ----
  {
    name: "Abundance",
    hint: "Two apples from the harvest",
    goalTier: 4,
    goalCount: 2,
    par: 6,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 5, row: 0, tier: 0 }, { col: 0, row: 1, tier: 0 },
      { col: 5, row: 1, tier: 0 },
      { col: 1, row: 0, tier: 1 }, { col: 4, row: 0, tier: 1 }, { col: 1, row: 1, tier: 1 },
      { col: 4, row: 1, tier: 1 },
      { col: 0, row: 2, tier: 2 }, { col: 5, row: 2, tier: 2 }, { col: 2, row: 2, tier: 2 },
      { col: 3, row: 2, tier: 2 },
      { col: 1, row: 2, tier: 3 }, { col: 4, row: 2, tier: 3 }, { col: 2, row: 3, tier: 3 },
      { col: 3, row: 3, tier: 3 },
    ],
  },
  {
    name: "Hope",
    hint: "Make the rainbow",
    goalTier: 5,
    goalCount: 1,
    par: 8,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 5, row: 0, tier: 0 },
      { col: 1, row: 0, tier: 1 }, { col: 4, row: 0, tier: 1 }, { col: 1, row: 1, tier: 1 },
      { col: 4, row: 1, tier: 1 },
      { col: 2, row: 1, tier: 2 }, { col: 3, row: 1, tier: 2 }, { col: 0, row: 2, tier: 2 },
      { col: 5, row: 2, tier: 2 },
      { col: 2, row: 2, tier: 3 }, { col: 3, row: 2, tier: 3 },
    ],
  },
  {
    name: "The Bow",
    hint: "Make the rainbow",
    goalTier: 5,
    goalCount: 1,
    par: 17,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 2, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 1, row: 1, tier: 0 }, { col: 3, row: 1, tier: 0 }, { col: 5, row: 1, tier: 0 },
      { col: 2, row: 2, tier: 0 }, { col: 4, row: 2, tier: 0 },
      { col: 0, row: 2, tier: 1 }, { col: 5, row: 2, tier: 1 }, { col: 1, row: 3, tier: 1 },
      { col: 3, row: 3, tier: 1 },
      { col: 2, row: 3, tier: 2 }, { col: 4, row: 3, tier: 2 },
      { col: 3, row: 4, tier: 3 },
    ],
  },
  {
    name: "Promise Keeper",
    hint: "Make the rainbow",
    goalTier: 5,
    goalCount: 1,
    par: 10,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 5, row: 0, tier: 0 }, { col: 0, row: 1, tier: 0 },
      { col: 5, row: 1, tier: 0 },
      { col: 1, row: 0, tier: 1 }, { col: 4, row: 0, tier: 1 }, { col: 1, row: 1, tier: 1 },
      { col: 4, row: 1, tier: 1 },
      { col: 2, row: 0, tier: 2 }, { col: 3, row: 0, tier: 2 }, { col: 0, row: 2, tier: 2 },
      { col: 5, row: 2, tier: 2 }, { col: 2, row: 2, tier: 2 }, { col: 3, row: 2, tier: 2 },
      { col: 2, row: 4, tier: 2 }, { col: 3, row: 4, tier: 2 },
    ],
  },
  {
    name: "The Rainbow",
    hint: "The promise of God",
    goalTier: 5,
    goalCount: 1,
    par: 8,
    board: [
      { col: 0, row: 0, tier: 0 }, { col: 1, row: 0, tier: 0 }, { col: 4, row: 0, tier: 0 },
      { col: 5, row: 0, tier: 0 }, { col: 0, row: 1, tier: 0 }, { col: 5, row: 1, tier: 0 },
      { col: 2, row: 4, tier: 0 }, { col: 3, row: 4, tier: 0 },
      { col: 1, row: 1, tier: 1 }, { col: 4, row: 1, tier: 1 }, { col: 2, row: 3, tier: 1 },
      { col: 3, row: 3, tier: 1 },
      { col: 2, row: 1, tier: 2 }, { col: 3, row: 1, tier: 2 }, { col: 1, row: 2, tier: 2 },
      { col: 4, row: 2, tier: 2 },
      { col: 2, row: 2, tier: 3 }, { col: 3, row: 2, tier: 3 },
    ],
  },
];

export interface BibleMergeCallbacks {
  onReady: () => void;
  onLevelComplete: (levelId: number, stars: number) => void;
}

export const BIBLE_MERGE_COLLECTION_KEY = "bible-merge-collection";

export function readMergeCollection(): number[] {
  try {
    const raw = localStorage.getItem(BIBLE_MERGE_COLLECTION_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

const W = 480;
const H = 800;
const COLS = 6;
const ROWS = 6;
const TILE = 58;
const GAP = 6;
const BOARD_W = COLS * TILE + (COLS - 1) * GAP;
const BOARD_X = (W - BOARD_W) / 2;
const BOARD_Y = 168;
const BOARD_BOTTOM = BOARD_Y + ROWS * TILE + (ROWS - 1) * GAP;

const WORLD_STYLE = [
  { top: 0x8fd9a8, mid: 0xd8f3dc, deep: 0x2f7f5f, panel: 0xffffff },
  { top: 0xf7c860, mid: 0xfdeec7, deep: 0xa8652a, panel: 0xffffff },
  { top: 0x7fb2e8, mid: 0xd8e8fb, deep: 0x34568a, panel: 0xffffff },
];

const RAINBOW = [0xff6b6b, 0xffb84d, 0xffe14d, 0x7bd97b, 0x6db8ff, 0x9d7bff];

export class BibleMergeScene extends Phaser.Scene {
  private cbs: BibleMergeCallbacks;
  private levelId = 0;
  private def: MergeLevelDef = BIBLE_MERGE_LEVELS[0];

  private grid: (number | null)[] = [];
  private tiles: (Phaser.GameObjects.Container | null)[] = [];
  private selected: number | null = null;
  private busy = false;
  private merges = 0;
  private created = 0;
  private completed = false;

  private goalText!: Phaser.GameObjects.Text;
  private mergesText!: Phaser.GameObjects.Text;
  private selectRing?: Phaser.GameObjects.Arc;

  private muted = false;
  private audio?: AudioContext;

  constructor(cbs: BibleMergeCallbacks) {
    super({ key: "bible-merge-scene" });
    this.cbs = cbs;
  }

  init(data: { level?: number }) {
    this.levelId = data?.level ?? 0;
  }

  create() {
    this.def = BIBLE_MERGE_LEVELS[Math.min(this.levelId, BIBLE_MERGE_LEVELS.length - 1)];
    this.grid = new Array(COLS * ROWS).fill(null);
    this.tiles = new Array(COLS * ROWS).fill(null);
    this.selected = null;
    this.busy = false;
    this.merges = 0;
    this.created = 0;
    this.completed = false;

    this.buildBackdrop();
    this.buildBoard();
    this.buildHud();
    this.showIntro();
    this.cbs.onReady();
  }

  // ---- visuals ----

  private buildBackdrop() {
    const style = WORLD_STYLE[Math.floor(this.levelId / 5)] ?? WORLD_STYLE[0];
    const g = this.add.graphics();
    g.fillGradientStyle(style.top, style.top, style.mid, style.mid, 1);
    g.fillRect(0, 0, W, H);

    // drifting clouds
    for (let i = 0; i < 5; i++) {
      const cloud = this.add
        .text(Phaser.Math.Between(20, W - 140), Phaser.Math.Between(30, 130), "☁️", {
          fontSize: `${Phaser.Math.Between(30, 52)}px`,
        })
        .setAlpha(0.5 + Math.random() * 0.3)
        .setDepth(0);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + Phaser.Math.Between(30, 80),
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(2400, 4200),
        ease: "Sine.easeInOut",
      });
    }

    // gentle sun glow top corner
    const sun = this.add.circle(W - 60, 66, 52, 0xfff2b0, 0.28).setDepth(0);
    const sunCore = this.add.circle(W - 60, 66, 26, 0xffe98a, 0.85).setDepth(0);
    this.tweens.add({ targets: [sun, sunCore], alpha: 0.15, yoyo: true, repeat: -1, duration: 2200 });
  }

  private buildBoard() {
    const style = WORLD_STYLE[Math.floor(this.levelId / 5)] ?? WORLD_STYLE[0];
    // soft panel behind the grid
    this.add
      .graphics()
      .fillStyle(style.panel, 0.28)
      .fillRoundedRect(BOARD_X - 14, BOARD_Y - 14, BOARD_W + 28, BOARD_BOTTOM - BOARD_Y + 28, 22);

    // base tile slots
    for (let i = 0; i < COLS * ROWS; i++) {
      const { x, y } = this.cellToXY(i);
      this.add.graphics().fillStyle(0xffffff, 0.35).fillRoundedRect(x - TILE / 2 + 2, y - TILE / 2 + 4, TILE, TILE, 14);
      this.add.graphics().fillStyle(0xffffff, 0.75).fillRoundedRect(x - TILE / 2, y - TILE / 2, TILE, TILE, 14);
      // interactive zone for the empty slot (tiles on top grab the tap instead)
      this.add
        .zone(x, y, TILE, TILE)
        .setDepth(2)
        .setInteractive()
        .on("pointerdown", () => this.handleTap(i));
    }

    this.def.board.forEach((b) => {
      const cell = b.row * COLS + b.col;
      this.grid[cell] = b.tier;
      this.tiles[cell] = this.buildTile(cell, b.tier);
    });
  }

  private cellToXY(cell: number): { x: number; y: number } {
    const col = cell % COLS;
    const row = Math.floor(cell / COLS);
    return {
      x: BOARD_X + col * (TILE + GAP) + TILE / 2,
      y: BOARD_Y + row * (TILE + GAP) + TILE / 2,
    };
  }

  private buildTile(cell: number, tier: number): Phaser.GameObjects.Container {
    const { x, y } = this.cellToXY(cell);
    const tierDef = MERGE_TIERS[tier];
    const c = this.add.container(x, y).setDepth(3);

    const glow = this.add.circle(0, 0, 24, tierDef.glow, 0.3).setDepth(0);
    const glowSoft = this.add.circle(0, 0, 33, tierDef.glow, 0.14).setDepth(0);
    const emoji = this.add.text(0, 0, tierDef.emoji, { fontSize: "38px" }).setOrigin(0.5);
    c.add([glowSoft, glow, emoji]);
    c.setData("glow", glow);
    c.setData("emoji", emoji);

    if (tier >= 3) {
      this.tweens.add({
        targets: emoji,
        y: -3,
        yoyo: true,
        repeat: -1,
        duration: 700 + tier * 120,
        ease: "Sine.easeInOut",
      });
    }

    c.setSize(TILE, TILE);
    c.setInteractive(new Phaser.Geom.Rectangle(-TILE / 2, -TILE / 2, TILE, TILE), Phaser.Geom.Rectangle.Contains);
    c.setData("cell", cell);
    c.on("pointerdown", () => this.handleTap(c.getData("cell") as number));
    return c;
  }

  private updateTile(cell: number, tier: number) {
    const tile = this.tiles[cell];
    if (!tile) return;
    const tierDef = MERGE_TIERS[tier];
    (tile.getData("emoji") as Phaser.GameObjects.Text).setText(tierDef.emoji);
    (tile.getData("glow") as Phaser.GameObjects.Arc).setFillStyle(tierDef.glow, 0.3);
    this.popTile(tile);
    this.sparkleBurst(tile.x, tile.y, 18, tierDef.glow);
  }

  private popTile(tile: Phaser.GameObjects.Container) {
    tile.setScale(0.55);
    this.tweens.add({
      targets: tile,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 150,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({ targets: tile, scaleX: 1, scaleY: 1, duration: 110 });
      },
    });
  }

  private buildHud() {
    const goalTier = MERGE_TIERS[this.def.goalTier];
    this.add
      .text(W / 2, 14, `Level ${this.levelId + 1} — ${this.def.name}`, {
        fontSize: "21px",
        color: "#ffffff",
        stroke: "#00000066",
        strokeThickness: 5,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.goalText = this.add
      .text(W / 2, 46, `Goal: ${this.created}/${this.def.goalCount} ${goalTier.emoji}`, {
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#00000088",
        strokeThickness: 5,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.mergesText = this.add
      .text(W / 2, 76, `Merges: 0 · Par ${this.def.par}`, { fontSize: "16px", color: "#ffffff", stroke: "#00000066", strokeThickness: 4 })
      .setOrigin(0.5, 0)
      .setDepth(10);

    const goalPill = this.add
      .graphics()
      .fillStyle(0x000000, 0.12)
      .fillRoundedRect(W / 2 - 120, 40, 240, 66, 20);
    goalPill.setDepth(9);
  }

  private showIntro() {
    const intro = this.add
      .text(W / 2, H * 0.42, `${this.def.name}\n${this.def.hint}`, {
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

  // ---- gameplay ----

  private handleTap(cell: number) {
    if (this.busy || this.completed) return;
    if (this.selected === null) {
      if (this.grid[cell] !== null) this.selectCell(cell);
      return;
    }
    if (cell === this.selected) {
      this.deselect();
      return;
    }
    const a = this.grid[this.selected] as number;
    const b = this.grid[cell];
    if (b === null) {
      this.moveItem(this.selected, cell);
      return;
    }
    if (b === a) {
      if (a >= MERGE_TIERS.length - 1) {
        this.maxPop(this.selected, cell);
      } else {
        this.mergeItems(this.selected, cell);
      }
      return;
    }
    this.selectCell(cell);
  }

  private selectCell(cell: number) {
    this.deselect();
    this.selected = cell;
    const { x, y } = this.cellToXY(cell);
    this.selectRing = this.add.circle(x, y, TILE / 2 + 4, 0xffffff, 0.15).setStrokeStyle(3, 0xffffff, 0.9).setDepth(4);
    this.tweens.add({ targets: this.selectRing, alpha: 0.6, yoyo: true, repeat: -1, duration: 450 });
    const tile = this.tiles[cell];
    if (tile) this.tweens.add({ targets: tile, scaleX: 1.12, scaleY: 1.12, duration: 120 });
    this.sfxSelect();
  }

  private deselect() {
    if (this.selectRing) {
      this.selectRing.destroy();
      this.selectRing = undefined;
    }
    if (this.selected !== null) {
      const tile = this.tiles[this.selected];
      if (tile) this.tweens.add({ targets: tile, scaleX: 1, scaleY: 1, duration: 120 });
    }
    this.selected = null;
  }

  private moveItem(from: number, to: number) {
    this.busy = true;
    this.deselect();
    const tile = this.tiles[from];
    if (!tile) {
      this.busy = false;
      return;
    }
    const { x, y } = this.cellToXY(to);
    this.sfxPlop();
    this.tweens.add({
      targets: tile,
      x,
      y,
      duration: 220,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.grid[to] = this.grid[from];
        this.grid[from] = null;
        this.tiles[to] = tile;
        this.tiles[from] = null;
        tile.setData("cell", to);
        this.busy = false;
      },
    });
  }

  private mergeItems(from: number, to: number) {
    this.busy = true;
    this.deselect();
    const source = this.tiles[from];
    const target = this.tiles[to];
    if (!source || !target) {
      this.busy = false;
      return;
    }
    const newTier = (this.grid[from] as number) + 1;
    const { x, y } = this.cellToXY(to);
    this.sfxPlop();
    this.tweens.add({
      targets: source,
      x,
      y,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0.35,
      duration: 220,
      ease: "Quad.easeIn",
      onComplete: () => {
        source.destroy();
        this.tiles[from] = null;
        this.grid[from] = null;
        this.grid[to] = newTier;
        this.updateTile(to, newTier);
        this.merges += 1;
        this.mergesText.setText(`Merges: ${this.merges} · Par ${this.def.par}`);
        this.saveCollection(newTier);
        if (newTier === this.def.goalTier) {
          this.created += 1;
          this.goalText.setText(`Goal: ${this.created}/${this.def.goalCount} ${MERGE_TIERS[this.def.goalTier].emoji}`);
          this.sparkleBurst(x, y, 26, MERGE_TIERS[newTier].glow);
        }
        this.sfxMerge(newTier);
        this.busy = false;
        if (this.created >= this.def.goalCount) {
          this.completeLevel();
          return;
        }
        this.maybeRescue();
      },
    });
  }

  private maxPop(a: number, b: number) {
    this.deselect();
    [a, b].forEach((cell) => {
      const tile = this.tiles[cell];
      if (!tile) return;
      this.popTile(tile);
      this.sparkleBurst(tile.x, tile.y, 12, 0xffffff);
    });
    this.sfxMax();
  }

  private maybeRescue() {
    if (this.completed) return;
    const hasLow = this.grid.includes(0) || this.grid.includes(1);
    if (hasLow) return;
    const empties: number[] = [];
    this.grid.forEach((v, i) => {
      if (v === null) empties.push(i);
    });
    if (empties.length < 2) return;
    const pick = Phaser.Utils.Array.Shuffle(empties).slice(0, 2);
    pick.forEach((cell) => {
      this.grid[cell] = 0;
      this.tiles[cell] = this.buildTile(cell, 0);
      this.popTile(this.tiles[cell] as Phaser.GameObjects.Container);
    });
    const toast = this.add
      .text(W / 2, BOARD_BOTTOM + 34, "✨ God sends new seeds!", {
        fontSize: "19px",
        color: "#ffffff",
        stroke: "#00000088",
        strokeThickness: 5,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: toast, alpha: 0, delay: 1500, duration: 400, onComplete: () => toast.destroy() });
  }

  private saveCollection(tier: number) {
    try {
      const current = readMergeCollection();
      if (!current.includes(tier)) {
        current.push(tier);
        current.sort((x, y) => x - y);
        localStorage.setItem(BIBLE_MERGE_COLLECTION_KEY, JSON.stringify(current));
      }
    } catch {
      /* storage unavailable */
    }
  }

  private completeLevel() {
    if (this.completed) return;
    this.completed = true;
    this.busy = true;
    this.deselect();
    const stars = this.merges <= this.def.par ? 3 : this.merges <= this.def.par + 4 ? 2 : 1;
    this.sfxWin(stars);

    if (this.def.goalTier >= 5) this.showRainbow();
    this.confettiBurst(W / 2, 200, 80);
    this.time.delayedCall(350, () => this.confettiBurst(120, 160, 40));
    this.time.delayedCall(600, () => this.confettiBurst(W - 120, 180, 40));

    const msg = this.add
      .text(W / 2, H * 0.34, "LEVEL COMPLETE!", {
        fontSize: "38px",
        color: "#ffffff",
        stroke: "#000000aa",
        strokeThickness: 8,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setScale(0.3);
    this.tweens.add({ targets: msg, scaleX: 1, scaleY: 1, duration: 500, ease: "Back.easeOut" });

    const starLine = this.add
      .text(W / 2, H * 0.34 + 52, "⭐⭐⭐".slice(0, stars * 2) + "☆☆☆".slice(0, (3 - stars) * 2), {
        fontSize: "40px",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setScale(0.3);
    this.tweens.add({ targets: starLine, scaleX: 1, scaleY: 1, delay: 250, duration: 400, ease: "Back.easeOut" });

    this.time.delayedCall(1900, () => this.cbs.onLevelComplete(this.levelId, stars));
  }

  private showRainbow() {
    const g = this.add.graphics().setDepth(19);
    RAINBOW.forEach((color, i) => {
      g.lineStyle(10, color, 0.9);
      g.beginPath();
      g.arc(W / 2, 120, 70 + i * 16, Math.PI, Math.PI * 2);
      g.strokePath();
    });
    const glow = this.add.circle(W / 2, 120, 90, 0xffffff, 0.15).setDepth(18);
    this.tweens.add({ targets: glow, alpha: 0.05, yoyo: true, repeat: 2, duration: 500 });
  }

  // ---- juice ----

  private sparkleBurst(x: number, y: number, count: number, tint: number) {
    if (!this.textures.exists("merge-dot")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 3);
      g.generateTexture("merge-dot", 6, 6);
      g.destroy();
    }
    const cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x,
      y,
      speed: { min: 80, max: 300 },
      angle: { min: 200, max: 340 },
      gravityY: 500,
      lifespan: { min: 400, max: 900 },
      scale: { min: 0.3, max: 1 },
      tint: [tint, 0xffffff],
      quantity: count,
      emitting: false,
    };
    const e = this.add.particles(0, 0, "merge-dot", cfg);
    e.explode(count, x, y);
    this.time.delayedCall(1800, () => e.destroy());
  }

  private confettiBurst(x: number, y: number, count: number) {
    if (!this.textures.exists("merge-dot")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 3);
      g.generateTexture("merge-dot", 6, 6);
      g.destroy();
    }
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
    const e = this.add.particles(0, 0, "merge-dot", cfg);
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

  private sfxSelect() {
    this.tone(500, 560, 0.08, "triangle", 0.05);
  }

  private sfxPlop() {
    this.tone(320, 200, 0.1, "sine", 0.05);
  }

  private sfxMerge(tier: number) {
    const base = 380 + tier * 90;
    this.tone(base, base * 1.6, 0.16, "triangle", 0.07);
    this.time.delayedCall(90, () => this.tone(base * 1.25, base * 2, 0.18, "triangle", 0.06));
  }

  private sfxMax() {
    this.tone(600, 300, 0.16, "square", 0.05);
  }

  private sfxWin(stars: number) {
    this.tone(523, 523, 0.15, "triangle", 0.07);
    this.time.delayedCall(150, () => this.tone(659, 659, 0.15, "triangle", 0.07));
    this.time.delayedCall(300, () => this.tone(784, 784, 0.2, "triangle", 0.07));
    if (stars === 3) this.time.delayedCall(480, () => this.tone(1047, 1047, 0.35, "triangle", 0.08));
  }

  // ---- public API ----

  startLevel(levelId: number) {
    this.levelId = levelId;
    this.scene.restart({ level: levelId });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }
}
