
/**
 * Data extracted from RPJMD Kabupaten Lampung Timur 2025-2029
 * Source: Lampiran Peraturan Daerah Nomor 2 Tahun 2025
 */

export interface RpjmdTarget {
  year: number;
  target: string | number;
  pagu: number; // In Thousands (Rp. 000)
}

export interface RpjmdProgram {
  id: string;
  program: string;
  indicator: string;
  baseline2024: string | number;
  targets: Record<number, RpjmdTarget>;
  opd: string;
  missionId: number;
  isQuickWin?: boolean;
}

export const missions = [
  { id: 1, title: "Meningkatkan Kualitas SDM & Pendidikan Vokasi" },
  { id: 2, title: "Pemerataan Layanan Kesehatan (Kartu Sehat)" },
  { id: 3, title: "Pembangunan Infrastruktur Merata & Berkualitas" },
  { id: 4, title: "Menjaga Nilai Religi & Budaya" },
  { id: 5, title: "Hilirisasi Pertanian & Pariwisata" },
  { id: 6, title: "Reformasi Birokrasi & Digitalisasi" },
  { id: 7, title: "Peningkatan Investasi & Lapangan Kerja" },
  { id: 8, title: "Pemberdayaan Perempuan & Perlindungan Anak" },
  { id: 9, title: "Ketahanan Sosial & Keamanan Lingkungan" }
];

export const quickWins = [
  { title: "Beasiswa Makmur", icon: "fa-graduation-cap", desc: "Pendidikan vokasi & akses sekolah gratis" },
  { title: "Kartu Sehat Makmur", icon: "fa-heart-pulse", desc: "Jaminan kesehatan universal (UHC)" },
  { title: "URC Preservasi Jalan", icon: "fa-road", desc: "Percepatan perbaikan jalan kabupaten" },
  { title: "City Beautification", icon: "fa-city", desc: "Penataan wajah ibukota & kecamatan" },
  { title: "Layanan Publik Digital", icon: "fa-mobile-screen", desc: "Mal Pelayanan Publik & Smart Village" },
  { title: "Lumbung Pangan Desa", icon: "fa-wheat", desc: "Hilirisasi produk unggulan desa" }
];

