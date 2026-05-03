
import { useCallback } from 'react';
import { jukeboxSystem } from '../systems/jukeboxSystem';
import { usePlayerState } from '../core/Store';

export function useJukebox() {
    const playerState = usePlayerState();
    const jukeboxState = playerState.jukebox;

    const playTrack = useCallback((trackId: string) => {
        jukeboxSystem.playTrack(trackId);
    }, []);

    const pause = useCallback(() => {
        jukeboxSystem.pause();
    }, []);

    const resume = useCallback(() => {
        jukeboxSystem.resume();
    }, []);

    const next = useCallback(() => {
        jukeboxSystem.next();
    }, []);

    const prev = useCallback(() => {
        jukeboxSystem.prev();
    }, []);

    const setVolume = useCallback((volume: number) => {
        jukeboxSystem.setVolume(volume);
    }, []);

    const toggleShuffle = useCallback(() => {
        jukeboxSystem.toggleShuffle();
    }, []);

    const toggleLoop = useCallback(() => {
        jukeboxSystem.toggleLoop();
    }, []);

    return {
        ...jukeboxState,
        playTrack,
        pause,
        resume,
        next,
        prev,
        setVolume,
        toggleShuffle,
        toggleLoop
    };
}
