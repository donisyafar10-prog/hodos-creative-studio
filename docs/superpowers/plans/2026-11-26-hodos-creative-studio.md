# Hodos Creative Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a swimming/diving event management website "Hodos Creative Studio" with multi-role auth, event management, heat/lane assignment, results processing, and medal recap — all ported from Excel VBA logic to web.

**Architecture:** Next.js App Router with Server Components by default. Supabase handles Auth, Postgres database, and Row Level Security for download restrictions. shadcn/ui + Tailwind for UI components matching the Helix Ribbon Hero theme. Server Actions for write operations (creating events, assigning heats, inputting times). Middleware guards protected routes and download endpoints.

**Tech Stack:** Next.js 14 (App Router), Supabase (Auth + Postgres + RLS), shadcn/ui, Tailwind CSS, TypeScript, Vercel (deploy), Google Fonts (Anton + Inter Tight).

**Spec:** `docs/superpowers/specs/2026-11-26-hodos-creative-studio-design.md`

## Global Constraints

- Helix Ribbon Hero animations and theme **must not be changed** — background `#f2140c`, foreground `#f7f3ee`, fonts Anton/Inter Tight
- Download Buku Acara & Buku Hasil restricted to Super Admin, Admin, Official/Tim — enforced by middleware + Supabase RLS
- Wasit uses personal iOS/Android browser — all pages responsive, touch-friendly
- No custom domain — Vercel free tier auto domain
- Super Admin is the only role that can create Admin accounts
- Peserta registered by Official/Tim — no Peserta login
- Penonton (public) accesses `/events`, `/ranking`, `/` without login

## Review Focus

1. **Unauthenticated download attempts** — accessing `/download/...` without valid session or with wrong role → 403/redirect to login
2. **Wasit mobile input** — time input on small screens, numeric keypad, validation for DNF/DNS/DQ formats
3. **Heat/lane FINA assignment** — fastest swimmers in last heat, center lanes (4,5,3,6,2,7,1,8), leftovers in heat 1
4. **Record detection** — athlete time < existing record triggers "R. Sultra" flag, green highlight
5. **Medal recap accuracy** — team medals + best swimmer (putra/putri) counted correctly from results, including teams with 0 medals

---

### Task 1: Project Scaffold & Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/lib/utils.ts`
- Create: `components.json` (shadcn config)

**Interfaces:**
- Produces: configured Next.js + Tailwind + shadcn project ready for components

- [ ] **Step 1: Initialize Next.js project with App Router, TypeScript, Tailwind, ESLint**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

- [ ] **Step 2: Install shadcn/ui and dependencies**

```bash
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers date-fns
npx shadcn@latest init --force
```

- [ ] **Step 3: Configure Tailwind for Helix theme colors**

Edit `tailwind.config.ts` to add custom colors matching Helix Ribbon Hero:
```ts
colors: {
  helix: {
    bg: '#f2140c',
    fg: '#f7f3ee',
  }
}
```

- [ ] **Step 4: Add Google Fonts (Anton + Inter Tight) to layout.tsx**

```tsx
import { Anton, Inter_Tight } from 'next/font/google'
const anton = Anton({ subsets: ['latin'], weight: '400', display: 'swap' })
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['500','600','700'], display: 'swap', variable: '--font-inter-tight' })
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js + shadcn + Tailwind + Supabase config"
```

---

### Task 2: Supabase Setup & Database Schema

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`

**Interfaces:**
- Consumes: Supabase project credentials from `.env.local`
- Produces: `createClient()`, `createServerClient()`, `updateSession()` middleware helper, typed database schema

- [ ] **Step 1: Write Supabase client helpers**

`src/lib/supabase/client.ts` — browser client with `createBrowserClient()`
`src/lib/supabase/server.ts` — server client with `createServerClient()` using cookies

- [ ] **Step 2: Write middleware session refresh**

`src/lib/supabase/middleware.ts` — `updateSession()` for Next.js middleware

- [ ] **Step 3: Create database migration**

`supabase/migrations/001_initial_schema.sql` with tables:
```sql
-- profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  email text not null,
  role text not null check (role in ('super_admin','admin','official','wasit')),
  nama text,
  created_at timestamptz default now()
);

