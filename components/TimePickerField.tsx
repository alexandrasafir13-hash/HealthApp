import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { PlanCheckInAnswer } from '@/lib/planCheckInStorage';
import { formatTimeAnswer, parseTimeAnswer } from '@/lib/timeAnswer';

type Props = {
  value: PlanCheckInAnswer | undefined;
  onChange: (value: PlanCheckInAnswer) => void;
};

export default function TimePickerField({ value, onChange }: Props) {
  const [pickerDate, setPickerDate] = useState(() => parseTimeAnswer(value));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setPickerDate(parseTimeAnswer(value));
  }, [value]);

  const hasValue = typeof value === 'string' && value.trim().length > 0;
  const label = hasValue ? formatTimeAnswer(pickerDate) : 'Select time';

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'dismissed' || !selected) return;
    setPickerDate(selected);
    onChange(formatTimeAnswer(selected));
  };

  const closePicker = () => setShowPicker(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={hasValue ? `Selected time ${label}` : 'Select time'}>
        <Text style={[styles.buttonText, !hasValue && styles.placeholder]}>{label}</Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent animationType="slide" onRequestClose={closePicker}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={closePicker} />
            <View style={styles.iosSheet}>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={handleChange}
              />
              <Pressable style={styles.doneButton} onPress={closePicker}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}

      {showPicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  button: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: palette.background,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.88 },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate,
  },
  placeholder: {
    fontWeight: '500',
    color: palette.slateSubtle,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  iosSheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.card,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.tealDark,
  },
});
