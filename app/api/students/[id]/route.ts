import { NextResponse } from 'next/server';
import { deleteStudent, updateStudent } from '@/lib/server/gradingStore';
import { getAuthenticatedUsername } from '@/lib/server/auth';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const ownerUsername = getAuthenticatedUsername();
    if (!ownerUsername) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { nim, nama } = await request.json();
    if (!nim || !nama) {
      return NextResponse.json(
        { error: 'NIM dan Nama wajib diisi.' },
        { status: 400 }
      );
    }

    const student = await updateStudent(params.id, nim, nama, ownerUsername);
    return NextResponse.json({ ok: true, student });
  } catch (error) {
    if (error instanceof Error && error.message === 'MAHASISWA_TIDAK_DITEMUKAN') {
      return NextResponse.json(
        { error: 'Mahasiswa tidak ditemukan.' },
        { status: 404 }
      );
    }

    console.error('Failed to update student', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui mahasiswa.' },
      { status: 500 }
    );
  }
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
