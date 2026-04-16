# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Run all apps in dev mode (Turborepo)
pnpm dev

# Run a single app
pnpm --filter @nomal-world/user dev    # port 3000
pnpm --filter @nomal-world/host dev    # port 3001
pnpm --filter @nomal-world/admin dev   # port 3002

# Build
pnpm build
pnpm --filter @nomal-world/admin build

# Lint
pnpm lint
```

There are no tests configured yet.

## Environment Variables

Copy `.env.example` to `.env` at the repo root and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

All three apps share these env vars via Turborepo's `globalEnv` in `turbo.json`.

## Architecture

This is a **pnpm + Turborepo monorepo** with three Next.js 14 apps and two shared packages.

### Apps

| App | Port | Audience | Auth |
|-----|------|----------|------|
| `apps/user` | 3000 | Public users browsing gatherings | None (public) |
| `apps/host` | 3001 | Hosts creating/editing gatherings | Required (any authenticated user) |
| `apps/admin` | 3002 | Admins managing all content | Required (role = 'admin') |

All apps use `transpilePackages: ["@nomal-world/ui", "@nomal-world/db"]` in their `next.config.js` to consume shared packages directly from TypeScript source.

### Shared Packages

**`packages/db`** — Supabase client factory and TypeScript types.
- `@nomal-world/db/client` → `createClient()` for browser-side (uses anon key)
- `@nomal-world/db/server` → `createServerClient()` for server components/middleware (uses SSR cookie handling via `@supabase/ssr`)
- `@nomal-world/db/types` → All DB types: `Gathering`, `Category`, `Profile`, `GatheringWithCategory`, `EditorJSContent`

**`packages/ui`** — Shared React components consumed by all apps.
- Primitive components: `Button`, `Card`, `Badge`, `Input`, `Textarea`
- Domain components: `GatheringCard`, `GatheringDetail`, `ContentRenderer`
- Utilities: `cn()`, `formatCost()`, `formatDate()`

**`packages/config`** — Shared Tailwind and TypeScript base configs.

### Data Model

The core entity is a **Gathering** (모임) with status `draft | published | closed`. Gatherings belong to a **Profile** (host) and optionally a **Category**. Rich text content is stored as JSON (`EditorJSContent`) using Editor.js blocks.

Supabase RLS enforces:
- Public can only read `published` gatherings
- Hosts can CRUD their own gatherings
- Admins can CRUD all gatherings and read all profiles

### Auth Flow

Auth is handled via Supabase Auth + `@supabase/ssr`. Each authenticated app (`host`, `admin`) has a `middleware.ts` that redirects unauthenticated users to `/login` and authenticated users away from `/login`. The `user` app has no auth middleware — it reads only public data.

### Content Editing

The `host` app uses **Editor.js** (`@editorjs/*` packages) for rich text gathering descriptions. The `ContentEditor` component is loaded with `dynamic(..., { ssr: false })` because Editor.js is browser-only. The rendered output is handled by `ContentRenderer` in `@nomal-world/ui`.

### Storage

Supabase Storage bucket `gathering-images` holds thumbnails. The bucket must be created manually in the Supabase dashboard (the SQL migration includes a commented-out insert). Images are served via public URLs from `*.supabase.co`.
