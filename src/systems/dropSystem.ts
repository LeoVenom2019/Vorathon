import { Entity, EntityType } from '../core/Types';
import { difficultySystem } from './difficultySystem';
import { eventSystem } from './eventSystem';
import { getPlayerState, updatePlayerState } from '../core/Store';
import { effectsSystem } from './effectsSystem';
import { visualEffectSystem } from './visualEffectSystem';
import runesData from '../data/runes.json';
import relicsData from '../data/relics.json';

export enum DropType {
  GOLD = 'GOLD',
  SHARD = 'SHARD',
  ELEMENTAL_EVOLUTION = 'ELEMENTAL_EVOLUTION',
  RUNE = 'RUNE',
  RELIC = 'RELIC',
  LIFE = 'LIFE'
}

export class DropEntity implements Entity {
  entityType: EntityType = EntityType.BOT;
  x: number;
  y: number;
  width: number = 16;
  height: number = 16;
  type: DropType;
  lifeTime: number = 0;
  isMagnetized: boolean = false;
  speed: number = 400;
  scale: number = 0;
  bobOffset: number = 0;
  puClass?: string;
  itemId?: string;

  constructor(x: number, y: number, type: DropType, puClass?: string, itemId?: string) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.puClass = puClass;
    this.itemId = itemId;

