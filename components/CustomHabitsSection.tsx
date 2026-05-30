import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import CollapsibleInsightSection from '@/components/CollapsibleInsightSection';
import HabitListCard from '@/components/HabitListCard';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { CustomHabit } from '@/types/health';

const CUSTOM_HABIT_REASON = 'Your personal habit';

interface Props {
  habits: CustomHabit[];
  onAdd: (title: string, time: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function CustomHabitsSection({ habits, onAdd, onToggle, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, '');
    setTitle('');
  };

  return (
    <CollapsibleInsightSection
      title="Your own habits"
      color={palette.sage}
      count={habits.length}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      hideBadge={habits.length === 0}>
      <View style={styles.panel}>
        <Text style={styles.hint}>
          Add habits that matter to you—supplements, stretches, reminders, or anything else. Long press a
          habit to remove it.
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Habit name"
            placeholderTextColor={palette.slateSubtle}
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            maxLength={80}
          />
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && !!title.trim() && styles.addButtonPressed,
              !title.trim() && styles.addButtonDisabled,
            ]}
            onPress={handleAdd}
            disabled={!title.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add habit">
            <Text style={styles.addButtonText}>Add habit</Text>
          </Pressable>
        </View>

        {habits.length === 0 ? (
          <Text style={styles.empty}>No custom habits yet. Add one above.</Text>
        ) : (
          <View style={styles.habitList}>
            {habits.map((habit) => (
              <HabitListCard
                key={habit.id}
                title={habit.title}
                reason={CUSTOM_HABIT_REASON}
                completed={habit.completed}
                onPress={() => onToggle(habit.id)}
                onLongPress={() => onRemove(habit.id)}
              />
            ))}
          </View>
        )}
      </View>
    </CollapsibleInsightSection>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 12,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.slateMuted,
  },
  form: {
    gap: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.slate,
  },
  addButton: {
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonPressed: {
    opacity: 0.88,
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
    color: palette.slateMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  habitList: {
    marginTop: 4,
  },
});
