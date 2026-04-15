import * as XLSX from 'xlsx';
import { gradingConfig, getMaxTotalForType } from './gradingConfig';
import type {
  AssistanceScores,
  AssistanceSession,
  ModuleScores,
  Student,
} from './gradingTypes';

type FormulaCell = {
  row: number;
  col: number;
  formula: string;
};

type MergeRange = {
  s: { r: number; c: number };
  e: { r: number; c: number };
};

export function exportStudentToExcel(
  student: Student,
  sessions: AssistanceSession[],
  moduleScores: ModuleScores,
  assistanceScores: AssistanceScores
) {
  const workbook = XLSX.utils.book_new();
  const modulGroups = gradingConfig.filter((group) => group.type === 'modul');
  const assistanceGroups = gradingConfig.filter((group) => group.type === 'asistensi');

  const sortedSessions = [...sessions].sort((a, b) =>
    a.tglAsistensi.localeCompare(b.tglAsistensi)
  );

  // Build Modul sheet with horizontal categories + total column per category
  const moduleRows: (string | number | null)[][] = [
    ['Nama Mahasiswa', student.nama],
    ['NIM', student.nim],
    [],
  ];

  // Build grouped header rows so each category block is clearly separated horizontally.
  const moduleGroupHeaderRow: (string | null)[] = ['No.', 'Tgl Asistensi'];
  const moduleHeaderRow: (string | null)[] = ['No.', 'Tgl Asistensi'];
  const moduleCategoryRanges: Array<{
    criteriaStartCol: number;
    criteriaEndCol: number;
    totalCol: number;
  }> = [];
  const moduleMerges: MergeRange[] = [];

  let moduleColCursor = 2;
  modulGroups.forEach((group) => {
    const criteriaStartCol = moduleColCursor;
    moduleGroupHeaderRow.push(group.title);
    group.criteria.forEach((criterion) => {
      moduleHeaderRow.push(criterion.name);
      if (moduleColCursor !== criteriaStartCol) {
        moduleGroupHeaderRow.push(null);
      }
      moduleColCursor += 1;
    });
    moduleHeaderRow.push('Jumlah');
    moduleGroupHeaderRow.push(null);
    const criteriaEndCol = moduleColCursor - 1;
    moduleCategoryRanges.push({
      criteriaStartCol,
      criteriaEndCol,
      totalCol: moduleColCursor,
    });
    moduleMerges.push({
      s: { r: 3, c: criteriaStartCol },
      e: { r: 3, c: moduleColCursor },
    });
    moduleColCursor += 1;
  });
  moduleGroupHeaderRow.push('Nilai Total Modul');
  moduleHeaderRow.push('Nilai Total Modul');
  const moduleGrandTotalCol = moduleColCursor;
  moduleMerges.push({ s: { r: 3, c: 0 }, e: { r: 4, c: 0 } });
  moduleMerges.push({ s: { r: 3, c: 1 }, e: { r: 4, c: 1 } });
  moduleMerges.push({
    s: { r: 3, c: moduleGrandTotalCol },
    e: { r: 4, c: moduleGrandTotalCol },
  });
  moduleRows.push(moduleGroupHeaderRow);
  moduleRows.push(moduleHeaderRow);

  // Build data rows
  const moduleTotals: number[] = [];
  const moduleFormulaCells: FormulaCell[] = [];
  sortedSessions.forEach((session, index) => {
    const dataRow: (string | number | null)[] = [index + 1, session.tglAsistensi];
    const sessionScores = moduleScores[session.id] || {};
    let sessionTotal = 0;

    modulGroups.forEach((group) => {
      let categoryTotal = 0;
      group.criteria.forEach((criterion) => {
        const score = sessionScores[criterion.id]?.finalScore ?? null;
        dataRow.push(score);
        if (score !== null) categoryTotal += score;
      });
      // Filled later as Excel SUM formula.
      dataRow.push(null);
      sessionTotal += categoryTotal;
    });

    // Filled later as Excel SUM formula over category totals.
    dataRow.push(null);
    moduleRows.push(dataRow);
    moduleTotals.push(sessionTotal);

    const excelRow = moduleRows.length;
    moduleCategoryRanges.forEach((range) => {
      const startRef = getCellRef(excelRow, range.criteriaStartCol);
      const endRef = getCellRef(excelRow, range.criteriaEndCol);
      moduleFormulaCells.push({
        row: excelRow,
        col: range.totalCol,
        formula: `SUM(${startRef}:${endRef})`,
      });
    });

    const totalRefs = moduleCategoryRanges
      .map((range) => getCellRef(excelRow, range.totalCol))
      .join(',');
    moduleFormulaCells.push({
      row: excelRow,
      col: moduleGrandTotalCol,
      formula: `SUM(${totalRefs})`,
    });
  });

  // Add summary rows
  moduleRows.push([]);
  const moduleAverage =
    moduleTotals.length > 0
      ? moduleTotals.reduce((sum, total) => sum + total, 0) / moduleTotals.length
      : 0;
  const moduleWeighted =
    getMaxTotalForType('modul') > 0
      ? (moduleAverage / getMaxTotalForType('modul')) * 40
      : 0;

  const summaryRow: (string | number | null)[] = ['Rata-rata'];
  modulGroups.forEach((group) => {
    const categoryScores = sortedSessions.map((session) => {
      const sessionScores = moduleScores[session.id] || {};
      return group.criteria.reduce(
        (sum, c) => sum + (sessionScores[c.id]?.finalScore ?? 0),
        0
      );
    });
    const categoryAvg =
      categoryScores.length > 0
        ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
        : 0;

    for (let i = 0; i < group.criteria.length; i++) {
      summaryRow.push(null);
    }
    summaryRow.push(Number(categoryAvg.toFixed(2)));
  });
  summaryRow.push(Number(moduleAverage.toFixed(2)));
  moduleRows.push(summaryRow);

  moduleRows.push(['Kontribusi Modul 40%', null, null, Number(moduleWeighted.toFixed(2))]);

  // Generate Asistensi sheet with categories separated
  const assistanceRows: (string | number | null)[][] = [
    ['Nama Mahasiswa', student.nama],
    ['NIM', student.nim],
    [],
  ];

  // Build grouped header rows so each category block is clearly separated horizontally.
  const assistanceGroupHeaderRow: (string | null)[] = ['No.', 'Tgl Asistensi'];
  const assistanceHeaderRow: (string | null)[] = ['No.', 'Tgl Asistensi'];
  const assistanceCategoryRanges: Array<{
    criteriaStartCol: number;
    criteriaEndCol: number;
    totalCol: number;
  }> = [];
  const assistanceMerges: MergeRange[] = [];

  let assistanceColCursor = 2;
  assistanceGroups.forEach((group) => {
    const criteriaStartCol = assistanceColCursor;
    assistanceGroupHeaderRow.push(group.title);
    group.criteria.forEach((criterion) => {
      assistanceHeaderRow.push(criterion.name);
      if (assistanceColCursor !== criteriaStartCol) {
        assistanceGroupHeaderRow.push(null);
      }
      assistanceColCursor += 1;
    });
    assistanceHeaderRow.push('Jumlah');
    assistanceGroupHeaderRow.push(null);
    const criteriaEndCol = assistanceColCursor - 1;
    assistanceCategoryRanges.push({
      criteriaStartCol,
      criteriaEndCol,
      totalCol: assistanceColCursor,
    });
    assistanceMerges.push({
      s: { r: 3, c: criteriaStartCol },
      e: { r: 3, c: assistanceColCursor },
    });
    assistanceColCursor += 1;
  });
  assistanceGroupHeaderRow.push('Nilai Total Asistensi');
  assistanceHeaderRow.push('Nilai Total Asistensi');
  const assistanceGrandTotalCol = assistanceColCursor;
  assistanceMerges.push({ s: { r: 3, c: 0 }, e: { r: 4, c: 0 } });
  assistanceMerges.push({ s: { r: 3, c: 1 }, e: { r: 4, c: 1 } });
  assistanceMerges.push({
    s: { r: 3, c: assistanceGrandTotalCol },
    e: { r: 4, c: assistanceGrandTotalCol },
  });
  assistanceRows.push(assistanceGroupHeaderRow);
  assistanceRows.push(assistanceHeaderRow);

  // Build data rows
  const assistanceTotals: number[] = [];
  const assistanceFormulaCells: FormulaCell[] = [];
  sortedSessions.forEach((session, index) => {
    const dataRow: (string | number | null)[] = [index + 1, session.tglAsistensi];
    const sessionScores = assistanceScores[session.id] || {};
    let sessionTotal = 0;

    assistanceGroups.forEach((group) => {
      let categoryTotal = 0;
      group.criteria.forEach((criterion) => {
        const score = sessionScores[criterion.id]?.finalScore ?? null;
        dataRow.push(score);
        if (score !== null) categoryTotal += score;
      });
      // Filled later as Excel SUM formula.
      dataRow.push(null);
      sessionTotal += categoryTotal;
    });

    // Filled later as Excel SUM formula over category totals.
    dataRow.push(null);
    assistanceRows.push(dataRow);
    assistanceTotals.push(sessionTotal);

    const excelRow = assistanceRows.length;
    assistanceCategoryRanges.forEach((range) => {
      const startRef = getCellRef(excelRow, range.criteriaStartCol);
      const endRef = getCellRef(excelRow, range.criteriaEndCol);
      assistanceFormulaCells.push({
        row: excelRow,
        col: range.totalCol,
        formula: `SUM(${startRef}:${endRef})`,
      });
    });

    const totalRefs = assistanceCategoryRanges
      .map((range) => getCellRef(excelRow, range.totalCol))
      .join(',');
    assistanceFormulaCells.push({
      row: excelRow,
      col: assistanceGrandTotalCol,
      formula: `SUM(${totalRefs})`,
    });
  });

  // Add summary rows
  assistanceRows.push([]);
  const assistanceAverage =
    assistanceTotals.length > 0
      ? assistanceTotals.reduce((sum, total) => sum + total, 0) / assistanceTotals.length
      : 0;
  const assistanceWeighted =
    getMaxTotalForType('asistensi') > 0
      ? (assistanceAverage / getMaxTotalForType('asistensi')) * 60
      : 0;

  const assistanceSummaryRow: (string | number | null)[] = ['Rata-rata'];
  assistanceGroups.forEach((group) => {
    const categoryScores = sortedSessions.map((session) => {
      const sessionScores = assistanceScores[session.id] || {};
      return group.criteria.reduce(
        (sum, c) => sum + (sessionScores[c.id]?.finalScore ?? 0),
        0
      );
    });
    const categoryAvg =
      categoryScores.length > 0
        ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
        : 0;

    for (let i = 0; i < group.criteria.length; i++) {
      assistanceSummaryRow.push(null);
    }
    assistanceSummaryRow.push(Number(categoryAvg.toFixed(2)));
  });
  assistanceSummaryRow.push(Number(assistanceAverage.toFixed(2)));
  assistanceRows.push(assistanceSummaryRow);

  assistanceRows.push(['Kontribusi Asistensi 60%', null, null, Number(assistanceWeighted.toFixed(2))]);
  assistanceRows.push(['Nilai Akhir', null, null, Number((moduleWeighted + assistanceWeighted).toFixed(2))]);

  const moduleSheet = XLSX.utils.aoa_to_sheet(moduleRows);
  applyFormulaCells(moduleSheet, moduleFormulaCells);
  moduleSheet['!merges'] = moduleMerges;

  const assistanceSheet = XLSX.utils.aoa_to_sheet(assistanceRows);
  applyFormulaCells(assistanceSheet, assistanceFormulaCells);
  assistanceSheet['!merges'] = assistanceMerges;

  XLSX.utils.book_append_sheet(workbook, moduleSheet, 'Modul');
  XLSX.utils.book_append_sheet(workbook, assistanceSheet, 'Asistensi');

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

function getCellRef(row: number, col: number) {
  return XLSX.utils.encode_cell({ r: row - 1, c: col });
}

function applyFormulaCells(sheet: XLSX.WorkSheet, formulaCells: FormulaCell[]) {
  formulaCells.forEach((cell) => {
    const address = XLSX.utils.encode_cell({ r: cell.row - 1, c: cell.col });
    sheet[address] = {
      t: 'n',
      f: cell.formula,
    };
  });
}
