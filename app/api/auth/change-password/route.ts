import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAuthenticatedUsername } from '@/lib/server/auth';
import {
  getAuthUserByUsername,
  updateUserPassword,
} from '@/lib/server/userStore';

export async function POST(request: Request) {
  try {
    const username = getAuthenticatedUsername();
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password lama dan password baru wajib diisi.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal 6 karakter.' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'Password baru harus berbeda dari password lama.' },
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
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const currentHash = crypto
      .scryptSync(currentPassword, authUser.passwordSalt, 64)
      .toString('hex');

    const currentHashBytes = new TextEncoder().encode(currentHash);
    const storedHashBytes = new TextEncoder().encode(authUser.passwordHash);
    const currentMatches =
      currentHashBytes.length === storedHashBytes.length &&
      crypto.timingSafeEqual(currentHashBytes, storedHashBytes);

    if (!currentMatches) {
      return NextResponse.json(
        { error: 'Password lama salah.' },
        { status: 401 }
      );
    }

    const nextSalt = crypto.randomBytes(16).toString('hex');
    const nextHash = crypto.scryptSync(newPassword, nextSalt, 64).toString('hex');

    const updated = await updateUserPassword(username, nextHash, nextSalt);
    if (!updated) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to change password', error);
    return NextResponse.json(
      { error: 'Gagal mengubah password.' },
      { status: 500 }
    );
  }
}
