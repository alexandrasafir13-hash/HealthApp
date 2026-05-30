import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Text } from '@/components/Themed';
import { localDateKey } from '@/lib/localDate';
import {
  buildMonthGrid,
  clampDateKey,
  formatRoutineDateLabel,
  isDateKeyInRange,
  monthYearLabel,
  parseDateKey,
} from '@/lib/routineDates';
import { categoryAttentionColor, metricScaleColors, palette } from '@/constants/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  selectedDate: string;
  minDate: string;
  maxDate?: string;
  onChange: (dateKey: string) => void;
  getCompletionForDate?: (dateKey: string) => number | null;
  compact?: boolean;
}

export default function RoutineCalendarPicker({
  selectedDate,
  minDate,
  maxDate = localDateKey(),
  onChange,
  getCompletionForDate,
  compact,
}: Props) {
  const selected = parseDateKey(selectedDate);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  useEffect(() => {
    const d = parseDateKey(selectedDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  const minParsed = parseDateKey(minDate);
  const maxParsed = parseDateKey(maxDate);

  const canGoPrevMonth =
    viewYear > minParsed.getFullYear() ||
    (viewYear === minParsed.getFullYear() && viewMonth > minParsed.getMonth());

  const canGoNextMonth =
    viewYear < maxParsed.getFullYear() ||
    (viewYear === maxParsed.getFullYear() && viewMonth < maxParsed.getMonth());

  const monthCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const goPrevMonth = () => {
    if (!canGoPrevMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (!canGoNextMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelect = (dateKey: string) => {
    if (!isDateKeyInRange(dateKey, minDate, maxDate)) return;
    onChange(clampDateKey(dateKey, minDate, maxDate));
  };

  const summaryLabel = formatRoutineDateLabel(selectedDate, maxDate);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {!compact && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryText}>
            <Text lightColor={palette.slateMuted} darkColor={palette.slateMuted} style={styles.summaryLabel}>
              Selected day
            </Text>
            <Text lightColor={palette.slate} darkColor={palette.slate} style={styles.summaryValue}>
              {summaryLabel}
            </Text>
          </View>
          {selectedDate !== maxDate && (
            <Pressable
              style={styles.todayBtn}
              onPress={() => onChange(maxDate)}
              accessibilityRole="button"
              accessibilityLabel="Jump to current day">
              <Text style={styles.todayBtnText}>Today</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={[styles.monthHeader, compact && styles.monthHeaderCompact]}>
        <Pressable
          style={[styles.monthNavBtn, !canGoPrevMonth && styles.monthNavBtnDisabled]}
          onPress={goPrevMonth}
          disabled={!canGoPrevMonth}
          accessibilityRole="button"
          accessibilityLabel="Previous month">
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            tintColor={canGoPrevMonth ? palette.tealDark : palette.slateSubtle}
            size={20}
          />
        </Pressable>
        <Text lightColor={palette.slate} darkColor={palette.slate} style={[styles.monthTitle, compact && styles.monthTitleCompact]}>
          {monthYearLabel(viewYear, viewMonth)}
        </Text>
        <Pressable
          style={[styles.monthNavBtn, !canGoNextMonth && styles.monthNavBtnDisabled]}
          onPress={goNextMonth}
          disabled={!canGoNextMonth}
          accessibilityRole="button"
          accessibilityLabel="Next month">
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor={canGoNextMonth ? palette.tealDark : palette.slateSubtle}
            size={20}
          />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {monthCells.map((cell) => {
          const selectable = isDateKeyInRange(cell.dateKey, minDate, maxDate);
          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === maxDate;
          const completion = selectable ? getCompletionForDate?.(cell.dateKey) : null;

          return (
            <Pressable
              key={cell.dateKey}
              style={[
                styles.dayCell,
                compact && styles.dayCellCompact,
                isToday && !isSelected && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() => handleSelect(cell.dateKey)}
              disabled={!selectable}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: !selectable }}
              accessibilityLabel={`${cell.day}${isToday ? ', today' : ''}`}>
              <Text
                style={[
                  styles.dayText,
                  compact && styles.dayTextCompact,
                  !cell.inCurrentMonth && styles.dayTextOutside,
                  !selectable && styles.dayTextDisabled,
                  isToday && !isSelected && styles.dayTextToday,
                  isSelected && styles.dayTextSelected,
                ]}>
                {cell.day}
              </Text>
              {isToday && (
                <View style={[styles.todayBadge, isSelected && styles.todayBadgeSelected]}>
                  <Text style={[styles.todayBadgeText, isSelected && styles.todayBadgeTextSelected]}>
                    Today
                  </Text>
                </View>
              )}
              {completion != null && completion > 0 && (
                <View
                  style={[
                    styles.completionDot,
                    isSelected
                      ? styles.completionDotSelected
                      : completion >= 1
                        ? styles.completionDotFull
                        : styles.completionDotPartial,
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {compact && selectedDate !== maxDate && (
        <Pressable
          style={styles.modalTodayBtn}
          onPress={() => onChange(maxDate)}
          accessibilityRole="button"
          accessibilityLabel="Jump to current day">
          <Text style={styles.todayBtnText}>Jump to current day</Text>
        </Pressable>
      )}

      <Text lightColor={palette.slateMuted} darkColor={palette.slateMuted} style={[styles.legend, compact && styles.legendCompact]}>
        Tap a day to mark habits · Today is labeled · dots show progress
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardCompact: {
    marginBottom: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  todayBtn: {
    backgroundColor: palette.sageLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.tealDark,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.tealDark,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthHeaderCompact: {
    marginBottom: 8,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  monthNavBtnDisabled: {
    opacity: 0.4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  monthTitleCompact: {
    fontSize: 15,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: palette.slateSubtle,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 2,
    gap: 1,
  },
  dayCellCompact: {
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: palette.teal,
  },
  dayCellToday: {
    backgroundColor: palette.sageLight,
    borderWidth: 2,
    borderColor: palette.tealDark,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate,
  },
  dayTextCompact: {
    fontSize: 13,
  },
  dayTextToday: {
    color: palette.tealDark,
    fontWeight: '700',
  },
  dayTextOutside: {
    color: palette.slateSubtle,
    opacity: 0.55,
  },
  dayTextDisabled: {
    color: palette.border,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  todayBadge: {
    backgroundColor: palette.tealDark,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
  },
  todayBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  todayBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  todayBadgeTextSelected: {
    color: '#fff',
  },
  completionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  completionDotSelected: {
    backgroundColor: '#fff',
  },
  completionDotFull: {
    backgroundColor: metricScaleColors.good,
  },
  completionDotPartial: {
    backgroundColor: categoryAttentionColor,
  },
  legend: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  legendCompact: {
    fontSize: 11,
    marginTop: 6,
  },
  modalTodayBtn: {
    alignSelf: 'center',
    backgroundColor: palette.sageLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.tealDark,
    marginTop: 10,
  },
});
