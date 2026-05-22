import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { HealthProvider } from '@/context/HealthContext';
import { palette } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const HealthyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.teal,
    background: palette.background,
    card: palette.card,
    text: palette.slate,
    border: palette.border,
  },
};

const HealthyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.sageLight,
    background: '#111827',
    card: '#1F2937',
    text: '#F3F4F6',
    border: '#374151',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <HealthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? HealthyDarkTheme : HealthyLightTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="insight/[id]" options={{ title: 'Body insight' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'About Healthy' }} />
        </Stack>
      </ThemeProvider>
    </HealthProvider>
  );
}
