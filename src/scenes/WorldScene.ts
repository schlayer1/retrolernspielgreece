import Phaser from 'phaser';
import { bgm, sfx } from '../audio/sound';
import { GreekBuildingDef, GreekItemId } from '../data/items';
import { GREEK_RELICS } from '../data/relics';
import { CROP_MS, DAY_MS, state } from '../systems/GameState';

const TILE = 16;
const MAP_W = 52; // 832 px
const MAP_H = 36; // 576 px
const SPEED = 98;
const REACH = 48;
const REGROW_MS = 18_000;
const LABEL_PROXIMITY_PX = 64;

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

interface WanderingAnimal {
  sprite: Phaser.GameObjects.Sprite;
  kind: 'goat' | 'cow';
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  timer: number;
  walkAnim: string;
  idleAnim: string;
  lured?: boolean;
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
  private wanderingAnimals: WanderingAnimal[] = [];
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
    this.wanderingAnimals = [];
    this.sleeping = false;
    this.transitioningOlymp = false;

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

    const saved = state.saves.load();
    if (saved) state.loadFrom(saved);
    else state.startChapter(state.chapter);

    this.obstacles = this.physics.add.staticGroup();

    // 1. Nahtloses 16-Bit-Griechenland-Terrain mit 4x4 Bayer-Dithering
    this.buildGreekGround();

    // 2. Monumente, Tempel, Bäume & Dekorationen
    this.scatterGreekWorld();

    // 3. Rohstoff-Knoten (Oliven, Holz, Kalkstein, Marmor, Ton, Wolle, Eisen, Silber, Fisch)
    this.placeGreekResources();

    // 4. Bauplätze, Ackerbeete & 10 Kapitel-Mentoren
    this.placeGreekBuildingsAndNPCs();

    // 5. Die 5 Archäologischen Leit-Relikte
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

  private buildGreekGround(): void {
    const W = MAP_W * TILE;
    const H = MAP_H * TILE;
    const rt = this.textures.createCanvas('greek_ground_baked', W, H);
    if (!rt) return;
    const ctx = rt.getContext();
    ctx.imageSmoothingEnabled = false;

    const bayer4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];

    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const px = tx * TILE;
        const py = ty * TILE;

        // Zone determination:
        // 1. Aegean Sea (East/Southeast)
        const inSea =
          tx >= AEGEAN_SEA.x &&
          ty >= AEGEAN_SEA.y &&
          tx - AEGEAN_SEA.x + (ty - AEGEAN_SEA.y) * 0.35 >= 2.2;

        // 2. Harbor Stone Pier & Promenade (cols 37..43, rows 20..30)
        const inHarborPier =
          !inSea && tx >= 37 && tx <= 44 && ty >= 21 && ty <= 29;

        // 3. Athens Agora & Pnyx Marble Plaza (cols 21..34, rows 13..22)
        const inAgora = tx >= 21 && tx <= 34 && ty >= 13 && ty <= 22;

        // 4. Acropolis Elevated Marble Terrace (cols 21..33, rows 3..11)
        const inAcropolis = tx >= 21 && tx <= 33 && ty >= 3 && ty <= 11;

        // 5. Spartan & Thermopylae Rocky Highlands (Northwest: cols 0..19, rows 0..15)
        const inSpartaRock = tx <= 19 && ty <= 15;

        // 6. Sacred Delphi & Olympus Ascent Terrace (Northeast: cols 34..50, rows 2..11)
        const inDelphi = tx >= 34 && ty <= 11;

        // 7. Alexandria & Hellenistic Quarter (Southeast plaza: cols 31..39, rows 19..28)
        const inAlexandria = !inSea && tx >= 31 && tx <= 39 && ty >= 19 && ty <= 27;

