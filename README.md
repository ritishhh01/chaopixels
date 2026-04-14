# ChaoPixels 🎨

> **Discover, favorite, download, and AI-generate stunning 4K/8K wallpapers — all in one place.**

ChaoPixels is a full-stack wallpaper app where you can browse a curated gallery of high-resolution wallpapers, save your favorites, download them instantly, and even generate brand-new wallpapers using AI just by typing a description.

**Made with ❤️ by [chaotechh](https://github.com/ritishhh01)**

---

## What Does ChaoPixels Do?

Think of it like a Pinterest or Unsplash — but specifically for wallpapers, with a built-in AI that can create wallpapers for you on demand.

Here's the short version of what users can do:

- **Browse** a beautiful masonry grid of wallpapers (like a Pinterest layout)
- **Search & filter** by category, resolution, or whether it was AI-generated
- **Click any wallpaper** to see it full-screen with details and a download button
- **Save favorites** with a heart button — they're stored to your account
- **Generate wallpapers with AI** — type a prompt like *"a purple galaxy over a neon city"* and the AI creates it
- **Sign in** using Google, email, or phone number
- **Install as an app** on your phone or desktop (it works like a native app)

---

## How It Works — The Complete Flow

### 1. You Open the App
The home page loads a masonry grid of wallpapers pulled from the database. There's a search bar at the top and category filters (Nature, Abstract, Space, etc.) to narrow things down.

### 2. You Browse & Click
Clicking any wallpaper opens a full-screen modal with:
- The wallpaper in full resolution
- Title, category, resolution info
- A **Download** button
- A **Heart** button to save it

### 3. You Sign In (Optional — but needed for Favorites & AI)
Signing in is handled by Clerk — you can use:
- Google account (one click)
- Email + password
- Phone number + OTP

Once signed in, your favorites and session are saved across devices.

### 4. You Save Favorites
Clicking the heart on any wallpaper saves it to your account. Visit the **Favorites** page to see all your saved wallpapers anytime.

### 5. You Generate a Wallpaper with AI
Go to the **AI Lab** page. Type a description of the wallpaper you want — for example:
> *"a serene Japanese cherry blossom garden at dusk, ultra realistic, 8K"*

Hit **Generate** and within seconds, Fal.ai's Flux.1 model creates a unique wallpaper for you. You can then download it directly.

### 6. Admin Uploads Wallpapers
The site admin (`ritish981@gmail.com`) has access to an **Admin Panel** where they can:
- Upload wallpapers one by one (via URL or file upload)
- Do a **bulk import** — drag and drop multiple images at once, set titles and categories, and upload them all in one go
- Manage existing wallpapers

---

## Features At a Glance

| Feature | Description |
|---|---|
| 🖼️ Masonry Grid | Pinterest-style layout that fits wallpapers of different sizes naturally |
| 🔍 Search & Filter | Search by keyword, filter by category and resolution |
| ❤️ Favorites | Save any wallpaper to your personal collection |
| ⬇️ Downloads | One-click download of full-resolution wallpapers |
| 🤖 AI Generation | Generate wallpapers from text using Fal.ai (Flux.1 Schnell model) |
| 🔐 Authentication | Sign in with Google, email, or phone via Clerk |
| 📱 PWA | Install ChaoPixels on your phone like a native app |
| 🌑 Dark UI | Permanently dark, midnight glassmorphism design — no light mode |
| 👑 Admin Panel | Upload single or bulk wallpapers, manage the gallery |
| 🔒 Secure Uploads | Images stored in Replit Object Storage, not on any public server |

---

## Technologies Used

Here's every tool and technology powering ChaoPixels, explained simply:

### Frontend (What You See)
| Technology | What It Does |
|---|---|
| **React** | The JavaScript library used to build all the UI components |
| **Vite** | The build tool — makes the app load super fast in development and production |
| **Tailwind CSS** | Handles all the styling (colors, spacing, layout) with utility classes |
| **Framer Motion** | Powers smooth animations and transitions |
| **Wouter** | Handles navigation between pages (Home, AI Lab, Favorites, etc.) |
| **TanStack Query** | Manages fetching data from the server and caching it efficiently |
| **Radix UI** | Accessible, unstyled UI components (modals, dropdowns, etc.) |
| **Lucide React** | The icon library used throughout the app |
| **Clerk (React)** | Handles the entire sign-in/sign-up flow on the frontend |

### Backend (The Server)
| Technology | What It Does |
|---|---|
| **Node.js + Express** | The web server that handles all API requests |
| **TypeScript** | Adds type safety to both frontend and backend code |
| **Drizzle ORM** | Used to interact with the PostgreSQL database in a clean, type-safe way |
| **PostgreSQL** | The database where all wallpapers, users, and favorites are stored |
| **Clerk (Express)** | Verifies user identity on the server side |
| **Fal.ai (Flux.1 Schnell)** | The AI model that generates wallpapers from text prompts |
| **Replit Object Storage** | Stores all uploaded wallpaper image files securely |

### Infrastructure & Tooling
| Technology | What It Does |
|---|---|
| **pnpm workspaces** | Manages the monorepo — frontend, backend, and shared libraries all in one repo |
| **ESBuild** | Bundles the backend code fast |
| **Zod** | Validates data shapes (API request/response types) on both ends |

---

## Project Structure

```
chaopixels/
├── artifacts/
│   ├── luminawalls/          ← Frontend (React + Vite app)
│   │   └── src/
│   │       ├── pages/        ← Home, AI Lab, Favorites, Admin, Wallpaper Detail
│   │       └── components/   ← Header, Footer, WallpaperCard, WallpaperModal, etc.
│   │
│   └── api-server/           ← Backend (Express API)
│       └── src/
│           ├── routes/       ← wallpapers, favorites, generate, storage, health
│           ├── middlewares/  ← Clerk auth verification
│           └── lib/          ← DB connection, object storage, seeding
│
├── lib/
│   ├── db/                   ← Database schema (Drizzle ORM)
│   ├── api-zod/              ← Shared API type definitions
│   └── object-storage-web/   ← File upload helpers
│
└── scripts/                  ← Utility scripts
```

---

## Pages

| Page | URL | What It Does |
|---|---|---|
| Home / Discover | `/` | Main wallpaper gallery with search and filters |
| AI Lab | `/ai-lab` | Generate wallpapers using AI |
| Favorites | `/favorites` | Your saved wallpapers (requires sign-in) |
| Wallpaper Detail | `/wallpaper/:id` | Full-screen view of a single wallpaper |
| Admin Panel | `/admin` | Upload and manage wallpapers (admin only) |
| Sign In | `/sign-in` | Clerk-powered sign-in page |

---

## API Endpoints

The backend exposes a clean REST API:

| Method | Endpoint | What It Does |
|---|---|---|
| `GET` | `/api/wallpapers` | Get all wallpapers (supports search & filter params) |
| `GET` | `/api/wallpapers/:id` | Get a single wallpaper by ID |
| `POST` | `/api/wallpapers` | Create a new wallpaper (admin only) |
| `DELETE` | `/api/wallpapers/:id` | Delete a wallpaper (admin only) |
| `GET` | `/api/favorites` | Get your saved favorites (requires sign-in) |
| `POST` | `/api/favorites` | Save a wallpaper to favorites |
| `DELETE` | `/api/favorites/:id` | Remove from favorites |
| `POST` | `/api/generate` | Generate a wallpaper using Fal.ai |
| `POST` | `/api/storage/uploads/request-url` | Get a signed upload URL (admin only) |
| `GET` | `/api/proxy-download` | Proxy download so files download with the right filename |
| `GET` | `/api/health` | Health check for monitoring |

---

## How to Run Locally

For a full step-by-step walkthrough — including database setup, getting API keys, environment variables, and troubleshooting — see the dedicated setup guide:

### 👉 [SETUP.md — Complete Local Setup Guide](./SETUP.md)

**Quick summary:**
1. Clone the repo and run `pnpm install`
2. Set up a PostgreSQL database
3. Get free API keys from [Clerk](https://clerk.com) and [Fal.ai](https://fal.ai)
4. Create `.env` files for both the API server and frontend
5. Run `pnpm --filter @workspace/db run db:push` to create the tables
6. Start the backend: `pnpm --filter @workspace/api-server run dev`
7. Start the frontend: `pnpm --filter @workspace/luminawalls run dev`
8. Open `http://localhost:5173`

---

## Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `ADMIN_EMAIL` | API Server | The email address that gets admin access |
| `DATABASE_URL` | API Server | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | API Server | Clerk secret key for server-side auth |
| `FAL_API_KEY` | API Server | Fal.ai API key for AI image generation |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | API Server | Replit Object Storage bucket ID |
| `SESSION_SECRET` | API Server | Random string for session signing |
| `VITE_ADMIN_EMAIL` | Frontend | Same admin email (used to show/hide admin UI) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk publishable key for frontend auth |

---

## The AI Generation Flow

Here's exactly what happens when you type a prompt in AI Lab:

```
You type a prompt
       ↓
Frontend sends it to POST /api/generate
       ↓
API Server calls Fal.ai with your prompt
(using the Flux.1 Schnell model)
       ↓
Fal.ai generates the image (takes ~5-15 seconds)
       ↓
API returns the image URL to the frontend
       ↓
The generated wallpaper appears on screen
       ↓
You can download it or import it into the gallery
```

---

## The Upload Flow (Admin)

```
Admin logs in with ritish981@gmail.com
       ↓
Visits /admin
       ↓
Drags images into the Bulk Import zone
       ↓
Frontend requests a signed upload URL from the server
       ↓
Image is uploaded directly to Replit Object Storage
       ↓
Frontend sends wallpaper metadata (title, category, etc.) to POST /api/wallpapers
       ↓
Wallpaper is saved in PostgreSQL
       ↓
It appears in the gallery for all users instantly
```

---

## Design Philosophy

ChaoPixels uses a **midnight dark glassmorphism** design — meaning:
- Deep near-black backgrounds (`#060608`)
- Glass-like cards with subtle transparency and blur
- Neon violet accents (`#7C3AFF`)
- Smooth animations on hover and transitions between pages
- No light mode — permanently dark, like looking at wallpapers should be

---

## License

MIT — feel free to fork, modify, and build on it.

---

*Made with ❤️ by [chaotechh](https://github.com/ritishhh01)*
