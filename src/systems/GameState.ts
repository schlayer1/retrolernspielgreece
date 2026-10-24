import Phaser from 'phaser';
import { sfx } from '../audio/sound';
import {
  ChapterDef,
  CHAPTERS,
  EPOCH_COMPARISON,
  HIGHLIGHT_TERMS,
  LEXICON,
  EpochComparisonRow,
  LexiconEntry,
} from '../data/chapters';
import {
  BUILDINGS,
  ITEMS,
  RECIPES,
  TRADES,
  GreekBuildingDef,
  GreekItemDef,
  GreekItemId,
  GreekRecipe,
  GreekTradeOffer,
} from '../data/items';
import { FarmPlotState, PlayerGender, PlayerRole, SaveData, SaveManager } from './SaveManager';
export type { PlayerRole };

export const DAY_MS = 240_000;
export const CROP_MS = 14_000;

export interface GreekRoleDef {
  id: PlayerRole;
  name: string;
  icon: string;
  title: string;
  desc: string;
  perk: string;
}

export const GREEK_ROLES: Record<PlayerRole, GreekRoleDef> = {
  sailor: {
    id: 'sailor',
    name: 'Seefahrer / Kolonistin',
    icon: '⛵',
    title: 'Navarch/in der Ägäis',
    desc: 'Vertraut mit Winden, Häfen, Olivenhainen und den Handelsrouten des Mittelmeers.',
    perk: '+20% Lauftempo, 2× Ertrag bei Oliven & Fischfang, Hunger sinkt 35% langsamer.',
  },
  philosopher: {
    id: 'philosopher',
    name: 'Philosoph / Gelehrte',
    icon: '🏛️',
    title: 'Denker/in der Akademie',
    desc: 'Erforscht Demokratie, Theater, Naturgesetze und die Schriften der großen Denker.',
    perk: '+50% Wissenszuwachs, schaltet Zusatzwissen im Lexikon sofort frei.',
  },
  hoplite: {
    id: 'hoplite',
    name: 'Hoplit / Baumeisterin',
    icon: '🛡️',
    title: 'Stratege & Architekt/in der Polis',
    desc: 'Meisterhaft im Umgang mit Marmor, Kalkstein, Eisenerz und dem Schild der Phalanx.',
    perk: '30% Materialrabatt auf Bauten (Presse, Werft, Schmiede, Tempel), +1 Bonus-Erz/Stein beim Abbau.',
  },
};

export interface DialogNode {
  speaker?: string;
  text?: string;
  question?: string;
  options?: string[];
  correct?: number;
  explain?: string;
}

export interface DialogSpec {
  speaker: string;
  nodes: DialogNode[];
  onDone?: () => void;
}

class GameState extends Phaser.Events.EventEmitter {
  playerName = 'Helena';
  playerGender: PlayerGender = 'female';
  playerRole: PlayerRole = 'sailor';
  chapter = 1;
  inventory: Record<string, number> = {};
  food = 90;
  safety = 90;
  knowledge = 0;
  quest = 0;
  lexicon: string[] = [];
  counts: Record<string, number> = {};
  plots: FarmPlotState[] = [
    { id: 0, stage: 'raw', wateredAt: 0 },
    { id: 1, stage: 'raw', wateredAt: 0 },
    { id: 2, stage: 'raw', wateredAt: 0 },
    { id: 3, stage: 'raw', wateredAt: 0 },
    { id: 4, stage: 'raw', wateredAt: 0 },
    { id: 5, stage: 'raw', wateredAt: 0 },
  ];
  buildings: string[] = [];
  dayTime = 0.08;
  collapses = 0;
  quizAttempts = 0;
  playTimeSec = 0;
  distanceMeters = 0;
  daysSurvived = 1;
  relicsFound: string[] = [];
  relicQuizAnswered: string[] = [];
  storyFlags: Record<string, boolean> = {};
  dilemmaSummary = '';
  goatTamed = false;

  playerX = 800;
  playerY = 620;

  malePreviewUrl = '';
  femalePreviewUrl = '';
  showcaseSprites: Record<string, string> = {};
  hasHadExistingSaveOnBoot = false;
  skipStartScreen = false;

