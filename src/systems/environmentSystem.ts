import { getPlayerState } from '../core/Store';

export interface EnvironmentTheme {
    id: string;
    name: string;
    bgColor1: string;
    bgColor2: string;
    particleColor: string;
    nebulaColor1: string;
    nebulaColor2: string;
    ambientEffects: 'bubbles' | 'dust' | 'lava' | 'sparkles' | 'stars' | 'leaves';
}

const Themes: Record<string, EnvironmentTheme> = {
    'STAGE1': {
        id: 'STAGE1',
        name: 'Vácuo Estelar',
        bgColor1: '#020617',
        bgColor2: '#0c1120',
        particleColor: '#ffffff',
        nebulaColor1: '#0ea5e90a',
        nebulaColor2: '#a855f705',
        ambientEffects: 'stars'
    },
    'OCEAN': {
        id: 'OCEAN',
        name: 'Mar Azul',
        bgColor1: '#082f49',
        bgColor2: '#075985',
        particleColor: '#bae6fd',
        nebulaColor1: '#0ea5e920',
        nebulaColor2: '#06b6d410',
        ambientEffects: 'bubbles'
    },
    'DESERT': {
        id: 'DESERT',
        name: 'Dunas de Areia',
        bgColor1: '#451a03',
        bgColor2: '#78350f',
        particleColor: '#fde68a',
        nebulaColor1: '#f59e0b10',
        nebulaColor2: '#b4530905',
        ambientEffects: 'dust'
    },
    'LAVA': {
        id: 'LAVA',
        name: 'Inferno de Magma',
        bgColor1: '#450a0a',
        bgColor2: '#7f1d1d',
        particleColor: '#fca5a5',
        nebulaColor1: '#ef444415',
        nebulaColor2: '#f9731610',
        ambientEffects: 'lava'
    },
    'DEEP_SPACE': {
        id: 'DEEP_SPACE',
        name: 'Espaço Profundo',
        bgColor1: '#000000',
        bgColor2: '#020617',
        particleColor: '#ffffff',
        nebulaColor1: '#3b82f610',
        nebulaColor2: '#6366f105',
        ambientEffects: 'sparkles'
    },
    'FOREST': {
        id: 'FOREST',
        name: 'Floresta Viva',
        bgColor1: '#064e3b',
        bgColor2: '#065f46',
        particleColor: '#a7f3d0',
        nebulaColor1: '#10b98110',
        nebulaColor2: '#05966905',
        ambientEffects: 'leaves'
    }
};

class EnvironmentSystem {
    private currentTheme: EnvironmentTheme = Themes['STAGE1'];
    private lastPhase: number = -1;

    getTheme(): EnvironmentTheme {
        const state = getPlayerState();
        const phase = state.session.phase || 1;

        if (phase !== this.lastPhase) {
            this.lastPhase = phase;
            this.updateTheme(phase);
        }

        return this.currentTheme;
    }

    private updateTheme(phase: number) {
        // Rotation of themes based on phase
        const themeKeys = Object.keys(Themes);
        const index = (phase - 1) % themeKeys.length;
        this.currentTheme = Themes[themeKeys[index]];
    }
}

export const environmentSystem = new EnvironmentSystem();
