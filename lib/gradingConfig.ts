export type QuickSelectOption = 'sangat_baik' | 'baik' | 'cukup' | 'kurang';

export interface Criterion {
  id: string;
  name: string;
  maxScore: number;
}

export interface CriteriaGroup {
  id: string;
  type: 'modul' | 'asistensi';
  title: string;
  criteria: Criterion[];
}

export const QUICK_SELECT_OPTIONS: QuickSelectOption[] = [
  'sangat_baik',
  'baik',
  'cukup',
  'kurang',
];

export const QUICK_SELECT_MULTIPLIERS: Record<QuickSelectOption, number> = {
  sangat_baik: 1.0,
  baik: 0.8,
  cukup: 0.6,
  kurang: 0.4,
};

export const QUICK_SELECT_LABELS: Record<QuickSelectOption, string> = {
  sangat_baik: 'Sangat Baik',
  baik: 'Baik',
  cukup: 'Cukup',
  kurang: 'Kurang',
};

export const QUICK_SELECT_COLORS: Record<QuickSelectOption, string> = {
  sangat_baik: 'bg-emerald-500 text-white border-emerald-500',
  baik: 'bg-sky-500 text-white border-sky-500',
  cukup: 'bg-amber-500 text-white border-amber-500',
  kurang: 'bg-rose-500 text-white border-rose-500',
};

export const QUICK_SELECT_IDLE_COLORS: Record<QuickSelectOption, string> = {
  sangat_baik:
    'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
  baik: 'border-sky-300 text-sky-700 hover:bg-sky-50',
  cukup: 'border-amber-300 text-amber-700 hover:bg-amber-50',
  kurang: 'border-rose-300 text-rose-700 hover:bg-rose-50',
};

