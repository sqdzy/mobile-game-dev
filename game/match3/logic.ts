import { BASE_TILE_SCORE } from './constants';
import { BoardState, GeneratedSpecial, MatchGroup, Position, ResolveResult, Tile } from './types';
import { cloneBoard, generateId, inBounds, randomColor, swapTiles } from './utils';

// Public API
// ----------

export function initBoard(board: BoardState) {
  // Fill with random tiles ensuring no immediate specials; attempt to avoid initial matches
  let attempts = 0;
  do {
    attempts++;
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        board.tiles[r][c] = { id: generateId(), color: randomColor() };
      }
    }
    const matches = findAllMatches(board);
    if (matches.length === 0) break;
  } while (attempts < 40);
  return board;
}

export function attemptSwap(board: BoardState, a: Position, b: Position) {
  const copy = cloneBoard(board);
  swapTiles(copy, a, b);
  const matches = findAllMatches(copy);
  const aSpecial = board.tiles[a.row][a.col].special;
  const bSpecial = board.tiles[b.row][b.col].special;
  if (matches.length > 0) {
    return { valid: true, board: copy } as const; // forms a match
  }
  // Allow swap with no immediate match only if both are specials (combined activation scenario handled upstream)
  if (aSpecial && bSpecial) {
    return { valid: true, board: copy } as const;
  }
  return { valid: false, board } as const;
}

export function resolveBoard(board: BoardState, chain = 1): ResolveResult | null {
  const matches = findAllMatches(board);
  if (matches.length === 0) return null;
  const positionsToClear: Position[] = [];
  const specials: GeneratedSpecial[] = [];
  // Collect extra clear zones from specials that are part of a match
  const specialsConsumed: Position[] = [];

  const addSpecialEffect = (pos: Position, type: Tile['special']) => {
    if (!type) return;
    switch (type) {
      case 'rocketH':
        for (let c = 0; c < board.cols; c++) positionsToClear.push({ row: pos.row, col: c });
        break;
      case 'rocketV':
        for (let r = 0; r < board.rows; r++) positionsToClear.push({ row: r, col: pos.col });
        break;
      case 'lightning': {
        // own tile + random 2x2 area (consume special itself so no infinite use)
        positionsToClear.push(pos);
        const r = Math.max(0, Math.min(board.rows - 2, Math.floor(Math.random() * board.rows)));
        const c = Math.max(0, Math.min(board.cols - 2, Math.floor(Math.random() * board.cols)));
        positionsToClear.push({ row: r, col: c }, { row: r + 1, col: c }, { row: r, col: c + 1 }, { row: r + 1, col: c + 1 });
        break;
      }
      case 'bomb': {
        for (let dr = -2; dr <= 1; dr++) {
          for (let dc = -2; dc <= 1; dc++) {
            const p = { row: pos.row + dr, col: pos.col + dc };
            if (inBounds(board, p)) positionsToClear.push(p);
          }
        }
        break;
      }
    }
  };

  for (const m of matches) {
    const hasExistingSpecial = m.positions.some(p => !!board.tiles[p.row][p.col].special);
    // add base matched tiles
    positionsToClear.push(...m.positions);
    if (hasExistingSpecial) {
      // trigger every special inside this match
      for (const p of m.positions) {
        const t = board.tiles[p.row][p.col];
        if (t.special) {
          specialsConsumed.push(p);
          addSpecialEffect(p, t.special);
        }
      }
    } else {
      // Determine special creation only if no existing special part of that group
      if (m.type === 'line') {
        if (m.length === 4) {
          const pos = chooseSpecialPosition(board, m.positions);
            specials.push({ pos, special: m.orientation === 'h' ? 'rocketH' : 'rocketV' });
        } else if ((m.length ?? 0) >= 5) {
          const pos = chooseSpecialPosition(board, m.positions);
          specials.push({ pos, special: 'bomb' });
        }
      } else if (m.type === 'square') {
        const pos = chooseSpecialPosition(board, m.positions);
        specials.push({ pos, special: 'lightning' });
      }
    }
  }

  // Deduplicate positions
  const key = (p: Position) => `${p.row}:${p.col}`;
  const unique = new Map<string, Position>();
  positionsToClear.forEach((p) => unique.set(key(p), p));
  const toRemove = Array.from(unique.values());

  // Mark positions as empty (null) for gravity to collapse
  for (const p of toRemove) {
    (board.tiles as (Tile | null)[][])[p.row][p.col] = null;
  }

  applyGravity(board); // collapses non-null downward
  refill(board);       // fills null with new random tiles

  // Place specials overriding the tile at the chosen position (after gravity may have shifted; we pick original position if still in bounds)
  for (const s of specials) {
    if (inBounds(board, s.pos)) {
      board.tiles[s.pos.row][s.pos.col] = {
        id: generateId(),
        color: board.tiles[s.pos.row][s.pos.col].color,
        special: s.special,
      };
    }
  }

  const scoreGain = toRemove.length * BASE_TILE_SCORE * chain;
  return { removed: toRemove, specialsCreated: specials, scoreGain, chain };
}

