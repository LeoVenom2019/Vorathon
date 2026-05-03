export enum Rarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
  EPIC = 'EPIC',
  MYTHIC = 'MYTHIC'
}

export enum ItemCategory {
  OFFENSE = 'OFFENSE',
  DEFENSE = 'DEFENSE',
  UTILITY = 'UTILITY',
  LIFE = 'LIFE',
  CHAOS = 'CHAOS'
}

export enum ItemTag {
  HEALTH = 'health',
  SHIELD = 'shield',
  DAMAGE = 'damage',
  CRIT = 'crit',
  ATTACK_SPEED = 'attack_speed',
  FIRE = 'fire',
  ICE = 'ice',
  ELECTRIC = 'electric',
  BURN = 'burn',
  FREEZE = 'freeze',
  CHAIN = 'chain',
  EXPLOSION = 'explosion',
  LIFESTEAL = 'lifesteal',
  PIERCE = 'pierce',
  MISSILE = 'missile',
  AURA = 'aura',
  GOLD = 'gold',
  SHARDS = 'shards',
  XP = 'xp',
  SUMMON = 'summon'
}

export interface BaseItem {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  icon: string;
  color: string;
  category: ItemCategory;
  tags: ItemTag[];
  effects: any;
}

export interface ChaosOrb extends BaseItem {
  runeId: string;
  relicId: string;
  relicEffect: string;
  runeEffect: string;
  bonusEffects: string[];
  bonuses: string[]; // Keep for compatibility
  sourceRune?: { name: string; description: string };
  sourceRelic?: { name: string; description: string };
}

export interface Rune extends BaseItem {}
export interface Relic extends BaseItem {}

export enum EntityType {
  PLAYER = 'PLAYER',
  BOT = 'BOT',
  ENEMY = 'ENEMY',
  BOSS = 'BOSS'
}

export interface Entity {
  entityType: EntityType;
  isActive?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  update: (delta: number, ...args: any[]) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export enum GameModeType {
  COSMIC_ASCENSION = 'COSMIC_ASCENSION',
  CELESTIAL_COLLAPSE = 'CELESTIAL_COLLAPSE',
  STEEL_DOMINION = 'STEEL_DOMINION',
  ARMORED_ADVANCE = 'ARMORED_ADVANCE'
}

export enum ScrollDirection {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL'
}

export enum PlayerType {
  SHIP = 'SHIP',
  GROUND_VEHICLE = 'GROUND_VEHICLE'
}

export enum PowerUpClass {
  FIRE = 'FIRE',
  ICE = 'ICE',
  ELECTRIC = 'ELECTRIC',
  PLASMA = 'PLASMA'
}

export enum Difficulty {
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  NIGHTMARE = 'NIGHTMARE',
  APOCALYPSE = 'APOCALYPSE',
  INFERNO = 'INFERNO',
  CHAOS = 'CHAOS'
}

export interface RankingEntry {
  name: string;
  score: number;
  mode: string;
  date: string;
  areaId: string;
  difficulty: Difficulty;
}

export interface Area {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  threatLevel: string;
  stages: string[];
}

export type PowerUpLevel = 1 | 2 | 3 | 4;

export interface ModeConfig {
  id: GameModeType;
  name: string;
  description: string;
  direction: ScrollDirection;
  playerType: PlayerType;
  spawnSide: 'RIGHT' | 'TOP' | 'LEFT' | 'BOTTOM';
  intensity: number;
}
