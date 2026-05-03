import { PowerUpClass } from '../core/Types';

export interface SynergyBonus {
    durationBonus: number;
    sizeMult: number;
    damageMult: number;
    color: string;
    specialId: string;
    specialName: string;
}

export const SYNERGY_MAP: Record<PowerUpClass, SynergyBonus> = {
    [PowerUpClass.PLASMA]: {
        specialId: 'shockwave',
        specialName: 'Ruptura Astral',
        durationBonus: 3,
        sizeMult: 1.15,
        damageMult: 1.5,
        color: '#3b82f6', // Atomic blue
    },
    [PowerUpClass.FIRE]: {
        specialId: 'explosion',
        specialName: 'Supernova Primordial',
        durationBonus: 3,
        sizeMult: 1.2,
        damageMult: 1.5,
        color: '#f97316', // Fire orange
    },
    [PowerUpClass.ELECTRIC]: {
        specialId: 'thunder',
        specialName: 'Tempestade Celestial',
        durationBonus: 3,
        sizeMult: 1.2,
        damageMult: 1.5,
        color: '#eab308', // Lightning yellow
    },
    [PowerUpClass.ICE]: {
        specialId: 'blizzard',
        specialName: 'Era Glacial',
        durationBonus: 3,
        sizeMult: 1.15,
        damageMult: 1.5,
        color: '#60a5fa', // Ice blue
    }
};

export const synergySystem = {
    getSynergyForPath(path: PowerUpClass): SynergyBonus {
        return SYNERGY_MAP[path];
    },

    isSynergyActive(path: PowerUpClass, equippedSpecials: string[]): boolean {
        const bonus = SYNERGY_MAP[path];
        return equippedSpecials.includes(bonus.specialId);
    },

    getSynergyBonus(path: PowerUpClass, specialId: string) {
        const bonus = SYNERGY_MAP[path];
        if (bonus && bonus.specialId === specialId) {
            return bonus;
        }
        return null;
    }
};
