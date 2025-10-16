import { Audio } from 'expo-av';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MedievalIcon, type MedievalIconName } from '@/components/ui/MedievalIcon';
import { useRootStore } from '@/store/RootStore';
import type { UpgradeSnapshot } from '@/store/UpgradeStore';

const UpgradeHallScreen: React.FC = () => {
  const rootStore = useRootStore();
  const { currencyStore, upgradeStore } = rootStore;
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isSoundReady, setSoundReady] = useState(false);

  const upgrades: UpgradeSnapshot[] = upgradeStore.catalog;
  const {
    coinRewardMultiplier,
    flatRewardBonus,
    animationReduction,
    blastChance,
    upgradeDiscount,
  } = upgradeStore;

  const headerHighlights = useMemo(
    () => [
      { key: 'multiplier', label: 'Множитель', value: `x${coinRewardMultiplier.toFixed(2)}` },
      {
        key: 'flat',
        label: 'Покровители',
        value: flatRewardBonus > 0 ? `+${flatRewardBonus}` : '—',
      },
      {
        key: 'rituals',
        label: 'Ритуалы',
        value: animationReduction > 0 ? `-${animationReduction} мс` : '—',
      },
      {
        key: 'dragon',
        label: 'Дракон',
        value: blastChance > 0 ? `${Math.round(blastChance * 100)}%` : '—',
      },
      {
        key: 'discount',
        label: 'Скидка',
        value: upgradeDiscount > 0 ? `-${Math.round(upgradeDiscount * 100)}%` : '—',
      },
    ],
    [animationReduction, blastChance, coinRewardMultiplier, flatRewardBonus, upgradeDiscount]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: upgradeStore.purchaseSoundUrl });
        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        setSoundReady(true);
      } catch (error) {
        console.error('Failed to load purchase sound', error);
      }
    })();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [upgradeStore.purchaseSoundUrl]);

  const playPurchaseSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.error('Failed to play purchase sound', error);
    }
  };

  const handlePurchase = async (upgrade: UpgradeSnapshot) => {
    const result = await upgradeStore.purchase(upgrade.id);
    if (result.success) {
      setStatus({ tone: 'success', message: `«${upgrade.title}» возвышается до уровня ${upgrade.level + 1}.` });
      if (isSoundReady) {
        await playPurchaseSound();
      }
      return;
    }

    let message = 'Неизвестная ошибка при покупке.';
    if (result.reason === 'insufficient_funds') {
      message = 'Казна пока не тянет такую роскошь. Соберите больше сокровищ!';
    } else if (result.reason === 'max_level') {
      message = 'Улучшение достигло вершины мастерства.';
    } else if (result.reason === 'not_loaded') {
      message = 'Башня улучшений ещё собирает хроники. Попробуйте чуть позже.';
    }
    setStatus({ tone: 'error', message });
  };

  if (!upgradeStore.isLoaded || !currencyStore.isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f8d9a0" />
        <Text style={styles.loadingText}>Башня улучшений оживает...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.walletRow}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Королевская казна</Text>
            <Text style={styles.walletValue}>{currencyStore.isLoaded ? currencyStore.coins : '...'}</Text>
            <Text style={styles.walletHint}>
              Скидка: {Math.round(upgradeDiscount * 100)}% • Дракон: {Math.round(blastChance * 100)}%
            </Text>
          </View>
          <View style={styles.walletIcon}>
            <MedievalIcon name="coin-purse" size={64} color="#f8d9a0" accentColor="#7b4f1d" />
          </View>
        </View>
        <Text style={styles.heroTitle}>Башня улучшений</Text>
        <Text style={styles.heroSubtitle}>
          Развивайте владения, чтобы увеличить добычу монет, ускорить ритуалы и призвать новых союзников на поле.
        </Text>
        <View style={styles.highlightRow}>
          {headerHighlights.map(item => (
            <View key={item.key} style={styles.highlightCard}>
              <Text style={styles.highlightValue}>{item.value}</Text>
              <Text style={styles.highlightLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {status ? (
        <View
          style={[
            styles.statusBanner,
            status.tone === 'success' ? styles.statusSuccess : null,
            status.tone === 'error' ? styles.statusError : null,
          ]}
        >
          <Text style={styles.statusText}>{status.message}</Text>
        </View>
      ) : null}

      {upgrades.map((upgrade: UpgradeSnapshot) => (
        <View key={upgrade.id} style={styles.upgradeCard}>
          <View style={styles.upgradeIconWrap}>
            <MedievalIcon
              name={upgrade.heroIcon as MedievalIconName}
              size={72}
              color="#f8d9a0"
              accentColor="#7b4f1d"
            />
          </View>
          <View style={styles.upgradeContent}>
            <View style={styles.upgradeHeader}>
              <Text style={styles.upgradeTitle}>{upgrade.title}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Ур. {upgrade.level}</Text>
              </View>
            </View>
            <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
            <View style={styles.effectRow}>
              <MedievalIcon
                name={getEffectIcon(upgrade.effectType)}
                size={22}
                color="#f8d9a0"
                accentColor="#7b4f1d"
              />
              <Text style={styles.effectText}>
                {renderEffectLabel(upgrade)}
              </Text>
            </View>
            <Pressable
              disabled={upgrade.isMaxed}
              onPress={() => handlePurchase(upgrade)}
              style={({ pressed }) => [
                styles.purchaseButton,
                upgrade.isMaxed && styles.purchaseButtonDisabled,
                pressed && !upgrade.isMaxed ? styles.purchaseButtonPressed : null,
              ]}
            >
              <Text style={styles.purchaseButtonText}>
                {upgrade.isMaxed ? 'Достигнут предел' : `Улучшить за ${upgrade.nextCost} монет`}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.mediaNote}>
        <Text style={styles.mediaNoteTitle}>Совет летописца</Text>
        <Text style={styles.mediaNoteText}>
          Звуковой сигнал подтверждает рождение нового улучшения и наполняет башню духом прогресса.
        </Text>
        <Text style={styles.mediaNoteText}>
          Улучшения усиливают добычу монет, ускоряют ритуалы и пробуждают драконов, влияя на поле боя в реальном времени.
        </Text>
      </View>
    </ScrollView>
  );
};

function renderEffectLabel(upgrade: UpgradeSnapshot): string {
  switch (upgrade.effectType) {
    case 'coinMultiplier':
      return `+${Math.round(upgrade.valuePerLevel * 100)}% к добыче (текущее x${(1 + upgrade.valuePerLevel * upgrade.level).toFixed(2)})`;
    case 'comboFlatBonus':
      return `+${upgrade.valuePerLevel} монет за каждую комбо-цепочку`;
    case 'animationSpeed':
      return `-${upgrade.valuePerLevel} мс к задержкам ритуалов`;
    case 'flatReward':
      return `+${upgrade.valuePerLevel} монет за каждую добытую руну`;
    case 'blastChance':
      return `${Math.round(upgrade.valuePerLevel * 100)}% шанс огненного залпа за уровень`;
    case 'discount':
      return `-${Math.round(upgrade.valuePerLevel * 100)}% к стоимости последующих улучшений`;
    default:
      return '';
  }
}

function getEffectIcon(effectType: UpgradeSnapshot['effectType']): MedievalIconName {
  switch (effectType) {
    case 'coinMultiplier':
      return 'coin-purse';
    case 'comboFlatBonus':
      return 'horn';
    case 'animationSpeed':
      return 'hourglass';
    case 'flatReward':
      return 'artisan-hammer';
    case 'blastChance':
      return 'dragon-fire';
    case 'discount':
      return 'tower';
    default:
      return 'upgrade-scroll';
  }
}

export default observer(UpgradeHallScreen);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 18,
    backgroundColor: '#0f0a07',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f0a07',
  },
  loadingText: {
    marginTop: 12,
    color: '#f8d9a0',
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: '#24140b',
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletInfo: {
    gap: 4,
  },
  walletLabel: {
    color: '#f3d7a3',
    fontSize: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  walletValue: {
    color: '#fbead4',
    fontSize: 34,
    fontWeight: 'bold',
  },
  walletHint: {
    color: '#d2b48c',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  walletIcon: {
    backgroundColor: '#1a0f06',
    borderRadius: 48,
    padding: 12,
  },
  heroTitle: {
    color: '#fbead4',
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    color: '#d2b48c',
    marginTop: 6,
    fontSize: 14,
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  highlightCard: {
    backgroundColor: '#1a0f06',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 98,
  },
  highlightValue: {
    color: '#fbead4',
    fontSize: 15,
    fontWeight: '700',
  },
  highlightLabel: {
    color: '#b6946c',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  statusBanner: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#3b2717',
  },
  statusSuccess: {
    backgroundColor: '#32543a',
  },
  statusError: {
    backgroundColor: '#5a2a2a',
  },
  statusText: {
    color: '#fbead4',
    fontSize: 14,
  },
  upgradeCard: {
    backgroundColor: '#24140b',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    gap: 18,
    elevation: 4,
    shadowColor: '#1a0f06',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  upgradeIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#1a0f06',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeContent: {
    flex: 1,
    gap: 10,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbead4',
  },
  levelBadge: {
    backgroundColor: '#3b2717',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f3d7a3',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#d2b48c',
  },
  effectRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  effectText: {
    fontSize: 13,
    color: '#f3d7a3',
    flex: 1,
    flexWrap: 'wrap',
  },
  purchaseButton: {
    backgroundColor: '#6b3f1a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#433023',
  },
  purchaseButtonPressed: {
    opacity: 0.85,
  },
  purchaseButtonText: {
    color: '#fbead4',
    fontSize: 14,
    fontWeight: '600',
  },
  mediaNote: {
    backgroundColor: '#24140b',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  mediaNoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbead4',
  },
  mediaNoteText: {
    fontSize: 14,
    color: '#d2b48c',
  },
});
