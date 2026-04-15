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
}

interface AssistanceSessionRow {
  id: number;
  student_id: number;
  tgl_asistensi: string;
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

export async function getGradingSnapshot(): Promise<GradingSnapshot> {
  const db = getDb();
  const [studentResult, sessionResult, moduleScoreResult, assistanceScoreResult] =
    await Promise.all([
      db.from('students').select('id, nim, nama').order('created_at', { ascending: true }).order('id', { ascending: true }),
      db.from('assistance_sessions').select('id, student_id, tgl_asistensi').order('tgl_asistensi', { ascending: true }).order('id', { ascending: true }),
      db.from('module_session_scores').select('assistance_session_id, criterion_id, quick_select, manual_value, final_score'),
      db.from('assistance_scores').select('assistance_session_id, criterion_id, quick_select, manual_value, final_score'),
    ]);

  if (studentResult.error) throw studentResult.error;
  if (sessionResult.error) throw sessionResult.error;
  if (moduleScoreResult.error) throw moduleScoreResult.error;
  if (assistanceScoreResult.error) throw assistanceScoreResult.error;

  const students = (studentResult.data || []).map((row) =>
    mapStudent(row as StudentRow)
  );
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

  for (const row of (moduleScoreResult.data || []) as SessionScoreRow[]) {
    assignScoreBag(moduleScores, String(row.assistance_session_id), row);
  }

  for (const row of (assistanceScoreResult.data || []) as SessionScoreRow[]) {
    assignScoreBag(assistanceScores, String(row.assistance_session_id), row);
  }

  return { students, sessions, moduleScores, assistanceScores };
}

export async function createStudent(nim: string, nama: string): Promise<Student> {
  const db = getDb();
  const result = await db
    .from('students')
    .insert({ nim, nama })
    .select('id, nim, nama')
    .single();

  if (result.error || !result.data) throw result.error;
  return mapStudent(result.data as StudentRow);
}

export async function deleteStudent(studentId: string) {
  const db = getDb();
  const result = await db.from('students').delete().eq('id', Number(studentId));
  if (result.error) throw result.error;
}

export async function createSession(
  studentId: string,
  tglAsistensi: string
): Promise<AssistanceSession> {
  const db = getDb();
  const result = await db
    .from('assistance_sessions')
    .insert({
      student_id: Number(studentId),
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

export async function deleteSession(sessionId: string) {
  const db = getDb();
  const result = await db
    .from('assistance_sessions')
    .delete()
    .eq('id', Number(sessionId));
  if (result.error) throw result.error;
}

async function upsertSessionScore(
  tableName: 'module_session_scores' | 'assistance_scores',
  sessionId: string,
  score: CriterionScore
) {
  const db = getDb();
  const result = await db.from(tableName).upsert(
    {
      assistance_session_id: Number(sessionId),
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
  score: CriterionScore
) {
  await upsertSessionScore('module_session_scores', sessionId, score);
}

export async function upsertAssistanceScore(
  sessionId: string,
  score: CriterionScore
) {
  await upsertSessionScore('assistance_scores', sessionId, score);
}
