# Next.js 16.3 Performance Report

Date: 2026-08-23  
Compared revisions: working tree before and after this optimization pass  
Next.js: 16.3.1 before, 16.3.2 after

## Executive summary

The public site now uses route-level App Shells with narrow streamed regions,
shared partial prefetches for high-cardinality detail links, request-local plus
Redis-backed cache reuse, and server-rendered gallery images controlled by a
small client leaf. Every previous `instant = false` escape hatch was removed.

The most important measured changes were:

- Desktop session-generation RSC bytes: 97,271 -> 47,595 (-51.1%).
- Desktop session-generation requests: 66 -> 59.
- Mobile member-generation JS: 214,301 -> 154,918 encoded bytes (-27.7%).
- Mobile member-index interaction sample: 448 ms -> 88 ms.
- Desktop project-generation TBT: 2,057 ms -> 569 ms (-72.3%).
- Warm production build: 73.52 s -> 41.12 s (-44.1%).
- Seven production `instant()` navigation cases and back navigation passed.
- Invalid public generation/detail URLs now return true HTTP 404 responses;
  the baseline returned streamed HTTP 200 soft-404 responses.

All 22 route/profile samples pass the checked JS, RSC, request, prefetch, LCP,
CLS, interaction-latency, TBT, and relative-regression budgets.

## Measurement method and limits

The browser measurements use a production `next start` build, Chromium, 4x CPU
slowdown, 150 ms request latency, 200,000 B/s download, 93,750 B/s upload, and a
3 second settle period. Each row is one matched lab run, not field data. The
interaction metric is an Event Timing sample from opening the mobile menu; it
is an INP approximation, not a field INP distribution.

The measurement source and budget enforcement live in:

- `scripts/measure-next-performance.mjs`
- `scripts/check-performance-budget.mjs`
- `scripts/verify-instant-navigation.mjs`

Redis was not configured in the measurement environment, so exact remote Redis
operation counts were unavailable. PostgreSQL statement logging was also not
available. Cache/DB traffic conclusions below distinguish measured network/RSC
effects from architectural operation-count effects.

## Baseline architecture

Before the implementation:

- Cache Components, Partial Prefetching, React Compiler, Rust React Compiler,
  and Turbopack filesystem caching were already enabled.
- Public reads already used `use cache: remote`, named `cacheLife` profiles,
  precise tags, and Redis-capable cache handlers.
- Locale was included in public cache keys even though the query results carried
  both Korean and English fields, creating duplicate Redis entries.
- Public generation-index pages awaited `params` and their remote read at page
  scope, so little route-specific UI could commit independently.
- Every project/session card forced `prefetch={true}`, multiplying URL-specific
  runtime prefetch work across large lists.
- The footer automatically prefetched the client-heavy Freshman OT route when
  it entered the mobile viewport.
- Gallery image markup and its controller lived in one Client Component.
- Member directory reads selected the complete user row, including fields not
  rendered publicly.
- Invalid dynamic public URLs returned 200 with not-found UI under Cache
  Components.

## Architecture changes

### Rendering and navigation

- Added a reusable bilingual `GenerationIndexShell` containing the real page
  title and a dimensionally stable, meaningful fallback.
- Kept locale-independent shell copy outside URL-data awaits with server-only
  `LocalizedText`; CSS selects the correct language from `<html lang>` without
  adding client JavaScript.
- Moved generation lists, project grids, session lists, and member directories
  behind the smallest useful Suspense boundaries.
- Kept persistent Header behavior unchanged: the server navigation fallback
  remains real, usable links while `usePathname()` resolves behind Suspense.
- Calendar rendering no longer awaits `params` at page scope.
- Added `content-visibility: auto` containment to below-the-fold homepage and
  member sections while retaining their server DOM and accessibility tree.

### Correct 404 status with instant shells

Next.js 16.3 documents that Cache Components streams a static shell for dynamic
routes; a later `notFound()` can only produce a soft 404. `instant = false` opts
out of validation feedback but does not buffer the HTTP response.

The solution is a direct-document Proxy guard:

- Generation pages perform a minimal generation existence lookup.
- Project details validate the UUID and project/generation relationship.
- Session details validate UUID, generation relationship, public visibility,
  and the same hourly visibility bucket used by the page query.
- Missing resources receive an accessible, localized, noindex HTML response
  with status 404 before React rendering starts.
- `text/x-component` requests bypass the guard, so App Shell prefetches and RSC
  navigations do not start speculative PostgreSQL validation queries.
- Pages retain their own validation for client-navigation correctness.

All `export const instant = false` occurrences were removed. Direct checks for
seven invalid generation/malformed-ID/unknown-ID cases return 404; valid
generation routes return 200.

