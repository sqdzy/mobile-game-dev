import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { MedievalIcon } from '@/components/ui/MedievalIcon';
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
            <MedievalIcon name="grid-sigil" size={30} color={color} accentColor="#f3d7a3" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Улучшения',
          tabBarIcon: ({ color }) => (
            <MedievalIcon name="upgrade-scroll" size={30} color={color} accentColor="#6b3f1a" />
          ),
        }}
      />
    </Tabs>
  );
}
