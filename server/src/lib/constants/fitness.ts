export const FORMULA_VERSION = 'v1';

// Activity multipliers approximate low, moderate, and high weekly training frequency.
export const ACTIVITY_FACTORS = {
  low: 1.375,
  moderate: 1.55,
  high: 1.725,
} as const;

// Goal adjustments are applied to TDEE after the activity factor.
export const GOAL_ADJUSTMENTS = {
  lose_weight: -0.15,
  gain_weight: 0.1,
  build_muscle: 0.1,
  get_stronger: 0.05,
  maintain: 0,
} as const;

// Protein targets use body weight in kilograms and are intentionally conservative MVP defaults.
export const PROTEIN_GRAMS_PER_KG = {
  lose_weight: 2,
  gain_weight: 1.8,
  build_muscle: 2,
  get_stronger: 1.8,
  maintain: 1.6,
} as const;

// Fat supplies 25% of the calorie target; carbohydrates receive the remaining calories.
export const FAT_CALORIE_RATIO = 0.25;

// These floors prevent a calculated target from becoming an unsafe low-calorie recommendation.
export const CALORIE_FLOORS = {
  male: 1500,
  female: 1200,
} as const;

export type FitnessGoal = keyof typeof GOAL_ADJUSTMENTS;
export type FitnessGender = keyof typeof CALORIE_FLOORS;
export type FitnessExperience = 'beginner' | 'intermediate' | 'advanced';

