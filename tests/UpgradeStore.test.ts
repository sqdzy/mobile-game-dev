import type { RootStore } from '@/store/RootStore';
import UpgradeStore from '@/store/UpgradeStore';

describe('UpgradeStore cost calculations', () => {
  function createStore(): UpgradeStore {
    const rootStub: Partial<RootStore> = {
      currencyStore: {
        spendCoins: jest.fn(),
        addCoins: jest.fn(),
        rewardMatch: jest.fn(),
      } as any,
      messageStore: {
        add: jest.fn(),
      } as any,
      statStore: {
        addMatch3: jest.fn(),
        addMatch4: jest.fn(),
        addMatch5: jest.fn(),
        addColor: jest.fn(),
        addColorCount: jest.fn(),
      } as any,
    };

    const store = new UpgradeStore(rootStub as RootStore);
    (rootStub as any).upgradeStore = store;
    return store;
  }

  it('returns base cost for fresh upgrade', () => {
    const store = createStore();
    const price = store.getNextCost('royal-ledger');
    expect(price).toBe(80);
  });

  it('applies growth and discount correctly', () => {
    const store = createStore();
    (store as any).setLevel('royal-ledger', 1);
    (store as any).setLevel('architects-council', 2); // 10% discount

    const price = store.getNextCost('royal-ledger');
    const base = 80 * Math.pow(1.55, 1);
    const expected = Math.max(80, Math.round(base * 0.9));
    expect(price).toBe(expected);
  });

  it('caps discount multiplier at minimum threshold', () => {
    const store = createStore();
    (store as any).setLevel('architects-council', 20); // would exceed cap without clamp

    const price = store.getNextCost('royal-ledger');
    const base = 80 * Math.pow(1.55, 0);
    const expected = Math.max(80, Math.round(base * 0.4));
    expect(price).toBe(expected);
  });

  it('computes coin reward multiplier from levels', () => {
    const store = createStore();
    (store as any).setLevel('royal-ledger', 3);
    expect(store.coinRewardMultiplier).toBeCloseTo(1 + 0.15 * 3, 5);
  });
});