  modal = false;
  lastModalClose = 0;
  hint = '';
  compassText = '';
  touch?: { vector: Phaser.Math.Vector2; consumeAction(): boolean; setVisible?(visible: boolean): void };

  readonly saves = new SaveManager();

  constructor() {
    super();
  }

  get chapters() {
    return CHAPTERS;
  }

  get totalChapters(): number {
    return Object.keys(CHAPTERS).length; // 10
  }

  get currentChapterDef(): ChapterDef {
    return CHAPTERS[this.chapter] ?? CHAPTERS[1];
  }

  get lexiconData(): Record<string, LexiconEntry> {
    return LEXICON;
  }

  get itemsData(): Record<GreekItemId, GreekItemDef> {
    return ITEMS;
  }

  get buildingsData(): GreekBuildingDef[] {
    return BUILDINGS;
  }

  get recipesData(): GreekRecipe[] {
    return RECIPES;
  }

  get tradesData(): GreekTradeOffer[] {
    return TRADES;
  }

  get highlightTerms(): string[] {
    return HIGHLIGHT_TERMS;
  }

  get epochComparison(): EpochComparisonRow[] {
    return EPOCH_COMPARISON;
  }

  count(item: string): number {
    return this.inventory[item] ?? 0;
  }

  add(item: string, n = 1): void {
    let actual = n;
    if (this.playerRole === 'sailor' && (item === 'oliven' || item === 'fisch')) {
      actual = n * 2;
    } else if (
      this.playerRole === 'hoplite' &&
      (item === 'kalkstein' || item === 'marmor' || item === 'eisenerz' || item === 'silbererz')
    ) {
      actual = n + 1;
    }
    this.inventory[item] = Math.max(0, this.count(item) + actual);
    if (actual > 0) sfx.pickup();
    this.emit('inventory');
    this.checkQuest();
    this.persist();
  }

  bump(key: string, n = 1): void {
    this.counts[key] = (this.counts[key] ?? 0) + n;
    this.checkQuest();
    this.persist();
  }

  canAfford(r: GreekRecipe): boolean {
    return Object.entries(r.cost).every(([id, n]) => this.count(id) >= Number(n ?? 0));
  }

  canCraft(r: GreekRecipe): boolean {
    if (r.requiresBuilding && !this.hasBuilding(r.requiresBuilding)) return false;
    return this.canAfford(r);
  }

  getBuildingCost(b: GreekBuildingDef): Record<string, number> {
    const discounted: Record<string, number> = {};
    for (const [id, n] of Object.entries(b.cost)) {
      if (this.playerRole === 'hoplite') {
        discounted[id] = Math.max(1, Math.floor(Number(n ?? 0) * 0.7));
      } else {
        discounted[id] = Number(n ?? 0);
      }
    }
    return discounted;
  }

  canAffordBuilding(b: GreekBuildingDef): boolean {
    const cost = this.getBuildingCost(b);
    return Object.entries(cost).every(([id, n]) => this.count(id) >= n);
  }

  canAffordTrade(t: GreekTradeOffer): boolean {
    return Object.entries(t.give).every(([id, n]) => this.count(id) >= Number(n ?? 0));
  }

  hasBuilding(id: string): boolean {
    return this.buildings.includes(id);
  }

  addBuilding(id: string): void {
    if (!this.hasBuilding(id)) {
      this.buildings.push(id);
      this.emit('buildings');
      this.checkQuest();
      this.persist();
    }
  }

  craft(r: GreekRecipe): boolean {
    if (!this.canCraft(r)) return false;
    for (const [id, n] of Object.entries(r.cost)) {
      this.inventory[id] = Math.max(0, this.count(id) - Number(n ?? 0));
    }
    const resultItem = r.result ? r.result.item : r.id;
    const resultCount = r.result ? r.result.count : 1;
    this.add(resultItem, resultCount);
    sfx.craft();
    this.bump(`craft_${r.id}`);
    this.bump(r.id);
    this.emit('inventory');
    this.checkQuest();
    this.persist();
    return true;
  }

