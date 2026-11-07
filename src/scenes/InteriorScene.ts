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
  private exitMat!: { x: number; y: number; w: number; h: number };
  private isExiting = false;
  private stepCooldown = 0;

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
    const ROOM_W = 352;
    const ROOM_H = 208;
    const CX = 240;
    const CY = 140;
    const LEFT = CX - ROOM_W / 2;
    const TOP = CY - ROOM_H / 2;

    this.cameras.main.setBackgroundColor('#120e0a');

    document.getElementById('interior-dom-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'interior-dom-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:18;font-family:system-ui,sans-serif;';
    document.body.appendChild(overlay);

    const addDomTag = (rx: number, ry: number, text: string, bg = 'rgba(28,18,10,0.9)', border = '#e8c170', color = '#fef08a') => {
      const el = document.createElement('div');
      const pctX = (rx / 480) * 100;
      const pctY = (ry / 270) * 100;
      el.style.cssText = `
        position:absolute;left:${pctX}%;top:${pctY}%;transform:translate(-50%,-50%);
        background:${bg};border:1.5px solid ${border};color:${color};
        padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;
        white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.65);
      `;
      el.textContent = text;
      overlay.appendChild(el);
    };

    const headerBanner = document.createElement('div');
    headerBanner.style.cssText = `
      position:absolute;left:50%;top:11%;transform:translate(-50%,-50%);
      background:linear-gradient(180deg,rgba(42,26,12,0.95),rgba(24,14,6,0.95));
      border:2px solid #e8c170;border-radius:8px;padding:4px 14px;text-align:center;
      box-shadow:0 4px 14px rgba(0,0,0,0.75);
    `;
    headerBanner.innerHTML = `
      <div style="color:#fde047;font-size:13px;font-weight:900;letter-spacing:0.4px;">${this.getRoomTitle(this.entryData.buildingId)}</div>
      <div style="color:#e8dec5;font-size:10.5px;font-weight:700;">Antikes Griechenland · Innenraum · [E] Interagieren · [ESC] Verlassen</div>
    `;
    overlay.appendChild(headerBanner);

    const g = this.add.graphics();
    g.fillStyle(0x23170d, 1);
    g.fillRect(LEFT - 10, TOP - 10, ROOM_W + 20, ROOM_H + 20);

    const isStone = this.entryData.buildingId !== 'kerameikos_werkstatt';
    for (let y = TOP; y < TOP + ROOM_H; y += 16) {
      for (let x = LEFT; x < LEFT + ROOM_W; x += 16) {
        const alt = ((x + y) / 16) % 2 === 0;
        if (isStone) {
          g.fillStyle(alt ? 0xd6cbb8 : 0xc7bba6, 1);
        } else {
          g.fillStyle(alt ? 0xa37852 : 0x926844, 1);
        }
        g.fillRect(x, y, 16, 16);
        g.lineStyle(1, 0x57432d, 0.22);
        g.strokeRect(x, y, 16, 16);
      }
    }

    // Back wall header frieze
    g.fillStyle(isStone ? 0x57534e : 0x5c3a21, 1);
    g.fillRect(LEFT, TOP, ROOM_W, 34);
    g.fillStyle(0xd97706, 0.6);
    g.fillRect(LEFT, TOP + 30, ROOM_W, 4);
    g.lineStyle(3, 0xe8c170, 0.9);
    g.strokeRect(LEFT, TOP, ROOM_W, ROOM_H);

    // Central runner carpet leading to altar/mentor
    g.fillStyle(0x7c2d12, 0.92);
    g.fillRect(CX - 22, TOP + 36, 44, ROOM_H - 44);
    g.lineStyle(2, 0xfbbf24, 0.9);
    g.strokeRect(CX - 22, TOP + 36, 44, ROOM_H - 44);

    // 4 Authentic Doric/Ionic Marble Columns along the walls (NO fillCircle placeholders!)
    const colKey = this.textures.exists('column_doric') ? 'column_doric' : 'column_ionic';
    if (this.textures.exists(colKey)) {
      this.add.image(LEFT + 24, TOP + 54, colKey).setScale(0.55).setDepth(TOP + 54);
      this.add.image(LEFT + ROOM_W - 24, TOP + 54, colKey).setScale(0.55).setDepth(TOP + 54);
      this.add.image(LEFT + 24, TOP + 148, colKey).setScale(0.55).setDepth(TOP + 148);
      this.add.image(LEFT + ROOM_W - 24, TOP + 148, colKey).setScale(0.55).setDepth(TOP + 148);
    }

    // 4 Corner Torches with warm flickering glow
    const torchCoords = [
      [LEFT + 46, TOP + 42],
      [LEFT + ROOM_W - 46, TOP + 42],
      [LEFT + 46, TOP + ROOM_H - 22],
      [LEFT + ROOM_W - 46, TOP + ROOM_H - 22],
    ];
    for (const [tx, ty] of torchCoords) {
      const glow = this.add.circle(tx, ty, 30, 0xf59e0b, 0.22).setDepth(2);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.14, to: 0.30 },
        scale: { from: 0.92, to: 1.08 },
        duration: 820 + Math.random() * 320,
        yoyo: true,
        repeat: -1,
      });
    }

    this.buildRoomContents(this.entryData.buildingId, CX, CY, LEFT, TOP, ROOM_W, ROOM_H, addDomTag);

    // Exit Mat at Bottom Center
    this.exitMat = { x: CX, y: TOP + ROOM_H - 14, w: 56, h: 18 };
    g.fillStyle(0xb91c1c, 1);
    g.fillRect(this.exitMat.x - 26, this.exitMat.y - 8, 52, 14);
    g.lineStyle(1.5, 0xfde047, 1);
    g.strokeRect(this.exitMat.x - 26, this.exitMat.y - 8, 52, 14);
    addDomTag(this.exitMat.x, this.exitMat.y + 12, '🚪 Ausgang zur Oberwelt (E / ESC)', 'rgba(127,29,29,0.92)', '#fca5a5', '#fef2f2');

    // Player (strictly 16x32 at scale 1.0)
    const pKey = state.playerGender === 'female' ? 'player_greek_female' : 'player_greek_male';
    this.player = this.physics.add
      .sprite(CX, TOP + ROOM_H - 42, pKey, 12)
      .setScale(1.0)
      .setDepth(TOP + ROOM_H - 42)
      .setCollideWorldBounds(true);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 10).setOffset(2, 22);

    this.physics.world.setBounds(LEFT + 14, TOP + 36, ROOM_W - 28, ROOM_H - 44);

    this.cameras.main.setZoom(1.0);
    this.cameras.main.centerOn(CX, CY);
    this.cameras.main.fadeIn(220, 0, 0, 0);

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

    this.events.once('shutdown', () => {
      document.getElementById('interior-dom-overlay')?.remove();
      state.emit('prompt', '');
    });
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

  private buildRoomContents(
    id: InteriorEntryData['buildingId'],
    cx: number,
    _cy: number,
    left: number,
    top: number,
    w: number,
    h: number,
    addDomTag: (rx: number, ry: number, text: string, bg?: string, border?: string, color?: string) => void
  ): void {
    if (id === 'parthenon_cella') {
      if (this.textures.exists('statue_athena_shrine')) {
        this.add.image(cx, top + 48, 'statue_athena_shrine').setScale(0.55).setDepth(top + 48);
      }
      if (this.textures.exists('amphora_black_painted')) {
        this.add.image(left + 78, top + 82, 'amphora_black_painted').setScale(0.85).setDepth(top + 82);
      }
      if (this.textures.exists('column_doric')) {
        this.add.image(left + w - 78, top + 82, 'column_doric').setScale(0.6).setDepth(top + 82);
      }

      this.add.sprite(cx, top + 68, 'npc_pythia', 0).setScale(1.0).setDepth(top + 68);
      addDomTag(cx, top + 46, '👑 Priesterin der Athene (E)', 'rgba(45,26,10,0.92)', '#fde047', '#fde047');

      addDomTag(left + 78, top + 60, '🏺 Preisamphore (E)');
      addDomTag(left + w - 78, top + 60, '🏛️ Säulenordnung (E)');

      this.hotspots.push(
        {
          id: 'athena_mentor',
          x: cx,
          y: top + 70,
          label: 'Priesterin der Athene ansprechen (E)',
          action: () => {
            state.unlockLexicon('akropolis');
            state.openDialog({
              speaker: 'Priesterin der Athene (Parthenon)',
              nodes: [
                {
                  text: 'Chaire im Parthenon auf der Akropolis! In dieser Cella wacht die monumentale Statue der Athena Parthenos aus Gold und Elfenbein über die Polis Athen und den Schatz des Attischen Seebundes.',
                },
              ],
            });
          },
        },
        {
          id: 'helmet_relic',
          x: left + 78,
          y: top + 82,
          label: '360°-Quelleninspektor: Panathenäische Preisamphore (E)',
          action: () => {
            const rel = RELICS.find((r) => r.id === 'relic_amphora') || RELICS[0];
            const win = window as unknown as { __openArtifactInspector?: (id: string) => void };
            if (win.__openArtifactInspector && rel) win.__openArtifactInspector(rel.id);
          },
        },
        {
          id: 'athena_altar',
          x: left + w - 78,
          y: top + 82,
          label: 'Säulenordnungen & Parthenon-Architektur untersuchen (E)',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_saeulenordnung') || STATIONS[3];
            const win = window as unknown as { __openStation?: (id: string) => void };
            if (win.__openStation && st) win.__openStation(st.id);
          },
        }
      );
    } else if (id === 'kerameikos_werkstatt') {
      if (this.textures.exists('pottery_kiln')) {
        this.add.image(left + 78, top + 82, 'pottery_kiln').setScale(0.75).setDepth(top + 82);
      }
      if (this.textures.exists('amphora_black_painted')) {
        this.add.image(left + w - 78, top + 82, 'amphora_black_painted').setScale(0.85).setDepth(top + 82);
      }
      if (this.textures.exists('terracotta_pots')) {
        this.add.image(left + 78, top + h - 54, 'terracotta_pots').setScale(0.75).setDepth(top + h - 54);
      }

      this.add.sprite(cx, top + 66, 'npc_nikolaos', 0).setScale(1.0).setDepth(top + 66);
      addDomTag(cx, top + 46, '🏺 Töpfermeister Exekias (E)', 'rgba(45,26,10,0.92)', '#fde047', '#fde047');
      addDomTag(left + 78, top + 58, '🔥 3-Phasen-Brennofen (E)');
      addDomTag(left + w - 78, top + 58, '🫒 Olivenpresse (E)');

      this.hotspots.push(
        {
          id: 'kiln_station',
          x: left + 78,
          y: top + 82,
          label: 'Töpferofen im Kerameikos: 3-Phasen-Tonbrand starten (E)',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_kerameikos') || STATIONS[1];
            const win = window as unknown as { __openStation?: (id: string) => void };
            if (win.__openStation && st) win.__openStation(st.id);
          },
        },
        {
          id: 'olive_press_station',
          x: left + w - 78,
          y: top + 82,
          label: 'Attische Hebel-Olivenpresse bedienen (E)',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_olivenpresse') || STATIONS[0];
            const win = window as unknown as { __openStation?: (id: string) => void };
            if (win.__openStation && st) win.__openStation(st.id);
          },
        }
      );
    } else {
      if (this.textures.exists('pnyx_podium')) {
        this.add.image(cx, top + 48, 'pnyx_podium').setScale(0.55).setDepth(top + 48);
      }
      if (this.textures.exists('library_scroll_rack')) {
        this.add.image(left + 78, top + 82, 'library_scroll_rack').setScale(0.65).setDepth(top + 82);
        this.add.image(left + w - 78, top + 82, 'library_scroll_rack').setScale(0.65).setDepth(top + 82);
      }

      this.add.sprite(cx, top + 66, 'npc_sokrates', 0).setScale(1.0).setDepth(top + 66);
      addDomTag(cx, top + 46, '🦉 Philosoph Sokrates (E)', 'rgba(45,26,10,0.92)', '#fde047', '#fde047');
      addDomTag(left + 78, top + 58, '🏺 Scherbengericht (E)');
      addDomTag(left + w - 78, top + 58, '⚙️ Antikythera-Relikt (E)');

      this.hotspots.push(
        {
          id: 'ostrakismos_station',
          x: left + 78,
          y: top + 82,
          label: 'Scherbengericht (Ostrakismos) & Rat der 500 starten (E)',
          action: () => {
            const st = STATIONS.find((s) => s.id === 'station_ostrakismos') || STATIONS[2];
            const win = window as unknown as { __openStation?: (id: string) => void };
            if (win.__openStation && st) win.__openStation(st.id);
          },
        },
        {
          id: 'antikythera_relic',
          x: left + w - 78,
          y: top + 82,
          label: '360°-Quelleninspektor: Mechanismus von Antikythera (E)',
          action: () => {
            const rel = RELICS.find((r) => r.id === 'relic_antikythera') || RELICS[3];
            const win = window as unknown as { __openArtifactInspector?: (id: string) => void };
            if (win.__openArtifactInspector && rel) win.__openArtifactInspector(rel.id);
          },
        }
      );
    }
  }

  public update(_time: number, delta: number): void {
    if (!this.player || this.isExiting || state.modal) {
      if (this.player?.body) (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      return;
    }

    if (this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.ESC)) {
      this.exitToOverworld();
      return;
    }

    const speed = 105;
    let vx = 0;
    let vy = 0;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) vx = -speed;
    else if (this.cursors?.right.isDown || this.wasd?.D.isDown) vx = speed;

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) vy = -speed;
    else if (this.cursors?.down.isDown || this.wasd?.S.isDown) vy = speed;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);
    this.player.setDepth(this.player.y);

    const gPrefix = state.playerGender === 'female' ? 'greek-female' : 'greek-male';
    if (vx !== 0 || vy !== 0) {
      const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up';
      this.player.anims.play(`walk-${gPrefix}-${dir}`, true);
      this.stepCooldown -= delta;
      if (this.stepCooldown <= 0) {
        sfx.step('stone');
        this.stepCooldown = 280;
      }
    } else {
      this.player.anims.stop();
    }

    let nearest: Hotspot | null = null;
    let minDist = 42;
    for (const h of this.hotspots) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y);
      if (d < minDist) {
        minDist = d;
        nearest = h;
      }
    }

    const distExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitMat.x, this.exitMat.y);
    if (distExit < 26) {
      state.emit('prompt', '🚪 [E] oder [ESC] drücken: Gebäude verlassen');
      if (this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
        this.exitToOverworld();
      }
    } else if (nearest) {
      state.emit('prompt', `🔍 ${nearest.label}`);
      if (this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
        sfx.click();
        nearest.action();
      }
    } else {
      state.emit('prompt', '');
    }
  }

  public exitToOverworld(): void {
    if (this.isExiting) return;
    this.isExiting = true;
    sfx.click();
    document.getElementById('interior-dom-overlay')?.remove();
    state.emit('prompt', '');

    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('InteriorScene');
      this.scene.wake('World');
      const worldScene = this.scene.get('World') as unknown as {
        player?: Phaser.Physics.Arcade.Sprite;
        labelLayer?: HTMLElement;
      };
      if (worldScene?.player) {
        worldScene.player.setPosition(this.entryData.returnX, this.entryData.returnY);
      }
      if (worldScene?.labelLayer) {
        worldScene.labelLayer.style.display = 'block';
      }
    });
  }
}
