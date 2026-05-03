import { useState, useCallback, useEffect } from 'react';
import playerInitialData from '../data/player.json';

import { ChaosOrb, Difficulty, RankingEntry } from './Types';
import { checkChaosOrbConflict } from '../systems/forgeSystem';
import { INITIAL_SKILL_TREE } from '../systems/skillTreeSystem';
import { saveSystem, SaveData } from '../systems/saveSystem';

// --- INITIAL STATE LOADING ---
const loadedSave = saveSystem.load();

let globalPlayerState = { 
  ...playerInitialData.player,
  // Use robust save system or defaults
  skillTree: loadedSave?.skillTree || { ...INITIAL_SKILL_TREE },
  
  progression: loadedSave ? {
    level: loadedSave.player.level,
    exp: loadedSave.player.xp,
    nextLevelExp: loadedSave.player.nextLevelExp,
    skillPoints: loadedSave.player.skillPoints
  } : playerInitialData.player.progression,

  inventory: loadedSave ? {
    runes: loadedSave.inventory.runes,
    relics: loadedSave.inventory.relics,
    chaosOrbs: loadedSave.inventory.chaosOrbs
  } : playerInitialData.player.inventory,

  equippedRunes: loadedSave ? loadedSave.equipped.runes as any : playerInitialData.player.equippedRunes,
  equippedRelics: loadedSave ? loadedSave.equipped.relics as any : playerInitialData.player.equippedRelics,
  equippedChaosOrbs: loadedSave ? loadedSave.equipped.orbs as any : playerInitialData.player.equippedChaosOrbs,
  
  currency: loadedSave ? {
    gold: loadedSave.currency.gold,
    primordialShards: loadedSave.currency.shards
  } : playerInitialData.player.currency,

  progressionAreas: {
    unlockedAreas: (loadedSave as any)?.progressionAreas?.unlockedAreas || ['area_1'],
    areaStars: (loadedSave as any)?.progressionAreas?.areaStars || { 'area_1': 0, 'area_2': 0, 'area_3': 0, 'area_4': 0, 'area_5': 0 },
    maxDifficultyUnlocked: (loadedSave as any)?.progressionAreas?.maxDifficultyUnlocked || 'NORMAL'
  },

  currentGameMode: loadedSave ? loadedSave.progress.lastModePlayed : 'COSMIC_ASCENSION' as any,
  
  activePowerUp: {
    class: null as any,
    level: 1 as number
  },

  isSaving: false,
  isPaused: false,

  session: {
    playerName: 'PILOTO',
    score: 0,
    kills: 0,
    elitesKilled: 0,
    goldGained: 0,
    shardsGained: 0,
    bossesKilled: 0,
    lives: 3,
    phase: 1,
    selectedArea: 'area_1',
    selectedDifficulty: 'NORMAL',
    phaseStats: {
        score: 0,
        kills: 0,
        elitesKilled: 0,
        timeRemaining: 0
    }
  },

  rankings: (loadedSave as any)?.rankings || [
    { name: 'ARES-X', score: 156400, mode: 'COSMIC_ASCENSION', date: '20-04-2026', areaId: 'area_1', difficulty: Difficulty.NIGHTMARE },
    { name: 'NEBULA-Z', score: 142100, mode: 'COSMIC_ASCENSION', date: '21-04-2026', areaId: 'area_1', difficulty: Difficulty.HARD },
    { name: 'CYBER-V', score: 98500, mode: 'STEEL_DOMINION', date: '22-04-2026', areaId: 'area_1', difficulty: Difficulty.NORMAL },
    { name: 'POSEIDON-7', score: 210500, mode: 'COSMIC_ASCENSION', date: '23-04-2026', areaId: 'area_2', difficulty: Difficulty.APOCALYPSE },
    { name: 'TRITON-X', score: 185000, mode: 'CELESTIAL_COLLAPSE', date: '24-04-2026', areaId: 'area_2', difficulty: Difficulty.NIGHTMARE }
  ],

  feedback: {
    shake: 0,
    flash: 0,
    hpChanged: false
  },

  jukebox: {
    unlockedMusic: (loadedSave as any)?.jukebox?.unlockedMusic || ['nebula_menu'],
    activeMusicId: 'nebula_menu',
    volume: (loadedSave as any)?.jukebox?.volume ?? 0.6,
    isPlaying: false,
    shuffle: false,
    loop: true
  }
};

