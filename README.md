# Meatholic — Premium Wagyu Restaurant (Abu Dhabi)

Official website and admin panel for **Meatholic**, Al Zeina, Al Raha Beach.

**Live site:** https://meatholicabudhabi.vercel.app  
**Admin:** https://meatholicabudhabi.vercel.app/admin/

---

## Project structure

```
meatholic-website/
├── index.html              # Public restaurant website
├── images/                 # Food & venue photography
├── admin/
│   ├── index.html          # Admin dashboard (login required)
│   ├── admin.css           # Admin styles
│   └── admin.js            # Admin app logic (Supabase)
├── supabase/
│   └── schema.sql          # Database schema (run once in Supabase)
└── README.md
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Static HTML / CSS / JS |
| Hosting | Vercel |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| CMS | Custom admin panel |

---

## Setup

### 1. Supabase
1. Create a project at supabase.com
2. Open **SQL Editor** → run `supabase/schema.sql`
3. **Authentication → Users** → create an admin user (Auto Confirm ON)
4. Copy Project URL and anon key into `admin/index.html`

### 2. Deploy
Connect this repo to Vercel. No build step required.

### 3. Admin access
Open `/admin/` and sign in with the Supabase user you created.

---

## Admin features

- **Reservations** — create, confirm, cancel, WhatsApp guest, export CSV
- **Menu** — add/edit/hide dishes with image URLs and prices
- **Gallery** — manage gallery images
- **Specials** — feasts and promotions
- **Settings** — phone, hours, address, tagline, capacity

---

## Contact

- Phone: +971 50 126 2191
- Instagram: [@meatholicmeats](https://www.instagram.com/meatholicmeats/)
- Location: Al Zeina, Al Raha Beach, Abu Dhabi
