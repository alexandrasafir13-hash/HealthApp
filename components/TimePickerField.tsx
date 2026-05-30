import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { PAGE_MAX_WIDTH } from '@/hooks/useBreakpoint';
import { PlanCheckInAnswer } from '@/lib/planCheckInStorage';
import {
  formatTimeAnswer,
  from12HourParts,
  parseTimeAnswer,
  to12HourParts,
} from '@/lib/timeAnswer';

const SHEET_MAX_WIDTH = Math.min(360, PAGE_MAX_WIDTH);

type Props = {
  value: PlanCheckInAnswer | undefined;
  onChange: (value: PlanCheckInAnswer) => void;
};

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable style={styles.stepperButton} onPress={onDecrement} accessibilityRole="button">
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable style={styles.stepperButton} onPress={onIncrement} accessibilityRole="button">
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TimePickerModal({
  visible,
  initialDate,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialDate: Date;
  onClose: () => void;
  onSave: (date: Date) => void;
}) {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');

  useEffect(() => {
    if (!visible) return;
    const parts = to12HourParts(initialDate);
    setHour(parts.hour);
    setMinute(parts.minute);
    setPeriod(parts.period);
  }, [visible, initialDate]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Select time</Text>

          <View style={styles.pickerRow}>
            <Stepper
              label="Hour"
              value={String(hour)}
              onDecrement={() => setHour((current) => (current <= 1 ? 12 : current - 1))}
              onIncrement={() => setHour((current) => (current >= 12 ? 1 : current + 1))}
            />
            <Text style={styles.timeSep}>:</Text>
            <Stepper
              label="Min"
              value={String(minute).padStart(2, '0')}
              onDecrement={() => setMinute((current) => (current <= 0 ? 59 : current - 1))}
              onIncrement={() => setMinute((current) => (current >= 59 ? 0 : current + 1))}
            />
          </View>

          <View style={styles.periodRow}>
            {(['AM', 'PM'] as const).map((option) => {
              const selected = period === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.periodChip, selected && styles.periodChipSelected]}
                  onPress={() => setPeriod(option)}>
                  <Text style={[styles.periodText, selected && styles.periodTextSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.saveButton}
            onPress={() => onSave(from12HourParts(hour, minute, period))}
            accessibilityRole="button">
            <Text style={styles.saveButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function TimePickerField({ value, onChange }: Props) {
  const [pickerDate, setPickerDate] = useState(() => parseTimeAnswer(value));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPickerDate(parseTimeAnswer(value));
  }, [value]);

  const hasValue = typeof value === 'string' && value.trim().length > 0;
  const label = hasValue ? formatTimeAnswer(pickerDate) : 'Select time';

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={hasValue ? `Selected time ${label}` : 'Select time'}>
        <Text style={[styles.buttonText, !hasValue && styles.placeholder]}>{label}</Text>
      </Pressable>

      <TimePickerModal
        visible={open}
        initialDate={pickerDate}
        onClose={() => setOpen(false)}
        onSave={(date) => {
          setPickerDate(date);
          onChange(formatTimeAnswer(date));
          setOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
  button: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 14,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    width: '100%',
    maxWidth: SHEET_MAX_WIDTH,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  timeSep: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.slateMuted,
    marginBottom: 14,
  },
  stepper: {
    gap: 8,
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slateMuted,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  stepperButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.slate,
    lineHeight: 22,
  },
  stepperValue: {
    minWidth: 40,
    fontSize: 24,
    fontWeight: '700',
    color: palette.slate,
    textAlign: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  periodChip: {
    minWidth: 72,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  periodChipSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate,
  },
  periodTextSelected: {
    color: palette.tealDark,
  },
  saveButton: {
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
