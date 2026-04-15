import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/server/gradingStore';

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
    await deleteSession(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete assistance session', error);
    return NextResponse.json(
      { error: 'Gagal menghapus sesi asistensi.' },
      { status: 500 }
    );
  }
}
