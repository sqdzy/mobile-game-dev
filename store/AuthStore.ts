import AsyncStorage from '@react-native-async-storage/async-storage';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import {
    AuthResponse,
    ProfileSnapshotResponse,
    SyncPayload,
    loginRequest,
    profileRequest,
    registerRequest,
    syncRequest,
} from '@/services/api';
import type { RootStore } from './RootStore';

const TOKEN_KEY = 'auth_token_v1';
const NICKNAME_KEY = 'auth_nickname_v1';
const LAST_SYNC_AT_KEY = 'auth_last_sync_at_v1';
const LOCAL_CHANGE_AT_KEY = 'auth_local_change_at_v1';

type AuthStatus = 'idle' | 'loading' | 'error';
type SyncState = 'idle' | 'scheduled' | 'syncing' | 'error';

export default class AuthStore {
  private rootStore: RootStore;
  token: string | null = null;
  nickname: string | null = null;
  status: AuthStatus = 'idle';
  error: string | null = null;
  isReady: boolean = false;
  profile: ProfileSnapshotResponse | null = null;
  syncState: SyncState = 'idle';
  syncError: string | null = null;
  lastSyncedAt: number | null = null;
  latestLocalChangeAt: number | null = null;
  lastSyncReason: string | null = null;
  private pendingReasons: Set<string> = new Set();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    makeObservable(this, {
      token: observable,
      nickname: observable,
      status: observable,
      error: observable,
      isReady: observable,
      profile: observable.ref,
      syncState: observable,
      syncError: observable,
      lastSyncedAt: observable,
      latestLocalChangeAt: observable,
      lastSyncReason: observable,
      isAuthenticated: computed,
      playerNickname: computed,
      applyProfile: action.bound,
    });

