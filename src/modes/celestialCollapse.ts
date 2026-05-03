import { GameModeType, ScrollDirection, PlayerType, ModeConfig } from '../core/Types';

export const CELESTIAL_COLLAPSE_CONFIG: ModeConfig = {
  id: GameModeType.CELESTIAL_COLLAPSE,
  name: 'Colapso Celestial',
  description: 'Combate intenso em queda livre ou ascensão vertical.',
  direction: ScrollDirection.VERTICAL,
  playerType: PlayerType.SHIP,
  spawnSide: 'TOP',
  intensity: 1.5
};
