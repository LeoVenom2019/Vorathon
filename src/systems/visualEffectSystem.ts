import { getPlayerState } from '../core/Store';
import runesData from '../data/runes.json';
import relicsData from '../data/relics.json';
import { environmentSystem } from './environmentSystem';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    type?: 'ambient' | 'fire' | 'energy' | 'glow' | 'lightning' | 'smoke' | 'distortion' | 'snow';
}

export class VisualEffectSystem {
    private runes = (runesData as any).runes;
    private relics = (relicsData as any).relics;
    
    private particles: Particle[] = [];
    private ambientParticles: Particle[] = [];
    private lightningBolts: any[] = [];
    private erraticRays: any[] = [];
    private stormIntensity: number = 0;
    private maxParticles = 800; 
    private orbitAngle = 0;
    private pulseTimer = 0;
    private flickerTimer = 0;
    private ambientEnergyTimer = 0;

    constructor() {
        this.initAmbientParticles();
    }

    private initAmbientParticles() {
        this.ambientParticles = [];
        for (let i = 0; i < 100; i++) {
            this.ambientParticles.push({
                x: Math.random() * 2000,
                y: Math.random() * 2000,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1,
                maxLife: 1,
                color: '#ffffff',
                size: Math.random() * 2 + 0.5,
                type: 'ambient'
            });
        }
    }

    update(delta: number) {
        this.orbitAngle += 1.5 * delta;
        this.pulseTimer += (getPlayerState().stats.isOverloaded ? 6 : 2) * delta;
        this.flickerTimer += 10 * delta;
        this.ambientEnergyTimer += delta;

        if (this.stormIntensity > 0) {
            this.stormIntensity -= delta * 0.5;
            if (this.stormIntensity < 0) this.stormIntensity = 0;
        }

        // Update lightning bolts
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            const b = this.lightningBolts[i];
            b.life -= delta * b.speed;
            if (b.life <= 0) this.lightningBolts.splice(i, 1);
        }

