import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function AboutScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="square.grid.3x3.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">About Match-3 Game</ThemedText>
      </ThemedView>
      <ThemedText>This is a classic Match-3 puzzle game built with React Native and Expo.</ThemedText>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">How to Play</ThemedText>
        <ThemedText>
          1. Tap on a cell to select it{'\n'}
          2. Tap on an adjacent cell to swap them{'\n'}
          3. Match 3 or more cells of the same color{'\n'}
          4. Create combos for higher scores!
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Features</ThemedText>
        <ThemedText>
          • 6 different colored cells{'\n'}
          • Smooth animations with React Native Reanimated{'\n'}
          • MobX state management{'\n'}
          • Statistics tracking{'\n'}
          • Game log
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Technologies</ThemedText>
        <ThemedText>
          • React Native{'\n'}
          • Expo{'\n'}
          • TypeScript{'\n'}
          • MobX{'\n'}
          • React Native Reanimated
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});
