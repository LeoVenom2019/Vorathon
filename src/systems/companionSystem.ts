import { BulletType } from '../core/Bullet';
import { getPlayerState, updatePlayerState } from '../core/Store';
import { visualEffectSystem } from './visualEffectSystem';
import { dialogueSystem } from './dialogueSystem';
import { enemySystem } from './enemySystem';
import { effectsSystem } from './effectsSystem';
import { bossSystem } from './bossSystem';
import { Entity, EntityType } from '../core/Types';

export enum CompanionType {
    SUMMONER = 'summoner',
    SHOOTER = 'shooter',
    SUPPORTER = 'supporter'
}

export enum CompanionState {
    IDLE = 'idle',
    EXECUTING = 'executing',
    COOLDOWN = 'cooldown'
}

interface Singularity {
    x: number;
    y: number;
    radius: number;
    timer: number;
    maxTimer: number;
    vibration: number;
}

interface SpeechBubble {
    text: string;
    timer: number;
    maxTimer: number;
}

export class Companion implements Entity {
    entityType: EntityType = EntityType.BOT;
    companionType: CompanionType;
    x: number = 0;
    y: number = 0;
    width: number = 28;
    height: number = 28;
    targetX: number = 0;
    targetY: number = 0;
    
    private state: CompanionState = CompanionState.IDLE;
    private cooldown: number = 0;
    private maxCooldown: number = 0;
    private executionTimer: number = 0;
    private bubble: SpeechBubble | null = null;
    
    private scale: number = 1.0;
    private targetScale: number = 1.0;
    private rotation: number = 0;
    private pulseIntensity: number = 0;
    
    private color: string;
    private icon: string;

    constructor(type: CompanionType) {
        this.companionType = type;
        this.maxCooldown = type === CompanionType.SUMMONER ? 20 : (type === CompanionType.SUPPORTER ? 25 : 0.5);
        this.cooldown = this.maxCooldown;
        
        switch (type) {
            case CompanionType.SUMMONER:
                this.color = '#a855f7';
                this.icon = '🌀';
                break;
            case CompanionType.SHOOTER:
                this.color = '#ef4444'; // Red
                this.icon = '🔥';
                break;
            case CompanionType.SUPPORTER:
                this.color = '#06b6d4'; // Cyan
                this.icon = '🛡️';
                break;
            default:
                this.color = '#ffffff';
                this.icon = '🤖';
        }
    }

    update(delta: number, playerX: number, playerY: number, playerWidth: number, playerHeight: number, spawnBullet: any) {
        const time = performance.now() / 1000;
        const tree = getPlayerState().skillTree;
        const level = (tree.companions as any)[this.companionType] || 0;
        
        if (level === 0) return;

        // Update Position Targets
        let offsetDx = -60;
        let offsetDy = 0;
        
        if (this.companionType === CompanionType.SUMMONER) {
            offsetDx = -80;
            offsetDy = playerHeight + 40;
        } else if (this.companionType === CompanionType.SHOOTER) {
            offsetDx = -60;
            offsetDy = playerHeight / 2;
        } else if (this.companionType === CompanionType.SUPPORTER) {
            offsetDx = -80;
            offsetDy = -40;
        }

        // Active state logic
        if (this.state === CompanionState.EXECUTING) {
            this.executionTimer -= delta;
            this.targetScale = 1.4;
            this.pulseIntensity = 1.0;
            
            // Move away from ship during execution (only for Summoner and Supporter)
            if (this.companionType !== CompanionType.SHOOTER) {
                offsetDx -= 80; 
            }

            if (this.executionTimer <= 0) {
                this.state = CompanionState.COOLDOWN;
                this.cooldown = this.maxCooldown;
                // Cooldown scaling
                if (this.companionType === CompanionType.SUPPORTER) {
                    const cds = [25, 20, 15];
                    this.cooldown = cds[level - 1] || 25;
                } else if (this.companionType === CompanionType.SUMMONER) {
                    const cds = [28, 21, 17]; // Increased by 40% (20->28, 15->21, 12->17)
                    this.cooldown = cds[level - 1] || 28;
                }
            }
        } else {
            this.targetScale = 1.0;
            this.pulseIntensity = Math.sin(time * 5) * 0.2 + 0.2;
            
            if (this.cooldown > 0) {
                this.cooldown -= delta;
            } else if (level > 0) {
                // Auto trigger logic
                this.triggerAbility(spawnBullet, level);
            }
        }

        this.targetX = playerX + offsetDx;
        this.targetY = playerY + offsetDy;

        // Organic Following
        const lerpFactor = this.state === CompanionState.EXECUTING ? 3 : 5;
        this.x += (this.targetX - this.x) * lerpFactor * delta;
        this.y += (this.targetY - this.y) * lerpFactor * delta;

        // Visual Lerping
        this.scale += (this.targetScale - this.scale) * 5 * delta;
        this.rotation = Math.sin(time * 3) * 0.1;

        // Speech Bubble
        if (this.bubble) {
            this.bubble.timer -= delta;
            if (this.bubble.timer <= 0) this.bubble = null;
        }

        // Trail during movement
        if (Math.random() > 0.7) {
            visualEffectSystem.emitTrailParticles(this.x, this.y, this.color + '66', 1.5);
        }
    }

