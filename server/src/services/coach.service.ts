import type { SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { AiProviderError, AiResponseError, createAiProvider, type AiProvider } from '../lib/ai/provider.js';
import { COACH_V1 } from '../lib/ai/prompts.js';
import { utcDayStart } from '../lib/ai/usage.js';
import { AppError } from '../lib/errors.js';
import { serviceSupabaseClient } from '../lib/supabase.js';
import { gatherCoachContext } from './coachContext.service.js';

const FALLBACK_REPLY = 'Recommendation:\nKeep your next step simple and consistent.\n\nWhy:\nSome of your progress data is not available yet, so I cannot make a more specific recommendation.';

async function countCoachRequests(userId: string): Promise<number> {
  const { count, error } = await serviceSupabaseClient
    .from('ai_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'AI_COACH')
    .eq('status', 'SUCCEEDED')
    .gte('created_at', utcDayStart());
  if (error) throw new AppError(500, 'AI_USAGE_READ_FAILED', 'Could not check AI usage.');
  return count ?? 0;
}

async function logCoachRequest(userId: string, status: string, latencyMs: number, errorCode?: string): Promise<void> {
  const { error } = await serviceSupabaseClient.from('ai_requests').insert({ user_id: userId, type: 'AI_COACH', prompt_version: 'COACH_V1', status, latency_ms: latencyMs, error_code: errorCode ?? null });
  if (error) console.error('[ai] coach request log failure', { code: error.code, message: error.message });
}

type CoachDependencies = {
  countRequests?: (userId: string) => Promise<number>;
  logRequest?: (userId: string, status: string, latencyMs: number, errorCode?: string) => Promise<void>;
};

function titleFromMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim().slice(0, 60) || 'New conversation';
}

function safeReply(text: string): string {
  const clean = text.replace(/\0/g, '').trim().slice(0, 4000);
  return clean || FALLBACK_REPLY;
}

export async function answerCoach(
  client: SupabaseClient,
  userId: string,
  input: { conversationId?: string; message: string; timezone: string; locale: 'en' | 'vi' },
  provider: AiProvider = createAiProvider(),
  dependencies: CoachDependencies = {},
): Promise<{ conversation_id: string; message: string }> {
  const count = dependencies.countRequests ?? countCoachRequests;
  const log = dependencies.logRequest ?? logCoachRequest;
  if (await count(userId) >= config.AI_COACH_DAILY_LIMIT) {
    throw new AppError(429, 'AI_RATE_LIMIT', 'You have reached today’s AI Coach limit. Try again tomorrow.');
  }
  let conversationId = input.conversationId;
  if (conversationId) {
    const existing = await client.from('ai_conversations').select('id').eq('id', conversationId).maybeSingle();
    if (existing.error) throw new AppError(500, 'AI_CONVERSATION_READ_FAILED', 'Could not load this conversation.');
    if (!existing.data) throw new AppError(404, 'AI_CONVERSATION_NOT_FOUND', 'Conversation not found.');
  } else {
    const created = await client.from('ai_conversations').insert({ title: titleFromMessage(input.message) }).select('id').single();
    if (created.error || !created.data) throw new AppError(500, 'AI_CONVERSATION_CREATE_FAILED', 'Could not start this conversation.');
    conversationId = created.data.id;
  }
  const userMessage = await client.from('ai_messages').insert({ conversation_id: conversationId, role: 'user', content: input.message }).select('id').single();
  if (userMessage.error) throw new AppError(500, 'AI_MESSAGE_SAVE_FAILED', 'Could not save your message.');
  const started = Date.now();
  try {
    if (!conversationId) throw new AppError(500, 'AI_CONVERSATION_CREATE_FAILED', 'Could not start this conversation.');
    const gathered = await gatherCoachContext(client, input.timezone, conversationId);
    const text = await provider.generateText(COACH_V1(gathered.context, input.message, input.locale));
    const message = safeReply(text);
    const assistant = await client.from('ai_messages').insert({ conversation_id: conversationId, role: 'assistant', content: message }).select('id').single();
    if (assistant.error) throw new AppError(500, 'AI_MESSAGE_SAVE_FAILED', 'Could not save the coach response.');
    await log(userId, 'SUCCEEDED', Date.now() - started);
    return { conversation_id: conversationId, message };
  } catch (error) {
    const code = error instanceof AiProviderError ? error.code : error instanceof AiResponseError ? 'AI_INVALID_RESPONSE' : error instanceof AppError ? error.code : 'AI_PROVIDER_ERROR';
    await log(userId, 'FAILED', Date.now() - started, code);
    if (error instanceof AppError) throw error;
    if (code === 'AI_PROVIDER_TIMEOUT') throw new AppError(502, code, 'The AI Coach took too long to respond. Please try again.');
    throw new AppError(502, code, 'The AI Coach is temporarily unavailable. Please try again.');
  }
}
