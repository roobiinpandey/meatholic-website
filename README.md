# Meatholic — Premium Wagyu Restaurant (Abu Dhabi)

Official website and admin panel for **Meatholic**, Al Zeina, Al Raha Beach.

**Live site:** https://meatholicabudhabi.vercel.app  
**Admin:** https://meatholicabudhabi.vercel.app/admin/

---

## Project structure

```
meatholic-website/
├── index.html
├── css/style.css
├── js/main.js
├── admin/
│   ├── index.html
│   └── css/admin.css
├── admin-app-*.js
├── images/
├── supabase/
│   ├── schema.sql
│   ├── seed.sql
│   └── security-hardening.sql   # run once for RLS lock-down
├── vercel.json                  # security headers
├── SECURITY.md
└── README.md
```

---

## Security (important)

After deploy, complete these steps once:

1. **Supabase SQL Editor** → run `supabase/security-hardening.sql`
2. Promote your admin user:

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

3. **Auth → Email** → turn **OFF** public sign-ups  
4. Sign out of `/admin/` and sign in again  

Full details: [SECURITY.md](./SECURITY.md)

---

## Setup

1. Run `supabase/schema.sql` (or `security-hardening.sql` if tables already exist)  
2. Create admin user → set `role: admin` in app metadata  
3. Deploy to Vercel  
4. Open `/admin/` and sign in  

---

## Contact

- Phone: +971 50 126 2191  
- Instagram: [@meatholicmeats](https://www.instagram.com/meatholicmeats/)  