        for (let y = 0; y < TILE; y++) {
          for (let x = 0; x < TILE; x++) {
            const gx = px + x;
            const gy = py + y;
            const dVal = bayer4[gy & 3][gx & 3] / 16;

            let color = '#5e8c42'; // Default Mediterranean olive-meadow green

            if (inSea) {
              const deep = tx >= AEGEAN_SEA.x + 3 && ty >= AEGEAN_SEA.y + 3;
              color = deep
                ? dVal > 0.5
                  ? '#0369a1'
                  : '#0284c7'
                : dVal > 0.5
                  ? '#0ea5e9'
                  : '#38bdf8';
            } else if (inHarborPier) {
              const isGrid = x === 0 || y === 0 || y === 8;
              color = isGrid ? '#94a3b8' : dVal > 0.5 ? '#cbd5e1' : '#e2e8f0';
            } else if (inAcropolis) {
              const isTileEdge = x === 0 || y === 0;
              color = isTileEdge ? '#cbd5e1' : dVal > 0.5 ? '#f8fafc' : '#f1f5f9';
            } else if (inAgora || inAlexandria) {
              const isTileEdge = (gx & 7) === 0 || (gy & 7) === 0;
              color = isTileEdge ? '#d6c7b2' : dVal > 0.5 ? '#efe6d5' : '#e5d9c3';
            } else if (inSpartaRock) {
              color = dVal > 0.55 ? '#8c7a6b' : dVal > 0.25 ? '#9c8876' : '#786759';
            } else if (inDelphi) {
              color = dVal > 0.5 ? '#d8e2dc' : '#cbd5e1';
            } else {
              // Attica Valley & Olive Grove with Bayer dithering
              const distBeach = Math.hypot(tx - 40, ty - 24);
              if (distBeach < 4.2 && tx >= 36) {
                color = dVal > 0.4 ? '#fde68a' : '#f3d078'; // Sandy Mediterranean shore
              } else {
                color = dVal > 0.6 ? '#4d7c32' : dVal > 0.25 ? '#659643' : '#58873a';
              }
            }

            ctx.fillStyle = color;
            ctx.fillRect(gx, gy, 1, 1);
          }
        }
      }
    }

    // Organisch geschwungene antike Pflasterstraßen zwischen allen Hauptorten
    const drawRoad = (x0: number, y0: number, x1: number, y1: number, width = 18) => {
      const steps = Math.max(20, Math.hypot(x1 - x0, y1 - y0) / 3);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const rx = x0 + (x1 - x0) * t + Math.sin(t * Math.PI * 2) * 5;
        const ry = y0 + (y1 - y0) * t + Math.cos(t * Math.PI * 2) * 3;
        ctx.fillStyle = '#d9c5a0';
        ctx.beginPath();
        ctx.arc(rx, ry, width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e7d8bc';
        ctx.beginPath();
        ctx.arc(rx, ry, width / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Verbindungsstraßen:
    drawRoad(415, 300, 260, 390, 20); // Agora -> Attika-Felder & Olivenhain
    drawRoad(415, 290, 650, 405, 20); // Agora -> Hafen von Piräus
    drawRoad(415, 250, 415, 130, 22); // Agora -> Heilige Straße zur Akropolis
    drawRoad(360, 250, 185, 175, 18); // Agora -> Sparta & Thermopylen
    drawRoad(450, 230, 610, 155, 18); // Agora -> Delphi & Olymp-Portal

    // Kollisionsfreie mediterrane Bodendetails (Wildblumen, Mohn, Thymian, Kiesel)
    const detailColors = ['#ef4444', '#facc15', '#a855f7', '#ffffff', '#cbd5e1'];
    for (let i = 0; i < 160; i++) {
      const dx = 24 + ((i * 173) % (W - 220));
      const dy = 24 + ((i * 251) % (H - 48));
      ctx.fillStyle = detailColors[i % detailColors.length];
      ctx.fillRect(dx, dy, 2, 2);
    }

    rt.refresh();
    this.add.image(0, 0, 'greek_ground_baked').setOrigin(0, 0).setDepth(0);

    // Animierte Wellen auf dem Ägäischen Meer + unsichtbare Wasserkollision
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

    // Wasser-Barriere für das tiefere Meer
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

  private addDecor(
    tex: string,
    x: number,
    y: number,
    footW = 0,
    footH = 0,
    scale = 1,
  ): Phaser.GameObjects.Image {
    const img = this.add.image(x, y, tex).setScale(scale);
    img.setDepth(y + (img.displayHeight * 0.35));
    if (footW > 0 && footH > 0) {
      const zone = this.add.rectangle(
        x,
        y + img.displayHeight * 0.32,
        footW,
        footH,
        0x000000,
        0,
      );
      this.physics.add.existing(zone, true);
      this.obstacles.add(zone);
    }
    return img;
  }

  private scatterGreekWorld(): void {
    // 1. Akropolis im Norden: Parthenon-Tempel, Statuen & Dorische Säulen
    this.addDecor('parthenon', 425, 78, 84, 24, 1.0);
    this.addDecor('statue_athena_shrine', 355, 92, 24, 12, 0.9);
    this.addDecor('statue_nike_gold', 492, 92, 22, 12, 0.9);
    this.addDecor('column_doric', 380, 125, 12, 8);
    this.addDecor('column_doric', 470, 125, 12, 8);

    // 2. Dionysos-Theater & Akademie-Garten (Kapitel 8)
    this.addDecor('theater', 295, 118, 72, 22, 0.88);
    this.addDecor('academy_garden', 310, 215, 42, 14, 0.85);

    // 3. Athen: Agora, Stoa, Brunnen & Pnyx-Rat (Kapitel 1 & 4)
    this.addDecor('stoa_colonnade', 385, 255, 50, 14, 0.95);
    this.addDecor('fountain_round', 475, 295, 32, 14, 0.9);
    this.addDecor('pnyx_council', 465, 210, 46, 16, 0.95);
    this.addDecor('greek_villa', 345, 285, 42, 16, 0.9);

    // 4. Sparta & Pass der Thermopylen im Nordwesten (Kapitel 3 & 6)
    this.addDecor('spartan_barracks', 95, 95, 44, 16, 0.95);
    this.addDecor('spartan_phalanx', 105, 165, 54, 16, 0.9);
    this.addDecor('spartan_spear_rack', 155, 95, 30, 10, 0.85);
    this.addDecor('spartan_helmet_rack', 200, 95, 30, 10, 0.85);
    this.addDecor('war_drum', 135, 132, 16, 10, 0.85);

    // 5. Delphi & Aufstieg zum Berg Olymp im Nordosten (Kapitel 5)
    this.addDecor('tholos_delphi', 565, 92, 42, 16, 0.95);
    this.addDecor('brazier_tripod', 530, 108, 16, 10, 0.9);
    this.addDecor('column_ionic', 630, 75, 12, 8);
    this.addDecor('column_ionic', 690, 75, 12, 8);

    // 6. Südosten: Makedonischer Triumphbogen, Alexandria & Hafen von Piräus (Kapitel 2, 7, 9, 10)
    this.addDecor('marble_archway', 535, 290, 60, 14, 0.9);
    this.addDecor('statue_bronze_hoplite', 495, 330, 16, 10, 0.9);
    this.addDecor('Bread_oven' in this.textures.list ? 'bread_oven' : 'pottery_kiln', 295, 355, 32, 14, 0.85);

    // Autonome mediterrane Fauna (Ziegen & Rinder) im Attika-Tal
    this.spawnWanderingAnimal('goat', 145, 465);
    this.spawnWanderingAnimal('goat', 185, 485);
    this.spawnWanderingAnimal('cow', 110, 440);
  }

  private spawnWanderingAnimal(kind: 'goat' | 'cow', x: number, y: number): void {
    const tex = kind === 'goat' ? 'animal_goat' : 'animal_cow';
    const spr = this.add.sprite(x, y, tex, 0);
    spr.setDepth(y + 12);
    const walkAnim = kind === 'goat' ? 'walk-goat' : 'walk-cow';
    const idleAnim = kind === 'goat' ? 'idle-goat' : 'idle-cow';
    spr.play(idleAnim);
    this.wanderingAnimals.push({
      sprite: spr,
      kind,
      homeX: x,
      homeY: y,
      vx: 0,
      vy: 0,
      timer: 1500 + Math.random() * 2000,
      walkAnim,
      idleAnim,
    });
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
      this.addNode('res_oliven', ox, oy, 'olive_tree_1', undefined, '🫒 Olivenbaum (E)', '#a3e635', 0.95);
    }

    // Kiefernholz / Bauholz
    const timberSpots = [
      [85, 295],
      [145, 315],
      [245, 295],
    ];
    for (const [tx, ty] of timberSpots) {
      this.addNode('res_holz', tx, ty, 'olive_tree_2', undefined, '🪵 Kiefernholz (E)', '#fde047', 0.9);
    }

    // Heller Kalkstein
    const limestoneSpots = [
      [120, 250],
      [185, 255],
      [255, 245],
    ];
    for (const [lx, ly] of limestoneSpots) {
      this.addNode('res_kalkstein', lx, ly, 'objects', 'bigrock', '🪨 Kalkstein (E)', '#e2e8f0', 0.9);
    }

    // Taygetos-Eisenerz (im Norden bei Sparta)
    const ironSpots = [
      [60, 155],
      [65, 205],
      [115, 215],
    ];
    for (const [ix, iy] of ironSpots) {
      const n = this.addNode('res_eisenerz', ix, iy, 'objects', 'bigrock', '⛏️ Taygetos-Eisenerz (E)', '#cbd5e1', 0.88);
      n.sprite.setTint(0x64748b);
    }

    // Laureion-Silbererz (Mitte/Süden bei Athen)
    const silverSpots = [
      [355, 385],
      [395, 415],
    ];
    for (const [sx, sy] of silverSpots) {
      const n = this.addNode('res_silbererz', sx, sy, 'objects', 'bigrock', '🥈 Laureion-Silbererz (E)', '#7dd3fc', 0.88);
      n.sprite.setTint(0xbae6fd);
    }

    // Parischer Marmor (nahe Akropolis & Delphi)
    const marbleSpots = [
      [515, 165],
      [555, 195],
    ];
    for (const [mx, my] of marbleSpots) {
      const n = this.addNode('res_marmor', mx, my, 'objects', 'bigrock', '🏛️ Weißer Marmor (E)', '#ffffff', 0.9);
      n.sprite.setTint(0xf8fafc);
    }

    // Attischer Töpferton
    this.addNode('res_ton', 315, 435, 'amphora_black_painted', undefined, '🏺 Attischer Töpferton (E)', '#fb923c', 0.95);
    this.addNode('res_ton', 345, 465, 'amphora_black_painted', undefined, '🏺 Attischer Töpferton (E)', '#fb923c', 0.95);

    // Schaf- & Ziegenwolle an der Koppel
    this.addNode('res_wolle', 155, 505, 'stone_well', undefined, '🐑 Hirten-Wollkorb (E)', '#f8fafc', 0.78);

    // Steinerne Zisterne (Quellwasser für die 6 Ackerbeete)
    this.addNode('cistern_water', 265, 430, 'cistern_pool', undefined, '💧 Zisterne: Quellwasser (E)', '#38bdf8', 0.9);

    // Fischgründe am Ägäis-Strand
    this.addNode('fish_spot', 695, 495, 'fishing_boat', undefined, '🐟 Ägäis-Fischgrund (E)', '#38bdf8', 0.85);

    // Spartanisches Lagerfeuer & Kochstelle (Blutsuppe / Fisch braten / Ausruhen)
    this.addNode('campfire_cook', 215, 175, 'campfire_stone', undefined, '🔥 Lagerfeuer & Kessel (E)', '#fb923c', 0.95);

    // Agora-Handelsstand (Taste H oder E)
    this.addNode('agora_stall', 445, 325, 'agora_stall_olives', undefined, '⚖️ Agora-Fernhandel (E / H)', '#fde047', 0.92);
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
      const n = this.addNode('plot', px, py, 'farm', 'soil_raw', `🌱 Ackerbeet ${idx + 1} (E)`, '#bef264', 1);
      n.plotId = idx;
      n.sprite.setDepth(5);
      this.refreshPlotVisual(n);
    });

    // 2. Die 7 errichtbaren griechischen Bauwerke
    for (const b of state.buildingsData) {
      const n = this.addNode(
        'build_site',
        b.x,
        b.y,
        'farm',
        'sign_build',
        `🏗️ Bauplatz: ${b.name} (E)`,
        '#fde047',
        1,
      );
      n.buildingDef = b;
      if (state.hasBuilding(b.id)) {
        this.renderBuiltGreekBuilding(n);
      }
    }

    // 3. Interaktive Spezial-Stationen für Kapitel 2 bis 10:
    // K2: Kolonistenschiff am Hafen von Piräus
    this.addNode('colony_ship', 715, 365, 'trireme_blue', undefined, '⛵ Kolonistenschiff (E)', '#38bdf8', 0.92);

    // K3: Spartanische Trainingspuppe (Agoge & Phalanx)
    this.addNode('training_dummy', 225, 130, 'training_dummy', undefined, '🛡️ Agoge-Übungsplatz (E)', '#f87171', 0.95);

    // K5: Wolkentor zum Berg Olymp (Sub-Szene!)
    this.add.image(665, 118, 'olymp_rune_circle').setScale(0.8).setDepth(6);
    this.addNode(
      'olymp_portal',
      665,
      110,
      'olymp_orb_pedestal',
      undefined,
      '⚡ Wolkentor zum Berg Olymp (E)',
      '#7dd3fc',
      0.85,
      true,
    );

    // K6: Pass der Thermopylen, Wachturm & Akropolis-Botenziel
    this.addNode('thermopylae_gate', 285, 65, 'thermopylae_gate', undefined, '🛡️ Pass der Thermopylen (E)', '#f87171', 0.95);
    this.addNode('beacon_tower', 335, 68, 'watchtower_stone', undefined, '🔥 Signal-Wachturm (E)', '#fb923c', 0.9);
    this.addNode('parthenon_goal', 425, 115, 'fire_altar_gold', undefined, '🏛️ Altar der Akropolis (E)', '#fde047', 0.85);

    // K7: Athenische Kriegstrireme & Leuchtturm an der Bucht von Salamis
    this.addNode('trireme_warship', 715, 445, 'trireme_red', undefined, '⚓ Kriegstrireme von Salamis (E)', '#f87171', 0.95);
    this.addNode('pharos_lighthouse', 635, 495, 'lighthouse_pharos', undefined, '🗼 Pharos-Leuchtturm & Meerenge (E)', '#fde047', 0.95);

    // K8: Bühne des Dionysos-Theaters
    this.addNode('theater_stage', 295, 152, 'brazier_tripod', undefined, '🎭 Bühne des Theaters (E)', '#c084fc', 0.85);

    // K9: Der Gordische Knoten & Triumphplatz Alexanders
    this.addNode('gordian_knot', 495, 295, 'chest_ornate', undefined, '🪢 Der Gordische Knoten (E)', '#fde047', 0.9);

    // K10: Goldenes Vermächtnis Alexanders aus Babylon
    this.addNode('babylon_legacy', 595, 325, 'statue_nike_gold', undefined, '👑 Alexanders Vermächtnis (E)', '#fde047', 0.85);

    // 4. Die 10 historischen Kapitel-Mentoren:
    const mentors: Array<{
      kind: Kind;
      tex: string;
      anim: string;
      x: number;
      y: number;
      label: string;
    }> = [
      { kind: 'npc_nikolaos', tex: 'npc_nikolaos', anim: 'idle-nikolaos', x: 395, y: 295, label: '🏛️ K1: Dorfältester Nikolaos (E)' },
      { kind: 'npc_telesikles', tex: 'npc_telesikles', anim: 'idle-telesikles', x: 645, y: 375, label: '⛵ K2: Kapitän Telesikles (E)' },
      { kind: 'npc_kleomenes', tex: 'npc_kleomenes', anim: 'idle-kleomenes', x: 185, y: 145, label: '🛡️ K3: Ephor Kleomenes (E)' },
      { kind: 'npc_perikles', tex: 'npc_perikles', anim: 'idle-perikles', x: 465, y: 245, label: '🦉 K4: Staatsmann Perikles (E)' },
      { kind: 'npc_pythia', tex: 'npc_pythia', anim: 'idle-pythia', x: 575, y: 135, label: '🔮 K5: Priesterin Pythia (E)' },
      { kind: 'npc_leonidas', tex: 'npc_leonidas', anim: 'idle-leonidas', x: 285, y: 98, label: '⚔️ K6: König Leonidas (E)' },
      { kind: 'npc_themistokles', tex: 'npc_themistokles', anim: 'idle-themistokles', x: 660, y: 445, label: '⚓ K7: Stratege Themistokles (E)' },
      { kind: 'npc_sokrates', tex: 'npc_sokrates', anim: 'idle-sokrates', x: 350, y: 175, label: '📜 K8: Philosoph Sokrates (E)' },
      { kind: 'npc_alexander', tex: 'npc_alexander', anim: 'idle-alexander', x: 535, y: 315, label: '👑 K9: Alexander der Große (E)' },
      { kind: 'npc_ptolemaios', tex: 'npc_ptolemaios', anim: 'idle-ptolemaios', x: 560, y: 385, label: '🏛️ K10: Chronist Ptolemaios (E)' },
    ];

    for (const m of mentors) {
      const n = this.addNode(m.kind, m.x, m.y, m.tex, 0, m.label, '#fde047', 1, true);
      (n.sprite as Phaser.GameObjects.Sprite).play(m.anim);
    }
  }

  private placeGreekRelics(): void {
    const relicCoords: Array<{ kind: Kind; id: string; x: number; y: number; title: string }> = [
      { kind: 'relic_amphore', id: 'relic_amphore', x: 185, y: 355, title: '🏺 Relikt: Preisamphore (E)' },
      { kind: 'relic_eule', id: 'relic_eule', x: 420, y: 405, title: '🦉 Relikt: Eulen-Tetradrachme (E)' },
      { kind: 'relic_agamemnon', id: 'relic_agamemnon', x: 75, y: 125, title: '🎭 Relikt: Maske von Mykene (E)' },
      { kind: 'relic_antikythera', id: 'relic_antikythera', x: 695, y: 525, title: '⚙️ Relikt: Antikythera-Werk (E)' },
      { kind: 'relic_alexander', id: 'relic_alexander', x: 605, y: 275, title: '👑 Relikt: Alexander-Büste (E)' },
    ];

    for (const r of relicCoords) {
      if (state.relicsFound.includes(r.id)) continue;
      const n = this.addNode(r.kind, r.x, r.y, r.id, undefined, r.title, '#facc15', 0.85);
      this.tweens.add({
        targets: n.sprite,
        y: r.y - 4,
        duration: 1100,
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
    el.className = 'world-label';
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

    // Autonome Tier-KI inkl. barrierefreier Lock-Mechanik (lured)
    this.updateAnimals(delta);

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

  private updateAnimals(delta: number): void {
    const hasFeed = state.count('gerste') > 0 || state.count('oliven') > 0;
    for (const a of this.wanderingAnimals) {
      const dist = Phaser.Math.Distance.Between(
        this.player?.x ?? 0,
        this.player?.y ?? 0,
        a.sprite.x,
        a.sprite.y,
      );

      // Barrierefreie Lock-Mechanik (Skill 5.1): < 88 px mit Futter -> läuft neugierig zum Spieler und stoppt bei < 52 px
      if (hasFeed && dist < 88 && a.kind === 'goat') {
        a.lured = true;
        if (dist > 44) {
          const ang = Math.atan2(this.player.y - a.sprite.y, this.player.x - a.sprite.x);
          a.sprite.x += Math.cos(ang) * 0.45 * (delta / 16);
          a.sprite.y += Math.sin(ang) * 0.45 * (delta / 16);
          a.sprite.play(a.walkAnim, true);
        } else {
          a.sprite.play(a.idleAnim, true);
        }
        a.sprite.setDepth(a.sprite.y + 12);
        continue;
      }

      a.lured = false;
      a.timer -= delta;
      if (a.timer <= 0) {
        a.timer = 1600 + Math.random() * 2400;
        if (Math.random() < 0.45) {
          a.vx = 0;
          a.vy = 0;
          a.sprite.play(a.idleAnim, true);
        } else {
          const angle = Math.random() * Math.PI * 2;
          a.vx = Math.cos(angle) * 0.3;
          a.vy = Math.sin(angle) * 0.3;
          a.sprite.play(a.walkAnim, true);
          a.sprite.setFlipX(a.vx < 0);
        }
      }

      a.sprite.x = Phaser.Math.Clamp(a.sprite.x + a.vx * (delta / 16), a.homeX - 45, a.homeX + 45);
      a.sprite.y = Phaser.Math.Clamp(a.sprite.y + a.vy * (delta / 16), a.homeY - 35, a.homeY + 35);
      a.sprite.setDepth(a.sprite.y + 12);
    }
  }

  private tryTameLuredAnimal(): void {
    for (const a of this.wanderingAnimals) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, a.sprite.x, a.sprite.y);
      if (d < 58 && a.kind === 'goat') {
        state.goatTamed = true;
        state.add('wolle', 2);
        state.add('ziegenkaese', 1);
        state.bump('wolle_gathered', 2);
        sfx.quest();
        state.emit('toast', '🐐 Bergziege angelockt & gefüttert: +2 Wolle & +1 Ziegenkäse!');
        return;
      }
    }
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

    // 9. Die 10 Kapitel-Mentoren
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
    if (this.player) {
      this.player.setPosition(state.playerX, state.playerY);
    }
    for (const n of this.nodes) {
      if (n.kind === 'build_site' && n.buildingDef && state.hasBuilding(n.buildingDef.id)) {
        this.renderBuiltGreekBuilding(n);
      }
    }
    this.updateCompass();
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

    for (const lbl of this.domLabels) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, lbl.x, lbl.y);
      const show = lbl.alwaysVisible || lbl.isQuestTarget || dist <= LABEL_PROXIMITY_PX;
      if (!show) {
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
