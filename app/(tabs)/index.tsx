import ActionMenu from '@/components/match3/ActionMenu';
import GameGrid from '@/components/match3/GameGrid';
import LogCard from '@/components/match3/LogCard';
import StatsCard from '@/components/match3/StatsCard';
import { useGameSessionContext } from '@/contexts/GameSessionContext';
import { useRootStore } from '@/store/RootStore';
import { reaction } from 'mobx';
import React, { useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W > 768;

export default function Match3Game() {
  const rootStore = useRootStore();
  const { currentSession, addMessage, updateStats } = useGameSessionContext();

  // Синхронизация логов и статистики с сессией
  useEffect(() => {
    if (currentSession) {
      // Логируем начало игры
      addMessage('Game started');
    }
  }, [currentSession?.id]);

  // Отслеживание изменений в стате для сохранения в сессию
  useEffect(() => {
    if (!currentSession) {
      return;
    }

    const dispose = reaction(
      () => {
        const stats = rootStore.statStore.info;
        return {
          match3: stats.match3,
          match4: stats.match4,
          match5: stats.match5,
          totalMatches: stats.match3 + stats.match4 + stats.match5,
          coins: rootStore.currencyStore.coins,
        };
      },
      snapshot => {
        updateStats(snapshot);
      },
      { fireImmediately: true }
    );

    return () => dispose();
  }, [currentSession?.id, rootStore, updateStats]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isTablet ? (
          <View style={styles.tabletLayout}>
            <View style={styles.tabletLeft}>
              <GameGrid />
            </View>
            <View style={styles.tabletRight}>
              <ActionMenu />
              <StatsCard />
              <LogCard />
            </View>
          </View>
        ) : (
          <View style={styles.mobileLayout}>
            <GameGrid />
            <View style={styles.sidePanel}>
              <ActionMenu />
              <StatsCard />
              <LogCard />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 10,
  },
  tabletLayout: {
    flexDirection: 'row',
    gap: 15,
  },
  tabletLeft: {
    flex: 2,
  },
  tabletRight: {
    flex: 1,
    minWidth: 300,
  },
  mobileLayout: {
    gap: 15,
  },
  sidePanel: {
    gap: 10,
  },
});
