/**
 * High-fidelity playable canvas simulator directly mirroring the Raylib C++ implementation.
 * Runs at 60 FPS with pixel-precise matching of the C++ physics, bounding boxes, and rendering.
 */

import { retroAudio } from './RetroAudio';

export interface GameTuningConfig {
  maxSpeed: number;        // pixels/sec (default 480)
  accelerationRate: number;// default 320
  brakingRate: number;     // default 580
  turnRate: number;        // default 180
  trafficDensity: number;  // 1 = normal, 2 = intense
  rumbleIntensity: number; // camera shake scale
  enableAudio: boolean;
}

export const DEFAULT_CONFIG: GameTuningConfig = {
  maxSpeed: 480,
  accelerationRate: 320,
  brakingRate: 580,
  turnRate: 180,
  trafficDensity: 1.0,
  rumbleIntensity: 1.0,
  enableAudio: true,
};

export type SimulatorState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface SkidMark {
  lx: number;
  ly: number;
  rx: number;
  ry: number;
  alpha: number;
}

export interface TrafficCar {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'SEDAN' | 'SPORTS_CAR' | 'TRUCK' | 'OIL_SLICK' | 'REPAIR_KIT';
  color: string;
  subColor: string;
  collected: boolean;
}

export class GameSimulator {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public state: SimulatorState = 'TITLE';

  // Metrics matching Raylib SCREEN_WIDTH/HEIGHT
  public readonly width = 800;
  public readonly height = 900;
  public readonly roadWidth = 460;
  public readonly roadLeft = 170;
  public readonly roadRight = 630;
  public readonly shoulderWidth = 45;

  // Player Car State
  public carX = 400;
  public carY = 740;
  public carWidth = 38;
  public carHeight = 72;
  public carAngle = 0;
  public carSpeed = 0;
  public carHealth = 100;
  public carNitro = 100;
  public onGrass = false;
  public isNitroActive = false;
  public spinOutTimer = 0;

  // Session Stats
  public score = 0;
  public highScore = 0;
  public distance = 0;
  public multiplier = 1;
  public multiplierTimer = 0;
  public difficulty = 1.0;
  public nearMissToast: { text: string; timer: number } | null = null;

  // Entities & FX
  public traffic: TrafficCar[] = [];
  public particles: Particle[] = [];
  public skidMarks: SkidMark[] = [];
  public roadOffsetY = 0;
  public spawnTimer = 0;
  public nextSpawn = 1.6;
  public cameraShake = 0;

  // Scenery Trees
  public roadsideTrees: { x: number; y: number; size: number }[] = [];

  // Tuning Configuration
  public config: GameTuningConfig = { ...DEFAULT_CONFIG };

