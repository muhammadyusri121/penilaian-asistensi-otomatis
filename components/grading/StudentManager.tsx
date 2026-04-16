import { useCallback, useState } from 'react';
import { UserPlus, Trash2, ChevronRight, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ShieldAlert } from 'lucide-react';
import { gradingConfig } from '@/lib/gradingConfig';
import type { Student, ModuleScores, AssistanceSession } from '@/lib/gradingTypes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface StudentManagerProps {
  students: Student[];
  activeStudentId: string | null;
  moduleScores: ModuleScores;
  assistanceSessions: Record<string, AssistanceSession[]>;
  onAddStudent: (nim: string, nama: string) => void;
  onSelectStudent: (id: string) => void;
  onDeleteStudent: (id: string) => void;
  disabled?: boolean;
}

export default function StudentManager({
  students,
  activeStudentId,
  moduleScores,
  assistanceSessions,
  onAddStudent,
  onSelectStudent,
  onDeleteStudent,
  disabled = false,
}: StudentManagerProps) {
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [error, setError] = useState('');
  
  // States for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');

  const moduleCriteria = gradingConfig
    .filter((g) => g.type === 'modul')
    .flatMap((g) => g.criteria);

  const handleAdd = () => {
    const trimNim = nim.trim();
    const trimNama = nama.trim();

    if (!trimNim || !trimNama) {
      setError('NIM dan Nama harus diisi.');
      return;
    }
    if (students.some((s) => s.nim === trimNim)) {
      setError('NIM sudah terdaftar.');
      return;
    }

    onAddStudent(trimNim, trimNama);
    setNim('');
    setNama('');
    setError('');
  };

  const generateCode = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setDeleteCode(generateCode());
    setUserInputCode('');
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userInputCode.toUpperCase() === deleteCode && studentToDelete) {
      onDeleteStudent(studentToDelete.id);
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const isComplete = (studentId: string) => {
    const scores = moduleScores[studentId] || {};
    return moduleCriteria.every((c) => scores[c.id]?.finalScore != null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Tambah Mahasiswa
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
              NIM
            </label>
            <Input
              type="text"
              value={nim}
              disabled={disabled}
              onChange={(e) => {
                setNim(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Contoh: 12345678"
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
              Nama Lengkap
            </label>
            <Input
              type="text"
              value={nama}
              disabled={disabled}
              onChange={(e) => {
                setNama(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Contoh: Budi Santoso"
              className="rounded-xl"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Mahasiswa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Daftar Mahasiswa
          </h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
            {students.length} mahasiswa
          </span>
        </div>

        {students.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">Belum ada mahasiswa</p>
            <p className="text-xs text-slate-300 mt-1">
              Tambahkan mahasiswa di atas
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {students.map((s) => {
              const complete = isComplete(s.id);
              const isActive = s.id === activeStudentId;
              const sessionCount = assistanceSessions[s.id]?.length ?? 0;

              return (
                <li key={s.id}>
                  <button
                    onClick={() => onSelectStudent(s.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                      isActive
                        ? 'bg-sky-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        complete
                          ? 'bg-emerald-100 text-emerald-600'
                          : isActive
                          ? 'bg-sky-100 text-sky-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        s.nama.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-sky-700' : 'text-slate-700'
                        }`}
                      >
                        {s.nama}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {s.nim} &middot; {sessionCount} sesi asistensi
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(s);
                        }}
                        disabled={disabled}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-sky-400' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-[400px]">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">
              Apakah anda yakin?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 leading-relaxed text-sm">
              Tindakan ini akan menghapus data mahasiswa <b>{studentToDelete?.nama}</b> dan seluruh riwayat nilai sesi yang terkait secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">
              Ketikan kode berikut untuk konfirmasi:
            </p>
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl font-black tracking-[0.5em] text-slate-800 bg-white px-6 py-2 rounded-lg border border-slate-200 select-none tabular-nums shadow-sm">
                {deleteCode}
              </span>
              <Input
                type="text"
                value={userInputCode}
                onChange={(e) => setUserInputCode(e.target.value)}
                placeholder="Masukkan 3 karakter di atas"
                className="text-center font-bold uppercase tracking-widest border-slate-200 focus:ring-rose-400 focus:border-rose-400 rounded-xl h-12"
                maxLength={3}
                autoFocus
              />
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-semibold border-slate-200 text-slate-600 hover:bg-slate-50">
              Batal
            </AlertDialogCancel>
            <button
              onClick={handleConfirmDelete}
              disabled={userInputCode.toUpperCase() !== deleteCode}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-100"
            >
              Hapus Permanen
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