  trade(t: GreekTradeOffer): boolean {
    if (!this.canAffordTrade(t)) return false;
    for (const [id, n] of Object.entries(t.give)) {
      this.inventory[id] = Math.max(0, this.count(id) - Number(n ?? 0));
    }
    this.add(t.receive.item, t.receive.count);
    sfx.craft();
    this.bump(t.id);
    this.emit('inventory');
    this.checkQuest();
    this.persist();
    return true;
  }

  build(b: GreekBuildingDef): boolean {
    if (this.hasBuilding(b.id)) return false;
    if (!this.canAffordBuilding(b)) return false;
    const cost = this.getBuildingCost(b);
    for (const [id, n] of Object.entries(cost)) {
      this.inventory[id] = Math.max(0, this.count(id) - n);
    }
    this.addBuilding(b.id);
    sfx.craft();
    this.bump(`build_${b.id}`);
    this.emit('inventory');
    this.checkQuest();
    return true;
  }

  hasLexicon(key: string): boolean {
    return this.lexicon.includes(key);
  }

  unlockLexicon(key: string): boolean {
    if (this.hasLexicon(key)) return false;
    this.lexicon.push(key);
    const totalCount = Object.keys(this.lexiconData).length;
    let base = (this.lexicon.length / Math.max(1, totalCount)) * 100;
    if (this.playerRole === 'philosopher') base *= 1.45;
    this.knowledge = Math.min(100, Math.round(base));
    sfx.quest();
    this.emit('lexicon', key);
    this.emit('toast', `Neues Geschichtswissen: ${this.lexiconData[key]?.title ?? key}`);
    this.persist();
    return true;
  }

  unlockSilent(keys: string[]): void {
    for (const k of keys) {
      if (!this.lexicon.includes(k)) this.lexicon.push(k);
    }
    const totalCount = Object.keys(this.lexiconData).length;
    let base = (this.lexicon.length / Math.max(1, totalCount)) * 100;
    if (this.playerRole === 'philosopher') base *= 1.45;
    this.knowledge = Math.min(100, Math.round(base));
  }

  openDialog(spec: DialogSpec): void {
    this.emit('dialog', spec);
  }

