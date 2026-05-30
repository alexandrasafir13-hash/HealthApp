import { createElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/theme';
import { PlanCheckInAnswer } from '@/lib/planCheckInStorage';
import { formatTimeAnswer, parseTimeAnswer } from '@/lib/timeAnswer';

type Props = {
  value: PlanCheckInAnswer | undefined;
  onChange: (value: PlanCheckInAnswer) => void;
};

function toInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseInputValue(value: string, base: Date): Date {
  const [hours, minutes] = value.split(':');
  const next = new Date(base);
  next.setHours(Number(hours), Number(minutes), 0, 0);
  return next;
}

export default function TimePickerField({ value, onChange }: Props) {
  const [pickerDate, setPickerDate] = useState(() => parseTimeAnswer(value));

  useEffect(() => {
    setPickerDate(parseTimeAnswer(value));
  }, [value]);

  const inputValue =
    typeof value === 'string' && value.trim().length > 0 ? toInputValue(pickerDate) : '';

  return (
    <View style={styles.wrap}>
      {createElement('input', {
        type: 'time',
        value: inputValue,
        onChange: (event: Event) => {
          const target = event.currentTarget as HTMLInputElement;
          const nextValue = target.value;
          if (!nextValue) {
            onChange('');
            return;
          }
          const selected = parseInputValue(nextValue, pickerDate);
          setPickerDate(selected);
          onChange(formatTimeAnswer(selected));
        },
        style: {
          width: '100%',
          minHeight: 44,
          fontSize: 15,
          fontWeight: 600,
          padding: '10px 12px',
          borderRadius: 10,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.background,
          color: palette.slate,
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          cursor: 'pointer',
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
});
