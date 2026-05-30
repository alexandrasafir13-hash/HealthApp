import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PAGE_MAX_WIDTH } from '@/hooks/useBreakpoint';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const gutter = Math.max(0, (width - PAGE_MAX_WIDTH) / 2);
  const tabBarWidth = Math.min(width, PAGE_MAX_WIDTH);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderTopColor: Colors[colorScheme ?? 'light'].border,
          width: tabBarWidth,
          maxWidth: PAGE_MAX_WIDTH,
          marginLeft: gutter,
          marginRight: gutter,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' }} tintColor={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'waveform.path.ecg', android: 'monitor_heart', web: 'monitor_heart' }} tintColor={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: 'Data',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'link', android: 'link', web: 'link' }} tintColor={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: 'Routine',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} tintColor={color} size={26} />
          ),
        }}
      />
    </Tabs>
  );
}
