import { GameModeType, ModeConfig } from '../core/Types';
import { COSMIC_ASCENSION_CONFIG } from '../modes/cosmicAscension';
import { CELESTIAL_COLLAPSE_CONFIG } from '../modes/celestialCollapse';
import { STEEL_DOMINION_CONFIG } from '../modes/steelDominion';
import { ARMORED_ADVANCE_CONFIG } from '../modes/armoredAdvance';

export class ModeSystem {
  private currentMode: ModeConfig;
  private configs: Record<GameModeType, ModeConfig> = {
    [GameModeType.COSMIC_ASCENSION]: COSMIC_ASCENSION_CONFIG,
    [GameModeType.CELESTIAL_COLLAPSE]: CELESTIAL_COLLAPSE_CONFIG,
    [GameModeType.STEEL_DOMINION]: STEEL_DOMINION_CONFIG,
    [GameModeType.ARMORED_ADVANCE]: ARMORED_ADVANCE_CONFIG,
  };

  constructor() {
    this.currentMode = this.configs[GameModeType.COSMIC_ASCENSION];
  }

  setMode(type: GameModeType) {
    this.currentMode = this.configs[type];
  }

  getCurrentMode(): ModeConfig {
    return this.currentMode;
  }

  getConfigs(): ModeConfig[] {
    return Object.values(this.configs);
  }
}

export const modeSystem = new ModeSystem();
