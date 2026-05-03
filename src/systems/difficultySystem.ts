import { getPlayerState } from '../core/Store';
import { Difficulty } from '../core/Types';
import areasData from '../data/areas.json';

export interface DifficultyModifiers {
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  spawnRateMultiplier: number;
  eliteChanceAdd: number;
  bossHealthMultiplier: number;
  goldMultiplier: number;
  xpMultiplier: number;
  dropChanceMultiplier: number;
  shardChanceAdd: number; 
  shardsMultiplier: number;
  hasSmartEnemies: boolean;
  hasProjectileTracking: boolean;
  // Dynamic progression modifiers
  eliteHealthMultiplier: number;
  bossBarMultiplier: number;
  eliteBarContribution: number;
}

export class DifficultySystem {
  // GROWTH per phase within an area (stacks with base difficulty)
  private readonly HP_GROWTH = 0.15;       
  private readonly DMG_GROWTH = 0.10;      
  private readonly SPEED_GROWTH = 0.02;    
  private readonly SPAWN_GROWTH = 0.05;    
  private readonly GOLD_GROWTH = 0.12;     
  private readonly XP_GROWTH = 0.08;       

  getModifiers(): DifficultyModifiers {
    const state = getPlayerState();
    const phase = state.session.phase;
    const diff = state.session.selectedDifficulty as Difficulty;
    const areaId = state.session.selectedArea;
    
    // Area scaling from areas.json
    const area = (areasData as any).areas.find((a: any) => a.id === areaId) || (areasData as any).areas[0];
    const areaMods = area.modifiers || {
        enemyHp: 1.0,
        enemyDmg: 1.0,
        eliteChance: 0,
        bossHp: 1.0,
        gold: 1.0,
        xp: 1.0,
        shards: 1.0
    };

    const levelIndex = phase - 1; 

    // Base Modifiers by Difficulty
    let base: DifficultyModifiers = {
      enemyHealthMultiplier: 1.0,
      enemyDamageMultiplier: 1.0,
      enemySpeedMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      eliteChanceAdd: 0,
      bossHealthMultiplier: 1.0,
      goldMultiplier: 1.0,
      xpMultiplier: 1.0,
      dropChanceMultiplier: 1.0,
      shardChanceAdd: 0,
      shardsMultiplier: 1.0,
      hasSmartEnemies: false,
      hasProjectileTracking: false,
      // Elite & Boss Bar specific multipliers
      eliteHealthMultiplier: 1.0,
      bossBarMultiplier: 1.0,
      eliteBarContribution: 5.0
    };

    switch (diff) {
      case Difficulty.NORMAL:
        // Already initialized with defaults, but we can override if needed
        base = {
            ...base,
            enemyHealthMultiplier: 1.0,
            enemyDamageMultiplier: 1.0,
            eliteBarContribution: 6.0 // Slightly easier progression in Normal
        };
        break;
      case Difficulty.HARD:
        base = {
          ...base,
          enemyHealthMultiplier: 1.7,
          enemyDamageMultiplier: 1.55,
          enemySpeedMultiplier: 1.15,
          spawnRateMultiplier: 1.3,
          eliteChanceAdd: 0.25,
          bossHealthMultiplier: 1.9,
          goldMultiplier: 1.45,
          xpMultiplier: 1.1,
          dropChanceMultiplier: 1.1,
          shardChanceAdd: 0.35,
          shardsMultiplier: 1.1,
          eliteHealthMultiplier: 1.25,
          bossBarMultiplier: 1.75,
          eliteBarContribution: 4.0
        };
        break;
      case Difficulty.NIGHTMARE:
        base = {
          ...base,
          enemyHealthMultiplier: 2.2,
          enemyDamageMultiplier: 2.0,
          enemySpeedMultiplier: 1.25,
          spawnRateMultiplier: 1.4,
          eliteChanceAdd: 0.25,
          bossHealthMultiplier: 2.5,
          goldMultiplier: 1.7,
          xpMultiplier: 1.25,
          dropChanceMultiplier: 1.2,
          shardChanceAdd: 0.5,
          shardsMultiplier: 1.25,
          hasSmartEnemies: true,
          hasProjectileTracking: true,
          eliteHealthMultiplier: 1.75,
          bossBarMultiplier: 2.10,
          eliteBarContribution: 3.0
        };
        break;
      case Difficulty.APOCALYPSE:
        base = {
          ...base,
          enemyHealthMultiplier: 2.7,
          enemyDamageMultiplier: 2.2,
          enemySpeedMultiplier: 1.5,
          spawnRateMultiplier: 1.8,
          eliteChanceAdd: 0.8,
          bossHealthMultiplier: 3.5,
          goldMultiplier: 2.0,
          xpMultiplier: 1.4,
          dropChanceMultiplier: 1.35,
          shardChanceAdd: 1.0,
          shardsMultiplier: 1.5,
          hasSmartEnemies: true,
          hasProjectileTracking: true,
          eliteHealthMultiplier: 2.20,
          bossBarMultiplier: 2.40,
          eliteBarContribution: 2.5
        };
        break;
      case Difficulty.INFERNO:
        base = {
          ...base,
          enemyHealthMultiplier: 4.0,
          enemyDamageMultiplier: 4.0,
          enemySpeedMultiplier: 1.8,
          spawnRateMultiplier: 2.0,
          eliteChanceAdd: 1.0,
          bossHealthMultiplier: 6.5,
          goldMultiplier: 2.5,
          xpMultiplier: 1.6,
          dropChanceMultiplier: 1.35,
          shardChanceAdd: 1.2,
          shardsMultiplier: 2.0,
          hasSmartEnemies: true,
          hasProjectileTracking: true,
          eliteHealthMultiplier: 2.75,
          bossBarMultiplier: 2.80,
          eliteBarContribution: 2.0
        };
        break;
      case Difficulty.CHAOS:
        base = {
          ...base,
          enemyHealthMultiplier: 9.0,
          enemyDamageMultiplier: 9.0,
          enemySpeedMultiplier: 1.9,
          spawnRateMultiplier: 2.2,
          eliteChanceAdd: 1.0,
          bossHealthMultiplier: 10.5,
          goldMultiplier: 2.7,
          xpMultiplier: 2.2,
          dropChanceMultiplier: 1.35,
          shardChanceAdd: 1.2,
          shardsMultiplier: 3.0,
          hasSmartEnemies: true,
          hasProjectileTracking: true,
          eliteHealthMultiplier: 3.50,
          bossBarMultiplier: 3.50,
          eliteBarContribution: 1.5
        };
        break;
    }

    // Apply Area and Phase Growth
    return {
      enemyHealthMultiplier: base.enemyHealthMultiplier * areaMods.enemyHp * (1 + (levelIndex * this.HP_GROWTH)),
      enemyDamageMultiplier: base.enemyDamageMultiplier * areaMods.enemyDmg * (1 + (levelIndex * this.DMG_GROWTH)),
      enemySpeedMultiplier: base.enemySpeedMultiplier * (1 + (levelIndex * this.SPEED_GROWTH)),
      spawnRateMultiplier: base.spawnRateMultiplier * (1 + (levelIndex * this.SPAWN_GROWTH)),
      eliteChanceAdd: base.eliteChanceAdd + areaMods.eliteChance + (levelIndex * 0.05),
      bossHealthMultiplier: base.bossHealthMultiplier * areaMods.bossHp,
      goldMultiplier: base.goldMultiplier * areaMods.gold * (1 + (levelIndex * this.GOLD_GROWTH)),
      xpMultiplier: base.xpMultiplier * areaMods.xp * (1 + (levelIndex * this.XP_GROWTH)),
      shardsMultiplier: base.shardsMultiplier * areaMods.shards,
      dropChanceMultiplier: base.dropChanceMultiplier,
      shardChanceAdd: base.shardChanceAdd,
      hasSmartEnemies: base.hasSmartEnemies,
      hasProjectileTracking: base.hasProjectileTracking,
      eliteHealthMultiplier: base.eliteHealthMultiplier, // AREA DOES NOT INFLUENCE THIS
      bossBarMultiplier: base.bossBarMultiplier,        // AREA DOES NOT INFLUENCE THIS
      eliteBarContribution: base.eliteBarContribution   // AREA DOES NOT INFLUENCE THIS
    };
  }

  // Helper to calculate total value
  applyMultiplier(baseValue: number, multiplier: number): number {
    return baseValue * multiplier;
  }

  getCurrentDifficulty(): Difficulty {
    return getPlayerState().session.selectedDifficulty as Difficulty;
  }
}

export const difficultySystem = new DifficultySystem();