  startChapter(ch: number): void {
    this.chapter = Math.max(1, Math.min(10, ch));
    this.quest = 0;

    // Ensure basic farming tools exist
    if (this.count('hacke') === 0) this.inventory.hacke = 1;
    if (this.count('sichel') === 0) this.inventory.sichel = 1;
    if (this.count('samen') === 0) this.inventory.samen = 3;

    if (this.chapter === 1) {
      this.buildings = [];
      this.playerX = 800;
      this.playerY = 620;
      this.plots = this.plots.map((p) => ({ ...p, stage: 'raw', wateredAt: 0 }));
      this.unlockSilent(['polis', 'akropolis', 'agora']);
    } else if (this.chapter === 2) {
      this.buildings = ['olivenpresse'];
      this.playerX = 1200;
      this.playerY = 720;
      if (this.count('olivenoel') === 0) this.inventory.olivenoel = 1;
      if (this.count('holz') < 2) this.inventory.holz = 2;
      this.unlockSilent(['hellas', 'olivenbaum', 'kolonisation']);
    } else if (this.chapter === 3) {
      this.buildings = ['olivenpresse', 'hafen_werft'];
      this.playerX = 260;
      this.playerY = 560;
      if (this.count('kalkstein') < 2) this.inventory.kalkstein = 2;
      if (this.count('holz') < 2) this.inventory.holz = 2;
      this.unlockSilent(['sparta', 'agoge', 'heloten']);
    } else if (this.chapter === 4) {
      this.buildings = ['olivenpresse', 'hafen_werft', 'sparta_schmiede'];
      this.playerX = 760;
      this.playerY = 540;
      if (this.count('kalkstein') < 3) this.inventory.kalkstein = 3;
      if (this.count('ton') < 1) this.inventory.ton = 1;
      this.unlockSilent(['athen_demokratie', 'ekklesia', 'ostrakismos']);
    } else if (this.chapter === 5) {
      this.buildings = ['olivenpresse', 'hafen_werft', 'sparta_schmiede', 'pnyx_buehne'];
      this.playerX = 1140;
      this.playerY = 220;
      if (this.count('drachme') < 2) this.inventory.drachme = 2;
      if (this.count('amphore') < 1) this.inventory.amphore = 1;
      if (this.count('olivenoel') < 1) this.inventory.olivenoel = 1;
      if (this.count('oliven') < 2) this.inventory.oliven = 2;
      this.unlockSilent(['olymp_goetter', 'orakel_delphi', 'olympische_spiele']);
    } else if (this.chapter === 6) {
      this.buildings = ['olivenpresse', 'hafen_werft', 'sparta_schmiede', 'pnyx_buehne', 'zeus_altar'];
      this.playerX = 300;
      this.playerY = 200;
      if (this.count('aspis_schild') === 0) this.inventory.aspis_schild = 1;
      if (this.count('dory_speer') === 0) this.inventory.dory_speer = 1;
      if (this.count('fackel') === 0) this.inventory.fackel = 1;
      this.unlockSilent(['perserkriege_marathon', 'thermopylen', 'hoplit_phalanx']);
    } else if (this.chapter === 7) {
      this.buildings = ['olivenpresse', 'hafen_werft', 'sparta_schmiede', 'pnyx_buehne', 'zeus_altar'];
      this.playerX = 1200;
      this.playerY = 820;
      if (this.count('eisenerz') < 2) this.inventory.eisenerz = 2;
      if (this.count('holz') < 2) this.inventory.holz = 2;
      this.unlockSilent(['trireme_salamis']);
    } else if (this.chapter === 8) {
      this.buildings = ['olivenpresse', 'hafen_werft', 'sparta_schmiede', 'pnyx_buehne', 'zeus_altar'];
      this.playerX = 560;
      this.playerY = 700;
      if (this.count('marmor') < 2) this.inventory.marmor = 2;
      if (this.count('ton') < 4) this.inventory.ton = 4;
      if (this.count('olivenoel') < 1) this.inventory.olivenoel = 1;
      if (this.count('drachme') < 1) this.inventory.drachme = 1;
      this.unlockSilent(['peloponnesischer_krieg', 'philosophie']);
    } else if (this.chapter === 9) {
      this.buildings = [
        'olivenpresse',
        'hafen_werft',
        'sparta_schmiede',
        'pnyx_buehne',
        'zeus_altar',
        'akademie_stube',
      ];
      this.playerX = 1000;
      this.playerY = 560;
      if (this.count('holz') < 2) this.inventory.holz = 2;
      if (this.count('eisenerz') < 1) this.inventory.eisenerz = 1;
      if (this.count('marmor') < 3) this.inventory.marmor = 3;
      if (this.count('schriftrolle') < 1) this.inventory.schriftrolle = 1;
      this.unlockSilent(['alexander_der_grosse', 'hellenismus']);
    } else if (this.chapter === 10) {
      this.buildings = [
        'olivenpresse',
        'hafen_werft',
        'sparta_schmiede',
        'pnyx_buehne',
        'zeus_altar',
        'akademie_stube',
        'bibliothek_alexandria',
      ];
      this.playerX = 1060;
      this.playerY = 680;
      if (this.count('schriftrolle') < 1) this.inventory.schriftrolle = 1;
      if (this.count('drachme') < 1) this.inventory.drachme = 1;
      this.unlockSilent(['diadochenreiche']);
    }

    sfx.quest();
    this.persist();
    this.emit('buildings');
    this.emit('chapterChanged', this.chapter);
    this.emit('inventory');
    this.emit('quest');
  }