// ... existing code ...

const subscribers = new Set<() => void>();

export const getPlayerState = () => globalPlayerState;

// Debounced save
let saveTimeout: any = null;
const debouncedSave = (state: any) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        // Set saving flag
        updatePlayerState(prev => ({ ...prev, isSaving: true }));
        
        saveSystem.save(state);
        
        // Clear saving flag after a short delay
        setTimeout(() => {
            updatePlayerState(prev => ({ ...prev, isSaving: false }));
        }, 800);
    }, 2000);
};

export const updatePlayerState = (updater: (prev: typeof globalPlayerState) => typeof globalPlayerState) => {
  const nextState = updater(globalPlayerState);
  
  if (nextState === globalPlayerState) return;

  // Persistence: Using the new SaveSystem
  if (!nextState.isSaving && globalPlayerState.isSaving) {
      // Don't save if we just cleared the isSaving flag to avoid loops
  } else {
      debouncedSave(nextState);
  }

  globalPlayerState = nextState;
  subscribers.forEach(sub => sub());
};

// Add beforeunload listener
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        // Synchronous save on exit
        saveSystem.save(globalPlayerState);
    });
}

export const updatePlayerName = (name: string) => {
    updatePlayerState(prev => ({
        ...prev,
        session: {
            ...prev.session,
            playerName: name || 'PILOTO'
        }
    }));
};

export const addRankingEntry = (name: string, score: number, mode: string, areaId: string, difficulty: string) => {
    updatePlayerState(prev => {
        const newEntry: RankingEntry = { 
            name: name || 'PILOTO', 
            score, 
            mode, 
            date: new Date().toLocaleDateString(),
            areaId: areaId || 'area_1',
            difficulty: (difficulty || Difficulty.NORMAL) as Difficulty
        };
        
        const newRanking = [...(prev.rankings || []), newEntry];
        
        // Sort by score descending and keep top 100
        const sortedRanking = newRanking
            .sort((a, b) => b.score - a.score)
            .slice(0, 100);
        
        localStorage.setItem('nebula_forge_rankings', JSON.stringify(sortedRanking));
        
        return {
            ...prev,
            rankings: sortedRanking
        };
    });
};

export const triggerFeedback = (type: 'shake' | 'flash' | 'hpChanged', value: any) => {
    updatePlayerState(prev => ({
        ...prev,
        feedback: {
            ...prev.feedback,
            [type]: value
        }
    }));
    // Reset boolean feedback after UI had time to see it if needed (though React state is enough)
    if(type === 'hpChanged') {
        setTimeout(() => {
            updatePlayerState(prev => ({ ...prev, feedback: { ...prev.feedback, hpChanged: false } }));
        }, 100);
    }
    if(type === 'flash') {
        setTimeout(() => {
            updatePlayerState(prev => ({ ...prev, feedback: { ...prev.feedback, flash: 0 } }));
        }, 200);
    }
};

export const equipRune = (runeId: string, slotIndex: number) => {
    updatePlayerState(prev => {
        const newRunes = [...prev.equippedRunes];
        newRunes[slotIndex] = runeId;
        return { ...prev, equippedRunes: newRunes };
    });
};

export const addChaosOrb = (orb: ChaosOrb) => {
    updatePlayerState(prev => ({
        ...prev,
        inventory: {
            ...prev.inventory,
            chaosOrbs: [...prev.inventory.chaosOrbs, orb]
        }
    }));
};

export const destroyChaosOrb = (orbId: string) => {
    updatePlayerState(prev => {
        const filteredOrbs = prev.inventory.chaosOrbs.filter(o => o.id !== orbId);
        const equippedOrbs = prev.equippedChaosOrbs.map(id => id === orbId ? null : id);
        return {
            ...prev,
            inventory: { ...prev.inventory, chaosOrbs: filteredOrbs },
            equippedChaosOrbs: equippedOrbs
        };
    });
};

export const addRune = (runeId: string) => {
    updatePlayerState(prev => ({
        ...prev,
        inventory: {
            ...prev.inventory,
            runes: [...prev.inventory.runes, runeId]
        }
    }));
};

export const addRelic = (relicId: string) => {
    updatePlayerState(prev => ({
        ...prev,
        inventory: {
            ...prev.inventory,
            relics: [...prev.inventory.relics, relicId]
        }
    }));
};

