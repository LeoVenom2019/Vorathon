import { effectSystem } from './effectSystem';
import { getPlayerState, updatePlayerState } from '../core/Store';
import relicsData from '../data/relics.json';

export class RelicSystem {
  private availableRelics = (relicsData as any).relics;

  getRelicById(id: string) {
    return this.availableRelics.find((r: any) => r.id === id);
  }

  update(delta: number) {
    const state = getPlayerState();
    const mods = effectSystem.getModifiers();
    
    // Process periodic effects from mods
    mods.onInterval.forEach((fx: any) => {
        if (fx.type === 'REGEN') {
            const regen = state.stats.maxHp * fx.amount * delta;
            updatePlayerState(prev => ({
                ...prev,
                stats: { ...prev.stats, hp: Math.min(prev.stats.maxHp, prev.stats.hp + (regen * mods.healingMult)) }
            }));
        }
    });

    if (mods.globalDebuff) {
        // This could be used in Enemy class or here to find and apply once
    }
  }

  onKill(enemy: any) {
      const mods = effectSystem.getModifiers();
      mods.onHit.forEach((fx: any) => {
          // Relic specific kill effects if any in onHit list
      });
  }
}

export const relicSystem = new RelicSystem();
