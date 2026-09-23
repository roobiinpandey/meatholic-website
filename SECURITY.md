# Security setup (Meatholic)

## 1. Apply database policies (required)

In [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** → New query:

1. Paste and run the full contents of `supabase/security-hardening.sql`
2. Promote your admin account (replace the email):

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

3. Sign out of `/admin/` and sign in again so the new JWT includes `role: admin`.

## 2. Lock Auth (required)

Supabase → **Authentication** → **Providers** → **Email**:

- Turn **OFF** “Enable sign ups” (invite-only / manual users only)

Optional: enable MFA for the admin user.

## 3. What was hardened in code

| Change | Effect |
|--------|--------|
| `is_admin()` + RLS | Only users with `app_metadata.role = admin` can manage data |
| Public insert constraints | Website can only create `pending` bookings with valid fields |
| `vercel.json` headers | CSP, clickjacking protection, HSTS, no MIME sniffing |
| Booking form validation | Client checks + 60s local rate limit |

## 4. Never commit

- Supabase **service_role** key
- Database passwords
- Private API tokens

The **anon / publishable** key in the frontend is expected and safe when RLS is correct.
