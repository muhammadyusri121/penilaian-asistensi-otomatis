'use client';

import { useMemo, useState } from 'react';
import { CalendarPlus2, Trash2 } from 'lucide-react';
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
  onModuleScoreChange,
  onAssistanceScoreChange,
}: GradingFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('modul');
  const [newSessionDate, setNewSessionDate] = useState('');

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">
            Mahasiswa Aktif
          </p>
          <h2 className="text-xl font-extrabold text-slate-800">
            {student.nama}
          </h2>
          <p className="text-sm text-slate-500 font-mono">{student.nim}</p>
        </div>
        <div className="hidden sm:block">
          <ScoreSummary
            sessions={sessions}
            moduleScores={moduleScores}
            assistanceScores={assistanceScores}
            activeTab={activeTab}
          />
        </div>
      </div>

      <div className="block sm:hidden">
        <ScoreSummary
          sessions={sessions}
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
          <div className="space-y-2">
            {sortedSessions.map((session, index) => {
              const isActive = session.id === activeSessionId;
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
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    isActive
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      Sesi {index + 1}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {session.tglAsistensi} &middot; Modul {moduleDone}/{modulCriteria.length} &middot; Asistensi {assistanceDone}/{asisCriteria.length}
                    </p>
                  </button>
                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
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
