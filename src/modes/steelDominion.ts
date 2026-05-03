import { GameModeType, ScrollDirection, PlayerType, ModeConfig } from '../core/Types';

export const STEEL_DOMINION_CONFIG: ModeConfig = {
  id: GameModeType.STEEL_DOMINION,
  name: 'Domínio de Aço',
  description: 'Combate terrestre horizontal com veículos blindados.',
  direction: ScrollDirection.HORIZONTAL,
  playerType: PlayerType.GROUND_VEHICLE,
  spawnSide: 'RIGHT',
  intensity: 1.2
};
