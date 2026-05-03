
import { getPlayerState } from '../core/Store';

export enum SFXType {
    CLICK = 'click',
    HOVER = 'hover',
    SHOOT = 'shoot',
    EXPLOSION = 'explosion',
    LEVEL_UP = 'level_up',
    POWERUP = 'powerup',
    COIN = 'coin',
    HURT = 'hurt',
    GAME_OVER = 'game_over',
    VICTORY = 'victory'
}

class SFXSystem {
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private volume: number = 0.5;

    constructor() {
        // Preload basic sounds if needed
    }

    public play(type: string, customVolume?: number) {
        if (typeof window === 'undefined') return;
        
        const state = getPlayerState();
        // Assume for now we have a toggle in options or just use master volume
        // Vorathon doesn't seem to have a separate SFX volume in Store yet, 
        // maybe it uses the jukebox volume for now or we should add one.
        
        const path = `/audio/sfx/${type}.ogg`;
        let audio = this.sounds.get(type);

        if (!audio) {
            audio = new Audio(path);
            this.sounds.set(type, audio);
        }

        audio.volume = (customVolume ?? this.volume) * (state.jukebox?.volume ?? 1);
        audio.currentTime = 0;
        audio.play().catch(() => {
            // Ignore autoplay errors
        });
    }

    public setVolume(volume: number) {
        this.volume = volume;
    }
}

export const sfxSystem = new SFXSystem();
