'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus2, Trash2, UserCog2, Check, X, PencilLine } from 'lucide-react';
import { gradingConfig } from '@/lib/gradingConfig';
import CriteriaGroup from './CriteriaGroup';
import ScoreSummary from './ScoreSummary';
import type {
  AssistanceScores,
  AssistanceSession,
  CriterionScore,
  ModuleScores,
  Student,
  StudentScores,
} from '@/lib/gradingTypes';

interface GradingFormProps {
  student: Student;
  sessions: AssistanceSession[];
  moduleScores: ModuleScores;
  assistanceScores: AssistanceScores;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onAddSession: (tglAsistensi: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, label: string | null) => void;
  onUpdateStudent: (id: string, nim: string, nama: string) => void;
  onModuleScoreChange: (criterionId: string, score: CriterionScore) => void;
  onAssistanceScoreChange: (criterionId: string, score: CriterionScore) => void;
}

type TabType = 'modul' | 'asistensi';

export default function GradingForm({
  student,
  sessions,
  moduleScores,
  assistanceScores,
  activeSessionId,
  onSelectSession,
  onAddSession,
  onDeleteSession,
  onUpdateSession,
  onUpdateStudent,
  onModuleScoreChange,
  onAssistanceScoreChange,
}: GradingFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('modul');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editNim, setEditNim] = useState(student.nim);
  const [editNama, setEditNama] = useState(student.nama);
  
  // States for session editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionLabelInput, setSessionLabelInput] = useState('');

  useEffect(() => {
    setEditNim(student.nim);
    setEditNama(student.nama);
    setIsEditingStudent(false);
  }, [student]);

  const modulGroups = gradingConfig.filter((g) => g.type === 'modul');
  const asisGroups = gradingConfig.filter((g) => g.type === 'asistensi');
  const modulCriteria = modulGroups.flatMap((g) => g.criteria);
  const asisCriteria = asisGroups.flatMap((g) => g.criteria);

  const activeModuleScores: StudentScores = activeSessionId
    ? moduleScores[activeSessionId] || {}
    : {};
  const activeAssistanceScores: StudentScores = activeSessionId
    ? assistanceScores[activeSessionId] || {}
    : {};

  const modulFilled = activeSessionId
    ? modulCriteria.filter(
        (criterion) => activeModuleScores[criterion.id]?.finalScore != null
      ).length
    : 0;
  const assistanceFilled = activeSessionId
    ? asisCriteria.filter(
        (criterion) => activeAssistanceScores[criterion.id]?.finalScore != null
      ).length
    : 0;

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) =>
        a.tglAsistensi.localeCompare(b.tglAsistensi)
      ),
    [sessions]
  );

  const handleCreateSession = () => {
    if (!newSessionDate) return;
    onAddSession(newSessionDate);
    setNewSessionDate('');
  };

  const handleSaveStudent = () => {
    if (!editNim.trim() || !editNama.trim()) return;
    onUpdateStudent(student.id, editNim.trim(), editNama.trim());
    setIsEditingStudent(false);
  };

  const handleCancelEdit = () => {
    setEditNim(student.nim);
    setEditNama(student.nama);
    setIsEditingStudent(false);
  };

  const handleStartEditSession = (session: AssistanceSession, index: number) => {
    setEditingSessionId(session.id);
    setSessionLabelInput(session.label || `Sesi ${index + 1}`);
  };

  const handleSaveSessionLabel = () => {
    if (editingSessionId) {
      onUpdateSession(editingSessionId, sessionLabelInput.trim() || null);
      setEditingSessionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">
            Mahasiswa Aktif
          </p>
          {isEditingStudent ? (
            <div className="space-y-2 max-w-sm">
              <input
                type="text"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Nama Lengkap"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNim}
                  onChange={(e) => setEditNim(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="NIM"
                />
                <button
                  onClick={handleSaveStudent}
                  className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  title="Simpan"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                  title="Batal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="group flex items-start gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  {student.nama}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 font-mono">{student.nim}</p>
                  <button
                    onClick={() => setIsEditingStudent(true)}
                    className="p-1 rounded-md text-slate-300 hover:text-sky-500 hover:bg-sky-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Edit Nama/NIM"
                  >
                    <UserCog2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="hidden sm:block">
          <ScoreSummary
            sessions={sessions}
            activeSessionId={activeSessionId}
            moduleScores={moduleScores}
            assistanceScores={assistanceScores}
            activeTab={activeTab}
          />
        </div>
      </div>

      <div className="block sm:hidden">
        <ScoreSummary
          sessions={sessions}
          activeSessionId={activeSessionId}
          moduleScores={moduleScores}
          assistanceScores={assistanceScores}
          activeTab={activeTab}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Sesi Penilaian</h3>
            <p className="text-xs text-slate-400">
              Setiap sesi menyimpan nilai modul dan asistensi sekaligus.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newSessionDate}
              onChange={(event) => setNewSessionDate(event.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              onClick={handleCreateSession}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
            >
              <CalendarPlus2 className="w-4 h-4" />
              Tambah Sesi
            </button>
          </div>
        </div>

        {sortedSessions.length === 0 ? (
          <p className="text-sm text-slate-400">
            Belum ada sesi penilaian untuk mahasiswa ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedSessions.map((session, index) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingSessionId;
              const moduleDone = modulCriteria.filter(
                (criterion) =>
                  moduleScores[session.id]?.[criterion.id]?.finalScore != null
              ).length;
              const assistanceDone = asisCriteria.filter(
                (criterion) =>
                  assistanceScores[session.id]?.[criterion.id]?.finalScore != null
              ).length;

              return (
                <div
                  key={session.id}
                  className={`group relative flex flex-col rounded-xl border p-4 transition-all duration-200 ${
                    isActive
                      ? 'border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={sessionLabelInput}
                          onChange={(e) => setSessionLabelInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveSessionLabel()}
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveSessionLabel}
                          className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 group/label">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {session.label || `Sesi ${index + 1}`}
                          </h4>
                          <button
                            onClick={() => handleStartEditSession(session, index)}
                            className="p-1 rounded-md text-slate-300 hover:text-sky-500 hover:bg-sky-100 transition-all opacity-0 group-hover/label:opacity-100"
                            title="Ubah Nama Sesi"
                          >
                            <PencilLine className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {session.tglAsistensi}
                        </p>
                      </div>
                    )}
                    
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Hapus Sesi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 transition-all duration-500" 
                        style={{ width: `${((moduleDone + assistanceDone) / (modulCriteria.length + asisCriteria.length)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {Math.round(((moduleDone + assistanceDone) / (modulCriteria.length + asisCriteria.length)) * 100)}%
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`mt-auto w-full py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-100'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isActive ? 'Sedang Dinilai' : 'Pilih Sesi'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <TabButton
          active={activeTab === 'modul'}
          onClick={() => setActiveTab('modul')}
          label="Penilaian Modul"
          badge={
            activeSessionId
              ? `${modulFilled}/${modulCriteria.length}`
              : `${sessions.length} sesi`
          }
          color="sky"
        />
        <TabButton
          active={activeTab === 'asistensi'}
          onClick={() => setActiveTab('asistensi')}
          label="Penilaian Asistensi"
          badge={
            activeSessionId
              ? `${assistanceFilled}/${asisCriteria.length}`
              : `${sessions.length} sesi`
          }
          color="violet"
        />
      </div>

      {!activeSessionId ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 px-8 text-center text-sm text-slate-400">
          Pilih atau buat sesi penilaian untuk mulai mengisi nilai modul dan asistensi.
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'modul' &&
            modulGroups.map((group) => (
              <CriteriaGroup
                key={group.id}
                group={group}
                scores={activeModuleScores}
                onChange={onModuleScoreChange}
              />
            ))}

          {activeTab === 'asistensi' &&
            asisGroups.map((group) => (
              <CriteriaGroup
                key={group.id}
                group={group}
                scores={activeAssistanceScores}
                onChange={onAssistanceScoreChange}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  badge,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge: string;
  color: 'sky' | 'violet';
}) {
  const colorMap = {
    sky: 'text-sky-700',
    violet: 'text-violet-700',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
        active
          ? 'bg-white shadow-sm text-slate-800'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
          active
            ? `${colorMap[color]} bg-slate-100`
            : 'bg-slate-200 text-slate-400'
        }`}
      >
        {badge}
      </span>
    </button>
  );
}
