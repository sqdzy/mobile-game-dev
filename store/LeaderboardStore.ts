import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { LeaderboardEntryResponse, leaderboardRequest } from '@/services/api';
import type { RootStore } from './RootStore';

export interface LeaderboardEntry extends LeaderboardEntryResponse {
  rank: number;
  isPlayer: boolean;
}

type LeaderboardStatus = 'idle' | 'loading' | 'error';

export default class LeaderboardStore {
  private rootStore: RootStore;
  entries: LeaderboardEntry[] = [];
  status: LeaderboardStatus = 'idle';
  error: string | null = null;
  lastFetchedAt: number | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    makeObservable(this, {
      entries: observable.shallow,
      status: observable,
      error: observable,
      lastFetchedAt: observable,
      isLoading: computed,
      hasEntries: computed,
      fetchLeaderboard: action.bound,
      reset: action.bound,
    });
  }

  get isLoading(): boolean {
    return this.status === 'loading';
  }

  get hasEntries(): boolean {
    return this.entries.length > 0;
  }

  async fetchLeaderboard(force: boolean = false): Promise<void> {
    const authStore = this.rootStore.authStore;
    if (!authStore?.isAuthenticated) {
      runInAction(() => {
        this.entries = [];
        this.status = 'idle';
        this.error = null;
      });
      return;
    }

    if (this.status === 'loading' && !force) {
      return;
    }

    runInAction(() => {
      this.status = 'loading';
      this.error = null;
    });

    try {
      const response = await leaderboardRequest(authStore.token!, 25);
      const nickname = authStore.playerNickname;
      runInAction(() => {
        this.entries = response.entries.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          isPlayer: nickname ? entry.nickname === nickname : false,
        }));
        this.status = 'idle';
        this.lastFetchedAt = Date.now();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось получить таблицу лидеров.';
      runInAction(() => {
        this.status = 'error';
        this.error = message;
      });
    }
  }

  reset(): void {
    this.entries = [];
    this.status = 'idle';
    this.error = null;
    this.lastFetchedAt = null;
  }
}
