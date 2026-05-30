import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { palette } from '@/constants/theme';

export default function TodayRoutineDoneButton() {
  const {
    todayRoutineSteps,
    todayRoutineFinished,
    todayRoutineCanFinish,
    finishTodayRoutine,
  } = useHealth();
  const [busy, setBusy] = useState(false);

  if (todayRoutineSteps.length === 0) return null;

  const completedCount = todayRoutineSteps.filter((step) => step.completed).length;
  const allDone = completedCount === todayRoutineSteps.length;

  const label = busy
    ? 'Saving…'
    : todayRoutineFinished
      ? 'Saved for today'
      : allDone
        ? 'Finish day'
        : 'Save progress';

  const handlePress = async () => {
    if (busy || todayRoutineFinished || !todayRoutineCanFinish) return;
    setBusy(true);
    try {
      await finishTodayRoutine();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          todayRoutineFinished && styles.buttonSaved,
          !todayRoutineCanFinish && styles.buttonDisabled,
          pressed && todayRoutineCanFinish && !todayRoutineFinished && !busy && styles.buttonPressed,
        ]}
        onPress={handlePress}
        disabled={busy || todayRoutineFinished || !todayRoutineCanFinish}
        accessibilityRole="button"
        accessibilityLabel={label}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>
        {todayRoutineCanFinish
          ? 'Tick off what you did, then save to get personalized insights.'
          : 'Tick at least one item to save your progress.'}
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
