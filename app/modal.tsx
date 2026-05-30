import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';

export default function ModalScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={pageStyle}>
      <Text style={styles.title}>About Healthy</Text>
      <Text style={styles.lead}>
        Healthy connects your wearables and daily check-ins to explain what your body is doing—and what to do about it.
      </Text>

      <View style={styles.block} lightColor={palette.sageLight} darkColor="#1F2937">
        <Text style={styles.blockTitle}>Our promise</Text>
        <Text style={styles.body}>
          Every insight follows a predictable flow: Cause → Effect → Action. No mystery scores—just clear explanations and practical steps.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>What we connect</Text>
        <Text style={styles.body}>
          Sleep, heart rate, HRV, SpO₂, activity, temperature, and how you feel each day—unified into one story about your body.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Prevention first</Text>
        <Text style={styles.body}>
          Early patterns (like elevated resting HR before you feel sick) trigger gentle actions so you can rest, recover, and avoid pushing through.
        </Text>
      </View>

      <Text style={styles.note}>
        This demo uses sample data. In production, connect Apple Health, Oura, WHOOP, or Fitbit and log daily check-ins for personalized insights.
      </Text>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  lead: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.slateMuted,
    marginBottom: 24,
  },
  block: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: palette.slate,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.slateMuted,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.slateSubtle,
    marginTop: 16,
    fontStyle: 'italic',
  },
});
