import { Player } from './Player';
import { Bullet } from './Bullet';
import { enemySystem } from '../systems/enemySystem';
import { combatSystem } from '../systems/combatSystem';
import { dropSystem } from '../systems/dropSystem';
import { progressionSystem } from '../systems/progressionSystem';
import { effectsSystem } from '../systems/effectsSystem';
import { stageSystem } from '../systems/stageSystem';
import { bossSystem } from '../systems/bossSystem';
import { statusSystem } from '../systems/statusSystem';
import { runeSystem } from '../systems/runeSystem';
import { relicSystem } from '../systems/relicSystem';
import { effectSystem } from '../systems/effectSystem';
import { visualEffectSystem } from '../systems/visualEffectSystem';
import { backgroundSystem } from '../systems/backgroundSystem';
import { eventSystem } from '../systems/eventSystem';
import { overloadSystem } from '../systems/overloadSystem';
import { modeSystem } from '../systems/modeSystem';
import { powerUpSystem } from '../systems/powerUpSystem';
import { difficultySystem } from '../systems/difficultySystem';
import { dialogueSystem } from '../systems/dialogueSystem';
import { gameOverSystem, GameOverStep } from '../systems/gameOverSystem';
import { updatePlayerState, getPlayerState, triggerFeedback, evolvePowerUp, addScore, handlePlayerDeath, resetSession, addRune, addRelic, addLife, addRankingEntry, setPaused, updatePhaseTimeRemaining } from './Store';
import { inputManager } from './InputManager';
import { GameState } from './GameState';
import { ScrollDirection, PowerUpClass, EntityType } from './Types';
import { BulletType } from './Bullet';
import { DropType } from '../systems/dropSystem';

export class Engine {
  private lastTime: number = 0;
  private running: boolean = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private player: Player | null = null;
  private bullets: Bullet[] = [];
  private setGameState?: (state: GameState) => void;
  
  // Background & Camera
  private bgTime: number = 0;
  private camOffset = { x: 0, y: 0 };
  private shakeAmount: number = 0;
  private shakeTimer: number = 0;
  private shotsCounter: number = 0;

  constructor(ctx: CanvasRenderingContext2D, setGameState?: (state: GameState) => void) {
    this.ctx = ctx;
    this.setGameState = setGameState;
  }

  start(player: Player) {
    this.player = player;
    this.running = true;
    this.lastTime = performance.now();
    this.shotsCounter = 0;
    gameOverSystem.reset();
    eventSystem.reset();
    bossSystem.reset();
    
    // Sync mode system with store
    const state = getPlayerState();
    modeSystem.setMode(state.currentGameMode);
    
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.running = false;
  }

  private loop(now: number) {
    if (!this.running || !this.ctx) return;

    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Apply GameOver Time Scaling
    const delta = rawDelta * gameOverSystem.timeScale;

    // Pause handling
    if(inputManager.isKeyDown('KeyP') && gameOverSystem.step === GameOverStep.NONE) {
        this.setGameState?.(GameState.PAUSED);
        setPaused(true);
        this.lastTime = performance.now(); // reset timer to avoid huge delta on resume
    }

    if (getPlayerState().isPaused) {
        this.lastTime = performance.now();
        this.draw(); // Still draw the frame
        requestAnimationFrame(this.loop.bind(this));
        return;
    }

    this.update(delta, rawDelta);
    this.draw();

    if (gameOverSystem.showMenu) {
        this.setGameState?.(GameState.GAME_OVER);
        this.stop();
        return;
    }

    requestAnimationFrame(this.loop.bind(this));
  }

