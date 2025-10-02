import ActionMenu from '@/components/match3/ActionMenu';
import GameGrid from '@/components/match3/GameGrid';
import LogCard from '@/components/match3/LogCard';
import StatsCard from '@/components/match3/StatsCard';
import { RootStore, RootStoreContext } from '@/store/RootStore';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W > 768;

const rootStore = new RootStore();

export default function Match3Game() {
  return (
    <RootStoreContext.Provider value={rootStore}>
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
    </RootStoreContext.Provider>
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
