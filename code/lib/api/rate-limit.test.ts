import { checkRateLimit } from './rate-limit';

describe('rate limit', () => {
  it('tracks usage within a window', () => {
    const config = { limit: 2, windowMs: 60_000 };
    const key = `test:${Date.now()}`;

    const first = checkRateLimit(key, config);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    const second = checkRateLimit(key, config);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    const third = checkRateLimit(key, config);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });
});