export const rpjmdPrograms: RpjmdProgram[] = [
  // MISI 1: PENDIDIKAN
  {
    id: "P-01",
    missionId: 1,
    opd: "Dinas Pendidikan dan Kebudayaan",
    program: "Program Pengelolaan Pendidikan",
    indicator: "Persentase anak 7-15 tahun berpartisipasi dalam pendidikan dasar (APS)",
    baseline2024: "99.09",
    isQuickWin: true,
    targets: {
      2026: { year: 2026, target: 99.3, pagu: 162977000000 },
      2027: { year: 2027, target: 99.5, pagu: 102529133000 },
      2028: { year: 2028, target: 99.6, pagu: 111756755000 },
      2029: { year: 2029, target: 99.8, pagu: 120697295000 },
      2030: { year: 2030, target: 100, pagu: 130353079000 }
    }
  },
  {
    id: "P-02",
    missionId: 1,
    opd: "Dinas Pendidikan dan Kebudayaan",
    program: "Program Pendidik dan Tenaga Kependidikan",
    indicator: "Persentase guru yang memiliki sertifikat pendidik",
    baseline2024: "90.6",
    targets: {
      2026: { year: 2026, target: 92, pagu: 45000000 },
      2027: { year: 2027, target: 94, pagu: 48000000 },
      2028: { year: 2028, target: 96, pagu: 51000000 },
      2029: { year: 2029, target: 97, pagu: 54000000 },
      2030: { year: 2030, target: 98, pagu: 58000000 }
    }
  },

  // MISI 2: KESEHATAN
  {
    id: "P-03",
    missionId: 2,
    opd: "Dinas Kesehatan",
    program: "Program Pemenuhan Upaya Kesehatan Perorangan (Kartu Sehat)",
    indicator: "Angka Kematian Ibu (per 100.000 KH)",
    baseline2024: "98.8",
    isQuickWin: true,
    targets: {
      2026: { year: 2026, target: 90, pagu: 55645226000 },
      2027: { year: 2027, target: 86, pagu: 67660256000 },
      2028: { year: 2028, target: 83, pagu: 79521914000 },
      2029: { year: 2029, target: 80, pagu: 92060522000 },
      2030: { year: 2030, target: 78, pagu: 103295029000 }
    }
  },
  {
    id: "P-04",
    missionId: 2,
    opd: "Dinas Kesehatan",
    program: "Program Pencegahan dan Penurunan Stunting",
    indicator: "Prevalensi Stunting pada Balita",
    baseline2024: "11.9",
    targets: {
      2026: { year: 2026, target: 10.8, pagu: 15000000 },
      2027: { year: 2027, target: 10.3, pagu: 16500000 },
      2028: { year: 2028, target: 9.5, pagu: 18000000 },
      2029: { year: 2029, target: 9.0, pagu: 19500000 },
      2030: { year: 2030, target: 8.6, pagu: 21000000 }
    }
  },

  // MISI 3: INFRASTRUKTUR
  {
    id: "P-05",
    missionId: 3,
    opd: "Dinas PUPR",
    program: "Program Penyelenggaraan Jalan (URC Preservasi)",
    indicator: "Tingkat Kemantapan Jalan Kabupaten",
    baseline2024: "54.7",
    isQuickWin: true,
    targets: {
      2026: { year: 2026, target: 61, pagu: 305689779000 },
      2027: { year: 2027, target: 65, pagu: 64866480000 },
      2028: { year: 2028, target: 70, pagu: 86874750000 },
      2029: { year: 2029, target: 73, pagu: 55599840000 },
      2030: { year: 2030, target: 75, pagu: 37066560000 }
    }
  },
  {
    id: "P-06",
    missionId: 3,
    opd: "Dinas Perkim",
    program: "Program Pengembangan Perumahan",
    indicator: "Persentase warga korban bencana memperoleh rumah layak huni",
    baseline2024: "83.33",
    targets: {
      2026: { year: 2026, target: 100, pagu: 545000000 },
      2027: { year: 2027, target: 100, pagu: 593000000 },
      2028: { year: 2028, target: 100, pagu: 652320000 },
      2029: { year: 2029, target: 100, pagu: 698826000 },
      2030: { year: 2030, target: 100, pagu: 756852000 }
    }
  },

  // MISI 5: HILIRISASI EKONOMI
  {
    id: "P-07",
    missionId: 5,
    opd: "Dinas Ketahanan Pangan TPHP",
    program: "Program Penyediaan dan Pengembangan Sarana Pertanian",
    indicator: "Peningkatan Produksi Tanaman Pangan",
    baseline2024: "-5.7",
    isQuickWin: true,
    targets: {
      2026: { year: 2026, target: 2, pagu: 10683331000 },
      2027: { year: 2027, target: 7, pagu: 10898578000 },
      2028: { year: 2028, target: 10, pagu: 11160103000 },
      2029: { year: 2029, target: 10, pagu: 11413491000 },
      2030: { year: 2030, target: 10, pagu: 11687151000 }
    }
  },
  {
    id: "P-08",
    missionId: 5,
    opd: "Dinas Pariwisata",
    program: "Program Peningkatan Daya Tarik Destinasi Pariwisata",
    indicator: "Persentase Pertumbuhan Kunjungan Wisatawan",
    baseline2024: "3.75",
    targets: {
      2026: { year: 2026, target: 5, pagu: 155000000 },
      2027: { year: 2027, target: 10, pagu: 235000000 },
      2028: { year: 2028, target: 15, pagu: 315000000 },
      2029: { year: 2029, target: 20, pagu: 395000000 },
      2030: { year: 2030, target: 25, pagu: 475000000 }
    }
  },

  // MISI 6: REFORMASI BIROKRASI
  {
    id: "P-09",
    missionId: 6,
    opd: "Dinas Kominfo",
    program: "Program Pengelolaan Aplikasi Informatika (SPBE)",
    indicator: "Indeks SPBE",
    baseline2024: "2.84",
    isQuickWin: true,
    targets: {
      2026: { year: 2026, target: 3.12, pagu: 2878700000 },
      2027: { year: 2027, target: 3.4, pagu: 3103000000 },
      2028: { year: 2028, target: 3.6, pagu: 3327000000 },
      2029: { year: 2029, target: 3.8, pagu: 3552000000 },
      2030: { year: 2030, target: 4.1, pagu: 3777000000 }
    }
  },
  {
    id: "P-10",
    missionId: 6,
    opd: "Dinas Dukcapil",
    program: "Program Pendaftaran Penduduk (Identitas Digital)",
    indicator: "Persentase kepemilikan identitas kependudukan digital",
    baseline2024: "89",
    targets: {
      2026: { year: 2026, target: 98, pagu: 966323000 },
      2027: { year: 2027, target: 99, pagu: 1031000000 },
      2028: { year: 2028, target: 99, pagu: 1095000000 },
      2029: { year: 2029, target: 99, pagu: 1160000000 },
      2030: { year: 2030, target: 100, pagu: 1225000000 }
    }
  },

  // MISI 7: INVESTASI
  {
    id: "P-11",
    missionId: 7,
    opd: "Dinas PMPTSP",
    program: "Program Pengembangan Iklim Penanaman Modal",
    indicator: "Realisasi total terhadap target investasi",
    baseline2024: "202.65",
    targets: {
      2026: { year: 2026, target: 100, pagu: 32328000 },
      2027: { year: 2027, target: 100, pagu: 37000000 },
      2028: { year: 2028, target: 100, pagu: 41000000 },
      2029: { year: 2029, target: 100, pagu: 45000000 },
      2030: { year: 2030, target: 100, pagu: 50000000 }
    }
  }
];
