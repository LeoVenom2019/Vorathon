import { effectSystem } from './effectSystem';
import { statusSystem } from './statusSystem';
import { getPlayerState } from '../core/Store';
import runesData from '../data/runes.json';

export class RuneSystem {
  private availableRunes = (runesData as any).runes;

  getRuneById(id: string) {
    return this.availableRunes.find((r: any) => r.id === id);
  }

  private shotsCount: number = 0;

  // Hook for when a shot is fired
  onShoot(spawnBullet: any, playerPos: any) {
    const mods = effectSystem.getModifiers();
    this.shotsCount++;
    
    mods.onShoot.forEach((fx: any) => {
        if (fx.type === 'CHAIN' && Math.random() < fx.chance) {
            spawnBullet(playerPos.x, playerPos.y, 0.2); 
            spawnBullet(playerPos.x, playerPos.y, -0.2);
        }
        if (fx.type === 'INTERVAL_PROC') {
            if (this.shotsCount % fx.count === 0) {
                spawnBullet(playerPos.x, playerPos.y, 0); // Placeholder for power shot
            }
        }
    });
  }

  // Hook for when an enemy is hit
  onHit(enemy: any, damage: number) {
    const mods = effectSystem.getModifiers();

    mods.onHit.forEach((fx: any) => {
        if (fx.type === 'FREEZE' && enemy.type !== 'BOSS') {
            enemy.freeze(fx.duration);
        }
        if (fx.type === 'BURN') {
            statusSystem.applyStatus(enemy.id, { type: 'BURN', duration: fx.duration, intensity: damage * fx.damageMult });
        }
        if (fx.type === 'KNOCKBACK') {
            enemy.knockbackX = fx.force;
        }
        if (fx.type === 'HEAL' && Math.random() < (fx.chance || 1.0)) {
            const state = getPlayerState();
            updatePlayerState(prev => ({
                ...prev,
                stats: { 
                    ...prev.stats, 
                    hp: Math.min(prev.stats.maxHp, prev.stats.hp + fx.amount * mods.healingMult) 
                }
            }));
        }
    });
  }

  onDeath(enemy: any, spawnExplosion: any) {
    const mods = effectSystem.getModifiers();

    mods.onDeath.forEach((fx: any) => {
        if (fx.type === 'EXPLOSION') {
            if (fx.excludeBoss && enemy.type === 'BOSS') return;
            spawnExplosion(enemy.x, enemy.y, fx.multiplier);
        }
    });
  }
}

export const runeSystem = new RuneSystem();
