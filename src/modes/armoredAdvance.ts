import { GameModeType, ScrollDirection, PlayerType, ModeConfig } from '../core/Types';

export const ARMORED_ADVANCE_CONFIG: ModeConfig = {
  id: GameModeType.ARMORED_ADVANCE,
  name: 'Avanço Blindado',
  description: 'Blitz terrestre agressiva em progressão vertical.',
  direction: ScrollDirection.VERTICAL,
  playerType: PlayerType.GROUND_VEHICLE,
  spawnSide: 'TOP',
  intensity: 1.8
};
