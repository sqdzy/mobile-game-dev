export type BasicColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export type SpecialType = 'rocketH' | 'rocketV' | 'lightning' | 'bomb';

export interface Tile {
  id: string; // unique id for render keys
  color: BasicColor;
  special?: SpecialType;
  // When a tile is being cleared (for animation), we can mark it
  clearing?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface MatchGroup {
  positions: Position[];
  type: 'line' | 'square';
  orientation?: 'h' | 'v'; // for line matches
  length?: number; // for line matches
}

export interface BoardState {
  tiles: Tile[][];
  rows: number;
  cols: number;
}

export interface GeneratedSpecial {
  pos: Position;
  special: SpecialType;
}

export interface ResolveResult {
  removed: Position[];
  specialsCreated: GeneratedSpecial[];
  scoreGain: number;
  chain: number;
}
