import Phaser from 'phaser';
import { state } from '../systems/GameState';

export interface RoamingAnimal {
  kind: 'goat' | 'tamed_goat' | 'cow';
  sprite: Phaser.GameObjects.Sprite;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  speed: number;
  state: 'idle' | 'walk' | 'lured';
  timer: number;
  targetX: number;
  targetY: number;
  idleAnim?: string;
  walkAnim?: string;
  syncLabel?: (x: number, y: number) => void;
  labelOffsetY: number;
}

interface AmbientFlier {
  g: Phaser.GameObjects.Arc;
  wing: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  phase: number;
  baseY: number;
}

export interface ObstacleCircle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Steuert frei umherziehende mediterrane Fauna (Bergziegen, zahme Ziegen im Gehege,
 * Auerochsen/Rinder) sowie Schmetterlinge & Libellen über den Olivenhainen und Wiesen.
 */
export class WildlifeManager {
  private scene: Phaser.Scene;
  private animals: RoamingAnimal[] = [];
  private fliers: AmbientFlier[] = [];
  private obstacles: ObstacleCircle[] = [];
  private rng = new Phaser.Math.RandomDataGenerator(['greek-wildlife']);

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public setObstacles(obs: ObstacleCircle[]): void {
    this.obstacles = obs;
  }

  public addObstacle(x: number, y: number, radius = 24): void {
    this.obstacles.push({ x, y, radius });
  }

  public isObstacleNear(x: number, y: number): boolean {
    for (const o of this.obstacles) {
      if (Phaser.Math.Distance.Between(x, y, o.x, o.y) < o.radius) {
        return true;
      }
    }
    return false;
  }

  public addAnimal(cfg: {
    kind: RoamingAnimal['kind'];
    sprite: Phaser.GameObjects.Sprite;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    speed?: number;
    idleAnim?: string;
    walkAnim?: string;
    labelOffsetY?: number;
    syncLabel?: (x: number, y: number) => void;
  }): RoamingAnimal {
    const animal: RoamingAnimal = {
      kind: cfg.kind,
      sprite: cfg.sprite,
      bounds: cfg.bounds,
      speed: cfg.speed ?? 18,
      state: 'idle',
      timer: this.rng.realInRange(1.2, 3.5),
      targetX: cfg.sprite.x,
      targetY: cfg.sprite.y,
      idleAnim: cfg.idleAnim,
      walkAnim: cfg.walkAnim,
      syncLabel: cfg.syncLabel,
      labelOffsetY: cfg.labelOffsetY ?? -16,
    };
    if (animal.idleAnim) {
      animal.sprite.play(animal.idleAnim, true);
    }
    this.animals.push(animal);
    return animal;
  }

  public removeBySprite(sprite: Phaser.GameObjects.Sprite): void {
    this.animals = this.animals.filter((a) => a.sprite !== sprite);
  }

  public clear(): void {
    this.animals = [];
    this.fliers.forEach((f) => {
      f.g.destroy();
      f.wing.destroy();
    });
    this.fliers = [];
  }

  /** Erzeugt kleine Schmetterlinge & Libellen an Wiesen und Küste. */
  public spawnAmbientFliers(mapW: number, mapH: number): void {
    const colors = [0xffe066, 0x38bdf8, 0xf472b6, 0xffffff, 0xfacc15, 0x4ade80];
    for (let i = 0; i < 10; i++) {
      const x = this.rng.between(80, mapW - 120);
      const y = this.rng.between(120, mapH - 80);
      const col = colors[i % colors.length];
      const g = this.scene.add.circle(x, y, 2, col, 0.9).setDepth(3500);
      const wing = this.scene.add.circle(x + 2, y - 1, 1.5, 0xffffff, 0.75).setDepth(3500);
      const angle = this.rng.realInRange(0, Math.PI * 2);
      const spd = this.rng.realInRange(12, 20);
      this.fliers.push({
        g,
        wing,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd * 0.6,
        phase: this.rng.realInRange(0, 10),
        baseY: y,
      });
    }
  }

