import { describe, expect, it } from 'vitest';
import { getCurrentWorkoutDayIndex, getScheduledWeekday, getWeeklySchedule, getWorkoutDayState, requiresPastWorkoutConfirmation, type PlanDay } from './workout';

function day(dayIndex: number, progress: PlanDay['progress'] = null): PlanDay {
  return {
    id: `day-${dayIndex}`,
    day_index: dayIndex,
    name: `Day ${dayIndex}`,
    muscle_focus: 'full_body',
    workout_plan_exercises: [],
    progress,
  };
}

describe('workout day progression', () => {
  const now = new Date('2026-11-14T05:00:00.000Z');

  it('waits until tomorrow after completing the previous day today', () => {
    const days = [
      day(1, { status: 'COMPLETED', finished_at: '2026-11-14T04:00:00.000Z' }),
      day(2),
    ];

    expect(getCurrentWorkoutDayIndex(days, now)).toBeNull();
    expect(getWorkoutDayState(days, 1, now)).toBe('locked');
  });

  it('opens the next day after the completed day is no longer today', () => {
    const days = [
      day(1, { status: 'COMPLETED', finished_at: '2026-11-13T04:00:00.000Z' }),
      day(2),
    ];

    expect(getCurrentWorkoutDayIndex(days, now)).toBe(1);
    expect(getWorkoutDayState(days, 1, now)).toBe('up_next');
  });

  it('opens the next day immediately after skipping a day', () => {
    const days = [
      day(1, { status: 'SKIPPED', finished_at: '2026-11-14T04:00:00.000Z' }),
      day(2),
    ];

    expect(getCurrentWorkoutDayIndex(days, now)).toBe(1);
    expect(getWorkoutDayState(days, 1, now)).toBe('up_next');
  });
});

describe('weekly workout schedule', () => {
  it('shows five workout days followed by two rest days', () => {
    const schedule = getWeeklySchedule([1, 2, 3, 4, 5].map((dayIndex) => day(dayIndex)));

    expect(schedule.map((entry) => entry.day?.day_index ?? null)).toEqual([1, 2, 3, 4, 5, null, null]);
  });

  it('spreads three workout days across the week', () => {
    const schedule = getWeeklySchedule([1, 2, 3].map((dayIndex) => day(dayIndex)));

    expect(schedule.map((entry) => entry.day?.day_index ?? null)).toEqual([1, null, 2, null, 3, null, null]);
  });

  it('requires confirmation for a missed earlier weekday but not for a future weekday', () => {
    const days = [1, 2, 3, 4, 5].map((dayIndex) => day(dayIndex));
    const tuesday = new Date('2026-11-17T12:00:00.000');

    expect(getScheduledWeekday(days, 0)).toBe('Mon');
    expect(requiresPastWorkoutConfirmation(days, 0, tuesday)).toBe(true);
    expect(requiresPastWorkoutConfirmation(days, 2, tuesday)).toBe(false);
  });
});
