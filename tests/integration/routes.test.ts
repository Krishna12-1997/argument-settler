import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { aiClient } from '../../src/services/aiClient.js';
import http from 'http';

describe('Court Routes Integration', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('rejects invalid request body with 400 on /guard', async () => {
    const res = await fetch(`${baseUrl}/guard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }) // empty string invalid
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('successfully handles /guard with mocked AI client', async () => {
    vi.spyOn(aiClient, 'callStructured').mockResolvedValueOnce({
      data: {
        is_safe: true,
        flagged_categories: [],
        reasoning: 'Safe dispute'
      },
      telemetry: {
        latencyMs: 120,
        inputTokens: 40,
        outputTokens: 15,
        model: 'claude-3-5-haiku-latest',
        retried: false,
        usedFallback: false
      }
    });

    const res = await fetch(`${baseUrl}/guard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'He ate my leftovers.' })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.is_safe).toBe(true);
    expect(body.meta.latencyMs).toBe(120);
  });

  it('successfully handles /crossexam with mocked AI client', async () => {
    vi.spyOn(aiClient, 'callStructured').mockResolvedValueOnce({
      data: {
        party_a_question: 'Party A, why did you let the Maggi get soggy?',
        party_b_question: 'Party B, who appointed you the Poha ambassador?',
        contested_issue_summary: 'Breakfast rivalry'
      },
      telemetry: {
        latencyMs: 240,
        inputTokens: 90,
        outputTokens: 50,
        model: 'claude-3-5-haiku-latest',
        retried: false,
        usedFallback: false
      }
    });

    const res = await fetch(`${baseUrl}/crossexam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judge_name: 'Bhide',
        party_a_claim: 'He made soggy noodles.',
        party_b_claim: 'I made traditional Poha!'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.party_a_question).toContain('soggy');
    expect(body.meta.latencyMs).toBe(240);
  });
});