export const deductShards = (amount: number) => {
    updatePlayerState(prev => ({
        ...prev,
        currency: {
            ...prev.currency,
            primordialShards: Math.max(0, prev.currency.primordialShards - amount)
        }
    }));
};

export const deductGold = (amount: number) => {
    updatePlayerState(prev => ({
        ...prev,
        currency: {
            ...prev.currency,
            gold: Math.max(0, prev.currency.gold - amount)
        }
    }));
};

export const updateChaosOrb = (updatedOrb: ChaosOrb) => {
    updatePlayerState(prev => {
        const index = prev.inventory.chaosOrbs.findIndex(o => o.id === updatedOrb.id);
        if (index === -1) return prev;
        
        const newOrbs = [...prev.inventory.chaosOrbs];
        newOrbs[index] = updatedOrb;
        
        return {
            ...prev,
            inventory: {
                ...prev.inventory,
                chaosOrbs: newOrbs
            }
        };
    });
};

export const equipChaosOrb = (orbId: string, slotIndex: number) => {
    updatePlayerState(prev => {
        const orb = prev.inventory.chaosOrbs.find(o => o.id === orbId);
        if (!orb) return prev;

        const equippedOrbs = prev.equippedChaosOrbs.map(id => id ? prev.inventory.chaosOrbs.find(o => o.id === id) || null : null);
        
        if (checkChaosOrbConflict(orb, equippedOrbs)) {
            // Trigger feedback for conflict
            triggerFeedback('flash', 1);
            return prev;
        }

        const newOrbs = [...prev.equippedChaosOrbs];
        newOrbs[slotIndex] = orbId;
        return { ...prev, equippedChaosOrbs: newOrbs };
    });
};

export const unequipChaosOrb = (slotIndex: number) => {
    updatePlayerState(prev => {
        const newOrbs = [...prev.equippedChaosOrbs];
        newOrbs[slotIndex] = null;
        return { ...prev, equippedChaosOrbs: newOrbs };
    });
};

export const unequipRune = (slotIndex: number) => {
    updatePlayerState(prev => {
        const newRunes = [...prev.equippedRunes];
        newRunes[slotIndex] = null as any;
        return { ...prev, equippedRunes: newRunes };
    });
};

export const equipRelic = (relicId: string, slotIndex: number) => {
    updatePlayerState(prev => {
        const newRelics = [...prev.equippedRelics];
        newRelics[slotIndex] = relicId;
        return { ...prev, equippedRelics: newRelics };
    });
};

export const setGameMode = (mode: string) => {
    updatePlayerState(prev => ({
        ...prev,
        currentGameMode: mode
    }));
};

export const unlockDifficulty = (difficulty: Difficulty) => {
    const difficulties: Difficulty[] = [
        Difficulty.NORMAL, Difficulty.HARD, Difficulty.NIGHTMARE, 
        Difficulty.APOCALYPSE, Difficulty.INFERNO, Difficulty.CHAOS
    ];
    
    updatePlayerState(prev => {
        const currentIdx = difficulties.indexOf(prev.progressionAreas.maxDifficultyUnlocked as Difficulty);
        const newIdx = difficulties.indexOf(difficulty);
        
        if (newIdx <= currentIdx) return prev;
        
        return {
            ...prev,
            progressionAreas: {
                ...prev.progressionAreas,
                maxDifficultyUnlocked: difficulty
            }
        };
    });
};

export const setSelectedArea = (areaId: string) => {
    updatePlayerState(prev => ({
        ...prev,
        session: { ...prev.session, selectedArea: areaId }
    }));
};

export const setSelectedDifficulty = (difficulty: string) => {
    updatePlayerState(prev => ({
        ...prev,
        session: { ...prev.session, selectedDifficulty: difficulty }
    }));
};

export const unlockArea = (areaId: string) => {
    updatePlayerState(prev => {
        if (prev.progressionAreas.unlockedAreas.includes(areaId)) return prev;
        return {
            ...prev,
            progressionAreas: {
                ...prev.progressionAreas,
                unlockedAreas: [...prev.progressionAreas.unlockedAreas, areaId]
            }
        };
    });
};

export const setAreaStars = (areaId: string, stars: number) => {
    updatePlayerState(prev => {
        const currentStars = prev.progressionAreas.areaStars[areaId] || 0;
        if (stars <= currentStars) return prev;
        
        return {
            ...prev,
            progressionAreas: {
                ...prev.progressionAreas,
                areaStars: {
                    ...prev.progressionAreas.areaStars,
                    [areaId]: stars
                }
            }
        };
    });
};