  checkQuest(): void {
    const c = (k: string) => this.counts[k] ?? 0;
    let conds: Array<() => boolean> = [];

    if (this.chapter === 1) {
      conds = [
        () => false, // 0: Intro bei Nikolaos
        () =>
          (this.count('holz') >= 2 || c('holz_chopped') >= 2) &&
          (this.count('kalkstein') >= 2 || c('kalkstein_mined') >= 2), // 1: Holz & Kalkstein
        () => this.count('wasser') >= 1 || c('cistern_water') >= 1, // 2: Quellwasser geschöpft
        () => c('watered_plot') >= 1, // 3: Feld aufgelockert, gesät & bewässert
        () =>
          (c('harvested_gerste') >= 1 || this.count('gerste') >= 1) &&
          (c('oliven_picked') >= 2 || this.count('oliven') >= 2), // 4: Gerste & Oliven geerntet
        () => this.hasBuilding('olivenpresse'), // 5: Olivenpresse errichtet
        () => this.count('olivenoel') >= 1 || c('craft_olivenoel') >= 1, // 6: Olivenöl gepresst
      ];
    } else if (this.chapter === 2) {
      conds = [
        () => false, // 0: Intro bei Telesikles
        () => this.count('wolle') >= 2 || c('wolle_gathered') >= 2 || this.count('segeltuch') >= 1, // 1: Wolle
        () => this.count('segeltuch') >= 1 || c('craft_segeltuch') >= 1 || this.hasBuilding('hafen_werft'), // 2: Segeltuch
        () => this.hasBuilding('hafen_werft'), // 3: Werft gebaut
        () => this.count('amphore') >= 1 || c('craft_amphore') >= 1, // 4: Ton & Amphore
        () => this.count('fackel') >= 1 || c('craft_fackel') >= 1, // 5: Heilige Fackel
        () => c('colony_ship_equipped') >= 1, // 6: Kolonistenschiff ausgerüstet
      ];
    } else if (this.chapter === 3) {
      conds = [
        () => false, // 0: Intro bei Kleomenes
        () => this.count('eisenerz') >= 2 || c('iron_mined') >= 2 || this.hasBuilding('sparta_schmiede'), // 1: Eisenerz
        () => this.hasBuilding('sparta_schmiede'), // 2: Lakonische Schmiede
        () => this.count('aspis_schild') >= 1 || c('craft_aspis_schild') >= 1, // 3: Aspis-Schild
        () => this.count('dory_speer') >= 1 || c('craft_dory_speer') >= 1, // 4: Dory-Speer
        () => this.count('blutsuppe') >= 1 || c('cooked_blutsuppe') >= 1, // 5: Blutsuppe gekocht
        () => c('phalanx_trained') >= 1, // 6: Phalanx-Training
      ];
    } else if (this.chapter === 4) {
      conds = [
        () => false, // 0: Intro bei Perikles
        () => this.count('silbererz') >= 2 || c('silver_mined') >= 2 || this.count('drachme') >= 1, // 1: Silbererz
        () => this.count('drachme') >= 1 || c('craft_drachme') >= 1, // 2: Eulen-Drachme
        () => this.hasBuilding('pnyx_buehne'), // 3: Rednerbühne (Bema)
        () => this.count('ostrakon') >= 1 || c('craft_ostrakon') >= 1, // 4: Ostrakon geritzt
        () => c('ekklesia_voted') >= 1, // 5: In der Ekklesia abgestimmt
      ];
    } else if (this.chapter === 5) {
      conds = [
        () => false, // 0: Intro bei Pythia
        () =>
          (this.count('marmor') >= 2 || this.hasBuilding('zeus_altar')) &&
          (this.count('weihrauch') >= 1 || c('trade_weihrauch') >= 1 || c('zeus_honored') >= 1), // 1: Marmor & Weihrauch
        () => this.hasBuilding('zeus_altar'), // 2: Altar von Olympia gebaut
        () => c('olymp_entered') >= 1, // 3: Auf den Olymp gestiegen
        () => c('zeus_honored') >= 1, // 4: Opferschale vor Zeus entzündet
        () => this.count('lorbeerkranz') >= 1 || c('craft_lorbeerkranz') >= 1, // 5: Siegerkranz geflochten
      ];
    } else if (this.chapter === 6) {
      conds = [
        () => false, // 0: Intro bei Leonidas
        () => c('thermopylae_fortified') >= 1, // 1: Pass verstärkt
        () =>
          (this.count('aspis_schild') >= 1 || c('craft_aspis_schild') >= 1) &&
          (this.count('dory_speer') >= 1 || c('craft_dory_speer') >= 1), // 2: Hoplitenrüstung bereit
        () => c('beacon_lit') >= 1, // 3: Signalfeuer am Wachturm entzündet
        () => c('marathon_run_done') >= 1, // 4: Eilbotenlauf zur Akropolis
      ];
    } else if (this.chapter === 7) {
      conds = [
        () => false, // 0: Intro bei Themistokles
        () => this.count('rammsporn') >= 1 || c('craft_rammsporn') >= 1 || c('trireme_armed') >= 1, // 1: Rammsporn
        () => this.count('holz') >= 2 || c('holz_chopped') >= 2 || c('trireme_armed') >= 1, // 2: Ruderholz
        () => c('trireme_armed') >= 1, // 3: Rammsporn an Trireme montiert
        () => c('salamis_victory') >= 1, // 4: Manöver von Salamis ausgeführt
      ];
    } else if (this.chapter === 8) {
      conds = [
        () => false, // 0: Intro bei Sokrates
        () => this.hasBuilding('akademie_stube'), // 1: Schreibstube der Akademie
        () => this.count('theatermaske') >= 1 || c('craft_theatermaske') >= 1 || c('drama_performed') >= 1, // 2: Theatermaske
        () => c('drama_performed') >= 1, // 3: Tragödie im Theater aufgeführt
        () => this.count('schriftrolle') >= 1 || c('craft_schriftrolle') >= 1, // 4: Philosophische Schriftrolle
      ];
    } else if (this.chapter === 9) {
      conds = [
        () => false, // 0: Intro bei Alexander
        () => this.count('sarissa_lanze') >= 1 || c('craft_sarissa_lanze') >= 1, // 1: Sarissa-Lanze
        () => c('gordian_knot_cut') >= 1, // 2: Gordischer Knoten durchtrennt
        () => this.hasBuilding('bibliothek_alexandria'), // 3: Große Bibliothek errichtet
        () => c('pharos_lit') >= 1, // 4: Pharos-Leuchtturm entzündet
      ];
    } else if (this.chapter === 10) {
      conds = [
        () => false, // 0: Intro bei Ptolemaios
        () => c('legacy_inspected') >= 1, // 1: Vermächtnis Alexanders untersucht
        () => this.count('diadochen_karte') >= 1 || c('craft_diadochen_karte') >= 1 || c('map_archived') >= 1, // 2: Weltkarte gezeichnet
        () => c('map_archived') >= 1, // 3: Karte in der Großen Bibliothek archiviert
      ];
    }

    // Loop so multiple already-satisfied steps advance cleanly
    const chMeta = this.currentChapterDef;
    let advanced = false;
    while (this.quest > 0 && this.quest < chMeta.quests.length - 1) {
      const fn = conds[this.quest];
      if (fn && fn()) {
        this.quest++;
        advanced = true;
      } else {
        break;
      }
    }

    if (advanced) {
      sfx.quest();
      this.emit('quest');
      const qTitle = chMeta.quests[this.quest];
      if (this.quest === chMeta.quests.length - 1) {
        this.emit(
          'toast',
          `Kapitel-Aufgaben gemeistert! Kehre zu ${chMeta.mentor} zurück zur Wissens-Prüfung!`,
        );
      } else {
        this.emit('toast', `Aufgabe geschafft! Nächstes Ziel: ${qTitle}`);
      }
      this.persist();
    }
  }

