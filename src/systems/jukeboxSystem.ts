import { getPlayerState, updatePlayerState } from '../core/Store';
import musicData from '../data/music.json';

class JukeboxSystem {
    private audioInstance: HTMLAudioElement | null = null;
    private analyzer: AnalyserNode | null = null;
    private audioContext: AudioContext | null = null;
    private source: MediaElementAudioSourceNode | null = null;
    private currentTrackId: string | null = null;
    private frequencyData: Uint8Array = new Uint8Array(0);

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioInstance = new Audio();
            this.audioInstance.onended = () => this.handleTrackEnd();
        }
    }

    private initAudioContext() {
        if (this.audioContext || !this.audioInstance) return;
        
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.analyzer = this.audioContext.createAnalyser();
            this.analyzer.fftSize = 256;
            this.source = this.audioContext.createMediaElementSource(this.audioInstance);
            this.source.connect(this.analyzer);
            this.analyzer.connect(this.audioContext.destination);
            this.frequencyData = new Uint8Array(this.analyzer.frequencyBinCount);
        } catch (e) {
            console.warn('AudioContext not supported or blocked by browser policy');
        }
    }

    public playTrack(trackId: string) {
        this.initAudioContext();
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }

        const state = getPlayerState();
        const track = musicData.tracks.find(t => t.id === trackId);
        
        if (!track || !this.audioInstance) return;

        // In a real app, trackId would correlate to a file path
        // For now we just mock the source setting
        if (this.currentTrackId !== trackId) {
            this.currentTrackId = trackId;
            this.audioInstance.src = `/audio/music/${trackId}.ogg`;
            this.audioInstance.load();
        }

        this.audioInstance.volume = state.jukebox.volume;
        this.audioInstance.loop = state.jukebox.loop;
        
        this.audioInstance.play().catch(e => {
            console.log('Playback prevented. Audio requires user interaction.');
        });

        updatePlayerState(prev => ({
            ...prev,
            jukebox: { ...prev.jukebox, activeMusicId: trackId, isPlaying: true }
        }));
    }

    public pause() {
        if (this.audioInstance) {
            this.audioInstance.pause();
            updatePlayerState(prev => ({
                ...prev,
                jukebox: { ...prev.jukebox, isPlaying: false }
            }));
        }
    }

    public resume() {
        if (this.audioInstance && this.currentTrackId) {
            this.audioInstance.play();
            updatePlayerState(prev => ({
                ...prev,
                jukebox: { ...prev.jukebox, isPlaying: true }
            }));
        }
    }

    public next() {
        const state = getPlayerState();
        const currentIndex = musicData.tracks.findIndex(t => t.id === state.jukebox.activeMusicId);
        let nextIndex = (currentIndex + 1) % musicData.tracks.length;
        
        if (state.jukebox.shuffle) {
            nextIndex = Math.floor(Math.random() * musicData.tracks.length);
        }

        const nextTrack = musicData.tracks[nextIndex];
        this.playTrack(nextTrack.id);
    }

    public prev() {
        const state = getPlayerState();
        const currentIndex = musicData.tracks.findIndex(t => t.id === state.jukebox.activeMusicId);
        let prevIndex = (currentIndex - 1 + musicData.tracks.length) % musicData.tracks.length;
        
        const prevTrack = musicData.tracks[prevIndex];
        this.playTrack(prevTrack.id);
    }

    private handleTrackEnd() {
        const state = getPlayerState();
        if (state.jukebox.loop) {
            this.audioInstance?.play();
        } else {
            this.next();
        }
    }

    public setVolume(volume: number) {
        if (this.audioInstance) {
            this.audioInstance.volume = volume;
            updatePlayerState(prev => ({
                ...prev,
                jukebox: { ...prev.jukebox, volume }
            }));
        }
    }

    public getFrequencyData(): Uint8Array {
        if (this.analyzer) {
            this.analyzer.getByteFrequencyData(this.frequencyData);
        }
        return this.frequencyData;
    }

    public toggleShuffle() {
        updatePlayerState(prev => ({
            ...prev,
            jukebox: { ...prev.jukebox, shuffle: !prev.jukebox.shuffle }
        }));
    }

    public toggleLoop() {
        const nextLoop = !getPlayerState().jukebox.loop;
        if (this.audioInstance) this.audioInstance.loop = nextLoop;
        updatePlayerState(prev => ({
            ...prev,
            jukebox: { ...prev.jukebox, loop: nextLoop }
        }));
    }
}

export const jukeboxSystem = new JukeboxSystem();