### Cache and query architecture

- Bilingual public read models now have one deterministic cache entry rather
  than one entry per locale. Both locale tags remain attached, preserving every
  existing mutation invalidation path.
- React `cache()` wraps ordinary request-local loaders around the remote cache
  boundary, deduplicating page/metadata reads without becoming a second
  cross-request cache.
- Invalid UUIDs are rejected before the remote cache boundary.
- Session list/detail entries expire after two hours. Their keys include an
  hourly visibility bucket, so the previous seven-day expiry retained dead,
  unreachable buckets.
- Member, generation, project-list, project-detail, session-list, and
  session-detail queries now explicitly select rendered fields.
- Public member queries no longer fetch telephone, student ID, role, or auth
  state.
- Existing `updateTag`, `revalidateTag`, and targeted `revalidatePath`
  invalidation behavior was preserved.

Architectural cache impact:

- Bilingual Redis key cardinality is halved for the audited public read models.
- Session visibility versions are bounded to roughly two live hourly buckets
  instead of up to seven days of dead versions.
- A valid direct dynamic document incurs one additional minimal Proxy existence
  query to guarantee status correctness. Client transitions and prefetches incur
  no Proxy query. This correctness cost is visible in some TTFB samples (for
  example mobile project detail 18.5 -> 29.2 ms) but remains far below the LCP
  budget.

### Client and assets

- `ImageSliderGallery` is now a Server Component that renders `next/image`
  markup. `ImageSliderController` is the small state/observer/button client
  leaf.
- Only the first full gallery image uses `preload`; remaining full images and
  thumbnails stay lazy.
- Project, session, and member `sizes` values now match their responsive layout
  more closely.
- The optimized image cache TTL is 31 days. Admin R2 object keys are UUID-based,
  so changed uploads receive new URLs.
- React Compiler and the Rust compiler path remained enabled and passed the
  complete unit/type/build/browser checks.
- Passkey success navigation now uses the App Router instead of a forced
  document reload.
- Public client-reference manifests contain no admin component/fetcher modules.

## Next.js 16.3 capabilities adopted or validated

- Upgraded to stable Next.js, `@next/playwright`, `@next/third-parties`, and
  `eslint-config-next` 16.3.2.
- Cache Components and Partial Prerendering.
- Partial Prefetching with one shared App Shell per dynamic destination route.
- Runtime prefetch only for low-cardinality, high-intent generation links.
- `instant()` production regression testing via conditionally exposed testing
  API.
- Fine-grained Suspense streaming and reusable route App Shells.
- `use cache: remote`, `cacheLife`, `cacheTag`, `updateTag`, and
  `revalidateTag(..., 'max')`.
- React Server Components and reduced client ownership of image markup.
- React Compiler plus Turbopack Rust React Compiler.
- Turbopack production builds with filesystem cache.
- Current `next/image` `preload` and responsive `sizes` behavior.

`use cache: private` was not introduced because no audited public read is both
user-specific and safely browser-cacheable. `io()` was not added because the
partial-prefetch path no longer starts native DB validation work and public DB
reads already sit behind remote cache boundaries. Existing request-time admin
I/O remains request-time.

## Route-by-route result

| Route                                      | Before                                     | After                                          | Instant shell                                         | Streaming                        | Remaining blocker               |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------- | -------------------------------- | ------------------------------- |
| `/[lang]`                                  | Known locales prerendered                  | Same; below-fold containment                   | Existing full homepage                                | N/A                              | None                            |
| `/[lang]/project`                          | Page-scope params + generation read        | Reusable localized generation shell            | Header, title, description, skeleton                  | Generation cards                 | None                            |
| `/[lang]/project/[generation]`             | Full runtime prefetch per linked URL       | Low-cardinality intent prefetch; grid boundary | Header, page frame, generation controls/grid skeleton | Project grid                     | None                            |
| `/[lang]/project/[generation]/[projectId]` | Per-card full runtime prefetch; soft 404   | Shared detail shell; Proxy true 404            | Header and detail skeleton                            | Cached detail content            | None                            |
| `/[lang]/session`                          | Page-scope params + generation read        | Reusable localized generation shell            | Header, title, description, skeleton                  | Generation cards                 | None                            |
| `/[lang]/session/[generation]`             | Full runtime detail prefetches             | Shared detail prefetch; visibility isolated    | Header, title, generation controls                    | Visibility-bucketed session list | None                            |
| `/[lang]/session/[generation]/[sessionId]` | Per-card full runtime prefetch; soft 404   | Shared detail shell; Proxy true 404            | Header and detail skeleton                            | Cached visible session           | None                            |
| `/[lang]/member`                           | Page-scope params + generation read        | Reusable localized generation shell            | Header, title, description, skeleton                  | Generation cards                 | None                            |
| `/[lang]/member/[generation]`              | Full user rows                             | Narrow user fields; directory boundary         | Header, title, generation controls                    | Member directory                 | None                            |
| `/[lang]/calendar`                         | Awaited locale at page scope               | Static bilingual page heading                  | Header, heading, iframe frame                         | External calendar                | Third-party iframe cost         |
| `/[lang]/admin/**`                         | Request-time auth and uncached admin reads | Same; compiler validated, bundles isolated     | Admin-specific                                        | Request-time                     | Intentionally correctness-first |

