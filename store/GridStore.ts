import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";
import Grid, { MatchResult } from "../domain/Grid";
import Match from "../domain/Match";
import type { RootStore } from "./RootStore";

const squareSize = 8;

interface SimpleCell {
    x: number;
    y: number;
}

export default class GridStore {
    private rootStore: RootStore;
    matches: Match[] = [];
    oldMatches: Match[] = [];
    grid: Grid;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        this.grid = new Grid(squareSize);
        
        makeObservable(this, {
            matches: observable,
            oldMatches: observable,
            grid: observable,
            info: computed,
            reset: action,
            select: action,
            countMatch: action.bound,
            getMatch: action.bound,
            removeMatches: action.bound,
        });
        
        this.init();
        this.setupReactions();
    }

    setupReactions(): void {
        reaction(
            () => this.matches,
            (newMatches: Match[]) => {
                const matches = newMatches.filter(x => !this.oldMatches.includes(x));
                const { resolveDelay } = this.rootStore.upgradeStore.animationTimings;
                matches.forEach(match => {
                    // Задержка для логирования после анимации
                    setTimeout(
                        () => { this.rootStore.messageStore.addMatch(match); },
                        resolveDelay
                    );
                    if (match.suite === 2) {
                        setTimeout(
                            () => { this.rootStore.statStore.addMatch3(); },
                            resolveDelay
                        );
                    }
                    if (match.suite === 3) {
                        setTimeout(
                            () => { this.rootStore.statStore.addMatch4(); },
                            resolveDelay
                        );
                    }
                    if (match.suite === 4) {
                        setTimeout(
                            () => { this.rootStore.statStore.addMatch5(); },
                            resolveDelay
                        );
                    }
                    setTimeout(
                        () => { this.rootStore.statStore.addColor(match.color, match.suite + 1); },
                        resolveDelay
                    );
                    setTimeout(
                        () => { void this.rootStore.currencyStore.rewardMatch(match); },
                        resolveDelay
                    );
                });
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
            canMove: this.grid.canMove
        };
    }

    reset = () => {
        this.rootStore.statStore.reset();
        this.grid = new Grid(squareSize);
        this.grid.cells.forEach(cell => {
            this.rootStore.statStore.addColorCount(cell.name, 1);
        });
        this.rootStore.messageStore.add('Reset');
    };

    select = (x: number, y: number) => {
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
                    // Возврат назад если нет совпадений
                    setTimeout(() => {
                        runInAction(() => {
                            if (sc !== null) {
                                this.grid.invertCellsPosition(x, y, sc.x, sc.y);
                            }
                            this.grid.canMove = true;
                        });
                    }, timings.revertDelay);
                } else if (matches.cellsToRemove.length > 0) {
                    // Задержка перед удалением для анимации
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
        // Задержка для анимации падения
        setTimeout(() => {
            runInAction(() => {
                this.grid.moveNewCells();
            });
        }, timings.dropDelay);
        
        // Проверка комбо после завершения падения
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
            // Даем время для завершения анимации
            setTimeout(() => {
                runInAction(() => {
                    this.grid.canMove = true;
                });
            }, timings.unlockDelay);
        }
    }
}
