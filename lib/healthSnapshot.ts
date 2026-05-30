import { BiologicalSex } from '@/types/onboarding';

export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obese';

export interface HealthSnapshot {
  bmi: number;
  bmiLabel: string;
  bmiCategory: BmiCategory;
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
  dailyWaterLiters: number;
  restingCalories: number;
  sleepMinHours: number;
  sleepMaxHours: number;
}

export function computeBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'healthy';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function getBmiLabel(category: BmiCategory): string {
  switch (category) {
    case 'underweight':
      return 'Underweight';
    case 'healthy':
      return 'Healthy range';
    case 'overweight':
      return 'Overweight';
    case 'obese':
      return 'Obese';
  }
}

export function healthyWeightRangeKg(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  const sq = heightM * heightM;
  return {
    min: Math.round(18.5 * sq),
    max: Math.round(24.9 * sq),
  };
}

export function dailyWaterLiters(weightKg: number): number {
  return Math.round(weightKg * 0.033 * 10) / 10;
}

export function restingCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return Math.round(base + 5);
  if (sex === 'female') return Math.round(base - 161);
  return Math.round(base - 78);
}

/** Age-based nightly sleep range (CDC / NSF guidelines). */
export function recommendedSleepHours(age: number): { minHours: number; maxHours: number } {
  if (age < 18) return { minHours: 8, maxHours: 10 };
  if (age < 65) return { minHours: 7, maxHours: 9 };
  return { minHours: 7, maxHours: 8 };
}

export function buildHealthSnapshot(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
): HealthSnapshot {
  const bmi = computeBmi(weightKg, heightCm);
  const category = getBmiCategory(bmi);
  const range = healthyWeightRangeKg(heightCm);
  const sleep = recommendedSleepHours(age);

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiLabel: getBmiLabel(category),
    bmiCategory: category,
    healthyWeightMinKg: range.min,
    healthyWeightMaxKg: range.max,
    dailyWaterLiters: dailyWaterLiters(weightKg),
    restingCalories: restingCalories(weightKg, heightCm, age, sex),
    sleepMinHours: sleep.minHours,
    sleepMaxHours: sleep.maxHours,
  };
}
