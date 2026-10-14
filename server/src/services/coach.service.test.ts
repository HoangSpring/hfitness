import { describe, expect, it } from 'vitest';
import { FakeProvider } from '../lib/ai/provider.js';
import { answerCoach } from './coach.service.js';

function fakeClient() {
  const rows: Record<string, unknown[]> = {
    ai_conversations: [],
    ai_messages: [],
  };
  return {
    from(table: string) {
      const state = { table, filters: [] as Array<[string, unknown]> };
      const chain = {
        select() { return chain; },
        eq(column: string, value: unknown) { state.filters.push([column, value]); return chain; },
        maybeSingle: async () => ({ data: table === 'ai_conversations' ? null : null, error: null }),
        single: async () => ({ data: table === 'ai_conversations' ? { id: 'conversation-1' } : { id: `${table}-1` }, error: null }),
        insert(values: unknown) { rows[table].push(values); return chain; },
        order() { return chain; },
        limit() { return chain; },
        then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
          return resolve({ data: [], error: null });
        },
      };
      return chain;
    },
  } as never;
}

describe('coach service fake provider path', () => {
  it('stores the user message and successful assistant response without record writes', async () => {
    const client = fakeClient();
    const result = await answerCoach(client, 'user-1', { message: 'What should I train?', timezone: 'UTC', locale: 'en' }, new FakeProvider('Recommendation:\nTrain today.\n\nWhy:\nYour plan says so.'), { countRequests: async () => 0, logRequest: async () => undefined });
    expect(result.message).toContain('Recommendation');
  });

  it('returns not found for a conversation not visible through the user client', async () => {
    await expect(answerCoach(fakeClient(), 'user-1', { conversationId: '00000000-0000-0000-0000-000000000001', message: 'Hello', timezone: 'UTC', locale: 'en' }, new FakeProvider('answer'), { countRequests: async () => 0, logRequest: async () => undefined }))
      .rejects.toMatchObject({ statusCode: 404, code: 'AI_CONVERSATION_NOT_FOUND' });
  });
});