        // Update erratic rays
        for (let i = this.erraticRays.length - 1; i >= 0; i--) {
            const r = this.erraticRays[i];
            r.life -= delta;
            
            // Caotic but fluid movement
            r.targetX += (Math.random() - 0.5) * 400;
            r.targetY += (Math.random() - 0.5) * 400;
            r.x += (r.targetX - r.x) * 5 * delta;
            r.y += (r.targetY - r.y) * 5 * delta;
            
            if (r.life <= 0) this.erraticRays.splice(i, 1);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            
            p.life -= delta;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update ambient particles
        this.ambientParticles.forEach(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            if (p.x < 0) p.x = 2000;
            if (p.x > 2000) p.x = 0;
            if (p.y < 0) p.y = 2000;
            if (p.y > 2000) p.y = 0;
        });
    }

    emitHitEffect(x: number, y: number, color: string) {
        const count = 30; // High density for impact
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 800,
                vy: (Math.random() - 0.5) * 800,
                life: 0.5,
                maxLife: 0.5,
                color,
                size: Math.random() * 5 + 1
            });
        }
    }

    emitExplosion(x: number, y: number, color: string, intensity: number = 25) {
        const actualIntensity = intensity * 4; 
        
        // 1. Shockwave Ripple
        this.particles.push({
            x, y, vx: 0, vy: 0,
            life: 0.4, maxLife: 0.4,
            color, size: 1, type: 'glow'
        });

        // 2. Central Flash
        this.particles.push({
            x, y, vx: 0, vy: 0,
            life: 0.2, maxLife: 0.2,
            color: '#ffffff', size: 50, type: 'ambient'
        });

        // 3. Shrapnel
        for (let i = 0; i < actualIntensity; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 1000 + 300;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 1.0 + 0.5,
                maxLife: 1.5,
                color: i % 2 === 0 ? color : '#ffffff',
                size: Math.random() * 10 + 2
            });
        }
    }

    emitLevelUp(x: number, y: number) {
        const colors = ['#f59e0b', '#fbbf24', '#ffffff'];
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 700 + 400;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 2.0,
                maxLife: 2.0,
                color: colors[i % colors.length],
                size: Math.random() * 8 + 3
            });
        }
        
        // Ring
        this.particles.push({
            x, y, vx: 0, vy: 0,
            life: 1.0, maxLife: 1.0,
            color: '#fbbf24', size: 2, type: 'glow'
        });
    }

    emitShotParticles(x: number, y: number, color: string) {
        const count = 10;
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            this.particles.push({
                x, y,
                vx: (Math.random() - 1.5) * 250, 
                vy: (Math.random() - 0.5) * 200,
                life: 0.4,
                maxLife: 0.4,
                color,
                size: Math.random() * 4 + 1
            });
        }
    }

    emitTrailParticles(x: number, y: number, color: string, size: number = 2) {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 0.8,
            maxLife: 0.8,
            color,
            size: Math.random() * size + 1
        });
    }

    emitSmoke(x: number, y: number, color: string = '#666666', size: number = 20) {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50 - 20, // Drift slightly up
            life: 1.0 + Math.random() * 0.5,
            maxLife: 1.5,
            color,
            size: size + Math.random() * 10,
            type: 'smoke'
        });
    }

    emitFlame(x: number, y: number, size: number = 15) {
        if (this.particles.length >= this.maxParticles) return;
        const colors = ['#f59e0b', '#fbbf24', '#ef4444'];
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: size + Math.random() * 5,
            type: 'fire'
        });
    }

    emitDistortion(x: number, y: number, radius: number) {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({
            x, y,
            vx: 0, vy: 0,
            life: 0.5, maxLife: 0.5,
            color: 'rgba(255,255,255,0.1)',
            size: radius,
            type: 'distortion'
        });
    }



    draw(ctx: CanvasRenderingContext2D, playerX: number, playerY: number, playerW: number, playerH: number) {
        const state = getPlayerState();
        const equippedRunes = state.equippedRunes.filter(Boolean);
        const equippedRelics = state.equippedRelics.filter(Boolean);
        const isOverloaded = state.stats.isOverloaded;

        const px = playerX + playerW / 2;
        const py = playerY + playerH / 2;
        const pulse = 1 + Math.sin(this.pulseTimer * 3) * (isOverloaded ? 0.3 : 0.1);

        // Storm Flicker
        if (this.stormIntensity > 0) {
            const flicker = Math.random() * this.stormIntensity;
            if (flicker > 0.8) {
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${flicker * 0.15})`;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }
        }

        if (isOverloaded) this.drawOverloadAura(ctx, px, py, pulse);

        if (equippedRelics.length >= 4) {
            const avgColor = this.getAverageColor(equippedRelics, this.relics);
            this.emitTrailParticles(px, py, avgColor, 8);
        } else {
            this.emitTrailParticles(px, py, '#3b82f644', 4);
        }

        if (equippedRunes.length >= 4) {
            equippedRunes.forEach((id, i) => {
                const rune = this.runes.find((r: any) => r.id === id);
                if (rune) this.drawOrbitingSphere(ctx, px, py, i, rune.color);
            });
        }

        this.drawLightningBolts(ctx);
        this.drawErraticRays(ctx);
        this.drawParticles(ctx);
    }

    private drawLightningBolts(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        this.lightningBolts.forEach(bolt => {
            const alpha = bolt.life / bolt.maxLife;
            const flicker = Math.sin(this.flickerTimer * 20) > 0;
            
            ctx.shadowBlur = 30 * alpha;
            ctx.shadowColor = bolt.color;
            ctx.globalAlpha = flicker ? alpha : alpha * 0.5;
            
            // Draw multiple layers for glow
            // Layer 1: Wide Outer Glow
            ctx.strokeStyle = bolt.color;
            ctx.lineWidth = (10 + bolt.level * 4) * alpha;
            ctx.beginPath();
            bolt.segments.forEach((s: any) => {
                ctx.moveTo(s.x1, s.y1);
                ctx.lineTo(s.x2, s.y2);
            });
            ctx.stroke();

            // Layer 2: Main Bolt
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = (3 + bolt.level) * alpha;
            ctx.stroke();

            // Layer 3: Inner Core (White)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1 * alpha;
            ctx.stroke();
        });
        ctx.restore();
    }

    private drawErraticRays(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        this.erraticRays.forEach(ray => {
            const alpha = ray.life / ray.maxLife;
            ray.history.push({ x: ray.x, y: ray.y });
            if (ray.history.length > 10) ray.history.shift();

            // Glow
            this.drawGlowCircle(ctx, ray.x, ray.y, 40 * alpha, ray.color + '44');

            ctx.strokeStyle = ray.color;
            ctx.lineWidth = 3 * alpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = ray.color;
            
            ctx.beginPath();
            if (ray.history.length > 0) {
                ctx.moveTo(ray.history[0].x, ray.history[0].y);
                for (let i = 1; i < ray.history.length; i++) {
                    ctx.lineTo(ray.history[i].x, ray.history[i].y);
                }
            }
            ctx.stroke();

            // Arcos saltando
            if (Math.random() > 0.7) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(ray.x, ray.y);
                ctx.lineTo(ray.x + (Math.random() - 0.5) * 100, ray.y + (Math.random() - 0.5) * 100);
                ctx.stroke();
            }
        });
        ctx.restore();
    }

    private drawOverloadAura(ctx: CanvasRenderingContext2D, x: number, y: number, pulse: number) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const auraSize = 140 * pulse;
        const grad = ctx.createRadialGradient(x, y, 10, x, y, auraSize);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
        grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.2)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, auraSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.4 * pulse;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 45 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    emitSnowflake(x: number, y: number, intensity: number = 1) {
        if (this.particles.length >= this.maxParticles) return;
        const speedMult = 1 + (intensity - 1) * 0.3;
        const size = Math.random() * (1 + intensity) + 0.5;
        const isFast = Math.random() > 0.7;

        this.particles.push({
            x, y,
            vx: -400 * speedMult - (isFast ? 300 : 0) - Math.random() * 200, // Strong diagonal wind
            vy: Math.random() * 250 + 100,
            life: 3.0,
            maxLife: 3.0,
            color: isFast ? '#ffffff' : '#bfdbfe',
            size: isFast ? size * 0.5 : size,
            type: 'snow'
        });
    }

    emitIceShatter(x: number, y: number, intensity: number = 30) {
        // Core shard burst
        for (let i = 0; i < intensity; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 800 + 400;
            const size = Math.random() * 10 + 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6 + Math.random() * 0.6,
                maxLife: 1.2,
                color: i % 2 === 0 ? '#f0f9ff' : '#60a5fa', // Crystalline blue/white
                size: size,
                type: 'energy' // Sharp look
            });
        }
        
        // Cold flash
        this.particles.push({
            x, y, vx: 0, vy: 0,
            life: 0.2, maxLife: 0.2,
            color: '#ffffff', size: 60, type: 'ambient'
        });

        // Ice dust residual
        for (let i = 0; i < 8; i++) {
            this.emitSmoke(x, y, '#bfdbfe44', 10);
        }
    }

    emitIceBurst(x: number, y: number, radius: number, color: string = '#60a5fa') {
        // Impact wave
        this.particles.push({
            x, y, vx: 0, vy: 0,
            life: 0.5, maxLife: 0.5,
            color: '#ffffff', size: radius * 2, type: 'glow'
        });

        // Radial ice shards
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI * 2;
            const speed = radius * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.8,
                maxLife: 0.8,
                color: color,
                size: 5,
                type: 'energy'
            });
        }
    }

    drawBlizzardEffect(ctx: CanvasRenderingContext2D, time: number, level: number = 1, synergyColor?: string) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const intensity = 0.2 + (level * 0.1);
        const baseColor = synergyColor || '#1e3a8a';

        ctx.save();
        
        // 1. Screenspace Cold Atmosphere (Desaturation simulated by blue tint)
        ctx.globalAlpha = intensity * 0.6;
        ctx.fillStyle = baseColor; 
        ctx.fillRect(0, 0, width, height);
        
        // 2. Frost Borders / Ice Vignette
        const colorWithAlpha = baseColor.startsWith('#') ? baseColor + '11' : baseColor;
        const vignette = ctx.createRadialGradient(width/2, height/2, width * 0.2, width/2, height/2, width * 0.9);
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(0.7, colorWithAlpha);
        vignette.addColorStop(1, synergyColor ? synergyColor + '33' : '#93c5fd33');
        ctx.globalAlpha = 0.5 + (level * 0.1);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        // Decorative Frost at Screen Corners
        ctx.strokeStyle = '#ffffff22';
        ctx.lineWidth = 2;
        const cornerSize = 150;
        const drawCorner = (cx: number, cy: number, rot: number) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            for(let i=0; i<5; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const l = cornerSize * (1 - i*0.2);
                ctx.lineTo(l, i * 20);
                ctx.stroke();
            }
            ctx.restore();
        };
        drawCorner(0, 0, 0);
        drawCorner(width, 0, Math.PI / 2);
        drawCorner(width, height, Math.PI);
        drawCorner(0, height, -Math.PI / 2);

        // 3. Heavy Wind Haze (Diagonal moving layers)
        ctx.globalAlpha = 0.1 + (level * 0.05);
        ctx.fillStyle = '#f0f9ff';
        const windOffset = (time * 1200) % width;
        for(let i = -1; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(windOffset + i * width, -100);
            ctx.lineTo(windOffset + i * width - 400, height + 100);
            ctx.lineTo(windOffset + i * width - 200, height + 100);
            ctx.lineTo(windOffset + i * width + 200, -100);
            ctx.fill();
        }

        // 4. Whiteout Pulse
        const flashIntensity = Math.sin(time * 15) * 0.05 + 0.05;
        ctx.globalAlpha = flashIntensity;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        ctx.restore();
    }
    drawIceFloorEffect(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalCompositeOperation = 'screen';
        
        // Dynamic Ice Crack Pattern
        ctx.strokeStyle = '#93c5fd44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i=0; i<8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const r = radius * (0.8 + Math.sin(time*2 + i)*0.1);
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.stroke();

        // Pulsing Frost Core
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        grad.addColorStop(0, '#eff6ff55');
        grad.addColorStop(0.5, '#60a5fa22');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    emitEnergySpark(x: number, y: number, color: string) {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 600,
            vy: (Math.random() - 0.5) * 600,
            life: 0.2 + Math.random() * 0.2,
            maxLife: 0.4,
            color,
            size: 2 + Math.random() * 2,
            type: 'energy'
        });
    }

    drawShockwaveBeam(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, level: number, time: number) {
        ctx.save();
        
        // Vibration / Noise
        const vibration = Math.sin(time * 60) * 4;
        const beamY = y + vibration;
        
        // Pulse
        const pulse = 1 + Math.sin(time * 20) * 0.15;
        const currentHeight = height * pulse;

        // Level 3 RGB Overload
        let beamColor = color;
        if (level === 3) {
            beamColor = `hsl(${(time * 400) % 360}, 100%, 70%)`;
        }

        // Draw multiple layers
        // 1. Outer glow
        ctx.globalAlpha = 0.15;
        ctx.shadowBlur = 30;
        ctx.shadowColor = beamColor;
        ctx.fillStyle = beamColor;
        ctx.beginPath();
        this.drawNoisyBeamPath(ctx, x, beamY, width, currentHeight * 1.5, level, time, 0);
        ctx.fill();

        // 2. Main energy body
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        this.drawNoisyBeamPath(ctx, x, beamY, width, currentHeight, level, time, 1);
        ctx.fill();

        // 3. Energetic discharges
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            this.drawEnergyDischargePath(ctx, x, beamY, width, currentHeight, time, i);
            ctx.stroke();
        }

        // 4. Bright core
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = level === 3 ? '#ffffff' : '#f0f9ff';
        ctx.beginPath();
        this.drawNoisyBeamPath(ctx, x, beamY, width, currentHeight * 0.25, level, time, 2);
        ctx.fill();

        // 5. Pulsing Tip Glow
        ctx.save();
        const tipPulse = 1 + Math.sin(time * 30) * 0.2;
        const tipSize = Math.max(0.1, currentHeight * 2 * tipPulse);
        
            if (Number.isFinite(tipSize) && Number.isFinite(x) && Number.isFinite(width) && Number.isFinite(beamY)) {
                const tipRadius = Math.max(0.1, tipSize);
                const tipGrad = ctx.createRadialGradient(x + width, beamY, 0, x + width, beamY, tipRadius);
                tipGrad.addColorStop(0, beamColor);
                tipGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = tipGrad;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(x + width, beamY, tipRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        ctx.restore();

        ctx.restore();

        // Constant particles at the base and along the beam
        if (Math.random() > 0.5) this.emitEnergySpark(x, y + (Math.random()-0.5)*height, beamColor);
        if (Math.random() > 0.8) this.emitEnergySpark(x + Math.random()*width, y + (Math.random()-0.5)*height, beamColor);
    }

    private drawNoisyBeamPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, level: number, time: number, seed: number) {
        const segments = 20;
        const segmentWidth = width / segments;
        const noiseAmount = 3 + level * 2;
        
        ctx.moveTo(x, y - height / 2);

        // Top edge with vibration
        for (let i = 1; i < segments; i++) {
            const noise = Math.sin(time * 40 + i * 0.8 + seed) * noiseAmount;
            ctx.lineTo(x + i * segmentWidth, y - height / 2 + noise);
        }
        
        // Pulsing Rounded Tip
        const tipRadius = Math.max(0.1, height / 2 + Math.sin(time * 30 + seed) * (5 + level * 2));
        const tipX = x + width;
        if (Number.isFinite(tipRadius) && Number.isFinite(tipX) && Number.isFinite(y)) {
            ctx.arc(tipX, y, tipRadius, -Math.PI / 2, Math.PI * 0.5);
        }

        // Bottom edge with vibration
        for (let i = segments - 1; i >= 0; i--) {
            const noise = Math.cos(time * 40 + i * 0.8 + seed) * noiseAmount;
            ctx.lineTo(x + i * segmentWidth, y + height / 2 + noise);
        }
        ctx.closePath();
    }

    private drawEnergyDischargePath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, time: number, seed: number) {
        const segments = 10;
        const segmentWidth = width / segments;
        const yOffset = (seed === 0 ? -1 : 1) * height * 0.6;
        
        ctx.moveTo(x, y + yOffset);

        for (let i = 1; i <= segments; i++) {
            const noise = Math.sin(time * 50 + i) * height * 0.4 + (Math.random() - 0.5) * 10;
            ctx.lineTo(x + i * segmentWidth, y + yOffset + noise);
        }
    }

    emitLightningBolt(x1: number, y1: number, x2: number, y2: number, color: string = '#eab308', level: number = 1) {
        this.lightningBolts.push({
            x1, y1, x2, y2,
            color,
            level,
            life: 1.0,
            maxLife: 1.0,
            speed: 5 + Math.random() * 5,
            segments: this.generateLightningSegments(x1, y1, x2, y2, 8)
        });
    }

    emitErraticRay(x: number, y: number, color: string = '#a855f7') {
        this.erraticRays.push({
            x, y,
            targetX: x,
            targetY: y,
            color,
            life: 2.0,
            maxLife: 2.0,
            history: []
        });
    }

    setStormIntensity(intensity: number) {
        this.stormIntensity = intensity;
    }

    getErraticRayPositions() {
        return this.erraticRays.map(r => ({ x: r.x, y: r.y }));
    }

    private generateLightningSegments(x1: number, y1: number, x2: number, y2: number, depth: number): any[] {
        const segments: any[] = [];
        const generate = (ax: number, ay: number, bx: number, by: number, d: number) => {
            if (d <= 0) {
                segments.push({ x1: ax, y1: ay, x2: bx, y2: by });
                return;
            }
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2;
            const dx = bx - ax;
            const dy = by - ay;
            const mag = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / mag;
            const ny = dx / mag;
            const offset = (Math.random() - 0.5) * mag * 0.4;
            const ox = mx + nx * offset;
            const oy = my + ny * offset;
            generate(ax, ay, ox, oy, d - 1);
            generate(ox, oy, bx, by, d - 1);
            
            // Random branches
            if (Math.random() > 0.8 && d > 2) {
                const bx2 = ox + (Math.random() - 0.5) * mag * 0.5;
                const by2 = oy + (Math.random()) * mag * 0.5;
                generate(ox, oy, bx2, by2, d - 2);
            }
        };
        generate(x1, y1, x2, y2, depth);
        return segments;
    }

    private getAverageColor(equippedIds: string[], dataList: any[]): string {
        const first = dataList.find(d => d.id === equippedIds[0]);
        return first?.color || '#ffffff';
    }

    private drawOrbitingSphere(ctx: CanvasRenderingContext2D, px: number, py: number, index: number, color: string) {
        const radius = 90;
        const angle = this.orbitAngle * (1 + index * 0.2) + (index * Math.PI / 2);
        const sx = px + Math.cos(angle) * radius;
        const sy = py + Math.sin(angle) * radius;
        const sphereSize = 10 * (1 + Math.sin(this.pulseTimer + index) * 0.2);

        ctx.save();
        ctx.fillStyle = color;
        this.drawGlowCircle(ctx, sx, sy, sphereSize * 2.5, color + '55');
        ctx.beginPath();
        ctx.arc(sx, sy, sphereSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, sphereSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    private drawParticles(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        this.particles.forEach(p => {
            const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;

            if (p.type === 'glow') {
                const growth = Math.max(0.1, (1 - alpha) * (p.size > 1 ? p.size : 600));
                ctx.strokeStyle = p.color;
                ctx.lineWidth = Math.max(0, 4 * alpha);
                ctx.beginPath();
                ctx.arc(p.x, p.y, growth, 0, Math.PI * 2);
                ctx.stroke();
                
                // Second thinner ring for depth
                if (p.size > 1) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, Math.max(0.1, growth * 0.8), 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else if (p.type === 'snow') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                // Random snowflake-ish shape (simple cross)
                const s = Math.max(0.1, p.size);
                ctx.rect(p.x - s, p.y - s/4, s*2, s/2);
                ctx.rect(p.x - s/4, p.y - s, s/2, s*2);
                ctx.fill();
            } else if (p.type === 'smoke') {
                 const growth = Math.max(0.1, 1.5 - alpha); // Expands as it lives
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, Math.max(0.1, p.size * growth), 0, Math.PI * 2);
                 ctx.fill();
            } else if (p.type === 'fire') {
                 ctx.globalAlpha = alpha * 0.8;
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, Math.max(0.1, p.size * alpha), 0, Math.PI * 2);
                 ctx.fill();
                 
                 // Small glow
                 this.drawGlowCircle(ctx, p.x, p.y, Math.max(0.1, p.size * 2 * alpha), p.color + '44');
            } else if (p.type === 'distortion') {
                 // Simulated heat wave
                 ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                 ctx.lineWidth = 1;
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, Math.max(0.1, p.size * (1 - alpha)), 0, Math.PI * 2);
                 ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.restore();
    }

    private drawGlowCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

export const visualEffectSystem = new VisualEffectSystem();