  private spawnBullet = (x: number, y: number, angle: number, ownerType: EntityType, color?: string, type: BulletType = BulletType.NORMAL, extraDmgMult: number = 1, isPrimary: boolean = true) => {
    const isEnemy = ownerType === EntityType.ENEMY || ownerType === EntityType.BOSS;
    const pu = powerUpSystem.getEffect(ownerType);
    const finalColor = color || (!isEnemy ? pu.bulletColor : undefined);

    if (!isEnemy) {
        const mods = effectSystem.getModifiers(ownerType);
        
        // Count shots only if it's the player and primary shot
        if (ownerType === EntityType.PLAYER && isPrimary) {
            this.shotsCounter++;
        }
        
        const sizeMult = mods.weaponSizeMult || 1;
        
        // Multi-shot logic - only for primary shots
        const spread = 0.1;
        const count = isPrimary ? pu.shotCount : 1;
        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spread;
            const b = new Bullet(x, y, angle + offset, ownerType, finalColor, type);
            b.width *= sizeMult;
            b.height *= sizeMult;
            b.damageMult = extraDmgMult;
            this.bullets.push(b);
        }

        // Special Level 4 effect - only for Player and primary shot
        if (ownerType === EntityType.PLAYER && isPrimary && this.shotsCounter >= 5) {
            this.shotsCounter = 0;
            if (pu.specialEffect) {
                let sType = BulletType.NORMAL;
                if (pu.specialEffect === 'MISSILE') sType = BulletType.MISSILE;
                if (pu.specialEffect === 'PLASMA') sType = BulletType.PLASMA;
                if (pu.specialEffect === 'ARC') sType = BulletType.ARC;

                const specialBullet = new Bullet(x, y, angle, EntityType.PLAYER, finalColor, sType, 3);
                specialBullet.width *= sizeMult;
                specialBullet.height *= sizeMult;
                
                // Target selection for missile
                if (sType === BulletType.MISSILE) {
                    const target = bossSystem.currentBoss || enemySystem.enemies[0] || null;
                    if (target) specialBullet.setTarget(target);
                }
                
                this.bullets.push(specialBullet);
            }
        }

        visualEffectSystem.emitShotParticles(x, y, finalColor || '#3b82f6');

        // Rune system is definitely player-only
        if (ownerType === EntityType.PLAYER && isPrimary) {
            runeSystem.onShoot((bx: number, by: number, ba: number) => {
                this.bullets.push(new Bullet(bx, by, ba, EntityType.PLAYER, finalColor));
                visualEffectSystem.emitShotParticles(bx, by, finalColor || '#3b82f6');
            }, { x, y });
        }
    } else {
        this.bullets.push(new Bullet(x, y, angle, ownerType, color, type, extraDmgMult));
    }
  };

  private update(delta: number, rawDelta: number) {
    if (!this.player) return;

    // Update GameOver sequence
    gameOverSystem.update(rawDelta, this.player.x, this.player.y);
    if (gameOverSystem.step >= GameOverStep.FREEZE_STAY) return; // Full freeze

    this.bgTime += delta;
    this.player.update(delta, this.spawnBullet);

    const mods = effectSystem.getModifiers();
    const state = getPlayerState();

    // Camera follow player subtly
    const targetCamX = -inputManager.axisX * 20;
    const targetCamY = -inputManager.axisY * 20;
    this.camOffset.x += (targetCamX - this.camOffset.x) * 5 * delta;
    this.camOffset.y += (targetCamY - this.camOffset.y) * 5 * delta;

    // Shake logic - Strict 1s duration
    if (state.feedback.shake > 0) {
        this.shakeTimer = 1.0; 
        this.shakeAmount = state.feedback.shake;
        // Clear signal in store immediately
        updatePlayerState(prev => ({ ...prev, feedback: { ...prev.feedback, shake: 0 } }));
    }

    if (this.shakeTimer > 0) {
        this.shakeTimer -= rawDelta;
        if (this.shakeTimer <= 0) {
            this.shakeTimer = 0;
            this.shakeAmount = 0;
        }
    }

    // --- STAGE PROGRESSION ---
    const { shouldSpawn: shouldSpawnBoss, forceSpawnEnemies } = stageSystem.update(delta);
    
    if (stageSystem.isWarningBoss) {
        // Warning feedback
        if (Math.random() > 0.8) triggerFeedback('shake', 5);
        if (Math.random() > 0.9) triggerFeedback('flash', 0.1);
    }

    if (shouldSpawnBoss) {
        bossSystem.spawnBoss(this.ctx!.canvas.width, this.ctx!.canvas.height, stageSystem.currentStage.bossId, stageSystem.bonusTimeRemaining);
        triggerFeedback('shake', 40);
        triggerFeedback('flash', 0.5);
    }

    if (bossSystem.bossDefeated && !stageSystem.stageCompleted) {
        stageSystem.completeStage();
        // Update store with time remaining for results screen
        const finalBonusTime = stageSystem.timeLocked ? stageSystem.bonusTimeRemaining : 0;
        updatePhaseTimeRemaining(finalBonusTime);

        // Clear all bullets and enemies for clean transition
        this.bullets = [];
        enemySystem.enemies = [];
        setTimeout(() => this.setGameState?.(GameState.STAGE_RESULTS), 1500);
    }

    // Sync Max Stats from Skill Tree / Modifiers
    const baseMaxHp = 100; // Hardcoded base or from player.json
    const baseMaxEnergy = 100;
    const targetMaxHp = baseMaxHp + mods.maxHpAdd;
    const targetMaxEnergy = baseMaxEnergy + mods.maxEnergyAdd;

    if (state.stats.maxHp !== targetMaxHp || state.stats.maxEnergy !== targetMaxEnergy) {
        updatePlayerState(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                maxHp: targetMaxHp,
                maxEnergy: targetMaxEnergy
            }
        }));
    }

    // Update Projectiles
    const mode = modeSystem.getCurrentMode();
    const playerRenderPos = { x: this.player.x + this.player.width/2, y: this.player.y + this.player.height/2 };
    this.bullets.forEach(b => b.update(delta, playerRenderPos));
    
    if (mode.direction === ScrollDirection.HORIZONTAL) {
        this.bullets = this.bullets.filter(b => b.x > -150 && b.x < this.ctx!.canvas.width + 150 && b.active);
    } else {
        this.bullets = this.bullets.filter(b => b.y > -150 && b.y < this.ctx!.canvas.height + 150 && b.active);
    }

    visualEffectSystem.update(delta);

    // Update Entities via Systems
    // If boss is active OR warning is active, reduce common enemy spawns significantly
    let spawnRateModifier = (bossSystem.currentBoss || stageSystem.isWarningBoss) ? 0 : 1;
    if (forceSpawnEnemies) spawnRateModifier = 3; // Force more enemies if stuck

    enemySystem.update(delta * spawnRateModifier, this.ctx!.canvas.width, this.ctx!.canvas.height, { x: this.player.x, y: this.player.y }, this.spawnBullet);
    
    // Process Status Effects on Enemies
    statusSystem.update(delta, enemySystem.enemies, (id, dmg) => {
        const enemy = enemySystem.enemies.find(e => e.id === id);
        if (enemy) {
            enemy.takeDamage(dmg);
            if (Math.random() < 0.1) effectsSystem.addFloatingText(enemy.x, enemy.y, "🔥", '#f97316');
        }
    });

    // Random Dialogues
    if (Math.random() < 0.005) {
        const sources: Array<'player' | 'summoner' | 'shooter' | 'supporter'> = ['player'];
        if (state.skillTree.companions.summoner > 0) sources.push('summoner');
        if (state.skillTree.companions.shooter > 0) sources.push('shooter');
        if (state.skillTree.companions.supporter > 0) sources.push('supporter');
        
        const randomSource = sources[Math.floor(Math.random() * sources.length)];
        dialogueSystem.trigger(randomSource);
    }

    dialogueSystem.update(delta, {
        player: { x: this.player.x + this.player.width/2, y: this.player.y + this.player.height/2 },
        summoner: { x: this.player.x - 60, y: this.player.y + this.player.height/2 },
        shooter: { x: this.player.x - 50, y: this.player.y - 30 },
        supporter: { x: this.player.x - 50, y: this.player.y + this.player.height + 30 }
    });

    bossSystem.update(delta, this.ctx!.canvas.width, this.ctx!.canvas.height, { x: this.player.x, y: this.player.y }, this.spawnBullet);
    eventSystem.update(delta);
    dropSystem.update(delta, { x: this.player.x, y: this.player.y });
    relicSystem.update(delta);
    overloadSystem.update();
    effectsSystem.update(delta);

    // --- COLLISION LOGIC ---

    // 1. Player/Bot Bullets -> Enemies/Boss
    this.bullets.filter(b => !b.isEnemyBullet).forEach(b => {
      // Check Enemies
      enemySystem.enemies.forEach(e => {
        if (!e.isActive) return;
        if (combatSystem.checkCollision(b, e)) {
          const ownerType = (b as any).ownerType || EntityType.PLAYER;
          const bMods = effectSystem.getModifiers(ownerType);
          const bPuEff = powerUpSystem.getEffect(ownerType);

          let damageMult = bMods.damageMult * bPuEff.damageMult * b.damageMult;
          
          // Low HP Boost - PLAYER ONLY
          if (ownerType === EntityType.PLAYER) {
            const lowHpFX = bMods.onInterval.find((f: any) => f.type === 'LOW_HP_BOOST');
            if (lowHpFX) {
                const missingHpPerc = 1 - (state.stats.hp / state.stats.maxHp);
                damageMult *= (1 + missingHpPerc * lowHpFX.mult);
            }
          }

          const baseDmg = (state.stats.damage + bMods.bonusDamage) * damageMult;
          const critChance = state.stats.critChance + bMods.critChanceAdd;
          const dmg = combatSystem.calculateDamage(baseDmg, critChance, state.stats.critDamage);
          
          e.takeDamage(dmg.amount);
          visualEffectSystem.emitHitEffect(e.x + e.width/2, e.y + e.height/2, e.type === 'ELITE' ? '#fbbf24' : '#ef4444');
          visualEffectSystem.emitShotParticles(e.x + e.width/2, e.y + e.height/2, '#ffffff'); // Impact sparks
          
          // Execution check
          if (e.hp / e.maxHp < bMods.executionThreshold) {
              e.hp = 0;
              effectsSystem.addFloatingText(e.x, e.y, "EXECUTED", '#ef4444', true);
          }

          if (!bMods.piercing) b.active = false;
          effectsSystem.addFloatingText(e.x, e.y, dmg.amount.toString(), dmg.isCrit ? '#fbbf24' : '#ffffff', dmg.isCrit);
          
          // PowerUp visual hit feedback
          if (state.activePowerUp.class === PowerUpClass.FIRE) visualEffectSystem.emitHitEffect(e.x, e.y, '#f97316');
          if (state.activePowerUp.class === PowerUpClass.ICE) visualEffectSystem.emitHitEffect(e.x, e.y, '#38bdf8');
          if (state.activePowerUp.class === PowerUpClass.ELECTRIC) visualEffectSystem.emitHitEffect(e.x, e.y, '#eab308');

          // Rune hit effect - PLAYER ONLY
          if (ownerType === EntityType.PLAYER) {
            runeSystem.onHit(e, dmg.amount);
          }

          // Additional systems based on mods
          bMods.onHit.forEach((fx: any) => {
              if (fx.type === 'HEAL' && Math.random() < fx.chance && ownerType === EntityType.PLAYER) {
                  updatePlayerState(prev => ({
                      ...prev,
                      stats: { ...prev.stats, hp: Math.min(prev.stats.maxHp, prev.stats.hp + fx.amount * bMods.healingMult) }
                  }));
              }
              if (fx.type === 'SPLASH') {
                  enemySystem.enemies.forEach(nearby => {
                      if (nearby.id === e.id) return;
                      const dist = Math.sqrt((nearby.x - e.x)**2 + (nearby.y - e.y)**2);
                      if (dist < fx.radius) {
                          nearby.takeDamage(dmg.amount * fx.mult);
                      }
                  });
              }
          });

          if (e.hp <= 0) {
            this.handleEnemyDeath(e, ownerType);
          }
        }
      });

      // Check Boss
      const bBoss = bossSystem.currentBoss;
      if (bBoss && bBoss.isActive && combatSystem.checkCollision(b, bBoss)) {
          const bOwnerType = (b as any).ownerType || EntityType.PLAYER;
          const bBMods = effectSystem.getModifiers(bOwnerType);
          const bBPuEff = powerUpSystem.getEffect(bOwnerType);
          
          let bDamageMult = bBMods.damageMult * bBPuEff.damageMult * b.damageMult;
          
          // Low HP Boost - PLAYER ONLY
          if (bOwnerType === EntityType.PLAYER) {
            const bLowHpFX = bBMods.onInterval.find((f: any) => f.type === 'LOW_HP_BOOST');
            if (bLowHpFX) {
                const bMissingHpPerc = 1 - (state.stats.hp / state.stats.maxHp);
                bDamageMult *= (1 + bMissingHpPerc * bLowHpFX.mult);
            }
          }

          const bBaseDmg = (state.stats.damage + bBMods.bonusDamage) * bDamageMult;
          const bCritChance = state.stats.critChance + bBMods.critChanceAdd;
          const bDmg = combatSystem.calculateDamage(bBaseDmg, bCritChance, state.stats.critDamage);
          
          bBoss.takeDamage(bDmg.amount);
          visualEffectSystem.emitHitEffect(b.x, b.y, '#f59e0b');
          if (!bBMods.piercing) b.active = false;
          
          effectsSystem.addFloatingText(bBoss.x, bBoss.y, bDmg.amount.toString(), bDmg.isCrit ? '#fbbf24' : '#ffffff', bDmg.isCrit);
          
          // Rune hit effect - PLAYER ONLY
          if (bOwnerType === EntityType.PLAYER) {
            runeSystem.onHit(bBoss, bDmg.amount);
          }

          if (bBoss.hp <= 0) {
              this.handleEnemyDeath(bBoss as any, bOwnerType);
          }
      }
    });

    // 2. Enemy Bullets / Enemies / Boss -> Player
    const playerBox = { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height };
    const diffMods = difficultySystem.getModifiers();
    
    this.bullets.filter(b => b.isEnemyBullet).forEach(b => {
      if (combatSystem.checkCollision(b, playerBox)) {
        b.active = false;
        const dmg = this.player!.takeDamage(10 * diffMods.enemyDamageMultiplier);
        if (dmg > 0) this.damagePlayer(dmg);
      }
    });

    enemySystem.enemies.forEach(e => {
        if (combatSystem.checkCollision(e, playerBox)) {
            e.hp = 0;
            this.handleEnemyDeath(e, EntityType.ENEMY); // Reward/Progress even on contact
            const dmg = this.player!.takeDamage(e.damage);
            if (dmg > 0) this.damagePlayer(dmg);
        }
    });

    if (bossSystem.currentBoss && combatSystem.checkCollision(bossSystem.currentBoss, playerBox)) {
        this.damagePlayer(1); // Rapid micro-damage for contact
    }

    // 3. Player -> Drops
    // ... rest of drop logic ...
    dropSystem.drops.forEach((d, idx) => {
        if (d.type === DropType.GOLD) return;

        if (combatSystem.checkCollision(d, playerBox)) {
            if (d.type === DropType.ELEMENTAL_EVOLUTION) {
                evolvePowerUp();
                effectsSystem.addFloatingText(this.player!.x, this.player!.y - 50, "POWER UP EVOLVED!", '#fbbf24', true);
                visualEffectSystem.emitExplosion(this.player!.x, this.player!.y, d.puClass === 'FIRE' ? '#f97316' : (d.puClass === 'ICE' ? '#38bdf8' : '#eab308'), 50);
            } else if (d.type === DropType.RUNE && d.itemId) {
                addRune(d.itemId);
                effectsSystem.addFloatingText(this.player!.x, this.player!.y - 50, "RUNE DISCOVERED!", '#3b82f6', true);
                visualEffectSystem.emitExplosion(this.player!.x, this.player!.y, '#3b82f6', 40);
            } else if (d.type === DropType.RELIC && d.itemId) {
                addRelic(d.itemId);
                effectsSystem.addFloatingText(this.player!.x, this.player!.y - 50, "RELIC DISCOVERED!", '#10b981', true);
                visualEffectSystem.emitExplosion(this.player!.x, this.player!.y, '#10b981', 40);
            } else if (d.type === DropType.LIFE) {
                addLife(1);
                effectsSystem.addFloatingText(this.player!.x, this.player!.y - 50, "+1 LIFE", '#ef4444', true);
                visualEffectSystem.emitExplosion(this.player!.x, this.player!.y, '#ef4444', 40);
            } else if (d.type === DropType.SHARD) {
                updatePlayerState(prev => ({
                    ...prev,
                    currency: {
                        ...prev.currency,
                        primordialShards: prev.currency.primordialShards + Math.floor(1 * diffMods.shardsMultiplier)
                    },
                    session: {
                        ...prev.session,
                        shardsGained: prev.session.shardsGained + Math.floor(1 * diffMods.shardsMultiplier)
                    }
                }));
            }
            dropSystem.drops.splice(idx, 1);
        }
    });
  }

  private handleEnemyDeath(e: any, ownerType: EntityType) {
    const state = getPlayerState();
    const mods = effectSystem.getModifiers();
    const diff = difficultySystem.getModifiers();
    const isBoss = e.entityType === EntityType.BOSS;

    // Ice shatter effect - 100% chance if frozen
    if (e.isFrozen) {
        visualEffectSystem.emitIceShatter(e.x + e.width/2, e.y + e.height/2, isBoss ? 150 : 80);
    } else {
        visualEffectSystem.emitExplosion(e.x + e.width/2, e.y + e.height/2, isBoss ? '#f59e0b' : (e.type === 'ELITE' ? '#f59e0b' : '#ef4444'), isBoss ? 80 : 30);
    }

    // Rune death effect - PLAYER ONLY
    if (ownerType === EntityType.PLAYER) {
        runeSystem.onDeath(e, (x: number, y: number, mult: number) => {
            effectsSystem.addExplosion(x, y, '#ef4444', 30);
        });
        relicSystem.onKill(e);
    }

    if (ownerType === EntityType.PLAYER && mods.onKillEnergy) {
        updatePlayerState(prev => ({ ...prev, stats: { ...prev.stats, energy: Math.min(prev.stats.maxEnergy, prev.stats.energy + mods.onKillEnergy) } }));
    }

    // PowerUp Evolution Drop Logic (Only for non-boss enemies)
    if (!isBoss) {
        const pu = state.activePowerUp;
        let spawnEvolution = false;
        
        if (pu.class && pu.level === 1 && stageSystem.stageTime > 20) {
            if (Math.random() < 0.04) spawnEvolution = true;
        } 
        else if (pu.class && pu.level === 2 && e.type === 'ELITE') {
            if (Math.random() < 0.25) spawnEvolution = true;
        } 
        else if (pu.class && pu.level === 3 && e.type === 'ELITE') {
            if (Math.random() < 0.1) spawnEvolution = true;
        }

        if (spawnEvolution) dropSystem.spawnElementalEvolution(e.x, e.y, pu.class);
        
        if (e.type === 'ELITE' && Math.random() < diff.shardChanceAdd) {
            dropSystem.spawnShard(e.x, e.y);
        }
    } else {
        // Boss Specifics
        dropSystem.spawnShard(e.x, e.y);
        dropSystem.rollDrop(e.x, e.y, 100, false, true); // Boss drop
    }

    const goldGain = Math.floor((isBoss ? 1000 : (e.type === 'ELITE' ? 250 : 50)) * mods.goldMult * diff.goldMultiplier);
    const scoreGain = Math.floor((isBoss ? 2500 : (e.type === 'ELITE' ? 100 : 15)) * mods.scoreMult);
    const xpGain = Math.floor((isBoss ? 500 : scoreGain) * diff.xpMultiplier);

    stageSystem.addProgress(isBoss ? 'BOSS' : e.type);

    updatePlayerState(prev => ({
        ...prev,
        session: {
            ...prev.session,
            kills: prev.session.kills + 1,
            elitesKilled: e.type === 'ELITE' ? prev.session.elitesKilled + 1 : prev.session.elitesKilled,
            bossesKilled: isBoss ? prev.session.bossesKilled + 1 : prev.session.bossesKilled,
            goldGained: prev.session.goldGained + goldGain
        }
    }));

    if (!isBoss) dropSystem.rollDrop(e.x, e.y, 40 * (mods.goldDropChance || 1), e.type === 'ELITE');
    addScore(scoreGain, e.type === 'ELITE' && !isBoss);
    this.gainXP(xpGain);
  }

  private gainXP(amount: number) {
      const state = getPlayerState();
      const res = progressionSystem.calculateExp(state.progression.exp, amount, state.progression.level);
      
      updatePlayerState(prev => ({
          ...prev,
          progression: {
            ...prev.progression,
            exp: res.newExp,
            level: res.newLevel,
            nextLevelExp: res.nextLevelExp
          }
      }));

      if (res.leveledUp) {
          effectsSystem.addFloatingText(this.player!.x, this.player!.y - 80, "LEVEL UP!", '#fbbf24', true);
          visualEffectSystem.emitLevelUp(this.player!.x + this.player!.width/2, this.player!.y + this.player!.height/2);
      }
  }

  private damagePlayer(amount: number) {
      if (gameOverSystem.step !== GameOverStep.NONE) return;
      const mods = effectSystem.getModifiers();
      
      if (Math.random() < mods.dodgeChance) {
          effectsSystem.addFloatingText(this.player!.x, this.player!.y - 30, "ESQUIVOU", '#60a5fa', true);
          return;
      }

      console.log(`[Engine] Player took damage: ${amount}`);
      triggerFeedback('shake', 20);
      triggerFeedback('flash', 0.4);
      triggerFeedback('hpChanged', true);
      effectsSystem.addFloatingText(this.player!.x, this.player!.y, `-${Math.ceil(amount)}`, '#ef4444');

      updatePlayerState(prev => ({
          ...prev,
          stats: {
              ...prev.stats,
              hp: Math.max(0, prev.stats.hp - amount)
          }
      }));

      if (getPlayerState().stats.hp <= 0) {
          handlePlayerDeath();
          const newState = getPlayerState();
          if (newState.session.lives <= 0) {
              addRankingEntry(
                  newState.session.playerName, 
                  newState.session.score, 
                  newState.currentGameMode,
                  newState.session.selectedArea,
                  newState.session.selectedDifficulty
              );
              gameOverSystem.start(this.player!.x, this.player!.y);
              return;
          } else {
              // Re-spawn visual
              visualEffectSystem.emitExplosion(this.player!.x, this.player!.y, '#ef4444', 100);
              // Do not force center x/y here, let the player continue or decide respawn logic
          }
      }
  }

  private draw() {
    if (!this.ctx) return;
    const { width, height } = this.ctx.canvas;
    
    this.ctx.save();
    
    // Zoom/Camera transformation
    if (gameOverSystem.step !== GameOverStep.NONE) {
        const tx = gameOverSystem.cameraTarget.x;
        const ty = gameOverSystem.cameraTarget.y;
        this.ctx.translate(width / 2, height / 2);
        this.ctx.scale(gameOverSystem.zoom, gameOverSystem.zoom);
        this.ctx.translate(-tx, -ty);
    } else {
        const sx = (Math.random() - 0.5) * this.shakeAmount;
        const sy = (Math.random() - 0.5) * this.shakeAmount;
        this.ctx.translate(this.camOffset.x + sx, this.camOffset.y + sy);
    }

    backgroundSystem.draw(this.ctx, width, height, this.bgTime);

    dropSystem.draw(this.ctx);
    enemySystem.draw(this.ctx);
    bossSystem.draw(this.ctx);
    this.bullets.forEach(b => b.draw(this.ctx!));
    
    if (this.player && gameOverSystem.step < GameOverStep.EXPLODING) {
      visualEffectSystem.draw(this.ctx, this.player.x, this.player.y, this.player.width, this.player.height);
      this.player.draw(this.ctx);
    }

    dialogueSystem.draw(this.ctx);
    effectsSystem.draw(this.ctx);

    this.ctx.restore();

    // Red Overlay (Game Over)
    if (gameOverSystem.overlayAlpha > 0) {
        this.ctx.fillStyle = `rgba(180, 0, 0, ${gameOverSystem.overlayAlpha})`;
        this.ctx.fillRect(0, 0, width, height);
    }

    // GAME OVER TEXT
    if (gameOverSystem.step >= GameOverStep.SHOW_TEXT) {
        const textScale = Math.min(1.0, 0.5 + gameOverSystem.timer * 2);
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        this.ctx.scale(textScale, textScale);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '900 80px "Inter", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'red';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('GAME OVER', 0, 0);
        this.ctx.restore();
    }

    if (stageSystem.isWarningBoss) {
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        const warningScale = 1 + Math.sin(performance.now() / 100) * 0.1;
        this.ctx.scale(warningScale, warningScale);
        
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = '900 60px "Inter", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        this.ctx.shadowBlur = 30;
        this.ctx.fillText('AMEAÇA IMINENTE', 0, 0);
        
        this.ctx.font = '700 24px "Inter", sans-serif';
        this.ctx.fillText('ENTIDADE DETECTADA', 0, 45);
        this.ctx.restore();
    }

    const state = getPlayerState();
    if (state.feedback.flash > 0) {
        this.ctx.fillStyle = `rgba(239, 68, 68, ${state.feedback.flash})`;
        this.ctx.fillRect(0, 0, width, height);
    }

    // --- EVENT FEEDBACK ---
    if (eventSystem.isHordeActive()) {
        const time = performance.now() / 1000;
        const opacity = 0.05 + Math.sin(time * 4) * 0.02;
        this.ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`;
        this.ctx.fillRect(0, 0, width, height);
    }

    if (eventSystem.messageTimer > 0) {
        this.ctx.save();
        this.ctx.translate(width / 2, height * 0.3);
        const scale = 1 + Math.sin(performance.now() / 200) * 0.05;
        this.ctx.scale(scale, scale);
        
        this.ctx.fillStyle = 'rgba(234, 179, 8, 1)';
        this.ctx.font = 'italic 900 32px "Inter", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(234, 179, 8, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText(eventSystem.message, 0, 0);
        
        // Glitch line
        if (Math.random() > 0.8) {
            this.ctx.fillRect(-200, 10, 400, 2);
        }
        
        this.ctx.restore();
    }
  }
}
