import { createContext, useContext } from 'react';
import AuthStore from "./AuthStore";
import CurrencyStore from "./CurrencyStore";
import GridStore from "./GridStore";
import LeaderboardStore from "./LeaderboardStore";
import MessageStore from "./MessageStore";
import StatStore from "./StatStore";
import UpgradeStore from "./UpgradeStore";

export class RootStore {
    gridStore: GridStore;
    messageStore: MessageStore;
    statStore: StatStore;
    currencyStore: CurrencyStore;
    upgradeStore: UpgradeStore;
    authStore: AuthStore;
    leaderboardStore: LeaderboardStore;
    
    constructor() {
        this.upgradeStore = new UpgradeStore(this);
        this.currencyStore = new CurrencyStore(this);
        this.messageStore = new MessageStore(this);
        this.statStore = new StatStore(this);
        this.gridStore = new GridStore(this);
        this.authStore = new AuthStore(this);
        this.leaderboardStore = new LeaderboardStore(this);
    }
}

export const RootStoreContext = createContext<RootStore | null>(null);

export function useRootStore(): RootStore {
    const context = useContext(RootStoreContext);
    if (!context) {
        throw new Error('useRootStore must be used within a RootStoreContext.Provider');
    }
    return context;
}