  public update(
    deltaMs: number,
    playerX: number,
    playerY: number,
    mapW = 1600,
    mapH = 1200,
  ): void {
    const dt = deltaMs / 1000;

    for (const a of this.animals) {
      if (!a.sprite || !a.sprite.active) continue;

      const distToPlayer = Phaser.Math.Distance.Between(a.sprite.x, a.sprite.y, playerX, playerY);

      // Barrierefreie Lock-Mechanik für Bergziegen:
      if (a.kind === 'goat') {
        const hasFeed = state.count('gerste') > 0 || state.count('oliven') > 0;
        if (distToPlayer < 88) {
          if (hasFeed && distToPlayer > 30) {
            // Mit Futter läuft die Bergziege neugierig langsam auf den Spieler zu
            a.state = 'lured';
            const ang = Phaser.Math.Angle.Between(a.sprite.x, a.sprite.y, playerX, playerY);
            const step = 16 * dt;
            a.sprite.x = Phaser.Math.Clamp(a.sprite.x + Math.cos(ang) * step, a.bounds.minX, a.bounds.maxX);
            a.sprite.y = Phaser.Math.Clamp(a.sprite.y + Math.sin(ang) * step, a.bounds.minY, a.bounds.maxY);
            // Goat-Sprite schaut im Original nach links
            a.sprite.setFlipX(Math.cos(ang) > 0);
            if (a.walkAnim) a.sprite.play(a.walkAnim, true);
          } else {
            // Nah am Spieler bleibt sie ruhig grasend stehen
            a.state = 'idle';
            a.timer = 1.5;
            if (a.idleAnim) a.sprite.play(a.idleAnim, true);
          }
          a.sprite.setDepth(a.sprite.y + 12);
          a.syncLabel?.(a.sprite.x, a.sprite.y + a.labelOffsetY);
          continue;
        }
      }

      // Normale Weide-/Wander-Zustandsmaschine
      a.timer -= dt;
      if (a.state === 'idle' || a.state === 'lured') {
        if (a.idleAnim) a.sprite.play(a.idleAnim, true);
        if (a.timer <= 0) {
          a.state = 'walk';
          a.timer = this.rng.realInRange(1.8, 3.8);
          let tx = a.sprite.x;
          let ty = a.sprite.y;
          for (let attempt = 0; attempt < 6; attempt++) {
            const rx = this.rng.realInRange(a.bounds.minX, a.bounds.maxX);
            const ry = this.rng.realInRange(a.bounds.minY, a.bounds.maxY);
            if (!this.isObstacleNear(rx, ry)) {
              tx = rx;
              ty = ry;
              break;
            }
          }
          a.targetX = tx;
          a.targetY = ty;
          if (a.walkAnim) a.sprite.play(a.walkAnim, true);
        }
      } else if (a.state === 'walk') {
        const dx = a.targetX - a.sprite.x;
        const dy = a.targetY - a.sprite.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4 || a.timer <= 0) {
          a.state = 'idle';
          a.timer = this.rng.realInRange(2.4, 5.0);
          if (a.idleAnim) a.sprite.play(a.idleAnim, true);
        } else {
          const step = Math.min(dist, a.speed * dt);
          const nx = a.sprite.x + (dx / dist) * step;
          const ny = a.sprite.y + (dy / dist) * step;
          if (this.isObstacleNear(nx, ny)) {
            a.state = 'idle';
            a.timer = this.rng.realInRange(2.0, 4.0);
            if (a.idleAnim) a.sprite.play(a.idleAnim, true);
          } else {
            a.sprite.x = Phaser.Math.Clamp(nx, a.bounds.minX, a.bounds.maxX);
            a.sprite.y = Phaser.Math.Clamp(ny, a.bounds.minY, a.bounds.maxY);
            a.sprite.setFlipX(dx > 0.5);
            if (a.walkAnim) a.sprite.play(a.walkAnim, true);
          }
        }
      }

      a.sprite.setDepth(a.sprite.y + 12);
      a.syncLabel?.(a.sprite.x, a.sprite.y + a.labelOffsetY);
    }

    // Schmetterlinge & Libellen
    for (const f of this.fliers) {
      f.phase += dt * 6;
      f.g.x += f.vx * dt;
      f.g.y += f.vy * dt + Math.sin(f.phase) * 0.25;
      f.wing.setPosition(f.g.x + Math.cos(f.phase * 2) * 2, f.g.y - 1 + Math.sin(f.phase * 2) * 1.2);
      if (f.g.x < 40 || f.g.x > mapW - 40) f.vx = -f.vx;
      if (f.g.y < 80 || f.g.y > mapH - 40) f.vy = -f.vy;
    }
  }
}
