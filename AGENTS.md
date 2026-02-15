# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js App Router project.
- `app/`: routes and UI, including route groups like `(home)` and `(admin)`, plus API handlers in `app/api/`.
- `app/components/`: shared UI components grouped by feature (`admin`, `auth`, `header`, `svg`).
- `lib/`: reusable logic. Put server-only code in `lib/server/` and Zod schemas in `lib/validations/`.
- `db/schema/`: Drizzle table definitions. `drizzle/`: generated migrations and metadata.
- `tests/`: Vitest unit/component tests and Playwright end-to-end tests (`tests/e2e/`).
- `public/`, `emails/`, and `types/`: static assets, email templates, and shared types.

Use the `@/*` alias from `tsconfig.json` for internal imports.

## Build, Test, and Development Commands
- `pnpm dev`: run local dev server with Turbopack.
- `pnpm build`: generate + migrate DB schema, then build Next.js for production.
- `pnpm start`: run production server.
- `pnpm lint` / `pnpm lint:fix`: run or auto-fix ESLint issues.
- `pnpm format`: format codebase with Prettier.
- `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`: run Vitest suites.
- `pnpm test:e2e`: run Playwright tests (`pnpm test:e2e:install` for first-time browser setup).
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`: Drizzle workflows.

## Coding Style & Naming Conventions
- TypeScript `strict` is enabled; keep types explicit at module boundaries.
- Prettier rules: 2 spaces, single quotes, no semicolons, trailing commas (`es5`), max width 80.
- ESLint extends `next/core-web-vitals` and `next/typescript`; keep lint clean before PRs.
- Prefer kebab-case file names (`format-user-name.ts`), and follow Next route naming (`[param]`, `(group)`).
- Keep server actions in `actions.ts` with `'use server'`.

## Testing Guidelines
- Unit/component tests: `*.test.ts` / `*.test.tsx`.
- E2E tests: `*.spec.ts` under `tests/e2e/`.
- Minimum pre-PR checks: `pnpm lint`, `pnpm test`, and `pnpm build`.
- Manually verify auth and admin permission-sensitive flows after related changes.

## Commit & Pull Request Guidelines
- Commit messages are typically short and imperative; common prefixes include `fix`, `add`, `update`, and `chore`.
- Keep each commit focused on a single logical change.
- PRs should include: what changed and why, linked issue(s), screenshots/GIFs for UI changes, and migration notes for DB updates.

## Security & Configuration Tips
- Copy `.env.example` to `.env` for local setup and never commit secrets.
- Re-check permission logic in `lib/server/permission/` when changing admin behavior.
