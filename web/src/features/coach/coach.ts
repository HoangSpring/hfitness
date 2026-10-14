import { apiRequest } from '../../lib/api';
import { supabase } from '../../lib/supabase';

export type Conversation = { id: string; title: string; created_at: string };
export type CoachMessage = { id: string; conversation_id: string; role: 'user' | 'assistant'; content: string; created_at: string };

export async function listConversations(): Promise<Conversation[]> {
  const result = await supabase.from('ai_conversations').select('id,title,created_at').order('created_at', { ascending: false }).limit(50);
  if (result.error) throw result.error;
  return (result.data ?? []) as Conversation[];
}

export async function listMessages(conversationId: string): Promise<CoachMessage[]> {
  const result = await supabase.from('ai_messages').select('id,conversation_id,role,content,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(100);
  if (result.error) throw result.error;
  return (result.data ?? []) as CoachMessage[];
}

export async function sendCoachMessage(input: { conversationId?: string; message: string; timezone?: string; locale?: 'en' | 'vi' }): Promise<{ conversation_id: string; message: string }> {
  return apiRequest('/ai/coach', { method: 'POST', body: JSON.stringify({ conversation_id: input.conversationId, message: input.message, timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, locale: input.locale ?? 'en' }) });
}

export async function deleteConversation(id: string): Promise<void> {
  const result = await supabase.from('ai_conversations').delete().eq('id', id);
  if (result.error) throw result.error;
}