export const setPowerUpClass = (puClass: any) => {
    updatePlayerState(prev => ({
        ...prev,
        activePowerUp: {
            class: puClass,
            level: 1
        }
    }));
};

export const evolvePowerUp = () => {
    updatePlayerState(prev => ({
        ...prev,
        activePowerUp: {
            ...prev.activePowerUp,
            level: Math.min(4, prev.activePowerUp.level + 1) as any
        }
    }));
};

export const unequipRelic = (slotIndex: number) => {
    updatePlayerState(prev => {
        const newRelics = [...prev.equippedRelics];
        newRelics[slotIndex] = null as any;
        return { ...prev, equippedRelics: newRelics };
    });
};

export const resetSession = () => {
    updatePlayerState(prev => ({
        ...prev,
        stats: {
            ...prev.stats,
            hp: prev.stats.maxHp,
            energy: prev.stats.maxEnergy
        },
        activePowerUp: {
            class: null as any,
            level: 1
        },
        session: {
            playerName: prev.session.playerName,
            score: 0,
            kills: 0,
            elitesKilled: 0,
            goldGained: 0,
            shardsGained: 0,
            bossesKilled: 0,
            lives: 3,
            phase: 1,
            selectedArea: 'area_1',
            selectedDifficulty: 'NORMAL',
            phaseStats: {
                score: 0,
                kills: 0,
                elitesKilled: 0,
                timeRemaining: 0
            }
        }
    }));
};

export const startNextPhase = () => {
    updatePlayerState(prev => ({
        ...prev,
        session: {
            ...prev.session,
            phase: prev.session.phase + 1,
            phaseStats: {
                score: 0,
                kills: 0,
                elitesKilled: 0,
                timeRemaining: 0
            }
        }
    }));
};

export const updatePhaseTimeRemaining = (time: number) => {
    updatePlayerState(prev => ({
        ...prev,
        session: {
            ...prev.session,
            phaseStats: {
                ...prev.session.phaseStats,
                timeRemaining: time
            }
        }
    }));
};

export const handlePlayerDeath = () => {
    updatePlayerState(prev => {
        const newLives = Math.max(0, prev.session.lives - 1);
        return {
            ...prev,
            stats: {
                ...prev.stats,
                hp: prev.stats.maxHp
            },
            session: {
                ...prev.session,
                lives: newLives
            }
        };
    });
};

export const addLife = (amount: number = 1) => {
    updatePlayerState(prev => ({
        ...prev,
        session: {
            ...prev.session,
            lives: prev.session.lives + amount
        }
    }));
};

export const addScore = (amount: number, isElite: boolean = false) => {
    updatePlayerState(prev => {
        const oldScore = prev.session.score;
        const newScore = oldScore + amount;
        
        // Every 25k points = +1 life
        const oldLivesFromScore = Math.floor(oldScore / 25000);
        const newLivesFromScore = Math.floor(newScore / 25000);
        const addedLives = newLivesFromScore - oldLivesFromScore;

        return {
            ...prev,
            session: {
                ...prev.session,
                lives: prev.session.lives + addedLives,
                score: newScore,
                kills: prev.session.kills + 1,
                elitesKilled: isElite ? prev.session.elitesKilled + 1 : prev.session.elitesKilled,
                phaseStats: {
                    ...prev.session.phaseStats,
                    score: prev.session.phaseStats.score + amount,
                    kills: prev.session.phaseStats.kills + 1,
                    elitesKilled: isElite ? prev.session.phaseStats.elitesKilled + 1 : prev.session.phaseStats.elitesKilled
                }
            }
        };
    });
};

export const completeSession = () => {
    // Current currency already includes gained gold/shards from pick-ups
    // This can be used for any extra end-of-run bonuses if needed
    updatePlayerState(prev => ({
        ...prev,
        // No double addition here
    }));
};

export const setPaused = (paused: boolean) => {
    updatePlayerState(prev => ({
        ...prev,
        isPaused: paused
    }));
};

export const usePlayerState = () => {
  const [state, setState] = useState(globalPlayerState);

  useEffect(() => {
    const sub = () => setState({ ...globalPlayerState });
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
    };
  }, []);

  return state;
};
