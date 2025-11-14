import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeObservable, observable, runInAction } from 'mobx';
import Match from '../domain/Match';
import type { RootStore } from './RootStore';

const COINS_KEY = 'player_wallet_coins';

export default class CurrencyStore {
    private rootStore: RootStore;
    private loadPromise: Promise<void> | null = null;
    coins: number = 0;
    isLoaded: boolean = false;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;

        makeObservable(this, {
            coins: observable,
            isLoaded: observable,
        });

        this.loadPromise = this.loadCoins();
    }

    private async ensureLoaded() {
        if (!this.isLoaded && this.loadPromise) {
            await this.loadPromise;
        }
    }

    private async persist(value: number) {
        try {
            await AsyncStorage.setItem(COINS_KEY, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to persist coins balance', error);
        }
    }

    async loadCoins() {
        try {
            const serialized = await AsyncStorage.getItem(COINS_KEY);
            const parsed = serialized !== null ? JSON.parse(serialized) : 0;
            const safeValue = typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
            runInAction(() => {
                this.coins = Math.max(0, Math.floor(safeValue));
                this.isLoaded = true;
            });
        } catch (error) {
            console.error('Failed to load coins balance', error);
            runInAction(() => {
                this.coins = 0;
                this.isLoaded = true;
            });
        }
    }

    calculateReward(match: Match): number {
        const base = Math.max(3, match.suite + 1);
        const comboBonus = match.isCombo ? base : 0;
        const upgradeStore = this.rootStore.upgradeStore;
        const flatBonus = upgradeStore ? upgradeStore.flatRewardBonus : 0;
        const multiplier = upgradeStore ? upgradeStore.coinRewardMultiplier : 1;
        const comboFlat = match.isCombo && upgradeStore ? upgradeStore.comboBonusCoins : 0;
        const total = (base + comboBonus + comboFlat + flatBonus) * multiplier;
        return Math.max(1, Math.round(total));
    }

    async addCoins(amount: number) {
        if (!Number.isFinite(amount) || amount <= 0) {
            return;
        }

        await this.ensureLoaded();

        const increment = Math.floor(amount);
        const nextValue = this.coins + increment;

        runInAction(() => {
            this.coins = nextValue;
        });

        await this.persist(nextValue);
            this.rootStore.authStore?.scheduleSync('coins:add');
    }

    async rewardMatch(match: Match) {
        const reward = this.calculateReward(match);
        await this.addCoins(reward);
    }

    async spendCoins(amount: number): Promise<boolean> {
        if (!Number.isFinite(amount) || amount <= 0) {
            return false;
        }

        await this.ensureLoaded();

        if (this.coins < amount) {
            return false;
        }

        const decrement = Math.floor(amount);
        const nextValue = Math.max(0, this.coins - decrement);

        runInAction(() => {
            this.coins = nextValue;
        });

        await this.persist(nextValue);
        this.rootStore.authStore?.scheduleSync('coins:spend');
        return true;
    }

    setRemoteBalance(value: number) {
        const safeValue = Math.max(0, Math.floor(value ?? 0));
        runInAction(() => {
            this.coins = safeValue;
            this.isLoaded = true;
        });
        void this.persist(safeValue);
    }

    async resetLocalProgress(): Promise<void> {
        await this.ensureLoaded();
        runInAction(() => {
            this.coins = 0;
            this.isLoaded = true;
        });
        await this.persist(0);
    }
}