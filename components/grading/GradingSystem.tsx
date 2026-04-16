'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Download,
  GraduationCap,
  KeyRound,
  LogOut,
  TriangleAlert as AlertTriangle,
} from 'lucide-react';
import { gradingConfig } from '@/lib/gradingConfig';
import { exportStudentToExcel } from '@/lib/exportExcel';
import StudentManager from './StudentManager';
import GradingForm from './GradingForm';
import type {
  AssistanceScores,
  AssistanceSession,
  CriterionScore,
  ModuleScores,
  Student,
} from '@/lib/gradingTypes';

interface GradingSystemProps {
  currentUser: {
    username: string;
    fullName: string;
  };
}

export default function GradingSystem({ currentUser }: GradingSystemProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, AssistanceSession[]>>({});
  const [moduleScores, setModuleScores] = useState<ModuleScores>({});
  const [assistanceScores, setAssistanceScores] = useState<AssistanceScores>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [exportError, setExportError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const saveTimersRef = useRef<Record<string, number>>({});

  const moduleCriteria = gradingConfig
    .filter((group) => group.type === 'modul')
    .flatMap((group) => group.criteria);
  const assistanceCriteria = gradingConfig
    .filter((group) => group.type === 'asistensi')
    .flatMap((group) => group.criteria);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const studentResponse = await fetch('/api/students', { cache: 'no-store' });
      const studentData = await studentResponse.json();

      if (!studentResponse.ok) {
        throw new Error(studentData.error || 'Gagal memuat data.');
      }

      setStudents(studentData.students);
      setSessions(studentData.sessions);
      setModuleScores(studentData.moduleScores);
      setAssistanceScores(studentData.assistanceScores);
      setActiveStudentId((current) => {
        if (
          current &&
          studentData.students.some((student: Student) => student.id === current)
        ) {
          return current;
        }
        return studentData.students[0]?.id ?? null;
      });
    } catch (error) {
      console.error(error);
      setLoadError(
        error instanceof Error ? error.message : 'Gagal memuat data dari database.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }, []);

  const handleChangePassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPasswordError('');
      setPasswordSuccess('');

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setPasswordError('Semua field password wajib diisi.');
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError('Password baru minimal 6 karakter.');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setPasswordError('Konfirmasi password baru tidak cocok.');
        return;
      }

      setIsChangingPassword(true);
      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal mengubah password.');
        }

        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordSuccess('Password berhasil diubah.');
      } catch (error) {
        setPasswordError(
          error instanceof Error ? error.message : 'Gagal mengubah password.'
        );
      } finally {
        setIsChangingPassword(false);
      }
    },
    [confirmNewPassword, currentPassword, newPassword]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  const currentSessions = activeStudentId ? sessions[activeStudentId] || [] : [];

  useEffect(() => {
    if (!activeStudentId) {
      setActiveSessionId(null);
      return;
    }

    const studentSessions = sessions[activeStudentId] || [];
    setActiveSessionId((current) => {
      if (current && studentSessions.some((session) => session.id === current)) {
        return current;
      }
      return studentSessions[0]?.id ?? null;
    });
  }, [activeStudentId, sessions]);

  const handleAddStudent = useCallback(async (nim: string, nama: string) => {
    setSyncError('');

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, nama }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menambahkan mahasiswa.');
      }

      const student = data.student as Student;
      setStudents((prev) => [...prev, student]);
      setSessions((prev) => ({ ...prev, [student.id]: [] }));
      setActiveStudentId(student.id);
      setActiveSessionId(null);
    } catch (error) {
      console.error(error);
      setSyncError(
        error instanceof Error ? error.message : 'Gagal menambahkan mahasiswa.'
      );
    }
  }, []);

  const handleUpdateStudent = useCallback(async (id: string, nim: string, nama: string) => {
    setSyncError('');

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, nama }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui mahasiswa.');
      }

      const updatedStudent = data.student as Student;
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? updatedStudent : s))
      );
    } catch (error) {
      console.error(error);
      setSyncError(
        error instanceof Error ? error.message : 'Gagal memperbarui mahasiswa.'
      );
    }
  }, []);

  const handleDeleteStudent = useCallback(
    async (studentId: string) => {
      setSyncError('');

      try {
        const response = await fetch(`/api/students/${studentId}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal menghapus mahasiswa.');
        }

        const studentSessionIds = (sessions[studentId] || []).map((session) => session.id);
        setStudents((prev) => prev.filter((student) => student.id !== studentId));
        setSessions((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
        setModuleScores((prev) => {
          const next = { ...prev };
          studentSessionIds.forEach((sessionId) => delete next[sessionId]);
          return next;
        });
        setAssistanceScores((prev) => {
          const next = { ...prev };
          studentSessionIds.forEach((sessionId) => delete next[sessionId]);
          return next;
        });

        if (activeStudentId === studentId) {
          setActiveStudentId(null);
          setActiveSessionId(null);
        }
      } catch (error) {
        console.error(error);
        setSyncError(
          error instanceof Error ? error.message : 'Gagal menghapus mahasiswa.'
        );
      }
    },
    [activeStudentId, sessions]
  );

  const handleAddSession = useCallback(
    async (tglAsistensi: string) => {
      if (!activeStudentId) return;
      setSyncError('');

      try {
        const response = await fetch('/api/assistances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: activeStudentId, tglAsistensi }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal menambahkan sesi penilaian.');
        }

        const session = data.session as AssistanceSession;
        setSessions((prev) => ({
          ...prev,
          [activeStudentId]: [...(prev[activeStudentId] || []), session],
        }));
        setModuleScores((prev) => ({ ...prev, [session.id]: {} }));
        setAssistanceScores((prev) => ({ ...prev, [session.id]: {} }));
        setActiveSessionId(session.id);
      } catch (error) {
        console.error(error);
        setSyncError(
          error instanceof Error ? error.message : 'Gagal menambahkan sesi penilaian.'
        );
      }
    },
    [activeStudentId]
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!activeStudentId) return;
      setSyncError('');

      try {
        const response = await fetch(`/api/assistances/${sessionId}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal menghapus sesi penilaian.');
        }

        setSessions((prev) => ({
          ...prev,
          [activeStudentId]: (prev[activeStudentId] || []).filter(
            (session) => session.id !== sessionId
          ),
        }));
        setModuleScores((prev) => {
          const next = { ...prev };
          delete next[sessionId];
          return next;
        });
        setAssistanceScores((prev) => {
          const next = { ...prev };
          delete next[sessionId];
          return next;
        });
      } catch (error) {
        console.error(error);
        setSyncError(
          error instanceof Error ? error.message : 'Gagal menghapus sesi penilaian.'
        );
      }
    },
    [activeStudentId]
  );

  const persistScore = useCallback(
    async (
      endpoint: '/api/scores' | '/api/assistance-scores',
      sessionId: string,
      score: CriterionScore
    ) => {
      const keyName =
        endpoint === '/api/scores' ? 'assistanceSessionId' : 'assistanceSessionId';

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [keyName]: sessionId,
          criterionId: score.criterionId,
          quickSelect: score.quickSelect,
          manualValue: score.manualValue,
          finalScore: score.finalScore,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan nilai.');
      }
    },
    []
  );

  const handleModuleScoreChange = useCallback(
    (criterionId: string, score: CriterionScore) => {
      if (!activeSessionId) return;
      setSyncError('');

      setModuleScores((prev) => ({
        ...prev,
        [activeSessionId]: {
          ...(prev[activeSessionId] || {}),
          [criterionId]: score,
        },
      }));

      const timerKey = `module:${activeSessionId}:${criterionId}`;
      if (saveTimersRef.current[timerKey]) {
        window.clearTimeout(saveTimersRef.current[timerKey]);
      }

      saveTimersRef.current[timerKey] = window.setTimeout(async () => {
        try {
          await persistScore('/api/scores', activeSessionId, score);
        } catch (error) {
          console.error(error);
          setSyncError(
            error instanceof Error ? error.message : 'Gagal menyimpan nilai modul.'
          );
        } finally {
          delete saveTimersRef.current[timerKey];
        }
      }, 400);
    },
    [activeSessionId, persistScore]
  );

  const handleAssistanceScoreChange = useCallback(
    (criterionId: string, score: CriterionScore) => {
      if (!activeSessionId) return;
      setSyncError('');

      setAssistanceScores((prev) => ({
        ...prev,
        [activeSessionId]: {
          ...(prev[activeSessionId] || {}),
          [criterionId]: score,
        },
      }));

      const timerKey = `assistance:${activeSessionId}:${criterionId}`;
      if (saveTimersRef.current[timerKey]) {
        window.clearTimeout(saveTimersRef.current[timerKey]);
      }

      saveTimersRef.current[timerKey] = window.setTimeout(async () => {
        try {
          await persistScore('/api/assistance-scores', activeSessionId, score);
        } catch (error) {
          console.error(error);
          setSyncError(
            error instanceof Error
              ? error.message
              : 'Gagal menyimpan nilai asistensi.'
          );
        } finally {
          delete saveTimersRef.current[timerKey];
        }
      }, 400);
    },
    [activeSessionId, persistScore]
  );

  const handleExport = useCallback(() => {
    if (!activeStudentId) {
      setExportError('Pilih mahasiswa yang ingin diekspor.');
      return;
    }

    const student = students.find((item) => item.id === activeStudentId);
    if (!student) {
      setExportError('Mahasiswa aktif tidak ditemukan.');
      return;
    }

    const studentSessions = sessions[activeStudentId] || [];
    if (studentSessions.length === 0) {
      setExportError('Mahasiswa ini belum punya sesi penilaian.');
      return;
    }

    const incompleteSession = studentSessions.find((session) => {
      const moduleComplete = moduleCriteria.every(
        (criterion) => moduleScores[session.id]?.[criterion.id]?.finalScore != null
      );
      const assistanceComplete = assistanceCriteria.every(
        (criterion) =>
          assistanceScores[session.id]?.[criterion.id]?.finalScore != null
      );
      return !moduleComplete || !assistanceComplete;
    });

    if (incompleteSession) {
      setExportError(
        `Nilai sesi tanggal ${incompleteSession.tglAsistensi} belum lengkap.`
      );
      return;
    }

    setExportError('');
    exportStudentToExcel(student, studentSessions, moduleScores, assistanceScores);
  }, [
    activeStudentId,
    assistanceCriteria,
    assistanceScores,
    moduleCriteria,
    moduleScores,
    sessions,
    students,
  ]);

  const activeStudent = students.find((student) => student.id === activeStudentId) || null;
  const completeSessionCount = students.reduce((sum, student) => {
    const studentSessions = sessions[student.id] || [];
    return (
      sum +
      studentSessions.filter((session) => {
        const moduleComplete = moduleCriteria.every(
          (criterion) => moduleScores[session.id]?.[criterion.id]?.finalScore != null
        );
        const assistanceComplete = assistanceCriteria.every(
          (criterion) =>
            assistanceScores[session.id]?.[criterion.id]?.finalScore != null
        );
        return moduleComplete && assistanceComplete;
      }).length
    );
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                  Sistem Penilaian Praktikum
                </h1>
                <p className="text-xs text-slate-500">
                  Selamat datang, <span className="font-semibold">{currentUser.fullName}</span>
                  <span className="text-slate-400"> ({currentUser.username})</span>
                </p>
                <p className="text-xs text-slate-400">
                  {completeSessionCount > 0
                    ? `${completeSessionCount} sesi penilaian lengkap`
                    : 'Tambahkan mahasiswa untuk memulai'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(exportError || syncError || loadError) && (
                <div className="hidden md:flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl max-w-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-clamp-2">{loadError || syncError || exportError}</span>
                </div>
              )}
              <button
                onClick={() => {
                  setShowPasswordForm((prev) => !prev);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span className="hidden sm:inline">Ubah Sandi</span>
              </button>
              <button
                onClick={handleExport}
                disabled={!activeStudent || isLoading}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Nilai Mahasiswa</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {showPasswordForm && (
            <form
              onSubmit={handleChangePassword}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4"
            >
              <p className="text-sm font-semibold text-slate-700 mb-3">Ubah Sandi Akun</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="password"
                  placeholder="Password lama"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Password baru"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Konfirmasi password baru"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>
              {(passwordError || passwordSuccess) && (
                <p
                  className={`mt-3 text-xs ${
                    passwordError ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {passwordError || passwordSuccess}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl px-4 py-2"
                >
                  {isChangingPassword ? 'Menyimpan...' : 'Simpan Sandi'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl px-4 py-2"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>

        {(exportError || syncError || loadError) && (
          <div className="md:hidden px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{loadError || syncError || exportError}</span>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-4">
            <StudentManager
              students={students}
              activeStudentId={activeStudentId}
              moduleScores={moduleScores}
              assistanceSessions={sessions}
              onAddStudent={handleAddStudent}
              onSelectStudent={setActiveStudentId}
              onDeleteStudent={handleDeleteStudent}
              disabled={isLoading}
            />
          </aside>

          <section>
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px] rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
                Memuat data dari PostgreSQL...
              </div>
            ) : activeStudent ? (
              <GradingForm
                key={activeStudent.id}
                student={activeStudent}
                sessions={currentSessions}
                moduleScores={moduleScores}
                assistanceScores={assistanceScores}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onAddSession={handleAddSession}
                onDeleteSession={handleDeleteSession}
                onUpdateStudent={handleUpdateStudent}
                onModuleScoreChange={handleModuleScoreChange}
                onAssistanceScoreChange={handleAssistanceScoreChange}
              />
            ) : (
              <EmptyState hasStudents={students.length > 0} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ hasStudents }: { hasStudents: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <GraduationCap className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-2">
        {hasStudents ? 'Pilih Mahasiswa' : 'Mulai Penilaian'}
      </h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
        {hasStudents
          ? 'Pilih mahasiswa dari daftar di sebelah kiri untuk mulai mengisi penilaian.'
          : 'Tambahkan mahasiswa terlebih dahulu menggunakan formulir di sebelah kiri, lalu mulai mengisi nilai.'}
      </p>
    </div>
  );
}
