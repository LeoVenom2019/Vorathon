import { Entity, EntityType } from './Types';
import { triggerFeedback } from './Store';
import { effectsSystem } from '../systems/effectsSystem';
import { BulletType } from './Bullet';

export interface BossData {
  id: string;
  nome: string;
  titulo: string;
  vida: number;
  velocidade: number;
  comportamento: string;
  tema: string;
  descricao: string;
}

export class Boss implements Entity {
  entityType: EntityType = EntityType.BOSS;
  x: number;
  y: number;
  width: number = 140;
  height: number = 200;
  hp: number;
  maxHp: number;
  data: BossData;
  speed: number;
  shootTimer: number = 0;
  shootInterval: number = 0.8;
  blinkTimer: number = 0;
  moveDir: number = 1;
  phase: number = 1;
  stateTimer: number = 0;
  frozenTimer: number = 0;
  isActive: boolean = false;

  get isFrozen() { return this.frozenTimer > 0; }

  constructor(x: number, y: number, data: BossData) {
    this.x = x;
    this.y = y;
    this.data = data;
    this.hp = data.vida;
    this.maxHp = data.vida;
    this.speed = data.velocidade;
  }

  get name() { return this.data.nome; }

  freeze(duration: number) {
    this.frozenTimer = Math.max(this.frozenTimer, duration);
  }

  takeDamage(amount: number) {
    if (!this.isActive) return;
    if (this.isFrozen && amount > 0) {
      this.hp -= amount * 2;
      if (this.hp < 0) this.hp = 0;
      return;
    }
    this.hp -= amount;
    this.blinkTimer = 0.1;
  }

