import { NextResponse } from 'next/server';
import { upsertModuleScore } from '@/lib/server/gradingStore';
import type { CriterionScore } from '@/lib/gradingTypes';
import { getAuthenticatedUsername } from '@/lib/server/auth';

export async function PUT(request: Request) {
  try {
    const ownerUsername = getAuthenticatedUsername();
    if (!ownerUsername) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const assistanceSessionId =
      typeof body.assistanceSessionId === 'string'
        ? body.assistanceSessionId.trim()
        : '';

    const score: CriterionScore = {
      criterionId:
        typeof body.criterionId === 'string' ? body.criterionId : '',
      quickSelect:
        body.quickSelect === null ||
        body.quickSelect === 'sangat_baik' ||
        body.quickSelect === 'baik' ||
        body.quickSelect === 'cukup' ||
        body.quickSelect === 'kurang'
          ? body.quickSelect
          : null,
      manualValue:
        typeof body.manualValue === 'number' ? body.manualValue : null,
      finalScore:
        typeof body.finalScore === 'number' ? body.finalScore : null,
    };

    if (!assistanceSessionId || !score.criterionId) {
      return NextResponse.json(
        { error: 'assistanceSessionId dan criterionId wajib diisi.' },
        { status: 400 }
      );
    }

    await upsertModuleScore(assistanceSessionId, score, ownerUsername);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'SESI_TIDAK_DITEMUKAN') {
      return NextResponse.json(
        { error: 'Sesi asistensi tidak ditemukan.' },
        { status: 404 }
      );
    }

    console.error('Failed to save module score', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan nilai modul.' },
      { status: 500 }
    );
  }
}
