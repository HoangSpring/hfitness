import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('API', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
  });

  it('rejects protected requests without a token', async () => {
    const response = await request(app).get('/api/v1/me/ping');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
