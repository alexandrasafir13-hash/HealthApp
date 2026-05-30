import { Redirect } from 'expo-router';

import { useHealth } from '@/context/HealthContext';

export default function Index() {
  const { isReady, onboardingComplete } = useHealth();

  if (!isReady) return null;

  if (!onboardingComplete) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
