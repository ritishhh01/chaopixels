# Local Setup Guide — ChaoPixels

This guide walks you through running ChaoPixels on your own computer from scratch. Follow every step in order and you'll have the full app running locally.

---

## What You'll Need Before Starting

Make sure you have these installed on your computer:

| Tool | Why You Need It | Download |
|---|---|---|
| **Node.js** (v18 or higher) | Runs the JavaScript code | [nodejs.org](https://nodejs.org) |
| **pnpm** | Package manager for this project | Run `npm install -g pnpm` after Node |
| **Git** | To clone the repository | [git-scm.com](https://git-scm.com) |
| **PostgreSQL** | The database | [postgresql.org](https://postgresql.org) |

You'll also need accounts on these services (all have free tiers):

| Service | Why | Sign Up |
|---|---|---|
| **Clerk** | Handles user sign-in/sign-up | [clerk.com](https://clerk.com) |
| **Fal.ai** | AI image generation | [fal.ai](https://fal.ai) |

---

## Step 1 — Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/ritishhh01/chaopixels.git
cd chaopixels
```

---

## Step 2 — Install All Dependencies

This project uses `pnpm workspaces`, so one command installs everything for both the frontend and backend:

```bash
pnpm install
```

This may take a minute the first time. You'll see packages being downloaded and installed.

---

## Step 3 — Set Up PostgreSQL Database

You need a running PostgreSQL database. Here are two ways to do it:

### Option A — Local PostgreSQL (Recommended)

1. Install PostgreSQL from [postgresql.org](https://postgresql.org/download)
2. Open the PostgreSQL shell (`psql`) and create a database:

```sql
CREATE DATABASE chaopixels;
CREATE USER chaopixels_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chaopixels TO chaopixels_user;
```

3. Your connection string will be:
```
postgresql://chaopixels_user:your_password@localhost:5432/chaopixels
```

### Option B — Free Cloud Database

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both are free and give you a ready-made PostgreSQL connection string in seconds. Just sign up, create a project, and copy the connection string they give you.

---

## Step 4 — Get Your Clerk API Keys

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Click **"Create application"**
3. Name it `ChaoPixels` and enable the sign-in methods you want (Google, Email, Phone)
4. Once created, go to **API Keys** in the left sidebar
5. Copy both keys:
   - **Publishable key** — starts with `pk_test_...`
   - **Secret key** — starts with `sk_test_...`

---

## Step 5 — Get Your Fal.ai API Key

1. Go to [fal.ai](https://fal.ai) and create a free account
2. Go to your dashboard and click **API Keys**
3. Click **"Add key"** and copy it

> The free tier gives you enough credits to test the AI generation feature.

---

## Step 6 — Create the Environment Files

The project needs two `.env` files — one for the backend, one for the frontend.

### Backend environment file

Create the file `artifacts/api-server/.env` and paste this in, replacing the placeholder values:

```env
# Your admin email — this account gets access to the Admin Panel
ADMIN_EMAIL=your-email@example.com

# PostgreSQL connection string from Step 3
DATABASE_URL=postgresql://chaopixels_user:your_password@localhost:5432/chaopixels

# Clerk secret key from Step 4
CLERK_SECRET_KEY=<paste your Clerk secret key here>

# Fal.ai API key from Step 5
FAL_API_KEY=<paste your Fal.ai API key here>

# Generate any random string here (used to sign sessions)
SESSION_SECRET=some-long-random-string-change-this

# Leave these as-is for local development
PRIVATE_OBJECT_DIR=private
PUBLIC_OBJECT_SEARCH_PATHS=public
```

### Frontend environment file

Create the file `artifacts/luminawalls/.env` and paste this in:

```env
# Same admin email as above — used to show/hide the Admin Panel in the UI
VITE_ADMIN_EMAIL=your-email@example.com

# Clerk publishable key from Step 4
VITE_CLERK_PUBLISHABLE_KEY=<paste your Clerk publishable key here>
```

---

## Step 7 — Push the Database Schema

This command creates all the tables in your PostgreSQL database automatically. You don't need to write any SQL — it's all handled for you:

```bash
pnpm --filter @workspace/db run db:push
```

You should see output confirming that tables were created (wallpapers, favorites, etc.).

---

## Step 8 — (Optional) Seed the Database with Sample Wallpapers

To start with some wallpapers already in the gallery instead of an empty grid:

```bash
pnpm --filter @workspace/api-server run dev
```

The API server automatically seeds the database with sample wallpapers the first time it starts up. You'll see a message like `Seeding database...` in the terminal.

---

## Step 9 — Start the Servers

You need two terminal windows open at the same time — one for the backend, one for the frontend.

**Terminal 1 — Start the backend API server:**

```bash
pnpm --filter @workspace/api-server run dev
```

Wait until you see something like:
```
API server running on port 3001
```

**Terminal 2 — Start the frontend:**

```bash
pnpm --filter @workspace/luminawalls run dev
```

Wait until you see something like:
```
  VITE ready in 800ms
  ➜  Local:   http://localhost:5173/
```

---

## Step 10 — Open the App

Open your browser and go to:

```
http://localhost:5173
```

You should see the ChaoPixels home page with the wallpaper gallery!

---

## Verify Everything Works

Go through this quick checklist to make sure all features are working:

- [ ] **Gallery loads** — You can see wallpapers on the home page
- [ ] **Search works** — Type something in the search bar and results filter
- [ ] **Sign in works** — Click "Log in" and sign in with Google or email
- [ ] **Favorites work** — Click the heart on a wallpaper, check the Favorites page
- [ ] **AI Lab works** — Go to AI Lab, type a prompt, click Generate
- [ ] **Admin Panel works** — If your email matches `ADMIN_EMAIL`, go to `/admin`

---

## Troubleshooting

### "Cannot connect to database"
- Make sure PostgreSQL is running on your machine
- Double-check the `DATABASE_URL` in `artifacts/api-server/.env`
- Try connecting manually: `psql postgresql://your_connection_string`

### "Clerk error" on the sign-in page
- Make sure `VITE_CLERK_PUBLISHABLE_KEY` in the frontend `.env` is correct
- Make sure `CLERK_SECRET_KEY` in the backend `.env` is correct
- Both keys must be from the same Clerk application

### "AI generation failed"
- Check that `FAL_API_KEY` is set correctly in the backend `.env`
- Make sure your Fal.ai account has credits (the free tier includes some)

### Admin panel shows "Access Denied"
- Make sure you're signed in with the exact email you put in `ADMIN_EMAIL`
- Make sure `VITE_ADMIN_EMAIL` in the frontend `.env` matches `ADMIN_EMAIL` in the backend `.env`

### Port already in use
- The backend runs on port `3001` and the frontend on port `5173` by default
- If something else is using those ports, stop that process first or change the port in the config

### "Module not found" errors
- Run `pnpm install` again — a dependency might not have installed cleanly
- Make sure you're using Node.js v18 or higher: `node --version`

---

## Project Scripts Reference

| Command | What It Does |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm --filter @workspace/db run db:push` | Sync database schema |
| `pnpm --filter @workspace/api-server run dev` | Start the backend server |
| `pnpm --filter @workspace/luminawalls run dev` | Start the frontend |
| `pnpm --filter @workspace/api-server run typecheck` | Check backend types |
| `pnpm --filter @workspace/luminawalls run typecheck` | Check frontend types |

---

## Default Ports

| Service | Port | URL |
|---|---|---|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Express) | 3001 | http://localhost:3001 |

---

*Made with ❤️ by [chaotechh](https://github.com/ritishhh01)*
