export const exerciseMuscles = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'abdominals',
  'full_body',
  'trapezius',
] as const;

export const exerciseEquipment = [
  'bodyweight',
  'dumbbell',
  'barbell',
  'machine',
  'cable',
  'kettlebell',
  'band',
] as const;

export const exerciseDifficulties = ['beginner', 'intermediate', 'advanced'] as const;

export const exerciseMovementPatterns = [
  'push',
  'pull',
  'squat',
  'hinge',
  'lunge',
  'carry',
  'rotation',
  'isolation',
  'locomotion',
] as const;

export type ExerciseMuscle = typeof exerciseMuscles[number];
export type ExerciseEquipment = typeof exerciseEquipment[number];
export type ExerciseDifficulty = typeof exerciseDifficulties[number];
export type ExerciseMovementPattern = typeof exerciseMovementPatterns[number];