// Lightweight preview of current matches (unique positions). Used for staged animations.
export function peekMatches(board: BoardState): Position[] {
  const matches = findAllMatches(board);
  if (matches.length === 0) return [];
  const uniq = new Map<string, Position>();
  for (const m of matches) {
    for (const p of m.positions) uniq.set(`${p.row}:${p.col}`, p);
  }
  return Array.from(uniq.values());
}

export function activateSpecial(board: BoardState, pos: Position): ResolveResult | null {
  const tile: any = board.tiles[pos.row]?.[pos.col];
  if (!tile || !tile.special) return null;
  const positions: Position[] = [];
  switch (tile.special) {
    case 'rocketH':
      for (let c = 0; c < board.cols; c++) positions.push({ row: pos.row, col: c });
      break;
    case 'rocketV':
      for (let r = 0; r < board.rows; r++) positions.push({ row: r, col: pos.col });
      break;
    case 'lightning': {
      // include itself so it is consumed once; plus random 2x2 block
      positions.push(pos);
      const r = Math.max(0, Math.min(board.rows - 2, Math.floor(Math.random() * board.rows)));
      const c = Math.max(0, Math.min(board.cols - 2, Math.floor(Math.random() * board.cols)));
      positions.push({ row: r, col: c }, { row: r + 1, col: c }, { row: r, col: c + 1 }, { row: r + 1, col: c + 1 });
      break;
    }
    case 'bomb': {
      for (let dr = -2; dr <= 1; dr++) {
        for (let dc = -2; dc <= 1; dc++) {
          const p = { row: pos.row + dr, col: pos.col + dc };
          if (inBounds(board, p)) positions.push(p);
        }
      }
      break;
    }
  }
  // Remove duplicates
  const map = new Map<string, Position>();
  positions.forEach((p) => map.set(`${p.row}:${p.col}`, p));
  const unique = Array.from(map.values());
  unique.forEach((p) => ((board.tiles as (Tile | null)[][])[p.row][p.col] = null));
  applyGravity(board);
  refill(board);
  const scoreGain = unique.length * BASE_TILE_SCORE;
  // Remove the special tile itself (already replaced) — chain is 1 for direct activation
  return { removed: unique, specialsCreated: [], scoreGain, chain: 1 };
}

// Activate combined special (when two specials are swapped together)
export function activateCombinedSpecial(
  board: BoardState,
  aPos: Position,
  bPos: Position
): ResolveResult | null {
  const a: any = board.tiles[aPos.row]?.[aPos.col];
  const b: any = board.tiles[bPos.row]?.[bPos.col];
  if (!a || !b || !a.special || !b.special) return null;
  const specialsKey = [a.special, b.special].sort().join('+');
  const affected: Position[] = [];

  const add = (p: Position) => {
    if (inBounds(board, p)) affected.push(p);
  };
  const addRow = (row: number) => { for (let c = 0; c < board.cols; c++) add({ row, col: c }); };
  const addCol = (col: number) => { for (let r = 0; r < board.rows; r++) add({ row: r, col }); };
  const area = (center: Position, radius: number) => {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) add({ row: center.row + dr, col: center.col + dc });
    }
  };
  function randomColorClear(times = 1) {
    const colors = new Set<string>();
    for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) colors.add(board.tiles[r][c].color);
    for (let t = 0; t < times; t++) {
      const arr = Array.from(colors);
      if (arr.length === 0) break;
      const chosen = arr[Math.floor(Math.random() * arr.length)];
      for (let r = 0; r < board.rows; r++) {
        for (let c = 0; c < board.cols; c++) if (board.tiles[r][c].color === chosen) add({ row: r, col: c });
      }
    }
  }

  switch (specialsKey) {
    case 'rocketH+rocketH':
      addRow(aPos.row); addRow(bPos.row); break;
    case 'rocketV+rocketV':
      addCol(aPos.col); addCol(bPos.col); break;
    case 'rocketH+rocketV': {
      // plus shape
      if (a.special === 'rocketH') { addRow(aPos.row); addCol(bPos.col); } else { addRow(bPos.row); addCol(aPos.col); }
      break;
    }
    case 'bomb+bomb': {
      const minR = Math.min(aPos.row, bPos.row) - 2;
      const maxR = Math.max(aPos.row, bPos.row) + 2;
      const minC = Math.min(aPos.col, bPos.col) - 2;
      const maxC = Math.max(aPos.col, bPos.col) + 2;
      for (let r = minR; r <= maxR; r++) for (let c = minC; c <= maxC; c++) add({ row: r, col: c });
      break;
    }
    case 'bomb+rocketH':
    case 'bomb+rocketV': {
      const bombPos = a.special === 'bomb' ? aPos : bPos;
      const rocket = a.special === 'bomb' ? b : a;
      const rocketPos = a.special === 'bomb' ? bPos : aPos;
      area(bombPos, 2);
      if (rocket.special === 'rocketH') addRow(rocketPos.row);
      else addCol(rocketPos.col);
      break;
    }
    case 'bomb+lightning': {
      const bombPos = a.special === 'bomb' ? aPos : bPos;
      area(bombPos, 2);
      randomColorClear(1);
      break;
    }
    case 'rocketH+lightning':
    case 'rocketV+lightning': {
      const lightning = a.special === 'lightning' ? a : b;
      const rocket = a.special === 'lightning' ? b : a;
      const rocketPos = rocket === a ? aPos : bPos;
      if (rocket.special === 'rocketH') addRow(rocketPos.row); else addCol(rocketPos.col);
      randomColorClear(1);
      break;
    }
    case 'lightning+lightning': {
      // clear two random colors or entire board if low diversity
      const colors = new Set<string>();
      for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) colors.add(board.tiles[r][c].color);
      if (colors.size <= 2) {
        for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) add({ row: r, col: c });
      } else randomColorClear(2);
      break;
    }
    default: {
      // fallback: activate individually
      const first = activateSpecial(board, aPos);
      const second = activateSpecial(board, bPos);
      if (!first && !second) return null;
      const removed = [...(first?.removed ?? []), ...(second?.removed ?? [])];
      const dedup = new Map<string, Position>();
      removed.forEach(p => dedup.set(`${p.row}:${p.col}`, p));
      return { removed: Array.from(dedup.values()), specialsCreated: [], scoreGain: removed.length * BASE_TILE_SCORE * 2, chain: 1 };
    }
  }

  const uniq = new Map<string, Position>();
  affected.forEach(p => uniq.set(`${p.row}:${p.col}`, p));
  const unique = Array.from(uniq.values());
  unique.forEach(p => { if (inBounds(board, p)) (board.tiles as (Tile | null)[][])[p.row][p.col] = null; });
  applyGravity(board);
  refill(board);
  return { removed: unique, specialsCreated: [], scoreGain: unique.length * BASE_TILE_SCORE * 2, chain: 1 };
}

