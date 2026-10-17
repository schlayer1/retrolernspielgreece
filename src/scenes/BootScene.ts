import Phaser from 'phaser';
import { ITEMS } from '../data/items';
import { GREEK_RELICS } from '../data/relics';
import { state } from '../systems/GameState';

/** Benannte Ausschnitte aus gfx/objects.png. */
export const OBJECT_FRAMES: Record<string, [number, number, number, number]> = {
  stump: [0, 160, 32, 32],
  bigrock: [320, 4, 32, 30],
  bubble_excl: [32, 128, 16, 16],
  pot: [64, 96, 16, 16],
  ...Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [`fire${i}`, [64 + 16 * i, 48, 16, 16]]),
  ),
};

/** Benannte Ausschnitte aus gfx/farm.png für das 5-Stufen-Agrarsystem. */
export const FARM_FRAMES: Record<string, [number, number, number, number]> = {
  soil_raw: [144, 96, 16, 16],
  soil_dry: [176, 48, 16, 16],
  soil_wet: [32, 96, 16, 16],
  wheat_ripe: [288, 0, 16, 32],
  sign_build: [288, 96, 16, 16],
};

export const GREEK_WORLD_SPRITES = [
  'parthenon',
  'parthenon_gold',
  'theater',
  'pnyx_council',
  'small_temple_blue',
  'small_temple_red',
  'statue_nike_gold',
  'statue_athena_shrine',
  'statue_zeus_throne',
  'stoa_colonnade',
  'marble_archway',
  'fountain_round',
  'cistern_pool',
  'column_doric',
  'column_ionic',
  'statue_bronze_hoplite',
  'amphora_black_painted',
  'olive_press',
  'olive_mill',
  'pottery_kiln',
  'bread_oven',
  'greek_villa',
  'academy_garden',
  'brazier_tripod',
  'chest_ornate',
  'trireme_ship',
  'trireme_blue',
  'trireme_red',
  'lighthouse_pharos',
  'watchtower_stone',
  'olive_tree_1',
  'olive_tree_2',
  'spartan_phalanx',
  'spartan_spear_rack',
  'spartan_helmet_rack',
  'training_dummy',
  'spartan_barracks',
  'spartan_hall',
  'war_drum',
  'thermopylae_gate',
  'siege_catapult',
  'campfire_stone',
  'fire_altar_gold',
  'agora_stall_olives',
  'agora_stall_spices',
  'stone_well',
  'fishing_boat',
  'tholos_delphi',
  'olymp_island_main',
  'olymp_island_small',
  'olymp_cloud_bridge',
  'olymp_orb_pedestal',
  'olymp_rune_circle',
  'cloud_puff',
] as const;

