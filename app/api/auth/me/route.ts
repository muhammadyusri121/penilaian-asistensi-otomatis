import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthCookieName, verifyAuthToken } from '@/lib/server/auth';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(getAuthCookieName())?.value;
  const session = token ? verifyAuthToken(token) : null;

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: session });
}