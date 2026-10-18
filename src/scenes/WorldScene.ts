import Phaser from 'phaser';
import { bgm, sfx } from '../audio/sound';
import { GreekBuildingDef, GreekItemId } from '../data/items';
import { GREEK_RELICS } from '../data/relics';
import { CROP_MS, DAY_MS, state } from '../systems/GameState';
import { decorSpec } from '../world/decor';
import { WildlifeManager } from '../world/Wildlife';

const TILE = 16;
const MAP_W = 52; // 832 px
const MAP_H = 36; // 576 px
const SPEED = 98;
const REACH = 48;
const REGROW_MS = 18_000;
const LABEL_PROXIMITY_PX = 44;

/** Das Ägäische Meer liegt im Osten der Karte (Spalten 41..51, ab Zeile 12). */
const AEGEAN_SEA = { x: 41, y: 12, w: 11, h: 24 };

type Kind =
  | 'npc_nikolaos'
  | 'npc_telesikles'
  | 'npc_kleomenes'
  | 'npc_perikles'
  | 'npc_pythia'
  | 'npc_leonidas'
  | 'npc_themistokles'
  | 'npc_sokrates'
  | 'npc_alexander'
  | 'npc_ptolemaios'
  | 'npc_chloe'
  | 'npc_glaukos'
  | 'npc_brasidas'
  | 'res_holz'
  | 'res_kalkstein'
  | 'res_oliven'
  | 'res_ton'
  | 'res_wolle'
  | 'res_eisenerz'
  | 'res_silbererz'
  | 'res_marmor'
  | 'cistern_water'
  | 'fish_spot'
  | 'campfire_cook'
  | 'agora_stall'
  | 'plot'
  | 'build_site'
  | 'colony_ship'
  | 'training_dummy'
  | 'pnyx_vote'
  | 'olymp_portal'
  | 'thermopylae_gate'
  | 'beacon_tower'
  | 'parthenon_goal'
  | 'trireme_warship'
  | 'pharos_lighthouse'
  | 'theater_stage'
  | 'gordian_knot'
  | 'babylon_legacy'
  | 'relic_amphore'
  | 'relic_eule'
  | 'relic_agamemnon'
  | 'relic_antikythera'
  | 'relic_alexander';

interface DomLabel {
  x: number;
  y: number;
  el: HTMLElement;
  alwaysVisible?: boolean;
  isQuestTarget?: boolean;
  setText(t: string): DomLabel;
  setColor(c: string): DomLabel;
  setY(ny: number): DomLabel;
  setPosition(nx: number, ny: number): DomLabel;
}

