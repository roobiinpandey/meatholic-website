-- ============================================================
-- Meatholic Reservations - Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Reservations table
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  guest_name text not null,
  phone text not null,
  email text,
  
  reservation_date date not null,
  reservation_time time not null,
  party_size int not null check (party_size > 0 and party_size <= 30),
  
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  notes text,
  source text default 'admin',
  internal_notes text,
  seating_preference text
);

-- 2. Settings table
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('capacity', '{"max_covers_per_slot": 40, "slot_minutes": 90, "open_time": "14:00", "close_time": "00:00"}'),
  ('restaurant', '{"name": "Meatholic", "phone": "+971501262191", "whatsapp": "971501262191"}')
on conflict (key) do nothing;

-- 3. Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists reservations_updated_at on public.reservations;
create trigger reservations_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- 4. Row Level Security
alter table public.reservations enable row level security;
alter table public.settings enable row level security;

create policy "Allow public insert"
  on public.reservations for insert
  to anon
  with check (true);

create policy "Admin full access"
  on public.reservations for all
  to authenticated
  using (true)
  with check (true);

create policy "Admin settings access"
  on public.settings for all
  to authenticated
  using (true)
  with check (true);

create index if not exists reservations_date_idx on public.reservations (reservation_date);
create index if not exists reservations_status_idx on public.reservations (status);
