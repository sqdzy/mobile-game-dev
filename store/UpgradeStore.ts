import AsyncStorage from '@react-native-async-storage/async-storage';
import { action, computed, makeObservable, observable, ObservableMap, runInAction } from 'mobx';
import { PURCHASE_SOUND_URL, UPGRADE_DEFINITIONS, UpgradeDefinition, UpgradeId } from '../constants/Upgrades';
import type { RootStore } from './RootStore';

const STORAGE_KEY = 'player_upgrade_levels_v1';

export interface UpgradeSnapshot extends UpgradeDefinition {
    level: number;
    nextCost: number | null;
    isMaxed: boolean;
}

export interface PurchaseResult {
    success: boolean;
    reason?: 'not_loaded' | 'max_level' | 'insufficient_funds' | 'unknown_upgrade';
}

interface AnimationTimings {
    highlightDelay: number;
    resolveDelay: number;
    dropDelay: number;
    comboQueueDelay: number;
    comboResolveDelay: number;
    unlockDelay: number;
    revertDelay: number;
}

export default class UpgradeStore {
    private rootStore: RootStore;
    levelMap: ObservableMap<UpgradeId, number>;
    isLoaded: boolean = false;
    isSyncing: boolean = false;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        this.levelMap = observable.map<UpgradeId, number>([]);

        makeObservable(this, {
            levelMap: observable.shallow,
            isLoaded: observable,
            isSyncing: observable,
            catalog: computed,
            coinRewardMultiplier: computed,
            comboBonusCoins: computed,
            animationTimings: computed,
            loadState: action.bound,
        });

        void this.loadState();
    }

    get catalog(): UpgradeSnapshot[] {
        return UPGRADE_DEFINITIONS.map(def => {
            const level = this.getLevel(def.id);
            const nextCost = level >= def.maxLevel ? null : this.getNextCost(def.id);
            return {
                ...def,
                level,
                nextCost,
                isMaxed: level >= def.maxLevel,
            };
        });
    }

    get coinRewardMultiplier(): number {
        const def = this.getDefinition('coin-magnet');
        if (!def) {
            return 1;
        }
        const level = this.getLevel('coin-magnet');
        return 1 + def.valuePerLevel * level;
    }

    get comboBonusCoins(): number {
        const def = this.getDefinition('combo-charger');
        if (!def) {
            return 0;
        }
        const level = this.getLevel('combo-charger');
        return level * def.valuePerLevel;
    }

    get animationTimings(): AnimationTimings {
        const def = this.getDefinition('quantum-refinery');
        const level = def ? this.getLevel('quantum-refinery') : 0;
        const reduction = (def?.valuePerLevel ?? 0) * level;

        const clamp = (base: number, min: number = 80) => Math.max(min, base - reduction);

        return {
            highlightDelay: clamp(100, 60),
            resolveDelay: clamp(500, 280),
            dropDelay: clamp(150, 80),
            comboQueueDelay: clamp(700, 400),
            comboResolveDelay: clamp(850, 520),
            unlockDelay: clamp(400, 220),
            revertDelay: clamp(600, 320),
        };
    }

    get purchaseSoundUrl(): string {
        return PURCHASE_SOUND_URL;
    }

    private getDefinition(id: UpgradeId): UpgradeDefinition | undefined {
        return UPGRADE_DEFINITIONS.find(item => item.id === id);
    }

    private async ensureLoaded(): Promise<boolean> {
        if (this.isLoaded) {
            return true;
        }
        await this.loadState();
        return this.isLoaded;
    }

    private sanitizeLevel(level: unknown): number {
        if (typeof level !== 'number' || !Number.isFinite(level)) {
            return 0;
        }
        return Math.max(0, Math.floor(level));
    }

    async loadState(): Promise<void> {
        if (this.isLoaded || this.isSyncing) {
            return;
        }

        this.isSyncing = true;
        try {
            const serialized = await AsyncStorage.getItem(STORAGE_KEY);
            if (serialized) {
                const parsed = JSON.parse(serialized) as Record<string, number>;
                runInAction(() => {
                    (Object.entries(parsed) as [UpgradeId, number][]).forEach(([id, lvl]) => {
                        const sanitized = this.sanitizeLevel(lvl);
                        if (sanitized > 0) {
                            this.levelMap.set(id, Math.min(sanitized, this.getDefinition(id)?.maxLevel ?? sanitized));
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Failed to load upgrade levels', error);
        } finally {
            runInAction(() => {
                this.isLoaded = true;
                this.isSyncing = false;
            });
        }
    }

    private async persist(): Promise<void> {
        const payload: Record<UpgradeId, number> = {} as Record<UpgradeId, number>;
        this.levelMap.forEach((level, id) => {
            if (level > 0) {
                payload[id] = level;
            }
        });
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            console.error('Failed to persist upgrade levels', error);
        }
    }

    getLevel(id: UpgradeId): number {
        return this.levelMap.get(id) ?? 0;
    }

    private setLevel(id: UpgradeId, level: number) {
        if (level <= 0) {
            this.levelMap.delete(id);
        } else {
            this.levelMap.set(id, Math.min(level, this.getDefinition(id)?.maxLevel ?? level));
        }
    }

    getNextCost(id: UpgradeId): number {
        const def = this.getDefinition(id);
        if (!def) {
            return Number.MAX_SAFE_INTEGER;
        }
        const level = this.getLevel(id);
        const cost = def.baseCost * Math.pow(def.costGrowth, level);
        return Math.max(def.baseCost, Math.round(cost));
    }

    async purchase(id: UpgradeId): Promise<PurchaseResult> {
        const loaded = await this.ensureLoaded();
        if (!loaded) {
            return { success: false, reason: 'not_loaded' };
        }

        const def = this.getDefinition(id);
        if (!def) {
            return { success: false, reason: 'unknown_upgrade' };
        }

        const currentLevel = this.getLevel(id);
        if (currentLevel >= def.maxLevel) {
            return { success: false, reason: 'max_level' };
        }

        const price = this.getNextCost(id);
        const withdrawn = await this.rootStore.currencyStore.spendCoins(price);
        if (!withdrawn) {
            return { success: false, reason: 'insufficient_funds' };
        }

        runInAction(() => {
            this.setLevel(id, currentLevel + 1);
        });

        await this.persist();

        this.rootStore.messageStore.add(`Upgrade ${def.title} приобретается (уровень ${currentLevel + 1})`);

        return { success: true };
    }

    reset(): void {
        runInAction(() => {
            this.levelMap.clear();
        });
        void this.persist();
    }
}
