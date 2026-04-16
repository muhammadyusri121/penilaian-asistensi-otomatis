import { getDb } from '@/lib/db';
import type {
  AssistanceScores,
  AssistanceSession,
  CriterionScore,
  ModuleScores,
  Student,
} from '@/lib/gradingTypes';

interface StudentRow {
  id: number;
  nim: string;
  nama: string;
  owner_username: string;
}

interface AssistanceSessionRow {
  id: number;
  student_id: number;
  tgl_asistensi: string;
  label: string | null;
}

interface SessionScoreRow {
  assistance_session_id: number;
  criterion_id: string;
  quick_select: CriterionScore['quickSelect'];
  manual_value: number | null;
  final_score: number | null;
}

export interface GradingSnapshot {
  students: Student[];
  sessions: Record<string, AssistanceSession[]>;
  moduleScores: ModuleScores;
  assistanceScores: AssistanceScores;
}

function mapStudent(row: StudentRow): Student {
  return {
    id: String(row.id),
    nim: row.nim,
    nama: row.nama,
  };
}

function mapSession(row: AssistanceSessionRow): AssistanceSession {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    tglAsistensi: row.tgl_asistensi,
    label: row.label,
  };
}

function assignScoreBag(
  bag: Record<string, Record<string, CriterionScore>>,
  sessionId: string,
  row: SessionScoreRow
) {
  bag[sessionId] ??= {};
  bag[sessionId][row.criterion_id] = {
    criterionId: row.criterion_id,
    quickSelect: row.quick_select,
    manualValue: row.manual_value,
    finalScore: row.final_score,
  };
}

export async function getGradingSnapshot(
  ownerUsername: string
): Promise<GradingSnapshot> {
  const db = getDb();
  const studentResult = await db
    .from('students')
    .select('id, nim, nama, owner_username')
    .eq('owner_username', ownerUsername)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (studentResult.error) throw studentResult.error;

  const students = (studentResult.data || []).map((row) =>
    mapStudent(row as StudentRow)
  );

  if (students.length === 0) {
    return { students: [], sessions: {}, moduleScores: {}, assistanceScores: {} };
  }

  const studentIds = students.map((student) => Number(student.id));
  const sessionResult = await db
    .from('assistance_sessions')
    .select('id, student_id, tgl_asistensi, label')
    .in('student_id', studentIds)
    .order('tgl_asistensi', { ascending: true })
    .order('id', { ascending: true });

  if (sessionResult.error) throw sessionResult.error;

  const sessions: Record<string, AssistanceSession[]> = {};
  const moduleScores: ModuleScores = {};
  const assistanceScores: AssistanceScores = {};

  for (const student of students) {
    sessions[student.id] = [];
  }

  for (const row of (sessionResult.data || []) as AssistanceSessionRow[]) {
    const session = mapSession({
      ...row,
      tgl_asistensi: String(row.tgl_asistensi),
    });
    sessions[session.studentId] ??= [];
    sessions[session.studentId].push(session);
    moduleScores[session.id] ??= {};
    assistanceScores[session.id] ??= {};
  }

  const sessionIds = Object.keys(moduleScores).map((sessionId) => Number(sessionId));
  if (sessionIds.length === 0) {
    return { students, sessions, moduleScores, assistanceScores };
  }

  const [moduleScoreResult, assistanceScoreResult] = await Promise.all([
    db
      .from('module_session_scores')
      .select('assistance_session_id, criterion_id, quick_select, manual_value, final_score')
      .in('assistance_session_id', sessionIds),
    db
      .from('assistance_scores')
      .select('assistance_session_id, criterion_id, quick_select, manual_value, final_score')
      .in('assistance_session_id', sessionIds),
  ]);

  if (moduleScoreResult.error) throw moduleScoreResult.error;
  if (assistanceScoreResult.error) throw assistanceScoreResult.error;

  for (const row of (moduleScoreResult.data || []) as SessionScoreRow[]) {
    assignScoreBag(moduleScores, String(row.assistance_session_id), row);
  }

  for (const row of (assistanceScoreResult.data || []) as SessionScoreRow[]) {
    assignScoreBag(assistanceScores, String(row.assistance_session_id), row);
  }

  return { students, sessions, moduleScores, assistanceScores };
}

export async function createStudent(
  nim: string,
  nama: string,
  ownerUsername: string
): Promise<Student> {
  const db = getDb();
  const result = await db
    .from('students')
    .insert({ nim, nama, owner_username: ownerUsername })
    .select('id, nim, nama, owner_username')
    .single();

  if (result.error || !result.data) throw result.error;
  return mapStudent(result.data as StudentRow);
}