// Core internal helpers
// ----------------------

function findAllMatches(board: BoardState): MatchGroup[] {
  const groups: MatchGroup[] = [];
  // Horizontal lines
  for (let r = 0; r < board.rows; r++) {
    let c = 0;
    while (c < board.cols) {
      const start = c;
      const color = board.tiles[r][c].color;
      while (c + 1 < board.cols && board.tiles[r][c + 1].color === color) c++;
      const length = c - start + 1;
      if (length >= 3) {
        groups.push({
          type: 'line',
          orientation: 'h',
          length,
          positions: Array.from({ length }, (_, i) => ({ row: r, col: start + i })),
        });
      }
      c++;
    }
  }
  // Vertical lines
  for (let c = 0; c < board.cols; c++) {
    let r = 0;
    while (r < board.rows) {
      const start = r;
      const color = board.tiles[r][c].color;
      while (r + 1 < board.rows && board.tiles[r + 1][c].color === color) r++;
      const length = r - start + 1;
      if (length >= 3) {
        groups.push({
          type: 'line',
          orientation: 'v',
          length,
          positions: Array.from({ length }, (_, i) => ({ row: start + i, col: c })),
        });
      }
      r++;
    }
  }
  // Squares (2x2 clusters of same color)
  for (let r = 0; r < board.rows - 1; r++) {
    for (let c = 0; c < board.cols - 1; c++) {
      const color = board.tiles[r][c].color;
      if (
        board.tiles[r + 0][c + 1].color === color &&
        board.tiles[r + 1][c + 0].color === color &&
        board.tiles[r + 1][c + 1].color === color
      ) {
        groups.push({
          type: 'square',
            // 4 positions forming the square
          positions: [
            { row: r, col: c },
            { row: r, col: c + 1 },
            { row: r + 1, col: c },
            { row: r + 1, col: c + 1 },
          ],
        });
      }
    }
  }
  return groups;
}

function chooseSpecialPosition(board: BoardState, positions: Position[]): Position {
  // Prefer the central or last swapped tile – we'll just pick a random matched tile for now
  return positions[Math.floor(Math.random() * positions.length)];
}

function applyGravity(board: BoardState) {
  for (let c = 0; c < board.cols; c++) {
    const stack: Tile[] = [];
    for (let r = board.rows - 1; r >= 0; r--) {
      const t = (board.tiles as (Tile | null)[][])[r][c];
      if (t) stack.push(t);
    }
    // write from bottom
    let rPtr = board.rows - 1;
    for (const t of stack) {
      board.tiles[rPtr][c] = t;
      rPtr--;
    }
    // remaining become null
    for (; rPtr >= 0; rPtr--) {
      (board.tiles as (Tile | null)[][])[rPtr][c] = null;
    }
  }
}

function refill(board: BoardState) {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const tile = (board.tiles as (Tile | null)[][])[r][c];
      if (tile == null) {
        board.tiles[r][c] = { id: generateId(), color: randomColor() };
      } else if (!tile.id) {
        tile.id = generateId();
      }
    }
  }
}