    private triggerAbility(spawnBullet: any, level: number) {
        this.state = CompanionState.EXECUTING;
        
        switch (this.companionType) {
            case CompanionType.SUMMONER:
                this.executionTimer = 1.5;
                this.say(["Singularidade!", "Horizonte de Eventos!", "Gravidade Infinita!", "Vem pro abismo!"], 2);
                visualEffectSystem.emitExplosion(this.x, this.y, this.color, 120);
                this.executeSummonerBehavior(level);
                break;
                
            case CompanionType.SUPPORTER:
                this.executionTimer = 1.5;
                this.say(["Escudo de Plasma!", "Proteção Galáctica!", "Protocolo de Defesa!", "Inquebrável!"], 2);
                this.executeSupporterBehavior(level);
                break;
                
            case CompanionType.SHOOTER:
                this.executionTimer = 0.1;
                this.executeShooterBehavior(spawnBullet, level);
                if (Math.random() < 0.25) {
                      this.say(["Fogo Consumidor!", "Alvos aniquilados!", "Carga máxima!", "Sem escape!"], 1.5);
                }
                break;
        }
    }

    private executeSummonerBehavior(level: number) {
        const singularityCount = level >= 3 ? 3 : (level >= 2 ? 2 : 1);
        const cw = 1200; // Expected canvas width
        const ch = 800;  // Expected canvas height
        
        for (let i = 0; i < singularityCount; i++) {
            // Spawn in the right half of the screen
            const minX = cw * 0.5;
            const maxX = cw * 0.9;
            const sx = minX + Math.random() * (maxX - minX);
            const sy = Math.random() * ch;
            
            // Check for overlaps with existing singularities
            const tooClose = companionSystem.singularities.some(s => {
                const dx = s.x - sx;
                const dy = s.y - sy;
                return Math.sqrt(dx * dx + dy * dy) < 250;
            });

            if (tooClose && i < 10) { // Retry once if overlap
                i--; continue;
            }

            companionSystem.singularities.push({
                x: sx,
                y: sy,
                radius: 48 + level * 16, // Reduced by 60% (120->48, 40->16)
                timer: 6,
                maxTimer: 6,
                vibration: 0
            });
            
            visualEffectSystem.emitDistortion(sx, sy, 200);
            visualEffectSystem.emitExplosion(sx, sy, '#a855f7', 100);
        }
    }

