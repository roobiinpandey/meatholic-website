-- Meatholic Full CMS Schema - Run in Supabase SQL Editor

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  guest_name text not null, phone text not null, email text,
  reservation_date date not null, reservation_time time not null,
  party_size int not null check (party_size > 0 and party_size <= 30),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','no_show')),
  notes text, source text default 'admin', internal_notes text, seating_preference text
);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  name text not null, description text, price text, image_url text,
  category text default 'signature', sort_order int default 0, is_active boolean default true
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  image_url text not null, alt_text text, sort_order int default 0, is_active boolean default true
);

create table if not exists public.specials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  title text not null, description text, price text, image_url text,
  sort_order int default 0, is_active boolean default true
);

create table if not exists public.settings (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('capacity', '{"max_covers_per_slot":40,"slot_minutes":90,"open_time":"14:00","close_time":"00:00"}'),
  ('restaurant', '{"name":"Meatholic","phone":"+971501262191","whatsapp":"971501262191","address":"Al Zeina, Al Raha Beach — Abu Dhabi","tagline":"Japanese & Australian Wagyu","subtitle":"Top 1% cuts. Simple. Perfect.","hours":"Open daily 2:00 PM – 12:00 AM","instagram":"https://www.instagram.com/meatholicmeats/"}')
on conflict (key) do nothing;

create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists reservations_updated_at on public.reservations;
create trigger reservations_updated_at before update on public.reservations for each row execute function public.set_updated_at();
drop trigger if exists dishes_updated_at on public.dishes;
create trigger dishes_updated_at before update on public.dishes for each row execute function public.set_updated_at();
drop trigger if exists specials_updated_at on public.specials;
create trigger specials_updated_at before update on public.specials for each row execute function public.set_updated_at();

alter table public.reservations enable row level security;
alter table public.dishes enable row level security;
alter table public.gallery enable row level security;
alter table public.specials enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Allow public insert" on public.reservations;
create policy "Allow public insert" on public.reservations for insert to anon with check (true);
drop policy if exists "Public read dishes" on public.dishes;
create policy "Public read dishes" on public.dishes for select to anon using (is_active = true);
drop policy if exists "Public read gallery" on public.gallery;
create policy "Public read gallery" on public.gallery for select to anon using (is_active = true);
drop policy if exists "Public read specials" on public.specials;
create policy "Public read specials" on public.specials for select to anon using (is_active = true);
drop policy if exists "Public read settings" on public.settings;
create policy "Public read settings" on public.settings for select to anon using (true);

drop policy if exists "Admin full access" on public.reservations;
create policy "Admin full access" on public.reservations for all to authenticated using (true) with check (true);
drop policy if exists "Admin dishes" on public.dishes;
create policy "Admin dishes" on public.dishes for all to authenticated using (true) with check (true);
drop policy if exists "Admin gallery" on public.gallery;
create policy "Admin gallery" on public.gallery for all to authenticated using (true) with check (true);
drop policy if exists "Admin specials" on public.specials;
create policy "Admin specials" on public.specials for all to authenticated using (true) with check (true);
drop policy if exists "Admin settings access" on public.settings;
create policy "Admin settings access" on public.settings for all to authenticated using (true) with check (true);
