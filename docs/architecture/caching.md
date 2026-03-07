# Caching Architecture

## Goals

- Keep public `/ko` and `/en` pages fast with explicit, reviewable cache rules.
- Guarantee read-your-own-writes for admin mutations.
- Keep admin reads uncached for correctness and authorization safety.
- Support multi-instance deployments by switching to shared Redis-backed cache storage when `REDIS_URL` is present.

## Next.js 16 Cache Model

This project uses `cacheComponents: true` in [`next.config.ts`](../../next.config.ts).

- Public read models use Cache Components through `use cache: remote`.
- `cacheLife` profiles are registered centrally in [`policy.ts`](../../lib/server/cache/policy.ts).
- `cacheTag` usage is centralized behind [`index.ts`](../../lib/server/cache/index.ts).
- `updateTag` is used for immediate freshness after admin writes.
- `revalidateTag(..., 'max')` is used for broader background revalidation.
- `revalidatePath` is only used as a targeted supplement for localized public routes and `sitemap.xml`.

## Tag Naming

Tag builders live in [`tags.ts`](../../lib/server/cache/tags.ts).

- Locale is always the final segment: `<resource>[:scope][:id]:<locale>`
- List tags use stable scopes such as `project:list:ko`
- Detail tags use stable identifiers such as `project:item:<projectId>:en`
- Generation-scoped tags include the generation slug such as `session:generation:e2e-gen:ko`

Primary tags:

- `home:<locale>`
- `generation:list:<locale>`
- `generation:latest:<locale>`
- `member:list:<locale>`
- `member:generation:<generation>:<locale>`
- `member:item:<memberId>:<locale>`
- `project:list:<locale>`
- `project:generation:<generation>:<locale>`
- `project:item:<projectId>:<locale>`
- `session:list:<locale>`
- `session:generation:<generation>:<locale>`
- `session:item:<sessionId>:<locale>`
- `sitemap:<locale>`

## TTL Policy

TTL values are defined once in [`policy.ts`](../../lib/server/cache/policy.ts).

- `home`: stale 15m, revalidate 1h, expire 1d
- `generationIndex`: stale 1h, revalidate 6h, expire 7d
- `memberDirectory`: stale 1h, revalidate 6h, expire 7d
- `projectList`: stale 1h, revalidate 6h, expire 7d
- `projectDetail`: stale 6h, revalidate 1d, expire 30d
- `sessionList`: stale 15m, revalidate 1h, expire 7d
- `sessionDetail`: stale 15m, revalidate 1h, expire 7d
- `sitemap`: stale 1h, revalidate 6h, expire 7d

Session reads also include an hourly visibility bucket so time-gated visibility changes do not stay stale longer than one hour.

## Public Read Path Rules

Public read queries live under [`lib/server/queries/public`](../../lib/server/queries/public).

- Query modules own DB reads and cache directives.
- Cache scopes receive runtime inputs as function arguments. They do not call `cookies()`, `headers()`, or session APIs internally.
- Route files and components compose cached query functions instead of doing ad hoc DB work.
- `proxy.ts` performs locale routing only. It does not fetch remote data or touch the database.

## Admin Rules

Admin reads must remain uncached.

- Admin fetchers call `unstable_noStore()` explicitly.
- Admin route handlers that are personalized or permission-sensitive return `privateJson(...)` with private `Cache-Control`.
- Auth handlers are forced dynamic where needed.

Admin write flows invalidate through [`invalidation.ts`](../../lib/server/cache/invalidation.ts).

- `invalidateGenerationPublicCache`
- `invalidatePartPublicCache`
- `invalidateMemberPublicCache`
- `invalidateProjectPublicCache`
- `invalidateSessionPublicCache`
- `invalidateAllPublicCache`

Mutation rule of thumb:

1. Update the DB.
2. Call `updateTag` via the invalidation helper for the directly affected read models.
3. Call `revalidateTag(..., 'max')` for broader dependent surfaces.
4. Revalidate localized paths only when route HTML must be eagerly refreshed.
5. Redirect back to the relevant admin screen so the UI renders current data immediately.

## Route Handlers

Next.js 15+ GET route handlers are uncached by default. In this codebase:

- Personalized and admin handlers stay uncached.
- Public caching is handled primarily in the read-query layer instead of relying on implicit route handler behavior.

## Multi-Instance Deployment

Shared-cache support is wired in [`next.config.ts`](../../next.config.ts).

- `cacheHandler` switches ISR and Data Cache storage to Redis when `REDIS_URL` exists.
- `cacheHandlers.remote` backs `use cache: remote` with Redis when `REDIS_URL` exists.
- `cacheMaxMemorySize: 0` disables local in-memory duplication in shared-cache production mode.
- Without `REDIS_URL`, development falls back to Next.js defaults and local memory.

Redis handlers live in:

- [`incremental-redis-cache-handler.cjs`](../../lib/server/cache/handlers/incremental-redis-cache-handler.cjs)
- [`remote-cache-handler.cjs`](../../lib/server/cache/handlers/remote-cache-handler.cjs)
- [`redis-shared.cjs`](../../lib/server/cache/handlers/redis-shared.cjs)

## Environment Validation

Server env access is centralized in [`env.ts`](../../lib/server/env.ts).

- Feature-specific getters validate only the variables needed by that feature.
- Redis activation is optional and validated through `getRedisEnv()`.
- Missing required variables fail fast with explicit environment-specific messages.

## Verification

Regression coverage was added in:

- Unit tests for tag builders and invalidation utilities
- Admin action tests for tag invalidation after create, update, and delete flows
- Playwright coverage for admin update flows and public cache invalidation behavior
