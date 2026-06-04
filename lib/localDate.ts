import AsyncStorage from '@react-native-async-storage/async-storage';

let simulatedOffsetDays = 0;

// Load simulated offset on startup
if (typeof window !== 'undefined') {
  AsyncStorage.getItem('healthee:simulated-offset-days').then((val) => {
    if (val != null) {
      const parsed = parseInt(val, 10);
      if (!Number.isNaN(parsed)) {
        simulatedOffsetDays = parsed;
      }
    }
  }).catch((err) => {
    console.error('Failed to load simulated offset days:', err);
  });
}

export function getSimulatedOffset(): number {
  return simulatedOffsetDays;
}

export async function setSimulatedOffset(days: number): Promise<void> {
  simulatedOffsetDays = days;
  if (typeof window === 'undefined') return;
  try {
    await AsyncStorage.setItem('healthee:simulated-offset-days', String(days));
  } catch (err) {
    console.error('Failed to save simulated offset days:', err);
  }
}

export function getSimulatedDate(): Date {
  const date = new Date();
  if (simulatedOffsetDays !== 0) {
    date.setDate(date.getDate() + simulatedOffsetDays);
  }
  return date;
}

/** Local calendar date (YYYY-MM-DD) — avoids UTC drift on mobile devices. */
export function localDateKey(date?: Date): string {
  const targetDate = date || getSimulatedDate();
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

