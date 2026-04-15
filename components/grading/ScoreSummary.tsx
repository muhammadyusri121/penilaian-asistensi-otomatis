'use client';

import { gradingConfig, getMaxTotalForType } from '@/lib/gradingConfig';
import type {
  AssistanceScores,
  AssistanceSession,
  ModuleScores,
} from '@/lib/gradingTypes';

interface ScoreSummaryProps {
  sessions: AssistanceSession[];
  moduleScores: ModuleScores;
  assistanceScores: AssistanceScores;
  activeTab: 'modul' | 'asistensi' | 'all';
}

export default function ScoreSummary({
  sessions,
  moduleScores,
  assistanceScores,
  activeTab,
}: ScoreSummaryProps) {
  const modulCriteria = gradingConfig
    .filter((g) => g.type === 'modul')
    .flatMap((g) => g.criteria);
  const asisCriteria = gradingConfig
    .filter((g) => g.type === 'asistensi')
    .flatMap((g) => g.criteria);

  const maxModul = getMaxTotalForType('modul');
  const maxAsistensi = getMaxTotalForType('asistensi');

  const moduleSessionTotals = sessions.map((session) =>
    modulCriteria.reduce(
      (sum, criterion) =>
        sum + (moduleScores[session.id]?.[criterion.id]?.finalScore ?? 0),
      0
    )
  );
  const assistanceSessionTotals = sessions.map((session) =>
    asisCriteria.reduce(
      (sum, criterion) =>
        sum + (assistanceScores[session.id]?.[criterion.id]?.finalScore ?? 0),
      0
    )
  );

  const moduleAverage =
    moduleSessionTotals.length > 0
      ? moduleSessionTotals.reduce((sum, total) => sum + total, 0) /
        moduleSessionTotals.length
      : 0;
  const assistanceAverage =
    assistanceSessionTotals.length > 0
      ? assistanceSessionTotals.reduce((sum, total) => sum + total, 0) /
        assistanceSessionTotals.length
      : 0;

  const moduleWeighted = maxModul > 0 ? (moduleAverage / maxModul) * 40 : 0;
  const assistanceWeighted =
    maxAsistensi > 0 ? (assistanceAverage / maxAsistensi) * 60 : 0;
  const finalWeighted = moduleWeighted + assistanceWeighted;

  const completedSessions = sessions.filter((session) => {
    const moduleComplete = modulCriteria.every(
      (criterion) => moduleScores[session.id]?.[criterion.id]?.finalScore != null
    );
    const assistanceComplete = asisCriteria.every(
      (criterion) =>
        assistanceScores[session.id]?.[criterion.id]?.finalScore != null
    );
    return moduleComplete && assistanceComplete;
  }).length;

  const grade = getGrade(finalWeighted);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      <h3 className="text-sm font-bold text-slate-800">Ringkasan Nilai</h3>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Modul 40%"
          value={moduleWeighted}
          max={40}
          subtitle={`${moduleAverage.toFixed(2)} / ${maxModul}`}
          color="sky"
          active={activeTab === 'modul' || activeTab === 'all'}
        />
        <SummaryCard
          label="Asistensi 60%"
          value={assistanceWeighted}
          max={60}
          subtitle={`${assistanceAverage.toFixed(2)} / ${maxAsistensi}`}
          color="violet"
          active={activeTab === 'asistensi' || activeTab === 'all'}
        />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs text-slate-500 font-medium">Nilai Akhir</p>
            <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
              {finalWeighted.toFixed(2)}
              <span className="text-sm font-semibold text-slate-400 ml-1">
                / 100
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-0.5">Nilai Huruf</p>
            <p className={`text-3xl font-black ${grade.color}`}>
              {grade.label}
            </p>
          </div>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              finalWeighted >= 80
                ? 'bg-emerald-400'
                : finalWeighted >= 60
                ? 'bg-sky-400'
                : finalWeighted >= 40
                ? 'bg-amber-400'
                : 'bg-rose-400'
            }`}
            style={{ width: `${Math.min(100, finalWeighted)}%` }}
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
        <p>{completedSessions} / {sessions.length} sesi penilaian lengkap</p>
      </div>
    </div>
  );
}

function getGrade(value: number) {
  if (value >= 85) return { label: 'A', color: 'text-emerald-600' };
  if (value >= 75) return { label: 'B', color: 'text-sky-600' };
  if (value >= 65) return { label: 'C', color: 'text-amber-600' };
  if (value >= 55) return { label: 'D', color: 'text-orange-600' };
  return { label: 'E', color: 'text-rose-600' };
}

function SummaryCard({
  label,
  value,
  max,
  subtitle,
  color,
  active,
}: {
  label: string;
  value: number;
  max: number;
  subtitle: string;
  color: 'sky' | 'violet';
  active: boolean;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const colorMap = {
    sky: {
      bar: 'bg-sky-400',
      text: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
    },
    violet: {
      bar: 'bg-violet-400',
      text: 'text-violet-700',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
    },
  };
  const c = colorMap[color];

  return (
    <div
      className={`rounded-xl border p-3 transition-opacity ${
        active ? 'opacity-100' : 'opacity-40'
      } ${c.bg} ${c.border}`}
    >
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-extrabold tabular-nums ${c.text}`}>
        {value.toFixed(2)}
        <span className="text-xs font-semibold text-slate-400 ml-1">
          / {max}
        </span>
      </p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      <div className="w-full h-1 bg-white/70 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${c.bar}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
