export type ExerciseMediaMapping = {
  datasetFolder: string;
  datasetName: string;
  datasetEquipment: string;
  datasetPrimaryMuscle: string;
};

/**
 * Reviewed against free-exercise-db by name, equipment, and primary muscle.
 * Exercises without a confident match are intentionally not included.
 */
export const exerciseMediaMap: Record<string, ExerciseMediaMapping> = {
  'bodyweight-squat': {
    datasetFolder: 'Bodyweight_Squat',
    datasetName: 'Bodyweight Squat',
    datasetEquipment: 'body only',
    datasetPrimaryMuscle: 'quadriceps',
  },
  'dumbbell-bench-press': {
    datasetFolder: 'Dumbbell_Bench_Press',
    datasetName: 'Dumbbell Bench Press',
    datasetEquipment: 'dumbbell',
    datasetPrimaryMuscle: 'chest',
  },
  'dumbbell-shoulder-press': {
    datasetFolder: 'Dumbbell_Shoulder_Press',
    datasetName: 'Dumbbell Shoulder Press',
    datasetEquipment: 'dumbbell',
    datasetPrimaryMuscle: 'shoulders',
  },
  'barbell-hip-thrust': {
    datasetFolder: 'Barbell_Hip_Thrust',
    datasetName: 'Barbell Hip Thrust',
    datasetEquipment: 'barbell',
    datasetPrimaryMuscle: 'glutes',
  },
  'leg-press': {
    datasetFolder: 'Leg_Press',
    datasetName: 'Leg Press',
    datasetEquipment: 'machine',
    datasetPrimaryMuscle: 'quadriceps',
  },
  'seated-leg-curl': {
    datasetFolder: 'Seated_Leg_Curl',
    datasetName: 'Seated Leg Curl',
    datasetEquipment: 'machine',
    datasetPrimaryMuscle: 'hamstrings',
  },
};
