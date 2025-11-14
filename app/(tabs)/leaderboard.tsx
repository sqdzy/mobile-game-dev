import { useFocusEffect, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MedievalIcon } from '@/components/ui/MedievalIcon';
import type { LeaderboardEntry } from '@/store/LeaderboardStore';
import { useRootStore } from '@/store/RootStore';

const LeaderboardScreen: React.FC = () => {
  const router = useRouter();
  const { authStore, leaderboardStore, currencyStore } = useRootStore();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (authStore.isAuthenticated) {
        leaderboardStore.fetchLeaderboard().catch(() => undefined);
      }
    }, [authStore.isAuthenticated, leaderboardStore])
  );

  const handleRefresh = useCallback(() => {
    if (!authStore.isAuthenticated) {
      setStatusMessage('Войдите, чтобы увидеть таблицу героев.');
      return;
    }
    setStatusMessage(null);
    leaderboardStore.fetchLeaderboard(true).catch((error: unknown) => {
      setStatusMessage(error instanceof Error ? error.message : 'Не удалось обновить лигу.');
    });
  }, [authStore.isAuthenticated, leaderboardStore]);

  const handleSync = useCallback(() => {
    if (!authStore.isAuthenticated) {
      setStatusMessage('Сначала выполните вход.');
      return;
    }
    setStatusMessage('Сохраняем прогресс...');
    authStore
      .syncNow('manual')
      .then(() => {
        setStatusMessage('Прогресс синхронизирован.');
      })
      .catch((error: unknown) => {
        setStatusMessage(error instanceof Error ? error.message : 'Синхронизация не удалась.');
      });
  }, [authStore]);

  const handleLoginPress = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleLogout = useCallback(() => {
    authStore.logout().catch(() => undefined);
  }, [authStore]);

  const lastSyncText = useMemo(() => {
    if (!authStore.lastSyncedAt) {
      return 'ещё не синхронизировано';
    }
    return formatTimestamp(authStore.lastSyncedAt);
  }, [authStore.lastSyncedAt]);

  const lastFetchedText = useMemo(() => {
    if (!leaderboardStore.lastFetchedAt) {
      return '—';
    }
    return formatTimestamp(leaderboardStore.lastFetchedAt);
  }, [leaderboardStore.lastFetchedAt]);

  if (!authStore.isReady) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#f5c16c" />
        <Text style={styles.centeredText}>Пробуждаем хроники...</Text>
      </SafeAreaView>
    );
  }

  if (!authStore.isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.authCard}>
            <MedievalIcon name="horn" size={72} color="#f8d9a0" accentColor="#7b4f1d" />
            <Text style={styles.authTitle}>Лига героев</Text>
            <Text style={styles.authSubtitle}>
              Создайте аккаунт, чтобы хранить монеты на серверах цитадели и соревноваться с другими игроками.
            </Text>
            <Pressable onPress={handleLoginPress} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Войти или зарегистрироваться</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={leaderboardStore.isLoading} onRefresh={handleRefresh} tintColor="#f5c16c" />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Герой</Text>
              <Text style={styles.heroName}>{authStore.playerNickname ?? 'Безымянный'}</Text>
            </View>
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Выйти</Text>
            </Pressable>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Монеты</Text>
              <Text style={styles.heroStatValue}>{currencyStore.coins}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Синхронизация</Text>
              <Text style={styles.heroStatValue}>{syncStatusLabel(authStore.syncState)}</Text>
              <Text style={styles.heroStatHint}>Последний раз: {lastSyncText}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Лига обновлена</Text>
              <Text style={styles.heroStatValue}>{lastFetchedText}</Text>
            </View>
          </View>
          <View style={styles.heroButtonsRow}>
            <Pressable
              onPress={handleSync}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.secondaryButtonPressed : null,
                authStore.syncState === 'syncing' && styles.secondaryButtonDisabled,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                {authStore.syncState === 'syncing' ? 'Сохраняем...' : 'Синхронизировать прогресс'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.secondaryButtonPressed : null,
                leaderboardStore.isLoading && styles.secondaryButtonDisabled,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                {leaderboardStore.isLoading ? 'Обновляем...' : 'Обновить лигу'}
              </Text>
            </Pressable>
          </View>
        </View>

        {(statusMessage || leaderboardStore.error) && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>{statusMessage || leaderboardStore.error}</Text>
          </View>
        )}

        {leaderboardStore.hasEntries ? (
          <View style={styles.tableCard}>
            {leaderboardStore.entries.map((entry: LeaderboardEntry) => (
              <View
                key={entry.nickname}
                style={[styles.row, entry.isPlayer ? styles.playerRow : null]}
              >
                <Text style={[styles.rank, entry.isPlayer ? styles.playerText : null]}>#{entry.rank}</Text>
                <View style={styles.rowContent}>
                  <Text style={[styles.nickname, entry.isPlayer ? styles.playerText : null]}>{entry.nickname}</Text>
                  <Text style={[styles.coins, entry.isPlayer ? styles.playerText : null]}>{entry.coins} монет</Text>
                  {entry.updatedAt ? (
                    <Text style={[styles.timestamp, entry.isPlayer ? styles.playerText : null]}>
                      Обновлено {formatTimestamp(entry.updatedAt)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Пока пусто</Text>
            <Text style={styles.emptyText}>Станьте первым, кто появится в летописях этой лиги!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function syncStatusLabel(state: string): string {
  switch (state) {
    case 'syncing':
      return 'идёт';
    case 'scheduled':
      return 'в очереди';
    case 'error':
      return 'ошибка';
    default:
      return 'готово';
  }
}

function formatTimestamp(value: string | number): string {
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default observer(LeaderboardScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#120b06',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#120b06',
  },
  centeredText: {
    marginTop: 12,
    color: '#fbead4',
  },
  authCard: {
    alignItems: 'center',
    backgroundColor: '#24140b',
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  authTitle: {
    color: '#fbead4',
    fontSize: 24,
    fontWeight: 'bold',
  },
  authSubtitle: {
    color: '#d2b48c',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#6b3f1a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    color: '#fbead4',
    fontWeight: '600',
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: '#24140b',
    borderRadius: 16,
    padding: 18,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: '#d2b48c',
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroName: {
    color: '#fbead4',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#b6946c',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    color: '#fbead4',
    fontWeight: '600',
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroStat: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#1a0f06',
    borderRadius: 12,
    padding: 12,
  },
  heroStatLabel: {
    color: '#d2b48c',
    fontSize: 12,
  },
  heroStatValue: {
    color: '#fbead4',
    fontSize: 18,
    fontWeight: '700',
  },
  heroStatHint: {
    color: '#b6946c',
    fontSize: 11,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#3b2717',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: '#fbead4',
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 18,
  },
  statusBanner: {
    borderRadius: 12,
    backgroundColor: '#5a2a2a',
    padding: 12,
  },
  statusText: {
    color: '#fbead4',
    textAlign: 'center',
  },
  tableCard: {
    backgroundColor: '#24140b',
    borderRadius: 16,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3b2717',
    alignItems: 'center',
  },
  playerRow: {
    backgroundColor: '#3b2717',
    borderRadius: 12,
  },
  rowContent: {
    flex: 1,
  },
  rank: {
    width: 52,
    color: '#d2b48c',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  nickname: {
    color: '#fbead4',
    fontSize: 16,
    fontWeight: '600',
  },
  coins: {
    color: '#f3d7a3',
    fontSize: 14,
  },
  timestamp: {
    color: '#b6946c',
    fontSize: 12,
  },
  playerText: {
    color: '#fff0ce',
  },
  emptyState: {
    backgroundColor: '#24140b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: '#fbead4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#d2b48c',
    textAlign: 'center',
  },
});