export const NPC_IDS = [
  'nikolaos',
  'telesikles',
  'kleomenes',
  'perikles',
  'pythia',
  'leonidas',
  'themistokles',
  'sokrates',
  'alexander',
  'ptolemaios',
  'guard',
] as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const bar = this.add.rectangle(w / 2 - 60, h / 2, 0, 6, 0x38bdf8).setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => (bar.width = 120 * p));

    // 1. Basis-Objekt- & Farm-Sheets
    this.load.image('objects', 'assets/gfx/objects.png');
    this.load.image('farm', 'assets/gfx/farm.png');
    this.load.image('ores', 'assets/gfx/ores.png');

    // 2. Kuratierte 16-Bit Griechenland- & Olymp-Sprites (aus den 6 RAR-Archiven)
    for (const key of GREEK_WORLD_SPRITES) {
      this.load.image(key, `assets/greek/${key}.png`);
    }

    // 3. Griechische Spielfiguren & 10 Kapitel-Mentoren (16x32 Spritesheets, 4-Wege-Animationen)
    this.load.spritesheet('player_greek_male', 'assets/gfx/player_greek_male.png', {
      frameWidth: 16,
      frameHeight: 32,
    });
    this.load.spritesheet('player_greek_female', 'assets/gfx/player_greek_female.png', {
      frameWidth: 16,
      frameHeight: 32,
    });
    for (const id of NPC_IDS) {
      this.load.spritesheet(`npc_${id}`, `assets/gfx/npcs/npc_${id}.png`, {
        frameWidth: 16,
        frameHeight: 32,
      });
    }

    // 4. Autonome mediterrane Fauna (Ziegen & Rinder)
    this.load.spritesheet('animal_cow', 'assets/gfx/cow.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('animal_goat', 'assets/gfx/goat.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // 5. Didaktische 16-Bit-Item-Icons & 5 Leit-Relikte
    for (const id of Object.keys(ITEMS)) {
      this.load.image(`icon-${id}`, `assets/icons/${id}.png`);
    }
    for (const relicId of Object.keys(GREEK_RELICS)) {
      this.load.image(relicId, `assets/icons/${relicId}.png`);
    }
  }

  create(): void {
    const params = new URLSearchParams(location.search);
    if (params.has('neu')) state.saves.clear();
    state.hasHadExistingSaveOnBoot = state.saves.hasSave();
    state.skipStartScreen = params.has('kapitel') || params.has('direkt');

    const registerFrames = (
      texKey: string,
      map: Record<string, [number, number, number, number]>,
    ) => {
      if (!this.textures.exists(texKey)) return;
      const tex = this.textures.get(texKey);
      for (const [name, [x, y, fw, fh]] of Object.entries(map)) {
        tex.add(name, 0, x, y, fw, fh);
      }
    };

    registerFrames('objects', OBJECT_FRAMES);
    registerFrames('farm', FARM_FRAMES);

    for (const id of Object.keys(ITEMS)) {
      if (this.textures.exists(`icon-${id}`)) {
        this.textures.get(`icon-${id}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }

    this.extractPreviewImages();

    // 4-Wege-Animationen für Alexandros (Male) und Helena (Female)
    const dirs = ['down', 'right', 'up', 'left'];
    dirs.forEach((dir, row) => {
      const start = row * 4;

      this.anims.create({
        key: `walk-greek-male-${dir}`,
        frames: this.anims.generateFrameNumbers('player_greek_male', {
          start,
          end: start + 3,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `idle-greek-male-${dir}`,
        frames: [{ key: 'player_greek_male', frame: start }],
        frameRate: 1,
      });

      this.anims.create({
        key: `walk-greek-female-${dir}`,
        frames: this.anims.generateFrameNumbers('player_greek_female', {
          start,
          end: start + 3,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `idle-greek-female-${dir}`,
        frames: [{ key: 'player_greek_female', frame: start }],
        frameRate: 1,
      });
    });

    // NPC-Animationen
    for (const id of NPC_IDS) {
      this.anims.create({
        key: `idle-${id}`,
        frames: [
          { key: `npc_${id}`, frame: 0 },
          { key: `npc_${id}`, frame: 1 },
          { key: `npc_${id}`, frame: 0 },
        ],
        frameRate: 1.5,
        repeat: -1,
      });
    }

    // Tier-Animationen
    this.anims.create({
      key: 'idle-cow',
      frames: this.anims.generateFrameNumbers('animal_cow', { start: 0, end: 3 }),
      frameRate: 2.5,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk-cow',
      frames: this.anims.generateFrameNumbers('animal_cow', { start: 4, end: 7 }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle-goat',
      frames: this.anims.generateFrameNumbers('animal_goat', { start: 0, end: 3 }),
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk-goat',
      frames: this.anims.generateFrameNumbers('animal_goat', { start: 4, end: 7 }),
      frameRate: 5,
      repeat: -1,
    });

    // Animiertes Lagerfeuer
    this.anims.create({
      key: 'fire',
      frames: Array.from({ length: 7 }, (_, i) => ({ key: 'objects', frame: `fire${i}` })),
      frameRate: 10,
      repeat: -1,
    });

    const chParam = Number(params.get('kapitel'));
    if (chParam >= 1 && chParam <= 10) {
      state.startChapter(chParam);
    }

    this.scene.start('World');
  }

  private extractPreviewImages(): void {
    const toDataUrl = (
      texKey: string,
      sx?: number,
      sy?: number,
      sw?: number,
      sh?: number,
    ): string => {
      if (!this.textures.exists(texKey)) return '';
      const src = this.textures.get(texKey).getSourceImage() as
        | HTMLImageElement
        | HTMLCanvasElement;
      if (!src) return '';
      const w = sw ?? src.width;
      const h = sh ?? src.height;
      const x = sx ?? 0;
      const y = sy ?? 0;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
      return c.toDataURL();
    };

    state.malePreviewUrl = toDataUrl('player_greek_male', 0, 0, 16, 32);
    state.femalePreviewUrl = toDataUrl('player_greek_female', 0, 0, 16, 32);

    state.showcaseSprites = {
      olive: 'assets/icons/olivenoel.png',
      amphora: 'assets/icons/amphore.png',
      shield: 'assets/icons/aspis_schild.png',
      coin: 'assets/icons/drachme.png',
      wreath: 'assets/icons/lorbeerkranz.png',
      scroll: 'assets/icons/schriftrolle.png',
    };
  }
}
