
import { useCallback } from 'react';
import { sfxSystem, SFXType } from '../systems/sfxSystem';

export { SFXType };

export function useSFX() {
    const playSfx = useCallback((type: SFXType | string, volume?: number) => {
        sfxSystem.play(type, volume);
    }, []);

    return { playSfx };
}
