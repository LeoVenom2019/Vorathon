import { GameModeType, ScrollDirection, PlayerType, ModeConfig } from '../core/Types';

export const COSMIC_ASCENSION_CONFIG: ModeConfig = {
  id: GameModeType.COSMIC_ASCENSION,
  name: 'Ascensão Cósmica',
  description: 'Modo clássico de combate estelar horizontal.',
  direction: ScrollDirection.HORIZONTAL,
  playerType: PlayerType.SHIP,
  spawnSide: 'RIGHT',
  intensity: 1.0
};
