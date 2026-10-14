export type LoggedSet = { exercise_id: string; weight_kg: number; reps: number };

export function calculateVolume(sets: LoggedSet[]): number {
  return sets.reduce((total, set) => total + set.weight_kg * set.reps, 0);
}

export function findPersonalRecords(currentSets: LoggedSet[], previousSets: LoggedSet[]): string[] {
  const previousMax = new Map<string, number>();
  previousSets.forEach((set) => previousMax.set(set.exercise_id, Math.max(previousMax.get(set.exercise_id) ?? 0, set.weight_kg)));
  const currentMax = new Map<string, number>();
  currentSets.forEach((set) => currentMax.set(set.exercise_id, Math.max(currentMax.get(set.exercise_id) ?? 0, set.weight_kg)));
  return [...currentMax.entries()]
    .filter(([exerciseId, weight]) => weight > 0 && weight > (previousMax.get(exerciseId) ?? 0))
    .map(([exerciseId]) => exerciseId);
}

export function calculateDuration(startedAt: string, finishedAt: string | null = null, now = new Date()): number {
  const end = finishedAt ? new Date(finishedAt) : now;
  return Math.max(0, Math.round((end.getTime() - new Date(startedAt).getTime()) / 60000));
}
