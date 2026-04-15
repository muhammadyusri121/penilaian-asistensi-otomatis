import { NextResponse } from 'next/server';
import { deleteStudent } from '@/lib/server/gradingStore';

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
    await deleteStudent(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete student', error);
    return NextResponse.json(
      { error: 'Gagal menghapus mahasiswa.' },
      { status: 500 }
    );
  }
}
