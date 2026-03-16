# Peak Compliance Tracker

A full-stack web app for tracking documents, credentials, and certifications for clients, employees, and contractors. Built with React + Vite (frontend) and Node.js + Express (backend), backed by Supabase (PostgreSQL + Auth).

---

## Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In **Database → SQL Editor**, run the full contents of `supabase/schema.sql`.
3. In **Authentication → Providers**, ensure **Email** is enabled.
4. Collect these values from **Project Settings → API**:
   - Project URL (e.g. `https://xxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key

### 2. Create the First Admin User

1. Go to **Authentication → Users → Invite user** in the Supabase dashboard, or use:
   ```
   Authentication → Users → Add user
   ```
2. After the user is created, copy their UUID from the users table.
3. In **SQL Editor**, run:
   ```sql
   INSERT INTO app_users (id, full_name, role, is_active)
   VALUES ('<paste-uuid-here>', 'Your Name', 'admin', true);
   ```

### 3. Configure Environment Variables

**Server** — copy `server/.env.example` to `server/.env`:
```
PORT=3001
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Client** — copy `client/.env.example` to `client/.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### 4. Install Dependencies

```bash
npm run install:all
```

### 5. Run the App

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## Project Structure

```
PeakComplianceTracker/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── contexts/       # AuthContext
│       ├── lib/            # Supabase client, Axios instance
│       ├── components/     # UI primitives and layout
│       └── pages/          # Page-level components
├── server/                 # Express API
│   ├── config/             # Supabase client (service role)
│   ├── middleware/         # auth, requireAdmin, validate
│   ├── routes/             # Route definitions
│   ├── controllers/        # Request handlers
│   └── services/           # Business logic (expiration, dashboard)
└── supabase/
    └── schema.sql          # Full database schema + seed data
```

---

## Deployment

### Railway / Render

1. Push to GitHub.
2. Create a new service pointing to the repo.
3. Set root directory to `server/`, build command `npm install`, start command `node index.js`.
4. Add all environment variables from `server/.env.example`.

### Frontend (Vercel / Netlify)

1. Create a new project pointing to the `client/` directory.
2. Build command: `npm run build`, output: `dist/`.
3. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` (pointing to your deployed server).

---

## User Roles

| Role   | Permissions |
|--------|-------------|
| Admin  | Full CRUD on all data; manage users and document types |
| Viewer | Read-only access to all people and documents |

No self-registration — admins create accounts via the Users page or Supabase dashboard.
