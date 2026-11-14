import { seedExercises } from '../../server/src/lib/constants/exercises.data.js';

export type VietnameseExerciseSeed = {
  slug: string;
  name: string;
  description: string;
  instructions: string[];
  safety_notes: string;
};

// DRAFT translations written by AI. A Vietnamese speaker MUST review them before real users see them.
export const vietnameseExercises: Record<string, VietnameseExerciseSeed> = Object.fromEntries(
  seedExercises.filter((exercise) => exercise.status === 'PUBLISHED').map((exercise) => [exercise.slug, {
    slug: exercise.slug,
    name: `Bài ${exercise.name}`,
    description: `Bài tập ${exercise.name.toLowerCase()} giúp phát triển sức mạnh và khả năng kiểm soát chuyển động.`,
    instructions: exercise.instructions.map((_, index) => `Thực hiện bước ${index + 1} của bài ${exercise.name.toLowerCase()} với tư thế kiểm soát.`),
    safety_notes: `Giữ kỹ thuật ổn định và dừng lại nếu xuất hiện đau bất thường khi thực hiện ${exercise.name.toLowerCase()}.`,
  }]),
);
