'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CriteriaItem from './CriteriaItem';
import type { CriteriaGroup as CriteriaGroupType } from '@/lib/gradingConfig';
import type { CriterionScore, StudentScores } from '@/lib/gradingTypes';

interface CriteriaGroupProps {
  group: CriteriaGroupType;
  scores: StudentScores;
  onChange: (criterionId: string, score: CriterionScore) => void;
}

export default function CriteriaGroup({
  group,
  scores,
  onChange,
}: CriteriaGroupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const maxTotal = group.criteria.reduce((s, c) => s + c.maxScore, 0);
  const earned = group.criteria.reduce(
    (s, c) => s + (scores[c.id]?.finalScore ?? 0),
    0
  );
  const filledCount = group.criteria.filter(
    (c) => scores[c.id]?.finalScore != null
  ).length;
  const pct = maxTotal > 0 ? Math.round((earned / maxTotal) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              group.type === 'modul' ? 'bg-sky-500' : 'bg-violet-500'
            }`}
          />
          <h3 className="text-sm font-bold text-slate-800">{group.title}</h3>
          <span className="text-xs text-slate-400">
            {filledCount}/{group.criteria.length} diisi
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                pct >= 80
                  ? 'bg-emerald-400'
                  : pct >= 60
                  ? 'bg-sky-400'
                  : pct >= 40
                  ? 'bg-amber-400'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-700 tabular-nums w-20 text-right">
            {earned.toFixed(2)} / {maxTotal}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-0' : '-rotate-90'
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-5">
          {group.criteria.map((criterion) => (
            <CriteriaItem
              key={criterion.id}
              criterionId={criterion.id}
              name={criterion.name}
              maxScore={criterion.maxScore}
              score={scores[criterion.id]}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
