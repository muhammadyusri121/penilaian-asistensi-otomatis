# Penilaian Otomatis

Aplikasi web penilaian asistensi dan modul berbasis Next.js 13 + Supabase.

## Stack

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL)
- Netlify (deployment)

## Fitur Utama

- Manajemen data mahasiswa
- User tunggal berbasis file generator
- Login wajib sebelum masuk ke dashboard
- Manajemen sesi asistensi per mahasiswa
- Penilaian kriteria (quick select dan nilai manual)
- Penyimpanan nilai asistensi dan nilai modul ke database

## Struktur Penting

- `app/api/*`: API routes untuk CRUD mahasiswa, sesi, dan nilai
- `app/api/users/*`: API route baca user
- `app/login`: halaman login
- `lib/server/gradingStore.ts`: akses data utama ke Supabase
- `lib/server/userStore.ts`: akses data user ke Supabase
- `lib/db.ts`: inisialisasi Supabase client server-side
- `database/schema.sql`: schema tabel PostgreSQL
- `database/user-generator.json`: file sumber data user tunggal
- `lib/server/auth.ts`: utilitas token login
- `lib/server/userGenerator.ts`: baca file user generator

## Prasyarat

- Node.js 18+
- npm
- `psql` CLI (untuk migrasi via script `db:migrate`)

## Menjalankan Lokal

1. Install dependency.

```bash
npm install
```

2. Buat file environment lokal.

```bash
cp .env.example .env.local
```

3. Isi variabel di `.env.local`.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_DB_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

4. Jalankan migrasi schema.

```bash
npm run db:migrate
```

5. Isi data user dari file generator.

```bash
npm run seed:users
```

Catatan:
- Edit `database/user-generator.json` secara manual untuk mengubah user.
- Script `seed:users` akan mengosongkan tabel user lalu mengisi ulang dari file.
- Setelah login, dashboard terbuka. Jika belum login, otomatis diarahkan ke halaman login.

6. Jalankan aplikasi development.

```bash
npm run dev
```

Aplikasi tersedia di `http://localhost:3000`.

## Script

- `npm run dev`: menjalankan mode development
- `npm run build`: build production Next.js
- `npm run start`: menjalankan hasil build production
- `npm run lint`: linting
- `npm run typecheck`: pengecekan TypeScript
- `npm run db:migrate`: apply `database/schema.sql` ke Supabase
- `npm run seed:users`: sinkronkan data user dari `database/user-generator.json`

## Deploy ke Netlify

1. Push project ke Git provider (GitHub/GitLab/Bitbucket).
2. Import repository ke Netlify.
3. Gunakan konfigurasi build dari `netlify.toml`.
4. Isi environment variables di Netlify:
	- `NEXT_PUBLIC_SITE_URL`
	- `SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
	- `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy.

Catatan:
- `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server, jangan dipakai di client.
- `SUPABASE_DB_URL` umumnya dipakai saat migrasi dari lokal/CI, tidak wajib untuk runtime Netlify jika tidak menjalankan migrasi saat build.

## Keamanan

- Jangan commit file `.env`, `.env.local`, atau key rahasia ke repository.
- Jika key sempat terpapar, segera rotate di dashboard Supabase.
