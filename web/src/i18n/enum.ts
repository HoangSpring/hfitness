import { t } from './en';

const enumKeys: Record<string, Record<string, string>> = {
  goal: { lose_weight: 'lose_weight', gain_weight: 'gain_weight', build_muscle: 'build_muscle', get_stronger: 'get_stronger', maintain: 'maintain' },
  experience: { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' },
  gender: { male: 'male', female: 'female' },
  equipment: { bodyweight: 'bodyweight', dumbbell: 'dumbbell', barbell: 'barbell', machine: 'machine', cable: 'cable', kettlebell: 'kettlebell', band: 'band' },
  muscle: { chest: 'chest', back: 'back', shoulders: 'shoulders', biceps: 'biceps', triceps: 'triceps', forearms: 'forearms', quadriceps: 'quadriceps', hamstrings: 'hamstrings', glutes: 'glutes', calves: 'calves', abdominals: 'abdominals', abs: 'abs', trapezius: 'trapezius', full_body: 'full_body' },
  difficulty: { BEGINNER: 'BEGINNER', INTERMEDIATE: 'INTERMEDIATE', ADVANCED: 'ADVANCED', beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' },
  movement_pattern: { PUSH: 'PUSH', PULL: 'PULL', SQUAT: 'SQUAT', HINGE: 'HINGE', CARRY: 'CARRY', ROTATION: 'ROTATION', LUNGE: 'LUNGE', ISOLATION: 'ISOLATION', LOCOMOTION: 'LOCOMOTION', push: 'push', pull: 'pull', squat: 'squat', hinge: 'hinge', carry: 'carry', rotation: 'rotation', lunge: 'lunge', isolation: 'isolation', locomotion: 'locomotion' },
  food_category: { PROTEIN: 'PROTEIN', CARB: 'CARB', FAT: 'FAT', FRUIT: 'FRUIT', VEGETABLE: 'VEGETABLE', DAIRY: 'DAIRY', SNACK: 'SNACK', protein: 'protein', carb: 'carb', fat: 'fat', fruit: 'fruit', vegetable: 'vegetable', dairy: 'dairy', snack: 'snack' },
  unit: { g: 'g', kg: 'kg', ml: 'ml', serving: 'serving', piece: 'piece' },
  status: { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED', ARCHIVED: 'ARCHIVED' },
};

export function tEnum(kind: string, value: string): string {
  const key = enumKeys[kind]?.[value] ?? value;
  const enumTranslated = t(`enum.${kind}.${key}`);
  if (enumTranslated !== `enum.${kind}.${key}`) return enumTranslated;
  const translated = t(`onboarding.${key}`);
  if (translated !== `onboarding.${key}`) return translated;
  if (import.meta.env.DEV) console.warn(`[i18n] Missing enum translation: ${kind}.${value}`);
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
