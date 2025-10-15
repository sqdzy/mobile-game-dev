import { Ionicons } from '@expo/vector-icons';
import { Audio, ResizeMode, Video } from 'expo-av';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRootStore } from '@/store/RootStore';
import type { UpgradeSnapshot } from '@/store/UpgradeStore';

const TycoonScreen: React.FC = () => {
  const rootStore = useRootStore();
  const { currencyStore, upgradeStore } = rootStore;
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isSoundReady, setSoundReady] = useState(false);

  const upgrades: UpgradeSnapshot[] = upgradeStore.catalog;
  const heroVideo = upgrades[0]?.previewVideo;

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
      setStatus({ tone: 'success', message: `«${upgrade.title}» улучшено до уровня ${upgrade.level + 1}.` });
      if (isSoundReady) {
        await playPurchaseSound();
      }
      return;
    }

    let message = 'Неизвестная ошибка при покупке.';
    if (result.reason === 'insufficient_funds') {
      message = 'Недостаточно монет. Продолжайте собирать комбинации!';
    } else if (result.reason === 'max_level') {
      message = 'Улучшение уже достигло максимального уровня.';
    } else if (result.reason === 'not_loaded') {
      message = 'Загрузка улучшений не завершена. Попробуйте ещё раз.';
    }
    setStatus({ tone: 'error', message });
  };

  if (!upgradeStore.isLoaded || !currencyStore.isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Загрузка рынка улучшений...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.walletRow}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Баланс</Text>
            <Text style={styles.walletValue}>{currencyStore.isLoaded ? currencyStore.coins : '...'}</Text>
          </View>
          <Ionicons name="logo-usd" size={40} color="#FFD700" />
        </View>
        {heroVideo ? (
          <Video
            style={styles.heroVideo}
            source={{ uri: heroVideo }}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted
          />
        ) : null}
        <Text style={styles.heroTitle}>Factory Tycoon</Text>
        <Text style={styles.heroSubtitle}>
          Инвестируйте монеты в инфраструктуру и умножайте прибыль от матчей.
        </Text>
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
          <Image source={upgrade.heroImage} style={styles.upgradeImage} />
          <View style={styles.upgradeContent}>
            <View style={styles.upgradeHeader}>
              <Text style={styles.upgradeTitle}>{upgrade.title}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv. {upgrade.level}</Text>
              </View>
            </View>
            <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
            <View style={styles.effectRow}>
              <Ionicons name={upgrade.icon as any} size={18} color="#2196F3" />
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
                {upgrade.isMaxed ? 'Максимум' : `Улучшить за ${upgrade.nextCost} монет`}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.mediaNote}>
        <Text style={styles.mediaNoteTitle}>Мультимедиа-центр</Text>
        <Text style={styles.mediaNoteText}>
          Видео демонстрирует производство энергии, а звуковой эффект подтверждает покупку.
        </Text>
        <Text style={styles.mediaNoteText}>
          Улучшения напрямую увеличивают награды и ускоряют падение блоков в основной игре.
        </Text>
      </View>
    </ScrollView>
  );
};

function renderEffectLabel(upgrade: UpgradeSnapshot): string {
  switch (upgrade.effectType) {
    case 'coinMultiplier':
      return `+${Math.round(upgrade.valuePerLevel * 100)}% монет за уровень (x${(1 + upgrade.valuePerLevel * upgrade.level).toFixed(2)})`;
    case 'comboFlatBonus':
      return `+${upgrade.valuePerLevel} монет за каждую комбо-цепочку`;
    case 'animationSpeed':
      return `-${upgrade.valuePerLevel} мс к задержкам анимаций`;
    default:
      return '';
  }
}

export default observer(TycoonScreen);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 12,
    color: '#E0E7FF',
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: '#121E2F',
    borderRadius: 16,
    padding: 16,
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
    color: '#A0AEC0',
    fontSize: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  walletValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  heroVideo: {
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    color: '#CBD5F5',
    marginTop: 4,
    fontSize: 14,
  },
  statusBanner: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#E2E8F0',
  },
  statusSuccess: {
    backgroundColor: '#C6F6D5',
  },
  statusError: {
    backgroundColor: '#FED7D7',
  },
  statusText: {
    color: '#1A202C',
    fontSize: 14,
  },
  upgradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  upgradeImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  upgradeContent: {
    flex: 1,
    gap: 8,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  levelBadge: {
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#4A5568',
  },
  effectRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  effectText: {
    fontSize: 13,
    color: '#2B6CB0',
  },
  purchaseButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  purchaseButtonPressed: {
    opacity: 0.85,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mediaNote: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  mediaNoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  mediaNoteText: {
    fontSize: 14,
    color: '#4A5568',
  },
});
