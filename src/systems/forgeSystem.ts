import { Rarity, ItemTag, ItemCategory, ChaosOrb, Rune, Relic } from '../core/Types';
import { addChaosOrb, getPlayerState } from '../core/Store';
import runesData from '../data/runes.json';
import relicsData from '../data/relics.json';

const allRunes = (runesData as any).runes;
const allRelics = (relicsData as any).relics;

const MAIN_TAGS = [ItemTag.HEALTH, ItemTag.SHIELD, ItemTag.DAMAGE, ItemTag.CRIT, ItemTag.ATTACK_SPEED];

export const BONUS_LIST = [
  { id: 'dmg_30', description: '+30% Dano', effect: { statMult: { damage: 1.3 } } },
  { id: 'hp_30', description: '+30% Vida', effect: { statAdd: { maxHp: 30, hp: 30 } } },
  { id: 'atk_spd_35', description: '+35% Velocidade de Ataque', effect: { statMult: { fireRate: 0.65 } } },
  { id: 'crit_15', description: '+15% Chance Crítica', effect: { statAdd: { critChance: 15 } } },
  { id: 'crit_dmg_50', description: '+50% Dano Crítico', effect: { statAdd: { critDamage: 0.5 } } },
  { id: 'extra_proj_1', description: '+1 Tiro Automático Extra', effect: { statAdd: { extraProjectiles: 1 } } },
];

const PREFIXES = ['Tempestade', 'Inferno', 'Glacial', 'Radiante', 'Sombrio', 'Primordial', 'Celestial'];
const SUFFIXES = ['do Vazio', 'da Ruína', 'do Titã', 'Ancestral', 'da Eternidade', 'Abissal'];

export const generateOrbDescription = (orb: { relicEffect: string; runeEffect: string; bonusEffects: string[] }) => {
  const lines: string[] = [];
  if (orb.relicEffect) lines.push(orb.relicEffect);
  if (orb.runeEffect) lines.push(orb.runeEffect);
  return lines.join('\n+\n');
};

const mergeEffects = (baseEffects: any, bonuses: any[]) => {
    const effects = { ...baseEffects };
    bonuses.forEach(bonus => {
        Object.keys(bonus.effect).forEach(key => {
            if (effects[key]) {
                if (typeof effects[key] === 'number') {
                    // If it's a multiplier where lower is better (fireRate), we should multiply or handle accordingly
                    // But in this game, it seems they are additive for statAdd and multiplicative for statMult?
                    // Re-checking lines 53-60 of original forgeSystem.ts:
                    /*
                    if (typeof effects[key] === 'number') effects[key] += bonus.effect[key];
                    else effects[key] = { ...effects[key], ...bonus.effect[key] };
                    */
                    // Wait, if fireRate is 0.65 (35% faster), adding 0.65 is wrong. 
                    // Let's stick to the original logic for consistency unless I see a better way.
                    // Actually, for statMult, it should probably be multiplicative.
                    // But the original code did: effects[key] += bonus.effect[key].
                    // Let's assume statMult values in BONUS_LIST are deltas? No, 1.3 is +30%.
                    // If I have 1.3 and add 1.3, I get 2.6. That works for damage.
                    // For fireRate 0.65, adding 0.65 gives 1.3. That's slower.
                    // I will fix the merging logic to be smarter.
                }
            }
        });
    });
    return effects;
};

// I'll rewrite the forgeChaosOrb to use a more robust effect merger
const getMergedEffects = (baseEffects: any, bonusList: any[]) => {
    const effects = JSON.parse(JSON.stringify(baseEffects));
    
    bonusList.forEach(bonus => {
        Object.keys(bonus.effect).forEach(category => {
            if (!effects[category]) effects[category] = {};
            Object.keys(bonus.effect[category]).forEach(stat => {
                const val = bonus.effect[category][stat];
                if (effects[category][stat] !== undefined) {
                    if (category === 'statMult') {
                        // Multipliers: 1.3 (+30%) and 1.3 (+30%) should be 1.6? or 1.69? 
                        // Let's go with additive for simplicity in the UI: 1 + 0.3 + 0.3 = 1.6
                        effects[category][stat] = Number((effects[category][stat] + (val - 1)).toFixed(2));
                    } else {
                        effects[category][stat] += val;
                    }
                } else {
                    effects[category][stat] = val;
                }
            });
        });
    });
    
    return effects;
};

