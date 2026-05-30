import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { palette } from '@/constants/theme';

export default function TodayPlanSubmitButton() {
  const { todayCheckInCanSubmit, todayCheckInSaved, submitPlanCheckIn } = useHealth();
  const [busy, setBusy] = useState(false);

  const label = busy ? 'Saving…' : todayCheckInSaved ? 'Saved for today' : 'Save check-in';

  const handlePress = async () => {
    if (busy || todayCheckInSaved || !todayCheckInCanSubmit) return;
    setBusy(true);
    try {
      await submitPlanCheckIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          todayCheckInSaved && styles.buttonSaved,
          !todayCheckInCanSubmit && styles.buttonDisabled,
          pressed && todayCheckInCanSubmit && !todayCheckInSaved && !busy && styles.buttonPressed,
        ]}
        onPress={handlePress}
        disabled={busy || todayCheckInSaved || !todayCheckInCanSubmit}
        accessibilityRole="button"
        accessibilityLabel={label}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>
        {todayCheckInCanSubmit
          ? 'Save when you’re done reflecting on today.'
          : 'Answer the required questions to save today’s check-in.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 28,
    gap: 10,
  },
  button: {
    backgroundColor: palette.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonSaved: {
    backgroundColor: palette.sage,
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
    textAlign: 'left',
  },
});
