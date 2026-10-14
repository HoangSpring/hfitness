export type AiRequestStatus = 'SUCCEEDED' | 'FAILED' | 'VALIDATION_FAILED';

export function countsTowardDailyLimit(status: string): boolean {
  return status === 'SUCCEEDED';
}

export function utcDayStart(now = new Date()): string {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}
