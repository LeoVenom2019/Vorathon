import stagesData from '../data/stages.json';
import areasData from '../data/areas.json';
import { getPlayerState } from '../core/Store';
import { Difficulty } from '../core/Types';
import { difficultySystem } from './difficultySystem';

export interface Stage {
  id: string;
  name: string;
  duration: number;
  enemyPool: string[];
  initialSpawnRate: number;
  maxSpawnRate: number;
  bossId: string;
}

export class StageSystem {
  private allStages: Stage[] = stagesData.stages;
  private areaStages: Stage[] = [];
  private currentStageIndex: number = 0;
  
  public stageTime: number = 120;
  public bossSpawned: boolean = false;
  public stageCompleted: boolean = false;
  public timeLocked: boolean = false;
  public bonusTimeRemaining: number = 0;
  
  // New Progress logic
  public bossProgress: number = 0;
  public get MAX_PROGRESS(): number {
    const diff = difficultySystem.getModifiers();
    return Math.floor(100 * diff.bossBarMultiplier);
  }
  public isWarningBoss: boolean = false;
  public warningTimer: number = 0;
  public lastKillTimer: number = 0;

  get currentStage(): Stage {
    if (this.areaStages.length === 0) return this.allStages[0];
    return this.areaStages[this.currentStageIndex];
  }

  reset() {
    console.log("[StageSystem] Resetting all stage state...");
    const state = getPlayerState();
    const area = areasData.areas.find(a => a.id === state.session.selectedArea);
    
    if (area) {
        // Map area stage IDs to actual stage data
        // For now we reuse the 10 stages if they are not all defined in stages.json
        this.areaStages = area.stages.map(id => {
            const stage = this.allStages.find(s => s.id === id);
            return stage || this.allStages[0];
        });
    } else {
        this.areaStages = this.allStages;
    }

    this.stageTime = 120;
    this.bossSpawned = false;
    this.stageCompleted = false;
    this.timeLocked = false;
    this.bonusTimeRemaining = 0;
    this.currentStageIndex = 0;
    this.bossProgress = 0;
    this.isWarningBoss = false;
    this.warningTimer = 0;
    this.lastKillTimer = 0;
  }

  getCombinedMultiplier(): number {
    return difficultySystem.getModifiers().enemyHealthMultiplier; // Simplified usage
  }

  nextStage() {
      console.log(`[StageSystem] Moving to next stage. Previous: ${this.currentStageIndex}`);
      this.currentStageIndex = (this.currentStageIndex + 1) % this.areaStages.length;
      this.stageTime = 120;
      this.bossSpawned = false;
      this.stageCompleted = false;
      this.timeLocked = false;
      this.bonusTimeRemaining = 0;
      this.bossProgress = 0;
      this.isWarningBoss = false;
      this.warningTimer = 0;
      this.lastKillTimer = 0;
  }

  isLastStageInArea(): boolean {
      return this.currentStageIndex === this.areaStages.length - 1;
  }

  addProgress(enemyType: string) {
    if (this.bossSpawned || this.isWarningBoss) return;
    
    const diff = difficultySystem.getModifiers();
    let points = 1.0; 
    if (enemyType === 'ELITE') points = diff.eliteBarContribution;
    
    this.bossProgress = Math.min(this.MAX_PROGRESS, this.bossProgress + points);
    
    // If progress filled before time, lock it
    if (this.bossProgress >= this.MAX_PROGRESS && !this.timeLocked) {
        this.timeLocked = true;
        this.bonusTimeRemaining = Math.max(0, Math.floor(this.stageTime));
    }

    this.lastKillTimer = 0; // Reset anti-trava
  }

  update(delta: number): { shouldSpawn: boolean, forceSpawnEnemies: boolean } {
    if (this.stageCompleted) return { shouldSpawn: false, forceSpawnEnemies: false };
    
    // Countdown
    if (!this.timeLocked && !this.bossSpawned) {
        this.stageTime = Math.max(0, this.stageTime - delta);
        
        // Time over spawn
        if (this.stageTime <= 0 && !this.isWarningBoss) {
            this.bossProgress = this.MAX_PROGRESS;
            this.isWarningBoss = true;
            this.warningTimer = 1.0;
            this.bonusTimeRemaining = 0;
        }
    }

    this.lastKillTimer += delta;

    // Anti-trava logic: if no kills for 15 seconds, force spawn more enemies
    const forceSpawnEnemies = this.lastKillTimer > 15 && !this.bossSpawned && !this.isWarningBoss;

    // Handle warning sequence
    if (this.bossProgress >= this.MAX_PROGRESS && !this.isWarningBoss && !this.bossSpawned) {
        this.isWarningBoss = true;
        this.warningTimer = 1.0; // 1 second warning
    }

    if (this.isWarningBoss) {
        this.warningTimer -= delta;
        if (this.warningTimer <= 0) {
            this.isWarningBoss = false;
            this.bossSpawned = true;
            return { shouldSpawn: true, forceSpawnEnemies: false };
        }
    }

    return { shouldSpawn: false, forceSpawnEnemies };
  }

  getSpawnRate(): number {
    // Progress-based spawn rate increase
    const progress = Math.min(1, this.bossProgress / this.MAX_PROGRESS);
    return this.currentStage.initialSpawnRate - (this.currentStage.initialSpawnRate - this.currentStage.maxSpawnRate) * progress;
  }

  completeStage() {
      this.stageCompleted = true;
  }
}

export const stageSystem = new StageSystem();
