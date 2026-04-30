'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Download,
  GraduationCap,
  KeyRound,
  LogOut,
  TriangleAlert as AlertTriangle,
  Cloud,
  CloudUpload,
  CloudOff,
  Settings,
  ChevronDown,
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
  const [isSyncing, setIsSyncing] = useState(false);
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
    // Setiap kali mahasiswa aktif berubah, reset sesi menjadi null
    // agar user harus memilih sesi secara manual (mencegah salah nilai)
    setActiveSessionId(null);
  }, [activeStudentId]);

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

  const handleUpdateSession = useCallback(async (sessionId: string, label: string | null) => {
    setSyncError('');

    try {
      const response = await fetch(`/api/assistances/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui sesi.');
      }

      const updatedSession = data.session as AssistanceSession;
      setSessions((prev) => {
        const studentId = updatedSession.studentId;
        return {
          ...prev,
          [studentId]: (prev[studentId] || []).map((s) =>
            s.id === sessionId ? updatedSession : s
          ),
        };
      });
    } catch (error) {
      console.error(error);
      setSyncError(
        error instanceof Error ? error.message : 'Gagal memperbarui sesi.'
      );
    }
  }, []);

  const persistScore = useCallback(
    async (
      endpoint: '/api/scores' | '/api/assistance-scores',
      sessionId: string,
      score: CriterionScore
    ) => {
      setIsSyncing(true);
      const keyName =
        endpoint === '/api/scores' ? 'assistanceSessionId' : 'assistanceSessionId';

      try {
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
      } finally {
        // Cek apakah masih ada timer aktif lainnya sebelum mematikan status syncing
        const activeTimers = Object.keys(saveTimersRef.current).length;
        if (activeTimers === 0) {
          setIsSyncing(false);
        }
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
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="h-20 flex items-center justify-between gap-4">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-100 ring-4 ring-sky-50">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                  ASISTENSI<span className="text-sky-500">PRO</span>
                </h1>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Online Server Ready
                  </p>
                </div>
              </div>
            </div>

            {/* Sync Status */}
            <div className="flex-1 flex justify-center px-4">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300 ${syncError
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : isSyncing
                    ? 'bg-sky-50 border-sky-100 text-sky-600'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                }`}>
                {syncError ? (
                  <CloudOff className="w-4 h-4 animate-bounce" />
                ) : isSyncing ? (
                  <CloudUpload className="w-4 h-4 animate-pulse" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <div className="hidden md:block">
                  <p className="text-[10px] font-black uppercase tracking-tighter leading-none mb-0.5">
                    Database Status
                  </p>
                  <p className="text-xs font-bold leading-none">
                    {syncError ? 'Sync Failed' : isSyncing ? 'Uploading...' : 'All Synced'}
                  </p>
                </div>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col items-end mr-2">
                <p className="text-sm font-bold text-slate-800 leading-none">{currentUser.fullName}</p>
                <p className="text-[10px] font-medium text-slate-400">{currentUser.username}</p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button
                  onClick={handleExport}
                  disabled={!activeStudent || isLoading}
                  className="p-2 rounded-xl text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all disabled:opacity-30"
                  title="Export Data"
                >
                  <Download className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="p-2 rounded-xl text-slate-600 hover:bg-white hover:text-sky-600 hover:shadow-sm transition-all"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Content Section (Password Form & Errors) */}
          <div className="pb-4 space-y-4">
            {showPasswordForm && (
              <form
                onSubmit={handleChangePassword}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner"
              >
                <p className="text-sm font-semibold text-slate-700 mb-3 text-center sm:text-left">Ubah Sandi Akun</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="password"
                    placeholder="Password lama"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <input
                    type="password"
                    placeholder="Password baru"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <input
                    type="password"
                    placeholder="Konfirmasi password baru"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                {(passwordError || passwordSuccess) && (
                  <p className={`mt-3 text-xs text-center sm:text-left font-semibold ${passwordError ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {passwordError || passwordSuccess}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl px-6 py-2 shadow-md shadow-indigo-100 transition-all"
                  >
                    {isChangingPassword ? 'Menyimpan...' : 'Simpan Sandi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl px-6 py-2 hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {(exportError || syncError || loadError) && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium">{loadError || syncError || exportError}</span>
              </div>
            )}
          </div>
        </div>
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
                onUpdateSession={handleUpdateSession}
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