  update(delta: number, canvasWidth: number, canvasHeight: number, playerPos: { x: number, y: number }, spawnBullet: (x: number, y: number, angle: number, ownerType: EntityType, color?: string, type?: BulletType, dmgMult?: number, isPrimary?: boolean) => void) {
    if (!this.isActive) {
        const margin = 100; // Bosses are larger
        if (this.x < canvasWidth + margin && this.y > -margin && this.y < canvasHeight + margin) {
            this.isActive = true;
        }
    }
    if (this.blinkTimer > 0) this.blinkTimer -= delta;
    if (this.frozenTimer > 0) this.frozenTimer -= delta;
    this.stateTimer += delta;

    // Movement frozen logic
    const currentDelta = this.isFrozen ? 0 : delta;

    // Base Movement: Stay on right side
    const targetX = 750;
    if (this.x > targetX) {
        this.x -= 100 * currentDelta;
    }

    // Behavior Switch
    if (!this.isFrozen) {
        switch (this.data.comportamento) {
            case 'invoca_sombras':
                this.updateHades(currentDelta);
                break;
            case 'ataque_onda':
                this.updatePoseidon(currentDelta);
                break;
            case 'ataque_rapido':
                this.updateZeus(currentDelta);
                break;
            case 'perseguicao':
                this.updateAres(currentDelta, playerPos);
                break;
            case 'desviar_inteligente':
                this.updateAthena(currentDelta, playerPos);
                break;
            case 'erratico':
                this.updateHermes(currentDelta);
                break;
            case 'precisao':
                this.updateArtemis(currentDelta);
                break;
            case 'cria_entidades':
                this.updateHephaestus(currentDelta);
                break;
            case 'vibracao_tempo':
                this.updateChronos(currentDelta);
                break;
            case 'escuridao_total':
                this.updateNyx(currentDelta);
                break;
            default:
                this.y += this.moveDir * this.speed * currentDelta;
                if (this.y > 450 || this.y < 50) this.moveDir *= -1;
        }
    }

    // Phase Change logic (New Requirement)
    if (this.hp < this.maxHp * 0.7 && this.phase === 1) {
        this.phase = 2;
        this.shootInterval *= 0.8;
        triggerFeedback('shake', 15);
        triggerFeedback('flash', 0.3);
        effectsSystem.addFloatingText(this.x + this.width/2, this.y, "PHASE 2: ENRAGED", this.data.tema, true);
    }

    if (this.hp < this.maxHp * 0.3 && this.phase === 2) {
        this.phase = 3;
        this.shootInterval *= 0.7; // Even faster
        this.speed *= 1.4; // More aggressive movement
        triggerFeedback('shake', 25);
        triggerFeedback('flash', 0.5);
        effectsSystem.addFloatingText(this.x + this.width/2, this.y, "PHASE 3: DESPERATION", '#ffffff', true);
    }

    // Simple Shooting Logic
    if (!this.isFrozen) {
        this.shootTimer += delta;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.fireAttack(playerPos, spawnBullet);
        }
    }
  }

  private updateHades(delta: number) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      this.y += Math.sin(this.stateTimer) * this.speed * delta * speedMult;
  }

  private updatePoseidon(delta: number) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      this.y += Math.cos(this.stateTimer * 0.5) * this.speed * 2 * delta * speedMult;
  }

  private updateZeus(delta: number) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      if (Math.random() < 0.02 * speedMult) this.moveDir *= -1;
      this.y += this.moveDir * this.speed * delta * speedMult;
      if (this.y < 0 || this.y > 500) this.moveDir *= -1;
  }

  private updateAres(delta: number, playerPos: { x: number, y: number }) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      const dy = playerPos.y - (this.y + this.height/2);
      this.y += Math.sign(dy) * this.speed * delta * 0.8 * speedMult;
  }

  private updateAthena(delta: number, playerPos: { x: number, y: number }) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      this.y += this.moveDir * this.speed * delta * speedMult;
      if (this.y > 400 || this.y < 100) this.moveDir *= -1;
      // Athena avoids player Y slightly
      const dy = playerPos.y - (this.y + this.height/2);
      if (Math.abs(dy) < 50) this.y -= Math.sign(dy) * 50 * delta * speedMult;
  }

  private updateHermes(delta: number) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      this.y += Math.sin(this.stateTimer * 4) * this.speed * delta * speedMult;
      this.x += Math.cos(this.stateTimer * 2) * 50 * delta * speedMult;
  }

  private updateArtemis(delta: number) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      this.y += this.moveDir * this.speed * delta * speedMult;
      if (this.y > 450 || this.y < 50) this.moveDir *= -1;
  }

  private updateHephaestus(delta: number) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      this.y += this.moveDir * (this.speed * 0.5) * delta * speedMult;
      if (this.y > 350 || this.y < 150) this.moveDir *= -1;
  }

  private updateChronos(delta: number) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      const speedMod = Math.sin(this.stateTimer) > 0 ? 2 : 0.2;
      this.y += this.moveDir * this.speed * speedMod * delta * speedMult;
      if (this.y > 450 || this.y < 50) this.moveDir *= -1;
  }

  private updateNyx(delta: number) {
      const speedMult = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
      this.y += Math.sin(this.stateTimer * 0.2) * this.speed * delta * speedMult;
  }

  private fireAttack(playerPos: { x: number, y: number }, spawnBullet: (x: number, y: number, angle: number, ownerType: EntityType, color?: string, type?: BulletType, dmgMult?: number) => void) {
      const dx = playerPos.x - this.x;
      const dy = playerPos.y - (this.y + this.height/2);
      const angle = Math.atan2(dy, dx);

      if (this.data.id === 'boss_nyx') {
          const bulletsCount = this.phase === 3 ? 7 : this.phase === 2 ? 5 : 3;
          for(let i=-(bulletsCount-1)/2; i<=(bulletsCount-1)/2; i++) spawnBullet(this.x, this.y + this.height/2, angle + i*0.2, EntityType.BOSS);
      } else if (this.data.id === 'boss_poseidon') {
          spawnBullet(this.x, this.y + this.height/2, Math.PI, EntityType.BOSS);
          spawnBullet(this.x, this.y + 40, Math.PI, EntityType.BOSS);
          spawnBullet(this.x, this.y + this.height - 40, Math.PI, EntityType.BOSS);
          if (this.phase >= 2) {
              spawnBullet(this.x, this.y + 20, Math.PI, EntityType.BOSS);
              spawnBullet(this.x, this.y + this.height - 20, Math.PI, EntityType.BOSS);
          }
      } else if (this.data.id === 'boss_zeus') {
          spawnBullet(this.x, this.y + this.height/2, angle + (Math.random()-0.5), EntityType.BOSS);
          if (this.phase >= 2) spawnBullet(this.x, this.y + this.height/2 - 20, angle + (Math.random()-0.5), EntityType.BOSS);
          if (this.phase === 3) spawnBullet(this.x, this.y + this.height/2 + 20, angle + (Math.random()-0.5), EntityType.BOSS);
      } else {
          spawnBullet(this.x, this.y + this.height/2, angle, EntityType.BOSS);
          if (this.phase >= 2) {
              spawnBullet(this.x, this.y + this.height/2, angle + 0.3, EntityType.BOSS);
              spawnBullet(this.x, this.y + this.height/2, angle - 0.3, EntityType.BOSS);
          }
          if (this.phase === 3) {
              spawnBullet(this.x, this.y + this.height/2, angle + 0.6, EntityType.BOSS);
              spawnBullet(this.x, this.y + this.height/2, angle - 0.6, EntityType.BOSS);
          }
      }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.blinkTimer > 0) ctx.filter = 'brightness(3)';
    
    // Ice Overlay
    if (this.isFrozen) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#eff6ff';
        ctx.beginPath();
        ctx.roundRect(-10, -10, this.width + 20, this.height + 20, 15);
        ctx.fill();
        
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for(let i=0; i<8; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * this.width, 0);
            ctx.lineTo(Math.random() * this.width, this.height);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Pulse
    const pulse = Math.sin(this.stateTimer * 5) * 0.1 + 1;

    // 1. Boss Bloom (Simplified)
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = this.isFrozen ? '#1e4ed8' : this.data.tema;
    ctx.beginPath();
    ctx.arc(this.width/2, this.height/2, this.width, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Boss Body
    ctx.fillStyle = this.isFrozen ? '#1d4ed8' : this.data.tema;
    
    ctx.beginPath();
    if (this.data.id === 'boss_zeus') {
        ctx.moveTo(0, this.height/2);
        ctx.lineTo(this.width * 0.5, 0);
        ctx.lineTo(this.width * 0.3, this.height/2);
        ctx.lineTo(this.width * 0.8, 0);
        ctx.lineTo(this.width, this.height/2);
        ctx.lineTo(this.width * 0.4, this.height);
    } else if (this.data.id === 'boss_nyx') {
        for(let i=0; i<8; i++) {
            const r = i % 2 === 0 ? this.width/2 : this.width/4;
            const ang = (i / 8) * Math.PI * 2;
            ctx.lineTo(this.width/2 + Math.cos(ang)*r, this.height/2 + Math.sin(ang)*r);
        }
    } else {
        ctx.moveTo(0, this.height/2);
        ctx.lineTo(this.width, 0);
        ctx.lineTo(this.width * 0.7, this.height/2);
        ctx.lineTo(this.width, this.height);
    }
    ctx.closePath();
    ctx.fill();

    // 3. Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.width * 0.4, this.height/2, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
