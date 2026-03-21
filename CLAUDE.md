# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GDGoC Yonsei official website — a full-stack Next.js 16 (App Router) application with PostgreSQL/Drizzle ORM, NextAuth.js v5 authentication, and Cloudflare R2 storage. Live at https://gdgoc.yonsei.ac.kr.

## Commands

```bash
pnpm dev                  # Dev server with Turbopack
pnpm build                # DB generate + migrate + Next.js build
pnpm lint                 # ESLint
pnpm lint:fix             # ESLint auto-fix
pnpm format               # Prettier
pnpm test                 # Vitest (unit + component)
pnpm test:watch           # Vitest watch mode
pnpm test:coverage        # Vitest with coverage
pnpm test:e2e             # Playwright (install browsers first: pnpm test:e2e:install)
pnpm db:generate           # Generate Drizzle migrations
pnpm db:migrate            # Apply migrations
pnpm db:push               # Generate + migrate
pnpm db:studio             # Drizzle Studio (visual DB browser)
```

Pre-PR checks: `pnpm lint`, `pnpm test`, `pnpm build`.

## Code Style

- Prettier: single quotes, no semicolons, 2 spaces, trailing commas (es5), max 80 chars, LF line endings
- Kebab-case file names (`format-user-name.ts`)
- TypeScript strict mode; explicit types at module boundaries
- Use `@/*` path alias for all internal imports
- Server actions go in `actions.ts` files with `'use server'` pragma
- Commit messages: short, imperative, prefixed with `fix`, `add`, `update`, `chore`

## Architecture

### Route Groups
- `app/(home)/[lang]/` — public pages with locale parameter (en, ko)
- `app/(admin)/` — admin pages (auth, booking, projects, members)
- `app/api/` — API routes (auth, admin image uploads, member management)

### Server Code Separation
`lib/server/` contains all server-only logic, enforced by ESLint (cannot import from `app/`):
- `actions/` — server actions (e.g., booking CRUD)
- `queries/public/` — cached data fetching
- `cache/` — cache policies, tags, invalidation (locale-scoped tags like `project:item:uuid:ko`)
- `permission/` — role-based access control (UNVERIFIED → MEMBER → CORE → LEAD, plus ALUMNUS)
- `services/` — business logic

### Database
- Schema definitions in `db/schema/`, client instance in `db/index.ts`
- Drizzle ORM with PostgreSQL; migrations in `drizzle/`
- Key tables: users (with roles), projects, sessions, booking_requests, generations, parts

### Auth
- NextAuth.js v5 (beta) with Drizzle adapter, configured in `auth.ts`
- Providers: GitHub OAuth, Google OAuth, WebAuthn/Passkeys
- Database-backed sessions; permission checks in `lib/server/permission/`

### i18n
- Path-based routing via `[lang]` parameter (en, ko)
- Admin locale via cookie (`ADMIN_LOCALE_COOKIE`)
- `proxy.ts` middleware handles locale detection and redirects

### Caching
- Next.js ISR with granular cache life policies per content type (`lib/server/cache/policy.ts`)
- Optional Redis distributed cache (enabled when `REDIS_URL` is set)
- Cache tags are locale-scoped; invalidation in `lib/server/cache/invalidation.ts`
- Architecture doc: `docs/architecture/caching.md`

### Storage
- Cloudflare R2 via AWS SDK S3 client (`lib/server/r2-client.ts`)
- Presigned URLs for secure uploads (`lib/server/get-pre-signed-url.ts`)

### Testing
- Unit/component: `tests/unit/*.test.ts`, `tests/component/*.test.tsx` (Vitest + Testing Library + JSDOM)
- E2E: `tests/e2e/*.spec.ts` (Playwright, Chromium only, single worker)
- `server-only` module is mocked in Vitest config

## Environment Setup

Copy `.env.example` to `.env` for local development. Required vars include `AUTH_DRIZZLE_URL`, `AUTH_SECRET`, OAuth credentials, R2 keys, and `RESEND_API_KEY`. `REDIS_URL` is optional.
