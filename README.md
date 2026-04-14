# The Senator's Wife Archives

An interactive narrative map for *The Senator's Wife* book series by Jen Lyon.  
Readers explore locations, unlock evidence fragments, follow the S-curve story timeline, and submit witness theories.

**Stack:** Plain HTML / CSS / JS → Supabase (Postgres) → GitHub Pages

---

## File Structure

```
senators-wife-archives/
├── index.html                      ← HTML shell
├── css/
│   └── styles.css                  ← All styling
├── js/
│   ├── config.js                   ← Supabase client, theme presets, STATE
│   ├── api.js                      ← All Supabase read/write functions
│   ├── admin.js                    ← Admin toggle, modal, CRUD editors
│   ├── render.js                   ← All view render functions
│   └── main.js                     ← Entry point
├── sql/
│   └── schema.sql                  ← Run once in Supabase SQL Editor
└── .github/
    └── workflows/
        └── deploy.yml              ← Auto-deploy to GitHub Pages on push
```

### Script load order (enforced in index.html)
```
Supabase CDN → config.js → api.js → admin.js → render.js → main.js
```

---

## First-Time Setup

### 1 — Supabase: run the schema

1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
2. Open your project → **SQL Editor**
3. Paste the entire contents of `sql/schema.sql` and click **Run**

This creates all tables, seeds the initial data, and sets up Row Level Security policies.

### 2 — Change the admin password

Open `js/config.js` and update the default in STATE (or change it via the admin panel after first login — it saves to Supabase):

```js
adminPassword: 'your-new-password',
```

### 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 4 — Enable GitHub Pages

1. Go to your repo on GitHub
2. **Settings → Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow in `.github/workflows/deploy.yml` will auto-deploy on every push to `main`

Your site will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

---

## Supabase Credentials

Your credentials live in `js/config.js`:

```js
const SUPABASE_URL = 'https://uoeeoxcljahnnbyxrcwi.supabase.co';
const SUPABASE_KEY = 'eyJ...';   // anon/public key — safe to expose client-side
```

The anon key is safe to commit — it is intentionally public. Row Level Security policies control what it can access.

---

## Database Tables

| Table | Description |
|---|---|
| `site_settings` | Single-row config (title, author, week, passwords) |
| `books` | Book/series entries with theme keys and accent colors |
| `locations` | Archive locations (Washington D.C., San Francisco, etc.) |
| `fragments` | Evidence fragments belonging to a location |
| `witnesses` | Reader theories attached to a location |
| `timeline_stops` | Story events on the S-curve timeline |
| `timeline_details` | Detail fragments attached to a timeline stop |

---

## Admin Panel

Click the **◆ Admin** button (top-right of the site) and enter the password.

From the admin bar you can:
- Edit site info, author, subtitle, week progress, background color, footer
- Add / edit / delete locations, fragments, witnesses
- Add / edit / delete books and their timeline entries
- Promote a location fragment to a timeline detail
- Upload images to fragments (stored as base64 in Supabase; for large images consider Supabase Storage)

All changes save immediately to Supabase and reload the page state.

---

## Customizing Themes

Each book has a theme that changes the site's color palette when browsing that book's timeline section. Edit `BOOK_THEME_PRESETS` in `js/config.js` to add or modify themes, then update the `theme_key` on the book via the admin panel.

---

## Deployment Notes

- No build step needed — this is a fully static site
- GitHub Actions deploys automatically on every push to `main`
- Supabase free tier supports up to 500 MB storage and 2 GB bandwidth/month, which is more than sufficient for this use case
- If you rename your default branch from `main` to something else, update line 5 of `.github/workflows/deploy.yml`
