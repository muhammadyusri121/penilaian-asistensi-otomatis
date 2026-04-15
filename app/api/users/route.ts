import { NextResponse } from 'next/server';
import { getAuthenticatedUsername } from '@/lib/server/auth';
import { getUserByUsername } from '@/lib/server/userStore';

export async function GET() {
  try {
    const username = getAuthenticatedUsername();
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserByUsername(username);
    return NextResponse.json({ users: user ? [user] : [] });
  } catch (error) {
    console.error('Failed to load users', error);
    return NextResponse.json(
      { error: 'Gagal memuat data user.' },
      { status: 500 }
    );
  }
}