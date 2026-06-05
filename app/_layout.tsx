import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';


import AppShell from '@/components/AppShell';
import { useColorScheme } from '@/components/useColorScheme';
import { HealthProvider } from '@/context/HealthContext';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { DocumentProvider } from '@/context/DocumentContext';
import { palette } from '@/constants/theme';
import GlobalSearch from '@/components/GlobalSearch';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const HealtheeLightTheme = {
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

const HealtheeDarkTheme = {
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
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
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
    return <AppShell />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AppShell>
      <AuthProvider>
        <HealthProvider>
          <ChatProvider>
            <DocumentProvider>
              <ThemeProvider value={colorScheme === 'dark' ? HealtheeDarkTheme : HealtheeLightTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'About Healthee' }} />
                </Stack>
                <GlobalSearch />
              </ThemeProvider>
            </DocumentProvider>
          </ChatProvider>
        </HealthProvider>
      </AuthProvider>
    </AppShell>
  );
}
