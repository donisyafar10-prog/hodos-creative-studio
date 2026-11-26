-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  role text not null check (role in ('super_admin', 'admin', 'official', 'wasit')),
  nama text,
  created_at timestamptz default now()
);

-- Events
create table events (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  tanggal date not null,
  lokasi text,
  status text default 'draft' check (status in ('draft', 'published', 'ongoing', 'finished')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Event categories (nomor acara: 50m Bifins Putra, etc)
create table event_categories (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  nomor_acara text not null, -- "101"
  gaya text not null, -- "50m Bifins"
  jenis_kelamin text not null check (jenis_kelamin in ('putra', 'putri', 'campuran')),
  sesi text not null check (sesi in ('pagi', 'sore')),
  urutan int default 0
);

-- Teams
create table teams (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  asal text,
  event_id uuid references events(id) on delete cascade
);

-- Participants (atlet)
create table participants (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  tahun_lahir int,
  gender text check (gender in ('putra', 'putri')),
  team_id uuid references teams(id) on delete set null,
  event_category_id uuid references event_categories(id) on delete cascade
);

-- Heats
create table heats (
  id uuid default gen_random_uuid() primary key,
  event_category_id uuid references event_categories(id) on delete cascade,
  nomor_heat int not null
);

-- Heat lanes (assignment ke lintasan)
create table heat_lanes (
  id uuid default gen_random_uuid() primary key,
  heat_id uuid references heats(id) on delete cascade,
  nomor_lintasan int not null check (nomor_lintasan between 1 and 8),
  participant_id uuid references participants(id) on delete set null,
  waktu_prestasi text -- "99.99.99" or actual time
);

-- Results (waktu akhir)
create table results (
  id uuid default gen_random_uuid() primary key,
  event_category_id uuid references event_categories(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  posisi int,
  waktu_akhir text,
  rekor_flag boolean default false
);

-- Records (rekor kejuaraan)
create table records (
  id uuid default gen_random_uuid() primary key,
  kategori text not null unique, -- "50m Bifins Putra"
  waktu_rekor text not null,
  atlet text not null,
  kejuaraan text,
  tahun int,
  tempat text
);

-- Medals (rekap per tim)
create table medals (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade,
  emas int default 0,
  perak int default 0,
  perunggu int default 0
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table events enable row level security;
alter table event_categories enable row level security;
alter table teams enable row level security;
alter table participants enable row level security;
alter table heats enable row level security;
alter table heat_lanes enable row level security;
alter table results enable row level security;
alter table records enable row level security;
alter table medals enable row level security;

-- Policies: Public read for penonton
create policy "Public read profiles" on profiles for select using (true);
create policy "Public read events" on events for select using (true);
create policy "Public read event_categories" on event_categories for select using (true);
create policy "Public read teams" on teams for select using (true);
create policy "Public read participants" on participants for select using (true);
create policy "Public read heats" on heats for select using (true);
create policy "Public read heat_lanes" on heat_lanes for select using (true);
create policy "Public read results" on results for select using (true);
create policy "Public read records" on records for select using (true);
create policy "Public read medals" on medals for select using (true);

-- Policies: Authenticated write based on role
create policy "Authenticated can insert profiles" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Super admin/admin can manage events" on events
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('super_admin', 'admin'))
  );

create policy "Super admin/admin can manage event_categories" on event_categories
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('super_admin', 'admin'))
  );

create policy "Super admin/admin can manage teams" on teams
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('super_admin', 'admin'))
  );

create policy "Official/admin/super_admin can manage participants" on participants
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('super_admin', 'admin', 'official'))
  );

create policy "Wasit/admin/super_admin can manage heat_lanes" on heat_lanes
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('super_admin', 'admin', 'wasit'))
  );

create policy "Wasit/admin/super_admin can manage results" on results
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('super_admin', 'admin', 'wasit'))
  );

-- Download restrictions: only super_admin, admin, official can access download routes
-- Enforced at middleware level; database policies keep reads public for viewing,
-- but file downloads are gated by route protection.