  isReadyForQuiz(): boolean {
    const meta = this.currentChapterDef;
    return this.quest === meta.quests.length - 1;
  }

  isChapterComplete(): boolean {
    const meta = this.currentChapterDef;
    return this.quest >= meta.quests.length;
  }

  eat(): string {
    const foods = [
      { id: 'blutsuppe', val: 50, name: 'Spartanische Blutsuppe' },
      { id: 'gebratener_fisch', val: 45, name: 'Gegrillter Mittelmeerfisch' },
      { id: 'maza_brot', val: 40, name: 'Maza-Gerstenbrot' },
      { id: 'ziegenkaese', val: 35, name: 'Hirten-Ziegenkäse' },
      { id: 'olivenoel', val: 30, name: 'Schluck Olivenöl' },
      { id: 'fisch', val: 25, name: 'Frische Meerbrasse' },
      { id: 'oliven', val: 22, name: 'Attische Oliven' },
    ];
    for (const f of foods) {
      if (this.count(f.id) > 0) {
        this.inventory[f.id]--;
        this.food = Math.min(100, this.food + f.val);
        sfx.eat();
        this.emit('inventory');
        this.persist();
        return `Verzehrt: 1× ${f.name} (+${f.val}% Hunger gestillt)`;
      }
    }
    return 'Keine Nahrung im Beutel! Pflücke Oliven, fische am Meer oder backe Maza-Brot.';
  }

