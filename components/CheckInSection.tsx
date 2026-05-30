import { useEffect, useMemo, useState } from 'react';

import CheckInForm from '@/components/CheckInForm';
import CollapsibleInsightSection from '@/components/CollapsibleInsightSection';
import { useHealth } from '@/context/HealthContext';
import { palette } from '@/constants/theme';

interface Props {
  selectedDate: string;
}

export default function CheckInSection({ selectedDate }: Props) {
  const { getHabitsForDate, isReady } = useHealth();
  const [expanded, setExpanded] = useState(false);

  const hasCheckIn = useMemo(() => {
    const { habits, customHabits, total } = getHabitsForDate(selectedDate);
    return total > 0 && [...habits, ...customHabits].some((h) => h.completed);
  }, [getHabitsForDate, selectedDate]);

  useEffect(() => {
    if (!isReady) return;
    setExpanded(!hasCheckIn);
  }, [isReady, hasCheckIn, selectedDate]);

  return (
    <CollapsibleInsightSection
      title="Daily check-in"
      color={palette.teal}
      count={hasCheckIn ? 1 : 0}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      hideBadge={!hasCheckIn}>
      <CheckInForm selectedDate={selectedDate} />
    </CollapsibleInsightSection>
  );
}
