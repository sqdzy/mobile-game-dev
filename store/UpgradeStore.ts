import AsyncStorage from '@react-native-async-storage/async-storage';
import { action, computed, makeObservable, observable, ObservableMap, runInAction } from 'mobx';
import { PURCHASE_SOUND, UPGRADE_DEFINITIONS, UpgradeDefinition, UpgradeId } from '../constants/Upgrades';
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
    blastDelay: number;
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
            flatRewardBonus: computed,
            blastChance: computed,
            upgradeDiscount: computed,
            animationReduction: computed,
            blastRadius: computed,
            animationTimings: computed,
            loadState: action.bound,
            applyRemoteLevels: action.bound,
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
        const def = this.getDefinition('royal-ledger');
        if (!def) {
            return 1;
        }
        const level = this.getLevel('royal-ledger');
        return 1 + def.valuePerLevel * level;
    }

    get comboBonusCoins(): number {
        const def = this.getDefinition('battle-horns');
        if (!def) {
            return 0;
        }
        const level = this.getLevel('battle-horns');
        return level * def.valuePerLevel;
    }

    get flatRewardBonus(): number {
        const def = this.getDefinition('guild-patrons');
        if (!def) {
            return 0;
        }
        const level = this.getLevel('guild-patrons');
        return level * def.valuePerLevel;
    }

    get blastChance(): number {
        const def = this.getDefinition('dragon-siege');
        if (!def) {
            return 0;
        }
        const level = this.getLevel('dragon-siege');
        const chance = level * def.valuePerLevel;
        return Math.min(0.5, chance);
    }

    get upgradeDiscount(): number {
        const def = this.getDefinition('architects-council');
        if (!def) {
            return 0;
        }
        const level = this.getLevel('architects-council');
        const total = level * def.valuePerLevel;
        return Math.min(0.6, total);
    }

    get animationReduction(): number {
        const def = this.getDefinition('chronomancer-hourglass');
        if (!def) {
            return 0;
        }
        const level = this.getLevel('chronomancer-hourglass');
        return level * def.valuePerLevel;
    }

    get animationTimings(): AnimationTimings {
        const reduction = this.animationReduction;

        const clamp = (base: number, min: number = 80) => Math.max(min, base - reduction);

        return {
            highlightDelay: clamp(110, 70),
            resolveDelay: clamp(520, 300),
            dropDelay: clamp(180, 90),
            comboQueueDelay: clamp(720, 420),
            comboResolveDelay: clamp(880, 540),
            unlockDelay: clamp(420, 240),
            revertDelay: clamp(620, 340),
            blastDelay: clamp(560, 320),
        };
    }

    get blastRadius(): number {
        const level = this.getLevel('dragon-siege');
        if (level <= 0) {
            return 0;
        }
        return 1 + Math.floor(level / 2);
    }

    get purchaseSound(): number {
        return PURCHASE_SOUND;
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
                        const definition = this.getDefinition(id);
                        if (sanitized > 0 && definition) {
                            this.levelMap.set(id, Math.min(sanitized, definition.maxLevel));
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
        this.rootStore.authStore?.scheduleSync('upgrade');
    }

    getNextCost(id: UpgradeId): number {
        const def = this.getDefinition(id);
        if (!def) {
            return Number.MAX_SAFE_INTEGER;
        }
        const level = this.getLevel(id);
        const cost = def.baseCost * Math.pow(def.costGrowth, level);
        const discountMultiplier = Math.max(0.4, 1 - this.upgradeDiscount);
        const adjusted = cost * discountMultiplier;
        return Math.max(def.baseCost, Math.round(adjusted));
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

        this.rootStore.messageStore.add(`Улучшение «${def.title}» продвигается до уровня ${currentLevel + 1}.`);

        return { success: true };
    }

    reset(): void {
        this.performLocalReset();
        void this.persist();
        this.rootStore.authStore?.scheduleSync('upgrade:reset');
    }

    getLevelSnapshot(): Record<UpgradeId, number> {
        const snapshot: Partial<Record<UpgradeId, number>> = {};
        this.levelMap.forEach((value, key) => {
            snapshot[key] = value;
        });
        return snapshot as Record<UpgradeId, number>;
    }

    async clearLocalProgress(): Promise<void> {
        this.performLocalReset();
        await this.persist();
    }

    private performLocalReset(): void {
        runInAction(() => {
            this.levelMap.clear();
            this.isLoaded = true;
        });
    }

    applyRemoteLevels(levels: Record<string, number> = {}) {
        runInAction(() => {
            this.levelMap.clear();
            (Object.entries(levels) as [UpgradeId, number][]).forEach(([id, lvl]) => {
                const safe = this.sanitizeLevel(lvl);
                if (safe > 0) {
                    this.levelMap.set(id, Math.min(safe, this.getDefinition(id)?.maxLevel ?? safe));
                }
            });
            this.isLoaded = true;
        });
        void this.persist();
    }
}
