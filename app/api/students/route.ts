import { NextResponse } from 'next/server';
import { createStudent, getGradingSnapshot } from '@/lib/server/gradingStore';

export async function GET() {
  try {
    const snapshot = await getGradingSnapshot();
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
    const body = await request.json();
    const nim = typeof body.nim === 'string' ? body.nim.trim() : '';
    const nama = typeof body.nama === 'string' ? body.nama.trim() : '';

    if (!nim || !nama) {
      return NextResponse.json(
        { error: 'NIM dan nama harus diisi.' },
        { status: 400 }
      );
    }

    const student = await createStudent(nim, nama);
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error('Failed to create student', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan mahasiswa.' },
      { status: 500 }
    );
  }
}
