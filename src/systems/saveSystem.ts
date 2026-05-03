
import { ChaosOrb } from '../core/Types';

export interface SaveData {
  player: {
    level: number;
    xp: number;
    nextLevelExp: number;
    skillPoints: number;
  };
  inventory: {
    runes: string[];
    relics: string[];
    chaosOrbs: ChaosOrb[];
  };
  equipped: {
    runes: (string | null)[];
    relics: (string | null)[];
    orbs: (string | null)[];
  };
  currency: {
    gold: number;
    shards: number;
  };
  skillTree: any;
  progress: {
    unlockedFeatures: string[];
    lastModePlayed: string;
  };
  rankings: any[];
  progressionAreas: {
    unlockedAreas: string[];
    areaStars: Record<string, number>;
    maxDifficultyUnlocked: string;
  };
}


const SAVE_KEY = 'nebula_forge_complete_save';
const SECRET_KEY = 88; // Unique key for Vorathon

export const saveSystem = {
  // --- Encryption Helpers ---
  encrypt(data: string): string {
    const xored = data.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ (SECRET_KEY + (i % 13)))
    ).join('');
    return btoa(unescape(encodeURIComponent(xored)));
  },

  decrypt(encoded: string): string {
    try {
      const xored = decodeURIComponent(escape(atob(encoded)));
      return xored.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ (SECRET_KEY + (i % 13)))
      ).join('');
    } catch (e) {
      // Fallback for plain base64 or unencrypted
      return decodeURIComponent(escape(atob(encoded)));
    }
  },

  // --- Storage Methods ---
  save(state: any) {
    try {
      const saveData: SaveData = {
        player: {
          level: state.progression.level,
          xp: state.progression.exp,
          nextLevelExp: state.progression.nextLevelExp,
          skillPoints: state.progression.skillPoints
        },
        inventory: {
          runes: state.inventory.runes,
          relics: state.inventory.relics,
          chaosOrbs: state.inventory.chaosOrbs
        },
        equipped: {
          runes: state.equippedRunes,
          relics: state.equippedRelics,
          orbs: state.equippedChaosOrbs
        },
        currency: {
          gold: state.currency.gold,
          shards: state.currency.primordialShards
        },
        skillTree: state.skillTree,
        progressionAreas: state.progressionAreas,
        progress: {
          unlockedFeatures: [],
          lastModePlayed: state.currentGameMode
        },
        rankings: state.rankings
      };
      
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      console.log('AUTO-SAVE REALIZADO');
    } catch (e) {
      console.error('Falha ao realizar AUTO-SAVE:', e);
    }
  },

  load(): SaveData | null {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.player) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar save local:', e);
    }
    return null;
  },

  // --- File Export/Import ---
  exportToFile(state: any) {
    const saveData = {
      ...this.load(), // Ensure we have the latest data
      timestamp: new Date().toISOString(),
      app: 'Vorathon'
    };
    
    // If state is provided, we can use it directly instead of loading from localStorage
    // But usually state is already updated in Store before calling export
    
    const encrypted = this.encrypt(JSON.stringify(saveData));
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vorathon_save_${new Date().toISOString().split('T')[0]}.sav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async importFromFile(file: File): Promise<SaveData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const decrypted = this.decrypt(content);
          const parsed = JSON.parse(decrypted);
          
          if (parsed && parsed.player && parsed.inventory) {
            resolve(parsed);
          } else {
            reject(new Error('Formato de arquivo inválido'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }
};
