-- Fix: promote admin user + allow admin to manage CMS
-- Run this entire script in Supabase → SQL Editor → Run

-- 1) Promote your login to admin role
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'roobiinpandey@gmail.com';

-- 2) is_admin() checks role OR your email (so admin always works)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or lower(coalesce(auth.jwt() ->> 'email', '')) = 'roobiinpandey@gmail.com',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- 3) Ensure admin policies exist (re-create if missing)
drop policy if exists "Admin manage dishes" on public.dishes;
create policy "Admin manage dishes"
  on public.dishes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage gallery" on public.gallery;
create policy "Admin manage gallery"
  on public.gallery for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage specials" on public.specials;
create policy "Admin manage specials"
  on public.specials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage reservations" on public.reservations;
create policy "Admin manage reservations"
  on public.reservations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage settings" on public.settings;
create policy "Admin manage settings"
  on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 4) Public can still read active items
drop policy if exists "Public read dishes" on public.dishes;
create policy "Public read dishes"
  on public.dishes for select to anon using (is_active = true);

drop policy if exists "Public read gallery" on public.gallery;
create policy "Public read gallery"
  on public.gallery for select to anon using (is_active = true);

drop policy if exists "Public read specials" on public.specials;
create policy "Public read specials"
  on public.specials for select to anon using (is_active = true);
