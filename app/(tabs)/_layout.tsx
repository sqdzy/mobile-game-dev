import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { AppIcon } from '@/components/ui/AppIcon';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Поле',
          tabBarIcon: ({ color }) => (
            <AppIcon name="grid" size={26} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Улучшения',
          tabBarIcon: ({ color }) => (
            <AppIcon name="scroll" size={26} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Лига героев',
          tabBarIcon: ({ color }) => (
            <AppIcon name="trophy" size={26} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
