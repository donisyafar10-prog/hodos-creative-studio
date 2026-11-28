# Verification Notes — Hodos Creative Studio

## Status as of 2026-11-27

### Confirmed working (verified via live deployment)

1. **Login API**: `POST /api/auth/login` with `donisyafar10@gmail.com` / `Bapakq21@21` → returns `role: super_admin` + auth cookie. ✅
2. **Download Buku Acara**: `GET /api/download/buku-acara/68e39242-...` with auth → HTTP 200, `application/pdf`, 26 KB, valid PDF 1.3 (1 page). ✅
3. **Download Buku Hasil**: `GET /api/download/buku-hasil/68e39242-...` with auth → HTTP 200, `application/pdf`, 90 KB, valid PDF 1.3 (3 pages). ✅
4. **Admin akun page**: loads HTML successfully with auth (200), sidebar/hamburger present, logo→homepage present, "Logout" button present, "Daftar Akun" heading present. ✅

### Still pending verification

- **admin/akun daftar akun table**: page HTML loads but earlier snapshot showed "Memuat..." stuck. `listUserAccounts()` via `fetch` to Supabase REST API may still fail if `SUPABASE_SERVICE_ROLE_KEY` isn't set in Vercel project env vars. Need to re-check after redeploy (commit `54a0921` pushed).
- **Buku Acara format**: hasn't been matched to VBA example yet — current PDF uses basic format. User hasn't supplied the VBA format for Buku Acara.

### Root causes addressed

- Secret key `SUPABASE_SERVICE_ROLE_KEY` not leaking to client bundles (verified: not in `.next/static/`).
- Download links fixed to `/api/download/...` (not `/download/...`).
- Kelola Akun uses REST API fetch (no Supabase client hang).
- jspdf used instead of pdfkit (serverless-safe).

### Deployment

- Commit `54a0921` (empty trigger) pushed to origin/master → Vercel redeploy in progress.
- Need to wait for deploy then re-test `admin/akun` table population.
