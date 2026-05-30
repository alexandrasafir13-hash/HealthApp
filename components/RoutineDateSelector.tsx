import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import RoutineCalendarPicker from '@/components/RoutineCalendarPicker';
import { localDateKey } from '@/lib/localDate';
import { formatRoutineDateLabel } from '@/lib/routineDates';
import { palette } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface Props {
  selectedDate: string;
  minDate: string;
  maxDate?: string;
  onChange: (dateKey: string) => void;
  getCompletionForDate?: (dateKey: string) => number | null;
}

export default function RoutineDateSelector({
  selectedDate,
  minDate,
  maxDate = localDateKey(),
  onChange,
  getCompletionForDate,
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { isTabletUp } = useBreakpoint();

  const handleSelect = (dateKey: string) => {
    onChange(dateKey);
    setCalendarOpen(false);
  };

  const selectedLabel = formatRoutineDateLabel(selectedDate, maxDate);

  return (
    <>
      <View style={styles.triggerWrap}>
        <Pressable
          style={({ pressed }) => [styles.todayBtn, pressed && styles.todayBtnPressed]}
          onPress={() => setCalendarOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Selected day: ${selectedLabel}. Open calendar`}>
          <SymbolView
            name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
            tintColor={palette.tealDark}
            size={20}
          />
          <Text style={styles.todayBtnText}>{selectedLabel}</Text>
        </Pressable>
      </View>

      <Modal
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCalendarOpen(false)}>
          <Pressable
            style={[styles.modalCard, isTabletUp && styles.modalCardWide]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a day</Text>
              <Pressable
                onPress={() => setCalendarOpen(false)}
                hitSlop={12}
                accessibilityLabel="Close calendar">
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                  tintColor={palette.slateMuted}
                  size={26}
                />
              </Pressable>
            </View>
            <RoutineCalendarPicker
              compact
              selectedDate={selectedDate}
              minDate={minDate}
              maxDate={maxDate}
              onChange={handleSelect}
              getCompletionForDate={getCompletionForDate}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.sageLight,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: palette.tealDark,
  },
  todayBtnPressed: {
    opacity: 0.88,
  },
  todayBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.tealDark,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 51, 56, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalCardWide: {
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    color: palette.slate,
  },
});
