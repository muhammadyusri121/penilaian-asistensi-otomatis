import { NextResponse } from 'next/server';
import { deleteSession, updateSession } from '@/lib/server/gradingStore';
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

    const { label } = await request.json();
    const updatedSession = await updateSession(params.id, label, ownerUsername);
    
    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    if (error instanceof Error && error.message === 'SESI_TIDAK_DITEMUKAN') {
      return NextResponse.json(
        { error: 'Sesi asistensi tidak ditemukan.' },
        { status: 404 }
      );
    }

    console.error('Failed to update assistance session', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui sesi asistensi.' },
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

    await deleteSession(params.id, ownerUsername);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'SESI_TIDAK_DITEMUKAN') {
      return NextResponse.json(
        { error: 'Sesi asistensi tidak ditemukan.' },
        { status: 404 }
      );
    }

    console.error('Failed to delete assistance session', error);
    return NextResponse.json(
      { error: 'Gagal menghapus sesi asistensi.' },
      { status: 500 }
    );
  }
}