export const gradingConfig: CriteriaGroup[] = [
  {
    id: 'bab1',
    type: 'modul',
    title: 'BAB I',
    criteria: [
      {
        id: 'bab1_latar_belakang',
        name: 'Kesesuaian isi latar belakang dengan materi',
        maxScore: 3,
      },
      {
        id: 'bab1_font',
        name: 'Kesesuaian jenis huruf (font), ukuran huruf, jarak antarbaris (line spacing), serta kerapian paragraf (justify)',
        maxScore: 2,
      },
      {
        id: 'bab1_heading',
        name: 'Kesesuaian penggunaan struktur heading',
        maxScore: 1,
      },
      {
        id: 'bab1_penomoran',
        name: 'Kesesuaian penggunaan symbol dan penomoran',
        maxScore: 1,
      },
      {
        id: 'bab1_italic',
        name: 'Kesesuaian penulisan istilah asing dengan huruf miring (italic)',
        maxScore: 1,
      },
      {
        id: 'bab1_kecukupan',
        name: 'Kecukupan isi tulisan (minimal 1 halaman full)',
        maxScore: 2,
      },
    ],
  },
  {
    id: 'bab2',
    type: 'modul',
    title: 'BAB II',
    criteria: [
      {
        id: 'bab2_dasar_teori',
        name: 'Kesesuaian isi dasar teori dengan isi modul pembelajaran',
        maxScore: 5,
      },
      {
        id: 'bab2_font',
        name: 'Kesesuaian jenis huruf (font), ukuran huruf, jarak antarbaris (line spacing), serta kerapian paragraf (justify)',
        maxScore: 1,
      },
      {
        id: 'bab2_heading',
        name: 'Kesesuaian penggunaan struktur heading',
        maxScore: 2,
      },
      {
        id: 'bab2_tabel_gambar',
        name: 'Kesesuaian penggunaan format tabel dan gambar',
        maxScore: 5,
      },
      {
        id: 'bab2_italic',
        name: 'Kesesuaian penulisan istilah asing dengan huruf miring (italic)',
        maxScore: 2,
      },
      {
        id: 'bab2_source_code',
        name: 'Kesesuaian penggunaan format source code',
        maxScore: 5,
      },
    ],
  },
  {
    id: 'bab3',
    type: 'modul',
    title: 'BAB III',
    criteria: [
      {
        id: 'bab3_jawaban_pertanyaan',
        name: 'Kesesuaian jawaban dengan pertanyaan',
        maxScore: 10,
      },
      {
        id: 'bab3_media_alat',
        name: 'Kesesuaian Media dan Alat Penulisan',
        maxScore: 5,
      },
      {
        id: 'bab3_format_tata_letak',
        name: 'Kesesuaian Format dan Tata Letak Penulisan',
        maxScore: 5,
      },
      {
        id: 'bab3_sistematika',
        name: 'Kesesuaian Sistematika dan Penomoran',
        maxScore: 5,
      },
      {
        id: 'bab3_kerapian',
        name: 'Kerapian Tulisan dan Kebersihan Kertas',
        maxScore: 5,
      },
    ],
  },
  {
    id: 'bab4',
    type: 'modul',
    title: 'BAB IV',
    criteria: [
      {
        id: 'bab4_source_alur',
        name: 'Kesesuaian Soal, Jawaban Source Code serta Kejelasan alur penjelasan paragraf yang mudah dipahami dan orisinal',
        maxScore: 10,
      },
      {
        id: 'bab4_font',
        name: 'Kesesuaian jenis huruf (font), ukuran huruf, jarak antarbaris (line spacing), serta kerapian paragraf (justify)',
        maxScore: 2,
      },
      {
        id: 'bab4_heading',
        name: 'Kesesuaian penggunaan struktur heading',
        maxScore: 3,
      },
      {
        id: 'bab4_tabel_gambar',
        name: 'Kesesuaian penggunaan format tabel dan gambar',
        maxScore: 6,
      },
      {
        id: 'bab4_italic',
        name: 'Kesesuaian penulisan istilah asing dengan huruf miring (italic)',
        maxScore: 3,
      },
      {
        id: 'bab4_source_code',
        name: 'Kesesuaian penggunaan format source code',
        maxScore: 6,
      },
    ],
  },
  {
    id: 'bab5',
    type: 'modul',
    title: 'BAB V',
    criteria: [
      {
        id: 'bab5_pembahasan',
        name: 'Kesesuaian isi dengan pembahasan materi praktikum',
        maxScore: 3,
      },
      {
        id: 'bab5_font',
        name: 'Kesesuaian jenis huruf (font), ukuran huruf, jarak antarbaris (line spacing), serta kerapian paragraf (justify)',
        maxScore: 2,
      },
      {
        id: 'bab5_heading',
        name: 'Kesesuaian penggunaan struktur heading',
        maxScore: 1,
      },
      {
        id: 'bab5_penomoran',
        name: 'Kesesuaian penggunaan symbol dan penomoran',
        maxScore: 1,
      },
      {
        id: 'bab5_italic',
        name: 'Kesesuaian penulisan istilah asing dengan huruf miring (italic)',
        maxScore: 1,
      },
      {
        id: 'bab5_kecukupan',
        name: 'Kecukupan isi tulisan (minimal 1 halaman full)',
        maxScore: 2,
      },
    ],
  },
  {
    id: 'asis_plagiarisme',
    type: 'asistensi',
    title: 'Plagiarisme',
    criteria: [
      {
        id: 'asis_plagiarisme',
        name: 'Plagiarisme',
        maxScore: 10,
      },
    ],
  },
  {
    id: 'asis_tugas',
    type: 'asistensi',
    title: 'Kesesuaian Tugas Praktikan Dengan Soal Yang Diberikan',
    criteria: [
      {
        id: 'asis_tugas_modul',
        name: 'Kesesuaian Tugas dengan Materi yang terdapat pada Modul',
        maxScore: 10,
      },
      {
        id: 'asis_tugas_jawaban',
        name: 'Kesesuaian Jawaban/program yang telah dibuat dengan soal yang telah diberikan',
        maxScore: 15,
      },
    ],
  },
  {
    id: 'asis_penjelasan',
    type: 'asistensi',
    title: 'Penjelasan Program',
    criteria: [
      {
        id: 'asis_penjelasan_memaparkan',
        name: 'Pemahaman Praktikan dalam memaparkan program dan mendeskripsikan program melalui pertanyaan yang diberikan',
        maxScore: 25,
      },
      {
        id: 'asis_penjelasan_penguasaan',
        name: 'Pemahaman Program / Penguasaan Materi dalam menjelaskan',
        maxScore: 20,
      },
    ],
  },
  {
    id: 'asis_kehadiran',
    type: 'asistensi',
    title: 'Kehadiran',
    criteria: [
      {
        id: 'asis_kehadiran',
        name: 'Kehadiran praktikan dalam melaksanakan sesi asistensi atau presentasi tugas di hadapan asisten praktikum',
        maxScore: 5,
      },
      {
        id: 'asis_kedisiplinan',
        name: 'Kedisiplinan praktikan dalam mengambil jadwal asistensi (tidak menunda hingga batas waktu akhir/penutupan)',
        maxScore: 5,
      },
    ],
  },
  {
    id: 'asis_sikap',
    type: 'asistensi',
    title: 'Sikap',
    criteria: [
      {
        id: 'asis_sikap',
        name: 'Kehadiran praktikan dalam melaksanakan sesi asistensi atau presentasi tugas di hadapan asisten praktikum',
        maxScore: 10,
      },
    ],
  },
];

export function getMaxTotalForType(type: 'modul' | 'asistensi'): number {
  return gradingConfig
    .filter((g) => g.type === type)
    .flatMap((g) => g.criteria)
    .reduce((sum, c) => sum + c.maxScore, 0);
}

export function getMaxGrandTotal(): number {
  return gradingConfig
    .flatMap((g) => g.criteria)
    .reduce((sum, c) => sum + c.maxScore, 0);
}

export function computeScore(
  option: QuickSelectOption,
  maxScore: number
): number {
  return Math.round(QUICK_SELECT_MULTIPLIERS[option] * maxScore * 100) / 100;
}