  totalItemsCollected(): number {
    return Object.values(this.counts).reduce((a, b) => a + b, 0);
  }

  formatPlayTime(): string {
    const m = Math.floor(this.playTimeSec / 60);
    const s = Math.floor(this.playTimeSec % 60);
    return `${m} Min. ${s} Sek.`;
  }

  epochRankTitle(): string {
    const titles = [
      'Bürger/in der jungen Polis (Kap. 1)',
      'Oikist/in der Großen Kolonisation (Kap. 2)',
      'Hoplit/in der Spartanischen Phalanx (Kap. 3)',
      'Stimme der Athenischen Demokratie (Kap. 4)',
      'Gesandte/r des Götterbergs Olymp (Kap. 5)',
      'Verteidiger/in von Marathon & Thermopylen (Kap. 6)',
      'Trierarch/in des Sieges von Salamis (Kap. 7)',
      'Philosoph/in der Athenischen Akademie (Kap. 8)',
      'Gefährte/in Alexanders des Großen (Kap. 9)',
      'Archon & Meister/in des Hellenismus (Kap. 10)',
    ];
    return titles[Math.min(titles.length - 1, Math.max(0, this.chapter - 1))];
  }

  setProfile(name: string, gender: PlayerGender, role: PlayerRole): void {
    if (name.trim()) this.playerName = name.trim().slice(0, 16);
    this.playerGender = gender;
    this.playerRole = role;
    this.emit('profileChanged');
    this.persist();
  }

  resetNewGame(chapter = 1): void {
    this.saves.clear();
    this.counts = {};
    this.lexicon = [];
    this.relicsFound = [];
    this.relicQuizAnswered = [];
    this.food = 100;
    this.safety = 100;
    this.playTimeSec = 0;
    this.distanceMeters = 0;
    this.daysSurvived = 1;
    this.goatTamed = false;
    this.startChapter(chapter);
    this.persist();
  }

  roleSpecialistTitle(): string {
    return GREEK_ROLES[this.playerRole]?.title ?? 'Hellenische/r Pionier/in';
  }

  exportCode(): string {
    const pName = (this.playerName || 'HELENA')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    const gCode = this.playerGender === 'male' ? 'M' : 'W';
    const rCode =
      this.playerRole === 'sailor' ? 'S' : this.playerRole === 'philosopher' ? 'P' : 'H';
    const mins = Math.max(1, Math.round(this.playTimeSec / 60));
    return `GRC-${pName}-${gCode}-${rCode}-K${this.chapter}-Q${this.quest}-R${this.relicsFound.length}-${mins}M`;
  }

