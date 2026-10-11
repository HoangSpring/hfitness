type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export function logSupabaseFailure(step: string, error: SupabaseErrorLike): void {
  console.error('[fitness assessment] Supabase failure', {
    step,
    code: error.code ?? 'UNKNOWN',
    message: error.message ?? 'Unknown Supabase error',
    details: error.details ?? '',
    hint: error.hint ?? '',
  });
}

export function logFitnessFailure(step: string, error: unknown): void {
  if (error && typeof error === 'object') {
    const candidate = error as SupabaseErrorLike;
    if ('code' in candidate || 'message' in candidate || 'details' in candidate || 'hint' in candidate) {
      logSupabaseFailure(step, candidate);
      return;
    }
  }

  console.error('[fitness assessment] failure', {
    step,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}