-- events
create table events (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  tanggal date not null,
  lokasi text,
  status text default 'draft' check (status in ('draft','published','ongoing','finished')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- event_categories (nomor acara: 50m Bifins Putra, etc)
create table event_categories (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  nomor_acara text not null, -- "101"
  gaya text not null, -- "50m Bifins"
  jenis_kelamin text not null check (jenis_kelamin in ('putra','putri','campuran')),
  sesi text not null check (sesi in ('pagi','sore')),
  urutan int default 0
);

-- teams
create table teams (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  asal text,
  event_id uuid references events(id) on delete cascade
);

-- participants (atlet)
create table participants (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  tahun_lahir int,
  gender text check (gender in ('putra','putri')),
  team_id uuid references teams(id) on delete set null,
  event_category_id uuid references event_categories(id) on delete cascade
);

-- heats
create table heats (
  id uuid default gen_random_uuid() primary key,
  event_category_id uuid references event_categories(id) on delete cascade,
  nomor_heat int not null
);

-- heat_lanes (assignment ke lintasan)
create table heat_lanes (
  id uuid default gen_random_uuid() primary key,
  heat_id uuid references heats(id) on delete cascade,
  nomor_lintasan int not null check (nomor_lintasan between 1 and 8),
  participant_id uuid references participants(id) on delete set null,
  waktu_prestasi text -- "99.99.99" or actual time
);

-- results (waktu akhir)
create table results (
  id uuid default gen_random_uuid() primary key,
  event_category_id uuid references event_categories(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  posisi int,
  waktu_akhir text,
  rekor_flag boolean default false
);

-- records (rekor kejuaraan)
create table records (
  id uuid default gen_random_uuid() primary key,
  kategori text not null unique, -- "50m Bifins Putra"
  waktu_rekor text not null,
  atlet text not null,
  kejuaraan text,
  tahun int,
  tempat text
);

-- medals (rekap per tim)
create table medals (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade,
  emas int default 0,
  perak int default 0,
  perunggu int default 0
);
```

- [ ] **Step 4: Enable RLS & policies**

```sql
-- profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Super admin can view all" on profiles for select using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

-- event_categories, heats, heat_lanes, results, records — public read for penonton
alter table event_categories enable row level security;
create policy "Public read event_categories" on event_categories for select using (true);

-- download files (buku_acara, buku_hasil) — restrict by role
-- implemented via storage buckets + policies or signed URLs with role check
```

- [ ] **Step 5: Seed data (optional records)**

`supabase/seed.sql` with sample records matching VBA

- [ ] **Step 6: Commit**

```bash
git add supabase/ src/lib/supabase/
git commit -m "feat: Supabase schema, RLS, client/server helpers"
```

---

### Task 3: Auth System & Role-Based Access

**Files:**
- Create: `src/middleware.ts`
- Create: `src/lib/auth.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/role-badge.tsx`

**Interfaces:**
- Consumes: Supabase server client, `updateSession()`
- Produces: `getUserRole()`, `requireRole()`, middleware route protection

- [ ] **Step 1: Write middleware**

`src/middleware.ts` — calls `updateSession()`, protects routes:
- `/admin/*` → require `super_admin` or `admin`
- `/wasit/*` → require `wasit`
- `/registrasi` → require `official`, `admin`, `super_admin`
- `/download/*` → require `super_admin`, `admin`, `official`
- `/login` → redirect if already authenticated

- [ ] **Step 2: Write auth utilities**

`src/lib/auth.ts`:
```ts
async function getUserRole(): Promise<'super_admin'|'admin'|'official'|'wasit'|null>
async function requireRole(allowed: string[]): Promise<void> // throws redirect
function canDownload(role: string): boolean // super_admin, admin, official
```

- [ ] **Step 3: Build login page**

`src/app/login/page.tsx` — Server Component, shows `LoginForm`
`src/components/auth/login-form.tsx` — Client Component, email/password, Supabase `signInWithPassword`, redirect based on role

- [ ] **Step 4: Add logout action**

Server Action `signOut()` in `src/app/actions/auth.ts`

- [ ] **Step 5: Test login flow manually**

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/lib/auth.ts src/app/login src/components/auth src/app/actions/auth.ts
git commit -m "feat: auth system with role-based middleware"
```

---

### Task 4: Helix Ribbon Hero Landing Page

**Files:**
- Create: `src/components/ui/helix-ribbon-hero.tsx` (from provided code)
- Create: `src/app/page.tsx` (landing)
- Create: `src/components/layout/navbar.tsx`
- Create: `src/components/layout/footer.tsx`

**Interfaces:**
- Consumes: HelixRibbonHero component, theme colors from Tailwind
- Produces: Landing page with preserved animations, custom navbar

- [ ] **Step 1: Copy HelixRibbonHero component**

Paste provided `helix-ribbon-hero.tsx` to `src/components/ui/helix-ribbon-hero.tsx`
- Remove `demo.tsx` reference
- Ensure `"use client"` directive
- Update imports to use `@/` alias

- [ ] **Step 2: Build Navbar component**

`src/components/layout/navbar.tsx` — Client Component
- Left: "Hodos Creative Studio" brand (links to `/`)
- Center nav: Service > Events (`/events`), About > Registrasi (`/registrasi`), Contact > Ranking (`/ranking`)
- Right: "Login" button (links to `/login`), replaces "Book a call"
- Style: match Helix theme (bg `helix.bg`, text `helix.fg`, uppercase, letter-spacing)

- [ ] **Step 3: Build landing page**

`src/app/page.tsx` — Server Component
```tsx
import { HelixRibbonHero } from '@/components/ui/helix-ribbon-hero'
import Navbar from '@/components/layout/navbar'

export default function Home() {
  return (
    <>
      <Navbar />
      <HelixRibbonHero
        greeting="Hai, saya"
        name="Hodos Creative Studio"
        brand="Hodos Creative Studio"
        count="( Event Renang & Selam )"
        bio="Platform pengelolaan event lomba renang dan selam terintegrasi."
        scrollHint="Geser ke bawah"
        background="#f2140c"
        foreground="#f7f3ee"
        autoPlay={false}
      />
      <Footer />
    </>
  )
}
```

- [ ] **Step 4: Verify animations work** — scroll triggers helix, headline split, grid landing

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/helix-ribbon-hero.tsx src/components/layout/navbar.tsx src/app/page.tsx
git commit -m "feat: Helix Ribbon Hero landing with custom navbar"
```

---

### Task 5: Public Pages — Events, Ranking

**Files:**
- Create: `src/app/events/page.tsx`
- Create: `src/app/events/[id]/page.tsx`
- Create: `src/app/ranking/page.tsx`
- Create: `src/components/events/event-list.tsx`
- Create: `src/components/events/event-detail.tsx`
- Create: `src/components/ranking/medal-table.tsx`
- Create: `src/components/ranking/best-swimmer.tsx`

**Interfaces:**
- Consumes: Supabase queries for events, categories, results, medals
- Produces: Public-readable pages (no auth required)

- [ ] **Step 1: Events list page**

`src/app/events/page.tsx` — Server Component, fetches published events, renders `EventList`
`src/components/events/event-list.tsx` — grid of event cards (nama, tanggal, lokasi, status)

- [ ] **Step 2: Event detail page**

`src/app/events/[id]/page.tsx` — Server Component
- Fetch event + categories + heats + participants
- Render schedule table (Buku Acara view — read-only for public)
- Link to `/ranking` for results

- [ ] **Step 3: Ranking page**

`src/app/ranking/page.tsx` — Server Component
- Tabs: "Perolehan Medali Tim", "Best Swimmer Putra", "Best Swimmer Putri"
- `MedalTable` — sorted by emas > perak > perunggu > nama tim (include 0-medal teams from seed)
- `BestSwimmer` — individual medal count per athlete (non-estafet only)

- [ ] **Step 4: Commit**

```bash
git add src/app/events src/app/ranking src/components/events src/components/ranking
git commit -m "feat: public events and ranking pages"
```

---

### Task 6: Admin Dashboard — Event & Category Management

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx` (dashboard overview)
- Create: `src/app/admin/events/page.tsx`
- Create: `src/app/admin/events/new/page.tsx`
- Create: `src/app/admin/events/[id]/page.tsx`
- Create: `src/app/admin/events/[id]/categories/page.tsx`
- Create: `src/app/admin/events/[id]/categories/new/page.tsx`
- Create: `src/components/admin/event-form.tsx`
- Create: `src/components/admin/category-form.tsx`
- Create: `src/components/admin/official-manager.tsx`

**Interfaces:**
- Consumes: `requireRole(['super_admin','admin'])`, Supabase mutations
- Produces: CRUD for events, categories, officials/teams

- [ ] **Step 1: Admin layout with sidebar**

`src/app/admin/layout.tsx` — checks role, renders sidebar nav

- [ ] **Step 2: Events CRUD**

- List: `src/app/admin/events/page.tsx` — table with actions (edit, delete, manage categories)
- Create: `src/app/admin/events/new/page.tsx` — form (nama, tanggal, lokasi)
- Detail: `src/app/admin/events/[id]/page.tsx` — manage categories, teams, officials

- [ ] **Step 3: Categories management**

`src/app/admin/events/[id]/categories/page.tsx` — add/edit nomor acara (nomor_acara, gaya, jenis_kelamin, sesi, urutan)

- [ ] **Step 4: Official & Team management**

`src/components/admin/official-manager.tsx` — Admin creates accounts for Official/Tim (email, password, nama tim), assigns to event

- [ ] **Step 5: Super Admin — create Admin accounts**

Only visible to `super_admin` — create Admin users

- [ ] **Step 6: Commit**

```bash
git add src/app/admin src/components/admin
git commit -m "feat: admin dashboard for events, categories, officials"
```

---

### Task 7: Official/Tim — Participant Registration

**Files:**
- Create: `src/app/registrasi/page.tsx`
- Create: `src/app/registrasi/teams/page.tsx`
- Create: `src/app/registrasi/participants/page.tsx`
- Create: `src/components/registrasi/team-form.tsx`
- Create: `src/components/registrasi/participant-form.tsx`
- Create: `src/components/registrasi/bulk-import.tsx`

**Interfaces:**
- Consumes: `requireRole(['official','admin','super_admin'])`, event context
- Produces: Team & participant CRUD, bulk import from CSV/Excel

- [ ] **Step 1: Registration landing**

`src/app/registrasi/page.tsx` — select event (if multiple), then tabs for Teams / Participants

- [ ] **Step 2: Team management**

`src/app/registrasi/teams/page.tsx` — add/edit teams (nama, asal)

- [ ] **Step 3: Participant management**

`src/app/registrasi/participants/page.tsx` — add/edit atlet (nama, tahun_lahir, gender, team, kategori)
- Filter by kategori (event_category)

- [ ] **Step 4: Bulk import (optional but recommended)**

`src/components/registrasi/bulk-import.tsx` — CSV upload mapping to participants table

- [ ] **Step 5: Commit**

```bash
git add src/app/registrasi src/components/registrasi
git commit -m "feat: official/tim participant registration"
```

---

### Task 8: Heat & Lane Assignment (FINA Logic — Port from VBA)

**Files:**
- Create: `src/lib/heat-assignment.ts`
- Create: `src/app/admin/events/[id]/heats/page.tsx`
- Create: `src/components/admin/heat-assignment.tsx`
- Create: `src/app/actions/heats.ts`

**Interfaces:**
- Consumes: `event_category_id`, list of participants with `waktu_prestasi`
- Produces: `assignHeatsAndLanes(categoryId: string) -> { heats: Heat[], assignments: HeatLane[] }`

- [ ] **Step 1: Implement time parsing (port from VBA `ParseWaktuToSeconds`)**

`src/lib/heat-assignment.ts`:
```ts
export function parseWaktuToSeconds(waktu: string): number {
  // port VBA logic: handle "99.99.99", "DNF", "DNS", "DQ", "1:23.45", "1.23,45", etc.
  // returns seconds as float, 999999 for empty/invalid, 999998 for DNF/DNS/DQ
}
export function formatSecondsToWaktu(seconds: number): string {
  // inverse for display
}
```

- [ ] **Step 2: Implement FINA lane order**

```ts
const FINA_LANE_ORDER = [4, 5, 3, 6, 2, 7, 1, 8] // center-out
```

- [ ] **Step 3: Implement heat distribution**

```ts
export function assignHeatsAndLanes(
  participants: { id: string; waktu_prestasi: string }[],
  lanesPerHeat = 8
): { heats: number; assignments: { participantId: string; heat: number; lane: number }[] } {
  // 1. Sort by waktu_prestasi ascending (fastest first), DNF/DNS/DQ at bottom
  // 2. Total heats = ceil(n / 8)
  // 3. Fastest swimmers go to LAST heat
  // 4. Remainder (n % 8, or 8 if divisible) go to heat 1
  // 5. Each heat filled with FINA_LANE_ORDER
  // 6. Return assignments
}
```

- [ ] **Step 4: Write unit tests**

`src/lib/heat-assignment.test.ts` — test cases:
- 8 swimmers → 1 heat, lanes 4,5,3,6,2,7,1,8
- 10 swimmers → 2 heats: heat 1 has 2 (slowest), heat 2 has 8 (fastest) with FINA lanes
- 16 swimmers → 2 heats of 8
- DNF/DNS/DQ sorted to bottom

- [ ] **Step 5: Build admin UI**

`src/app/admin/events/[id]/heats/page.tsx` — select category, click "Atur Heat & Lane Otomatis"
`src/components/admin/heat-assignment.tsx` — preview table before save
`src/app/actions/heats.ts` — Server Action `assignHeats(categoryId)` calls logic, writes to `heats` + `heat_lanes`

- [ ] **Step 6: Run tests & verify**

```bash
npm test -- src/lib/heat-assignment.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/heat-assignment.ts src/lib/heat-assignment.test.ts src/app/admin/events/*/heats src/components/admin/heat-assignment.tsx src/app/actions/heats.ts
git commit -m "feat: FINA heat/lane assignment logic ported from VBA"
```

---

### Task 9: Wasit — Time Input (Mobile Responsive)

**Files:**
- Create: `src/app/wasit/layout.tsx`
- Create: `src/app/wasit/page.tsx`
- Create: `src/app/wasit/[eventId]/page.tsx`
- Create: `src/app/wasit/[eventId]/[categoryId]/page.tsx`
- Create: `src/components/wasit/time-input-grid.tsx`
- Create: `src/components/wasit/lane-card.tsx`
- Create: `src/app/actions/results.ts`

**Interfaces:**
- Consumes: `requireRole(['wasit'])`, heat_lanes for category
- Produces: Touch-friendly grid for inputting waktu_akhir per lintasan

- [ ] **Step 1: Wasit layout**

`src/app/wasit/layout.tsx` — simple header (event name, category), logout

- [ ] **Step 2: Event & category selection**

`src/app/wasit/page.tsx` — list assigned events/categories for this wasit

- [ ] **Step 3: Time input grid**

`src/app/wasit/[eventId]/[categoryId]/page.tsx` — Server Component fetches heat_lanes
`src/components/wasit/time-input-grid.tsx` — Client Component
- Grid: 8 columns (lintasan 1-8), rows = heats
- Each cell: participant name, time input (numeric, step=0.01, supports `mm.ss.dd` format)
- Buttons: DNF, DNS, DQ (set special values)
- Auto-save on blur/enter via Server Action `updateResult(heatLaneId, waktu)`

- [ ] **Step 4: Mobile optimizations**

- `inputmode="decimal"` for numeric keypad
- Large touch targets (min 44px)
- Sticky header for lane numbers
- Horizontal scroll on narrow screens

- [ ] **Step 5: Server Action for results**

`src/app/actions/results.ts`:
```ts
export async function updateResult(heatLaneId: string, waktu: string) {
  // parse, validate, update heat_lanes.waktu_prestasi
  // also update results table if final
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/wasit src/components/wasit src/app/actions/results.ts
git commit -m "feat: wasit mobile time input grid"
```

---

### Task 10: Results Processing — Sorting, Record Detection, Medal Recap (Port from VBA)

**Files:**
- Create: `src/lib/results-processing.ts`
- Create: `src/lib/results-processing.test.ts`
- Create: `src/app/actions/process-results.ts`
- Create: `src/app/admin/events/[id]/results/page.tsx`
- Create: `src/components/admin/results-processor.tsx`

**Interfaces:**
- Consumes: `event_category_id`, heat_lanes with `waktu_prestasi`, records table
- Produces: Sorted results with positions, rekor_flag, updated medals table

- [ ] **Step 1: Implement results sorting (port from VBA `UrutkanJuaraBukuHasil`)**

`src/lib/results-processing.ts`:
```ts
export function processResults(
  participants: { id: string; nama: string; team_id: string; waktu_akhir: string; heat: number; lane: number }[],
  record: { waktu_rekor: string } | null
): { results: ProcessedResult[]; medals: MedalUpdate[]; bestSwimmers: BestSwimmerUpdate[] } {
  // 1. Parse all waktu_akhir to seconds
  // 2. Sort ascending (fastest first), DNF/DNS/DQ (999998) at bottom, empty (999999) last
  // 3. Assign positions 1..n
  // 4. Check record: if position 1 and waktu < record.waktu_rekor → rekor_flag = true, ket = "R. Sultra"
  // 5. Medal allocation: top 3 get emas/perak/perunggu (skip DNF/DNS/DQ)
  // 6. Best swimmer: per gender, non-estafet only, count medals
}
```

- [ ] **Step 2: Implement medal recap (port from VBA `RekapMedaliOtomatis`)**

```ts
export function calculateMedals(results: ProcessedResult[], eventCategories: Category[]): {
  teamMedals: Map<team_id, { emas: number; perak: number; perunggu: number }>;
  bestSwimmerPutra: Map<athlete_key, { emas: number; perak: number; perunggu: number }>;
  bestSwimmerPutri: Map<athlete_key, { emas: number; perak: number; perunggu: number }>;
} {
  // Include all teams from event (even 0 medals)
  // Sort teams: emas desc, perak desc, perunggu desc, nama asc
  // Best swimmer: only individual events (not estafet), by gender
}
```

- [ ] **Step 3: Write unit tests**

`src/lib/results-processing.test.ts`:
- 8 swimmers with times → correct positions
- Record broken → rekor_flag + green highlight
- DNF/DNS/DQ at bottom
- Team medals sorted correctly
- Best swimmer counts per gender
- Teams with 0 medals included

- [ ] **Step 4: Server Action to process & save**

`src/app/actions/process-results.ts`:
```ts
export async function processAndSaveResults(categoryId: string) {
  // fetch data, call processResults, write to results + medals tables
}
```

- [ ] **Step 5: Admin UI to trigger processing**

`src/app/admin/events/[id]/results/page.tsx` — list categories, button "Proses Hasil"
`src/components/admin/results-processor.tsx` — shows preview before confirm

- [ ] **Step 6: Run tests**

```bash
npm test -- src/lib/results-processing.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/results-processing.ts src/lib/results-processing.test.ts src/app/actions/process-results.ts src/app/admin/events/*/results src/components/admin/results-processor.tsx
git commit -m "feat: results processing, record detection, medal recap from VBA"
```

---

### Task 11: Buku Acara & Buku Hasil — Generation & Download (Role-Gated)

**Files:**
- Create: `src/lib/report-generation.ts`
- Create: `src/app/download/buku-acara/[eventId]/route.ts`
- Create: `src/app/download/buku-hasil/[eventId]/route.ts`
- Create: `src/components/download/download-buttons.tsx`

**Interfaces:**
- Consumes: Event data, categories, heats, lanes, results, medals
- Produces: Excel (.xlsx) files matching VBA output format, served via protected routes

- [ ] **Step 1: Install Excel library**

```bash
npm install exceljs
```

- [ ] **Step 2: Implement Buku Acara generation (port from VBA `BuatBukuAcaraDanAturSeriGlobal`)**

`src/lib/report-generation.ts`:
```ts
export async function generateBukuAcara(eventId: string): Promise<Buffer> {
  // Workbook with sheets per category
  // Header: "Acara 101", "50m Bifins Putra", "AKHIR", "Sore", "Record: ..."
  // Table: Pos, Lintasan, Nama Atlet, Ket, Lahir, Group, Nama Tim, Prestasi, Penyisihan, Akhir, SERI X
  // Heat grouping with FINA lanes
  // Estafet support: 4 names in one cell (newline separated)
}
```

- [ ] **Step 3: Implement Buku Hasil generation (port from VBA `AmbilDanGabungDataAcara` + `UrutkanJuaraBukuHasil`)**

```ts
export async function generateBukuHasil(eventId: string): Promise<Buffer> {
  // Single merged table per category: "HASIL GABUNGAN"
  // Columns: Pos, Lintasan, Nama Atlet, Ket, Lahir, Group, Nama Tim, Prestasi, Penyisihan, Akhir, HASIL GABUNGAN
  // Sorted by final time across all heats
  // Record breaker highlighted (green, bold)
  // Only bottom border on last row
}
```

- [ ] **Step 4: Protected download routes**

`src/app/download/buku-acara/[eventId]/route.ts`:
```ts
export async function GET(req: Request, { params }: { params: { eventId: string } }) {
  const role = await getUserRole()
  if (!canDownload(role)) return new Response('Forbidden', { status: 403 })
  const buffer = await generateBukuAcara(params.eventId)
  return new Response(buffer, {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="buku-acara-${params.eventId}.xlsx"` }
  })
}
```
Same for `buku-hasil`.

- [ ] **Step 5: Download buttons in admin/official UI**

`src/components/download/download-buttons.tsx` — only renders if `canDownload(role)`

- [ ] **Step 6: Test download with different roles**

- [ ] **Step 7: Commit**

```bash
git add src/lib/report-generation.ts src/app/download src/components/download
git commit -m "feat: buku acara & buku hasil generation with role-gated download"
```

---

### Task 12: Polish, Responsive Check, Deploy Config

**Files:**
- Modify: `src/app/globals.css` (polish)
- Create: `vercel.json` (optional)
- Create: `.github/workflows/deploy.yml` (optional CI)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Production-ready build

- [ ] **Step 1: Responsive audit**

- Test all pages at 375px, 768px, 1024px, 1440px
- Wasit time input grid on iOS Safari / Android Chrome
- Navbar collapses correctly on mobile

- [ ] **Step 2: Accessibility pass**

- Semantic HTML, alt text, focus states, color contrast (WCAG AA)

- [ ] **Step 3: Build & deploy to Vercel**

```bash
npm run build
vercel --prod
```

- [ ] **Step 4: Configure Supabase Auth providers**

- Email/password enabled
- Redirect URLs: `https://<vercel-domain>/auth/callback`

- [ ] **Step 5: Create Super Admin account manually in Supabase dashboard**

- Insert into `profiles` with `role = 'super_admin'`

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "chore: polish, a11y, deploy config"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All 6 roles, all 8 pages, all VBA logic ports, download gating, responsive Wasit — each mapped to a task
- [ ] Step scan: Each step is one action with checkable result; no "TBD" or vague steps
- [ ] Type consistency: `getUserRole()` returns union type used in middleware, download routes, UI; `parseWaktuToSeconds` returns `number` used in heat assignment + results processing
- [ ] Review Focus: 5 failure modes each pinned to a task (Task 3 middleware, Task 9 mobile input, Task 8 FINA logic, Task 10 record detection, Task 10 medal recap)
- [ ] Proportion: Plan is detailed but not a transcript — signatures + test names + key algorithms only

---

**Plan complete and saved to `docs/superpowers/plans/2026-11-26-hodos-creative-studio.md`. Please review the plan. Which execution approach would you prefer?**

- **Subagent-driven** — A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** — I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend Native**, because the tasks are heavily sequential (each builds on the previous's interfaces — Supabase schema → auth → pages → logic → reports), and a single context carrying all interface decisions will be faster and cheaper. Does the plan capture what you want, and shall I proceed with Native execution?