import Phaser from 'phaser';
import { sfx } from '../audio/sound';
import { state } from '../systems/GameState';

const SPEED = 95;
const REACH = 48;

interface OlympNode {
  id: 'zeus_throne' | 'athena_shrine' | 'marble_gift' | 'portal_exit';
  x: number;
  y: number;
  label: string;
}

export class OlympScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private facing: 'down' | 'up' | 'left' | 'right' = 'up';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };
  private nodes: OlympNode[] = [];
  private clouds: Phaser.GameObjects.Image[] = [];
  private transitioning = false;

  constructor() {
    super('Olymp');
  }

  create(): void {
    this.transitioning = false;
    this.nodes = [];
    this.clouds = [];

    // Hide world DOM labels while in sub-scene
    const worldLabels = document.getElementById('world-labels');
    if (worldLabels) worldLabels.style.display = 'none';

    this.events.on('wake', () => {
      this.transitioning = false;
      const wl = document.getElementById('world-labels');
      if (wl) wl.style.display = 'none';
      this.cameras.main.fadeIn(350, 0, 0, 0);
      state.emit('toast', '⚡ Willkommen auf dem Götterberg Olymp (2.918 m)!');
    });

    // 1. Himmel über Griechenland (Ätherisches Blau & Gold)
    const g = this.add.graphics();
    g.fillGradientStyle(0x0c4a6e, 0x0c4a6e, 0x38bdf8, 0x7dd3fc, 1);
    g.fillRect(0, 0, 480, 270);

    // Schwebende Wolken im Hintergrund
    const cloudCoords = [
      [60, 45],
      [410, 55],
      [85, 220],
      [395, 215],
      [240, 28],
    ];
    for (const [cx, cy] of cloudCoords) {
      const cl = this.add.image(cx, cy, 'cloud_puff').setAlpha(0.75).setDepth(2);
      this.clouds.push(cl);
    }

    // 2. Schwebende Olymp-Inseln (aus Sky Islands.rar)
    // Untere Eingangsinsel + Wolkenbrücke + Haupt-Götterinsel
    this.add.image(240, 215, 'olymp_island_small').setScale(1.35).setDepth(5);
    this.add
      .image(240, 162, 'olymp_cloud_bridge')
      .setAngle(90)
      .setScale(0.85, 1.0)
      .setDepth(6);
    this.add.image(240, 98, 'olymp_island_main').setScale(1.45, 1.15).setDepth(5);

    // Seiteninseln für Athene & Marmor-Gabe
    this.add.image(115, 110, 'olymp_island_small').setScale(1.15).setDepth(4);
    this.add.image(175, 110, 'olymp_cloud_bridge').setScale(0.7, 0.75).setDepth(5);
    this.add.image(365, 110, 'olymp_island_small').setScale(1.15).setDepth(4);
    this.add.image(305, 110, 'olymp_cloud_bridge').setScale(0.7, 0.75).setDepth(5);

    // Goldenes Marmor-Pflaster auf der Hauptinsel
    const floorG = this.add.graphics().setDepth(7);
    floorG.fillStyle(0xf8fafc, 0.92);
    floorG.fillRoundedRect(190, 58, 100, 74, 8);
    floorG.lineStyle(2, 0xfbbf24, 0.9);
    floorG.strokeRoundedRect(192, 60, 96, 70, 6);

    // Ionische Säulen auf dem Olymp
    this.add.image(196, 62, 'column_ionic').setDepth(65);
    this.add.image(284, 62, 'column_ionic').setDepth(65);
    this.add.image(196, 115, 'column_ionic').setDepth(118);
    this.add.image(284, 115, 'column_ionic').setDepth(118);

    // 3. Interaktive Götter-Schreine & Rückkehr-Portal
    // Zeus-Thron & Goldene Opferschale
    this.add.image(240, 62, 'statue_zeus_throne').setDepth(70);
    this.add.image(240, 90, 'fire_altar_gold').setScale(0.85).setDepth(92);
    this.nodes.push({
      id: 'zeus_throne',
      x: 240,
      y: 86,
      label: '⚡ Thron des Göttervaters Zeus & Opferschale (E)',
    });

    // Athene-Schrein links
    this.add.image(115, 95, 'statue_athena_shrine').setDepth(98);
    this.nodes.push({
      id: 'athena_shrine',
      x: 115,
      y: 102,
      label: '🦉 Schrein der Pallas Athene & Weisheit (E)',
    });

    // Himmlischer Marmor & Siegesgöttin Nike rechts
    this.add.image(365, 95, 'statue_nike_gold').setDepth(98);
    this.nodes.push({
      id: 'marble_gift',
      x: 365,
      y: 102,
      label: '🏛️ Siegesgöttin Nike & Olympischer Marmor (E)',
    });

    // Rückkehr-Portal unten
    this.add.image(240, 212, 'olymp_rune_circle').setScale(0.85).setDepth(8);
    this.add.image(240, 200, 'olymp_orb_pedestal').setScale(0.75).setDepth(205);
    this.nodes.push({
      id: 'portal_exit',
      x: 240,
      y: 206,
      label: '🌀 Wolkentor zurück nach Hellas (E)',
    });

    // 4. Spieler auf dem Olymp spawnen
    const texKey =
      state.playerGender === 'female' ? 'player_greek_female' : 'player_greek_male';
    this.player = this.physics.add.sprite(240, 182, texKey, 8);
    this.player.body!.setSize(8, 6).setOffset(4, 24);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(85, 52, 310, 175);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE') as typeof this.wasd;

    this.cameras.main.fadeIn(350, 0, 0, 0);
  }

  update(_time: number, delta: number): void {
    // Sanft ziehende Wolken
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.x += (i % 2 === 0 ? 0.08 : -0.06) * (delta / 16);
      if (c.x > 510) c.x = -30;
      if (c.x < -30) c.x = 510;
    }

    if (state.modal || this.transitioning) {
      this.player.setVelocity(0, 0);
      return;
    }

    const tv = state.touch?.vector;
    const left = this.cursors.left.isDown || this.wasd.A.isDown || (tv ? tv.x < -0.25 : false);
    const right =
      this.cursors.right.isDown || this.wasd.D.isDown || (tv ? tv.x > 0.25 : false);
    const up = this.cursors.up.isDown || this.wasd.W.isDown || (tv ? tv.y < -0.25 : false);
    const down = this.cursors.down.isDown || this.wasd.S.isDown || (tv ? tv.y > 0.25 : false);

    let vx = 0;
    let vy = 0;
    if (left) {
      vx = -SPEED;
      this.facing = 'left';
    } else if (right) {
      vx = SPEED;
      this.facing = 'right';
    }
    if (up) {
      vy = -SPEED;
      this.facing = 'up';
    } else if (down) {
      vy = SPEED;
      this.facing = 'down';
    }
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);
    this.player.setDepth(this.player.y + 16);

    const genderKey = state.playerGender === 'female' ? 'female' : 'male';
    if (vx !== 0 || vy !== 0) {
      this.player.anims.play(`walk-greek-${genderKey}-${this.facing}`, true);
    } else {
      this.player.anims.play(`idle-greek-${genderKey}-${this.facing}`, true);
    }

    // Finde nächstes Interaktionsziel
    let nearest: OlympNode | null = null;
    let bestDist = REACH;
    for (const n of this.nodes) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y);
      if (d < bestDist) {
        bestDist = d;
        nearest = n;
      }
    }

    if (nearest) {
      state.hint = nearest.label;
      state.compassText = `⚡ Olymp: ${nearest.label}`;
    } else {
      state.hint = 'Berg Olymp: Gehe zu Zeus’ Thron (oben) oder zum Wolkentor (unten)';
      state.compassText = '⚡ Berg Olymp: Entzünde die Opferschale vor Zeus (oben)';
    }

    const justActed =
      Phaser.Input.Keyboard.JustDown(this.wasd.E) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.SPACE) ||
      Boolean(state.touch?.consumeAction());

    if (justActed && nearest && Date.now() - state.lastModalClose > 250) {
      this.interactNode(nearest);
    }
  }

  private interactNode(n: OlympNode): void {
    if (n.id === 'zeus_throne') {
      if (state.count('weihrauch') > 0) {
        state.add('weihrauch', -1);
      }
      state.bump('zeus_honored', 1);
      state.unlockLexicon('olymp_goetter');
      state.unlockLexicon('olympische_spiele');
      state.safety = 100;
      sfx.fanfare();
      state.openDialog({
        speaker: 'Thron des Göttervaters Zeus (Berg Olymp)',
        nodes: [
          {
            text: '⚡ <strong>Der Duft des Opferweihrauchs steigt in den Himmel!</strong>\n\nEin fernes Donnergrollen hallt über die schneebedeckten Gipfel des Olymp. Göttervater Zeus, Herr über Himmel und Blitze, nimmt dein Opfer wohlwollend an!',
          },
          {
            text: 'Während der heiligen Olympischen Spiele ruhen in ganz Hellas die Waffen (Ekecheiria – Gottesfrieden). Flechte nun einen Olympischen Siegerkranz (Taste C) und kehre durch das Wolkentor zurück zu Priesterin Pythia!',
          },
        ],
      });
    } else if (n.id === 'athena_shrine') {
      state.unlockLexicon('akropolis');
      state.add('oliven', 2);
      sfx.quest();
      state.openDialog({
        speaker: 'Schrein der Pallas Athene',
        nodes: [
          {
            text: '🦉 <strong>Göttin der Weisheit, der Strategie & des Handwerks:</strong>\n\nAthene schenkt dir <strong>+2 heilige Olivenzweige</strong>, damit du daraus im Handwerksmenü (Taste C) den Olympischen Siegerkranz (Kotinos) flechten kannst!',
          },
        ],
      });
    } else if (n.id === 'marble_gift') {
      state.add('marmor', 2);
      sfx.pickup();
      state.emit('toast', '🏛️ +2 Parischen Marmor am Schrein der Siegesgöttin Nike erhalten!');
    } else if (n.id === 'portal_exit') {
      this.leaveOlymp();
    }
  }

  private leaveOlymp(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    sfx.door();
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const wl = document.getElementById('world-labels');
      if (wl) wl.style.display = 'block';
      this.scene.sleep('Olymp');
      this.scene.wake('World');
      const worldScene = this.scene.get('World');
      if (worldScene && worldScene.cameras && worldScene.cameras.main) {
        worldScene.cameras.main.fadeIn(350, 0, 0, 0);
      }
    });
  }
}
