-- Meatholic security hardening
-- Run this once in Supabase SQL Editor (Dashboard → SQL → New query)

-- 1) Admin check: only users with app_metadata.role = 'admin'
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- 2) Drop overly permissive policies
drop policy if exists "Allow public insert" on public.reservations;
drop policy if exists "Admin full access" on public.reservations;
drop policy if exists "Admin dishes" on public.dishes;
drop policy if exists "Admin gallery" on public.gallery;
drop policy if exists "Admin specials" on public.specials;
drop policy if exists "Admin settings access" on public.settings;

-- 3) Public: insert reservations only with safe constraints
create policy "Public insert reservation"
  on public.reservations
  for insert
  to anon
  with check (
    status = 'pending'
    and source = 'website'
    and party_size between 1 and 30
    and reservation_date >= (current_date - 1)
    and char_length(trim(guest_name)) between 2 and 120
    and char_length(trim(phone)) between 7 and 40
    and (email is null or char_length(email) <= 120)
    and (notes is null or char_length(notes) <= 500)
    and internal_notes is null
  );

-- 4) Admin-only full access (requires app_metadata.role = 'admin')
create policy "Admin manage reservations"
  on public.reservations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admin manage dishes"
  on public.dishes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admin manage gallery"
  on public.gallery for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admin manage specials"
  on public.specials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admin manage settings"
  on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 5) Keep public read policies for menu content
drop policy if exists "Public read dishes" on public.dishes;
create policy "Public read dishes"
  on public.dishes for select to anon using (is_active = true);

drop policy if exists "Public read gallery" on public.gallery;
create policy "Public read gallery"
  on public.gallery for select to anon using (is_active = true);

drop policy if exists "Public read specials" on public.specials;
create policy "Public read specials"
  on public.specials for select to anon using (is_active = true);

drop policy if exists "Public read settings" on public.settings;
create policy "Public read settings"
  on public.settings for select to anon using (true);

-- 6) Promote YOUR admin user (edit the email, then run):
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'you@example.com';
