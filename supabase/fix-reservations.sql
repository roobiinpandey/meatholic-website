-- Fix website reservation form (public insert) + admin access
-- Run once in Supabase → SQL Editor → Run

-- Grants (required if table was created only via SQL)
grant usage on schema public to anon, authenticated;
grant insert on public.reservations to anon;
grant select, insert, update, delete on public.reservations to authenticated;

-- Recreate a reliable public insert policy
drop policy if exists "Allow public insert" on public.reservations;
drop policy if exists "Public insert reservation" on public.reservations;

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
  );

-- Admin can manage all reservations
drop policy if exists "Admin full access" on public.reservations;
drop policy if exists "Admin manage reservations" on public.reservations;
create policy "Admin manage reservations"
  on public.reservations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Promote admin if not done
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'roobiinpandey@gmail.com';

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