The footer language switch remains a root-layout MPA because the destination
must change the server-rendered `<html lang>` attribute. Both locale roots have
normal E2E coverage; this transition is intentionally not represented as a
same-root instant navigation.

## Client bundle and RSC results

Values are encoded response-body bytes observed by Chromium.

| Route/profile              | JS before | JS after | RSC before | RSC after |
| -------------------------- | --------: | -------: | ---------: | --------: |
| Desktop `/ko`              |   148,079 |  149,307 |     11,722 |    12,444 |
| Desktop project detail     |   161,330 |  162,256 |     22,058 |    22,860 |
| Desktop session detail     |   161,330 |  162,256 |     23,691 |    24,429 |
| Desktop project generation |   161,330 |  162,256 |     55,819 |    48,930 |
| Desktop session generation |   161,330 |  162,256 |     97,271 |    47,595 |
| Mobile member generation   |   214,301 |  154,918 |     41,273 |    39,912 |
| Mobile calendar            |   208,682 |  149,307 |     23,024 |    27,126 |

The 0.6-0.8% common JS increase is attributable to the stable 16.3.2 patch and
new shell/controller output; it stays below the 5% relative budget. The large
member/calendar reduction comes from preventing the footer from prefetching the
client-heavy OT presentation. Detail pages no longer multiply full RSC runtime
prefetches across every visible card.

## Core Web Vitals lab results

| Route/profile              | LCP before -> after | CLS before -> after | TBT before -> after | Interaction before -> after |
| -------------------------- | ------------------: | ------------------: | ------------------: | --------------------------: |
| Desktop `/ko`              |   2,112 -> 1,532 ms |    0.0102 -> 0.0102 |     1,587 -> 949 ms |                         N/A |
| Desktop project generation |   2,160 -> 1,424 ms |    0.0040 -> 0.0040 |     2,057 -> 569 ms |                         N/A |
| Desktop project detail     |   1,692 -> 1,380 ms |    0.0023 -> 0.0023 |     1,570 -> 790 ms |                         N/A |
| Desktop session generation |   1,772 -> 1,508 ms |    0.0041 -> 0.0041 |     1,453 -> 928 ms |                         N/A |
| Desktop session detail     |   1,764 -> 1,484 ms |    0.0024 -> 0.0024 |     1,502 -> 590 ms |                         N/A |
| Desktop member generation  |   1,604 -> 1,384 ms |    0.0058 -> 0.0057 |     1,438 -> 589 ms |                         N/A |
| Mobile member index        |   1,724 -> 1,444 ms |              0 -> 0 |     1,058 -> 643 ms |                448 -> 88 ms |
| Mobile project detail      |   1,592 -> 2,064 ms |              0 -> 0 |     797 -> 1,064 ms |                88 -> 216 ms |

The mobile project-detail sample regressed but remains within the 2.5 s LCP and
250 ms interaction budgets. It should be watched with repeated/field data; the
single matched run does not justify another architecture change that would risk
image quality or the true-404 contract.

## Instant Navigation results

Production `@next/playwright` `instant()` checks:

| Transition                   | Immediate assertion              | Result |
| ---------------------------- | -------------------------------- | ------ |
| Homepage -> project index    | Header + real target heading     | Pass   |
| Project index -> generation  | Header + generation page heading | Pass   |
| Project generation -> detail | Header + detail skeleton         | Pass   |
| Homepage -> session index    | Header + real target heading     | Pass   |
| Session index -> generation  | Header + generation page heading | Pass   |
| Session generation -> detail | Header + detail skeleton         | Pass   |
| Member index -> generation   | Header + generation page heading | Pass   |
| Detail -> browser Back       | Prior list restored and usable   | Pass   |

Deterministic seeded equivalents live in `tests/e2e/instant-navigation.spec.ts`.
Production E2E builds expose the testing API only when
`NEXT_EXPOSE_TESTING_API=1`; normal production builds do not.

