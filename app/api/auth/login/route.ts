import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAuthToken, getAuthCookieName } from '@/lib/server/auth';
import { getAuthUserByUsername } from '@/lib/server/userStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi.' },
        { status: 400 }
      );
    }

    const authUser = await getAuthUserByUsername(username);
    if (
      !authUser ||
      authUser.isActive === false ||
      !authUser.passwordHash ||
      !authUser.passwordSalt
    ) {
      return NextResponse.json(
        { error: 'Username atau password salah.' },
        { status: 401 }
      );
    }

    const computedHash = crypto
      .scryptSync(password, authUser.passwordSalt, 64)
      .toString('hex');

    const hashMatches =
      computedHash.length === authUser.passwordHash.length &&
      crypto.timingSafeEqual(
        Buffer.from(computedHash, 'utf8'),
        Buffer.from(authUser.passwordHash, 'utf8')
      );

    if (!hashMatches) {
      return NextResponse.json(
        { error: 'Username atau password salah.' },
        { status: 401 }
      );
    }

    const token = createAuthToken({
      username: authUser.username,
      issuedAt: Date.now(),
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getAuthCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Failed to login', error);
    return NextResponse.json({ error: 'Gagal login.' }, { status: 500 });
  }
}