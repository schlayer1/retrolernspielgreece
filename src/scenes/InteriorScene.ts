import Phaser from 'phaser';
import { state } from '../systems/GameState';
import { sfx } from '../audio/sound';
import { STATIONS } from '../data/stations';
import { RELICS } from '../data/relics';

export interface InteriorEntryData {
  buildingId: 'parthenon_cella' | 'kerameikos_werkstatt' | 'bouleuterion_schule';
  returnX: number;
  returnY: number;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
  action: () => void;
}

export class InteriorScene extends Phaser.Scene {
  private entryData!: InteriorEntryData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    ESC: Phaser.Input.Keyboard.Key;
  };
  private hotspots: Hotspot[] = [];
  private promptLabel!: Phaser.GameObjects.Text;
  private roomWidth = 520;
  private roomHeight = 360;
  private facing: 'down' | 'up' | 'left' | 'right' = 'up';
  private exitMatRect!: Phaser.Geom.Rectangle;
  private isExiting = false;

  constructor() {
    super('InteriorScene');
  }

  public init(data: InteriorEntryData): void {
    this.entryData = data || {
      buildingId: 'parthenon_cella',
      returnX: 800,
      returnY: 750,
    };
    this.hotspots = [];
    this.isExiting = false;
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#0c0a08');

    const cx = this.roomWidth / 2;
    const cy = this.roomHeight / 2;

    this.buildRoomGeometry(this.entryData.buildingId);

    const pKey = state.playerGender === 'female' ? 'player_greek_female' : 'player_greek_male';
    this.player = this.physics.add
      .sprite(cx, this.roomHeight - 62, pKey, 12)
      .setScale(1.0)
      .setDepth(50)
      .setCollideWorldBounds(true);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 10);
    body.setOffset(2, 22);

    this.physics.world.setBounds(36, 52, this.roomWidth - 72, this.roomHeight - 84);

    this.exitMatRect = new Phaser.Geom.Rectangle(cx - 28, this.roomHeight - 36, 56, 24);

    this.cameras.main.centerOn(cx, cy - 12);
    this.cameras.main.setZoom(1.85);
    this.cameras.main.fadeIn(260, 0, 0, 0);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        E: Phaser.Input.Keyboard.KeyCodes.E,
        ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
      }) as typeof this.wasd;
    }

    this.promptLabel = this.add
      .text(cx, cy - 28, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        color: '#fef08a',
        backgroundColor: '#1e1b18ee',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setVisible(false);

    this.add
      .text(cx, 20, this.getRoomTitle(this.entryData.buildingId), {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fde68a',
        backgroundColor: '#1c1917dd',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(190);
  }

  private getRoomTitle(id: InteriorEntryData['buildingId']): string {
    switch (id) {
      case 'parthenon_cella':
        return '🏛️ Cella des Parthenon (Athena-Heiligtum auf der Akropolis)';
      case 'kerameikos_werkstatt':
        return '🏺 Töpfer- & Schreibwerkstatt im Kerameikos (Agora)';
      case 'bouleuterion_schule':
        return '🦉 Bouleuterion & Philosophenschule (Rat der 500 & Akademie)';
    }
  }

  private buildRoomGeometry(id: InteriorEntryData['buildingId']): void {
    const g = this.add.graphics().setDepth(1);

    const floorColor =
      id === 'parthenon_cella'
        ? 0xe7dfd1
        : id === 'kerameikos_werkstatt'
        ? 0x8a6443
        : 0xd4c5a9;
    const tileAlt =
      id === 'parthenon_cella'
        ? 0xd6cbb8
        : id === 'kerameikos_werkstatt'
        ? 0x785538
        : 0xc2b295;

    // 1. Marmor- / Tonfliesen-Boden
    g.fillStyle(floorColor, 1);
    g.fillRect(32, 44, this.roomWidth - 64, this.roomHeight - 72);

    for (let y = 44; y < this.roomHeight - 28; y += 24) {
      for (let x = 32; x < this.roomWidth - 32; x += 24) {
        if (((x + y) / 24) % 2 === 0) {
          g.fillStyle(tileAlt, 0.55);
          g.fillRect(x, y, 24, 24);
        }
        g.lineStyle(1, 0x292524, 0.16);
        g.strokeRect(x, y, 24, 24);
      }
    }

    // Griechischer Mäander-Randstreifen
    g.lineStyle(2, 0xb45309, 0.55);
    g.strokeRect(44, 56, this.roomWidth - 88, this.roomHeight - 96);

    // 2. Umfassungsmauern aus Kalkstein/Marmor
    g.fillStyle(0x44403c, 1);
    g.fillRect(20, 24, this.roomWidth - 40, 22);
    g.fillRect(20, 24, 14, this.roomHeight - 44);
    g.fillRect(this.roomWidth - 34, 24, 14, this.roomHeight - 44);
    g.fillRect(20, this.roomHeight - 28, this.roomWidth - 40, 12);

    // 3. Ausgangs-Teppich (exitMat) unten in der Mitte
    const cx = this.roomWidth / 2;
    g.fillStyle(0x991b1b, 1);
    g.fillRect(cx - 28, this.roomHeight - 36, 56, 18);
    g.lineStyle(2, 0xfbbf24, 1);
    g.strokeRect(cx - 28, this.roomHeight - 36, 56, 18);

    this.add
      .text(cx, this.roomHeight - 27, '▼ Ausgang [E / ESC]', {
        fontFamily: 'Georgia, serif',
        fontSize: '9px',
        color: '#fef08a',
      })
      .setOrigin(0.5)
      .setDepth(15);

    // 4. Dorische/Ionische Säulen & Fackeln
    const pillarPositions = [
      { x: 96, y: 110 },
      { x: this.roomWidth - 96, y: 110 },
      { x: 96, y: 230 },
      { x: this.roomWidth - 96, y: 230 },
    ];
    for (const pos of pillarPositions) {
      g.fillStyle(0xf5f5f4, 1);
      g.fillCircle(pos.x, pos.y, 13);
      g.lineStyle(2, 0xb45309, 0.8);
      g.strokeCircle(pos.x, pos.y, 13);

      const glow = this.add
        .circle(pos.x, pos.y - 16, 18, 0xfbbf24, 0.22)
        .setDepth(10);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.14, to: 0.32 },
        scale: { from: 0.92, to: 1.12 },
        duration: 620 + Math.random() * 250,
        yoyo: true,
        repeat: -1,
      });
    }

    // 5. Raumspezifische Ausstattung, 16x32 Mentor (Scale 1.0) & Didaktik-Hotspots
    if (id === 'parthenon_cella') {
      // Gold-Elfenbein-Statue der Athena Parthenos & Säulen-Station
      g.fillStyle(0x78350f, 1);
      g.fillRect(cx - 38, 72, 76, 36);
      g.lineStyle(2, 0xfacc15, 1);
      g.strokeRect(cx - 38, 72, 76, 36);

      if (this.textures.exists('statue_athena_shrine')) {
        this.add.image(cx, 78, 'statue_athena_shrine').setScale(0.55).setDepth(30);
      }
      this.add.image(155, 145, 'amphora_black_painted').setScale(0.9).setDepth(28);
      this.add.image(this.roomWidth - 155, 145, 'column_doric').setScale(0.75).setDepth(28);

      // Priesterin Pythia / Baumeister Phidias (strictly 16x32 at scale 1.0)
      this.add.sprite(cx + 56, 118, 'npc_pythia', 0).setScale(1.0).setDepth(45);
      this.add
        .text(cx + 56, 96, 'Priesterin der Athene', {
          fontFamily: 'Georgia, serif',
          fontSize: '8px',
          color: '#fde68a',
          backgroundColor: '#1c1917cc',
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(46);

      this.hotspots.push(
        {
          id: 'athena_altar',
          x: cx,
          y: 112,
          label: '[E] Säulenordnungen & Parthenon-Architektur untersuchen',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_saeulenordnung') || STATIONS[3];
            const w = window as unknown as { __openStation?: (id: string) => void };
            if (w.__openStation && st) w.__openStation(st.id);
          },
        },
        {
          id: 'helmet_relic',
          x: 155,
          y: 155,
          label: '[E] 360°-Quelleninspektor: Korinthischer Bronzehelm & Preisamphore',
          action: () => {
            const rel = RELICS.find((r) => r.id === 'relic_agamemnon') || RELICS[0];
            const w = window as unknown as { __openArtifactInspector?: (id: string) => void };
            if (w.__openArtifactInspector && rel) w.__openArtifactInspector(rel.id);
          },
        },
        {
          id: 'trireme_tactics',
          x: this.roomWidth - 155,
          y: 155,
          label: '[E] Weihegeschenke von Salamis: Taktik-Tisch der Triere öffnen',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_salamis_triere') || STATIONS[4];
            const w = window as unknown as { __openStation?: (id: string) => void };
            if (w.__openStation && st) w.__openStation(st.id);
          },
        },
      );
    } else if (id === 'kerameikos_werkstatt') {
      // Töpferofen & Olivenöl-Amphorenlager im Kerameikos
      g.fillStyle(0x9a3412, 1);
      g.fillRect(cx - 42, 76, 84, 34);
      g.lineStyle(2, 0xf97316, 1);
      g.strokeRect(cx - 42, 76, 84, 34);

      this.add.image(cx, 92, 'pottery_kiln').setScale(0.8).setDepth(30);
      this.add.image(155, 160, 'amphora_black_painted').setScale(0.95).setDepth(28);
      this.add.image(this.roomWidth - 155, 160, 'terracotta_pots').setScale(0.85).setDepth(28);

      // Handwerker / Dorfältester Nikolaos (16x32 at scale 1.0)
      this.add.sprite(cx - 56, 122, 'npc_nikolaos', 0).setScale(1.0).setDepth(45);
      this.add
        .text(cx - 56, 100, 'Töpfermeister Exekias', {
          fontFamily: 'Georgia, serif',
          fontSize: '8px',
          color: '#fde68a',
          backgroundColor: '#1c1917cc',
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(46);

      this.hotspots.push(
        {
          id: 'kiln_station',
          x: cx,
          y: 115,
          label: '[E] Töpferofen im Kerameikos: Schwarzfigurigen 3-Phasen-Brand starten',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_kerameikos') || STATIONS[1];
            const w = window as unknown as { __openStation?: (id: string) => void };
            if (w.__openStation && st) w.__openStation(st.id);
          },
        },
        {
          id: 'olive_press_station',
          x: 155,
          y: 165,
          label: '[E] Attische Hebel-Olivenpresse bedienen',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_olivenpresse') || STATIONS[0];
            const w = window as unknown as { __openStation?: (id: string) => void };
            if (w.__openStation && st) w.__openStation(st.id);
          },
        },
        {
          id: 'amphora_inspector',
          x: this.roomWidth - 155,
          y: 165,
          label: '[E] 360°-Quelleninspektor: Panathenäische Preisamphore untersuchen',
          action: () => {
            const rel = RELICS.find((r) => r.id === 'relic_amphore') || RELICS[0];
            const w = window as unknown as { __openArtifactInspector?: (id: string) => void };
            if (w.__openArtifactInspector && rel) w.__openArtifactInspector(rel.id);
          },
        },
      );
    } else {
      // Bouleuterion & Philosophenschule (Rat der 500, Ostrakismos & Akademie)
      g.fillStyle(0x1e3a8a, 1);
      g.fillRect(cx - 46, 76, 92, 34);
      g.lineStyle(2, 0xfde047, 1);
      g.strokeRect(cx - 46, 76, 92, 34);

      this.add.image(155, 155, 'scroll_shelf').setScale(0.85).setDepth(28);
      this.add.image(this.roomWidth - 155, 155, 'column_ionic').setScale(0.75).setDepth(28);

      // Philosoph Sokrates (16x32 at scale 1.0)
      this.add.sprite(cx + 54, 120, 'npc_sokrates', 0).setScale(1.0).setDepth(45);
      this.add
        .text(cx + 54, 98, 'Philosoph Sokrates', {
          fontFamily: 'Georgia, serif',
          fontSize: '8px',
          color: '#fde68a',
          backgroundColor: '#1c1917cc',
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(46);

      this.hotspots.push(
        {
          id: 'ostrakismos_station',
          x: cx,
          y: 115,
          label: '[E] Scherbengericht (Ostrakismos) & Griechisches Alphabet entziffern',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_ostrakismos') || STATIONS[2];
            const w = window as unknown as { __openStation?: (id: string) => void };
            if (w.__openStation && st) w.__openStation(st.id);
          },
        },
        {
          id: 'ostrakon_inspector',
          x: 155,
          y: 160,
          label: '[E] 360°-Quelleninspektor: Original-Ostrakon des Themistokles',
          action: () => {
            const rel = RELICS.find((r) => r.id === 'relic_eule') || RELICS[1];
            const w = window as unknown as { __openArtifactInspector?: (id: string) => void };
            if (w.__openArtifactInspector && rel) w.__openArtifactInspector(rel.id);
          },
        },
        {
          id: 'antikythera_inspector',
          x: this.roomWidth - 155,
          y: 160,
          label: '[E] 360°-Quelleninspektor: Mechanismus von Antikythera untersuchen',
          action: () => {
            const rel = RELICS.find((r) => r.id === 'relic_antikythera') || RELICS[3];
            const w = window as unknown as { __openArtifactInspector?: (id: string) => void };
            if (w.__openArtifactInspector && rel) w.__openArtifactInspector(rel.id);
          },
        },
      );
    }

    for (const hs of this.hotspots) {
      const marker = this.add.circle(hs.x, hs.y, 8, 0xfacc15, 0.38).setDepth(25);
      this.tweens.add({
        targets: marker,
        scale: { from: 0.85, to: 1.25 },
        alpha: { from: 0.25, to: 0.6 },
        duration: 750,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  public update(): void {
    if (this.isExiting || !this.player) return;

    if (state.modal) {
      this.player.setVelocity(0, 0);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.ESC)) {
      this.exitToOverworld();
      return;
    }

    const speed = 115;
    let vx = 0;
    let vy = 0;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown || (state.touch && state.touch.vector.x < -0.2)) vx = -speed;
    else if (this.cursors?.right.isDown || this.wasd?.D.isDown || (state.touch && state.touch.vector.x > 0.2)) vx = speed;

    if (this.cursors?.up.isDown || this.wasd?.W.isDown || (state.touch && state.touch.vector.y < -0.2)) vy = -speed;
    else if (this.cursors?.down.isDown || this.wasd?.S.isDown || (state.touch && state.touch.vector.y > 0.2)) vy = speed;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);

    const pKey = state.playerGender === 'female' ? 'player_greek_female' : 'player_greek_male';
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = vx < 0 ? 'left' : 'right';
      } else {
        this.facing = vy < 0 ? 'up' : 'down';
      }
      this.player.anims.play(`${pKey}-walk-${this.facing}`, true);
      sfx.step('stone');
    } else {
      this.player.anims.play(`${pKey}-idle-${this.facing}`, true);
    }

    const nearExit = Phaser.Geom.Rectangle.Contains(this.exitMatRect, this.player.x, this.player.y);
    let activeHotspot: Hotspot | null = null;
    let bestDist = 42;

    for (const hs of this.hotspots) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, hs.x, hs.y);
      if (d < bestDist) {
        bestDist = d;
        activeHotspot = hs;
      }
    }

    if (activeHotspot) {
      this.promptLabel.setText(activeHotspot.label);
      this.promptLabel.setPosition(activeHotspot.x, activeHotspot.y - 22);
      this.promptLabel.setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.wasd.E) || state.touch?.consumeAction()) {
        sfx.click();
        activeHotspot.action();
      }
    } else if (nearExit) {
      this.promptLabel.setText('[E] Gebäude verlassen (Zurück nach Hellas)');
      this.promptLabel.setPosition(this.roomWidth / 2, this.roomHeight - 48);
      this.promptLabel.setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.wasd.E) || state.touch?.consumeAction()) {
        this.exitToOverworld();
      }
    } else {
      this.promptLabel.setVisible(false);
    }
  }

  public exitToOverworld(): void {
    if (this.isExiting) return;
    this.isExiting = true;
    sfx.door();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(230, () => {
      this.scene.stop('InteriorScene');
      this.scene.wake('World');
      const world = this.scene.get('World') as Phaser.Scene & {
        onReturnFromInterior?: (x: number, y: number) => void;
      };
      world.onReturnFromInterior?.(this.entryData.returnX, this.entryData.returnY);
    });
  }
}