export async function updateStudent(
  studentId: string,
  nim: string,
  nama: string,
  ownerUsername: string
): Promise<Student> {
  const db = getDb();
  const ownedStudentId = await getOwnedStudentId(studentId, ownerUsername);
  if (!ownedStudentId) {
    throw new Error('MAHASISWA_TIDAK_DITEMUKAN');
  }

  const result = await db
    .from('students')
    .update({ nim, nama })
    .eq('id', ownedStudentId)
    .select('id, nim, nama, owner_username')
    .single();

  if (result.error || !result.data) throw result.error;
  return mapStudent(result.data as StudentRow);
}

export async function deleteStudent(studentId: string, ownerUsername: string) {
  const db = getDb();
  const ownedStudentId = await getOwnedStudentId(studentId, ownerUsername);
  if (!ownedStudentId) {
    throw new Error('MAHASISWA_TIDAK_DITEMUKAN');
  }

  const result = await db
    .from('students')
    .delete()
    .eq('id', ownedStudentId);
  if (result.error) throw result.error;
}

async function getOwnedStudentId(
  studentId: string,
  ownerUsername: string
): Promise<number | null> {
  const db = getDb();
  const result = await db
    .from('students')
    .select('id')
    .eq('id', Number(studentId))
    .eq('owner_username', ownerUsername)
    .limit(1)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;
  return Number(result.data.id);
}

async function getOwnedSessionId(
  sessionId: string,
  ownerUsername: string
): Promise<number | null> {
  const db = getDb();
  const sessionResult = await db
    .from('assistance_sessions')
    .select('id, student_id')
    .eq('id', Number(sessionId))
    .limit(1)
    .maybeSingle();

  if (sessionResult.error) throw sessionResult.error;
  if (!sessionResult.data) return null;

  const studentResult = await db
    .from('students')
    .select('id')
    .eq('id', Number(sessionResult.data.student_id))
    .eq('owner_username', ownerUsername)
    .limit(1)
    .maybeSingle();

  if (studentResult.error) throw studentResult.error;
  if (!studentResult.data) return null;
  return Number(sessionResult.data.id);
}

export async function createSession(
  studentId: string,
  tglAsistensi: string,
  ownerUsername: string
): Promise<AssistanceSession> {
  const db = getDb();
  const ownedStudentId = await getOwnedStudentId(studentId, ownerUsername);
  if (!ownedStudentId) {
    throw new Error('MAHASISWA_TIDAK_DITEMUKAN');
  }

  const result = await db
    .from('assistance_sessions')
    .insert({
      student_id: ownedStudentId,
      tgl_asistensi: tglAsistensi,
    })
    .select('id, student_id, tgl_asistensi')
    .single();

  if (result.error || !result.data) throw result.error;
  return mapSession({
    ...(result.data as AssistanceSessionRow),
    tgl_asistensi: String(result.data.tgl_asistensi),
  });
}

export async function deleteSession(sessionId: string, ownerUsername: string) {
  const db = getDb();
  const ownedSessionId = await getOwnedSessionId(sessionId, ownerUsername);
  if (!ownedSessionId) {
    throw new Error('SESI_TIDAK_DITEMUKAN');
  }

  const result = await db
    .from('assistance_sessions')
    .delete()
    .eq('id', ownedSessionId);
  if (result.error) throw result.error;
}

export async function updateSession(
  sessionId: string,
  label: string | null,
  ownerUsername: string
): Promise<AssistanceSession> {
  const db = getDb();
  const ownedSessionId = await getOwnedSessionId(sessionId, ownerUsername);
  if (!ownedSessionId) {
    throw new Error('SESI_TIDAK_DITEMUKAN');
  }

  const result = await db
    .from('assistance_sessions')
    .update({ label })
    .eq('id', ownedSessionId)
    .select('id, student_id, tgl_asistensi, label')
    .single();

  if (result.error || !result.data) throw result.error;
  return mapSession({
    ...(result.data as AssistanceSessionRow),
    tgl_asistensi: String(result.data.tgl_asistensi),
  });
}

async function upsertSessionScore(
  tableName: 'module_session_scores' | 'assistance_scores',
  sessionId: string,
  score: CriterionScore,
  ownerUsername: string
) {
  const db = getDb();
  const ownedSessionId = await getOwnedSessionId(sessionId, ownerUsername);
  if (!ownedSessionId) {
    throw new Error('SESI_TIDAK_DITEMUKAN');
  }

  const result = await db.from(tableName).upsert(
    {
      assistance_session_id: ownedSessionId,
      criterion_id: score.criterionId,
      quick_select: score.quickSelect,
      manual_value: score.manualValue,
      final_score: score.finalScore,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'assistance_session_id,criterion_id',
    }
  );

  if (result.error) throw result.error;
}

export async function upsertModuleScore(
  sessionId: string,
  score: CriterionScore,
  ownerUsername: string
) {
  await upsertSessionScore('module_session_scores', sessionId, score, ownerUsername);
}

export async function upsertAssistanceScore(
  sessionId: string,
  score: CriterionScore,
  ownerUsername: string
) {
  await upsertSessionScore('assistance_scores', sessionId, score, ownerUsername);
}
