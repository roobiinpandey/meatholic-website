# Meatholic — Premium Wagyu Restaurant (Abu Dhabi)

Official website and admin panel for **Meatholic**, Al Zeina, Al Raha Beach.

**Live site:** https://meatholicabudhabi.vercel.app  
**Admin:** https://meatholicabudhabi.vercel.app/admin/

---

## Project structure

```
meatholic-website/
├── index.html                 # Public restaurant website
├── css/
│   └── style.css              # Public styles
├── js/
│   └── main.js                # Public scripts (nav + reservations)
├── admin/
│   ├── index.html             # Admin dashboard (login + CMS)
│   └── css/
│       └── admin.css          # Admin styles
├── admin-app-1.js             # Admin logic (auth, reservations)
├── admin-app-2a.js            # Admin logic (menu/dishes)
├── admin-app-2b.js            # Admin logic (gallery)
├── admin-app-2c.js            # Admin logic (specials, settings)
├── images/                    # Local food photos
├── supabase/
│   ├── schema.sql             # Database schema
│   └── seed.sql               # Seed data
├── favicon.svg
├── site.webmanifest
└── README.md
```

> Note: This is a single-page restaurant site (no separate `about.html`). Admin login and dashboard share `admin/index.html`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Static HTML / CSS / JS |
| Hosting | Vercel |
| Database & Auth | Supabase |
| CMS | Custom admin panel |

---

## Setup

1. Run `supabase/schema.sql` in the Supabase SQL Editor  
2. Create an admin user under Authentication → Users  
3. Deploy the repo to Vercel (no build step)  
4. Open `/admin/` and sign in  

---

## Contact

- Phone: +971 50 126 2191  
- Instagram: [@meatholicmeats](https://www.instagram.com/meatholicmeats/)  
- Location: Al Zeina, Al Raha Beach, Abu Dhabi  