  // Keys
  public keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    nitro: false,
  };

  private lastTime = 0;
  private animFrameId: number | null = null;
  private nextTrafficId = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.initScenery();
  }

  private initScenery() {
    this.roadsideTrees = [];
    for (let y = -200; y < this.height + 200; y += 100) {
      // Left trees
      this.roadsideTrees.push({
        x: 35 + Math.random() * (this.roadLeft - this.shoulderWidth - 60),
        y,
        size: 16 + Math.random() * 6,
      });
      // Right trees
      this.roadsideTrees.push({
        x: this.roadRight + this.shoulderWidth + 25 + Math.random() * (this.width - (this.roadRight + this.shoulderWidth) - 50),
        y,
        size: 16 + Math.random() * 6,
      });
    }
  }

  public setTuningConfig(newConfig: Partial<GameTuningConfig>) {
    this.config = { ...this.config, ...newConfig };
    retroAudio.setMuted(!this.config.enableAudio);
  }

  public start() {
    this.resetGame();
    this.state = 'PLAYING';
    if (this.config.enableAudio) {
      retroAudio.startEngine();
    }
  }

  public pauseToggle() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  public resetGame() {
    this.carX = 400;
    this.carY = 740;
    this.carAngle = 0;
    this.carSpeed = 0;
    this.carHealth = 100;
    this.carNitro = 100;
    this.onGrass = false;
    this.isNitroActive = false;
    this.spinOutTimer = 0;

    this.score = 0;
    this.distance = 0;
    this.multiplier = 1;
    this.multiplierTimer = 0;
    this.difficulty = 1.0;
    this.traffic = [];
    this.particles = [];
    this.skidMarks = [];
    this.spawnTimer = 0;
    this.cameraShake = 0;
    this.nearMissToast = null;
  }

  public run() {
    this.lastTime = performance.now();
    const loop = (currentTime: number) => {
      let dt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      if (dt > 0.05) dt = 0.05; // Prevent jump spikes

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    retroAudio.stopEngine();
  }

  public update(dt: number) {
    if (this.state !== 'PLAYING') {
      retroAudio.updateEnginePitch(0, false);
      return;
    }

    // 1. Decay camera shake
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 30);
    }

    if (this.nearMissToast) {
      this.nearMissToast.timer -= dt;
      if (this.nearMissToast.timer <= 0) {
        this.nearMissToast = null;
      }
    }

    // 2. Road surface check
    const carLeft = this.carX - this.carWidth / 2;
    const carRight = this.carX + this.carWidth / 2;
    this.onGrass = carLeft < this.roadLeft || carRight > this.roadRight;

    const maxSpd = this.onGrass ? this.config.maxSpeed * 0.45 : this.config.maxSpeed;
    const friction = this.onGrass ? 420 : 120;

    // 3. Nitro Booster
    this.isNitroActive = this.keys.nitro && this.carNitro > 0 && this.keys.up && this.carSpeed > 50;
    let effectiveMax = maxSpd;
    if (this.isNitroActive) {
      effectiveMax *= 1.35;
      this.carSpeed += this.config.accelerationRate * 1.8 * dt;
      this.carNitro = Math.max(0, this.carNitro - 30 * dt);
    } else {
      this.carNitro = Math.min(100, this.carNitro + 5 * dt);
    }

    // 4. Longitudinal Physics (Acceleration / Brake / Drag)
    if (this.spinOutTimer > 0) {
      this.spinOutTimer -= dt;
      this.carAngle += 720 * dt;
      this.carSpeed = Math.max(0, this.carSpeed - friction * 2 * dt);
    } else {
      if (this.keys.up) {
        this.carSpeed += this.config.accelerationRate * dt;
      } else if (this.keys.down) {
        if (this.carSpeed > 0) {
          this.carSpeed -= this.config.brakingRate * dt;
        } else {
          this.carSpeed -= this.config.accelerationRate * 0.5 * dt;
        }
      } else {
        if (this.carSpeed > 0) {
          this.carSpeed = Math.max(0, this.carSpeed - friction * dt);
        } else if (this.carSpeed < 0) {
          this.carSpeed = Math.min(0, this.carSpeed + friction * dt);
        }
      }

      this.carSpeed = Math.max(-140, Math.min(effectiveMax, this.carSpeed));

      // 5. Steering Dynamics
      const steerRatio = Math.min(1, Math.abs(this.carSpeed) / 200);
      let targetAngle = 0;
      if (Math.abs(this.carSpeed) > 10) {
        const sign = this.carSpeed >= 0 ? 1 : -1;
        if (this.keys.left) {
          this.carX -= this.config.turnRate * steerRatio * dt;
          targetAngle = -18 * steerRatio * sign;
        }
        if (this.keys.right) {
          this.carX += this.config.turnRate * steerRatio * dt;
          targetAngle = 18 * steerRatio * sign;
        }
      }

      this.carAngle += (targetAngle - this.carAngle) * 10 * dt;
    }

    this.carX = Math.max(35, Math.min(this.width - 35, this.carX));

    // Sound Pitch Update
    const speedRatio = Math.abs(this.carSpeed) / this.config.maxSpeed;
    retroAudio.updateEnginePitch(speedRatio, this.isNitroActive);

    // 6. Skid Marks during heavy turn or off-road
    if (this.carSpeed > 220 && (Math.abs(this.carAngle) > 9 || this.onGrass)) {
      if (Math.random() < 0.6) {
        this.emitSkid();
        retroAudio.playSkid();
      }
    }
    for (const m of this.skidMarks) {
      m.alpha -= dt * 0.7;
    }
    this.skidMarks = this.skidMarks.filter((m) => m.alpha > 0);

    // 7. Exhaust Particles
    if (this.carSpeed > 20) {
      this.emitExhaust();
    }
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // 8. Track & Distance Progression
    this.roadOffsetY = (this.roadOffsetY + this.carSpeed * dt) % 120;
    if (this.carSpeed > 0) {
      const meters = (this.carSpeed * 0.45 / 3.6) * dt;
      this.distance += meters;
      this.score += this.carSpeed * 0.12 * this.multiplier * dt;
    }

    // Scroll Scenery
    for (const t of this.roadsideTrees) {
      t.y += this.carSpeed * dt;
      if (t.y > this.height + 100) {
        t.y -= this.height + 300;
      }
    }

    // Multiplier decay
    if (this.multiplierTimer > 0) {
      this.multiplierTimer -= dt;
      if (this.multiplierTimer <= 0) {
        this.multiplier = 1;
      }
    }

    // 9. Difficulty scaling
    this.difficulty = Math.min(2.5, 1.0 + (this.distance / 1200) * 0.15);

    // 10. Traffic Spawning
    this.spawnTimer += dt;
    const intervalTarget = Math.max(0.65, (1.8 - (this.difficulty - 1) * 0.25) / this.config.trafficDensity);
    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0;
      this.spawnTraffic();
      this.nextSpawn = intervalTarget * (0.8 + Math.random() * 0.5);
    }

    // 11. Update Traffic
    for (const t of this.traffic) {
      t.y += (this.carSpeed - t.speed) * dt;
    }
    this.traffic = this.traffic.filter((t) => t.y < this.height + 150 && t.y > -300);

    // 12. Check Collisions
    this.checkCollisions();

    // 13. Check Game Over
    if (this.carHealth <= 0) {
      this.state = 'GAME_OVER';
      if (this.score > this.highScore) {
        this.highScore = Math.floor(this.score);
      }
      retroAudio.playCrash();
      retroAudio.stopEngine();
    }
  }

  private emitExhaust() {
    const rad = (this.carAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const rx = 0;
    const ry = this.carHeight * 0.48;
    const px = this.carX + (-rx * cosA + ry * sinA);
    const py = this.carY + (rx * sinA + ry * cosA);

    this.particles.push({
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 40,
      vy: this.isNitroActive ? 220 + Math.random() * 80 : 90 + Math.random() * 60,
      life: this.isNitroActive ? 0.2 : 0.35,
      maxLife: this.isNitroActive ? 0.2 : 0.35,
      color: this.isNitroActive ? (Math.random() < 0.5 ? '#00e5ff' : '#ffffff') : '#94a3b8',
      size: this.isNitroActive ? 5 : 3.5,
    });
  }

  private emitSkid() {
    const rad = (this.carAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const hw = this.carWidth * 0.38;
    const ry = this.carHeight * 0.35;

    this.skidMarks.push({
      lx: this.carX + (-hw * cosA - ry * sinA),
      ly: this.carY + (-hw * sinA + ry * cosA),
      rx: this.carX + (hw * cosA - ry * sinA),
      ry: this.carY + (hw * sinA + ry * cosA),
      alpha: 0.65,
    });
  }

  private spawnTraffic() {
    const laneWidth = this.roadWidth / 4;
    const laneIndex = Math.floor(Math.random() * 4);
    const laneX = this.roadLeft + (laneIndex + 0.5) * laneWidth;

    const roll = Math.random() * 100;
    let type: TrafficCar['type'] = 'SEDAN';
    let width = 36;
    let height = 68;
    let speed = 180 + Math.random() * 60;
    let color = '#2563eb';
    let subColor = '#1d4ed8';

    if (roll < 42) {
      type = 'SEDAN';
      width = 36;
      height = 68;
      speed = 180 + Math.random() * 60;
      color = '#3b82f6';
      subColor = '#1d4ed8';
    } else if (roll < 68) {
      type = 'SPORTS_CAR';
      width = 34;
      height = 64;
      speed = 300 + Math.random() * 70;
      color = '#eab308';
      subColor = '#ca8a04';
    } else if (roll < 84) {
      type = 'TRUCK';
      width = 46;
      height = 115;
      speed = 120 + Math.random() * 50;
      color = '#94a3b8';
      subColor = '#475569';
    } else if (roll < 93) {
      type = 'OIL_SLICK';
      width = 42;
      height = 32;
      speed = 0;
      color = '#1e1b4b';
      subColor = '#4338ca';
    } else {
      type = 'REPAIR_KIT';
      width = 28;
      height = 28;
      speed = 0;
      color = '#10b981';
      subColor = '#ffffff';
    }

    this.traffic.push({
      id: this.nextTrafficId++,
      x: laneX,
      y: -120,
      width,
      height,
      speed,
      type,
      color,
      subColor,
      collected: false,
    });
  }

  private checkCollisions() {
    for (const t of this.traffic) {
      if (t.collected) continue;

      // Distance test first
      const dx = this.carX - t.x;
      const dy = this.carY - t.y;
      const dist = Math.hypot(dx, dy);

      // Hitbox intersection check
      const halfW = (this.carWidth + t.width) * 0.44;
      const halfH = (this.carHeight + t.height) * 0.44;

      if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
        if (t.type === 'REPAIR_KIT') {
          this.carHealth = Math.min(100, this.carHealth + 35);
          this.score += 500;
          t.collected = true;
          retroAudio.playPickup();
        } else if (t.type === 'OIL_SLICK') {
          this.spinOutTimer = 0.8;
          this.carHealth = Math.max(0, this.carHealth - 8);
          this.carSpeed *= 0.55;
          this.cameraShake = 12 * this.config.rumbleIntensity;
          t.collected = true;
          retroAudio.playSkid();
        } else {
          // Vehicle Impact
          let dmg = 30;
          if (t.type === 'TRUCK') dmg = 45;
          if (t.type === 'SPORTS_CAR') dmg = 25;

          const speedMult = this.carSpeed / this.config.maxSpeed + 0.3;
          this.carHealth = Math.max(0, this.carHealth - dmg * speedMult);
          this.carSpeed *= 0.6;
          this.cameraShake = 22 * this.config.rumbleIntensity;
          this.multiplier = 1;
          this.multiplierTimer = 0;
          t.collected = true;
          retroAudio.playCrash();
        }
      } else {
        // Near-Miss Bonus!
        if (dist < 72 && t.type !== 'REPAIR_KIT' && t.type !== 'OIL_SLICK' && this.carSpeed > 200) {
          if (!this.nearMissToast) {
            this.multiplier = Math.min(4, this.multiplier + 1);
            this.multiplierTimer = 3.0;
            this.score += 150 * this.multiplier;
            this.nearMissToast = { text: `NEAR MISS! x${this.multiplier}`, timer: 1.2 };
            retroAudio.playNearMiss();
          }
        }
      }
    }
  }

  public render() {
    const { ctx } = this;
    ctx.save();

    // 1. Camera Shake
    if (this.cameraShake > 0) {
      const sx = (Math.random() - 0.5) * this.cameraShake;
      const sy = (Math.random() - 0.5) * this.cameraShake;
      ctx.translate(sx, sy);
    }

    // 2. Grass Background
    ctx.fillStyle = '#1c731c';
    ctx.fillRect(0, 0, this.width, this.height);

    // Alternating grass stripes for speed illusion
    const bandH = 70;
    const bandOff = this.roadOffsetY % (bandH * 2);
    ctx.fillStyle = '#228b22';
    for (let y = -bandH * 2; y < this.height + bandH; y += bandH * 2) {
      ctx.fillRect(0, y + bandOff, this.roadLeft, bandH);
      ctx.fillRect(this.roadRight, y + bandOff, this.width - this.roadRight, bandH);
    }

    // 3. Shoulders
    ctx.fillStyle = '#3c414b';
    ctx.fillRect(this.roadLeft - this.shoulderWidth, 0, this.shoulderWidth, this.height);
    ctx.fillRect(this.roadRight, 0, this.shoulderWidth, this.height);

    // 4. Main Asphalt Highway
    ctx.fillStyle = '#1e222a';
    ctx.fillRect(this.roadLeft, 0, this.roadWidth, this.height);

    // 5. Rumble Curbs (Red and White)
    const curbW = 14;
    const stripH = 35;
    const curbOff = this.roadOffsetY % (stripH * 2);
    for (let y = -stripH * 2; y < this.height + stripH * 2; y += stripH) {
      const idx = Math.floor((y - curbOff) / stripH);
      ctx.fillStyle = idx % 2 === 0 ? '#d22d2d' : '#f5f5f5';
      ctx.fillRect(this.roadLeft - curbW, y + curbOff, curbW, stripH);
      ctx.fillRect(this.roadRight, y + curbOff, curbW, stripH);
    }

    // 6. White Edge Lines
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(this.roadLeft, 0, 4, this.height);
    ctx.fillRect(this.roadRight - 4, 0, 4, this.height);

    // 7. Dashed Lane Lines
    const laneW = this.roadWidth / 4;
    const dashH = 45;
    const spaceH = 40;
    const cycle = dashH + spaceH;
    const dashOff = this.roadOffsetY % cycle;

    for (let l = 1; l <= 3; l++) {
      const lx = this.roadLeft + l * laneW;
      ctx.fillStyle = l === 2 ? '#f5be23' : '#f0f0f0';
      for (let y = -cycle; y < this.height + cycle; y += cycle) {
        ctx.fillRect(lx - 2, y + dashOff, 4, dashH);
      }
    }

    // 8. Roadside Scenery Trees
    for (const tree of this.roadsideTrees) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(tree.x + 3, tree.y + 4, tree.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#125a18';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, tree.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#228b22';
      ctx.beginPath();
      ctx.arc(tree.x - 3, tree.y - 3, tree.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. Skid Marks
    for (const mark of this.skidMarks) {
      ctx.fillStyle = `rgba(15, 15, 20, ${mark.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(mark.lx, mark.ly, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mark.rx, mark.ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. Exhaust Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 11. Draw Traffic / Obstacles
    for (const t of this.traffic) {
      if (t.collected) continue;

      if (t.type === 'OIL_SLICK') {
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.ellipse(t.x, t.y, t.width * 0.55, t.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = t.subColor;
        ctx.beginPath();
        ctx.ellipse(t.x + 3, t.y - 2, t.width * 0.35, t.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (t.type === 'REPAIR_KIT') {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.width * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = t.color;
        this.drawRoundedRect(ctx, t.x - t.width / 2, t.y - t.height / 2, t.width, t.height, 4);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(t.x - 3, t.y - 8, 6, 16);
        ctx.fillRect(t.x - 8, t.y - 3, 16, 6);
        continue;
      }

      // Traffic Drop Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.drawRoundedRect(ctx, t.x - t.width / 2 + 3, t.y - t.height / 2 + 4, t.width, t.height, 6);

      // 4 Wheels
      ctx.fillStyle = '#141419';
      ctx.fillRect(t.x - t.width * 0.54, t.y - t.height * 0.38, t.width * 0.16, t.height * 0.22);
      ctx.fillRect(t.x + t.width * 0.38, t.y - t.height * 0.38, t.width * 0.16, t.height * 0.22);
      ctx.fillRect(t.x - t.width * 0.54, t.y + t.height * 0.16, t.width * 0.16, t.height * 0.22);
      ctx.fillRect(t.x + t.width * 0.38, t.y + t.height * 0.16, t.width * 0.16, t.height * 0.22);

      if (t.type === 'TRUCK') {
        // Truck Cargo & Cab
        ctx.fillStyle = t.subColor;
        this.drawRoundedRect(ctx, t.x - t.width * 0.46, t.y - t.height * 0.15, t.width * 0.92, t.height * 0.6, 4);
        ctx.fillStyle = t.color;
        this.drawRoundedRect(ctx, t.x - t.width * 0.44, t.y - t.height * 0.48, t.width * 0.88, t.height * 0.3, 4);
        // Cab glass
        ctx.fillStyle = 'rgba(20, 30, 40, 0.9)';
        ctx.fillRect(t.x - t.width * 0.36, t.y - t.height * 0.44, t.width * 0.72, t.height * 0.12);
        // Tail lights
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(t.x - t.width * 0.42, t.y + t.height * 0.42, 8, 4);
        ctx.fillRect(t.x + t.width * 0.42 - 8, t.y + t.height * 0.42, 8, 4);
      } else {
        // Sedan / Sports Car
        ctx.fillStyle = t.color;
        this.drawRoundedRect(ctx, t.x - t.width * 0.46, t.y - t.height * 0.48, t.width * 0.92, t.height * 0.96, 6);
        // Windshield
        ctx.fillStyle = 'rgba(25, 35, 45, 0.9)';
        this.drawRoundedRect(ctx, t.x - t.width * 0.36, t.y - t.height * 0.28, t.width * 0.72, t.height * 0.18, 4);
        this.drawRoundedRect(ctx, t.x - t.width * 0.34, t.y + t.height * 0.18, t.width * 0.68, t.height * 0.14, 4);
        // Roof
        ctx.fillStyle = t.subColor;
        this.drawRoundedRect(ctx, t.x - t.width * 0.32, t.y - t.height * 0.08, t.width * 0.64, t.height * 0.24, 4);
        // Tail lights
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(t.x - t.width * 0.42, t.y + t.height * 0.44, 7, 4);
        ctx.fillRect(t.x + t.width * 0.42 - 7, t.y + t.height * 0.44, 7, 4);
      }
    }

    // 12. Draw Player Vehicle
    this.drawPlayerCar(ctx);

    ctx.restore();
  }

  private drawPlayerCar(ctx: CanvasRenderingContext2D) {
    const { carX, carY, carWidth: w, carHeight: h, carAngle, carSpeed } = this;

    // Headlight cones
    if (carSpeed > 10) {
      ctx.save();
      const gradL = ctx.createLinearGradient(carX, carY, carX - 50, carY - 200);
      gradL.addColorStop(0, 'rgba(255, 255, 200, 0.25)');
      gradL.addColorStop(1, 'rgba(255, 255, 200, 0)');
      ctx.fillStyle = gradL;
      ctx.beginPath();
      ctx.moveTo(carX - w * 0.3, carY - h * 0.4);
      ctx.lineTo(carX - w * 1.0, carY - 190);
      ctx.lineTo(carX + w * 0.2, carY - 190);
      ctx.closePath();
      ctx.fill();

      const gradR = ctx.createLinearGradient(carX, carY, carX + 50, carY - 200);
      gradR.addColorStop(0, 'rgba(255, 255, 200, 0.25)');
      gradR.addColorStop(1, 'rgba(255, 255, 200, 0)');
      ctx.fillStyle = gradR;
      ctx.beginPath();
      ctx.moveTo(carX + w * 0.3, carY - h * 0.4);
      ctx.lineTo(carX - w * 0.2, carY - 190);
      ctx.lineTo(carX + w * 1.0, carY - 190);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate((carAngle * Math.PI) / 180);

    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    this.drawRoundedRect(ctx, -w / 2 + 4, -h / 2 + 5, w, h, 6);

    // 4 Rubber Tires
    ctx.fillStyle = '#19191e';
    this.drawRoundedRect(ctx, -w * 0.54, -h * 0.38, w * 0.2, h * 0.22, 3);
    this.drawRoundedRect(ctx, w * 0.34, -h * 0.38, w * 0.2, h * 0.22, 3);
    this.drawRoundedRect(ctx, -w * 0.54, h * 0.18, w * 0.2, h * 0.24, 3);
    this.drawRoundedRect(ctx, w * 0.34, h * 0.18, w * 0.2, h * 0.24, 3);

    // Aerodynamic Body (Vibrant Racing Red)
    ctx.fillStyle = '#e62828';
    this.drawRoundedRect(ctx, -w * 0.46, -h * 0.48, w * 0.92, h * 0.96, 7);

    // White Racing Stripe down center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w * 0.1, -h * 0.46, w * 0.2, h * 0.92);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-w * 0.04, -h * 0.46, w * 0.08, h * 0.92);

    // Windshield (Front & Rear Tinted Glass)
    ctx.fillStyle = 'rgba(30, 45, 60, 0.95)';
    this.drawRoundedRect(ctx, -w * 0.36, -h * 0.28, w * 0.72, h * 0.2, 4);

    // Cabin Roof
    ctx.fillStyle = '#ff5050';
    this.drawRoundedRect(ctx, -w * 0.32, -h * 0.08, w * 0.64, h * 0.28, 4);

    // Rear windshield
    ctx.fillStyle = 'rgba(30, 45, 60, 0.95)';
    this.drawRoundedRect(ctx, -w * 0.34, h * 0.2, w * 0.68, h * 0.12, 4);

    // Rear Spoiler
    ctx.fillStyle = '#141419';
    this.drawRoundedRect(ctx, -w * 0.48, h * 0.38, w * 0.96, h * 0.08, 3);

    // Headlights
    ctx.fillStyle = '#ffffc8';
    this.drawRoundedRect(ctx, -w * 0.42, -h * 0.47, w * 0.22, h * 0.08, 3);
    this.drawRoundedRect(ctx, w * 0.2, -h * 0.47, w * 0.22, h * 0.08, 3);

    // Tail Lights (Glow bright red when braking)
    ctx.fillStyle = this.keys.down ? '#ff1414' : '#b40a0a';
    this.drawRoundedRect(ctx, -w * 0.44, h * 0.42, w * 0.22, h * 0.06, 3);
    this.drawRoundedRect(ctx, w * 0.22, h * 0.42, w * 0.22, h * 0.06, 3);

    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }
}