    private executeSupporterBehavior(level: number) {
        const maxShieldValues = [40, 80, 120];
        const amount = maxShieldValues[level - 1] || 40;
        
        visualEffectSystem.emitLightningBolt(this.x, this.y, this.targetX + 80, this.targetY, this.color, 3);
        
        setTimeout(() => {
            visualEffectSystem.emitExplosion(this.targetX + 80, this.targetY, this.color, 60);
            visualEffectSystem.emitDistortion(this.targetX + 80, this.targetY, 150);
        }, 100);

        (window as any).playerShieldRequest = amount;
    }

    private executeShooterBehavior(spawnBullet: any, level: number) {
        const bx = this.x + 24;
        const by = this.y;
        
        spawnBullet(bx, by, 0, EntityType.BOT, undefined, BulletType.NORMAL, 1.2);
        if (level >= 2) spawnBullet(bx, by, -0.2, EntityType.BOT, undefined, BulletType.NORMAL, 1.0);
        if (level >= 3) spawnBullet(bx, by, 0.2, EntityType.BOT, undefined, BulletType.NORMAL, 1.0);
        
        visualEffectSystem.emitShotParticles(bx, by, this.color);
    }

    private say(choices: string[], duration: number) {
        const text = choices[Math.floor(Math.random() * choices.length)];
        this.bubble = { text, timer: duration, maxTimer: duration };
    }

    draw(ctx: CanvasRenderingContext2D) {
        const tree = getPlayerState().skillTree;
        const level = (tree.companions as any)[this.companionType] || 0;
        if (level === 0) return;

        const time = performance.now() / 1000;
        const idleBob = Math.sin(time * 3 + (this.companionType === CompanionType.SUMMONER ? 1 : 0)) * 5;

        ctx.save();
        ctx.translate(this.x, this.y + idleBob);
        ctx.rotate(this.rotation);
        
        const s = this.scale;
        ctx.scale(s, s);

        // Aura / Glow
        const glowSize = 25 + this.pulseIntensity * 20;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        grad.addColorStop(0, this.color + '55');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-14, -14, 28, 28, 6);
        ctx.fill();
        ctx.stroke();

        // Eye / Core
        ctx.fillStyle = this.color;
        const eyePulse = Math.sin(time * 10) * 1 + 5;
        ctx.beginPath();
        ctx.arc(0, -5, eyePulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner white light
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, -5, eyePulse * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.icon, 0, 12);

        // Cooldown Ring
        if (this.state === CompanionState.COOLDOWN && this.maxCooldown > 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = this.color;
            const progress = (this.cooldown / this.maxCooldown);
            ctx.beginPath();
            ctx.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + (1 - progress) * Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // Draw Speech Bubble
        if (this.bubble) {
            this.drawSpeechBubble(ctx, this.x, this.y + idleBob - 45);
        }
    }

    private drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number) {
        if (!this.bubble) return;
        
        const padding = 12;
        ctx.font = 'bold 16px "Inter", sans-serif'; // Larger font
        const metrics = ctx.measureText(this.bubble.text);
        const w = metrics.width + padding * 2;
        const h = 28;
        
        const lifeFactor = 1 - (this.bubble.timer / this.bubble.maxTimer);
        const scale = lifeFactor < 0.2 ? lifeFactor / 0.2 : (this.bubble.timer < 0.3 ? this.bubble.timer / 0.3 : 1);
        const bounce = Math.sin(lifeFactor * Math.PI * 10) * Math.exp(-lifeFactor * 5) * 8;
        
        ctx.save();
        ctx.translate(x, y - floatUp(this.bubble.timer, this.bubble.maxTimer));
        ctx.scale(scale * 1.4, scale * 1.4); // +40% scale
        
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Tail
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(6, -6);
        ctx.fill();
        
        // Box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h - 6, w, h, 6);
        ctx.fill();
        ctx.stroke();
        
        // Text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.bubble.text, 0, -h / 2 - 6);
        
        ctx.restore();
    }
}

function floatUp(timer: number, max: number) {
    if (timer < 0.4) return (1 - timer/0.4) * 30;
    return 0;
}

