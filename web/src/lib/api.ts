import { supabase } from './supabase';

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api/v1';

export type ApiError = { code: string; message: string };

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  const body = (await response.json()) as { data?: T; error?: ApiError };
  if (!response.ok || body.error) throw new Error(body.error?.message ?? 'Request failed.');
  if (!('data' in body)) throw new Error('Invalid API response.');
  return body.data as T;
}

