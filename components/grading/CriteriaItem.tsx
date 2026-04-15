'use client';

import { useState, useEffect } from 'react';
import {
  QUICK_SELECT_OPTIONS,
  QUICK_SELECT_LABELS,
  QUICK_SELECT_COLORS,
  QUICK_SELECT_IDLE_COLORS,
  computeScore,
  type QuickSelectOption,
} from '@/lib/gradingConfig';
import type { CriterionScore } from '@/lib/gradingTypes';

interface CriteriaItemProps {
  criterionId: string;
  name: string;
  maxScore: number;
  score: CriterionScore | undefined;
  onChange: (criterionId: string, score: CriterionScore) => void;
}

export default function CriteriaItem({
  criterionId,
  name,
  maxScore,
  score,
  onChange,
}: CriteriaItemProps) {
  const [manualInput, setManualInput] = useState<string>(
    score?.finalScore != null ? String(score.finalScore) : ''
  );

  useEffect(() => {
    if (score?.finalScore != null) {
      setManualInput(String(score.finalScore));
    } else if (!score) {
      setManualInput('');
    }
  }, [score]);

  const handleQuickSelect = (option: QuickSelectOption) => {
    const computed = computeScore(option, maxScore);
    setManualInput(String(computed));
    onChange(criterionId, {
      criterionId,
      quickSelect: option,
      manualValue: computed,
      finalScore: computed,
    });
  };

  const handleManualChange = (val: string) => {
    setManualInput(val);
    const numeric = parseFloat(val);
    if (val === '' || isNaN(numeric)) {
      onChange(criterionId, {
        criterionId,
        quickSelect: null,
        manualValue: null,
        finalScore: null,
      });
      return;
    }
    const clamped = Math.min(Math.max(0, numeric), maxScore);
    onChange(criterionId, {
      criterionId,
      quickSelect: null,
      manualValue: clamped,
      finalScore: clamped,
    });
  };

  const handleManualBlur = () => {
    const numeric = parseFloat(manualInput);
    if (!isNaN(numeric)) {
      const clamped = Math.min(Math.max(0, numeric), maxScore);
      setManualInput(String(clamped));
    }
  };

  const finalScore = score?.finalScore;
  const hasValue = finalScore != null;

  return (
    <div className="flex flex-col gap-3 py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-700 leading-snug flex-1">
          {name}
        </p>
        <span className="shrink-0 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
          Max: {maxScore}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {QUICK_SELECT_OPTIONS.map((option) => {
          const isSelected = score?.quickSelect === option && score?.manualValue === computeScore(option, maxScore);
          return (
            <button
              key={option}
              onClick={() => handleQuickSelect(option)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-all duration-150 ${
                isSelected
                  ? QUICK_SELECT_COLORS[option]
                  : `bg-white ${QUICK_SELECT_IDLE_COLORS[option]}`
              }`}
            >
              {QUICK_SELECT_LABELS[option]}
              <span className="ml-1 opacity-70">
                ({computeScore(option, maxScore)})
              </span>
            </button>
          );
        })}

        <div className="flex items-center gap-1.5 ml-auto">
          <input
            type="number"
            min={0}
            max={maxScore}
            step={0.01}
            value={manualInput}
            onChange={(e) => handleManualChange(e.target.value)}
            onBlur={handleManualBlur}
            placeholder="—"
            className={`w-20 text-center text-sm font-semibold rounded-lg border-2 px-2 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 ${
              hasValue
                ? finalScore! >= maxScore * 0.8
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : finalScore! >= maxScore * 0.6
                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                  : finalScore! >= maxScore * 0.4
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-rose-300 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-400'
            }`}
          />
          <span className="text-xs text-slate-400">/ {maxScore}</span>
        </div>
      </div>
    </div>
  );
}
