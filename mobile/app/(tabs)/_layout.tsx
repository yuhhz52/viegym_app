import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          elevation: 0,
          height: 60 + (Platform.OS === 'android' ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout-sessions"
        options={{
          title: 'Luyện tập',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={32} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Tiến độ',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
