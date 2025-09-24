import { BOARD_COLS, BOARD_ROWS, COLORS } from './constants';
import { BoardState, Position, Tile } from './types';

export function createEmptyBoard(rows = BOARD_ROWS, cols = BOARD_COLS): BoardState {
  return {
    rows,
    cols,
    tiles: Array.from({ length: rows }, () => Array.from({ length: cols }, () => emptyTile())),
  };
}

function emptyTile(): Tile {
  return { id: `empty-${Math.random().toString(36).slice(2)}`, color: randomColor() };
}

export function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    rows: board.rows,
    cols: board.cols,
    tiles: board.tiles.map((r) => r.map((t) => ({ ...t }))),
  };
}

export function inBounds(board: BoardState, pos: Position) {
  return pos.row >= 0 && pos.row < board.rows && pos.col >= 0 && pos.col < board.cols;
}

export function swapTiles(board: BoardState, a: Position, b: Position) {
  const temp = board.tiles[a.row][a.col];
  board.tiles[a.row][a.col] = board.tiles[b.row][b.col];
  board.tiles[b.row][b.col] = temp;
}

export function positionsEqual(a: Position | null | undefined, b: Position | null | undefined) {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

export function generateId() {
  return Math.random().toString(36).slice(2, 11);
}
