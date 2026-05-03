import { Entity, EntityType } from './Types';
import { visualEffectSystem } from '../systems/visualEffectSystem';
import { getPlayerState, updatePlayerState } from './Store';
import { difficultySystem } from '../systems/difficultySystem';
import { enemySystem, EnemyType } from '../systems/enemySystem';
import { bossSystem } from '../systems/bossSystem';

export enum BulletType {
    NORMAL = 'NORMAL',
    MISSILE = 'MISSILE',
    PLASMA = 'PLASMA',
    ARC = 'ARC'
}

export class Bullet implements Entity {
  entityType: EntityType = EntityType.BOT; // Default or maybe I should use ownerType property
  x: number;
  y: number;
  width: number = 20;
  height: number = 4;
  speed: number = 900;
  angle: number;
  isEnemyBullet: boolean;
  ownerType: EntityType;
  active: boolean = true;
  color?: string;
  bulletType: BulletType = BulletType.NORMAL;
  damageMult: number = 1;
  private trailTimer: number = 0;
  private target: Entity | null = null;

  constructor(x: number, y: number, angle: number, ownerType: EntityType = EntityType.PLAYER, color?: string, type: BulletType = BulletType.NORMAL, damageMult: number = 1) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.ownerType = ownerType;
    this.isEnemyBullet = ownerType === EntityType.ENEMY || ownerType === EntityType.BOSS;
    this.color = color;
    this.bulletType = type;
    this.damageMult = damageMult;

    if (this.isEnemyBullet) {
        this.speed = 400;
        this.width = 15;
    }

    if (this.bulletType === BulletType.MISSILE) {
        this.width = 25;
        this.height = 10;
        this.speed = 600;
    } else if (this.bulletType === BulletType.PLASMA) {
        this.width = 30;
        this.height = 30;
        this.speed = 500;
    } else if (this.bulletType === BulletType.ARC) {
        this.width = 40;
        this.height = 15;
        this.speed = 1200;
    }
  }

  setTarget(target: Entity) {
      this.target = target;
  }

  update(delta: number, playerPos?: { x: number, y: number }) {
    if (this.bulletType === BulletType.MISSILE) {
        // Dynamic re-targeting if current target is invalid
        if (!this.target || (this.target as any).hp <= 0) {
            this.findNewTarget();
        }

        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // Simple rotation towards target
            let diff = targetAngle - this.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.angle += diff * 5 * delta;
        }
    }

    // Nightmare+ Tracking for enemy bullets
    if (this.isEnemyBullet && difficultySystem.getModifiers().hasProjectileTracking && playerPos) {
        const dx = playerPos.x - this.x;
        const dy = playerPos.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        let diff = targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        // Slight adjustment towards player
        this.angle += diff * 0.5 * delta;
    }

    this.x += Math.cos(this.angle) * this.speed * delta;
    this.y += Math.sin(this.angle) * this.speed * delta;

    this.trailTimer += delta;
    if (this.trailTimer > 0.03) {
        this.trailTimer = 0;
        const isOverloaded = !this.isEnemyBullet && getPlayerState().stats.isOverloaded;
        const defaultColor = isOverloaded ? '#60a5facc' : '#3b82f699';
        const trailColor = this.isEnemyBullet ? '#ef444499' : (this.color ? this.color + '99' : defaultColor);

        visualEffectSystem.emitTrailParticles(
            this.x, 
            this.y, 
            trailColor, 
            (isOverloaded || this.bulletType !== BulletType.NORMAL) ? 4 : 1.5
        );
    }
  }

  private findNewTarget() {
      if (bossSystem.currentBoss && bossSystem.currentBoss.x < 1000) {
          this.target = bossSystem.currentBoss;
          return;
      }

      const enemies = enemySystem.enemies.filter(e => e.hp > 0);
      if (enemies.length > 0) {
          // Prefer Elites, then closest
          const elites = enemies.filter(e => e.type === EnemyType.ELITE);
          this.target = this.findClosest(elites.length > 0 ? elites : enemies);
      } else {
          this.target = null;
      }
  }

  private findClosest(list: any[]): Entity | null {
      let closest = null;
      let minDist = Infinity;
      list.forEach(e => {
          const d = Math.pow(e.x - this.x, 2) + Math.pow(e.y - this.y, 2);
          if (d < minDist) {
              minDist = d;
              closest = e;
          }
      });
      return closest;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    const isOverloaded = !this.isEnemyBullet && getPlayerState().stats.isOverloaded;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    const defaultMainColor = isOverloaded ? '#93c5fd' : '#60a5fa';
    const mainColor = this.isEnemyBullet ? '#ef4444' : (this.color || defaultMainColor);
    
    if (this.bulletType === BulletType.NORMAL) {
        // 1. Long Energy Trail
        if (!this.isEnemyBullet) {
            ctx.save();
            ctx.globalAlpha = isOverloaded ? 0.5 : 0.3;
            ctx.fillStyle = this.color || (isOverloaded ? '#93c5fd' : '#60a5fa');
            ctx.beginPath();
            ctx.ellipse(-20, 0, isOverloaded ? 45 : 30, isOverloaded ? 12 : 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 2. Main Beam / Bolt
        ctx.fillStyle = mainColor;
        const beamLength = this.isEnemyBullet ? this.width : (isOverloaded ? this.width * 3.5 : this.width * 2.5);
        const beamHeight = this.isEnemyBullet ? this.height : (isOverloaded ? this.height * 2.2 : this.height * 1.5);
        
        ctx.beginPath();
        ctx.moveTo(8, 0); // Tip
        ctx.lineTo(-beamLength, -beamHeight);
        ctx.lineTo(-beamLength * 0.8, 0);
        ctx.lineTo(-beamLength, beamHeight);
        ctx.closePath();
        ctx.fill();
    } else if (this.bulletType === BulletType.MISSILE) {
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(-this.width/2, -this.height/2, this.width, this.height, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.width/4, -this.height/4, this.width/4, this.height/2);
    } else if (this.bulletType === BulletType.PLASMA) {
        const pulse = 1 + Math.sin(performance.now() / 100) * 0.1;
        ctx.fillStyle = mainColor;
        ctx.shadowBlur = 30; // Increased blur
        ctx.shadowColor = mainColor;
        ctx.beginPath();
        ctx.arc(0, 0, (this.width/2) * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // erratic discharge lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const ang = Math.random() * Math.PI * 2;
            const dist = (this.width/2) * (1.2 + Math.random() * 0.5);
            ctx.lineTo(Math.cos(ang) * dist, Math.sin(ang) * dist);
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, (this.width/4) * pulse, 0, Math.PI * 2);
        ctx.fill();
    } else if (this.bulletType === BulletType.ARC) {
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = mainColor;
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        for(let i = -this.width/2; i < this.width/2; i += 5) {
            ctx.lineTo(i, (Math.random() - 0.5) * 15);
        }
        ctx.stroke();
    }
    
    // 3. High Intensity Core (for normal bullets)
    if (this.bulletType === BulletType.NORMAL) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
  }
}
