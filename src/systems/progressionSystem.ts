import { updatePlayerState } from '../core/Store';

export class ProgressionSystem {
  // Classic RPG curve: Base 100, increases by 15% each level
  getNextLevelExp(level: number): number {
    return Math.floor(100 * Math.pow(1.15, level - 1));
  }

  // Calculate XP gain and handle potential multiple level ups
  calculateExp(currentExp: number, gain: number, currentLevel: number) {
    let newExp = currentExp + gain;
    let newLevel = currentLevel;
    let leveledUp = false;
    
    let nextLevelExp = this.getNextLevelExp(newLevel);
    while (newExp >= nextLevelExp && newLevel < 100) {
      newExp -= nextLevelExp;
      newLevel++;
      leveledUp = true;
      nextLevelExp = this.getNextLevelExp(newLevel);
      
      this.applyLevelUpBonuses(newLevel);
    }

    return { 
      newExp, 
      newLevel, 
      leveledUp, 
      nextLevelExp 
    };
  }

  private applyLevelUpBonuses(level: number) {
    updatePlayerState(prev => {
      // +5% Base Damage and +5% Max HP per level
      const damageBonus = 0.5; // Flat +0.5 base damage
      const hpBonus = 10; // Flat +10 max hp
      
      // Every 10 levels = +1 life
      const lifeBonus = level % 10 === 0 ? 1 : 0;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          maxHp: prev.stats.maxHp + hpBonus,
          hp: prev.stats.hp + hpBonus, // Heal by the bonus amount too
          damage: prev.stats.damage + damageBonus
        },
        progression: {
          ...prev.progression,
          skillPoints: prev.progression.skillPoints + 1
        },
        session: {
            ...prev.session,
            lives: prev.session.lives + lifeBonus
        }
      };
    });
  }
}

export const progressionSystem = new ProgressionSystem();
