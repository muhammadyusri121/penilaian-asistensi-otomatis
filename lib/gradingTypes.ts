import type { QuickSelectOption } from './gradingConfig';

export interface Student {
  id: string;
  nim: string;
  nama: string;
}

export interface AssistanceSession {
  id: string;
  studentId: string;
  tglAsistensi: string;
  label?: string | null;
}

export interface CriterionScore {
  criterionId: string;
  quickSelect: QuickSelectOption | null;
  manualValue: number | null;
  finalScore: number | null;
}

export type StudentScores = Record<string, CriterionScore>;

export type ModuleScores = Record<string, StudentScores>;

export type AssistanceScores = Record<string, StudentScores>;
