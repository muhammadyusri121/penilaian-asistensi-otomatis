import { NextResponse } from 'next/server';
import { deleteStudent } from '@/lib/server/gradingStore';
import { getAuthenticatedUsername } from '@/lib/server/auth';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const ownerUsername = getAuthenticatedUsername();
    if (!ownerUsername) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await deleteStudent(params.id, ownerUsername);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'MAHASISWA_TIDAK_DITEMUKAN') {
      return NextResponse.json(
        { error: 'Mahasiswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    console.error('Failed to delete student', error);
    return NextResponse.json(
      { error: 'Gagal menghapus mahasiswa.' },
      { status: 500 }
    );
  }
}
