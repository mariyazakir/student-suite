import { signAuthToken, verifyAuthToken } from './jwt';

describe('jwt auth', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('signs and verifies token payload', async () => {
    const token = await signAuthToken({
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      tier: 'free',
    });

    const payload = await verifyAuthToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('test@example.com');
    expect(payload.tier).toBe('free');
  });
});
