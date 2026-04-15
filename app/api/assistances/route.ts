import { NextResponse } from 'next/server';
import { createSession } from '@/lib/server/gradingStore';
import { getAuthenticatedUsername } from '@/lib/server/auth';

export async function POST(request: Request) {
  try {
    const ownerUsername = getAuthenticatedUsername();
    if (!ownerUsername) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const studentId =
      typeof body.studentId === 'string' ? body.studentId.trim() : '';
    const tglAsistensi =
      typeof body.tglAsistensi === 'string' ? body.tglAsistensi.trim() : '';

    if (!studentId || !tglAsistensi) {
      return NextResponse.json(
        { error: 'studentId dan tglAsistensi wajib diisi.' },
        { status: 400 }
      );
    }

    const session = await createSession(studentId, tglAsistensi, ownerUsername);
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'MAHASISWA_TIDAK_DITEMUKAN') {
      return NextResponse.json(
        { error: 'Mahasiswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    console.error('Failed to create assistance session', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan sesi asistensi.' },
      { status: 500 }
    );
  }
}
