import Grid, { type CellSnapshot } from '@/domain/Grid';

function buildSnapshots(overrides: Record<string, string> = {}): CellSnapshot[] {
  const colors = ['blue', 'red', 'green', 'purple', 'amber', 'grey'];
  const snapshots: CellSnapshot[] = [];

  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const key = `${x},${y}`;
      const baseColor = colors[(x + y) % colors.length];
      snapshots.push({
        x,
        y,
        color: overrides[key] ?? baseColor,
      });
    }
  }

  return snapshots;
}

describe('Grid', () => {
  it('detects vertical matches', () => {
    const snapshots = buildSnapshots({
      '0,0': 'blue',
      '0,1': 'blue',
      '0,2': 'blue',
    });
    const grid = new Grid(8, snapshots);

    const result = grid.getGridMatch(false);
    const coords = result.cellsToRemove.map(cell => `${cell.x},${cell.y}`);

    expect(coords).toEqual(expect.arrayContaining(['0,0', '0,1', '0,2']));
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('detects horizontal matches', () => {
    const snapshots = buildSnapshots({
      '1,4': 'amber',
      '2,4': 'amber',
      '3,4': 'amber',
    });
    const grid = new Grid(8, snapshots);

    const result = grid.getGridMatch(false);
    const coords = result.cellsToRemove.map(cell => `${cell.x},${cell.y}`);

    expect(coords).toEqual(expect.arrayContaining(['1,4', '2,4', '3,4']));
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('replenishes cells after removal', () => {
    const snapshots = buildSnapshots({
      '0,0': 'blue',
      '0,1': 'blue',
      '0,2': 'blue',
    });
    const grid = new Grid(8, snapshots);

    const { cellsToRemove } = grid.getGridMatch(false);
    const initialCount = grid.cells.length;

    const newCells = grid.removeMatches(cellsToRemove);

    expect(newCells.length).toBe(cellsToRemove.length);
    expect(grid.cells.length).toBe(initialCount);
    cellsToRemove.forEach(cell => {
      const refreshed = grid.get(cell.x, cell.y);
      expect(refreshed).not.toBeNull();
    });
  });

  it('swaps cells positions', () => {
    const snapshots = buildSnapshots();
    const grid = new Grid(8, snapshots);

    const first = grid.get(0, 0);
    const second = grid.get(1, 0);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    grid.invertCellsPosition(0, 0, 1, 0);

    const movedFirst = grid.get(1, 0);
    const movedSecond = grid.get(0, 0);

    expect(movedFirst?.id).toBe(first?.id);
    expect(movedSecond?.id).toBe(second?.id);
  });
});
