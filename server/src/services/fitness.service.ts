import {
  ACTIVITY_FACTORS,
  CALORIE_FLOORS,
  FAT_CALORIE_RATIO,
  GOAL_ADJUSTMENTS,
  PROTEIN_GRAMS_PER_KG,
  type FitnessExperience,
  type FitnessGender,
  type FitnessGoal,
} from '../lib/constants/fitness.js';

export type FitnessInput = {
  age: number;
  gender: FitnessGender;
  height_cm: number;
  weight_kg: number;
  goal: FitnessGoal;
  experience: FitnessExperience;
  days_per_week: number;
};

export type FitnessTargets = {
  bmr: number;
  tdee: number;
  calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

const round = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export function calculateBmr(input: Pick<FitnessInput, 'age' | 'gender' | 'height_cm' | 'weight_kg'>): number {
  const genderOffset = input.gender === 'male' ? 5 : -161;
  return 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + genderOffset;
}

export function calculateTdee(bmr: number, daysPerWeek: number): number {
  const factor = daysPerWeek <= 2
    ? ACTIVITY_FACTORS.low
    : daysPerWeek <= 5
      ? ACTIVITY_FACTORS.moderate
      : ACTIVITY_FACTORS.high;
  return bmr * factor;
}

export function calculateTargets(input: FitnessInput): FitnessTargets {
  const bmr = calculateBmr(input);
  const tdee = calculateTdee(bmr, input.days_per_week);
  const adjustedCalories = tdee * (1 + GOAL_ADJUSTMENTS[input.goal]);
  const calorie_target = Math.max(CALORIE_FLOORS[input.gender], Math.round(adjustedCalories));
  const protein_g = round(input.weight_kg * PROTEIN_GRAMS_PER_KG[input.goal]);
  const fat_g = round((calorie_target * FAT_CALORIE_RATIO) / 9);
  const carbs_g = round((calorie_target - protein_g * 4 - fat_g * 9) / 4);

  return {
    bmr: round(bmr, 2),
    tdee: round(tdee, 2),
    calorie_target,
    protein_g,
    carbs_g,
    fat_g,
  };
}

