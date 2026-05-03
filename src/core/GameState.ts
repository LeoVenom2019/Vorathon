export enum GameState {
  MAIN_MENU = 'MAIN_MENU',
  GAMEPLAY = 'GAMEPLAY',
  FORGE = 'FORGE',
  OPTIONS = 'OPTIONS',
  PAUSED = 'PAUSED',
  STAGE_END = 'STAGE_END',
  STAGE_RESULTS = 'STAGE_RESULTS',
  POWERUP_SELECTION = 'POWERUP_SELECTION',
  AREA_SELECTION = 'AREA_SELECTION',
  DIFFICULTY_SELECTION = 'DIFFICULTY_SELECTION',
  GAME_OVER = 'GAME_OVER'
}

export interface GameStateProps {
  currentState: GameState;
  setGameState: (state: GameState) => void;
}
