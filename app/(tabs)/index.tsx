import ActionMenu from '@/components/match3/ActionMenu';
import GameGrid from '@/components/match3/GameGrid';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W > 768;

export default function Match3Game() {
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
            </View>
          </View>
        ) : (
          <View style={styles.mobileLayout}>
            <GameGrid />
            <ActionMenu />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#120b06',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 12,
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
});