    // Increased sizes for visibility and easier collection (2x base size)
    if (this.type === DropType.LIFE || this.type === DropType.RUNE || this.type === DropType.RELIC) {
        this.width = 32;
        this.height = 32;
    }
  }

  update(delta: number, playerPos: { x: number, y: number }) {
    this.lifeTime += delta;
    this.bobOffset = Math.sin(this.lifeTime * 5) * 5;
    
    if (this.scale < 1) this.scale += delta * 4;

    // Magnetizing rules: Gold no longer magnetizes
    if (this.lifeTime > 0.8 && this.type !== DropType.GOLD) {
      this.isMagnetized = true;
    }

    if (this.isMagnetized) {
      const dx = playerPos.x - this.x;
      const dy = playerPos.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        this.x += (dx / dist) * this.speed * delta;
        this.y += (dy / dist) * this.speed * delta;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y + this.bobOffset);
    
    // Scale based on base logical size of 16x16
    const renderScale = this.scale * (this.width / 16);
    ctx.scale(renderScale, renderScale);
    
    let color = this.type === DropType.GOLD ? '#eab308' : '#a855f7';
    
    if (this.type === DropType.SHARD) {
        // High visibility for shards: Pulsing cyan/purple
        const pulse = Math.sin(this.lifeTime * 8) * 0.5 + 0.5;
        const color1 = '#a855f7'; // Purple
        const color2 = '#0ea5e9'; // Blue
        color = pulse > 0.5 ? color1 : color2;
        
        ctx.shadowBlur = 15 + pulse * 15;
        ctx.shadowColor = color;
        ctx.scale(1.3, 1.3); 
    }

    if (this.type === DropType.ELEMENTAL_EVOLUTION) {
        if (this.puClass === 'FIRE') color = '#f97316';
        if (this.puClass === 'ICE') color = '#38bdf8';
        if (this.puClass === 'ELECTRIC') color = '#eab308';
    } else if (this.type === DropType.RUNE) {
        color = '#3b82f6';
    } else if (this.type === DropType.RELIC) {
        color = '#10b981';
    } else if (this.type === DropType.LIFE) {
        color = '#ef4444';
    }

    // Drawing the transparent bubble for specific types
    if (this.type === DropType.LIFE || this.type === DropType.RUNE || this.type === DropType.RELIC) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Bubble is slightly larger than the icon area (scaled)
        ctx.arc(8, 8, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Add a small highlight to the bubble
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(5, 5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.fillStyle = color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;

    // Heart pulsing for Life Drop
    if (this.type === DropType.LIFE) {
        const pulse = 1 + Math.sin(this.lifeTime * 8) * 0.15;
        ctx.scale(pulse, pulse);
        // Center offset adjustment for scale
        ctx.translate(8 * (1 - pulse) / pulse, 8 * (1 - pulse) / pulse);
    }
    
    ctx.beginPath();
    // Only draw the circular background if it's NOT a bubbled item (Gold/Shards/Evolution)
    if (this.type !== DropType.LIFE && this.type !== DropType.RUNE && this.type !== DropType.RELIC) {
        ctx.arc(this.width/2, this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (this.type === DropType.ELEMENTAL_EVOLUTION) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        if (this.puClass === 'FIRE') {
            ctx.moveTo(8, 4); ctx.quadraticCurveTo(12, 8, 8, 12); ctx.quadraticCurveTo(4, 8, 8, 4);
        } else if (this.puClass === 'ICE') {
            ctx.moveTo(8, 4); ctx.lineTo(11, 8); ctx.lineTo(8, 12); ctx.lineTo(5, 8); ctx.closePath();
        } else if (this.puClass === 'ELECTRIC') {
            ctx.moveTo(10, 4); ctx.lineTo(6, 8); ctx.lineTo(10, 8); ctx.lineTo(6, 12);
        }
        ctx.stroke();
    } else if (this.type === DropType.RUNE || this.type === DropType.RELIC) {
        // Rune/Relic icon (representing the item icon)
        ctx.fillStyle = color;
        ctx.moveTo(8, 4); ctx.lineTo(12, 8); ctx.lineTo(8, 12); ctx.lineTo(4, 8); ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (this.type === DropType.LIFE) {
        // Heart shape
        ctx.fillStyle = color;
        ctx.moveTo(8, 13);
        ctx.bezierCurveTo(8, 13, 3, 10, 3, 6.5);
        ctx.bezierCurveTo(3, 4, 5.5, 4, 8, 6.5);
        ctx.bezierCurveTo(10.5, 4, 13, 4, 13, 6.5);
        ctx.bezierCurveTo(13, 10, 8, 13, 8, 13);
        ctx.fill();
        ctx.stroke();
    }
    
    ctx.restore();
  }
}

export class DropSystem {
  drops: DropEntity[] = [];
  private phaseLifeDrops: number = 0;
  private lastPhase: number = 1;
  
  // Grouping for gold
  private pendingGold: number = 0;
  private goldGroupTimer: number = 0;
  private lastGroupPosition: { x: number, y: number } | null = null;

  reset() {
      this.drops = [];
      this.phaseLifeDrops = 0;
  }

  rollDrop(x: number, y: number, chance: number, isElite: boolean = false, isBoss: boolean = false) {
    const diff = difficultySystem.getModifiers();
    const scaledChance = chance * diff.dropChanceMultiplier;
    
    if (Math.random() * 100 < scaledChance) {
      this.drops.push(new DropEntity(x, y, DropType.GOLD));
    }

    // Life Drop (New Rules)
    // Only Elites can drop, Max 2 per phase
    if (isElite && this.phaseLifeDrops < 2) {
        const playerState = getPlayerState();
        const playerHpPercent = (playerState.stats.hp / playerState.stats.maxHp) * 100;

        let rollLife = false;
        if (this.phaseLifeDrops === 0) {
            // First drop: 80% chance
            if (Math.random() < 0.8) rollLife = true;
        } else if (this.phaseLifeDrops === 1) {
            // Second drop: 5% chance, only if HP < 40%
            if (playerHpPercent < 40 && Math.random() < 0.05) rollLife = true;
        }

        if (rollLife) {
            this.drops.push(new DropEntity(x, y, DropType.LIFE));
            this.phaseLifeDrops++;
        }
    }

    // Celestial Drops (Runes/Relics)
    let celestialChance = 1; // 1% default
    if (isElite) celestialChance = 5;
    if (isBoss) celestialChance = 10;

    // Event Horde Rewards: Common 5%, Elite 15%
    if (eventSystem.isHordeActive()) {
        if (isElite) {
            celestialChance = 15;
        } else {
            celestialChance = 5;
        }
    }

    if (Math.random() * 100 < celestialChance) {
        this.spawnRandomCelestial(x, y);
    }
  }

  spawnRandomCelestial(x: number, y: number) {
    const isRune = Math.random() > 0.5;
    if (isRune) {
        const runes = (runesData as any).runes;
        const rune = runes[Math.floor(Math.random() * runes.length)];
        this.drops.push(new DropEntity(x, y, DropType.RUNE, undefined, rune.id));
    } else {
        const relics = (relicsData as any).relics;
        const relic = relics[Math.floor(Math.random() * relics.length)];
        this.drops.push(new DropEntity(x, y, DropType.RELIC, undefined, relic.id));
    }
  }

  spawnShard(x: number, y: number) {
    this.drops.push(new DropEntity(x, y, DropType.SHARD));
  }

  spawnElementalEvolution(x: number, y: number, puClass: string) {
    this.drops.push(new DropEntity(x, y, DropType.ELEMENTAL_EVOLUTION, puClass));
  }

  update(delta: number, playerPos: { x: number, y: number }) {
    const playerState = getPlayerState();
    const diffMods = difficultySystem.getModifiers();
    
    // Reset life drops on phase change
    if (playerState.session.phase !== this.lastPhase) {
        this.phaseLifeDrops = 0;
        this.lastPhase = playerState.session.phase;
    }

    // Update and check for gold puffing
    const itemsToRemove: number[] = [];
    this.drops.forEach((d, idx) => {
        d.update(delta, playerPos);
        
        // Gold auto-collection after 1 second
        if (d.type === DropType.GOLD && d.lifeTime >= 1.0) {
            this.pendingGold += Math.floor(50 * diffMods.goldMultiplier);
            this.lastGroupPosition = { x: d.x, y: d.y };
            
            // Visual "puff" effect
            effectsSystem.addExplosion(d.x + d.width/2, d.y + d.height/2, '#eab308', 5);
            
            itemsToRemove.push(idx);
        }
    });

    // Remove puffed items (reverse order)
    for (let i = itemsToRemove.length - 1; i >= 0; i--) {
        this.drops.splice(itemsToRemove[i], 1);
    }

    // Handle gold grouping for floating text
    if (this.pendingGold > 0) {
        this.goldGroupTimer += delta;
        if (this.goldGroupTimer >= 0.15) {
            const finalGold = this.pendingGold;
            const pos = this.lastGroupPosition || playerPos;
            
            // Add floating text
            effectsSystem.addFloatingText(pos.x, pos.y - 20, `+$${finalGold}`, '#eab308');
            
            // Update store
            updatePlayerState(prev => ({
                ...prev,
                currency: {
                    ...prev.currency,
                    gold: prev.currency.gold + finalGold
                },
                session: {
                    ...prev.session,
                    goldGained: prev.session.goldGained + finalGold
                }
            }));

            this.pendingGold = 0;
            this.goldGroupTimer = 0;
        }
    }
    
    // Check for pending event reward
    if (eventSystem.pendingFinalReward) {
        eventSystem.pendingFinalReward = false;
        this.spawnRandomCelestial(playerPos.x, playerPos.y);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drops.forEach(d => d.draw(ctx));
  }
}

export const dropSystem = new DropSystem();
