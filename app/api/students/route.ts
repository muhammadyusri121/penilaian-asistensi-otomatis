import { NextResponse } from 'next/server';
import { createStudent, getGradingSnapshot } from '@/lib/server/gradingStore';
import { getAuthenticatedUsername } from '@/lib/server/auth';

export async function GET() {
  try {
    const ownerUsername = getAuthenticatedUsername();
    if (!ownerUsername) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const snapshot = await getGradingSnapshot(ownerUsername);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Failed to load grading data', error);
    return NextResponse.json(
      { error: 'Gagal memuat data dari database.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ownerUsername = getAuthenticatedUsername();
    if (!ownerUsername) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const nim = typeof body.nim === 'string' ? body.nim.trim() : '';
    const nama = typeof body.nama === 'string' ? body.nama.trim() : '';

    if (!nim || !nama) {
      return NextResponse.json(
        { error: 'NIM dan nama harus diisi.' },
        { status: 400 }
      );
    }

    const student = await createStudent(nim, nama, ownerUsername);
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    ) {
      return NextResponse.json(
        { error: 'NIM sudah terdaftar untuk akun ini.' },
        { status: 409 }
      );
    }

    console.error('Failed to create student', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan mahasiswa.' },
      { status: 500 }
    );
  }
}
