# Repository Guidelines

## Project Structure & Module Organization
This project is a Next.js App Router app.
- `app/`: routes and UI, split by route groups like `(home)` and `(admin)`, plus API routes in `app/api/`.
- `app/components/`: shared UI components.
- `lib/`: reusable utilities. Use `lib/server/` for server-only logic and `lib/validations/` for Zod schemas.
- `db/schema/`: Drizzle ORM table definitions.
- `drizzle/`: SQL migrations and metadata snapshots.
- `emails/`: React Email templates.
- `public/`: static assets.
- `types/`: shared type declarations.

Use the `@/*` import alias from `tsconfig.json` for internal modules.

## Build, Test, and Development Commands
- `pnpm dev`: start local development server with Turbopack.
- `pnpm build`: generate/migrate DB schema, then build the app.
- `pnpm start`: run the production server.
- `pnpm lint`: run Next.js + TypeScript ESLint checks.
- `pnpm format`: format codebase with Prettier.
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push`: manage Drizzle migrations.
- `pnpm db:studio`: open Drizzle Studio.
- `pnpm email:dev`: preview email templates locally.

## Coding Style & Naming Conventions
- TypeScript is `strict`; keep types explicit at module boundaries.
- Prettier rules: 2 spaces, single quotes, no semicolons, trailing commas (`es5`), max width 80.
- ESLint extends `next/core-web-vitals` and `next/typescript`; keep lint clean before opening a PR.
- File names are typically kebab-case (example: `page-title.tsx`, `get-project-form-data.ts`).
- Route folders follow Next.js conventions (`[param]`, `(group)`), and server actions live in `actions.ts` with `'use server'`.

## Testing Guidelines
There is no dedicated test runner configured yet. For now, treat these as required checks:
- `pnpm lint`
- `pnpm build`

For UI or permission-sensitive changes, manually verify affected flows (especially admin CRUD and auth-protected routes).

## Commit & Pull Request Guidelines
Commit history favors short, imperative summaries (English or Korean), commonly with prefixes like `fix`, `add`, `update`, `chore`.
- Keep commits focused on one logical change.
- If schema changes are included, commit `drizzle/` migration files with related code.

PRs should include:
- What changed and why.
- Screenshots/GIFs for UI changes.
- Linked issue(s) and migration/environment notes when applicable.

## Security & Configuration Tips
- Copy `.env.example` to `.env` for local setup; never commit secrets.
- Review permission checks in `lib/server/permission/` when changing admin functionality.
