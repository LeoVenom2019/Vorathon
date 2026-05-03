import { getPlayerState, updatePlayerState } from '../core/Store';

export enum SkillCategory {
    COMPANIONS = 'COMPANIONS',
    WEAPON = 'WEAPON',
    SPECIALS = 'SPECIALS',
    ATTRIBUTES = 'ATTRIBUTES'
}

export interface SkillTreeState {
    companions: {
        summoner: number;
        shooter: number;
        supporter: number;
    };
    weapon: number;
    specials: {
        shockwave: number;
        explosion: number;
        thunder: number;
        blizzard: number;
    };
    attributes: {
        damage: number;
        hp: number;
        energy: number;
    };
    equippedSpecials: (string | null)[]; // Up to 4
}

export const INITIAL_SKILL_TREE: SkillTreeState = {
    companions: {
        summoner: 0,
        shooter: 0,
        supporter: 0
    },
    weapon: 0,
    specials: {
        shockwave: 0,
        explosion: 0,
        thunder: 0,
        blizzard: 0
    },
    attributes: {
        damage: 0,
        hp: 0,
        energy: 0
    },
    equippedSpecials: [null, null, null, null]
};

class SkillTreeSystem {
    getBonuses() {
        const state = getPlayerState();
        const tree = state.skillTree || INITIAL_SKILL_TREE;
        
        // Amplificador de Plasma (Weapon Level)
        const weaponDmgBonuses = [0, 10, 25, 45, 75];
        const weaponSizeBonuses = [1, 1.1, 1.25, 1.4, 1.6];
        
        return {
            bonusDamage: (weaponDmgBonuses[tree.weapon] + (tree.attributes.damage * 10)),
            weaponSizeMult: weaponSizeBonuses[tree.weapon],
            bonusHp: tree.attributes.hp * 20,
            bonusMaxEnergy: tree.attributes.energy * 20
        };
    }

    spendPoint(category: SkillCategory, skillId: string) {
        updatePlayerState(prev => {
            const currentPoints = prev.progression.skillPoints;
            console.log(`[SkillTree] Attempting upgrade: ${category}/${skillId}. Points: ${currentPoints}`);

            if (currentPoints <= 0) {
                console.warn(`[SkillTree] Not enough points: ${currentPoints}`);
                return prev;
            }

            // Deep clone branches to ensure immutability and handle missing branches from old saves
            const newTree = {
                ...INITIAL_SKILL_TREE, // Default values
                ...(prev.skillTree || {}), // Saved values
                companions: { ...INITIAL_SKILL_TREE.companions, ...(prev.skillTree?.companions || {}) },
                specials: { ...INITIAL_SKILL_TREE.specials, ...(prev.skillTree?.specials || {}) },
                attributes: { ...INITIAL_SKILL_TREE.attributes, ...(prev.skillTree?.attributes || {}) },
                equippedSpecials: [...(prev.skillTree?.equippedSpecials || [null, null, null, null])]
            };
            
            let changed = false;

            if (category === SkillCategory.COMPANIONS) {
                const currentVal = newTree.companions[skillId as keyof typeof newTree.companions] ?? 0;
                if (currentVal < 3) {
                    newTree.companions[skillId as keyof typeof newTree.companions] = currentVal + 1;
                    changed = true;
                }
            } else if (category === SkillCategory.WEAPON) {
                const currentVal = newTree.weapon ?? 0;
                if (currentVal < 4) {
                    newTree.weapon = currentVal + 1;
                    changed = true;
                }
            } else if (category === SkillCategory.SPECIALS) {
                const currentVal = newTree.specials[skillId as keyof typeof newTree.specials] ?? 0;
                if (currentVal < 3) {
                    newTree.specials[skillId as keyof typeof newTree.specials] = currentVal + 1;
                    changed = true;
                }
            } else if (category === SkillCategory.ATTRIBUTES) {
                const currentVal = newTree.attributes[skillId as keyof typeof newTree.attributes] ?? 0;
                if (skillId === 'energy' && currentVal >= 10) {
                    console.warn(`[SkillTree] Max energy reached`);
                    return prev;
                }
                newTree.attributes[skillId as keyof typeof newTree.attributes] = currentVal + 1;
                changed = true;
            }

            if (!changed) {
                console.warn(`[SkillTree] No change applied (maybe max level?)`);
                return prev;
            }

            console.log(`[SkillTree] Upgrade success. New state:`, newTree);

            return {
                ...prev,
                progression: {
                    ...prev.progression,
                    skillPoints: currentPoints - 1
                },
                skillTree: newTree
            };
        });
    }

    equipSpecial(specialId: string, slotIndex: number) {
        updatePlayerState(prev => {
            const tree = prev.skillTree || INITIAL_SKILL_TREE;
            // Check if skill is unlocked
            if (tree.specials[specialId as keyof typeof tree.specials] === 0) return prev;

            const newEquipped = [...tree.equippedSpecials];
            newEquipped[slotIndex] = specialId;
            
            return {
                ...prev,
                skillTree: {
                    ...tree,
                    equippedSpecials: newEquipped
                }
            };
        });
    }
}

export const skillTreeSystem = new SkillTreeSystem();
