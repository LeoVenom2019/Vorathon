import { getPlayerState } from '../core/Store';
import runesData from '../data/runes.json';
import relicsData from '../data/relics.json';
import { skillTreeSystem } from './skillTreeSystem';
import { EntityType } from '../core/Types';

export class EffectSystem {
    private runes = (runesData as any).runes;
    private relics = (relicsData as any).relics;

    // Cache of active effects to avoid recalculating every frame
    private activeModifiers: any = {};
    private lastEquippedHash: string = '';

    getEmptyModifiers() {
        return {
            damageMult: 1,
            speedMult: 1,
            fireRateMult: 1,
            critChanceAdd: 0,
            critDamageMult: 1,
            maxHpAdd: 0,
            maxHpMult: 1,
            energyRecMult: 1,
            goldMult: 1,
            scoreMult: 1,
            dodgeChance: 0,
            piercing: false,
            executionThreshold: 0,
            healingMult: 1,
            cooldownReduction: 1,
            extraProjectiles: 0,
            bonusDamage: 0,
            maxEnergyAdd: 0,
            onHit: [],
            onDeath: [],
            onShoot: [],
            onInterval: [],
            globalDebuff: null
        };
    }

    getModifiers(type: EntityType = EntityType.PLAYER) {
        if (type !== EntityType.PLAYER) return this.getEmptyModifiers();
        
        const state = getPlayerState();
        const tree = state.skillTree || {};
        
        // Use a simpler hash that only includes fields affecting modifiers
        // Avoid expensive JSON.stringify(tree) in the hot loop
        const treeHash = `w:${tree.weapon}|d:${tree.attributes?.damage}|h:${tree.attributes?.hp}|e:${tree.attributes?.energy}`;
        const hash = state.equippedRunes.join('|') + '||' + state.equippedRelics.join('|') + '||' + state.equippedChaosOrbs.join('|') + '||' + treeHash;
        
        if (hash === this.lastEquippedHash) return this.activeModifiers;

        this.lastEquippedHash = hash;
        this.activeModifiers = this.calculateModifiers(state);
        return this.activeModifiers;
    }

    private calculateModifiers(state: any) {
        const treeBonuses = skillTreeSystem.getBonuses();
        const mods = {
            damageMult: 1,
            speedMult: 1,
            fireRateMult: 1,
            critChanceAdd: 0,
            critDamageMult: 1,
            maxHpAdd: treeBonuses.bonusHp,
            maxHpMult: 1,
            energyRecMult: 1,
            goldMult: 1,
            scoreMult: 1,
            dodgeChance: 0,
            piercing: false,
            executionThreshold: 0,
            healingMult: 1,
            cooldownReduction: 1,
            extraProjectiles: 0,
            // Skill Tree specific additions
            bonusDamage: treeBonuses.bonusDamage,
            maxEnergyAdd: treeBonuses.bonusMaxEnergy,
            // Functional triggers
            onHit: [] as any[],
            onDeath: [] as any[],
            onShoot: [] as any[],
            onInterval: [] as any[],
            globalDebuff: null as any
        };

        const equipped = [
            ...state.equippedRunes.map((id: string) => this.runes.find((r: any) => r.id === id)),
            ...state.equippedRelics.map((id: string) => this.relics.find((r: any) => r.id === id)),
            ...state.equippedChaosOrbs.map((id: string) => state.inventory.chaosOrbs.find((o: any) => o.id === id))
        ].filter(Boolean);

        equipped.forEach(item => {
            const fx = item.effects;
            if (!fx) return;

            // Simple Stat Multiplication
            if (fx.statMult) {
                if (fx.statMult.damage) mods.damageMult *= fx.statMult.damage;
                if (fx.statMult.speed) mods.speedMult *= fx.statMult.speed;
                if (fx.statMult.fireRate) mods.fireRateMult *= fx.statMult.fireRate;
                if (fx.statMult.maxHp) mods.maxHpMult *= fx.statMult.maxHp;
                if (fx.statMult.goldMult) mods.goldMult *= fx.statMult.goldMult;
                if (fx.statMult.scoreMult) mods.scoreMult *= fx.statMult.scoreMult;
                if (fx.statMult.healingMult) mods.healingMult *= fx.statMult.healingMult;
                if (fx.statMult.cooldownReduction) mods.cooldownReduction *= fx.statMult.cooldownReduction;
            }

            // Simple Stat Addition
            if (fx.statAdd) {
                if (fx.statAdd.critChance) mods.critChanceAdd += fx.statAdd.critChance;
                if (fx.statAdd.maxHp) mods.maxHpAdd += fx.statAdd.maxHp;
                if (fx.statAdd.critDamage) mods.critDamageMult += fx.statAdd.critDamage;
                if (fx.statAdd.extraProjectiles) mods.extraProjectiles += fx.statAdd.extraProjectiles;
            }

            // Specific Mechanics
            if (fx.statMod?.piercing) mods.piercing = true;
            if (fx.dodgeChance) mods.dodgeChance += fx.dodgeChance;
            if (fx.executionThreshold) mods.executionThreshold = Math.max(mods.executionThreshold, fx.executionThreshold);
            if (fx.globalEnemyDebuff) mods.globalDebuff = fx.globalEnemyDebuff;

            // Trigger-based effects
            if (fx.onHitBurn) mods.onHit.push({ type: 'BURN', ...fx.onHitBurn });
            if (fx.onHitFreeze) mods.onHit.push({ type: 'FREEZE', ...fx.onHitFreeze });
            if (fx.onHitKnockback) mods.onHit.push({ type: 'KNOCKBACK', ...fx.onHitKnockback });
            if (fx.onHitHeal) mods.onHit.push({ type: 'HEAL', ...fx.onHitHeal });
            if (fx.onHitSplash) mods.onHit.push({ type: 'SPLASH', ...fx.onHitSplash });
            if (fx.onHitBetray) mods.onHit.push({ type: 'BETRAY', chance: fx.onHitBetray });

            if (fx.onDeathExplosion) mods.onDeath.push({ type: 'EXPLOSION', ...fx.onDeathExplosion });
            if (fx.onDeathZone) mods.onDeath.push({ type: 'ZONE', ...fx.onDeathZone });
            
            if (fx.onShootChain) mods.onShoot.push({ type: 'CHAIN', ...fx.onShootChain });
            if (fx.onShootInterval) mods.onShoot.push({ type: 'INTERVAL_PROC', ...fx.onShootInterval });
            if (fx.onShootSaveEnergy) mods.onShoot.push({ type: 'SAVE_ENERGY', ...fx.onShootSaveEnergy });

            if (fx.onIntervalHeal) mods.onInterval.push({ type: 'HEAL', ...fx.onIntervalHeal });
            if (fx.regen) mods.onInterval.push({ type: 'REGEN', amount: fx.regen });
            if (fx.missingHpDamage) mods.onInterval.push({ type: 'LOW_HP_BOOST', mult: fx.missingHpDamage });
        });

        return mods;
    }
}

export const effectSystem = new EffectSystem();
