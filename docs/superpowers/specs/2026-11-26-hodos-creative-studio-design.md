# Design Document — Hodos Creative Studio

**Tanggal:** 2026-11-26  
**Stack:** Next.js (App Router) + Supabase (Auth + Postgres) + shadcn/ui + Tailwind CSS + TypeScript  
**Deploy:** Vercel (free tier, tanpa custom domain dulu)

## Tujuan & Mengapa
Website pengelolaan event lomba renang dan selam untuk "Hodos Creative Studio". Publik bisa melihat jadwal dan hasil tanpa login. Ada sistem login multi-role untuk mengelola event, atlet, tim, dan waktu lomba. Logika dari Excel VBA (pengaturan heat/lane, pengurutan hasil, deteksi rekor, rekap medali) dipindahkan ke web.

## Role dan Akses

| Role | Apa yang boleh dilakukan | Login? |
|------|--------------------------|--------|
| **Penonton** (publik) | Lihat halaman utama, jadwal acara, hasil | Tidak |
| **Peserta** | Didaftarkan oleh Official/Tim, tidak perlu login sendiri | Tidak |
| **Official/Tim** | Daftarkan tim & peserta, unduh Buku Acara & Buku Hasil | Ya |
| **Wasit** | Input limit waktu per lintasan lewat browser ponsel | Ya |
| **Admin** | Buat event, daftar official & tim, kelola akun selain Super Admin | Ya |
| **Super Admin** | Akses semua (konten, foto, tema), ubah role lain, buat akun Admin | Ya |

## Halaman

- `/` — Landing dengan Helix Ribbon Hero (animasi & tema tidak diubah), navbar: Service > Events, About > Registrasi, Contact > Ranking; tombol kanan atas "Login"
- `/login` — Halaman login semua role
- `/events` — Daftar event (publik bisa lihat)
- `/registrasi` — Pendaftaran tim/peserta (Official/Admin)
- `/ranking` — Rekap medali & hasil (publik bisa lihat)
- `/admin/*` — Dashboard admin (hanya Super Admin/Admin)
- `/wasit/*` — Input waktu wasit (responsive untuk ponsel)
- `/download/*` — Buku Acara & Buku Hasil (hanya Super Admin/Admin/Official)

## Download Buku Acara & Buku Hasil
Dibatasi untuk Super Admin, Admin, dan Official/Tim. Ditegakkan di middleware Next.js **dan** di database Supabase (RLS), jadi tidak bisa diakses hanya dengan menebak URL.

## Logika VBA (dipindahkan ke web)
1. Parsing waktu (detik, menit.detik, jam.menit.detik) → detik
2. Status khusus: DNF/DNS/DQ → posisi bawah
3. Pengaturan heat & lane sesuai aturan FINA (atlet tercepat di heat terakhir, sisa di heat 1)
4. Pengurutan hasil tercepat → terlambat
5. Deteksi rekor (jika waktu atlet lebih cepat dari rekor)
6. Rekap medali per tim & best swimmer (putra/putri)

## Data Model (Supabase/Postgres)
- `profiles` — id, email, role, nama, created_at
- `events` — id, nama, tanggal, lokasi, status, created_by
- `event_categories` — id, event_id, gaya (misal 50m Bifins Putra), jenis_kelamin, sesi (Pagi/Sore)
- `teams` — id, nama, asal, event_id
- `participants` — id, nama, tahun_lahir, gender, team_id, event_category_id
- `heats` — id, event_category_id, nomor_heat
- `heat_lanes` — id, heat_id, nomor_lintasan, participant_id, waktu_prestasi
- `results` — id, event_category_id, participant_id, posisi, waktu_akhir, rekor_flag
- `records` — id, kategori, waktu_rekor, atlet, kejuaraan, tahun, tempat
- `medals` — id, team_id, emas, perak, perunggu

## Tema & Warna (mengikuti Helix Ribbon Hero)
- Background: `#f2140c`
- Foreground: `#f7f3ee`
- Font: Anton (headline) + Inter Tight (body) via Google Fonts
- Animasi scroll helix, headline split, grid landing — **tidak diubah**

## Deployment
- Vercel free tier untuk now
- Supabase free tier untuk database & auth
- Belum ada custom domain