import { describe, expect, it } from 'vitest';
import { AiResponseError, FakeProvider } from './provider.js';
import { generatedPlanSchema } from '../schemas/workout.js';

describe('AI provider response handling', () => {
  it('rejects invalid JSON without treating it as a provider outage', async () => {
    await expect(new FakeProvider('{bad json').generateStructured('prompt', generatedPlanSchema))
      .rejects.toBeInstanceOf(AiResponseError);
  });
});
