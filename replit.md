# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## LuminaWalls App

### Overview
Full-stack wallpaper discovery and AI generation app.

**Frontend**: React + Vite at `artifacts/luminawalls/`
**Backend**: Express API at `artifacts/api-server/`
**DB**: PostgreSQL with Drizzle ORM at `lib/db/`

### Auth: Clerk
- Clerk is provisioned and configured (replaced Replit Auth)
- Server: `@clerk/express` with `clerkMiddleware()` + Clerk proxy middleware mounted at `/__clerk`
- Client: `@clerk/react` with `ClerkProvider` + `Show`, `useUser`, `useClerk` hooks
- Sign-in/sign-up routes: `/sign-in` and `/sign-up` with dark-themed Clerk components
- Favorites API uses `getAuth(req).userId` from Clerk

### Features
- **Masonry grid** wallpaper feed with lazy loading
- **Wallpaper of the Day** hero banner (top featured wallpaper)
- **Trending Now** section (top 6 by download count, numbered)
- **Featured Collection** masonry section
- **Category filtering**: AMOLED, 4K/8K, Anime, Cars, Abstract
- **Search** by title/tags
- **Tag filtering**: click a tag to filter
- **WallpaperModal**: desktop/mobile device preview, Download, Save, Share, tag clicks
- **Share button**: Web Share API with clipboard fallback
- **Favorites**: Clerk-authenticated, saved to PostgreSQL
- **AI Lab**: Fal.ai Flux.1 image generation (FAL_API_KEY needed)
- **PWA**: manifest.webmanifest + iOS meta tags
- **Escape key** to close modal

### DB Schema
- `wallpapers`: id, title, description, imageUrl, thumbnailUrl, downloadUrl, category, resolution, width, height, tags (text[]), downloadCount, isFeatured, isAiGenerated
- `favorites`: id, userId (text, Clerk userId), wallpaperId, createdAt — unique(userId, wallpaperId)

### Seed
- `SEED_VERSION = 20` in `artifacts/api-server/src/lib/seed.ts`
- 20 high-quality Unsplash wallpapers across all 5 categories
- Auto-reseeds if count < 20
