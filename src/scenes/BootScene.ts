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
  'academy_garden',
  'agora_stall_olives',
  'agora_stall_spices',
  'amphora_black_painted',
  'bougainvillea_orange',
  'bougainvillea_pink',
  'brazier_tripod',
  'bread_oven',
  'campfire_stone',
  'chest_ornate',
  'cistern_pool',
  'clay_deposit',
  'citrus_tree_lemon',
  'citrus_tree_orange',
  'cloud_puff',
  'column_doric',
  'column_ionic',
  'cypress_tall_1',
  'cypress_tall_2',
  'fire_altar_gold',
  'fishing_boat',
  'fountain_round',
  'basket_figs',
  'cloth_rolls',
  'basket_olives',
  'basket_oranges',
  'greek_villa',
  'lighthouse_pharos',
  'lion_fountain',
  'marble_archway',
  'marble_bench',
  'market_stall_blue',
  'market_stall_green',
  'market_stall_red',
  'olive_mill',
  'olive_press',
  'olive_tree_1',
  'olive_tree_2',
  'olymp_cloud_bridge',
  'olymp_island_main',
  'olymp_island_small',
  'olymp_orb_pedestal',
  'olymp_rune_circle',
  'owl_athena',
  'parthenon',
  'parthenon_gold',
  'pnyx_council',
  'pottery_kiln',
  'ruined_column',
  'scroll_shelf',
  'siege_catapult',
  'small_temple_blue',
  'small_temple_red',
  'spartan_barracks',
  'spartan_hall',
  'spartan_helmet_rack',
  'spartan_phalanx',
  'spartan_spear_rack',
  'stag_deer',
  'statue_athena_shrine',
  'statue_bronze_hoplite',
  'statue_nike_gold',
  'statue_pegasus',
  'statue_philosopher',
  'statue_zeus_throne',
  'stoa_colonnade',
  'stone_well',
  'terracotta_pots',
  'theater',
  'thermopylae_gate',
  'tholos_delphi',
  'training_dummy',
  'trireme_blue',
  'trireme_red',
  'trireme_ship',
  'war_drum',
  'watchtower_stone',
  'world_map_table',
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

    // 1. Basis-Objekt-, Farm- & Welt-Sheets
    this.load.atlas('world', 'assets/world/world_atlas.png', 'assets/world/world_atlas.json');
    this.load.image('ground_med_a2', 'assets/world/ground_med_a2.png');
    this.load.image('ground_a2', 'assets/world/ground_a2.png');
    this.load.image('objects', 'assets/gfx/objects.png');
    this.load.image('farm', 'assets/gfx/farm.png');
    this.load.image('ores', 'assets/gfx/ores.png');

    // Farm-Props (5-Stufen-Agrarsystem)
    this.load.image('farm_soil_raw', 'assets/props/farm_soil_raw.png');
    this.load.image('farm_soil_dry', 'assets/props/farm_soil_dry.png');
    this.load.image('farm_soil_wet', 'assets/props/farm_soil_wet.png');
    this.load.image('farm_wheat_sprout', 'assets/props/farm_wheat_sprout.png');
    this.load.image('farm_wheat_ripe', 'assets/props/farm_wheat_ripe.png');

    // 2. Kuratierte 16-Bit Griechenland- & Olymp-Sprites
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

    // 4. Autonome mediterrane Fauna (Ziegen & Rinder) - 80x80px Frames!
    this.load.spritesheet('animal_cow', 'assets/gfx/cow.png', {
      frameWidth: 80,
      frameHeight: 80,
    });
    this.load.spritesheet('animal_goat', 'assets/gfx/goat.png', {
      frameWidth: 80,
      frameHeight: 80,
    });
    this.load.spritesheet('dog_molosser', 'assets/fauna/dog_molosser.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // 5. Didaktische 16-Bit-Item-Icons & 5 Leit-Relikte
    for (const id of Object.keys(ITEMS)) {
      this.load.image(`icon-${id}`, `assets/icons/${id}.png`);
    }
    for (const relicId of Object.keys(GREEK_RELICS)) {
      this.load.image(relicId, `assets/icons/${relicId}.png`);
      this.load.image(`icon_${relicId}`, `assets/icons/${relicId}.png`);
      this.load.image(`icon-${relicId}`, `assets/icons/${relicId}.png`);
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

    // Tier-Animationen (Ziege & Rind: 80x80px Frames, Idle = Frame 0, Walk = Frames 4..7)
    this.anims.create({
      key: 'idle-cow',
      frames: [{ key: 'animal_cow', frame: 0 }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'cow-idle',
      frames: [{ key: 'animal_cow', frame: 0 }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'walk-cow',
      frames: this.anims.generateFrameNumbers('animal_cow', { start: 4, end: 7 }),
      frameRate: 5,
      repeat: -1,
    });
    this.anims.create({
      key: 'cow-walk',
      frames: this.anims.generateFrameNumbers('animal_cow', { start: 4, end: 7 }),
      frameRate: 5,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle-goat',
      frames: [{ key: 'animal_goat', frame: 0 }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'goat-idle',
      frames: [{ key: 'animal_goat', frame: 0 }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'walk-goat',
      frames: this.anims.generateFrameNumbers('animal_goat', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'goat-walk',
      frames: this.anims.generateFrameNumbers('animal_goat', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: -1,
    });

    // Animiertes Lagerfeuer
    this.anims.create({
      key: 'fire',
      frames: Array.from({ length: 7 }, (_, i) => ({ key: 'objects', frame: `fire${i}` })),
      frameRate: 10,
      repeat: -1,
    });

    // 🐾 Molosser-Hund (dog_molosser)
    this.anims.create({ key: 'dog-molosser-idle', frames: [{ key: 'dog_molosser', frame: 0 }], frameRate: 1 });
    this.anims.create({ key: 'dog-molosser-walk-down', frames: this.anims.generateFrameNumbers('dog_molosser', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'dog-molosser-walk-right', frames: this.anims.generateFrameNumbers('dog_molosser', { start: 4, end: 7 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'dog-molosser-walk-up', frames: this.anims.generateFrameNumbers('dog_molosser', { start: 8, end: 11 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'dog-molosser-sniff', frames: this.anims.generateFrameNumbers('dog_molosser', { start: 12, end: 15 }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'dog-molosser-sit', frames: this.anims.generateFrameNumbers('dog_molosser', { start: 16, end: 19 }), frameRate: 3, repeat: -1 });
    this.anims.create({ key: 'dog-molosser-wag', frames: this.anims.generateFrameNumbers('dog_molosser', { start: 20, end: 23 }), frameRate: 5, repeat: -1 });

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