export const companionSystem = {
    companions: [] as Companion[],
    singularities: [] as Singularity[],
    
    init() {
        this.companions = [
            new Companion(CompanionType.SHOOTER),
            new Companion(CompanionType.SUMMONER),
            new Companion(CompanionType.SUPPORTER)
        ];
        this.singularities = [];
    },

    update(delta: number, playerX: number, playerY: number, playerWidth: number, playerHeight: number, spawnBullet: any) {
        this.companions.forEach(c => c.update(delta, playerX, playerY, playerWidth, playerHeight, spawnBullet));
        
        // Update Singularities
        for (let i = this.singularities.length - 1; i >= 0; i--) {
            const s = this.singularities[i];
            s.timer -= delta;
            s.vibration = Math.sin(performance.now() * 0.05) * 5;
            
            // Sucking and Damage
            const pullRadius = s.radius * 1.5;
            const pullForce = 400;
            const pullDmg = 800; // Increased damage for singularities
            
            const targets = [...enemySystem.enemies, bossSystem.currentBoss].filter(e => e && (e as any).isActive);
            targets.forEach(e => {
                const dx = s.x - (e.x + e.width / 2);
                const dy = s.y - (e.y + e.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < pullRadius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (1 - dist / pullRadius) * pullForce;
                    
                    // Bosses don't get sucked, only take damage
                    const isBoss = e === bossSystem.currentBoss;
                    if (!isBoss) {
                        e.x += Math.cos(angle) * force * delta;
                        e.y += Math.sin(angle) * force * delta;
                    }
                    
                    e.takeDamage(pullDmg * delta);
                    
                    if (Math.random() > 0.8) {
                        visualEffectSystem.emitEnergySpark(e.x + e.width / 2, e.y + e.height/2, '#a855f7');
                    }
                }
            });

            // Particles
            if (Math.random() > 0.4) {
                const angle = Math.random() * Math.PI * 2;
                const dist = s.radius * (1 + Math.random());
                const px = s.x + Math.cos(angle) * dist;
                const py = s.y + Math.sin(angle) * dist;
                visualEffectSystem.emitTrailParticles(px, py, '#a855f7', 2);
            }

            if (s.timer <= 0) {
                visualEffectSystem.emitExplosion(s.x, s.y, '#a855f7', 80);
                this.singularities.splice(i, 1);
            }
        }
    },

    draw(ctx: CanvasRenderingContext2D) {
        this.companions.forEach(c => c.draw(ctx));
        
        // Draw Singularities
        const time = performance.now() / 1000;
        this.singularities.forEach(s => {
            ctx.save();
            ctx.translate(s.x, s.y);
            
            // Pulsing scale
            const pulse = 1 + Math.sin(time * 15) * 0.05;
            ctx.scale(pulse, pulse);

            // 1. Spacial Distortion Shadow
            const distGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s.radius * 2);
            distGrad.addColorStop(0, 'rgba(0,0,0,0)');
            distGrad.addColorStop(0.5, 'rgba(0,0,0,0.2)');
            distGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = distGrad;
            ctx.beginPath();
            ctx.arc(0, 0, s.radius * 2, 0, Math.PI * 2);
            ctx.fill();

            // 2. Rotating Energy Ring
            ctx.save();
            ctx.rotate(time * 4);
            ctx.strokeStyle = '#6d28d9'; // Dark Purple
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.arc(0, 0, s.radius, 0, Math.PI * 1.5);
            ctx.stroke();
            
            ctx.strokeStyle = '#3b82f6'; // Blue
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, s.radius, Math.PI, Math.PI * 2.5);
            ctx.stroke();
            ctx.restore();

            // 3. Absolute Black Core
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#a855f7';
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(s.vibration/2, s.vibration/2, s.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            // 4. Internal "Instability" light
            ctx.shadowBlur = 0;
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, s.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    },

    getCompanion(type: CompanionType) {
        return this.companions.find(c => c.type === type);
    }
};