export const forgeChaosOrb = (rune: any, relic: any): ChaosOrb | string => {
  const state = getPlayerState();
  if (state.currency.primordialShards < 10) return 'Fragmentos Insuficientes';

  const rarityRoll = Math.random() * 100;
  let rarity = Rarity.COMMON;
  let bonusCount = 0;

  if (rarityRoll > 95) {
    rarity = Rarity.MYTHIC;
    bonusCount = 3;
  } else if (rarityRoll > 70) {
    rarity = Rarity.EPIC;
    bonusCount = 2;
  }

  const selectedBonuses: any[] = [];
  const availableBonuses = [...BONUS_LIST];
  for (let i = 0; i < bonusCount; i++) {
    const bIndex = Math.floor(Math.random() * availableBonuses.length);
    const bonus = availableBonuses.splice(bIndex, 1)[0];
    selectedBonuses.push(bonus);
  }

  const baseEffects = { ...rune.effects, ...relic.effects };
  const effects = getMergedEffects(baseEffects, selectedBonuses);

  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const name = `Orbe ${prefix} ${suffix}`;

  const relicEffect = relic.description;
  const runeEffect = rune.description;
  const bonusEffects = selectedBonuses.map(b => b.description);

  const description = generateOrbDescription({ relicEffect, runeEffect, bonusEffects });

  const chaosOrb: ChaosOrb = {
    id: `chaos_${rune.id}_${relic.id}_${Date.now()}`,
    name,
    description,
    rarity,
    icon: '🔮',
    color: rune.color || relic.color || '#a855f7',
    category: ItemCategory.CHAOS,
    tags: Array.from(new Set([...rune.tags, ...relic.tags])),
    effects,
    runeId: rune.id,
    relicId: relic.id,
    relicEffect,
    runeEffect,
    bonusEffects: bonusEffects,
    bonuses: bonusEffects, // Compatibility
    sourceRune: { name: rune.name, description: rune.description },
    sourceRelic: { name: relic.name, description: relic.description },
  };

  addChaosOrb(chaosOrb);
  
  return chaosOrb;
};

export const evolveOrb = (orb: ChaosOrb, bonusChance: number = 0): { success: boolean, updatedOrb?: ChaosOrb } => {
    let successChance = 0;
    let newRarity: Rarity = orb.rarity;
    let bonusCount = 0;

    if (orb.rarity === Rarity.COMMON) {
        successChance = 0.2;
        newRarity = Rarity.EPIC;
        bonusCount = 2;
    } else if (orb.rarity === Rarity.EPIC) {
        successChance = 0.1;
        newRarity = Rarity.MYTHIC;
        bonusCount = 3;
    } else {
        return { success: false }; // Already Mythic or invalid
    }

    const totalChance = successChance + bonusChance;
    const rolls = Math.random();
    if (rolls <= totalChance) {
        const selectedBonuses: any[] = [];
        const availableBonuses = [...BONUS_LIST];
        for (let i = 0; i < bonusCount; i++) {
            const bIndex = Math.floor(Math.random() * availableBonuses.length);
            const bonus = availableBonuses.splice(bIndex, 1)[0];
            selectedBonuses.push(bonus);
        }

        const rune = allRunes.find((r: any) => r.id === orb.runeId);
        const relic = allRelics.find((r: any) => r.id === orb.relicId);
        
        const baseEffects = { ...(rune?.effects || {}), ...(relic?.effects || {}) };
        const effects = getMergedEffects(baseEffects, selectedBonuses);
        
        const bonusEffects = selectedBonuses.map(b => b.description);
        
        const updatedOrb: ChaosOrb = {
            ...orb,
            rarity: newRarity,
            effects,
            bonusEffects,
            bonuses: bonusEffects,
            description: generateOrbDescription({ relicEffect: orb.relicEffect, runeEffect: orb.runeEffect, bonusEffects })
        };
        
        return { success: true, updatedOrb };
    }

    return { success: false };
};

export const rerollOrb = (orb: ChaosOrb): ChaosOrb => {
    if (orb.rarity !== Rarity.MYTHIC) return orb;

    const selectedBonuses: any[] = [];
    const availableBonuses = [...BONUS_LIST];
    for (let i = 0; i < 3; i++) {
        const bIndex = Math.floor(Math.random() * availableBonuses.length);
        const bonus = availableBonuses.splice(bIndex, 1)[0];
        selectedBonuses.push(bonus);
    }

    const rune = allRunes.find((r: any) => r.id === orb.runeId);
    const relic = allRelics.find((r: any) => r.id === orb.relicId);
    
    const baseEffects = { ...(rune?.effects || {}), ...(relic?.effects || {}) };
    const effects = getMergedEffects(baseEffects, selectedBonuses);
    
    const bonusEffects = selectedBonuses.map(b => b.description);

    return {
        ...orb,
        effects,
        bonusEffects,
        bonuses: bonusEffects,
        description: generateOrbDescription({ relicEffect: orb.relicEffect, runeEffect: orb.runeEffect, bonusEffects })
    };
};

export const checkChaosOrbConflict = (orbToEquip: ChaosOrb, equippedOrbs: (ChaosOrb | null)[]): boolean => {
  const orbTags = orbToEquip.tags.filter(t => MAIN_TAGS.includes(t));
  
  for (const equipped of equippedOrbs) {
    if (!equipped) continue;
    const commonTags = equipped.tags.filter(t => orbTags.includes(t) && MAIN_TAGS.includes(t));
    if (commonTags.length > 0) return true;
  }
  
  return false;
};