  importCode(raw: string): { ok: boolean; msg: string } {
    const clean = raw.trim().toUpperCase();
    const parts = clean.split('-');
    if (parts.length < 6 || (parts[0] !== 'GRC' && parts[0] !== 'HEL')) {
      return {
        ok: false,
        msg: 'Ungültiges Code-Format. Erwartet: GRC-NAME-W-S-K[1..10]-Q[Y]-R[Z]-[ZEIT]M',
      };
    }
    const name = parts[1] || 'HELENA';
    const gender: PlayerGender = parts[2] === 'M' ? 'male' : 'female';
    let role: PlayerRole = 'sailor';
    if (parts[3] === 'P') role = 'philosopher';
    else if (parts[3] === 'H') role = 'hoplite';

    const chPart = parts.find((p) => p.startsWith('K')) || 'K1';
    const qPart = parts.find((p) => p.startsWith('Q')) || 'Q0';
    const rPart = parts.find((p) => p.startsWith('R')) || 'R0';

    const ch = parseInt(chPart.replace('K', ''), 10);
    const q = parseInt(qPart.replace('Q', ''), 10);
    const rCount = parseInt(rPart.replace('R', ''), 10);

    if (isNaN(ch) || ch < 1 || ch > 10) {
      return { ok: false, msg: 'Ungültiges Kapitel im Code (K1 bis K10 erlaubt)!' };
    }

    this.playerName = name.charAt(0) + name.slice(1).toLowerCase();
    this.playerGender = gender;
    this.playerRole = role;
    this.startChapter(ch);
    const maxQ = Math.max(0, (CHAPTERS[ch]?.quests.length ?? 1) - 1);
    this.quest = isNaN(q) ? 0 : Math.max(0, Math.min(q, maxQ));

    if (!isNaN(rCount) && rCount > 0) {
      const allRelicIds = [
        'relic_amphore',
        'relic_eule',
        'relic_agamemnon',
        'relic_antikythera',
        'relic_alexander',
      ];
      this.relicsFound = allRelicIds.slice(0, Math.min(5, rCount));
      this.relicQuizAnswered = [...this.relicsFound];
    }

    this.persist();
    return {
      ok: true,
      msg: `Spielstand geladen: ${this.playerName} – Kapitel ${ch}, Aufgabe ${this.quest + 1}!`,
    };
  }

  loadFrom(data: SaveData): void {
    this.playerName = data.playerName || 'Helena';
    this.playerGender = data.playerGender || 'female';
    this.playerRole = data.playerRole || 'sailor';
    this.chapter = Math.max(1, Math.min(10, data.chapter || 1));
    this.playerX = data.x ?? 800;
    this.playerY = data.y ?? 620;
    this.inventory = data.inventory || {};
    this.lexicon = data.lexicon || [];
    this.food = data.food ?? 90;
    this.safety = data.safety ?? 90;
    this.knowledge = data.knowledge ?? 0;
    this.quest = data.quest ?? 0;
    this.counts = data.counts || {};
    this.plots = data.plots || this.plots;
    this.buildings = data.buildings || [];
    this.dayTime = data.dayTime ?? 0.08;
    this.collapses = data.collapses || 0;
    this.quizAttempts = data.quizAttempts || 0;
    this.playTimeSec = data.playTimeSec || 0;
    this.distanceMeters = data.distanceMeters || 0;
    this.daysSurvived = data.daysSurvived || 1;
    this.relicsFound = data.relicsFound || [];
    this.relicQuizAnswered = data.relicQuizAnswered || [];
  }

  toSaveData(): SaveData {
    return {
      version: 1,
      epoch: 'griechenland',
      playerName: this.playerName,
      playerGender: this.playerGender,
      playerRole: this.playerRole,
      chapter: this.chapter,
      x: this.playerX,
      y: this.playerY,
      inventory: this.inventory,
      lexicon: this.lexicon,
      food: this.food,
      safety: this.safety,
      knowledge: this.knowledge,
      quest: this.quest,
      counts: this.counts,
      plots: this.plots,
      buildings: this.buildings,
      dayTime: this.dayTime,
      collapses: this.collapses,
      quizAttempts: this.quizAttempts,
      playTimeSec: this.playTimeSec,
      distanceMeters: this.distanceMeters,
      daysSurvived: this.daysSurvived,
      relicsFound: this.relicsFound,
      relicQuizAnswered: this.relicQuizAnswered,
    };
  }

  persist(): void {
    this.saves.save(this.toSaveData());
  }
}

export const state = new GameState();
if (typeof window !== 'undefined') {
  (window as any).hellasState = state;
  (window as any).kemetState = state;
}
