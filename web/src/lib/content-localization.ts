import type { Locale } from '../i18n/en';

export type ExerciseContent = {
  name: string;
  description: string;
  instructions: string[];
  safety_notes: string;
};

export type ExerciseTranslation = Partial<ExerciseContent> & { locale?: 'vi' };
export type FoodContent = { name: string };
export type FoodTranslation = Partial<FoodContent> & { locale?: 'vi' };

export function localizeExercise<T extends ExerciseContent>(exercise: T, translation: ExerciseTranslation | null | undefined, locale: Locale): T {
  if (locale !== 'vi' || !translation) return exercise;
  return {
    ...exercise,
    name: translation.name?.trim() || exercise.name,
    description: translation.description?.trim() || exercise.description,
    instructions: translation.instructions?.length ? translation.instructions : exercise.instructions,
    safety_notes: translation.safety_notes?.trim() || exercise.safety_notes,
  };
}

export function localizeFood<T extends FoodContent>(food: T, translation: FoodTranslation | null | undefined, locale: Locale): T {
  return locale === 'vi' && translation?.name?.trim() ? { ...food, name: translation.name } : food;
}
