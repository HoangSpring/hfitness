import { describe, expect, it } from 'vitest';
import { localizeExercise, localizeFood } from './content-localization';

const exercise = {
  name: 'Push-Up',
  description: 'English description',
  instructions: ['Place your hands.', 'Lower your body.'],
  safety_notes: 'Keep your spine neutral.',
};

describe('content localization', () => {
  it('uses Vietnamese fields when a complete translation exists', () => {
    const result = localizeExercise(exercise, {
      name: 'Chống đẩy',
      description: 'Mô tả',
      instructions: ['Đặt tay.', 'Hạ người.'],
      safety_notes: 'Giữ lưng trung lập.',
    }, 'vi');
    expect(result.name).toBe('Chống đẩy');
    expect(result.instructions).toEqual(['Đặt tay.', 'Hạ người.']);
  });

  it('falls back to English for missing or empty translation fields', () => {
    expect(localizeExercise(exercise, { name: 'Chống đẩy', instructions: [] }, 'vi')).toEqual({ ...exercise, name: 'Chống đẩy' });
    expect(localizeFood({ name: 'Rice' }, undefined, 'vi')).toEqual({ name: 'Rice' });
  });

  it('does not localize English content in the English locale', () => {
    expect(localizeFood({ name: 'Rice' }, { name: 'Cơm' }, 'en')).toEqual({ name: 'Rice' });
  });
});