    void this.hydrate();
  }

  get isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  get playerNickname(): string | null {
    return this.nickname ?? this.profile?.nickname ?? null;
  }

  async hydrate(): Promise<void> {
    try {
      const entries = await AsyncStorage.multiGet([
        TOKEN_KEY,
        NICKNAME_KEY,
        LAST_SYNC_AT_KEY,
        LOCAL_CHANGE_AT_KEY,
      ]);
      const map = Object.fromEntries(entries) as Record<string, string | null>;

      runInAction(() => {
        this.token = map[TOKEN_KEY] || null;
        this.nickname = map[NICKNAME_KEY] || null;
        this.lastSyncedAt = map[LAST_SYNC_AT_KEY] ? Number(map[LAST_SYNC_AT_KEY]) : null;
        this.latestLocalChangeAt = map[LOCAL_CHANGE_AT_KEY] ? Number(map[LOCAL_CHANGE_AT_KEY]) : null;
      });

      if (this.token) {
        try {
          const remoteProfile = await profileRequest(this.token);
          runInAction(() => {
            this.applyProfile(remoteProfile);
          });
        } catch (error) {
          console.warn('Не удалось восстановить сеанс, очищаем токен', error);
          await this.clearSession();
        }
      }
    } finally {
      runInAction(() => {
        this.isReady = true;
      });
    }
  }

  async register(nickname: string, password: string): Promise<void> {
    await this.authenticate('register', () => registerRequest({ nickname, password }), {
      forceUploadLocal: true,
    });
  }

  async login(nickname: string, password: string): Promise<void> {
    await this.authenticate('login', () => loginRequest({ nickname, password }));
  }

  async logout(): Promise<void> {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    await this.clearSession();
    const resetTasks: Promise<unknown>[] = [];
    resetTasks.push(this.rootStore.currencyStore.resetLocalProgress());
    resetTasks.push(this.rootStore.upgradeStore.clearLocalProgress());
    await Promise.allSettled(resetTasks);
    this.rootStore.statStore.reset();
    runInAction(() => {
      this.profile = null;
      this.syncState = 'idle';
      this.syncError = null;
      this.lastSyncReason = null;
      this.lastSyncedAt = null;
      this.latestLocalChangeAt = null;
    });
    this.pendingReasons.clear();
    this.rootStore.leaderboardStore?.reset();
  }

  async scheduleSync(reason: string, delayMs: number = 2500): Promise<void> {
    const now = Date.now();
    runInAction(() => {
      this.latestLocalChangeAt = now;
    });
    await AsyncStorage.setItem(LOCAL_CHANGE_AT_KEY, String(now));

    this.pendingReasons.add(reason);

    if (!this.isAuthenticated) {
      this.pendingReasons.clear();
      return;
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    runInAction(() => {
      this.syncState = 'scheduled';
    });

    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      const aggregatedReason = Array.from(this.pendingReasons).join(', ');
      this.pendingReasons.clear();
      void this.syncNow(aggregatedReason || reason).catch(() => undefined);
    }, delayMs);
  }

  async syncNow(reason: string = 'manual', options: { force?: boolean } = {}): Promise<void> {
    if (!this.isAuthenticated) {
      return;
    }
    if (this.syncState === 'syncing' && !options.force) {
      return;
    }

    const token = this.token!;

    runInAction(() => {
      this.syncState = 'syncing';
      this.syncError = null;
    });

    try {
      await this.ensureLocalSnapshotsReady();
      const payload = this.buildSyncPayload();
      const profile = await syncRequest(token, payload);
      runInAction(() => {
        this.applyProfile(profile);
        this.lastSyncedAt = Date.now();
        this.lastSyncReason = reason;
        this.syncState = 'idle';
      });
      this.pendingReasons.clear();
      await AsyncStorage.setItem(LAST_SYNC_AT_KEY, String(this.lastSyncedAt));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось синхронизировать данные.';
      runInAction(() => {
        this.syncState = 'error';
        this.syncError = message;
      });
      throw new Error(message);
    }
  }

  applyProfile(profile: ProfileSnapshotResponse): void {
    this.rootStore.currencyStore.setRemoteBalance(profile.coins ?? 0);
    this.rootStore.upgradeStore.applyRemoteLevels(profile.upgrades ?? {});
    this.rootStore.statStore.applyRemoteStats(profile.stats ?? {});
    this.profile = profile;
    this.nickname = profile.nickname ?? this.nickname;
  }

  private async authenticate(
    mode: 'login' | 'register',
    requestFn: () => Promise<AuthResponse>,
    options: { forceUploadLocal?: boolean } = {}
  ): Promise<void> {
    runInAction(() => {
      this.status = 'loading';
      this.error = null;
    });

    try {
      const response = await requestFn();
      await this.setSession(response.token, response.nickname);
      await this.ensureLocalSnapshotsReady();

      const shouldUploadLocal = options.forceUploadLocal || this.shouldUploadLocal(response.profile?.updatedAt);

      if (shouldUploadLocal) {
        await this.syncNow(mode === 'register' ? 'initial-register' : 'post-login', { force: true });
      } else {
        runInAction(() => {
          this.applyProfile(response.profile);
        });
      }

      runInAction(() => {
        this.status = 'idle';
      });

      this.rootStore.leaderboardStore?.fetchLeaderboard(true).catch(() => undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить запрос авторизации.';
      runInAction(() => {
        this.status = 'error';
        this.error = message;
      });
      throw new Error(message);
    }
  }

  private async setSession(token: string, nickname: string): Promise<void> {
    runInAction(() => {
      this.token = token;
      this.nickname = nickname;
    });
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [NICKNAME_KEY, nickname],
    ]);
  }

  private async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, NICKNAME_KEY, LAST_SYNC_AT_KEY, LOCAL_CHANGE_AT_KEY]);
    runInAction(() => {
      this.clearSessionState();
    });
  }

  clearSessionState(): void {
    this.token = null;
    this.nickname = null;
  }

  private buildSyncPayload(): SyncPayload {
    const upgradeSnapshot = this.rootStore.upgradeStore.getLevelSnapshot();
    const statsSnapshot = this.rootStore.statStore.getSnapshot();
    const coins = this.rootStore.currencyStore.coins;
    return {
      coins,
      upgrades: upgradeSnapshot,
      stats: statsSnapshot,
    };
  }

  private shouldUploadLocal(remoteUpdatedAt?: string | null): boolean {
    if (!this.hasLocalProgress()) {
      return false;
    }
    if (!remoteUpdatedAt) {
      return true;
    }
    const remoteTimestamp = Date.parse(remoteUpdatedAt);
    if (!this.latestLocalChangeAt) {
      return false;
    }
    if (Number.isNaN(remoteTimestamp)) {
      return true;
    }
    return this.latestLocalChangeAt > remoteTimestamp;
  }

  private hasLocalProgress(): boolean {
    const coins = this.rootStore.currencyStore.coins;
    const upgrades = this.rootStore.upgradeStore.getLevelSnapshot();
    const stats = this.rootStore.statStore.getSnapshot();
    const hasStats = Object.values(stats).some(value => typeof value === 'number' && value > 0);
    return coins > 0 || Object.keys(upgrades).length > 0 || hasStats;
  }

  private async ensureLocalSnapshotsReady(): Promise<void> {
    const loaders: Promise<unknown>[] = [];
    const { currencyStore, upgradeStore } = this.rootStore;
    if (!currencyStore.isLoaded) {
      loaders.push(currencyStore.loadCoins());
    }
    if (!upgradeStore.isLoaded) {
      loaders.push(upgradeStore.loadState());
    }
    if (loaders.length > 0) {
      await Promise.allSettled(loaders);
    }
  }
}
