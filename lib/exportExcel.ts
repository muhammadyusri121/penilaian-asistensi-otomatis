import * as XLSX from 'xlsx';
import { gradingConfig, getMaxTotalForType } from './gradingConfig';
import type {
  AssistanceScores,
  AssistanceSession,
  ModuleScores,
  Student,
} from './gradingTypes';

export function exportStudentToExcel(
  student: Student,
  sessions: AssistanceSession[],
  moduleScores: ModuleScores,
  assistanceScores: AssistanceScores
) {
  const workbook = XLSX.utils.book_new();
  const modulCriteria = gradingConfig
    .filter((group) => group.type === 'modul')
    .flatMap((group) => group.criteria);
  const assistanceCriteria = gradingConfig
    .filter((group) => group.type === 'asistensi')
    .flatMap((group) => group.criteria);

  const sortedSessions = [...sessions].sort((a, b) =>
    a.tglAsistensi.localeCompare(b.tglAsistensi)
  );

  const moduleRows: (string | number | null)[][] = [
    ['Nama Mahasiswa', student.nama],
    ['NIM', student.nim],
    [],
    ['No.', 'Tgl Asistensi', ...modulCriteria.map((c) => c.name), 'Nilai'],
  ];

  const assistanceRows: (string | number | null)[][] = [
    ['Nama Mahasiswa', student.nama],
    ['NIM', student.nim],
    [],
    ['No.', 'Tgl Asistensi', ...assistanceCriteria.map((c) => c.name), 'Nilai'],
  ];

  const moduleTotals = sortedSessions.map((session, index) => {
    const sessionScores = moduleScores[session.id] || {};
    const total = modulCriteria.reduce(
      (sum, criterion) => sum + (sessionScores[criterion.id]?.finalScore ?? 0),
      0
    );

    moduleRows.push([
      index + 1,
      session.tglAsistensi,
      ...modulCriteria.map(
        (criterion) => sessionScores[criterion.id]?.finalScore ?? null
      ),
      total,
    ]);

    return total;
  });

  const assistanceTotals = sortedSessions.map((session, index) => {
    const sessionScores = assistanceScores[session.id] || {};
    const total = assistanceCriteria.reduce(
      (sum, criterion) => sum + (sessionScores[criterion.id]?.finalScore ?? 0),
      0
    );

    assistanceRows.push([
      index + 1,
      session.tglAsistensi,
      ...assistanceCriteria.map(
        (criterion) => sessionScores[criterion.id]?.finalScore ?? null
      ),
      total,
    ]);

    return total;
  });

  const moduleAverage =
    moduleTotals.length > 0
      ? moduleTotals.reduce((sum, total) => sum + total, 0) / moduleTotals.length
      : 0;
  const assistanceAverage =
    assistanceTotals.length > 0
      ? assistanceTotals.reduce((sum, total) => sum + total, 0) /
        assistanceTotals.length
      : 0;
  const moduleWeighted =
    getMaxTotalForType('modul') > 0
      ? (moduleAverage / getMaxTotalForType('modul')) * 40
      : 0;
  const assistanceWeighted =
    getMaxTotalForType('asistensi') > 0
      ? (assistanceAverage / getMaxTotalForType('asistensi')) * 60
      : 0;

  moduleRows.push([]);
  moduleRows.push(['Rata-rata Modul', null, ...Array(modulCriteria.length).fill(null), Number(moduleAverage.toFixed(2))]);
  moduleRows.push(['Kontribusi Modul 40%', null, ...Array(modulCriteria.length).fill(null), Number(moduleWeighted.toFixed(2))]);

  assistanceRows.push([]);
  assistanceRows.push(['Rata-rata Asistensi', null, ...Array(assistanceCriteria.length).fill(null), Number(assistanceAverage.toFixed(2))]);
  assistanceRows.push(['Kontribusi Asistensi 60%', null, ...Array(assistanceCriteria.length).fill(null), Number(assistanceWeighted.toFixed(2))]);
  assistanceRows.push(['Nilai Akhir', null, ...Array(assistanceCriteria.length).fill(null), Number((moduleWeighted + assistanceWeighted).toFixed(2))]);

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(moduleRows), 'Modul');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(assistanceRows), 'Asistensi');

  XLSX.writeFile(workbook, buildFileName(student.nama));
}

function buildFileName(name: string) {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  return `nilai asistensi ${safeName || 'mahasiswa'}.xlsx`;
}
