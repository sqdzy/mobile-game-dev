import AsyncStorage from "@react-native-async-storage/async-storage";
import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";
import Grid, { MatchResult, type CellSnapshot } from "../domain/Grid";
import Match from "../domain/Match";
import audioService from "../services/AudioService";
import type { RootStore } from "./RootStore";

const squareSize = 8;
const GRID_STATE_KEY = "player_grid_state_v1";

interface SimpleCell {
    x: number;
    y: number;
}

interface HintCells {
    from: SimpleCell;
    to: SimpleCell;
}

export default class GridStore {
    private rootStore: RootStore;
    matches: Match[] = [];
    oldMatches: Match[] = [];
    grid: Grid;
    hintCells: HintCells | null = null;
    private persistHandle: ReturnType<typeof setTimeout> | null = null;
    private isRestoring = false;
    private hintTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        this.grid = new Grid(squareSize);
        
        makeObservable(this, {
            matches: observable,
            oldMatches: observable,
            grid: observable,
            hintCells: observable,
            info: computed,
            reset: action,
            select: action,
            showHint: action,
            clearHint: action,
            countMatch: action.bound,
            getMatch: action.bound,
            removeMatches: action.bound,
        });
        
        this.init();
        this.setupReactions();
        void this.loadState();
    }

    private rebuildStatsFromGrid(): void {
        const statStore = this.rootStore.statStore;
        statStore.reset();
        this.grid.cells.forEach(cell => {
            statStore.addColorCount(cell.name, 1);
        });
    }

    private schedulePersist(immediate: boolean = false) {
        if (this.persistHandle) {
            clearTimeout(this.persistHandle);
            this.persistHandle = null;
        }

        const execute = () => {
            if (this.isRestoring) {
                return;
            }
            void this.persistState();
        };

        if (immediate) {
            execute();
        } else {
            this.persistHandle = setTimeout(execute, 250);
        }
    }

    private serializeGrid(): CellSnapshot[] {
        return this.grid.cells.map(cell => ({
            x: cell.x,
            y: cell.y,
            color: cell.name,
        }));
    }

    private async persistState(): Promise<void> {
        try {
            const payload = {
                size: squareSize,
                cells: this.serializeGrid(),
            };
            await AsyncStorage.setItem(GRID_STATE_KEY, JSON.stringify(payload));
        } catch (error) {
            console.error("Failed to persist grid state", error);
        }
    }

    private async loadState(): Promise<void> {
        try {
            this.isRestoring = true;
            const serialized = await AsyncStorage.getItem(GRID_STATE_KEY);
            if (!serialized) {
                this.schedulePersist(true);
                return;
            }
            const parsed = JSON.parse(serialized) as {
                size: number;
                cells: CellSnapshot[];
            } | null;
            if (!parsed || parsed.size !== squareSize || !Array.isArray(parsed.cells)) {
                this.schedulePersist(true);
                return;
            }

            runInAction(() => {
                this.grid = new Grid(squareSize, parsed.cells);
                this.matches = [];
                this.oldMatches = [];
            });
            this.rebuildStatsFromGrid();
        } catch (error) {
            console.error("Failed to load grid state", error);
        } finally {
            this.isRestoring = false;
            this.schedulePersist(true);
        }
    }

    setupReactions(): void {
        reaction(
            () => this.matches,
            (newMatches: Match[]) => {
                const matches = newMatches.filter(x => !this.oldMatches.includes(x));
                const upgradeStore = this.rootStore.upgradeStore;
                const timings = upgradeStore.animationTimings;
                
                if (matches.length > 0) {
                    const maxMatchSize = Math.max(...matches.map(m => m.suite + 1));
                    void audioService.playMatch(maxMatchSize);
                    
                    if (matches.length > 1) {
                        setTimeout(() => {
                            void audioService.play('combo');
                        }, 100);
                    }
                }
                
                matches.forEach(match => {
                    if (match.suite === 2) {
                        setTimeout(() => { this.rootStore.statStore.addMatch3(); }, timings.resolveDelay);
                    }
                    if (match.suite === 3) {
                        setTimeout(() => { this.rootStore.statStore.addMatch4(); }, timings.resolveDelay);
                    }
                    if (match.suite === 4) {
                        setTimeout(() => { this.rootStore.statStore.addMatch5(); }, timings.resolveDelay);
                    }
                    setTimeout(() => { this.rootStore.statStore.addColor(match.color, match.suite + 1); }, timings.resolveDelay);
                    setTimeout(() => { void this.rootStore.currencyStore.rewardMatch(match); }, timings.resolveDelay);
                });
                
                if (matches.length > 0 && upgradeStore.blastChance > 0) {
                    setTimeout(() => { this.maybeTriggerBlast(); }, timings.blastDelay);
                }
                this.oldMatches = [...newMatches];
            }
        );
    }

    init(): void {
        this.grid.cells.forEach(cell => {
            this.rootStore.statStore.addColorCount(cell.name, 1);
        });
    }

    get info() {
        return {
            grid: this.grid,
            selectedCell: this.grid.selectedCell,
            canMove: this.grid.canMove,
            hintCells: this.hintCells
        };
    }

    showHint = () => {
        this.clearHint();
        const hint = this.grid.findHint();
        if (hint) {
            this.hintCells = hint;
            // Автоматически скрываем подсказку через 3 секунды
            this.hintTimeout = setTimeout(() => {
                runInAction(() => {
                    this.hintCells = null;
                });
            }, 3000);
        } else {
            // Нет доступных ходов - перемешиваем
            this.reset();
        }
    };

    clearHint = () => {
        this.hintCells = null;
    };

    reset = () => {
        this.clearHint();
        this.grid = new Grid(squareSize);
        this.rebuildStatsFromGrid();
        this.schedulePersist(true);
    };

    select = (x: number, y: number) => {
        this.clearHint();
        const selectedCell = this.grid.selectedCell;
        let sc: SimpleCell | null = null;
        if (selectedCell !== null) {
            sc = { x: selectedCell.x, y: selectedCell.y };
        }
        if (this.grid.select(x, y)) {
            if (sc !== null) {
                this.grid.invertCellsPosition(sc.x, sc.y, x, y);
                let matches: MatchResult = this.grid.getGridMatch(false);
                const timings = this.rootStore.upgradeStore.animationTimings;
                if (matches.cellsToRemove.length === 0) {
                    setTimeout(() => {
                        runInAction(() => {
                            if (sc !== null) {
                                this.grid.invertCellsPosition(x, y, sc.x, sc.y);
                            }
                            this.grid.canMove = true;
                        });
                    }, timings.revertDelay);
                } else if (matches.cellsToRemove.length > 0) {
                    setTimeout(() => {
                        runInAction(() => {
                            this.matches = this.matches.concat(matches.matches);
                        });
                    }, timings.highlightDelay);
                    setTimeout(() => {
                        this.removeMatches(matches.cellsToRemove);
                    }, timings.resolveDelay);
                } else {
                    runInAction(() => {
                        this.grid.canMove = true;
                    });
                }
            } else {
                runInAction(() => {
                    this.grid.canMove = true;
                });
            }
        }
    };

    countMatch(match: Match): void {
        this.matches.push(match);
    }

    getMatch(isCombo: boolean = false): MatchResult {
        return this.grid.getGridMatch(isCombo);
    }

    private maybeTriggerBlast(): void {
        const upgradeStore = this.rootStore.upgradeStore;
        const chance = upgradeStore.blastChance;
        if (chance <= 0 || Math.random() > chance) {
            return;
        }

        const radius = Math.max(1, upgradeStore.blastRadius);
        const availableCells = this.grid.cells;
        if (availableCells.length === 0) {
            return;
        }

        const target = availableCells[Math.floor(Math.random() * availableCells.length)];
        if (!target) {
            return;
        }

        const affected: SimpleCell[] = [];
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.abs(dx) + Math.abs(dy) > radius) {
                    continue;
                }
                const x = target.x + dx;
                const y = target.y + dy;
                if (x < 0 || y < 0) {
                    continue;
                }
                const cell = this.grid.get(x, y);
                if (cell !== null && !affected.some(item => item.x === x && item.y === y)) {
                    affected.push({ x, y });
                }
            }
        }

        if (affected.length === 0) {
            return;
        }

        void audioService.play('dragonBlast');
        const timings = upgradeStore.animationTimings;
        setTimeout(() => {
            this.applyBlastReward(affected.length);
            this.removeMatches(affected);
        }, Math.max(100, timings.highlightDelay));
    }

    private applyBlastReward(clearedCells: number): void {
        if (clearedCells <= 0) {
            return;
        }
        const upgradeStore = this.rootStore.upgradeStore;
        const base = clearedCells * 2 + upgradeStore.flatRewardBonus;
        const payout = Math.max(2, Math.round(base * upgradeStore.coinRewardMultiplier));
        void this.rootStore.currencyStore.addCoins(payout);
    }

    removeMatches(simpleCells: SimpleCell[]): void {
        simpleCells.forEach(match => {
            const cell = this.grid.get(match.x, match.y);
            if (cell !== null) {
                this.rootStore.statStore.addColorCount(cell.name, -1);
            }
        });
        const newCells = this.grid.removeMatches(simpleCells);
        newCells.forEach(c => {
            this.rootStore.statStore.addColorCount(c.name, 1);
        });
        const timings = this.rootStore.upgradeStore.animationTimings;
        
        setTimeout(() => {
            runInAction(() => {
                this.grid.moveNewCells();
            });
            this.schedulePersist();
        }, timings.dropDelay);
        
        const newMatches: MatchResult = this.grid.getGridMatch(true);
        if (newMatches.cellsToRemove.length > 0) {
            setTimeout(() => {
                runInAction(() => {
                    this.matches = this.matches.concat(newMatches.matches);
                });
            }, timings.comboQueueDelay);
            setTimeout(() => {
                this.removeMatches(newMatches.cellsToRemove);
            }, timings.comboResolveDelay);
        } else {
            setTimeout(() => {
                runInAction(() => {
                    this.grid.canMove = true;
                });
                this.schedulePersist();
            }, timings.unlockDelay);
        }
    }
}
