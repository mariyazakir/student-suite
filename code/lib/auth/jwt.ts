import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface AuthTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
};

const getTokenExpiry = () => process.env.AUTH_TOKEN_EXPIRES_IN || '7d';

export async function signAuthToken(payload: AuthTokenPayload) {
  const secret = getJwtSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(getTokenExpiry())
    .sign(secret);
}

export async function verifyAuthToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as AuthTokenPayload;
}
