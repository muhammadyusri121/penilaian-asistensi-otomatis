import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'penilaian_auth';

function getSecret() {
  return process.env.AUTH_SECRET || 'penilaian-dev-secret';
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export interface AuthSessionPayload {
  username: string;
  issuedAt: number;
}

export function createAuthToken(payload: AuthSessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('hex');

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthSessionPayload | null {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('hex');

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthSessionPayload;
    if (!payload.username || typeof payload.issuedAt !== 'number') return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}

export function getAuthenticatedUsername() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(getAuthCookieName())?.value;
    const session = token ? verifyAuthToken(token) : null;
    return session?.username ?? null;
  } catch {
    // During static analysis/build, cookies() may not be available.
    return null;
  }
}