## Request and prefetch results

| Route/profile              | Requests before -> after | Prefetches before -> after |
| -------------------------- | -----------------------: | -------------------------: |
| Desktop project generation |                 48 -> 46 |                   19 -> 19 |
| Desktop session generation |                 66 -> 59 |                   20 -> 20 |
| Desktop session detail     |                 35 -> 34 |                   12 -> 12 |
| Mobile member generation   |                 46 -> 42 |                   21 -> 20 |
| Mobile calendar            |                 59 -> 55 |                   16 -> 15 |

Partial Prefetching often keeps the request count stable because the shared
route shell is still fetched, but the destination-specific RSC work is removed.
This is why session-generation bytes fell much more than its prefetch count.

## Build performance

| Build                |   Before |   After | Change |
| -------------------- | -------: | ------: | -----: |
| Clean `.next` output | 219.72 s | 70.37 s | -68.0% |
| Warm repeat          |  73.52 s | 41.12 s | -44.1% |

Both builds used stable Turbopack. The clean-output comparison removes `.next`
but cannot flush OS/package-store caches, so the warm comparison is the more
repeatable number. `/usr/bin/time` was unavailable; a baseline process sample
observed roughly 382 MB RSS, but no comparable after peak was captured, so no
memory improvement is claimed.

## Performance budgets

The checked budgets are:

- Encoded public-route JS <= 170 KB.
- Encoded RSC <= 70 KB.
- Requests <= 75; prefetch requests <= 25.
- LCP <= 2.5 s; CLS <= 0.05.
- Mobile interaction sample <= 250 ms; TBT <= 2.5 s.
- JS may not regress by more than 5%, requests by more than four, or LCP by
  more than 35% versus the matched baseline.

Result: 22/22 route/profile samples pass.

## Remaining tradeoffs

- True 404 status adds one small PostgreSQL existence query to direct dynamic
  documents. This is the official Next.js 16.3 architecture for combining
  Cache Components streaming with pre-stream status correctness.
- Locale switching remains an MPA for correct root `<html lang>` semantics.
- The calendar iframe dominates its page's long tasks and is third-party code.
- Mobile project-detail LCP needs repeated/field observation.
- Exact Redis hit/miss and database query telemetry should be added in the
  deployment environment; local measurement had no Redis or SQL telemetry.
- `io()` and `use cache: private` were deliberately not used without a matching
  correctness/performance case.

## Important files changed

- `next.config.ts`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`:
  stable 16.3.2, conditional testing API, image TTL, performance commands.
- `app/(home)/[lang]/generation-index-page.tsx`, public index/generation pages,
  `localized-text.tsx`: reusable localized shells and narrow Suspense regions.
- `proxy.ts`: pre-render direct-request validation and true 404 responses.
- `lib/server/queries/public/*`, `lib/server/cache/*`: shared bilingual cache
  keys, request dedupe, bounded visibility cache, narrow SQL projections.
- `images-slider.tsx`, `images-slider-controller.tsx`, public image call sites:
  server image markup, client controller leaf, corrected responsive sizes.
- `footer.tsx`, project/session cards: partial-prefetch policy.
- `tests/e2e/instant-navigation.spec.ts`, `public-route-matrix.spec.ts`,
  `tests/proxy.test.ts`: instant shells and status regressions.
- `playwright.production.config.ts`, `.github/workflows/performance.yml`: seeded
  production-build E2E path in a disposable PostgreSQL service.
- `scripts/measure-next-performance.mjs`,
  `scripts/check-performance-budget.mjs`,
  `scripts/verify-instant-navigation.mjs`: repeatable measurement and gates.

## Verification

Executed locally:

- `pnpm test:types`: pass.
- `pnpm lint`: pass after the final App Router passkey fix.
- `pnpm test`: 45 files passed; 227 tests passed, 1 skipped.
- Targeted proxy/public-cache/component tests: pass.
- `NEXT_EXPOSE_TESTING_API=1 pnpm exec next build`: pass, 166 static pages.
- `pnpm perf:instant` against `next start`: 8/8 checks pass.
- `pnpm perf:budget /tmp/gdgoc-performance-after.json /tmp/gdgoc-performance-before.json`:
  22/22 samples pass.
- Direct HTTP status matrix: seven invalid routes return 404; representative
  valid project/session generations return 200.
- Public client-reference manifest scan: no admin modules found.

The repository's full Playwright global setup intentionally truncates the target
database. It was not run against the provided shared database. A disposable,
production-build E2E job is included in `.github/workflows/performance.yml` and
the non-destructive production instant/browser harness was run locally instead.
