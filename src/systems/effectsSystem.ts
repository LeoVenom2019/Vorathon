import { Entity } from '../core/Types';

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export class EffectsSystem {
  floatingTexts: FloatingText[] = [];
  particles: Particle[] = [];

  addFloatingText(x: number, y: number, text: string, color: string, isCrit: boolean = false) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      size: isCrit ? 24 : 16,
      maxLife: 1.0,
      life: 1.0,
      vy: -50 - Math.random() * 50
    });
  }

  addExplosion(x: number, y: number, color: string, count: number = 8) {
    const actualCount = count * 2; // 2x increase
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color,
        life: 0.6 + Math.random() * 0.6,
        maxLife: 1.2
      });
    }
  }

  update(delta: number) {
    // Update texts
    this.floatingTexts.forEach(t => {
      t.y += t.vy * delta;
      t.life -= delta;
    });
    this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);

    // Update particles
    this.particles.forEach(p => {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vx *= 0.92; // slightly more friction for explosive feel
      p.vy *= 0.92;
      p.life -= delta;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw particles with simpler transparency
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw floating texts (Simplified)
    ctx.globalAlpha = 1.0;
    this.floatingTexts.forEach(t => {
      const alpha = t.life / t.maxLife;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.globalAlpha = alpha;
      ctx.fillText(t.text, t.x, t.y);
    });

    ctx.restore();
  }
}

export const effectsSystem = new EffectsSystem();
