import { BiologicalSex } from '@/types/onboarding';

export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obese';
export type WeightBandStatus = 'within' | 'below' | 'above';

/** Direct calculations from profile inputs (height, weight, age, sex). */
export interface ProfileMetrics {
  bmi: number;
  bmiLabel: string;
  bmiCategory: BmiCategory;
  weightKg: number;
  weightBandStatus: WeightBandStatus;
  weightBandDetail: string;
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
  restingCalories: number;
}

/** General targets derived from profile — guidelines, not raw inputs. */
export interface HealthRecommendations {
  /** Mostly desk, driving, minimal walking (×1.2 resting). */
  maintenanceSedentaryKcal: number;
  /** Regular walks or errands on foot most days (×1.375 resting). */
  maintenanceWalkingKcal: number;
  dailyWaterLiters: number;
  sleepMinHours: number;
  sleepMaxHours: number;
}

export interface HealthSnapshot {
  profile: ProfileMetrics;
  recommendations: HealthRecommendations;
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

export function weightVsHealthyBand(
  weightKg: number,
  minKg: number,
  maxKg: number,
): { status: WeightBandStatus; detail: string } {
  if (weightKg >= minKg && weightKg <= maxKg) {
    return { status: 'within', detail: 'Within healthy range for your height' };
  }
  if (weightKg < minKg) {
    const offset = Math.round(minKg - weightKg);
    return { status: 'below', detail: `${offset} kg below healthy range for your height` };
  }
  const offset = Math.round(weightKg - maxKg);
  return { status: 'above', detail: `${offset} kg above healthy range for your height` };
}

/** Calories to maintain weight for common day-to-day routines. */
export function maintenanceCalories(restingCaloriesKcal: number): {
  sedentaryKcal: number;
  walkingKcal: number;
} {
  return {
    sedentaryKcal: Math.round(restingCaloriesKcal * 1.2),
    walkingKcal: Math.round(restingCaloriesKcal * 1.375),
  };
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
  const resting = restingCalories(weightKg, heightCm, age, sex);
  const maintenance = maintenanceCalories(resting);
  const weightBand = weightVsHealthyBand(weightKg, range.min, range.max);

  return {
    profile: {
      bmi: Math.round(bmi * 10) / 10,
      bmiLabel: getBmiLabel(category),
      bmiCategory: category,
      weightKg: Math.round(weightKg),
      weightBandStatus: weightBand.status,
      weightBandDetail: weightBand.detail,
      healthyWeightMinKg: range.min,
      healthyWeightMaxKg: range.max,
      restingCalories: resting,
    },
    recommendations: {
      maintenanceSedentaryKcal: maintenance.sedentaryKcal,
      maintenanceWalkingKcal: maintenance.walkingKcal,
      dailyWaterLiters: dailyWaterLiters(weightKg),
      sleepMinHours: sleep.minHours,
      sleepMaxHours: sleep.maxHours,
    },
  };
}