interface Node {
  kind: Kind;
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  label?: DomLabel;
  readyAt: number;
  plotId?: number;
  buildingDef?: GreekBuildingDef;
  cropSprite?: Phaser.GameObjects.Image;
  builtSprite?: Phaser.GameObjects.Image;
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    F3: Phaser.Input.Keyboard.Key;
  };
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private nodes: Node[] = [];
  private domLabels: DomLabel[] = [];
  private labelLayer!: HTMLElement;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private waterShimmers: Phaser.GameObjects.Rectangle[] = [];
  private wildlife!: WildlifeManager;
  private saveTimer = 0;
  private sleeping = false;
  private transitioningOlymp = false;
  private playerLabel?: DomLabel;
  private debugMode = false;
  private debugGraphics?: Phaser.GameObjects.Graphics;

  constructor() {
    super('World');
  }

  create(): void {
    this.nodes = [];
    this.domLabels = [];
    this.waterShimmers = [];
    this.sleeping = false;
    this.transitioningOlymp = false;
    this.wildlife = new WildlifeManager(this);

    const params = new URLSearchParams(location.search);
    this.debugMode = params.get('debug') === '1';

    const existingLayer = document.getElementById('world-labels');
    this.labelLayer = existingLayer ?? document.createElement('div');
    this.labelLayer.id = 'world-labels';
    if (!existingLayer) document.body.appendChild(this.labelLayer);
    this.labelLayer.innerHTML = '';
    this.labelLayer.style.display = 'block';

    this.events.on('wake', () => {
      this.transitioningOlymp = false;
      this.labelLayer.style.display = 'block';
      state.checkQuest();
      this.updateCompass();
    });

    this.events.once('shutdown', () => {
      this.wildlife?.clear();
      state.off('craft', this.onCraft, this);
      state.off('chapterChanged', this.onChapterChanged, this);
      state.off('profileChanged', this.onProfileChanged, this);
    });

    const saved = state.saves.load();
    if (saved) state.loadFrom(saved);
    else state.startChapter(state.chapter);

    this.obstacles = this.physics.add.staticGroup();

    // 1. Nahtloses 16-Bit-Griechenland-Terrain mit RPG Maker MV A2 Tile-Sampling & Bayer-Dithering
    this.buildGreekGround();

    // 2. Monumente, Tempel, Olivenbäume, Zypressen & Dekorationen
    this.scatterGreekWorld();

    // 3. Rohstoff-Knoten (Oliven, Holz, Kalkstein, Marmor, Ton, Wolle, Eisen, Silber, Fisch)
    this.placeGreekResources();

    // 4. Bauplätze, Ackerbeete & Mentor des AKTUELLEN Kapitels
    this.placeGreekBuildingsAndNPCs();

    // 5. Die 5 Archäologischen Leit-Relikte (kapitelgesteuert)
    this.placeGreekRelics();

    // 6. Spieler-Spawn
    const startX = state.playerX || 415;
    const startY = state.playerY || 310;
    const texKey =
      state.playerGender === 'female' ? 'player_greek_female' : 'player_greek_male';

    this.player = this.physics.add.sprite(startX, startY, texKey, 0);
    this.player.body!.setSize(8, 6).setOffset(4, 24);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.physics.add.collider(this.player, this.obstacles);
    this.playerLabel = this.addLabel(startX, startY - 22, state.playerName, '#fde047', true);

    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setRoundPixels(true);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE,F3') as typeof this.wasd;

    this.nightOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x061029, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(8000);

    this.debugGraphics = this.add.graphics().setDepth(9500);

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    state.on('craft', this.onCraft, this);
    state.on('chapterChanged', this.onChapterChanged, this);
    state.on('profileChanged', this.onProfileChanged, this);
    bgm.playChapter(state.chapter);

    this.updateCompass();
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private pathDistance(px: number, py: number): number {
    let minD = 999;
    minD = Math.min(minD, this.distToSegment(px, py, 415, 300, 260, 390) - 9);
    minD = Math.min(minD, this.distToSegment(px, py, 415, 290, 650, 405) - 9);
    minD = Math.min(minD, this.distToSegment(px, py, 415, 250, 415, 130) - 10);
    minD = Math.min(minD, this.distToSegment(px, py, 360, 250, 185, 175) - 8);
    minD = Math.min(minD, this.distToSegment(px, py, 450, 230, 610, 155) - 8);
    return minD;
  }

  private buildGreekGround(): void {
    const W = MAP_W * TILE;
    const H = MAP_H * TILE;
    const texKey = `greek_ground_baked_ch${state.chapter}`;

    if (this.textures.exists(texKey)) {
      this.add.image(0, 0, texKey).setOrigin(0, 0).setDepth(0);
      return;
    }

    const rt = this.textures.createCanvas(texKey, W, H);
    if (!rt) return;
    const ctx = rt.getContext();
    ctx.imageSmoothingEnabled = false;

    // 4x4 Bayer-Dither-Matrix für organische 16-Bit-Übergänge
    const bayer4 = [
      [0 / 16, 8 / 16, 2 / 16, 10 / 16],
      [12 / 16, 4 / 16, 14 / 16, 6 / 16],
      [3 / 16, 11 / 16, 1 / 16, 9 / 16],
      [15 / 16, 7 / 16, 13 / 16, 5 / 16],
    ];

    const srcKey = this.textures.exists('ground_med_a2') ? 'ground_med_a2' : 'ground_a2';
    const srcImg = (this.textures.exists(srcKey)
      ? this.textures.get(srcKey).getSourceImage()
      : null) as HTMLImageElement | HTMLCanvasElement | null;

    let srcData: Uint8ClampedArray | null = null;
    let sw = 768;
    if (srcImg) {
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = srcImg.width;
      srcCanvas.height = srcImg.height;
      const sctx = srcCanvas.getContext('2d')!;
      sctx.drawImage(srcImg, 0, 0);
      srcData = sctx.getImageData(0, 0, srcImg.width, srcImg.height).data;
      sw = srcImg.width;
    }

    const sampleBlock = (bx: number, by: number, x: number, y: number): [number, number, number] => {
      if (!srcData) {
        return bx === 2 ? [243, 208, 120] : bx === 3 ? [140, 122, 107] : bx >= 6 ? [229, 217, 195] : [94, 140, 66];
      }
      const u = ((x % 48) + 48) % 48;
      const v = ((y % 48) + 48) % 48;
      const sx = bx * 96 + 24 + u;
      const sy = by * 144 + 72 + v;
      const idx = (sy * sw + sx) * 4;
      return [srcData[idx], srcData[idx + 1], srcData[idx + 2]];
    };

    const out = ctx.createImageData(W, H);
    const dst = out.data;

    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const tx = Math.floor(x / TILE);
        const ty = Math.floor(y / TILE);
        const dither = bayer4[(y >> 1) & 3][(x >> 1) & 3] - 0.5;

        const inSea =
          tx >= AEGEAN_SEA.x &&
          ty >= AEGEAN_SEA.y &&
          tx - AEGEAN_SEA.x + (ty - AEGEAN_SEA.y) * 0.35 >= 2.2;

        const inHarborPier = !inSea && tx >= 37 && tx <= 44 && ty >= 21 && ty <= 29;
        const inAcropolis = tx >= 21 && tx <= 33 && ty >= 3 && ty <= 11;
        const inAgora = tx >= 21 && tx <= 34 && ty >= 13 && ty <= 22;
        const inAlexandria = !inSea && tx >= 31 && tx <= 39 && ty >= 19 && ty <= 27;
        const inSpartaRock = tx <= 19 && ty <= 15;
        const inDelphi = tx >= 34 && ty <= 11;

        if (inSea) {
          const deep = tx >= AEGEAN_SEA.x + 3 && ty >= AEGEAN_SEA.y + 3;
          const r = deep ? (dither > 0 ? 3 : 2) : dither > 0 ? 14 : 56;
          const g = deep ? (dither > 0 ? 105 : 132) : dither > 0 ? 165 : 189;
          const b = deep ? (dither > 0 ? 161 : 199) : dither > 0 ? 233 : 248;

          for (let dy = 0; dy < 2 && y + dy < H; dy++) {
            for (let dx = 0; dx < 2 && x + dx < W; dx++) {
              const pIdx = ((y + dy) * W + (x + dx)) * 4;
              dst[pIdx] = r;
              dst[pIdx + 1] = g;
              dst[pIdx + 2] = b;
              dst[pIdx + 3] = 255;
            }
          }
          continue;
        }

        let bx = 1;
        let by = 1;

        if (inHarborPier) {
          bx = 3;
          by = 3;
        } else if (inAcropolis || inDelphi) {
          bx = 7;
          by = 1; // Helle Marmorterrasse
        } else if (inAgora || inAlexandria) {
          bx = 6;
          by = 1; // Porphyr- & Kalksteinpflaster der Agora
        } else if (inSpartaRock) {
          bx = 3;
          by = 1; // Rauer Schiefer & Fels
        } else {
          const distBeach = Math.hypot(tx - 40, ty - 24);
          if (distBeach < 4.2 + dither * 1.8 && tx >= 36) {
            bx = 2;
            by = 1; // Goldener Sandstrand
          } else {
            const wave = Math.sin(x * 0.024 + y * 0.019) * 0.5 + Math.cos(x * 0.017 - y * 0.023) * 0.5;
            bx = wave + dither * 0.55 > 0.3 ? 0 : 1;
            by = 1;
          }
        }

        const pDist = this.pathDistance(x, y);
        if (pDist < dither * 6) {
          bx = 1;
          by = 0; // Warmer mediterraner Lehm-/Erdweg
        }

        const [r, g, b] = sampleBlock(bx, by, x, y);
        for (let dy = 0; dy < 2 && y + dy < H; dy++) {
          for (let dx = 0; dx < 2 && x + dx < W; dx++) {
            const pIdx = ((y + dy) * W + (x + dx)) * 4;
            dst[pIdx] = r;
            dst[pIdx + 1] = g;
            dst[pIdx + 2] = b;
            dst[pIdx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(out, 0, 0);

    // Organisch geschwungene antike Pflasterstraßen
    const drawRoad = (x0: number, y0: number, x1: number, y1: number, width = 16) => {
      const steps = Math.max(20, Math.hypot(x1 - x0, y1 - y0) / 3);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const rx = x0 + (x1 - x0) * t + Math.sin(t * Math.PI * 2) * 4;
        const ry = y0 + (y1 - y0) * t + Math.cos(t * Math.PI * 2) * 2;
        ctx.fillStyle = 'rgba(217, 197, 160, 0.45)';
        ctx.beginPath();
        ctx.arc(rx, ry, width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(231, 216, 188, 0.6)';
        ctx.beginPath();
        ctx.arc(rx, ry, width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawRoad(415, 300, 260, 390, 18); // Agora -> Attika-Felder & Olivenhain
    drawRoad(415, 290, 650, 405, 18); // Agora -> Hafen von Piräus
    drawRoad(415, 250, 415, 130, 20); // Agora -> Heilige Straße zur Akropolis
    drawRoad(360, 250, 185, 175, 16); // Agora -> Sparta & Thermopylen
    drawRoad(450, 230, 610, 155, 16); // Agora -> Delphi & Olymp-Portal

    rt.refresh();
    this.add.image(0, 0, texKey).setOrigin(0, 0).setDepth(0);

    // Animierte Wellen auf dem Ägäischen Meer
    for (let wy = AEGEAN_SEA.y + 2; wy < MAP_H - 1; wy += 2) {
      for (let wx = AEGEAN_SEA.x + 2; wx < MAP_W - 1; wx += 3) {
        const sx = wx * TILE + 8;
        const sy = wy * TILE + 8;
        const shimmer = this.add
          .rectangle(sx, sy, 10, 2, 0xbae6fd, 0.55)
          .setDepth(1);
        this.waterShimmers.push(shimmer);
      }
    }

    // Unsichtbare Wasser-Barriere für das tiefere Meer
    const seaBlock = this.add.rectangle(
      (AEGEAN_SEA.x + 3) * TILE + 64,
      (AEGEAN_SEA.y + 2) * TILE + 180,
      128,
      360,
      0x000000,
      0,
    );
    this.physics.add.existing(seaBlock, true);
    this.obstacles.add(seaBlock);
  }

  /**
   * Platziert ein Sprite (aus Atlas `world` oder als Standalone-Textur)
   * mit maßgeschneiderter Skalierung und exakter Fußkollisionsbox aus `src/world/decor.ts`.
   */
  private placeDecor(
    frameOrKey: string,
    x: number,
    y: number,
    opts?: { collidable?: boolean; scale?: number; depthOffset?: number },
  ): Phaser.Physics.Arcade.Sprite {
    const isAtlas = this.textures.get('world')?.has(frameOrKey);
    const texFrame = isAtlas ? this.textures.getFrame('world', frameOrKey) : null;
    const fw = texFrame
      ? texFrame.realWidth
      : ((this.textures.get(frameOrKey)?.getSourceImage() as any)?.width || 32);
    const fh = texFrame
      ? texFrame.realHeight
      : ((this.textures.get(frameOrKey)?.getSourceImage() as any)?.height || 32);

    const spec = decorSpec(frameOrKey, fw, fh);
    const scale = opts?.scale ?? spec.scale;
    const wantBody = opts?.collidable ?? spec.hb !== null;

    const s = (
      isAtlas
        ? wantBody
          ? this.obstacles.create(x, y, 'world', frameOrKey)
          : this.physics.add.staticSprite(x, y, 'world', frameOrKey)
        : wantBody
        ? this.obstacles.create(x, y, frameOrKey)
        : this.physics.add.staticSprite(x, y, frameOrKey)
    ) as Phaser.Physics.Arcade.Sprite;

    s.setScale(scale);
    const dispW = fw * scale;
    const dispH = fh * scale;
    s.setDepth(y + dispH / 2 + (opts?.depthOffset ?? 0));

    const b = s.body as Phaser.Physics.Arcade.StaticBody | null;
    if (b) {
      if (wantBody && spec.hb) {
        s.refreshBody();
        const bw = Math.max(6, spec.hb.w);
        const bh = Math.max(4, spec.hb.h);
        const footY = y + dispH / 2;
        b.setSize(bw, bh, false);
        b.setOffset((dispW - bw) / 2, dispH - bh - spec.hb.by);
        b.position.set(x - bw / 2, footY - spec.hb.by - bh);
      } else if (wantBody) {
        s.refreshBody();
        const bw = Math.max(8, Math.round(dispW * 0.65));
        const bh = Math.max(6, Math.round(dispH * 0.32));
        const footY = y + dispH / 2;
        b.setSize(bw, bh, false);
        b.setOffset((dispW - bw) / 2, dispH - bh - 2);
        b.position.set(x - bw / 2, footY - 2 - bh);
      } else {
        b.enable = false;
      }
    }
    return s;
  }

  private scatterGreekWorld(): void {
    // 1. Akropolis im Norden: Parthenon-Tempel, Statuen & Dorische Säulen
    this.placeDecor('parthenon', 425, 78);
    this.placeDecor('statue_athena_shrine', 355, 92);
    this.placeDecor('statue_nike_gold', 492, 92);
    this.placeDecor('column_doric', 380, 125);
    this.placeDecor('column_doric', 470, 125);
    this.placeDecor('ruined_column', 445, 135);
    this.placeDecor('cypress_tall_1', 320, 85);
    this.placeDecor('cypress_tall_2', 530, 85);

    // 2. Athen: Agora, Stoa, Brunnen & Agora-Marktstände (Kapitel 1 & 4)
    this.placeDecor('stoa_colonnade', 385, 255);
    this.placeDecor('lion_fountain', 475, 295);
    this.placeDecor('marble_bench', 445, 295);
    this.placeDecor('statue_philosopher', 390, 230);
    this.placeDecor('greek_villa', 345, 285);
    this.placeDecor('terracotta_pots', 365, 305);
    this.placeDecor('market_stall_blue', 435, 335);
    this.placeDecor('market_stall_red', 465, 335);
    this.placeDecor('fruit_basket_figs', 420, 340);
    this.placeDecor('bougainvillea_pink', 320, 290);
    this.placeDecor('bougainvillea_orange', 500, 280);

    // 3. Mediterrane Baumgruppen im Attika-Tal
    this.placeDecor('cypress_tall_1', 230, 340);
    this.placeDecor('cypress_tall_2', 250, 350);
    this.placeDecor('citrus_tree_lemon', 190, 380);
    this.placeDecor('citrus_tree_orange', 310, 410);

    // 4. Sparta im Nordwesten (K3+)
    if (state.chapter >= 3) {
      this.placeDecor('spartan_barracks', 95, 95);
      this.placeDecor('spartan_spear_rack', 155, 95);
      this.placeDecor('spartan_helmet_rack', 200, 95);
      this.placeDecor('war_drum', 135, 132);
    }

    // 5. Delphi & Aufstieg zum Berg Olymp im Nordosten (K5+)
    if (state.chapter >= 5) {
      this.placeDecor('tholos_delphi', 565, 92);
      this.placeDecor('brazier_tripod', 530, 108);
      this.placeDecor('column_ionic', 630, 75);
      this.placeDecor('column_ionic', 690, 75);
    }

    // 6. Südosten: Küste & Hafen von Piräus
    this.placeDecor('fishing_boat', 695, 420);
    this.placeDecor('marble_bench', 645, 415);
    this.placeDecor('statue_bronze_hoplite', 495, 330);

    // 7. Autonome mediterrane Fauna mit proportionaler Skalierung nach Skill-Standard 1.1
    // Ziegen hüfthoch (~21px) bei 80px Frame -> scale: 0.24
    const goat1 = this.add.sprite(145, 465, 'animal_goat').setScale(0.24);
    this.wildlife.addAnimal({
      kind: 'goat',
      sprite: goat1,
      bounds: { minX: 90, maxX: 240, minY: 420, maxY: 510 },
      idleAnim: 'idle-goat',
      walkAnim: 'walk-goat',
    });
    const goat2 = this.add.sprite(185, 485, 'animal_goat').setScale(0.24);
    this.wildlife.addAnimal({
      kind: 'goat',
      sprite: goat2,
      bounds: { minX: 120, maxX: 260, minY: 440, maxY: 520 },
      idleAnim: 'idle-goat',
      walkAnim: 'walk-goat',
    });
    // Rinder (~30px) bei 80px Frame -> scale: 0.35
    const cow1 = this.add.sprite(110, 440, 'animal_cow').setScale(0.35);
    this.wildlife.addAnimal({
      kind: 'cow',
      sprite: cow1,
      bounds: { minX: 70, maxX: 190, minY: 400, maxY: 480 },
      idleAnim: 'idle-cow',
      walkAnim: 'walk-cow',
    });

    // Sperrliste für Wildlife: Tiere laufen nicht in Gebäude, Zisternen oder Feuer
    this.wildlife.addObstacle(230, 365, 32); // Olivenpresse
    this.wildlife.addObstacle(265, 430, 24); // Zisterne
    this.wildlife.addObstacle(215, 175, 26); // Lagerfeuer
    this.wildlife.addObstacle(345, 285, 30); // Griechische Villa
    this.wildlife.addObstacle(445, 325, 28); // Agora-Stand

    // 8. Schmetterlinge & Libellen über den Hainen & Küsten
    this.wildlife.spawnAmbientFliers(MAP_W * TILE, MAP_H * TILE);
  }

  private addNode(
    kind: Kind,
    x: number,
    y: number,
    tex: string,
    frame?: string | number,
    labelText?: string,
    color = '#f8fafc',
    scale = 1,
    alwaysVisible = false,
  ): Node {
    const spr = this.add.sprite(x, y, tex, frame);
    spr.setScale(scale);
    spr.setDepth(y + spr.displayHeight * 0.35);
    const label = labelText
      ? this.addLabel(x, y - spr.displayHeight * 0.5 - 6, labelText, color, alwaysVisible)
      : undefined;
    const node: Node = { kind, sprite: spr, label, readyAt: 0 };
    this.nodes.push(node);
    return node;
  }

  private placeGreekResources(): void {
    // Olivenbäume (geben Oliven + Olivenholz)
    const oliveSpots = [
      [115, 365],
      [165, 395],
      [95, 420],
      [215, 435],
    ];
    for (const [ox, oy] of oliveSpots) {
      this.addNode('res_oliven', ox, oy, 'olive_tree_1', undefined, '🫒 Olivenbaum', '#a3e635', 0.95);
    }

    // Kiefernholz / Bauholz
    const timberSpots = [
      [85, 295],
      [145, 315],
      [245, 295],
    ];
    for (const [tx, ty] of timberSpots) {
      this.addNode('res_holz', tx, ty, 'olive_tree_2', undefined, '🪵 Kiefernholz', '#fde047', 0.9);
    }

    // Heller Kalkstein
    const limestoneSpots = [
      [120, 250],
      [185, 255],
      [255, 245],
    ];
    for (const [lx, ly] of limestoneSpots) {
      this.addNode('res_kalkstein', lx, ly, 'objects', 'bigrock', '🪨 Kalkstein', '#e2e8f0', 0.9);
    }

    // Taygetos-Eisenerz (im Norden bei Sparta)
    const ironSpots = [
      [60, 155],
      [65, 205],
      [115, 215],
    ];
    for (const [ix, iy] of ironSpots) {
      const n = this.addNode('res_eisenerz', ix, iy, 'objects', 'bigrock', '⛏️ Taygetos-Eisenerz', '#cbd5e1', 0.88);
      n.sprite.setTint(0x64748b);
    }

    // Laureion-Silbererz (Mitte/Süden bei Athen)
    const silverSpots = [
      [355, 385],
      [395, 415],
    ];
    for (const [sx, sy] of silverSpots) {
      const n = this.addNode('res_silbererz', sx, sy, 'objects', 'bigrock', '🥈 Laureion-Silbererz', '#7dd3fc', 0.88);
      n.sprite.setTint(0xbae6fd);
    }

    // Parischer Marmor (nahe Akropolis & Delphi)
    const marbleSpots = [
      [515, 165],
      [555, 195],
    ];
    for (const [mx, my] of marbleSpots) {
      const n = this.addNode('res_marmor', mx, my, 'objects', 'bigrock', '🏛️ Weißer Marmor', '#ffffff', 0.9);
      n.sprite.setTint(0xf8fafc);
    }

    // Attischer Töpferton
    this.addNode('res_ton', 315, 435, 'amphora_black_painted', undefined, '🏺 Attischer Töpferton', '#fb923c', 0.95);
    this.addNode('res_ton', 345, 465, 'amphora_black_painted', undefined, '🏺 Attischer Töpferton', '#fb923c', 0.95);

    // Schaf- & Ziegenwolle an der Koppel
    this.addNode('res_wolle', 155, 505, 'stone_well', undefined, '🐑 Hirten-Wollkorb', '#f8fafc', 0.78);

    // Steinerne Zisterne (Quellwasser für die 6 Ackerbeete)
    this.addNode('cistern_water', 265, 430, 'cistern_pool', undefined, '💧 Zisterne: Quellwasser', '#38bdf8', 0.9);

    // Fischgründe am Ägäis-Strand
    this.addNode('fish_spot', 695, 495, 'fishing_boat', undefined, '🐟 Ägäis-Fischgrund', '#38bdf8', 0.85);

    // Spartanisches Lagerfeuer & Kochstelle
    this.addNode('campfire_cook', 215, 175, 'campfire_stone', undefined, '🔥 Lagerfeuer & Kessel', '#fb923c', 0.95);

    // Agora-Handelsstand (Taste H oder E)
    this.addNode('agora_stall', 445, 325, 'agora_stall_olives', undefined, '⚖️ Agora-Handel', '#fde047', 0.92);
  }

  private placeGreekBuildingsAndNPCs(): void {
    // 1. Die 6 Acker-Parzellen (5-Stufen-Agrarsystem im Attika-Tal)
    const plotCoords = [
      [215, 475],
      [245, 475],
      [275, 475],
      [215, 505],
      [245, 505],
      [275, 505],
    ];
    plotCoords.forEach(([px, py], idx) => {
      const n = this.addNode('plot', px, py, 'farm', 'soil_raw', `🌱 Ackerbeet ${idx + 1}`, '#bef264', 1);
      n.plotId = idx;
      n.sprite.setDepth(5);
      this.refreshPlotVisual(n);
    });

    // 2. Die 7 errichtbaren Gebäude (NUR wenn freigeschaltet oder bereits errichtet!)
    for (const b of state.buildingsData) {
      const isBuilt = state.hasBuilding(b.id);
      const isUnlocked = b.unlockedInChapter <= state.chapter;
      if (!isBuilt && !isUnlocked) continue;

      const n = this.addNode(
        'build_site',
        b.x,
        b.y,
        'farm',
        'sign_build',
        isBuilt ? `✅ ${b.name}` : `🏗️ Bauplatz: ${b.name}`,
        isBuilt ? '#4ade80' : '#fde047',
        1,
      );
      n.buildingDef = b;
      if (isBuilt) {
        this.renderBuiltGreekBuilding(n);
      }
    }

    // 3. Griechische Dorf-Helfer bei errichteten Bauwerken
    if (state.hasBuilding('olivenpresse')) {
      const n = this.addNode('npc_chloe', 295, 375, 'player_greek_female', 0, '🫒 Chloe (Olivenbäuerin)', '#a3e635', 1);
      (n.sprite as Phaser.GameObjects.Sprite).play('idle-greek-female-down');
    }
    if (state.hasBuilding('hafen_werft')) {
      const n = this.addNode('npc_glaukos', 685, 385, 'player_greek_male', 0, '⛵ Glaukos (Schiffszimmermann)', '#38bdf8', 1);
      (n.sprite as Phaser.GameObjects.Sprite).play('idle-greek-male-down');
    }
    if (state.hasBuilding('sparta_schmiede')) {
      const n = this.addNode('npc_brasidas', 140, 125, 'npc_guard', 0, '🛡️ Brasidas (Hoplit)', '#f87171', 1);
      (n.sprite as Phaser.GameObjects.Sprite).play('idle-guard');
    }

    // 4. Interaktive Spezial-Stationen (Kapitel-Gating!)
    if (state.chapter >= 2) {
      this.addNode('colony_ship', 715, 365, 'trireme_blue', undefined, '⛵ Kolonistenschiff', '#38bdf8', 0.92);
    }
    if (state.chapter >= 3) {
      this.addNode('training_dummy', 225, 130, 'training_dummy', undefined, '🛡️ Agoge-Übungsplatz', '#f87171', 0.95);
    }
    if (state.chapter >= 4) {
      this.placeDecor('pnyx_council', 465, 210);
    }
    if (state.chapter >= 5) {
      this.add.image(665, 118, 'olymp_rune_circle').setScale(0.8).setDepth(6);
      this.addNode('olymp_portal', 665, 110, 'olymp_orb_pedestal', undefined, '⚡ Wolkentor zum Berg Olymp', '#7dd3fc', 0.85);
    }
    if (state.chapter >= 6) {
      this.addNode('thermopylae_gate', 285, 65, 'thermopylae_gate', undefined, '🛡️ Pass der Thermopylen', '#f87171', 0.95);
      this.addNode('beacon_tower', 335, 68, 'watchtower_stone', undefined, '🔥 Signal-Wachturm', '#fb923c', 0.9);
      this.addNode('parthenon_goal', 425, 115, 'fire_altar_gold', undefined, '🏛️ Altar der Akropolis', '#fde047', 0.85);
    }
    if (state.chapter >= 7) {
      this.addNode('trireme_warship', 715, 445, 'trireme_red', undefined, '⚓ Kriegstrireme von Salamis', '#f87171', 0.95);
      this.addNode('pharos_lighthouse', 635, 495, 'lighthouse_pharos', undefined, '🗼 Pharos-Leuchtturm', '#fde047', 0.95);
    }
    if (state.chapter >= 8) {
      this.placeDecor('theater', 295, 118);
      this.placeDecor('academy_garden', 310, 215);
      this.addNode('theater_stage', 295, 152, 'brazier_tripod', undefined, '🎭 Bühne des Theaters', '#c084fc', 0.85);
    }
    if (state.chapter >= 9) {
      this.placeDecor('marble_archway', 535, 290);
      this.addNode('gordian_knot', 495, 295, 'chest_ornate', undefined, '🪢 Der Gordische Knoten', '#fde047', 0.9);
    }
    if (state.chapter >= 10) {
      this.addNode('babylon_legacy', 595, 325, 'statue_nike_gold', undefined, '👑 Alexanders Vermächtnis', '#fde047', 0.85);
    }

    // 5. Mentor des AKTUELLEN Kapitels (NUR ein Mentor gleichzeitig, Mindestabstand >= 44px!)
    const mentorDefs: Record<number, { kind: Kind; tex: string; anim: string; x: number; y: number; label: string }> = {
      1: { kind: 'npc_nikolaos', tex: 'npc_nikolaos', anim: 'idle-nikolaos', x: 395, y: 295, label: '🏛️ Dorfältester Nikolaos' },
      2: { kind: 'npc_telesikles', tex: 'npc_telesikles', anim: 'idle-telesikles', x: 645, y: 375, label: '⛵ Kapitän Telesikles' },
      3: { kind: 'npc_kleomenes', tex: 'npc_kleomenes', anim: 'idle-kleomenes', x: 195, y: 145, label: '🛡️ Ephor Kleomenes' },
      4: { kind: 'npc_perikles', tex: 'npc_perikles', anim: 'idle-perikles', x: 475, y: 240, label: '🦉 Staatsmann Perikles' },
      5: { kind: 'npc_pythia', tex: 'npc_pythia', anim: 'idle-pythia', x: 565, y: 130, label: '🔮 Priesterin Pythia' },
      6: { kind: 'npc_leonidas', tex: 'npc_leonidas', anim: 'idle-leonidas', x: 285, y: 115, label: '⚔️ König Leonidas' },
      7: { kind: 'npc_themistokles', tex: 'npc_themistokles', anim: 'idle-themistokles', x: 650, y: 445, label: '⚓ Stratege Themistokles' },
      8: { kind: 'npc_sokrates', tex: 'npc_sokrates', anim: 'idle-sokrates', x: 370, y: 175, label: '📜 Philosoph Sokrates' },
      9: { kind: 'npc_alexander', tex: 'npc_alexander', anim: 'idle-alexander', x: 535, y: 315, label: '👑 Alexander der Große' },
      10: { kind: 'npc_ptolemaios', tex: 'npc_ptolemaios', anim: 'idle-ptolemaios', x: 520, y: 395, label: '🏛️ Chronist Ptolemaios' },
    };

    const curMentor = mentorDefs[state.chapter];
    if (curMentor) {
      const n = this.addNode(curMentor.kind, curMentor.x, curMentor.y, curMentor.tex, 0, curMentor.label, '#fde047', 1);
      (n.sprite as Phaser.GameObjects.Sprite).play(curMentor.anim);
    }
  }

  private placeGreekRelics(): void {
    const relicCoords: Array<{ kind: Kind; id: string; x: number; y: number; title: string; minChapter: number }> = [
      { kind: 'relic_amphore', id: 'relic_amphore', x: 185, y: 355, title: '🏺 Preisamphore', minChapter: 1 },
      { kind: 'relic_agamemnon', id: 'relic_agamemnon', x: 65, y: 140, title: '🎭 Maske von Mykene', minChapter: 3 },
      { kind: 'relic_eule', id: 'relic_eule', x: 420, y: 405, title: '🦉 Eulen-Tetradrachme', minChapter: 4 },
      { kind: 'relic_antikythera', id: 'relic_antikythera', x: 695, y: 525, title: '⚙️ Antikythera-Werk', minChapter: 7 },
      { kind: 'relic_alexander', id: 'relic_alexander', x: 615, y: 275, title: '👑 Alexander-Büste', minChapter: 9 },
    ];

    for (const r of relicCoords) {
      if (state.chapter < r.minChapter) continue;
      if (state.relicsFound.includes(r.id)) continue;

      // In-World-Marker (relic_marker_glow): Organischer Entdeckungsort mit Glanz und Schwebepartikeln
      const aura = this.add.circle(r.x, r.y + 4, 13, 0xfacc15, 0.4).setDepth(r.y - 1);
      this.tweens.add({
        targets: aura,
        scaleX: 1.25,
        scaleY: 1.25,
        alpha: 0.15,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      const spark1 = this.add
        .text(r.x - 9, r.y - 10, '✦', { fontSize: '9px', color: '#fef08a' })
        .setDepth(r.y + 10);
      const spark2 = this.add
        .text(r.x + 8, r.y - 6, '✧', { fontSize: '8px', color: '#fde047' })
        .setDepth(r.y + 10);
      this.tweens.add({
        targets: [spark1, spark2],
        y: '-=4',
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const n = this.addNode(r.kind, r.x, r.y, r.id, undefined, r.title, '#facc15', 0.72);
      (n as any).glowObjects = [aura, spark1, spark2];
      this.tweens.add({
        targets: n.sprite,
        y: r.y - 3,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private renderBuiltGreekBuilding(n: Node): void {
    const b = n.buildingDef;
    if (!b) return;
    if (n.builtSprite) n.builtSprite.destroy();

    const spriteMap: Record<string, string> = {
      olivenpresse: 'olive_press',
      hafen_werft: 'trireme_ship',
      sparta_schmiede: 'spartan_hall',
      pnyx_buehne: 'small_temple_blue',
      zeus_altar: 'fire_altar_gold',
      akademie_stube: 'small_temple_red',
      bibliothek_alexandria: 'parthenon_gold',
    };

    const tex = spriteMap[b.id] || 'small_temple_blue';
    const scale = b.id === 'bibliothek_alexandria' ? 0.65 : 0.9;
    n.sprite.setVisible(false);
    n.builtSprite = this.add
      .image(n.sprite.x, n.sprite.y - 6, tex)
      .setScale(scale)
      .setDepth(n.sprite.y + 18);
    if (n.label) {
      n.label.setText(`✅ ${b.name} (E)`);
      n.label.setColor('#4ade80');
    }
  }

  private refreshPlotVisual(n: Node): void {
    if (n.plotId === undefined) return;
    const p = state.plots[n.plotId];
    if (n.cropSprite) {
      n.cropSprite.destroy();
      n.cropSprite = undefined;
    }

    if (p.stage === 'raw') {
      n.sprite.setTexture('farm', 'soil_raw');
      n.label?.setText(`🌱 Rohboden #${n.plotId + 1}: Hacken (E)`);
    } else if (p.stage === 'tilled') {
      n.sprite.setTexture('farm', 'soil_dry');
      n.label?.setText(`🌾 Gelockert #${n.plotId + 1}: Säen (E)`);
    } else if (p.stage === 'seeded') {
      n.sprite.setTexture('farm', 'soil_dry');
      n.label?.setText(`💧 Gesät #${n.plotId + 1}: Bewässern (E)`);
    } else if (p.stage === 'watered') {
      n.sprite.setTexture('farm', 'soil_wet');
      n.label?.setText(`⏳ Gewässert #${n.plotId + 1} (reift...)`);
    } else if (p.stage === 'ripe') {
      n.sprite.setTexture('farm', 'soil_wet');
      n.cropSprite = this.add
        .image(n.sprite.x, n.sprite.y - 8, 'farm', 'wheat_ripe')
        .setDepth(n.sprite.y + 10);
      n.label?.setText(`🌾 Reife Gerste #${n.plotId + 1}: Ernten (E)!`);
    }
  }

  private addLabel(
    x: number,
    y: number,
    text: string,
    color = '#ffffff',
    alwaysVisible = false,
  ): DomLabel {
    const el = document.createElement('div');
    el.className = 'world-label floating-nameplate';
    el.textContent = text;
    el.style.color = color;
    this.labelLayer.appendChild(el);

    const lbl: DomLabel = {
      x,
      y,
      el,
      alwaysVisible,
      isQuestTarget: false,
      setText(t: string) {
        this.el.textContent = t;
        return this;
      },
      setColor(c: string) {
        this.el.style.color = c;
        return this;
      },
      setY(ny: number) {
        this.y = ny;
        return this;
      },
      setPosition(nx: number, ny: number) {
        this.x = nx;
        this.y = ny;
        return this;
      },
    };
    this.domLabels.push(lbl);
    return lbl;
  }

  update(time: number, delta: number): void {
    // Toggle F3 Debug-Overlay
    if (Phaser.Input.Keyboard.JustDown(this.wasd.F3)) {
      this.debugMode = !this.debugMode;
      state.emit('toast', this.debugMode ? '🛠️ F3 Debug-Overlay: AN' : '🛠️ F3 Debug-Overlay: AUS');
    }

    // Wasser-Glitzern auf der Ägäis
    for (let i = 0; i < this.waterShimmers.length; i++) {
      const sh = this.waterShimmers[i];
      sh.alpha = 0.25 + 0.35 * Math.sin(time * 0.003 + i);
    }

    // Ressourcen-Regeneration & Acker-Reifung
    const now = Date.now();
    for (const n of this.nodes) {
      if (n.readyAt > 0 && now >= n.readyAt) {
        n.readyAt = 0;
        n.sprite.setAlpha(1);
      }
      if (n.kind === 'plot' && n.plotId !== undefined) {
        const p = state.plots[n.plotId];
        if (p.stage === 'watered' && now - p.wateredAt >= CROP_MS) {
          p.stage = 'ripe';
          this.refreshPlotVisual(n);
          state.emit('toast', `🌾 Ackerbeet #${n.plotId + 1} ist reif zur Gerstenernte!`);
        }
      }
    }

    // Autonome Tier-KI & Fauna über WildlifeManager
    this.wildlife.update(delta, this.player.x, this.player.y, MAP_W * TILE, MAP_H * TILE);

    if (state.modal || this.sleeping || this.transitioningOlymp) {
      this.player.setVelocity(0, 0);
      this.syncDomLabels();
      return;
    }

    // Sanfter Tag-/Nacht-Zyklus & Status-Drift (Schulstunden-optimiert, kein Permadeath)
    state.playTimeSec += delta / 1000;
    state.dayTime = (state.dayTime + delta / DAY_MS) % 1;
    const isNight = state.dayTime > 0.72 || state.dayTime < 0.05;
    this.nightOverlay.setAlpha(isNight ? 0.32 : 0);

    const hungerRate = state.playerRole === 'sailor' ? 0.00008 : 0.00012;
    state.food = Math.max(0, state.food - delta * hungerRate);
    state.safety = Math.max(0, state.safety - delta * (isNight ? 0.00016 : 0.00005));

    if (state.food <= 0 || state.safety <= 0) {
      this.rescueAtCampfire();
      return;
    }

    // Bewegung (Tastatur + Touch-Joystick)
    const tv = state.touch?.vector;
    const left = this.cursors.left.isDown || this.wasd.A.isDown || (tv ? tv.x < -0.25 : false);
    const right =
      this.cursors.right.isDown || this.wasd.D.isDown || (tv ? tv.x > 0.25 : false);
    const up = this.cursors.up.isDown || this.wasd.W.isDown || (tv ? tv.y < -0.25 : false);
    const down = this.cursors.down.isDown || this.wasd.S.isDown || (tv ? tv.y > 0.25 : false);

    const spd = state.playerRole === 'sailor' ? SPEED * 1.2 : SPEED;
    let vx = 0;
    let vy = 0;
    if (left) {
      vx = -spd;
      this.facing = 'left';
    } else if (right) {
      vx = spd;
      this.facing = 'right';
    }
    if (up) {
      vy = -spd;
      this.facing = 'up';
    } else if (down) {
      vy = spd;
      this.facing = 'down';
    }
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);
    this.player.setDepth(this.player.y + 16);

    if (vx !== 0 || vy !== 0) {
      state.distanceMeters += (Math.hypot(vx, vy) * (delta / 1000)) / 12;
    }

    const genderKey = state.playerGender === 'female' ? 'female' : 'male';
    if (vx !== 0 || vy !== 0) {
      this.player.anims.play(`walk-greek-${genderKey}-${this.facing}`, true);
    } else {
      this.player.anims.play(`idle-greek-${genderKey}-${this.facing}`, true);
    }

    if (this.playerLabel) {
      this.playerLabel.setPosition(this.player.x, this.player.y - 22);
    }

    // Interaktions-Erkennung
    const nearest = this.findNearestNode();
    if (nearest && nearest.label) {
      state.hint = nearest.label.el.textContent || 'Drücke E zum Interagieren';
    } else {
      state.hint = '';
    }

    const justActed =
      Phaser.Input.Keyboard.JustDown(this.wasd.E) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.SPACE) ||
      Boolean(state.touch?.consumeAction());

    if (justActed && Date.now() - state.lastModalClose > 250) {
      if (nearest) {
        this.interact(nearest);
      } else {
        this.tryTameLuredAnimal();
      }
    }

    this.saveTimer += delta;
    if (this.saveTimer > 8000) {
      this.saveTimer = 0;
      this.persist();
    }

    this.updateCompass();
    this.syncDomLabels();
    this.drawDebugOverlay();
  }

  private tryTameLuredAnimal(): void {
    const hasFeed = state.count('gerste') > 0 || state.count('oliven') > 0;
    if (!hasFeed) return;
    state.goatTamed = true;
    state.add('wolle', 2);
    state.add('ziegenkaese', 1);
    state.bump('wolle_gathered', 2);
    sfx.quest();
    state.emit('toast', '🐐 Bergziege gefüttert & gezähmt: +2 Wolle & +1 Ziegenkäse!');
  }

  private rescueAtCampfire(): void {
    this.sleeping = true;
    state.collapses++;
    state.food = 75;
    state.safety = 85;
    state.dayTime = 0.08;
    state.daysSurvived++;
    // Didaktischer Schlaf-Beschleuniger: gegossene Felder reifen über Nacht!
    for (const p of state.plots) {
      if (p.stage === 'watered') p.stage = 'ripe';
    }
    this.nodes.filter((n) => n.kind === 'plot').forEach((n) => this.refreshPlotVisual(n));
    this.player.setPosition(395, 305);
    this.sleeping = false;
    state.emit(
      'toast',
      '🌅 Du hast dich auf der Agora ausgeruht und startest gestärkt in den neuen Tag!',
    );
    this.persist();
  }

  private findNearestNode(): Node | null {
    let best: Node | null = null;
    let bestDist = REACH;
    for (const n of this.nodes) {
      if (n.readyAt > Date.now()) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.sprite.x, n.sprite.y);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    return best;
  }

  private interact(n: Node): void {
    // 1. Archäologische Leit-Relikte (5 Funde mit 3-Optionen-Quiz)
    if (n.kind.startsWith('relic_')) {
      const relicId = n.kind;
      const def = GREEK_RELICS[relicId];
      if (!def) return;
      if (!state.relicsFound.includes(relicId)) {
        state.relicsFound.push(relicId);
      }
      if ((n as any).glowObjects) {
        (n as any).glowObjects.forEach((obj: any) => obj?.destroy?.());
      }
      n.label?.el.remove();
      this.domLabels = this.domLabels.filter((l) => l !== n.label);
      n.sprite.destroy();
      this.nodes = this.nodes.filter((item) => item !== n);
      sfx.fanfare();
      state.persist();
      state.emit('openRelicModal', relicId);
      return;
    }

    // 2. Rohstoffe abbauen / sammeln
    if (n.kind === 'res_oliven') {
      n.readyAt = Date.now() + REGROW_MS;
      n.sprite.setAlpha(0.45);
      state.add('oliven', 2);
      state.add('holz', 1);
      state.bump('oliven_picked', 2);
      state.bump('holz_chopped', 1);
      state.unlockLexicon('olivenbaum');
      state.emit('toast', '🫒 +2 Attische Oliven & +1 Olivenholz geerntet!');
      return;
    }
    if (n.kind === 'res_holz') {
      n.readyAt = Date.now() + REGROW_MS;
      n.sprite.setAlpha(0.45);
      state.add('holz', 2);
      state.bump('holz_chopped', 2);
      state.emit('toast', '🪵 +2 Kiefernholz geschlagen!');
      return;
    }
    if (n.kind === 'res_kalkstein') {
      n.readyAt = Date.now() + REGROW_MS;
      n.sprite.setAlpha(0.45);
      state.add('kalkstein', 2);
      state.bump('kalkstein_mined', 2);
      state.emit('toast', '🪨 +2 Hellen Kalkstein gebrochen!');
      return;
    }
    if (n.kind === 'res_eisenerz') {
      n.readyAt = Date.now() + REGROW_MS;
      n.sprite.setAlpha(0.45);
      state.add('eisenerz', 2);
      state.bump('iron_mined', 2);
      state.emit('toast', '⛏️ +2 Taygetos-Eisenerz abgebaut!');
      return;
    }
    if (n.kind === 'res_silbererz') {
      n.readyAt = Date.now() + REGROW_MS;
      n.sprite.setAlpha(0.45);
      state.add('silbererz', 2);
      state.bump('silver_mined', 2);
      state.unlockLexicon('drachme_laureion');
      state.emit('toast', '🥈 +2 Laureion-Silbererz geborgen!');
      return;
    }
    if (n.kind === 'res_marmor') {
      n.readyAt = Date.now() + REGROW_MS;
      n.sprite.setAlpha(0.45);
      state.add('marmor', 2);
      state.bump('marble_mined', 2);
      state.unlockLexicon('akropolis');
      state.emit('toast', '🏛️ +2 Parischen Marmor gebrochen!');
      return;
    }
    if (n.kind === 'res_ton') {
      n.readyAt = Date.now() + REGROW_MS;
      n.sprite.setAlpha(0.45);
      state.add('ton', 2);
      state.bump('clay_dug', 2);
      state.emit('toast', '🏺 +2 Attischen Töpferton gestochen!');
      return;
    }
    if (n.kind === 'res_wolle') {
      n.readyAt = Date.now() + REGROW_MS;
      n.sprite.setAlpha(0.5);
      state.add('wolle', 2);
      state.bump('wolle_gathered', 2);
      state.emit('toast', '🐑 +2 Schaf- & Ziegenwolle gesammelt!');
      return;
    }
    if (n.kind === 'cistern_water') {
      state.add('wasser', 2);
      state.bump('cistern_water', 1);
      state.emit('toast', '💧 +2 Quellwasser-Krüge an der Zisterne geschöpft!');
      return;
    }
    if (n.kind === 'fish_spot') {
      state.add('fisch', 2);
      state.bump('caught_fish', 1);
      state.emit('toast', '🐟 +2 Ägäis-Meerbrassen gefangen!');
      return;
    }

    // 3. Lagerfeuer: Kochen (Blutsuppe / Fisch) + Didaktischer Schlaf-Beschleuniger
    if (n.kind === 'campfire_cook') {
      if (state.chapter === 3 && state.count('blutsuppe') === 0) {
        state.add('blutsuppe', 1);
        state.bump('cooked_blutsuppe', 1);
        state.safety = 100;
        sfx.craft();
        state.emit('toast', '🍲 Spartanische Blutsuppe (Melas Zomos) am Feuer gekocht!');
        return;
      }
      if (state.count('fisch') > 0) {
        state.add('fisch', -1);
        state.add('gebratener_fisch', 1);
        sfx.craft();
        state.emit('toast', '🐟 Gegrillten Mittelmeerfisch zubereitet!');
        return;
      }
      // Schlafen am Feuer -> Nacht überspringen & gegossene Felder reifen sofort!
      state.safety = 100;
      state.dayTime = 0.08;
      state.daysSurvived++;
      for (const p of state.plots) {
        if (p.stage === 'watered') p.stage = 'ripe';
      }
      this.nodes.filter((nd) => nd.kind === 'plot').forEach((nd) => this.refreshPlotVisual(nd));
      sfx.quest();
      state.emit('toast', '🌅 Ausgeruht! Es ist Morgen und alle gegossenen Felder sind gereift!');
      return;
    }

    // 4. Agora-Handelsstand
    if (n.kind === 'agora_stall') {
      state.unlockLexicon('agora');
      state.emit('openTradeModal');
      return;
    }

    // 5. 5-Stufen-Agrar-Beet
    if (n.kind === 'plot') {
      this.interactPlot(n);
      return;
    }

    // 6. Bauplatz
    if (n.kind === 'build_site') {
      this.interactBuilding(n);
      return;
    }

    // 7. Wolkentor zum Berg Olymp (Dual-Scene-Muster: scene.sleep / scene.run)
    if (n.kind === 'olymp_portal') {
      this.enterOlymp();
      return;
    }

    // 8. Kapitel-Spezialstationen (K2 bis K10)
    if (n.kind === 'colony_ship') {
      if (state.count('amphore') > 0 && state.count('fackel') > 0) {
        state.bump('colony_ship_equipped', 1);
        state.unlockLexicon('apoikie');
        sfx.fanfare();
        state.openDialog({
          speaker: 'Kolonistenschiff im Hafen von Piräus',
          nodes: [
            {
              text: '⛵ <strong>Das Schiff ist bereit für die Große Kolonisation!</strong>\n\nDu hast bemalte Amphoren voller Olivenöl verstaut und die heilige Fackel aus dem Prytaneion der Mutterstadt (Metropolis) an Bord gebracht. Die Segel blähen sich Richtung Sizilien und Massalia!',
            },
          ],
        });
      } else {
        state.emit(
          'toast',
          '⛵ Stelle erst 1× Amphore und 1× Heilige Fackel im Handwerk (Taste C) her!',
        );
      }
      return;
    }

    if (n.kind === 'training_dummy') {
      if (state.count('aspis_schild') > 0 && state.count('dory_speer') > 0) {
        state.bump('phalanx_trained', 1);
        state.unlockLexicon('hoplit_phalanx');
        sfx.fanfare();
        state.openDialog({
          speaker: 'Agoge-Übungsplatz von Sparta',
          nodes: [
            {
              text: '🛡️ <strong>Schild an Schild in der Phalanx!</strong>\n\nMit deinem schweren Rundschild (Aspis) deckst du die linke Flanke deines Nebenmannes, während dein eiserner Speer (Dory) nach vorne ragt. Du bist bereit für die Prüfung bei Ephor Kleomenes!',
            },
          ],
        });
      } else {
        state.emit(
          'toast',
          '🛡️ Schmiede erst Hoplitenschild (Aspis) und Speer (Dory) im Handwerk (Taste C)!',
        );
      }
      return;
    }

    if (n.kind === 'thermopylae_gate') {
      if (state.count('kalkstein') >= 2 || state.counts['thermopylae_fortified']) {
        if (!state.counts['thermopylae_fortified'] && state.count('kalkstein') >= 2) {
          state.add('kalkstein', -2);
        }
        state.bump('thermopylae_fortified', 1);
        state.unlockLexicon('thermopylen');
        sfx.craft();
        state.emit('toast', '🛡️ Phokische Mauer am Engpass der Thermopylen verstärkt!');
      } else {
        state.emit('toast', '🪨 Du brauchst 2× Kalkstein zum Verstärken der Passmauer!');
      }
      return;
    }

    if (n.kind === 'beacon_tower') {
      if (state.count('fackel') > 0 || state.counts['beacon_lit']) {
        state.bump('beacon_lit', 1);
        sfx.fanfare();
        state.emit(
          'toast',
          '🔥 Signalfeuer auf dem Wachturm entzündet! Laufe nun zur Akropolis von Athen!',
        );
      } else {
        state.emit('toast', '🔥 Binde erst eine Fackel im Handwerksmenü (Taste C)!');
      }
      return;
    }

    if (n.kind === 'parthenon_goal') {
      state.bump('marathon_run_done', 1);
      state.unlockLexicon('perserkriege_marathon');
      sfx.fanfare();
      state.openDialog({
        speaker: 'Akropolis von Athen – Der Eilbotenlauf',
        nodes: [
          {
            text: '🏃‍♂️ <strong>„Nenikekamen – Wir haben gesiegt!“</strong>\n\nWie einst der legendäre Läufer von Marathon hast du die Botschaft rechtzeitig nach Athen überbracht! Kehre nun zu König Leonidas zurück.',
          },
        ],
      });
      return;
    }

    if (n.kind === 'trireme_warship') {
      if (state.count('rammsporn') > 0 || state.counts['trireme_armed']) {
        state.bump('trireme_armed', 1);
        state.unlockLexicon('trireme_salamis');
        sfx.craft();
        state.emit(
          'toast',
          '⚓ Bronzener Rammsporn (Embolon) am Bug der Trireme montiert! Weiter zum Leuchtturm!',
        );
      } else {
        state.emit(
          'toast',
          '⚓ Gieße erst den bronzenen Rammsporn (Embolon) im Handwerk (Taste C)!',
        );
      }
      return;
    }

    if (n.kind === 'pharos_lighthouse') {
      if (state.chapter === 7) {
        state.bump('salamis_victory', 1);
        sfx.fanfare();
        state.openDialog({
          speaker: 'Meerenge von Salamis (480 v. Chr.)',
          nodes: [
            {
              text: '⚓ <strong>Triumph in der Meerenge von Salamis!</strong>\n\nDie riesige persische Flotte hat sich im engen Kanal verkeilt! Auf drei Ruderetagen schlagen die 170 freien Bürger Athens die Ruder ins Wasser – die wendigen Triremen durchbrechen die feindliche Linie!',
            },
          ],
        });
      } else if (state.chapter >= 9) {
        state.bump('pharos_lit', 1);
        state.unlockLexicon('hellenismus');
        sfx.fanfare();
        state.openDialog({
          speaker: 'Der Pharos von Alexandria – Weltwunder der Antike',
          nodes: [
            {
              text: '🗼 <strong>Das Leuchtfeuer von Alexandria strahlt weit übers Mittelmeer!</strong>\n\nMit über 100 Metern Höhe weist der Leuchtturm Schiffen aus aller Welt den Weg in die neue hellenistische Metropole!',
            },
          ],
        });
      } else {
        state.emit('toast', '🗼 Der große Hafen-Leuchtturm wacht über die Ägäis.');
      }
      return;
    }

    if (n.kind === 'theater_stage') {
      if (state.count('theatermaske') > 0 || state.counts['drama_performed']) {
        state.bump('drama_performed', 1);
        state.unlockLexicon('philosophie');
        sfx.fanfare();
        state.openDialog({
          speaker: 'Dionysos-Theater von Athen',
          nodes: [
            {
              text: '🎭 <strong>Tragödie im Halbrund des Theaters!</strong>\n\nVor zehntausend Bürgern führst du mit der charaktervollen Tonmaske ein Stück über Hybris (Hochmut), die Schrecken des Peloponnesischen Bruderkriegs und die Suche nach Weisheit auf!',
            },
          ],
        });
      } else {
        state.emit('toast', '🎭 Forme erst eine Antike Theatermaske im Handwerk (Taste C)!');
      }
      return;
    }

    if (n.kind === 'gordian_knot') {
      if (state.count('sarissa_lanze') > 0 || state.counts['gordian_knot_cut']) {
        state.bump('gordian_knot_cut', 1);
        state.unlockLexicon('alexander_der_grosse');
        sfx.fanfare();
        state.openDialog({
          speaker: 'Der Gordische Knoten',
          nodes: [
            {
              text: '⚔️ <strong>Mit einem einzigen kühnen Streich gelöst!</strong>\n\nDie alte Prophezeiung besagte: Wer den unlösbaren Knoten am Königswagen von Gordion löst, wird Herrscher über ganz Asien! Der Weg bis nach Babylon und zum Indus ist frei!',
            },
          ],
        });
      } else {
        state.emit('toast', '⚔️ Fertige erst die Makedonische Sarissa im Handwerk (Taste C)!');
      }
      return;
    }

    if (n.kind === 'babylon_legacy') {
      state.bump('legacy_inspected', 1);
      state.unlockLexicon('diadochenreiche');
      sfx.quest();
      state.openDialog({
        speaker: 'Das Vermächtnis von Babylon (323 v. Chr.)',
        nodes: [
          {
            text: '👑 <strong>„Dem Stärksten!“</strong>\n\nMit nur 32 Jahren starb Alexander der Große in Babylon. Seine Generäle – die Diadochen – teilen das riesige Reich in drei Großreiche auf: Makedonien (Antigoniden), Vorderasien (Seleukiden) und Ägypten (Ptolemäer). Zeichne nun die Weltkarte des Hellenismus im Handwerk (Taste C)!',
          },
        ],
      });
      return;
    }

    // 9. Griechische Dorf-Helfer
    if (n.kind === 'npc_chloe') {
      state.openDialog({
        speaker: 'Chloe – Bäuerin im Attika-Tal',
        nodes: [
          {
            text: 'Chaire! Die Olivenpressen laufen auf Hochtouren. Das goldene Olivenöl und die süßen Feigen sind unser ganzer Stolz!',
          },
        ],
      });
      return;
    }
    if (n.kind === 'npc_glaukos') {
      state.openDialog({
        speaker: 'Glaukos – Schiffszimmermann von Piräus',
        nodes: [
          {
            text: 'Chaire! Mit Kiefernholz und Pech dichten wir die Rümpfe ab. Unsere Triremen bezwingen jedes Unwetter auf der Ägäis!',
          },
        ],
      });
      return;
    }
    if (n.kind === 'npc_brasidas') {
      state.openDialog({
        speaker: 'Brasidas – Spartiaten-Krieger',
        nodes: [
          {
            text: 'Lakonische Disziplin und harter Drill! Erst in der Phalanx zeigt sich, wer ein wahrer Krieger ist. Kehre mit deinem Schild zurück oder auf ihm!',
          },
        ],
      });
      return;
    }

    // 10. Die 10 Kapitel-Mentoren
    const mentorMap: Record<string, number> = {
      npc_nikolaos: 1,
      npc_telesikles: 2,
      npc_kleomenes: 3,
      npc_perikles: 4,
      npc_pythia: 5,
      npc_leonidas: 6,
      npc_themistokles: 7,
      npc_sokrates: 8,
      npc_alexander: 9,
      npc_ptolemaios: 10,
    };

    const mCh = mentorMap[n.kind];
    if (mCh) {
      this.interactMentor(mCh);
    }
  }

  private interactMentor(mentorCh: number): void {
    const chDef = state.chapters[mentorCh];
    if (!chDef) return;

    // Falls der Schüler einen Mentor eines späteren Kapitels anspricht, bieten wir an, direkt in dieses Kapitel zu wechseln oder beim aktuellen Kapitel zu bleiben
    if (state.chapter !== mentorCh) {
      state.openDialog({
        speaker: `${chDef.mentor} (${chDef.title})`,
        nodes: [
          {
            text: `Chaire, ${state.playerName}! Ich begleite dich in <strong>${chDef.title}</strong> (${chDef.period}). Aktuell bist du in Kapitel ${state.chapter}. Du kannst im Pause-Menü (Taste P) jederzeit zwischen allen 10 Kapiteln wechseln!`,
          },
        ],
      });
      return;
    }

    const q = state.quest;

    // 1. Kapitel-Start (Intro-Dialog)
    if (q === 0) {
      state.openDialog({
        speaker: `${chDef.mentor} – ${chDef.mentorRole}`,
        nodes: [
          ...chDef.intro,
          {
            text: `📋 <strong>Deine erste Aufgabe:</strong>\n${chDef.quests[1]}\n\n💡 <em>Tipp: ${chDef.hints[1]}</em>`,
          },
        ],
        onDone: () => {
          state.quest = 1;
          state.checkQuest();
          state.emit('quest');
          state.persist();
          this.updateCompass();
        },
      });
      return;
    }

    // 2. Alle Aufgaben erledigt -> Wissens-Prüfung (Quiz) des Kapitels!
    if (state.isReadyForQuiz()) {
      state.openDialog({
        speaker: `${chDef.mentor} – Wissens-Prüfung (Kapitel ${mentorCh}/10)`,
        nodes: chDef.quiz as any,
        onDone: () => {
          state.quest = chDef.quests.length;
          state.persist();
          state.emit('chapterDone', mentorCh);
        },
      });
      return;
    }

    // 3. Kapitel bereits abgeschlossen -> Weiter zum nächsten Kapitel (oder Urkunde bei K10)
    if (state.isChapterComplete()) {
      if (mentorCh < 10) {
        state.startChapter(mentorCh + 1);
      } else {
        state.emit('openCertificate');
      }
      return;
    }

    // 4. Zwischenhinweis zur laufenden Aufgabe
    state.checkQuest();
    if (state.isReadyForQuiz()) {
      this.interactMentor(mentorCh);
      return;
    }

    const curQuest = chDef.quests[state.quest] || '';
    const curHint = chDef.hints[state.quest] || '';
    state.openDialog({
      speaker: chDef.mentor,
      nodes: [
        {
          text: `📋 <strong>Aktuelle Aufgabe (${state.quest}/${chDef.quests.length - 1}):</strong>\n${curQuest}\n\n💡 <em>Hinweis: ${curHint}</em>`,
        },
      ],
    });
  }

  private interactPlot(n: Node): void {
    if (n.plotId === undefined) return;
    const p = state.plots[n.plotId];
    if (p.stage === 'raw') {
      p.stage = 'tilled';
      this.refreshPlotVisual(n);
      sfx.craft();
      state.emit('toast', '🌱 Steiniger Boden mit der Hacke gelockert! Drücke nochmals E zum Säen.');
    } else if (p.stage === 'tilled') {
      p.stage = 'seeded';
      this.refreshPlotVisual(n);
      sfx.craft();
      state.bump('seeded_plot', 1);
      state.emit('toast', '🌾 Gersten-Saatgut in die Furchen eingebracht! Jetzt bewässern (E).');
    } else if (p.stage === 'seeded') {
      if (state.count('wasser') <= 0) {
        state.emit('toast', '💧 Schöpfe erst Quellwasser an der Zisterne nördlich der Beete (E)!');
        return;
      }
      state.add('wasser', -1);
      p.stage = 'watered';
      p.wateredAt = Date.now();
      this.refreshPlotVisual(n);
      sfx.craft();
      state.bump('watered_plot', 1);
      state.emit('toast', '💧 Ackerbeet mit frischem Quellwasser gewässert!');
    } else if (p.stage === 'watered') {
      // Sofortige Reifung per E-Druck ermöglichen, damit im Unterricht niemand warten muss
      p.stage = 'ripe';
      this.refreshPlotVisual(n);
      sfx.quest();
      state.emit('toast', '☀️ Unter der Sonne Hellas’ ist die Gerste herangereift! Drücke E zum Ernten.');
    } else if (p.stage === 'ripe') {
      p.stage = 'tilled'; // Gemäß Skill 4 Stufe 3: setzt sich nach Ernte auf Stufe 2 (gelockerter Boden) zurück!
      this.refreshPlotVisual(n);
      state.add('gerste', 3);
      state.add('samen', 1);
      state.bump('harvested_gerste', 1);
      sfx.pickup();
      state.emit('toast', '🌾 Ernte eingebracht: +3 Reife Gerste & +1 Saatgut!');
    }
    state.persist();
  }

  private interactBuilding(n: Node): void {
    const b = n.buildingDef;
    if (!b) return;
    if (state.hasBuilding(b.id)) {
      if (b.id === 'pnyx_buehne') {
        if (state.count('ostrakon') > 0 || state.counts['ekklesia_voted']) {
          state.bump('ekklesia_voted', 1);
          state.unlockLexicon('ostrakismos');
          sfx.fanfare();
          state.openDialog({
            speaker: 'Volksversammlung (Ekklesia) & Scherbengericht auf der Pnyx',
            nodes: [
              {
                text: '🏺 <strong>Du wirfst dein Ostrakon in die Wahlurne!</strong>\n\nÜber 6.000 athenische Bürger haben abgestimmt: Wer der Freiheit und Demokratie gefährlich wird, muss die Polis für 10 Jahre verlassen. Sprich nun mit Staatsmann Perikles!',
              },
            ],
          });
        } else {
          state.emit('toast', '🏺 Ritze erst ein Ostrakon (Tonscherbe) im Handwerk (Taste C)!');
        }
        return;
      }
      if (b.id === 'bibliothek_alexandria') {
        if (state.count('diadochen_karte') > 0 || state.counts['map_archived']) {
          state.bump('map_archived', 1);
          state.unlockLexicon('hellenismus');
          sfx.fanfare();
          state.openDialog({
            speaker: 'Große Bibliothek von Alexandria',
            nodes: [
              {
                text: '📜 <strong>Die Weltkarte des Hellenismus ist archiviert!</strong>\n\nNeben hunderttausenden Schriftrollen von Homer, Platon, Aristoteles und Euklid ruht nun deine Karte der Diadochenreiche im Museion von Alexandria. Kehre zu Chronist Ptolemaios zurück!',
              },
            ],
          });
        } else {
          state.emit('toast', '🏛️ Große Bibliothek von Alexandria: Öffne das Handwerk mit Taste C.');
        }
        return;
      }
      state.emit('toast', `🏛️ ${b.name}: Öffne das Handwerksmenü mit Taste C!`);
      return;
    }

    if (!state.canAffordBuilding(b)) {
      const costStr = Object.entries(state.getBuildingCost(b))
        .map(([id, num]) => {
          const itemDef = state.itemsData[id as GreekItemId];
          return `${num}× ${itemDef ? itemDef.name : id}`;
        })
        .join(', ');
      state.openDialog({
        speaker: `Bauplatz: ${b.name}`,
        nodes: [
          {
            text: `${b.desc}\n\n🔨 <strong>Benötigte Baustoffe:</strong>\n${costStr}`,
          },
        ],
      });
      return;
    }

    state.build(b);
    this.renderBuiltGreekBuilding(n);
    state.emit('toast', `🏛️ Bauwerk vollendet: ${b.name}!`);
    state.persist();
  }

  /** Dual-Scene-Wechsel auf den Berg Olymp (Skill 5.2.1: scene.sleep / scene.run). */
  public enterOlymp(): void {
    if (this.transitioningOlymp) return;
    this.transitioningOlymp = true;
    state.bump('olymp_entered', 1);
    state.unlockLexicon('olymp_goetter');
    sfx.cave();
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.persist();
      this.scene.sleep('World');
      this.scene.run('Olymp');
    });
  }

  private onCraft(): void {
    this.persist();
  }

  private onChapterChanged(ch: number): void {
    bgm.playChapter(ch);
    this.labelLayer.innerHTML = '';
    this.scene.restart();
  }

  private onProfileChanged(): void {
    if (this.playerLabel) {
      this.playerLabel.setText(state.playerName);
    }
    if (this.player) {
      const texKey =
        state.playerGender === 'female' ? 'player_greek_female' : 'player_greek_male';
      this.player.setTexture(texKey, 0);
    }
  }

  private syncDomLabels(): void {
    const cam = this.cameras.main;
    const rect = this.game.canvas.getBoundingClientRect();
    const scaleX = rect.width / cam.width;
    const scaleY = rect.height / cam.height;

    // 1. Spieler-Name immer sauber am Kopf führen
    if (this.playerLabel) {
      const sx = (this.playerLabel.x - cam.worldView.x) * scaleX + rect.left;
      const sy = (this.playerLabel.y - cam.worldView.y) * scaleY + rect.top;
      this.playerLabel.el.style.display = 'block';
      this.playerLabel.el.style.left = `${sx}px`;
      this.playerLabel.el.style.top = `${sy}px`;
    }

    // 2. Den SINGLE nächsten Interaktions-Knoten ermitteln (innerhalb 44px)
    let nearestNode: Node | null = null;
    let minDist = LABEL_PROXIMITY_PX;
    for (const n of this.nodes) {
      if (!n.label) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.sprite.x, n.sprite.y);
      if (d < minDist) {
        minDist = d;
        nearestNode = n;
      }
    }

    // 3. Nur für das allernächste Objekt das Label einblenden (verhindert Label-Spam)
    for (const lbl of this.domLabels) {
      if (lbl === this.playerLabel) continue;
      const isNearest = nearestNode?.label === lbl;
      if (!isNearest) {
        lbl.el.style.display = 'none';
        continue;
      }
      const sx = (lbl.x - cam.worldView.x) * scaleX + rect.left;
      const sy = (lbl.y - cam.worldView.y) * scaleY + rect.top;
      if (
        sx < rect.left + 16 ||
        sx > rect.right - 16 ||
        sy < rect.top + 28 ||
        sy > rect.bottom - 28
      ) {
        lbl.el.style.display = 'none';
        continue;
      }
      lbl.el.style.display = 'block';
      lbl.el.style.left = `${sx}px`;
      lbl.el.style.top = `${sy}px`;
      lbl.el.classList.toggle('quest-target-label', Boolean(lbl.isQuestTarget));
    }
  }

  private drawDebugOverlay(): void {
    if (!this.debugGraphics) return;
    this.debugGraphics.clear();
    if (!this.debugMode) return;

    // Grüne Fuß-Hitboxen
    this.debugGraphics.lineStyle(1, 0x22c55e, 0.9);
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.debugGraphics.strokeRect(pBody.x, pBody.y, pBody.width, pBody.height);

    for (const child of this.obstacles.getChildren()) {
      const b = (child as any).body as Phaser.Physics.Arcade.StaticBody;
      if (b) {
        this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
      }
    }

    // Gelbe Interaktionsradien
    this.debugGraphics.lineStyle(1, 0xfacc15, 0.75);
    for (const n of this.nodes) {
      this.debugGraphics.strokeCircle(n.sprite.x, n.sprite.y, REACH);
    }
  }

  private updateCompass(): void {
    const ch = state.chapter;
    const q = state.quest;
    const chDef = state.currentChapterDef;

    for (const lbl of this.domLabels) {
      lbl.isQuestTarget = false;
    }

    const mentorKinds: Record<number, Kind> = {
      1: 'npc_nikolaos',
      2: 'npc_telesikles',
      3: 'npc_kleomenes',
      4: 'npc_perikles',
      5: 'npc_pythia',
      6: 'npc_leonidas',
      7: 'npc_themistokles',
      8: 'npc_sokrates',
      9: 'npc_alexander',
      10: 'npc_ptolemaios',
    };

    if (q === 0 || state.isReadyForQuiz() || state.isChapterComplete()) {
      const mKind = mentorKinds[ch] || 'npc_nikolaos';
      this.setCompassTargetByKind(mKind, chDef.mentor);
      return;
    }

    if (ch === 1) {
      if (q === 1) this.setCompassTargetByKind('res_kalkstein', 'Olivenholz & Kalkstein im Tal');
      else if (q === 2) this.setCompassTargetByKind('cistern_water', 'Steinerne Zisterne');
      else if (q === 3 || q === 4) this.setCompassTargetByKind('plot', 'Ackerbeete & Olivenbäume');
      else if (q === 5) this.setCompassTargetByBuilding('olivenpresse', 'Bauplatz Attische Olivenpresse');
      else if (q === 6) state.compassText = '🔨 Drücke C -> Goldenes Olivenöl pressen!';
    } else if (ch === 2) {
      if (q === 1) this.setCompassTargetByKind('res_wolle', 'Wollkorb an der Koppel');
      else if (q === 2) state.compassText = '🔨 Drücke C -> Segeltuch weben!';
      else if (q === 3) this.setCompassTargetByBuilding('hafen_werft', 'Bauplatz Schiffswerft von Piräus');
      else if (q === 4) this.setCompassTargetByKind('res_ton', 'Töpferton & Amphore (Taste C)');
      else if (q === 5) state.compassText = '🔨 Drücke C -> Heilige Fackel binden!';
      else if (q === 6) this.setCompassTargetByKind('colony_ship', 'Kolonistenschiff am Hafen');
    } else if (ch === 3) {
      if (q === 1) this.setCompassTargetByKind('res_eisenerz', 'Taygetos-Eisenerz im Nordwesten');
      else if (q === 2) this.setCompassTargetByBuilding('sparta_schmiede', 'Bauplatz Lakonische Waffenschmiede');
      else if (q === 3) state.compassText = '🔨 Drücke C -> Hoplitenschild (Aspis) schmieden!';
      else if (q === 4) state.compassText = '🔨 Drücke C -> Hoplitenspeer (Dory) schmieden!';
      else if (q === 5) this.setCompassTargetByKind('campfire_cook', 'Spartanisches Lagerfeuer (Blutsuppe)');
      else if (q === 6) this.setCompassTargetByKind('training_dummy', 'Agoge-Übungsplatz im Feldlager');
    } else if (ch === 4) {
      if (q === 1) this.setCompassTargetByKind('res_silbererz', 'Laureion-Silbererz im Süden');
      else if (q === 2) state.compassText = '🔨 Drücke C -> Eulen-Drachme prägen!';
      else if (q === 3) this.setCompassTargetByBuilding('pnyx_buehne', 'Bauplatz Rednerbühne (Pnyx)');
      else if (q === 4) state.compassText = '🔨 Drücke C -> Ostrakon (Tonscherbe) ritzen!';
      else if (q === 5) this.setCompassTargetByBuilding('pnyx_buehne', 'Rednerbühne der Pnyx (Abstimmen)');
    } else if (ch === 5) {
      if (q === 1) this.setCompassTargetByKind('agora_stall', 'Agora-Handel (Taste H): Marmor & Weihrauch');
      else if (q === 2) this.setCompassTargetByBuilding('zeus_altar', 'Bauplatz Heiliger Altar von Olympia');
      else if (q === 3 || q === 4) this.setCompassTargetByKind('olymp_portal', 'Wolkentor zum Berg Olymp');
      else if (q === 5) state.compassText = '🔨 Drücke C -> Olympischen Siegerkranz flechten!';
    } else if (ch === 6) {
      if (q === 1) this.setCompassTargetByKind('thermopylae_gate', 'Pass der Thermopylen (Verstärken)');
      else if (q === 2) state.compassText = '🔨 Prüfe Schild & Speer im Handwerk (Taste C)!';
      else if (q === 3) this.setCompassTargetByKind('beacon_tower', 'Signal-Wachturm am Pass');
      else if (q === 4) this.setCompassTargetByKind('parthenon_goal', 'Akropolis von Athen (Botenlauf)');
    } else if (ch === 7) {
      if (q === 1) state.compassText = '🔨 Drücke C -> Bronzenen Rammsporn (Embolon) gießen!';
      else if (q === 2) this.setCompassTargetByKind('res_holz', 'Kiefernholz für Ruderbänke');
      else if (q === 3) this.setCompassTargetByKind('trireme_warship', 'Kriegstrireme von Salamis am Hafen');
      else if (q === 4) this.setCompassTargetByKind('pharos_lighthouse', 'Meerenge am Leuchtturm');
    } else if (ch === 8) {
      if (q === 1) this.setCompassTargetByBuilding('akademie_stube', 'Bauplatz Schreibstube der Akademie');
      else if (q === 2) state.compassText = '🔨 Drücke C -> Antike Theatermaske formen!';
      else if (q === 3) this.setCompassTargetByKind('theater_stage', 'Bühne des Dionysos-Theaters');
      else if (q === 4) state.compassText = '🔨 Drücke C -> Philosophische Schriftrolle verfassen!';
    } else if (ch === 9) {
      if (q === 1) state.compassText = '🔨 Drücke C -> Makedonische Sarissa-Lanze fertigen!';
      else if (q === 2) this.setCompassTargetByKind('gordian_knot', 'Der Gordische Knoten');
      else if (q === 3) this.setCompassTargetByBuilding('bibliothek_alexandria', 'Bauplatz Große Bibliothek von Alexandria');
      else if (q === 4) this.setCompassTargetByKind('pharos_lighthouse', 'Pharos-Leuchtturm an der Küste');
    } else if (ch === 10) {
      if (q === 1) this.setCompassTargetByKind('babylon_legacy', 'Alexanders Vermächtnis aus Babylon');
      else if (q === 2) state.compassText = '🔨 Drücke C -> Weltkarte des Hellenismus zeichnen!';
      else if (q === 3) this.setCompassTargetByBuilding('bibliothek_alexandria', 'Große Bibliothek von Alexandria');
    }
  }

  private setCompassTargetByBuilding(buildingId: string, label: string): void {
    const node = this.nodes.find((n) => n.buildingDef?.id === buildingId);
    if (node) this.setCompassTarget(node, label);
  }

  private setCompassTargetByKind(kind: Kind, label: string): void {
    const node =
      this.nodes.find((n) => n.kind === kind && n.readyAt === 0) ??
      this.nodes.find((n) => n.kind === kind);
    if (node) this.setCompassTarget(node, label);
  }

  private setCompassTarget(targetNode: Node, label: string): void {
    if (targetNode.label) {
      targetNode.label.isQuestTarget = true;
    }
    const dx = targetNode.sprite.x - this.player.x;
    const dy = targetNode.sprite.y - this.player.y;
    const distPx = Math.hypot(dx, dy);
    if (distPx < 36) {
      state.compassText = `📍 Direkt vor dir: ${label} (drücke E)`;
      return;
    }
    const meters = Math.max(2, Math.round(distPx / 8));
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let dirStr = '→ Osten';
    if (angle >= -112.5 && angle < -67.5) dirStr = '↑ Norden';
    else if (angle >= -67.5 && angle < -22.5) dirStr = '↗ Nordosten';
    else if (angle >= -22.5 && angle < 22.5) dirStr = '→ Osten';
    else if (angle >= 22.5 && angle < 67.5) dirStr = '↘ Südosten';
    else if (angle >= 67.5 && angle < 112.5) dirStr = '↓ Süden';
    else if (angle >= 112.5 && angle < 157.5) dirStr = '↙ Südwesten';
    else if (angle >= -157.5 && angle < -112.5) dirStr = '↖ Nordwesten';
    else dirStr = '← Westen';

    state.compassText = `🧭 ${label}: ${dirStr} (${meters} m)`;
  }

  private persist(): void {
    if (this.player) {
      state.playerX = Math.round(this.player.x);
      state.playerY = Math.round(this.player.y);
    }
    state.persist();
  }
}
