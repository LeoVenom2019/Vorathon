import { PowerUpClass, PowerUpLevel, EntityType } from '../core/Types';
import { getPlayerState } from '../core/Store';

export interface PowerUpEffect {
    damageMult: number;
    shotCount: number;
    bulletColor: string;
    specialEffect?: 'MISSILE' | 'PLASMA' | 'ARC';
}

export class PowerUpSystem {
    getEffect(type: EntityType = EntityType.PLAYER): PowerUpEffect {
        if (type !== EntityType.PLAYER) {
            return { damageMult: 1, shotCount: 1, bulletColor: '#60a5fa' };
        }

        const { activePowerUp } = getPlayerState();
        const { class: puClass, level } = activePowerUp;

        if (!puClass) {
            return { damageMult: 1, shotCount: 1, bulletColor: '#60a5fa' };
        }

        let damageMult = 1;
        let shotCount = 1;
        let bulletColor = '#60a5fa';

        if (level >= 2) damageMult = 1.25;
        if (level >= 3) damageMult = 1.30;
        if (level >= 4) damageMult = 1.35;

        if (level === 2) shotCount = 2;
        if (level >= 3) shotCount = 3;

        switch (puClass) {
            case PowerUpClass.FIRE:
                bulletColor = level >= 4 ? '#ef4444' : (level >= 2 ? '#f97316' : '#f87171');
                break;
            case PowerUpClass.ICE:
                bulletColor = level >= 4 ? '#38bdf8' : (level >= 2 ? '#7dd3fc' : '#bae6fd');
                break;
            case PowerUpClass.ELECTRIC:
                bulletColor = level >= 4 ? '#eab308' : (level >= 2 ? '#facc15' : '#fef08a');
                break;
        }

        let specialEffect: PowerUpEffect['specialEffect'];
        if (level === 4) {
            if (puClass === PowerUpClass.FIRE) specialEffect = 'MISSILE';
            if (puClass === PowerUpClass.ICE) specialEffect = 'PLASMA';
            if (puClass === PowerUpClass.ELECTRIC) specialEffect = 'ARC';
        }

        return { damageMult, shotCount, bulletColor, specialEffect };
    }
}

export const powerUpSystem = new PowerUpSystem();
