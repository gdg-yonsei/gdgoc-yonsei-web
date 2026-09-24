# Redesign Plan 2 — Data Layer, Admin Tags, Sessions and Projects

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Sessions and Projects as archive-first, filterable, SEO-complete pages on two cached read models, and let admins tag projects by tech stack.

**Architecture:**
- Two bilingual `'use cache: remote'` read models feed every hub, generation page, sitemap entry and the home counter:
  - `getSessionArchive(bucket)` returns every public session.
  - `getProjectShowcase()` returns every project with its tags and contributors.
- Both entries tag themselves after the query with each generation they contain, so the admin's immediate `updateTag` calls still reach generation pages.
- Pure, client-safe helpers in `lib/site/*` do dates, labels, grouping, facets and JSON-LD. Pages are server components; the only new client code is one shared filter island (about 3 KB) that toggles `hidden` on server-rendered rows, plus the admin tag input.
- Detail pages get breadcrumbs, structured metadata, a generated poster when there are no photos, and View Transitions.

**Tech Stack:** Next.js 16.3 (App Router, `cacheComponents`, `partialPrefetching`), React 19 canary as bundled by Next (`<ViewTransition>`), Drizzle ORM 0.45, Zod 4, Tailwind CSS 4 plus `@tailwindcss/typography`, Vitest with Testing Library, and Playwright with `@next/playwright`.

**Spec:** `docs/superpowers/specs/2026-09-23-inside-the-brackets-redesign-design.md`. Relevant sections:
- §2 information architecture
- §3 Sessions, Projects, and the Landing hero meta strip
- §4 SEO
- §5 queries, primitives and admin tag editing
- §6 phases 4–7

**Series:** Plan 2 of 3. Plan 1 (foundations, hero, chrome) is complete; its ledger is in the session scratchpad at `plan1-record/progress.md`. Plan 3 covers the landing sections, member/calendar/policy restyles, OG images, ⌘K, the dark scheme and final verification.

**Deliberate deviations from the spec** (each confirmed from the codebase):
- **Session times.** The spec says to check the 25-26 Sixth T19 before choosing a time zone. The code settles it: the admin form parses `datetime-local` on a UTC server, and the edit form reads it back with `toISOString().slice(0, 16)`. So stored session times are KST wall-clock values with a UTC label.
  - All public session formatting uses `timeZone: 'UTC'`, and JSON-LD appends `+09:00`.
  - `createdAt`/`updatedAt` are real instants and use `Asia/Seoul`.
  - The social-image date, which used `Asia/Seoul` for sessions and so dated evening sessions a day late, is fixed here. The template restyle stays in Plan 3.
- **Hub names.** The Projects hub's H1 stays "Projects"/"프로젝트", with a `<releases />` tag above it. That's the nav label and the word people search for; the spec calls the page "Releases".
- **Link filters.** "Live demo" and "Open source" are one *Links* facet with all-of semantics, not two separate toggles.
- **Contributors.** Project cards show contributor initials, not avatar images, to keep the grid light. The case study shows avatars (next/image already allows the GitHub, Google and CDN hosts).
- **Sitemap.** It keeps every member generation page, because member counts aren't queried here. It drops only session or project generation pages that have nothing public.
- **Locale switch.** It carries the query string through an intent handler (pointer over, focus, click) rather than `useSearchParams`, so the header's static shell stays as it is.
- **Home counters.** The hero meta strip reads the two shared read models directly. Their list tags already refresh on every session or project write, so it doesn't add a separate `homeTag`.
- **Legacy components.** Only `navigation-button` and the two superseded queries are removed. `generation-index-page`, `stage-button-group`, `generation-button-group` and `page-title` stay, because the member and calendar pages still render them until Plan 3 restyles those pages.
- **Transitions.** Plan 2 ships the directional slides, the anchored header and two shared-element morphs (session title, project cover). The Suspense-reveal slide and the same-route crossfade are left for Plan 3's polish pass.
- **Deferred to Plan 3:** `app/llms.txt` refresh, social-image template restyle, member/calendar restyles, enabling the dark scheme.
- **Interface drift from Plan 1**, to respect:
  - `HeaderNavigation`/`NavigationFallback` take `lang`, `links` and `copy` props.
  - `BracketPoster` takes no `id` and renders `span.bracket-poster > svg ×2`.
  - The taller mobile bracket size is hero-only (`.hero-mark .bracket-slot`), so any new bracket use sizes itself.

## Global Constraints

- **Performance budgets** (`scripts/check-performance-budget.mjs`):
  - encoded JS ≤ 170,000 B and RSC ≤ 70,000 B per route
  - LCP ≤ 2,500 ms, CLS ≤ 0.05, TBT ≤ 2,500 ms
  - requests ≤ 75, prefetches ≤ 25
  - JS may not regress more than 5% against the pre-redesign baseline `.superpowers/shared/perf-baseline.json`
  - The filter island must stay ≤ 3.5 KB gzip.
- **Dependencies:** no new npm dependencies, and no `motion` import in anything public pages render.
- **Identity:**
  - Colors come only from the GDG palette: core `#4285F4` `#EA4335` `#F9AB00` `#34A853`; bright `#57CAFF` `#FF7DAF` `#FFD427` `#5CDB6D`; neutrals `#1E1E1E` `#F0F0F0`; plus the `--s-*` tokens in `app/styles/site-theme.css`.
  - Latin type is Google Sans Flex/Code. Hangul uses Pretendard Variable (Task 19).
- **Data contracts:**
  - no schema changes; the only admin change is tag editing
  - URLs unchanged; `proxy.ts` 404 behavior unchanged
  - Every new cached read model calls `cacheQuery(profile, listTags)` before the query and `tagQuery([...generation:list, ...one tag per generation in the rows])` after it.
- **Session times:**
  - Session start/end times are KST wall-clock values stored as UTC. They are formatted only through `lib/site/datetime.ts`, with `timeZone: 'UTC'` and a `+09:00` label.
  - `createdAt`/`updatedAt` are formatted in `Asia/Seoul`.
- **Instant-navigation contracts:**
  - Hub shells render their H1 with `LocalizedText` outside `<Suspense>` and carry `data-testid="session-log-shell"` / `data-testid="project-showcase-shell"`.
  - Generation pages render their H1 from params.
  - Detail routes keep `loading.tsx`, with `role="status"` names `Loading session details` / `Loading project details`.
- **Admin e2e contracts:** a project or session title on a public list page is a heading whose accessible name is exactly the title (`admin-crud/projects.spec.ts` asserts `exact: true`). Clicking anywhere on the heading must navigate, so titles use a stretched link.
- **Local builds and e2e:**
  - Never with real `.env` secrets.
  - Mirror the env block of `.github/workflows/performance.yml` and use the local embedded Postgres on port 5439 (`.superpowers/shared/e2e-prod.sh` does this).
  - Never run `pnpm build`, `pnpm db:*` or `pnpm test:e2e*` against `.env`'s remote database.
- **Lint and types:**
  - `react-hooks/set-state-in-effect` is an error; use `useSyncExternalStore` or event handlers.
  - `lib/**` must not import `@/app/**`.
  - `any` is an error.
  - `noUncheckedIndexedAccess` is on.
- **Client bundles:** client modules must not import `@/lib/cn`, `@/lib/contents/site-copy` or `@/lib/contents/archive-copy` (`tests/lib/site/client-bundle-guards.test.ts`).
- **Dark scheme** stays off until Plan 3.
- **Commits** only when the user asks. Each task ends with a checkpoint listing the files to stage.
- **E2E suite:** fully green since Task 20 (60 passed). `instant-navigation.spec.ts` runs as its own first Playwright project, because with `NEXT_EXPOSE_TESTING_API=1` Next never rebuilds a prerendered shell after an admin edit invalidates it. New specs that edit data belong in the default project.

## Review Focus

1. **Sessions with no start time or no location** (`startAt`, `location` and `locationKo` are nullable).
   - Rows print "Date to be announced" under a TBA group at the end of the generation.
   - The detail page says TBA and emits a `LearningResource` instead of an `Event`.
   - Pinned by Task 4 (grouping test) and Task 14 (view test).
2. **Missing Korean fields** (`nameKo` empty, `descriptionKo`/`locationKo`/`project.nameKo` null). Korean pages fall back to the English text and never render an empty heading or chip. Pinned by the Task 4 and Task 6 title/summary tests.
3. **A shared or bookmarked URL** with unknown keys or empty or garbage values (`?category=nope&part=&foo=1`), or a filter set that matches nothing.
   - Unknown keys are ignored.
   - A "no matches" status and a Reset button appear.
   - The page chrome never disappears.
   - Pinned by the Task 3 parse tests and the Task 11 FilterBar tests.
4. **Tag input abuse:** mixed-case duplicates, whitespace, a pasted `a, b,,c`, a 13th tag, 33-character tags, commas or pipes inside a tag. Pinned by the Task 8 validation tests and Task 9 `TagsInput` tests.
5. **A generation with sessions but no projects, or with nothing public at all.**
   - Only the empty page gets `noindex` and an empty state, and drops out of the sitemap.
   - Its strip pill is muted, not a dead link.
   - Hubs never scroll sideways at 320 px, even with long titles or tag names.
   - Pinned by the Task 7 sitemap test, the Task 13 and Task 15 e2e (the second e2e generation has no visible session), and the 320 px checks in Tasks 12 and 15.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `lib/site/datetime.ts` | create | Session wall-clock and instant formatting, `+09:00` ISO |
| `lib/site/labels.ts` | create | Category labels and hues, part hues |
| `lib/site/images.ts` | create | `isPlaceholderImage` |
| `lib/site/format.ts` | create | `fillTemplate`, `countLabel`, `initials` |
| `lib/site/json-ld.ts` | create | BreadcrumbList, CollectionPage/ItemList, Event, LearningResource, CreativeWork builders |
| `lib/site/filter-state.ts` | create | Query ↔ filter state, matching, DOM item reader |
| `lib/site/generations.ts` | create | Per-generation counts, strip ordering, neighbors |
| `lib/site/session-log.ts` | create | `LogSession` type, titles, grouping, facets, search text, adjacency, related |
| `lib/site/project-showcase.ts` | create | `ProjectRow`/`ShowcaseProject` types, mapping, facets, search text, next/more |
| `lib/site/sitemap-paths.ts` | create | Pure sitemap path builder |
| `lib/site/carry-query.ts` | create | Locale links carry the current query string |
| `lib/validations/project-tags.ts` | create | `dedupeTags`, tag limits (Zod-free, client-safe) |
| `lib/validations/project.ts` | modify | `tags` field |
| `lib/server/form-data/get-project-form-data.ts` | modify | Parse `tags` JSON |
| `lib/server/services/project-tags.ts` | create | `getTagNames`, `syncProjectTags` |
| `lib/server/cache/index.ts` | modify | `tagQuery` |
| `lib/server/queries/public/sessions.ts` | modify | `getSessionArchive`; extend `getSessionById`; drop `getPublishedSessionsByGeneration` |
| `lib/server/queries/public/projects.ts` | modify | `getProjectShowcase`; extend `getProjectById`; drop `getProjectsByGeneration` |
| `lib/server/queries/public/sitemap.ts` | modify | Build from archive and showcase |
| `lib/server/fetcher/admin/get-project.ts` | modify | Include tags |
| `lib/seo/metadata.ts` | modify | `noindex` option |
| `lib/seo/social-image-data.ts` | modify | Shared labels and placeholders; UTC session date |
| `lib/contents/archive-copy.ts` | create | EN/KO copy for the Sessions and Projects pages |
| `lib/contents/site-copy.ts` | modify | Hero meta templates |
| `lib/admin-i18n/index.ts` | modify | Tag labels |
| `app/styles/site-content.css` | create | Content-page styles and View Transition CSS |
| `app/globals.css` | modify | Import `site-content.css` |
| `types/react-canary.d.ts` | create | `/// <reference types="react/canary" />` |
| `vitest.setup.ts` | modify | Pass-through `ViewTransition`; strip router-only `Link` props |
| `app/components/site/{breadcrumbs,page-header,chip,empty-state,generation-strip,generation-pager,session-poster,page-transition,external-link,hub-breadcrumbs}.tsx` | create | Server primitives |
| `app/components/site/filter-bar.tsx` | create | Client filter island |
| `app/components/site/session-log/{session-log,session-row}.tsx` | create | The log |
| `app/components/site/session-detail/session-detail-view.tsx` | create | Session page view |
| `app/components/site/project-grid/{project-card,project-grid}.tsx` | create | Release cards |
| `app/components/site/project-detail/project-detail-view.tsx` | create | Case study view |
| `app/components/images-slider-controller.tsx` | modify | Site styling, counter, arrow keys |
| `app/components/site/locale-switch.tsx`, `footer-locale-switch.tsx`, `app/components/header/navigation.tsx` | modify | `onIntent` → `carryQueryString` |
| `app/components/admin/tags-input.tsx` | create | Chip input for tags |
| `app/(admin)/admin/projects/{create,[projectId]/edit}/{page,actions}.ts(x)`, `[projectId]/page.tsx` | modify | Tag editing and display |
| `app/(home)/[lang]/session/page.tsx`, `[generation]/page.tsx`, `[generation]/loading.tsx`, `[generation]/[sessionId]/page.tsx`, `[sessionId]/loading.tsx` | rewrite | Sessions |
| `app/(home)/[lang]/project/page.tsx`, `[generation]/page.tsx`, `[generation]/loading.tsx`, `[generation]/[projectId]/page.tsx`, `[projectId]/loading.tsx` | rewrite | Projects |
| `app/(home)/[lang]/_components/home/{hero,hero-meta}.tsx`, `app/(home)/[lang]/page.tsx`, `app/styles/site-hero.css` | modify/create | Live hero meta strip |
| `app/components/navigation-button.tsx` | delete | Replaced by breadcrumbs |
| `scripts/verify-instant-navigation.mjs` | modify | New headings |
| Tests | create/modify | Listed per task |

---

### Task 0: Baseline and shared tools

**Files:** none in the repo. Shared tools go to `.superpowers/shared/`, which is git-ignored and kept across plans. The plan workspace is `W=.superpowers/sdd/2026-09-23-redesign-plan-2-data-sessions-projects`. `SCRATCH` is the session scratchpad, `/tmp/claude-1000/-home-jhyunwoo-projects-gdgoc-yonsei-web/b29a3453-50ca-4ba8-b28c-a8b557c6a746/scratchpad`.

- [ ] **Step 1: Local Postgres**

Run: `ss -ltn | grep -q ':5439' && echo up || echo down`
Expected: `up`.
If it prints `down`, start it in the background with `cd $SCRATCH/pg && node start.mjs > pg.log 2>&1` and wait for `postgres ready on 5439` in `pg.log`.
If `$SCRATCH/pg` is gone (new session), recreate a disposable DB the way Plan 1 Task 0 did:
- `embedded-postgres` in a scratch directory on port 5439
- `AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc pnpm exec drizzle-kit migrate`
- then `pnpm db:seed` with the same variable

- [ ] **Step 2: Shared tools**

```bash
mkdir -p .superpowers/shared
cp $SCRATCH/perf-baseline.json .superpowers/shared/perf-baseline.json
cp $SCRATCH/tools/{shot.mjs,qa.mjs,cls.mjs,reqs.mjs} .superpowers/shared/
```

Create `.superpowers/shared/truncate-local.ts`:

```ts
import { sql } from 'drizzle-orm'
import db from '../../db'

// Perf baselines were measured on dev-seed data only; e2e runs leave their
// fixtures behind. Refuse to touch anything but the disposable local DB.
async function main() {
  if (!(process.env.AUTH_DRIZZLE_URL ?? '').includes('@localhost:5439/')) {
    throw new Error(
      'refusing to truncate: AUTH_DRIZZLE_URL is not the local embedded Postgres'
    )
  }
  await db.execute(
    sql.raw(`TRUNCATE TABLE "userToSession", "external_participants",
      "users_to_projects", "projects_to_tags", "users_to_parts", "sessions",
      "projects", "parts", "generations", "account", "authenticator", "session",
      "verificationToken", "user", "tags" RESTART IDENTITY CASCADE`)
  )
  console.log('truncated local DB')
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error)
    process.exit(1)
  }
)
```

Create `.superpowers/shared/dev-data.sh` (then run `chmod +x` on it):

```bash
#!/usr/bin/env bash
# Restore the dev-seed dataset (what the perf baseline was measured on).
set -eu
cd "$(git rev-parse --show-toplevel)"
export AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc
pnpm exec tsx .superpowers/shared/truncate-local.ts
pnpm db:seed
```

Create `.superpowers/shared/e2e-prod.sh` (then run `chmod +x` on it):

```bash
#!/usr/bin/env bash
# Usage: e2e-prod.sh <log-path> [playwright args…]
# Seeds the local DB, builds, starts and runs Playwright's production config
# with CI's fake credentials (.github/workflows/performance.yml).
set -u
cd "$(git rev-parse --show-toplevel)"
export AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc \
  BETTER_AUTH_SECRET=test-secret-at-least-32-characters-long \
  BETTER_AUTH_URL=http://127.0.0.1:3100 \
  GITHUB_CLIENT_ID=test-github-client-id GITHUB_CLIENT_SECRET=test-github-client-secret \
  GOOGLE_CLIENT_ID=test-google-client-id GOOGLE_CLIENT_SECRET=test-google-client-secret \
  NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3100 NEXT_PUBLIC_IMAGE_URL=https://cdn.example/ \
  CLOUDFLARE_ACCOUNT_ID=test-account R2_ACCESS_KEY=test-access-key \
  R2_SECRET_KEY=test-secret-key R2_BUCKET_NAME=test-bucket \
  RESEND_API_KEY=test-resend-key E2E_SEEDED_BEFORE_BUILD=1 NEXT_EXPOSE_TESTING_API=1
LOG="$1"; shift
pnpm exec playwright test --config=playwright.production.config.ts --reporter=line "$@" > "$LOG" 2>&1
status=$?
echo "exit $status" >> "$LOG"
exit $status
```

Port 3100 must be free before any run. Free it by PID, never with `pkill -f` on a pattern that appears in your own shell's command line:

```bash
for pid in $(ss -ltnp | grep ':3100' | grep -oE 'pid=[0-9]+' | cut -d= -f2); do kill $pid; done
```

- [ ] **Step 3: Static baseline**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t0-test.log 2>&1; tail -4 $W/t0-test.log`
Expected: lint and types pass, and `Test Files  57 passed (57)`, `Tests  277 passed | 1 skipped (278)`, which is where Plan 1 ended.

- [ ] **Step 4: Production snapshot on dev data**

```bash
.superpowers/shared/dev-data.sh
AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc pnpm exec next build > $W/t0-build.log 2>&1
(AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc pnpm exec next start -p 3100 > $W/t0-start.log 2>&1 &)
PERF_OUTPUT=$W/perf-plan2-start.json pnpm perf:measure > $W/t0-perf.log 2>&1
pnpm perf:budget $W/perf-plan2-start.json .superpowers/shared/perf-baseline.json
```

Expected: `Performance budget passed for 22 route/profile samples.` Stop the server by PID afterwards.

---

### Task 1: Dates, labels, placeholder images and copy templates

**Files:**
- Create: `lib/site/datetime.ts`, `lib/site/labels.ts`, `lib/site/images.ts`, `lib/site/format.ts`
- Modify: `lib/seo/social-image-data.ts`
- Test: `tests/lib/site/datetime.test.ts`, `tests/lib/site/labels.test.ts`, `tests/lib/site/images.test.ts`, `tests/lib/site/format.test.ts`, `tests/lib/social-image-data.test.ts`

**Interfaces:**
- Produces from `@/lib/site/datetime`:
  - `toKstIso(date: Date): string`
  - `formatSessionTime(date: Date): string`
  - `formatLogStamp(date: Date, locale: Locale): string`
  - `formatSessionLongDate(date: Date, locale: Locale): string`
  - `formatSessionShortDate(date: Date, locale: Locale): string`
  - `sessionMonthKey(date: Date): string`
  - `formatMonthKey(key: string, locale: Locale): string`
  - `formatInstantDate(date: Date, locale: Locale): string`
  - `toSeoulDateIso(date: Date): string`
- Produces from `@/lib/site/labels`:
  - `type Hue = 'blue' | 'sky' | 'red' | 'pink' | 'yellow' | 'green' | 'neutral'`
  - `SESSION_CATEGORIES`
  - `type SessionCategory`
  - `isSessionCategory(value: string): value is SessionCategory`
  - `categoryLabel(category: string, locale: Locale): string`
  - `categoryHue(category: string): Hue`
  - `partHue(partName: string | null | undefined): Hue`
- Produces from `@/lib/site/images`: `isPlaceholderImage(src: string | null | undefined): boolean`
- Produces from `@/lib/site/format`:
  - `fillTemplate(template: string, values: Record<string, string | number>): string`
  - `countLabel(count: number, one: string, many: string): string`
  - `initials(name: string): string`

- [ ] **Step 1: Write the failing tests**

`tests/lib/site/datetime.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  formatInstantDate,
  formatLogStamp,
  formatMonthKey,
  formatSessionLongDate,
  formatSessionShortDate,
  formatSessionTime,
  sessionMonthKey,
  toKstIso,
  toSeoulDateIso,
} from '@/lib/site/datetime'

// The admin form stores a 19:00 KST session as 19:00 with a UTC label.
const sixthT19 = new Date('2025-11-04T19:00:00.000Z')

describe('session wall-clock dates', () => {
  it('reads stored session times back as KST wall-clock time', () => {
    expect(formatSessionTime(sixthT19)).toBe('19:00')
    expect(toKstIso(sixthT19)).toBe('2025-11-04T19:00:00+09:00')
  })

  it('keeps evening sessions on their own calendar day', () => {
    // Formatting in Asia/Seoul would move this to November 5.
    expect(formatSessionShortDate(sixthT19, 'en')).toBe('Nov 4, 2025')
    expect(formatSessionShortDate(sixthT19, 'ko')).toBe('2025. 11. 4.')
    expect(formatSessionLongDate(sixthT19, 'en')).toBe(
      'Tuesday, November 4, 2025'
    )
    expect(formatSessionLongDate(sixthT19, 'ko')).toBe('2025년 11월 4일 화요일')
  })

  it('prints log stamps with the weekday', () => {
    expect(formatLogStamp(sixthT19, 'en')).toBe('TUE 2025.11.04 19:00')
    expect(formatLogStamp(sixthT19, 'ko')).toBe('2025.11.04 (화) 19:00')
  })

  it('groups by wall-clock month', () => {
    expect(sessionMonthKey(new Date('2025-11-30T23:30:00.000Z'))).toBe(
      '2025-11'
    )
    expect(formatMonthKey('2025-11', 'en')).toBe('November 2025')
    expect(formatMonthKey('2025-11', 'ko')).toBe('2025년 11월')
  })
})

describe('real instants', () => {
  it('shows createdAt and updatedAt in Seoul time', () => {
    const lateEvening = new Date('2025-11-04T16:30:00.000Z') // 01:30 KST, Nov 5
    expect(formatInstantDate(lateEvening, 'en')).toBe('Nov 5, 2025')
    expect(formatInstantDate(lateEvening, 'ko')).toBe('2025. 11. 5.')
    expect(toSeoulDateIso(lateEvening)).toBe('2025-11-05')
  })
})
```

`tests/lib/site/labels.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  SESSION_CATEGORIES,
  categoryHue,
  categoryLabel,
  isSessionCategory,
  partHue,
} from '@/lib/site/labels'

describe('session labels', () => {
  it('names every category in both languages', () => {
    expect(categoryLabel('tech_talk', 'en')).toBe('Tech Talk')
    expect(categoryLabel('demo_day', 'ko')).toBe('데모데이')
    expect(categoryLabel('devrel', 'en')).toBe('Community Event')
  })

  it('keeps unknown categories readable and neutral', () => {
    expect(isSessionCategory('workshop')).toBe(false)
    expect(categoryLabel('workshop', 'en')).toBe('workshop')
    expect(categoryHue('workshop')).toBe('neutral')
  })

  it('maps categories onto the GDG palette', () => {
    expect(SESSION_CATEGORIES.map((category) => categoryHue(category))).toEqual(
      ['blue', 'green', 'red', 'yellow', 'pink']
    )
  })

  it('matches free-text part names loosely', () => {
    expect(
      [
        'Front-End',
        'Back-End',
        'ML/AI',
        'Cloud',
        'UI/UX',
        'DevRel',
        'Organizer',
        'Blockchain',
        null,
      ].map((name) => partHue(name))
    ).toEqual([
      'blue',
      'green',
      'yellow',
      'sky',
      'pink',
      'red',
      'neutral',
      'neutral',
      'neutral',
    ])
  })
})
```

`tests/lib/site/images.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isPlaceholderImage } from '@/lib/site/images'

describe('isPlaceholderImage', () => {
  it('recognises the stock fallbacks, local or absolute', () => {
    expect(isPlaceholderImage('/session-default.png')).toBe(true)
    expect(
      isPlaceholderImage('https://gdgoc.yonsei.ac.kr/project-default.png')
    ).toBe(true)
    expect(isPlaceholderImage('')).toBe(true)
    expect(isPlaceholderImage(null)).toBe(true)
  })

  it('keeps real uploads', () => {
    expect(
      isPlaceholderImage('https://image.gdgyonsei.moveto.kr/sessions/a.webp')
    ).toBe(false)
  })
})
```

`tests/lib/site/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { countLabel, fillTemplate, initials } from '@/lib/site/format'

describe('copy templates', () => {
  it('replaces known tokens and leaves unknown ones', () => {
    expect(
      fillTemplate('{count} sessions in {generation}', {
        count: 3,
        generation: '25-26',
      })
    ).toBe('3 sessions in 25-26')
    expect(fillTemplate('{missing}', {})).toBe('{missing}')
  })

  it('picks the singular or plural template', () => {
    expect(countLabel(1, '{count} session', '{count} sessions')).toBe(
      '1 session'
    )
    expect(countLabel(0, '{count} session', '{count} sessions')).toBe(
      '0 sessions'
    )
  })

  it('builds avatar initials for Latin and Hangul names', () => {
    expect(initials('Minji Kim')).toBe('MK')
    expect(initials('김민지')).toBe('김')
    expect(initials('   ')).toBe('?')
  })
})
```

`tests/lib/social-image-data.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSessionById, mockGetProjectById } = vi.hoisted(() => ({
  mockGetSessionById: vi.fn(),
  mockGetProjectById: vi.fn(),
}))

vi.mock('@/lib/server/queries/public/sessions', () => ({
  getSessionById: mockGetSessionById,
}))
vi.mock('@/lib/server/queries/public/projects', () => ({
  getProjectById: mockGetProjectById,
}))
vi.mock('@/lib/server/cache/session-visibility', () => ({
  getCachedSessionVisibilityBucket: vi.fn(async () => '2026-01-01T00:00:00.000Z'),
}))

describe('social image content', () => {
  beforeEach(() => vi.clearAllMocks())

  it('dates an evening session on the day it happened', async () => {
    mockGetSessionById.mockResolvedValue({
      name: 'Sixth T19',
      nameKo: '여섯 번째 T19',
      category: 'tech_talk',
      startAt: new Date('2025-11-04T19:00:00.000Z'),
      mainImage: '/session-default.png',
      updatedAt: new Date('2025-11-05T00:00:00.000Z'),
      part: { generation: { name: '25-26' } },
    })
    const { getSessionSocialImageContent } =
      await import('@/lib/seo/social-image-data')

    await expect(
      getSessionSocialImageContent({
        locale: 'en',
        generation: '25-26',
        sessionId: 'session-id',
      })
    ).resolves.toMatchObject({
      date: 'Nov 4, 2025',
      category: 'Tech Talk',
      representativeImage: null,
    })
  })

  it('dates projects by their Seoul update day', async () => {
    mockGetProjectById.mockResolvedValue({
      name: 'Campus Compass',
      nameKo: '캠퍼스 나침반',
      mainImage: 'https://image.gdgyonsei.moveto.kr/projects/cover.webp',
      updatedAt: new Date('2025-11-04T16:30:00.000Z'),
      generation: { name: '25-26' },
    })
    const { getProjectSocialImageContent } =
      await import('@/lib/seo/social-image-data')

    await expect(
      getProjectSocialImageContent({
        locale: 'ko',
        generation: '25-26',
        projectId: 'project-id',
      })
    ).resolves.toMatchObject({
      title: '캠퍼스 나침반',
      date: '2025. 11. 5.',
      representativeImage:
        'https://image.gdgyonsei.moveto.kr/projects/cover.webp',
    })
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/lib/site/datetime.test.ts tests/lib/site/labels.test.ts tests/lib/site/images.test.ts tests/lib/site/format.test.ts tests/lib/social-image-data.test.ts`
Expected:
- The four `lib/site` files fail to resolve their module (`Failed to resolve import "@/lib/site/datetime"` and so on).
- `social-image-data.test.ts` fails on `date`, because `Asia/Seoul` gives `Nov 5, 2025`.

- [ ] **Step 3: Implement the helpers**

`lib/site/datetime.ts`:

```ts
import type { Locale } from '@/i18n-config'

/*
 * Two kinds of timestamps reach the public pages:
 *
 * - Session start/end times are KST wall-clock values stored with a UTC
 *   label: the admin form parses a `datetime-local` value on a UTC server and
 *   the edit form reads it back with `toISOString().slice(0, 16)`. Read them
 *   in UTC and label them +09:00 (`19:00Z` in the DB is 19:00 in Seoul).
 * - createdAt / updatedAt are real instants (defaultNow); show them in
 *   Asia/Seoul.
 */

const WEEKDAYS: Record<Locale, readonly string[]> = {
  en: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  ko: ['일', '월', '화', '수', '목', '금', '토'],
}

const pad = (value: number) => String(value).padStart(2, '0')

function wallClock(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: pad(date.getUTCMonth() + 1),
    day: pad(date.getUTCDate()),
    weekday: date.getUTCDay(),
    time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
  }
}

const SESSION_LONG: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }),
}

const SESSION_SHORT: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }),
}

const MONTH: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }),
}

const INSTANT: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }),
}

const SEOUL_ISO_DATE = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Seoul',
})

/** `2025-11-04T19:00:00+09:00`, for `<time dateTime>` and JSON-LD. */
export function toKstIso(date: Date): string {
  const t = wallClock(date)
  return `${t.year}-${t.month}-${t.day}T${t.time}:00+09:00`
}

/** `19:00` */
export function formatSessionTime(date: Date): string {
  return wallClock(date).time
}

/** `TUE 2025.11.04 19:00` / `2025.11.04 (화) 19:00` */
export function formatLogStamp(date: Date, locale: Locale): string {
  const t = wallClock(date)
  const day = `${t.year}.${t.month}.${t.day}`
  const weekday = WEEKDAYS[locale][t.weekday] ?? ''
  return locale === 'ko'
    ? `${day} (${weekday}) ${t.time}`
    : `${weekday} ${day} ${t.time}`
}

/** `Tuesday, November 4, 2025` / `2025년 11월 4일 화요일` */
export function formatSessionLongDate(date: Date, locale: Locale): string {
  return SESSION_LONG[locale].format(date)
}

/** `Nov 4, 2025` / `2025. 11. 4.` */
export function formatSessionShortDate(date: Date, locale: Locale): string {
  return SESSION_SHORT[locale].format(date)
}

/** `2025-11`, the key the log groups by. */
export function sessionMonthKey(date: Date): string {
  const t = wallClock(date)
  return `${t.year}-${t.month}`
}

/** `November 2025` / `2025년 11월` for a `YYYY-MM` key. */
export function formatMonthKey(key: string, locale: Locale): string {
  const [year = 1970, month = 1] = key.split('-').map(Number)
  return MONTH[locale].format(new Date(Date.UTC(year, month - 1, 1)))
}

/** Real instants in Seoul: `Nov 5, 2025` / `2025. 11. 5.` */
export function formatInstantDate(date: Date, locale: Locale): string {
  return INSTANT[locale].format(date)
}

/** `2025-11-05`: the Seoul calendar day of a real instant. */
export function toSeoulDateIso(date: Date): string {
  return SEOUL_ISO_DATE.format(date)
}
```

`lib/site/labels.ts`:

```ts
import type { Locale } from '@/i18n-config'

export type Hue = 'blue' | 'sky' | 'red' | 'pink' | 'yellow' | 'green' | 'neutral'

/** Order matches `activityCategoryEnum` in db/schema/sessions.ts. */
export const SESSION_CATEGORIES = [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
] as const

export type SessionCategory = (typeof SESSION_CATEGORIES)[number]

const CATEGORY_LABELS: Record<SessionCategory, Record<Locale, string>> = {
  tech_talk: { en: 'Tech Talk', ko: '기술 세션' },
  part_session: { en: 'Part Session', ko: '파트 세션' },
  hackathon: { en: 'Hackathon', ko: '해커톤' },
  demo_day: { en: 'Demo Day', ko: '데모데이' },
  devrel: { en: 'Community Event', ko: '커뮤니티 행사' },
}

const CATEGORY_HUES: Record<SessionCategory, Hue> = {
  tech_talk: 'blue',
  part_session: 'green',
  hackathon: 'red',
  demo_day: 'yellow',
  devrel: 'pink',
}

export function isSessionCategory(value: string): value is SessionCategory {
  return (SESSION_CATEGORIES as readonly string[]).includes(value)
}

export function categoryLabel(category: string, locale: Locale): string {
  return isSessionCategory(category)
    ? CATEGORY_LABELS[category][locale]
    : category
}

export function categoryHue(category: string): Hue {
  return isSessionCategory(category) ? CATEGORY_HUES[category] : 'neutral'
}

/* Part names are free text per generation ("Front-End", "UI/UX" …). */
const PART_HUES: ReadonlyArray<readonly [RegExp, Hue]> = [
  [/front/, 'blue'],
  [/back/, 'green'],
  [/\bml\b|\bai\b|data/, 'yellow'],
  [/cloud|infra/, 'sky'],
  [/\bui\b|\bux\b|design/, 'pink'],
  [/devrel|community/, 'red'],
]

export function partHue(partName: string | null | undefined): Hue {
  const key = (partName ?? '').toLowerCase()
  return PART_HUES.find(([pattern]) => pattern.test(key))?.[1] ?? 'neutral'
}
```

`lib/site/images.ts`:

```ts
/** Stock images the admin forms fall back to; never worth showing as content. */
const PLACEHOLDER_PATHS = new Set([
  '/project-default.png',
  '/session-default.png',
  '/default-image.png',
])

function pathOf(src: string): string {
  try {
    return new URL(src, 'https://placeholder.invalid').pathname
  } catch {
    return src
  }
}

export function isPlaceholderImage(src: string | null | undefined): boolean {
  return !src || PLACEHOLDER_PATHS.has(pathOf(src))
}
```

`lib/site/format.ts`:

```ts
/** `fillTemplate('{count} sessions', { count: 3 })` → `3 sessions` */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) =>
    key in values ? String(values[key]) : token
  )
}

/** Picks the singular or plural template and fills `{count}`. */
export function countLabel(count: number, one: string, many: string): string {
  return fillTemplate(count === 1 ? one : many, { count })
}

const HANGUL = /^[ㄱ-ㆎ가-힣]/

/** Avatar initials: `Minji Kim` → `MK`, `김민지` → `김`. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]
  if (!first) return '?'
  if (HANGUL.test(first)) return first.slice(0, 1)
  return words
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toUpperCase())
    .join('')
}
```

In `lib/seo/social-image-data.ts`:
- Remove `DEFAULT_SOCIAL_IMAGE_PATHS`, `SESSION_CATEGORY_LABELS`, `imagePath`, `representativeImage` and `formatSocialDate`.
- Add these imports:

```ts
import { formatInstantDate, formatSessionShortDate } from '@/lib/site/datetime'
import { isPlaceholderImage } from '@/lib/site/images'
import { categoryLabel, isSessionCategory } from '@/lib/site/labels'
```

Then change the returned fields.

In `getSessionSocialImageContent`:

```ts
    category: isSessionCategory(session.category)
      ? categoryLabel(session.category, locale)
      : fallback.category,
    date: session.startAt ? formatSessionShortDate(session.startAt, locale) : '',
    representativeImage: isPlaceholderImage(session.mainImage)
      ? null
      : session.mainImage,
```

In `getProjectSocialImageContent`:

```ts
    date: formatInstantDate(project.updatedAt, locale),
    representativeImage: isPlaceholderImage(project.mainImage)
      ? null
      : project.mainImage,
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: the Step 2 command.
Expected: `Test Files  5 passed (5)`.

- [ ] **Step 5: Checkpoint**

Run: `pnpm test:types && pnpm exec eslint lib/site lib/seo tests/lib --max-warnings=0`
Expected: clean.
Stage: `lib/site/{datetime,labels,images,format}.ts`, `lib/seo/social-image-data.ts`, `tests/lib/site/{datetime,labels,images,format}.test.ts`, `tests/lib/social-image-data.test.ts`.

---

### Task 2: JSON-LD builders and `noindex` metadata

**Files:**
- Create: `lib/site/json-ld.ts`
- Modify: `lib/seo/metadata.ts:84-133` (`LocalizedMetadataInput`, `createLocalizedMetadata`)
- Test: `tests/lib/site/json-ld.test.ts`, `tests/lib/seo-metadata.test.ts` (append)

**Interfaces:**
- Consumes: `toKstIso` (Task 1).
- Produces from `@/lib/site/json-ld`:
  - `type JsonLdCrumb = { name: string; url: string }`
  - `type JsonLdOrganization = { id: string; name: string; url: string }`
  - `breadcrumbList(crumbs)`
  - `collectionPage({ url, name, description, locale, websiteId, items })`, which returns `[CollectionPage, ItemList]`
  - `YONSEI_ADDRESS`
  - `sessionEvent({ url, name, description, images, locale, startAt, endAt, location, organizer })`
  - `sessionLearningResource({ url, name, description, images, locale, providerId })`
  - `projectWork({ url, name, description, images, locale, dateCreated, dateModified, keywords, creators, repoUrl, publisherId })`
- Produces: `createLocalizedMetadata({ …, noindex?: boolean })`, which yields `robots: { index: false, follow: true }` when `noindex` is set.

- [ ] **Step 1: Write the failing tests**

`tests/lib/site/json-ld.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  breadcrumbList,
  collectionPage,
  projectWork,
  sessionEvent,
  sessionLearningResource,
} from '@/lib/site/json-ld'

const organizer = {
  id: 'https://gdgoc.yonsei.ac.kr/#organization',
  name: 'GDGoC Yonsei',
  url: 'https://gdgoc.yonsei.ac.kr/en',
}

describe('JSON-LD builders', () => {
  it('numbers breadcrumb items from 1', () => {
    expect(
      breadcrumbList([
        { name: 'Home', url: 'https://x.dev/en' },
        { name: 'Sessions', url: 'https://x.dev/en/session' },
      ])
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://x.dev/en' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Sessions',
          item: 'https://x.dev/en/session',
        },
      ],
    })
  })

  it('describes a hub as a collection page with an item list', () => {
    const [page, list] = collectionPage({
      url: 'https://x.dev/en/session',
      name: 'Session Log',
      description: 'All sessions',
      locale: 'en',
      websiteId: 'https://x.dev/#website',
      items: [{ name: 'Sixth T19', url: 'https://x.dev/en/session/25-26/a' }],
    })
    expect(page).toMatchObject({
      '@type': 'CollectionPage',
      isPartOf: { '@id': 'https://x.dev/#website' },
    })
    expect(list).toMatchObject({
      '@type': 'ItemList',
      numberOfItems: 1,
      itemListElement: [{ position: 1, name: 'Sixth T19' }],
    })
  })

  it('marks sessions as scheduled offline events at Yonsei with KST times', () => {
    const event = sessionEvent({
      url: 'https://x.dev/en/session/25-26/a',
      name: 'Sixth T19',
      description: 'Talk',
      images: ['https://x.dev/session-default.png'],
      locale: 'en',
      startAt: new Date('2025-11-04T19:00:00.000Z'),
      endAt: new Date('2025-11-04T21:00:00.000Z'),
      location: null,
      organizer,
    })
    expect(event).toMatchObject({
      '@type': 'Event',
      startDate: '2025-11-04T19:00:00+09:00',
      endDate: '2025-11-04T21:00:00+09:00',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: true,
      location: {
        '@type': 'Place',
        name: 'Yonsei University',
        address: { streetAddress: '50 Yonsei-ro', addressCountry: 'KR' },
      },
      organizer: { '@type': 'Organization', name: 'GDGoC Yonsei' },
    })
    expect(JSON.stringify(event)).not.toContain('EventCompleted')
  })

  it('falls back to a learning resource when a session has no date', () => {
    expect(
      sessionLearningResource({
        url: 'https://x.dev/en/session/25-26/a',
        name: 'Recording',
        description: 'Talk',
        images: [],
        locale: 'ko',
        providerId: organizer.id,
      })
    ).toMatchObject({ '@type': 'LearningResource', provider: { '@id': organizer.id } })
  })

  it('adds SoftwareSourceCode only when a repository exists', () => {
    const base = {
      url: 'https://x.dev/en/project/25-26/p',
      name: 'Campus Compass',
      description: 'Indoor navigation',
      images: [],
      locale: 'en' as const,
      dateCreated: new Date('2025-03-01T00:00:00.000Z'),
      dateModified: new Date('2025-04-01T00:00:00.000Z'),
      creators: ['Kim Minji'],
      publisherId: organizer.id,
    }
    expect(
      projectWork({
        ...base,
        keywords: ['Flutter', 'Firebase'],
        repoUrl: 'https://github.com/gdg-yonsei/campus-compass',
      })
    ).toMatchObject({
      '@type': ['CreativeWork', 'SoftwareSourceCode'],
      codeRepository: 'https://github.com/gdg-yonsei/campus-compass',
      keywords: 'Flutter, Firebase',
      creator: [{ '@type': 'Person', name: 'Kim Minji' }],
    })
    const plain = projectWork({ ...base, keywords: [], repoUrl: null })
    expect(plain['@type']).toBe('CreativeWork')
    expect(plain).not.toHaveProperty('codeRepository')
    expect(plain).not.toHaveProperty('keywords')
  })
})
```

Append to `tests/lib/seo-metadata.test.ts`, inside the existing `describe` block:

```ts
  it('keeps pages indexable unless asked otherwise', () => {
    const indexable = createLocalizedMetadata({
      locale: 'en',
      path: '/session/25-26',
      title: '25-26 Sessions',
      description: 'Sessions',
    })
    const hidden = createLocalizedMetadata({
      locale: 'en',
      path: '/session/24-25',
      title: '24-25 Sessions',
      description: 'Sessions',
      noindex: true,
    })

    expect(indexable.robots).toEqual({ index: true, follow: true })
    expect(hidden.robots).toEqual({ index: false, follow: true })
  })
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/lib/site/json-ld.test.ts tests/lib/seo-metadata.test.ts`
Expected:
- `json-ld.test.ts` fails to resolve `@/lib/site/json-ld`.
- The new metadata test fails, because `robots` stays `{ index: true, follow: true }`. `noindex` is also a TypeScript excess property, which Vitest does not type-check.

- [ ] **Step 3: Implement**

`lib/site/json-ld.ts`:

```ts
import type { Locale } from '@/i18n-config'
import { toKstIso } from '@/lib/site/datetime'

/* Pure builders: callers pass absolute URLs (see lib/seo/metadata.ts). */

const CONTEXT = 'https://schema.org'

export type JsonLdCrumb = { name: string; url: string }

export type JsonLdOrganization = { id: string; name: string; url: string }

export function breadcrumbList(crumbs: readonly JsonLdCrumb[]) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

export function collectionPage({
  url,
  name,
  description,
  locale,
  websiteId,
  items,
}: {
  url: string
  name: string
  description: string
  locale: Locale
  websiteId: string
  items: readonly JsonLdCrumb[]
}) {
  return [
    {
      '@context': CONTEXT,
      '@type': 'CollectionPage',
      '@id': `${url}#collection-page`,
      url,
      name,
      description,
      inLanguage: locale,
      isPartOf: { '@id': websiteId },
    },
    {
      '@context': CONTEXT,
      '@type': 'ItemList',
      '@id': `${url}#items`,
      name,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  ] as const
}

/** Sessions meet on Yonsei University's Sinchon campus. */
export const YONSEI_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '50 Yonsei-ro',
  addressLocality: 'Seodaemun-gu',
  addressRegion: 'Seoul',
  postalCode: '03722',
  addressCountry: 'KR',
} as const

type CommonWork = {
  url: string
  name: string
  description: string
  images: readonly string[]
  locale: Locale
}

export function sessionEvent({
  url,
  name,
  description,
  images,
  locale,
  startAt,
  endAt,
  location,
  organizer,
}: CommonWork & {
  startAt: Date
  endAt: Date | null
  location: string | null
  organizer: JsonLdOrganization
}) {
  return {
    '@context': CONTEXT,
    '@type': 'Event',
    '@id': `${url}#event`,
    url,
    name,
    description,
    image: images,
    inLanguage: locale,
    startDate: toKstIso(startAt),
    ...(endAt ? { endDate: toKstIso(endAt) } : {}),
    // Google reads EventScheduled as "happened as planned"; EventCompleted is
    // not a valid EventStatusType.
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    isAccessibleForFree: true,
    location: {
      '@type': 'Place',
      name: location || 'Yonsei University',
      address: YONSEI_ADDRESS,
    },
    organizer: {
      '@type': 'Organization',
      '@id': organizer.id,
      name: organizer.name,
      url: organizer.url,
    },
  }
}

export function sessionLearningResource({
  url,
  name,
  description,
  images,
  locale,
  providerId,
}: CommonWork & { providerId: string }) {
  return {
    '@context': CONTEXT,
    '@type': 'LearningResource',
    '@id': `${url}#learning-resource`,
    url,
    name,
    description,
    image: images,
    inLanguage: locale,
    provider: { '@id': providerId },
  }
}

export function projectWork({
  url,
  name,
  description,
  images,
  locale,
  dateCreated,
  dateModified,
  keywords,
  creators,
  repoUrl,
  publisherId,
}: CommonWork & {
  dateCreated: Date
  dateModified: Date
  keywords: readonly string[]
  creators: readonly string[]
  repoUrl: string | null
  publisherId: string
}) {
  return {
    '@context': CONTEXT,
    '@type': repoUrl ? ['CreativeWork', 'SoftwareSourceCode'] : 'CreativeWork',
    '@id': `${url}#creative-work`,
    url,
    name,
    description,
    image: images,
    inLanguage: locale,
    dateCreated: dateCreated.toISOString(),
    dateModified: dateModified.toISOString(),
    ...(keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
    ...(repoUrl ? { codeRepository: repoUrl } : {}),
    creator: creators.map((creator) => ({ '@type': 'Person', name: creator })),
    publisher: { '@id': publisherId },
  }
}
```

In `lib/seo/metadata.ts`:
- Add `noindex?: boolean` to `LocalizedMetadataInput`.
- Add `noindex = false,` to the destructured parameters of `createLocalizedMetadata`.
- Replace the `robots` block with:

```ts
    // Empty generation pages stay reachable but out of the index.
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: the Step 2 command.
Expected: both files pass.

- [ ] **Step 5: Checkpoint**

Run: `pnpm test:types`
Expected: clean.
Stage: `lib/site/json-ld.ts`, `lib/seo/metadata.ts`, `tests/lib/site/json-ld.test.ts`, `tests/lib/seo-metadata.test.ts`.

---

### Task 3: Filter state and generation helpers

**Files:**
- Create: `lib/site/filter-state.ts`, `lib/site/generations.ts`
- Test: `tests/lib/site/filter-state.test.ts`, `tests/lib/site/generations.test.ts`

**Interfaces:**
- Produces from `@/lib/site/filter-state`:
  - types: `FacetOption = { value: string; label: string; count: number }`, `FacetMode = 'any' | 'all'`, `FilterState = { q: string; selected: Readonly<Record<string, readonly string[]>> }`, `FilterableItem`
  - constants: `EMPTY_FILTER`, `VALUE_DELIMITER = '|'`
  - `normalizeSearchText(text)`
  - `parseFilterState(search, keys)`
  - `serializeFilterState(state, keys)`
  - `isFilterActive(state)`
  - `toggleFacetValue(state, key, value)`
  - `matchesFilter(item, state, modes?)`
  - `facetAttribute(key)`, which returns `data-f-${key}`
  - `joinFacetValues(values)`
  - `readFilterableItem(element, keys)`
- Produces from `@/lib/site/generations`:
  - types: `GenerationRef = { name: string; startDate: string }`, `StripGeneration = { name: string; count: number }`
  - `countByGeneration(items)`
  - `generationStrip(generations, counts)`: newest first
  - `generationNeighbors(generations, name)`, which returns `{ older, newer }`

- [ ] **Step 1: Write the failing tests**

`tests/lib/site/filter-state.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILTER,
  facetAttribute,
  isFilterActive,
  joinFacetValues,
  matchesFilter,
  normalizeSearchText,
  parseFilterState,
  readFilterableItem,
  serializeFilterState,
  toggleFacetValue,
} from '@/lib/site/filter-state'

const KEYS = ['category', 'part'] as const

describe('parseFilterState', () => {
  it('reads known facets and the search query', () => {
    expect(
      parseFilterState('?q=cloud&category=tech_talk,hackathon&part=Cloud', KEYS)
    ).toEqual({
      q: 'cloud',
      selected: { category: ['tech_talk', 'hackathon'], part: ['Cloud'] },
    })
  })

  it('ignores unknown keys, empty values and duplicates', () => {
    expect(
      parseFilterState('?foo=1&category=,tech_talk,tech_talk&part=', KEYS)
    ).toEqual({ q: '', selected: { category: ['tech_talk'] } })
  })

  it('keeps the raw query so typing a trailing space is not swallowed', () => {
    expect(parseFilterState('?q=next+', KEYS).q).toBe('next ')
  })
})

describe('serializeFilterState', () => {
  it('round-trips and drops empty facets', () => {
    const query = serializeFilterState(
      { q: 'ui', selected: { category: ['hackathon'], part: [] } },
      KEYS
    )
    expect(query).toBe('?q=ui&category=hackathon')
    expect(parseFilterState(query, KEYS)).toEqual({
      q: 'ui',
      selected: { category: ['hackathon'] },
    })
  })

  it('returns an empty string for the empty state', () => {
    expect(serializeFilterState(EMPTY_FILTER, KEYS)).toBe('')
    expect(isFilterActive(EMPTY_FILTER)).toBe(false)
    expect(isFilterActive({ q: '   ', selected: { part: [] } })).toBe(false)
  })
})

describe('matchesFilter', () => {
  const item = {
    search: normalizeSearchText('Sixth T19 여섯 번째 T19 Cloud Tech Talk'),
    facets: {
      category: ['tech_talk'],
      part: ['Cloud'],
      links: ['demo', 'source'],
    },
  }

  it('ORs values inside a facet and ANDs facets', () => {
    expect(
      matchesFilter(item, {
        q: '',
        selected: { category: ['hackathon', 'tech_talk'], part: ['Cloud'] },
      })
    ).toBe(true)
    expect(
      matchesFilter(item, {
        q: '',
        selected: { category: ['tech_talk'], part: ['UI/UX'] },
      })
    ).toBe(false)
  })

  it('supports all-of facets', () => {
    const both = { q: '', selected: { links: ['demo', 'source'] } }
    expect(matchesFilter(item, both, { links: 'all' })).toBe(true)
    expect(
      matchesFilter(
        { ...item, facets: { ...item.facets, links: ['demo'] } },
        both,
        { links: 'all' }
      )
    ).toBe(false)
  })

  it('needs every search term, in any order, Korean and full-width included', () => {
    expect(matchesFilter(item, { q: 'cloud  ＴＡＬＫ', selected: {} })).toBe(true)
    expect(matchesFilter(item, { q: '여섯', selected: {} })).toBe(true)
    expect(matchesFilter(item, { q: 'cloud hackathon', selected: {} })).toBe(
      false
    )
  })
})

describe('state updates and DOM items', () => {
  it('toggles a value on and off', () => {
    const on = toggleFacetValue(EMPTY_FILTER, 'part', 'Cloud')
    expect(on.selected.part).toEqual(['Cloud'])
    expect(toggleFacetValue(on, 'part', 'Cloud').selected.part).toEqual([])
  })

  it('reads data attributes written by the server', () => {
    const element = document.createElement('li')
    element.setAttribute('data-search', 'campus compass')
    element.setAttribute(
      facetAttribute('tag'),
      joinFacetValues(['Next.js', null, 'Firebase'])
    )
    expect(readFilterableItem(element, ['tag', 'generation'])).toEqual({
      search: 'campus compass',
      facets: { tag: ['Next.js', 'Firebase'], generation: [] },
    })
  })
})
```

`tests/lib/site/generations.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  countByGeneration,
  generationNeighbors,
  generationStrip,
} from '@/lib/site/generations'

const generations = [
  { name: '24-25', startDate: '2024-03-01' },
  { name: '26-27', startDate: '2026-03-01' },
  { name: '25-26', startDate: '2025-03-01' },
]

describe('generation helpers', () => {
  it('counts items per generation', () => {
    expect(
      countByGeneration([
        { generationName: '25-26' },
        { generationName: '25-26' },
        { generationName: '24-25' },
      ])
    ).toEqual(
      new Map([
        ['25-26', 2],
        ['24-25', 1],
      ])
    )
  })

  it('orders the strip newest first and keeps empty generations', () => {
    expect(
      generationStrip(generations, new Map([['25-26', 3]]))
    ).toEqual([
      { name: '26-27', count: 0 },
      { name: '25-26', count: 3 },
      { name: '24-25', count: 0 },
    ])
  })

  it('finds the older and newer neighbours of a generation', () => {
    expect(generationNeighbors(generations, '25-26')).toEqual({
      older: { name: '24-25', startDate: '2024-03-01' },
      newer: { name: '26-27', startDate: '2026-03-01' },
    })
    expect(generationNeighbors(generations, '24-25').older).toBeNull()
    expect(generationNeighbors(generations, 'nope')).toEqual({
      older: null,
      newer: null,
    })
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/lib/site/filter-state.test.ts tests/lib/site/generations.test.ts`
Expected: both fail to resolve their module.

- [ ] **Step 3: Implement**

`lib/site/filter-state.ts`:

```ts
/*
 * Filter state for the Session Log and project hubs. The server writes each
 * row's facets into `data-f-<key>` attributes (values joined by `|`) and a
 * normalized `data-search` string; the FilterBar island reads them back and
 * mirrors its state in the query string.
 */

export type FacetOption = { value: string; label: string; count: number }

export type FacetMode = 'any' | 'all'

export type FilterState = {
  q: string
  selected: Readonly<Record<string, readonly string[]>>
}

export type FilterableItem = {
  search: string
  facets: Readonly<Record<string, readonly string[]>>
}

export const EMPTY_FILTER: FilterState = { q: '', selected: {} }

export const VALUE_DELIMITER = '|'

export function normalizeSearchText(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function parseFilterState(
  search: string,
  keys: readonly string[]
): FilterState {
  const params = new URLSearchParams(search)
  const selected: Record<string, string[]> = {}
  for (const key of keys) {
    const values = (params.get(key) ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    if (values.length > 0) selected[key] = [...new Set(values)]
  }
  return { q: params.get('q') ?? '', selected }
}

export function serializeFilterState(
  state: FilterState,
  keys: readonly string[]
): string {
  const params = new URLSearchParams()
  if (state.q.trim()) params.set('q', state.q)
  for (const key of keys) {
    const values = state.selected[key]
    if (values && values.length > 0) params.set(key, values.join(','))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function isFilterActive(state: FilterState): boolean {
  return (
    normalizeSearchText(state.q) !== '' ||
    Object.values(state.selected).some((values) => values.length > 0)
  )
}

export function toggleFacetValue(
  state: FilterState,
  key: string,
  value: string
): FilterState {
  const current = state.selected[key] ?? []
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
  return { ...state, selected: { ...state.selected, [key]: next } }
}

export function matchesFilter(
  item: FilterableItem,
  state: FilterState,
  modes: Readonly<Record<string, FacetMode>> = {}
): boolean {
  const terms = normalizeSearchText(state.q).split(' ').filter(Boolean)
  if (!terms.every((term) => item.search.includes(term))) return false

  return Object.entries(state.selected).every(([key, values]) => {
    if (values.length === 0) return true
    const own = item.facets[key] ?? []
    return modes[key] === 'all'
      ? values.every((value) => own.includes(value))
      : values.some((value) => own.includes(value))
  })
}

export function facetAttribute(key: string): string {
  return `data-f-${key}`
}

export function joinFacetValues(
  values: readonly (string | null | undefined)[]
): string {
  return values.filter(Boolean).join(VALUE_DELIMITER)
}

export function readFilterableItem(
  element: Element,
  keys: readonly string[]
): FilterableItem {
  const facets: Record<string, string[]> = {}
  for (const key of keys) {
    const raw = element.getAttribute(facetAttribute(key)) ?? ''
    facets[key] = raw ? raw.split(VALUE_DELIMITER) : []
  }
  return { search: element.getAttribute('data-search') ?? '', facets }
}
```

`lib/site/generations.ts`:

```ts
export type GenerationRef = { name: string; startDate: string }

export type StripGeneration = { name: string; count: number }

export function countByGeneration(
  items: readonly { generationName: string }[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const { generationName } of items) {
    counts.set(generationName, (counts.get(generationName) ?? 0) + 1)
  }
  return counts
}

const newestFirst = (a: GenerationRef, b: GenerationRef) =>
  b.startDate.localeCompare(a.startDate)

/** Every generation, newest first, with its count (0 = nothing public). */
export function generationStrip(
  generations: readonly GenerationRef[],
  counts: ReadonlyMap<string, number>
): StripGeneration[] {
  return [...generations]
    .sort(newestFirst)
    .map(({ name }) => ({ name, count: counts.get(name) ?? 0 }))
}

export function generationNeighbors(
  generations: readonly GenerationRef[],
  name: string
): { older: GenerationRef | null; newer: GenerationRef | null } {
  const ordered = [...generations].sort(newestFirst)
  const index = ordered.findIndex((generation) => generation.name === name)
  if (index === -1) return { older: null, newer: null }
  return {
    older: ordered[index + 1] ?? null,
    newer: ordered[index - 1] ?? null,
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: the Step 2 command.
Expected: both files pass.

- [ ] **Step 5: Checkpoint**

Stage: `lib/site/filter-state.ts`, `lib/site/generations.ts`, `tests/lib/site/filter-state.test.ts`, `tests/lib/site/generations.test.ts`.

---
### Task 4: Session log helpers

**Files:**
- Create: `lib/site/session-log.ts`
- Test: `tests/lib/site/session-log.test.ts`

**Interfaces:**
- Consumes: `sessionMonthKey` (Task 1); `categoryLabel`, `isSessionCategory`, `SESSION_CATEGORIES` (Task 1); `normalizeSearchText`, `FacetOption` (Task 3).
- Produces from `@/lib/site/session-log`:
  - types: `LogSession` (fields below), `LogMonth = { key: string; sessions: LogSession[] }`, `LogGeneration = { name; startDate; count; months: LogMonth[] }`
  - constant: `TBA_MONTH = 'tba'`
  - `sessionTitle(session, locale)`
  - `sessionLocation(session, locale): string | null`
  - `groupSessionLog(sessions): LogGeneration[]`
  - `sessionFacets(sessions, locale)`, which returns `{ categories, parts, generations }` as `FacetOption[]`
  - `sessionSearchText(session)`
  - `adjacentSessions(sessions, id)`, which returns `{ previous, next }`
  - `relatedSessions(sessions, current, limit = 3)`

`LogSession` is `{ id; name; nameKo; category; type: string | null; mainImage; startAt: Date | null; endAt: Date | null; location: string | null; locationKo: string | null; createdAt: Date; updatedAt: Date; partName: string | null; generationName: string; generationStartDate: string }`.

- [ ] **Step 1: Write the failing test**

`tests/lib/site/session-log.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  adjacentSessions,
  groupSessionLog,
  relatedSessions,
  sessionFacets,
  sessionLocation,
  sessionSearchText,
  sessionTitle,
  type LogSession,
} from '@/lib/site/session-log'

function session(
  overrides: Partial<LogSession> & Pick<LogSession, 'id'>
): LogSession {
  return {
    name: `Session ${overrides.id}`,
    nameKo: `세션 ${overrides.id}`,
    category: 'tech_talk',
    type: 'General Session',
    mainImage: '/session-default.png',
    startAt: new Date('2025-11-04T19:00:00.000Z'),
    endAt: new Date('2025-11-04T21:00:00.000Z'),
    location: 'Engineering Hall',
    locationKo: '공학원',
    createdAt: new Date('2025-10-01T00:00:00.000Z'),
    updatedAt: new Date('2025-10-02T00:00:00.000Z'),
    partName: 'Cloud',
    generationName: '25-26',
    generationStartDate: '2025-03-01',
    ...overrides,
  }
}

const at = (iso: string) => new Date(iso)

describe('session titles and places', () => {
  it('falls back to English when Korean text is missing', () => {
    const englishOnly = session({ id: 'a', name: 'Sixth T19', nameKo: '' })
    expect(sessionTitle(englishOnly, 'ko')).toBe('Sixth T19')
    expect(sessionTitle(englishOnly, 'en')).toBe('Sixth T19')
    expect(
      sessionLocation({ location: 'Room 101', locationKo: null }, 'ko')
    ).toBe('Room 101')
    expect(sessionLocation({ location: null, locationKo: null }, 'en')).toBeNull()
  })
})

describe('groupSessionLog', () => {
  it('groups by generation (newest first), then month, with undated sessions last', () => {
    const log = groupSessionLog([
      session({ id: 'old', generationName: '24-25', generationStartDate: '2024-03-01', startAt: at('2024-09-10T19:00:00.000Z') }),
      session({ id: 'oct', startAt: at('2025-10-07T19:00:00.000Z') }),
      session({ id: 'tba', startAt: null, endAt: null }),
      session({ id: 'nov-late', startAt: at('2025-11-25T19:00:00.000Z') }),
      session({ id: 'nov-early', startAt: at('2025-11-04T19:00:00.000Z') }),
    ])

    expect(log.map((generation) => [generation.name, generation.count])).toEqual([
      ['25-26', 4],
      ['24-25', 1],
    ])
    expect(
      log[0]?.months.map((month) => [
        month.key,
        month.sessions.map((entry) => entry.id),
      ])
    ).toEqual([
      ['2025-11', ['nov-late', 'nov-early']],
      ['2025-10', ['oct']],
      ['tba', ['tba']],
    ])
  })
})

describe('sessionFacets', () => {
  it('counts categories in schema order, parts by size and generations newest first', () => {
    const facets = sessionFacets(
      [
        session({ id: '1', category: 'hackathon', partName: 'UI/UX' }),
        session({ id: '2', category: 'tech_talk', partName: 'Cloud' }),
        session({ id: '3', category: 'tech_talk', partName: 'Cloud' }),
        session({ id: '4', category: 'tech_talk', partName: null, generationName: '24-25', generationStartDate: '2024-03-01' }),
      ],
      'en'
    )

    expect(facets.categories).toEqual([
      { value: 'tech_talk', label: 'Tech Talk', count: 3 },
      { value: 'hackathon', label: 'Hackathon', count: 1 },
    ])
    expect(facets.parts).toEqual([
      { value: 'Cloud', label: 'Cloud', count: 2 },
      { value: 'UI/UX', label: 'UI/UX', count: 1 },
    ])
    expect(facets.generations.map((option) => option.value)).toEqual([
      '25-26',
      '24-25',
    ])
  })
})

describe('sessionSearchText', () => {
  it('indexes both languages, the part, the place and the category names', () => {
    const text = sessionSearchText(
      session({ id: 'a', name: 'Sixth T19', nameKo: '여섯 번째 T19' })
    )
    expect(text).toContain('sixth t19')
    expect(text).toContain('여섯 번째 t19')
    expect(text).toContain('cloud')
    expect(text).toContain('공학원')
    expect(text).toContain('tech talk')
    expect(text).toContain('기술 세션')
  })
})

describe('session neighbours', () => {
  const archive = [
    session({ id: 'b', startAt: at('2025-11-04T19:00:00.000Z') }),
    session({ id: 'a', generationName: '24-25', generationStartDate: '2024-03-01', startAt: at('2025-01-10T19:00:00.000Z') }),
    session({ id: 'undated', startAt: null }),
    session({ id: 'c', startAt: at('2025-11-11T19:00:00.000Z'), partName: 'UI/UX', category: 'hackathon' }),
  ]

  it('walks the whole archive chronologically', () => {
    expect(adjacentSessions(archive, 'b')).toEqual({
      previous: archive[1],
      next: archive[3],
    })
    expect(adjacentSessions(archive, 'undated')).toEqual({
      previous: null,
      next: null,
    })
  })

  it('prefers the same part in the same generation, then the category', () => {
    const current = session({ id: 'x', startAt: at('2025-11-06T19:00:00.000Z') })
    expect(
      relatedSessions([...archive, current], current).map((entry) => entry.id)
    ).toEqual(['b', 'undated', 'a'])
  })
})
```

In the last test, `b`, `undated` and `a` share the part `Cloud`. `b` and `undated` are in the same generation as the current session; `b` is closer in time than `undated`, whose time counts as 0. `a` is in another generation. `c` is a different part and category, so it is excluded.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/lib/site/session-log.test.ts`
Expected: FAIL. `Failed to resolve import "@/lib/site/session-log"`.

- [ ] **Step 3: Implement `lib/site/session-log.ts`**

```ts
import type { Locale } from '@/i18n-config'
import { sessionMonthKey } from '@/lib/site/datetime'
import { normalizeSearchText, type FacetOption } from '@/lib/site/filter-state'
import {
  SESSION_CATEGORIES,
  categoryLabel,
  isSessionCategory,
} from '@/lib/site/labels'

/** One public session as the archive read model returns it (bilingual). */
export type LogSession = {
  id: string
  name: string
  nameKo: string
  category: string
  type: string | null
  mainImage: string
  startAt: Date | null
  endAt: Date | null
  location: string | null
  locationKo: string | null
  createdAt: Date
  updatedAt: Date
  partName: string | null
  generationName: string
  generationStartDate: string
}

export type LogMonth = { key: string; sessions: LogSession[] }

export type LogGeneration = {
  name: string
  startDate: string
  count: number
  months: LogMonth[]
}

/** Month key for sessions without a start time. */
export const TBA_MONTH = 'tba'

export function sessionTitle(
  session: Pick<LogSession, 'name' | 'nameKo'>,
  locale: Locale
): string {
  return locale === 'ko'
    ? session.nameKo || session.name
    : session.name || session.nameKo
}

export function sessionLocation(
  session: Pick<LogSession, 'location' | 'locationKo'>,
  locale: Locale
): string | null {
  const [primary, fallback] =
    locale === 'ko'
      ? [session.locationKo, session.location]
      : [session.location, session.locationKo]
  return primary || fallback || null
}

function compareNewestFirst(a: LogSession, b: LogSession): number {
  if (a.startAt && b.startAt) return b.startAt.getTime() - a.startAt.getTime()
  if (a.startAt) return -1
  if (b.startAt) return 1
  return 0
}

export function groupSessionLog(
  sessions: readonly LogSession[]
): LogGeneration[] {
  const generations = new Map<
    string,
    { startDate: string; sessions: LogSession[] }
  >()
  for (const session of sessions) {
    const entry = generations.get(session.generationName) ?? {
      startDate: session.generationStartDate,
      sessions: [],
    }
    entry.sessions.push(session)
    generations.set(session.generationName, entry)
  }

  return [...generations.entries()]
    .sort(([, a], [, b]) => b.startDate.localeCompare(a.startDate))
    .map(([name, { startDate, sessions: own }]) => {
      const months = new Map<string, LogSession[]>()
      for (const session of [...own].sort(compareNewestFirst)) {
        const key = session.startAt ? sessionMonthKey(session.startAt) : TBA_MONTH
        months.set(key, [...(months.get(key) ?? []), session])
      }
      return {
        name,
        startDate,
        count: own.length,
        months: [...months.entries()].map(([key, list]) => ({
          key,
          sessions: list,
        })),
      }
    })
}

function counts(values: readonly string[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1)
  return map
}

export function sessionFacets(
  sessions: readonly LogSession[],
  locale: Locale
): {
  categories: FacetOption[]
  parts: FacetOption[]
  generations: FacetOption[]
} {
  const categoryCounts = counts(sessions.map((session) => session.category))
  const categoryOrder = [
    ...SESSION_CATEGORIES.filter((category) => categoryCounts.has(category)),
    ...[...categoryCounts.keys()].filter((key) => !isSessionCategory(key)),
  ]
  const partCounts = counts(
    sessions.flatMap((session) => (session.partName ? [session.partName] : []))
  )

  return {
    categories: categoryOrder.map((value) => ({
      value,
      label: categoryLabel(value, locale),
      count: categoryCounts.get(value) ?? 0,
    })),
    parts: [...partCounts.entries()]
      .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
      .map(([value, count]) => ({ value, label: value, count })),
    generations: groupSessionLog(sessions).map((generation) => ({
      value: generation.name,
      label: generation.name,
      count: generation.count,
    })),
  }
}

export function sessionSearchText(session: LogSession): string {
  return normalizeSearchText(
    [
      session.name,
      session.nameKo,
      session.partName,
      session.location,
      session.locationKo,
      session.generationName,
      categoryLabel(session.category, 'en'),
      categoryLabel(session.category, 'ko'),
    ]
      .filter(Boolean)
      .join(' ')
  )
}

const startTime = (session: LogSession) => session.startAt?.getTime() ?? 0

/** Chronological neighbours across the whole archive (undated sessions skip). */
export function adjacentSessions(
  sessions: readonly LogSession[],
  id: string
): { previous: LogSession | null; next: LogSession | null } {
  const dated = sessions
    .filter((session) => session.startAt)
    .sort((a, b) => startTime(a) - startTime(b))
  const index = dated.findIndex((session) => session.id === id)
  if (index === -1) return { previous: null, next: null }
  return { previous: dated[index - 1] ?? null, next: dated[index + 1] ?? null }
}

export function relatedSessions(
  sessions: readonly LogSession[],
  current: LogSession,
  limit = 3
): LogSession[] {
  const score = (session: LogSession) => {
    if (session.partName && session.partName === current.partName) {
      return session.generationName === current.generationName ? 0 : 1
    }
    return session.category === current.category ? 2 : 3
  }
  const time = startTime(current)

  return sessions
    .filter((session) => session.id !== current.id && score(session) < 3)
    .sort(
      (a, b) =>
        score(a) - score(b) ||
        Math.abs(startTime(a) - time) - Math.abs(startTime(b) - time)
    )
    .slice(0, limit)
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm vitest run tests/lib/site/session-log.test.ts`
Expected: `Tests  7 passed (7)`.

- [ ] **Step 5: Checkpoint**

Stage: `lib/site/session-log.ts`, `tests/lib/site/session-log.test.ts`.

---

### Task 5: Session archive read model

**Files:**
- Modify: `lib/server/cache/index.ts` (add `tagQuery`)
- Modify: `lib/server/queries/public/sessions.ts` (add `getSessionArchive`; extend `getSessionById`)
- Test: `tests/lib/server/cache.test.ts` (append), `tests/lib/server/fetcher/public-fetchers.test.ts` (modify the cache mock; append and extend tests)

**Interfaces:**
- Consumes: `LogSession` (Task 4).
- Produces:
  - `tagQuery(tags: readonly string[]): void` from `@/lib/server/cache`
  - `getSessionArchive(visibilityBucket: string): Promise<LogSession[]>` from `@/lib/server/queries/public/sessions`. It returns every session with `displayOnWebsite = true` and `endAt ≤ bucket`, joined to its part and generation.
  - `getSessionById` additionally selects `type` and `part.name`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/lib/server/cache.test.ts`, inside `describe('cache utilities')`:

```ts
  it('tags query results after the fact, 128 tags per cacheTag call', async () => {
    const { tagQuery } = await import('@/lib/server/cache')

    tagQuery([
      ...Array.from({ length: 130 }, (_, index) => `tag:${index}`),
      'tag:0',
    ])

    expect(mockCacheTag).toHaveBeenCalledTimes(2)
    expect(mockCacheTag.mock.calls[0]).toHaveLength(128)
    expect(mockCacheTag.mock.calls[1]).toEqual(['tag:128', 'tag:129'])
  })
```

In `tests/lib/server/fetcher/public-fetchers.test.ts`:
- Add `const mockTagQuery = vi.fn()` next to `mockCacheQuery`.
- In the `vi.mock('@/lib/server/cache', …)` factory, return `{ ...actual, cacheQuery: mockCacheQuery, tagQuery: mockTagQuery }`.
- Append these tests inside `describe('public queries')`:

```ts
  it('builds one bilingual session archive and tags every generation it contains', async () => {
    const row = (id: string, generationName: string) => ({
      id,
      name: `Session ${id}`,
      nameKo: `세션 ${id}`,
      category: 'tech_talk',
      type: 'General Session',
      mainImage: '/session-default.png',
      startAt: new Date('2025-11-04T19:00:00.000Z'),
      endAt: new Date('2025-11-04T21:00:00.000Z'),
      location: null,
      locationKo: null,
      createdAt: new Date('2025-10-01T00:00:00.000Z'),
      updatedAt: new Date('2025-10-01T00:00:00.000Z'),
      partName: 'Cloud',
      generationName,
      generationStartDate: '2025-03-01',
    })
    const chain = createSelectChainWithOrderByResult([
      row('s1', '25-26'),
      row('s2', '24-25'),
      row('s3', '25-26'),
    ])
    mockSelect.mockReturnValue(chain)

    const { getSessionArchive } =
      await import('@/lib/server/queries/public/sessions')
    const result = await getSessionArchive('2026-03-07T00:00:00.000Z')

    expect(result.map((session) => session.id)).toEqual(['s1', 's2', 's3'])
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:en',
      'session:list:ko',
    ])
    expect(mockTagQuery).toHaveBeenCalledWith([
      'generation:list:en',
      'session:generation:25-26:en',
      'session:generation:24-25:en',
      'generation:list:ko',
      'session:generation:25-26:ko',
      'session:generation:24-25:ko',
    ])
    expect(chain.innerJoin).toHaveBeenCalledTimes(2)
    expect(chain.where).toHaveBeenCalledTimes(1)
  })
```

Then add these assertions to the end of the existing `it('shares visible session detail data across locales', …)`:

```ts
    expect(mockSessionsFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.objectContaining({ type: true }),
        with: {
          part: {
            columns: { id: true, name: true },
            with: { generation: { columns: { id: true, name: true } } },
          },
        },
      })
    )
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/lib/server/cache.test.ts tests/lib/server/fetcher/public-fetchers.test.ts`
Expected:
- `tagQuery is not a function`
- `getSessionArchive is not a function`
- the extended detail assertion fails, because `part.columns` lacks `name` and `type` is missing

- [ ] **Step 3: Implement**

In `lib/server/cache/index.ts`, add below `cacheQuery`:

```ts
/**
 * Tags a cache entry after its query ran, e.g. with one tag per generation
 * found in the rows. cacheTag() takes at most 128 tags per call.
 */
export function tagQuery(tags: readonly string[]) {
  const unique = uniqueStrings(tags)
  for (let index = 0; index < unique.length; index += 128) {
    cacheTag(...unique.slice(index, index + 128))
  }
}
```

In `lib/server/queries/public/sessions.ts`, extend the imports:

```ts
import {
  cacheQuery,
  forEachPublicLocale,
  generationListTag,
  sessionGenerationTag,
  sessionListTag,
  sessionTag,
  tagQuery,
  uniqueStrings,
} from '@/lib/server/cache'
import type { LogSession } from '@/lib/site/session-log'
```

Then add the read model below `getSessions`:

```ts
async function getSharedSessionArchive(
  visibilityBucket: string
): Promise<LogSession[]> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sessionList,
    forEachPublicLocale((locale) => [sessionListTag(locale)])
  )

  const rows = await db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      category: sessions.category,
      type: sessions.type,
      mainImage: sessions.mainImage,
      startAt: sessions.startAt,
      endAt: sessions.endAt,
      location: sessions.location,
      locationKo: sessions.locationKo,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      partName: parts.name,
      generationName: generations.name,
      generationStartDate: generations.startDate,
    })
    .from(sessions)
    .innerJoin(parts, eq(sessions.partId, parts.id))
    .innerJoin(generations, eq(parts.generationsId, generations.id))
    .where(
      and(
        eq(sessions.displayOnWebsite, true),
        lte(sessions.endAt, toVisibilityDate(visibilityBucket))
      )
    )
    .orderBy(desc(sessions.startAt))

  // Generation pages read this entry too, so it answers to the tags the admin
  // invalidates immediately for them (lib/server/cache/invalidation.ts).
  const generationNames = uniqueStrings(rows.map((row) => row.generationName))
  tagQuery(
    forEachPublicLocale((locale) => [
      generationListTag(locale),
      ...generationNames.map((name) => sessionGenerationTag(name, locale)),
    ])
  )

  return rows
}

const getSessionArchiveForRequest = cache((visibilityBucket: string) =>
  getSharedSessionArchive(visibilityBucket)
)

/** Every public session, bilingual, for hubs, generation pages and counters. */
export function getSessionArchive(visibilityBucket: string) {
  return getSessionArchiveForRequest(visibilityBucket)
}
```

In `getSharedSessionById`:
- Add `type: true` to `columns`.
- Change `with.part.columns` to `{ id: true, name: true }`.

- [ ] **Step 4: Run them to verify they pass**

Run: the Step 2 command.
Expected: both files pass.

- [ ] **Step 5: Checkpoint**

Run: `pnpm test:types`
Expected: clean. `LogSession` accepts the row shape, since `parts.name` is `string` and `sessions.type` is `'General Session' | 'Part Session' | null`.
Stage: `lib/server/cache/index.ts`, `lib/server/queries/public/sessions.ts`, `tests/lib/server/cache.test.ts`, `tests/lib/server/fetcher/public-fetchers.test.ts`.

---

### Task 6: Project showcase read model and helpers

**Files:**
- Create: `lib/site/project-showcase.ts`
- Modify: `lib/server/queries/public/projects.ts` (add `getProjectShowcase`; extend `getProjectById`)
- Test: `tests/lib/site/project-showcase.test.ts`, `tests/lib/server/fetcher/public-fetchers.test.ts` (append, and replace the `getProjectById` test)

**Interfaces:**
- Consumes: `normalizeSearchText`, `FacetOption` (Task 3); `formatUserName` (`@/lib/format-user-name`); `tagQuery` (Task 5).
- Produces from `@/lib/site/project-showcase`:
  - types: `ProjectUserRow`, `ProjectRow`, `ShowcaseContributor = { id; nameEn; nameKo; image: string | null; githubId: string | null }`, `ShowcaseProject`
  - `toShowcaseProject(row)`
  - `projectTitle(project, locale)`
  - `projectSummary(project, locale)`
  - `contributorName(contributor, locale)`
  - `sortShowcase(projects)`: generation newest first, then most recently updated
  - `projectLinkValues(project)`: `'demo' | 'source'` values
  - `projectFacets(projects)`
  - `projectSearchText(project)`
  - `nextProject(projects, id)`
  - `moreFromGeneration(projects, current, limit = 3)`
- Produces from `@/lib/server/queries/public/projects`:
  - `getProjectShowcase(): Promise<ShowcaseProject[]>`
  - `getProjectById(id, locale)` returns the raw row, now with `repoUrl`, `demoUrl`, `generation.startDate`, `projectsToTags[].tag.name` and `usersToProjects[].user.{image, githubId}`, so it can be passed to `toShowcaseProject`.

`ShowcaseProject` is `{ id; name; nameKo: string | null; description; descriptionKo: string | null; mainImage; repoUrl: string | null; demoUrl: string | null; createdAt: Date; updatedAt: Date; generationName; generationStartDate; tags: string[]; contributors: ShowcaseContributor[] }`.

- [ ] **Step 1: Write the failing tests**

`tests/lib/site/project-showcase.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  contributorName,
  moreFromGeneration,
  nextProject,
  projectFacets,
  projectLinkValues,
  projectSearchText,
  projectSummary,
  projectTitle,
  sortShowcase,
  toShowcaseProject,
  type ProjectRow,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'

function row(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'p1',
    name: 'Campus Compass',
    nameKo: '캠퍼스 나침반',
    description: 'Indoor navigation',
    descriptionKo: null,
    mainImage: '/project-default.png',
    repoUrl: 'https://github.com/gdg-yonsei/campus-compass',
    demoUrl: null,
    createdAt: new Date('2025-03-01T00:00:00.000Z'),
    updatedAt: new Date('2025-04-01T00:00:00.000Z'),
    generation: { name: '25-26', startDate: '2025-03-01' },
    projectsToTags: [{ tag: { name: 'Next.js' } }, { tag: { name: 'Firebase' } }],
    usersToProjects: [
      {
        user: {
          id: 'u1',
          name: 'minji',
          firstName: 'Minji',
          lastName: 'Kim',
          firstNameKo: '민지',
          lastNameKo: '김',
          isForeigner: false,
          image: null,
          githubId: '@minji',
        },
      },
    ],
    ...overrides,
  }
}

const project = (overrides: Partial<ShowcaseProject>): ShowcaseProject => ({
  ...toShowcaseProject(row()),
  ...overrides,
})

describe('toShowcaseProject', () => {
  it('flattens the row, sorts tags and names contributors in both languages', () => {
    expect(toShowcaseProject(row())).toMatchObject({
      generationName: '25-26',
      generationStartDate: '2025-03-01',
      tags: ['Firebase', 'Next.js'],
      contributors: [
        { id: 'u1', nameEn: 'Kim Minji', nameKo: '김민지', githubId: '@minji' },
      ],
    })
  })
})

describe('project text', () => {
  it('falls back to English when Korean fields are empty', () => {
    const english = project({ nameKo: null, descriptionKo: null })
    expect(projectTitle(english, 'ko')).toBe('Campus Compass')
    expect(projectSummary(english, 'ko')).toBe('Indoor navigation')
    expect(projectTitle(project({}), 'ko')).toBe('캠퍼스 나침반')
    expect(contributorName(project({}).contributors[0]!, 'ko')).toBe('김민지')
  })

  it('indexes names, summaries, tags and contributors', () => {
    const text = projectSearchText(project({}))
    expect(text).toContain('campus compass')
    expect(text).toContain('캠퍼스 나침반')
    expect(text).toContain('next.js')
    expect(text).toContain('김민지')
  })
})

describe('showcase ordering and facets', () => {
  const projects = [
    project({ id: 'old', generationName: '24-25', generationStartDate: '2024-03-01', tags: ['Flutter'] }),
    project({ id: 'recent', updatedAt: new Date('2025-06-01T00:00:00.000Z'), demoUrl: 'https://demo.example' }),
    project({ id: 'earlier', updatedAt: new Date('2025-05-01T00:00:00.000Z'), repoUrl: null }),
  ]

  it('orders by generation, then by the most recent update', () => {
    expect(sortShowcase(projects).map((entry) => entry.id)).toEqual([
      'recent',
      'earlier',
      'old',
    ])
  })

  it('counts generations, tags and link availability', () => {
    const facets = projectFacets(projects)
    expect(facets.generations).toEqual([
      { value: '25-26', label: '25-26', count: 2 },
      { value: '24-25', label: '24-25', count: 1 },
    ])
    expect(facets.tags).toEqual([
      { value: 'Firebase', label: 'Firebase', count: 2 },
      { value: 'Next.js', label: 'Next.js', count: 2 },
      { value: 'Flutter', label: 'Flutter', count: 1 },
    ])
    expect(facets.links).toEqual({ demo: 1, source: 2 })
    expect(projectLinkValues(projects[1]!)).toEqual(['demo', 'source'])
  })

  it('walks to the next project and lists siblings from the same generation', () => {
    const ordered = sortShowcase(projects)
    expect(nextProject(ordered, 'recent')?.id).toBe('earlier')
    expect(nextProject(ordered, 'old')?.id).toBe('recent')
    expect(nextProject([ordered[0]!], 'recent')).toBeNull()
    expect(
      moreFromGeneration(ordered, ordered[0]!).map((entry) => entry.id)
    ).toEqual(['earlier'])
  })
})
```

Append to `tests/lib/server/fetcher/public-fetchers.test.ts`:

```ts
  it('builds one project showcase and tags every generation it contains', async () => {
    const projectRow = (id: string, generation: string, startDate: string) => ({
      id,
      name: `Project ${id}`,
      nameKo: null,
      description: 'desc',
      descriptionKo: null,
      mainImage: '/project-default.png',
      repoUrl: null,
      demoUrl: null,
      createdAt: new Date('2025-03-01T00:00:00.000Z'),
      updatedAt: new Date('2025-04-01T00:00:00.000Z'),
      generation: { id: 1, name: generation, startDate },
      projectsToTags: [{ tagId: 1, tag: { name: 'Go' } }],
      usersToProjects: [],
    })
    mockProjectsFindMany.mockResolvedValue([
      projectRow('p1', '25-26', '2025-03-01'),
      projectRow('p2', '24-25', '2024-03-01'),
    ])

    const { getProjectShowcase } =
      await import('@/lib/server/queries/public/projects')
    const result = await getProjectShowcase()

    expect(result.map((project) => [project.id, project.tags])).toEqual([
      ['p1', ['Go']],
      ['p2', ['Go']],
    ])
    expect(mockCacheQuery).toHaveBeenCalledWith('projectList', [
      'project:list:en',
      'project:list:ko',
    ])
    expect(mockTagQuery).toHaveBeenCalledWith([
      'generation:list:en',
      'project:generation:25-26:en',
      'project:generation:24-25:en',
      'generation:list:ko',
      'project:generation:25-26:ko',
      'project:generation:24-25:ko',
    ])
  })
```

Replace the body of `it('fetches project detail with contributor relation', …)` so that its `with` expectation reads:

```ts
        with: {
          generation: {
            columns: { id: true, name: true, startDate: true },
          },
          projectsToTags: {
            columns: { tagId: true },
            with: { tag: { columns: { name: true } } },
          },
          usersToProjects: {
            columns: { userId: true },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  firstName: true,
                  firstNameKo: true,
                  lastName: true,
                  lastNameKo: true,
                  isForeigner: true,
                  image: true,
                  githubId: true,
                },
              },
            },
          },
        },
```

Also add `repoUrl: true` and `demoUrl: true` to its `columns: expect.objectContaining({…})`.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/lib/site/project-showcase.test.ts tests/lib/server/fetcher/public-fetchers.test.ts`
Expected:
- the helper module fails to resolve
- `getProjectShowcase is not a function`
- the detail test fails on the `with` object

- [ ] **Step 3: Implement**

`lib/site/project-showcase.ts`:

```ts
import type { Locale } from '@/i18n-config'
import formatUserName from '@/lib/format-user-name'
import { normalizeSearchText, type FacetOption } from '@/lib/site/filter-state'

export type ProjectUserRow = {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  firstNameKo: string | null
  lastNameKo: string | null
  isForeigner: boolean
  image: string | null
  githubId: string | null
}

/** The shape both project queries return (see PROJECT_RELATIONS). */
export type ProjectRow = {
  id: string
  name: string
  nameKo: string | null
  description: string
  descriptionKo: string | null
  mainImage: string
  repoUrl: string | null
  demoUrl: string | null
  createdAt: Date
  updatedAt: Date
  generation: { name: string; startDate: string }
  projectsToTags: { tag: { name: string } }[]
  usersToProjects: { user: ProjectUserRow }[]
}

export type ShowcaseContributor = {
  id: string
  nameEn: string
  nameKo: string
  image: string | null
  githubId: string | null
}

export type ShowcaseProject = {
  id: string
  name: string
  nameKo: string | null
  description: string
  descriptionKo: string | null
  mainImage: string
  repoUrl: string | null
  demoUrl: string | null
  createdAt: Date
  updatedAt: Date
  generationName: string
  generationStartDate: string
  tags: string[]
  contributors: ShowcaseContributor[]
}

export function toShowcaseProject(row: ProjectRow): ShowcaseProject {
  return {
    id: row.id,
    name: row.name,
    nameKo: row.nameKo,
    description: row.description,
    descriptionKo: row.descriptionKo,
    mainImage: row.mainImage,
    repoUrl: row.repoUrl,
    demoUrl: row.demoUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    generationName: row.generation.name,
    generationStartDate: row.generation.startDate,
    tags: row.projectsToTags
      .map(({ tag }) => tag.name)
      .sort((a, b) => a.localeCompare(b)),
    contributors: row.usersToProjects.map(({ user }) => ({
      id: user.id,
      nameEn: formatUserName(
        user.name,
        user.firstName,
        user.lastName,
        user.isForeigner
      ),
      nameKo: formatUserName(
        user.name,
        user.firstNameKo,
        user.lastNameKo,
        user.isForeigner,
        true
      ),
      image: user.image,
      githubId: user.githubId,
    })),
  }
}

export function projectTitle(
  project: Pick<ShowcaseProject, 'name' | 'nameKo'>,
  locale: Locale
): string {
  return locale === 'ko' ? project.nameKo || project.name : project.name
}

export function projectSummary(
  project: Pick<ShowcaseProject, 'description' | 'descriptionKo'>,
  locale: Locale
): string {
  return locale === 'ko'
    ? project.descriptionKo || project.description
    : project.description
}

export function contributorName(
  contributor: ShowcaseContributor,
  locale: Locale
): string {
  return locale === 'ko' ? contributor.nameKo : contributor.nameEn
}

export function sortShowcase(
  projects: readonly ShowcaseProject[]
): ShowcaseProject[] {
  return [...projects].sort(
    (a, b) =>
      b.generationStartDate.localeCompare(a.generationStartDate) ||
      b.updatedAt.getTime() - a.updatedAt.getTime()
  )
}

export function projectLinkValues(project: ShowcaseProject): string[] {
  return [
    ...(project.demoUrl ? ['demo'] : []),
    ...(project.repoUrl ? ['source'] : []),
  ]
}

export function projectFacets(projects: readonly ShowcaseProject[]): {
  generations: FacetOption[]
  tags: FacetOption[]
  links: { demo: number; source: number }
} {
  const generationCounts = new Map<string, { startDate: string; count: number }>()
  const tagCounts = new Map<string, number>()
  for (const project of projects) {
    const entry = generationCounts.get(project.generationName) ?? {
      startDate: project.generationStartDate,
      count: 0,
    }
    generationCounts.set(project.generationName, {
      ...entry,
      count: entry.count + 1,
    })
    for (const tag of project.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }

  return {
    generations: [...generationCounts.entries()]
      .sort(([, a], [, b]) => b.startDate.localeCompare(a.startDate))
      .map(([value, { count }]) => ({ value, label: value, count })),
    tags: [...tagCounts.entries()]
      .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
      .map(([value, count]) => ({ value, label: value, count })),
    links: {
      demo: projects.filter((project) => project.demoUrl).length,
      source: projects.filter((project) => project.repoUrl).length,
    },
  }
}

export function projectSearchText(project: ShowcaseProject): string {
  return normalizeSearchText(
    [
      project.name,
      project.nameKo,
      project.description,
      project.descriptionKo,
      project.generationName,
      ...project.tags,
      ...project.contributors.flatMap((contributor) => [
        contributor.nameEn,
        contributor.nameKo,
      ]),
    ]
      .filter(Boolean)
      .join(' ')
  )
}

/** The project after `id` in the given order, wrapping around. */
export function nextProject(
  projects: readonly ShowcaseProject[],
  id: string
): ShowcaseProject | null {
  const index = projects.findIndex((project) => project.id === id)
  if (index === -1 || projects.length < 2) return null
  return projects[(index + 1) % projects.length] ?? null
}

export function moreFromGeneration(
  projects: readonly ShowcaseProject[],
  current: ShowcaseProject,
  limit = 3
): ShowcaseProject[] {
  return projects
    .filter(
      (project) =>
        project.id !== current.id &&
        project.generationName === current.generationName
    )
    .slice(0, limit)
}
```

In `lib/server/queries/public/projects.ts`, extend the imports:

```ts
import {
  cacheQuery,
  forEachPublicLocale,
  generationListTag,
  projectGenerationTag,
  projectListTag,
  projectTag,
  tagQuery,
  uniqueStrings,
} from '@/lib/server/cache'
import {
  toShowcaseProject,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'
```

Add a shared relation config:

```ts
/** Relations both project read models load; matches `ProjectRow`. */
const PROJECT_RELATIONS = {
  generation: { columns: { id: true, name: true, startDate: true } },
  projectsToTags: {
    columns: { tagId: true },
    with: { tag: { columns: { name: true } } },
  },
  usersToProjects: {
    columns: { userId: true },
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          firstName: true,
          firstNameKo: true,
          lastName: true,
          lastNameKo: true,
          isForeigner: true,
          image: true,
          githubId: true,
        },
      },
    },
  },
} as const

const PROJECT_CARD_COLUMNS = {
  id: true,
  name: true,
  nameKo: true,
  description: true,
  descriptionKo: true,
  mainImage: true,
  repoUrl: true,
  demoUrl: true,
  createdAt: true,
  updatedAt: true,
} as const

async function getSharedProjectShowcase(): Promise<ShowcaseProject[]> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectList,
    forEachPublicLocale((locale) => [projectListTag(locale)])
  )

  const rows = await db.query.projects.findMany({
    columns: PROJECT_CARD_COLUMNS,
    with: PROJECT_RELATIONS,
    orderBy: desc(projects.updatedAt),
  })

  // Generation pages read this entry too (see sessions.ts for the reason).
  const generationNames = uniqueStrings(rows.map((row) => row.generation.name))
  tagQuery(
    forEachPublicLocale((locale) => [
      generationListTag(locale),
      ...generationNames.map((name) => projectGenerationTag(name, locale)),
    ])
  )

  return rows.map(toShowcaseProject)
}

const getProjectShowcaseForRequest = cache(() => getSharedProjectShowcase())

/** Every project with tags and contributors, for hubs, pages and counters. */
export function getProjectShowcase() {
  return getProjectShowcaseForRequest()
}
```

Rewrite the `findFirst` call in `getSharedProjectById` as:

```ts
  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      ...PROJECT_CARD_COLUMNS,
      content: true,
      contentKo: true,
      images: true,
    },
    with: PROJECT_RELATIONS,
  })
```

- [ ] **Step 4: Run them to verify they pass**

Run: the Step 2 command.
Expected: both files pass.

- [ ] **Step 5: Checkpoint**

Run: `pnpm test:types`
Expected: clean. The current project detail page still reads `usersToProjects[].user` and `generation.name`, and both are still there.
Stage: `lib/site/project-showcase.ts`, `lib/server/queries/public/projects.ts`, `tests/lib/site/project-showcase.test.ts`, `tests/lib/server/fetcher/public-fetchers.test.ts`.

---

### Task 7: Sitemap from the read models

**Files:**
- Create: `lib/site/sitemap-paths.ts`
- Modify: `lib/server/queries/public/sitemap.ts`
- Test: `tests/lib/site/sitemap-paths.test.ts`

**Interfaces:**
- Consumes: `countByGeneration`, `GenerationRef` (Task 3); `isPlaceholderImage` (Task 1); `getSessionArchive` (Task 5); `getProjectShowcase` (Task 6).
- Produces from `@/lib/site/sitemap-paths`:
  - `type SitemapPath = { path: string; lastModified?: Date; images?: string[] }`
  - `STATIC_SITEMAP_PATHS`
  - `buildSitemapPaths({ generations, sessions, projects, toAbsolute }): SitemapPath[]`

- [ ] **Step 1: Write the failing test**

`tests/lib/site/sitemap-paths.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildSitemapPaths } from '@/lib/site/sitemap-paths'

const toAbsolute = (path: string) => new URL(path, 'https://x.dev').toString()
const item = (
  id: string,
  generationName: string,
  updatedAt: string,
  mainImage = '/session-default.png'
) => ({
  id,
  generationName,
  mainImage,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date(updatedAt),
})

const generations = [
  { name: '25-26', startDate: '2025-03-01' },
  { name: '24-25', startDate: '2024-03-01' },
]

describe('buildSitemapPaths', () => {
  const paths = buildSitemapPaths({
    generations,
    sessions: [
      item('s1', '25-26', '2025-11-05T00:00:00.000Z'),
      item('s2', '25-26', '2025-12-01T00:00:00.000Z', 'https://cdn.example/s2.webp'),
    ],
    projects: [item('p1', '24-25', '2025-06-01T00:00:00.000Z', '/project-default.png')],
    toAbsolute,
  })
  const byPath = new Map(paths.map((entry) => [entry.path, entry]))

  it('keeps member pages but drops empty session and project generation pages', () => {
    expect(byPath.has('/member/25-26')).toBe(true)
    expect(byPath.has('/member/24-25')).toBe(true)
    expect(byPath.has('/session/25-26')).toBe(true)
    expect(byPath.has('/session/24-25')).toBe(false)
    expect(byPath.has('/project/24-25')).toBe(true)
    expect(byPath.has('/project/25-26')).toBe(false)
  })

  it('dates hubs and generation pages by their newest item', () => {
    expect(byPath.get('/session')?.lastModified).toEqual(
      new Date('2025-12-01T00:00:00.000Z')
    )
    expect(byPath.get('/project/24-25')?.lastModified).toEqual(
      new Date('2025-06-01T00:00:00.000Z')
    )
  })

  it('lists real cover images only', () => {
    expect(byPath.get('/session/25-26/s2')?.images).toEqual([
      'https://cdn.example/s2.webp',
    ])
    expect(byPath.get('/session/25-26/s1')).not.toHaveProperty('images')
    expect(byPath.get('/project/24-25/p1')).not.toHaveProperty('images')
  })

  it('omits lastModified rather than writing an empty one', () => {
    const empty = buildSitemapPaths({
      generations,
      sessions: [],
      projects: [],
      toAbsolute,
    })
    expect(empty.find((entry) => entry.path === '/project')).toEqual({
      path: '/project',
    })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/lib/site/sitemap-paths.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`lib/site/sitemap-paths.ts`:

```ts
import { countByGeneration, type GenerationRef } from '@/lib/site/generations'
import { isPlaceholderImage } from '@/lib/site/images'

export type SitemapPath = { path: string; lastModified?: Date; images?: string[] }

type Dated = { createdAt: Date; updatedAt: Date }

type ListedItem = Dated & { id: string; generationName: string; mainImage: string }

export const STATIC_SITEMAP_PATHS: readonly SitemapPath[] = [
  { path: '' },
  { path: '/calendar' },
  { path: '/member' },
  { path: '/privacy-policy' },
  { path: '/terms-of-service' },
  { path: '/2026-freshman-ot' },
]

const touched = (item: Dated) =>
  item.updatedAt > item.createdAt ? item.updatedAt : item.createdAt

function dated(path: string, items: readonly Dated[]): SitemapPath {
  const newest = items.reduce<Date | undefined>((latest, item) => {
    const date = touched(item)
    return !latest || date > latest ? date : latest
  }, undefined)
  return newest ? { path, lastModified: newest } : { path }
}

export function buildSitemapPaths({
  generations,
  sessions,
  projects,
  toAbsolute,
}: {
  generations: readonly GenerationRef[]
  sessions: readonly ListedItem[]
  projects: readonly ListedItem[]
  toAbsolute: (path: string) => string
}): SitemapPath[] {
  const sessionCounts = countByGeneration(sessions)
  const projectCounts = countByGeneration(projects)
  const inGeneration = (items: readonly ListedItem[], name: string) =>
    items.filter((item) => item.generationName === name)
  const detail =
    (section: 'session' | 'project') =>
    (item: ListedItem): SitemapPath => ({
      path: `/${section}/${item.generationName}/${item.id}`,
      lastModified: touched(item),
      ...(isPlaceholderImage(item.mainImage)
        ? {}
        : { images: [toAbsolute(item.mainImage)] }),
    })

  return [
    ...STATIC_SITEMAP_PATHS,
    dated('/session', sessions),
    dated('/project', projects),
    ...generations.flatMap(({ name }) => [
      { path: `/member/${name}` },
      ...(sessionCounts.get(name)
        ? [dated(`/session/${name}`, inGeneration(sessions, name))]
        : []),
      ...(projectCounts.get(name)
        ? [dated(`/project/${name}`, inGeneration(projects, name))]
        : []),
    ]),
    ...projects.map(detail('project')),
    ...sessions.map(detail('session')),
  ]
}
```

Replace `lib/server/queries/public/sitemap.ts` with:

```ts
import 'server-only'

import type { MetadataRoute } from 'next'
import { i18n } from '@/i18n-config'
import { cacheQuery, sitemapTag } from '@/lib/server/cache'
import {
  getSessionVisibilityBucket,
  publicCachePolicy,
} from '@/lib/server/cache/policy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { getAbsoluteUrl } from '@/lib/seo/metadata'
import { localizeSitemapEntries } from '@/lib/seo/sitemap'
import { buildSitemapPaths } from '@/lib/site/sitemap-paths'

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sitemap,
    i18n.locales.map((locale) => sitemapTag(locale))
  )

  const [generations, sessions, projects] = await Promise.all([
    getGenerationSummaries(i18n.defaultLocale),
    getSessionArchive(getSessionVisibilityBucket()),
    getProjectShowcase(),
  ])

  return localizeSitemapEntries(
    buildSitemapPaths({
      generations,
      sessions,
      projects,
      toAbsolute: getAbsoluteUrl,
    })
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm vitest run tests/lib/site/sitemap-paths.test.ts tests/lib/seo-metadata.test.ts`
Expected: pass.

- [ ] **Step 5: Checkpoint**

Run: `pnpm test:types && pnpm test > $W/t7-test.log 2>&1; tail -4 $W/t7-test.log`
Expected: types clean, and the suite shows no failures.
Stage: `lib/site/sitemap-paths.ts`, `lib/server/queries/public/sitemap.ts`, `tests/lib/site/sitemap-paths.test.ts`.

---
### Task 8: Tag validation and form data

**Files:**
- Create: `lib/validations/project-tags.ts`
- Modify: `lib/validations/project.ts`, `lib/server/form-data/get-project-form-data.ts`
- Test: `tests/lib/validations/project-tags.test.ts`, `tests/lib/server/project-form-data.test.ts`

**Interfaces:**
- Produces from `@/lib/validations/project-tags`:
  - `MAX_PROJECT_TAGS = 12`
  - `MAX_TAG_LENGTH = 32`
  - `dedupeTags(tags: readonly string[]): string[]`: trims, drops blanks, keeps the first spelling of case-insensitive duplicates
- Produces: `projectValidation` output gains `tags: string[]` (default `[]`, deduped, ≤ 12, each 1–32 characters, no `,` or `|`).
- Produces: `getProjectFormData(formData)` returns `tags: string[]`.

- [ ] **Step 1: Write the failing tests**

`tests/lib/validations/project-tags.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { projectValidation } from '@/lib/validations/project'
import { MAX_PROJECT_TAGS, dedupeTags } from '@/lib/validations/project-tags'

const baseProject = {
  name: 'Campus Compass',
  nameKo: '캠퍼스 나침반',
  description: 'desc',
  descriptionKo: '설명',
  content: 'content',
  contentKo: '내용',
  mainImage: '/project-default.png',
  contentImages: ['/img-1.png'],
  participants: ['user-1'],
  generationId: '1',
  repoUrl: null,
  demoUrl: null,
}

describe('dedupeTags', () => {
  it('trims, drops blanks and keeps the first spelling of duplicates', () => {
    expect(
      dedupeTags([' Next.js ', 'next.js', '', 'Firebase', 'FIREBASE'])
    ).toEqual(['Next.js', 'Firebase'])
  })
})

describe('projectValidation tags', () => {
  it('defaults to no tags', () => {
    expect(projectValidation.parse(baseProject).tags).toEqual([])
  })

  it('dedupes case-insensitively before counting', () => {
    expect(
      projectValidation.parse({ ...baseProject, tags: ['Go', 'go', 'Rust'] })
        .tags
    ).toEqual(['Go', 'Rust'])
  })

  it('rejects more than 12 distinct tags', () => {
    const tags = Array.from(
      { length: MAX_PROJECT_TAGS + 1 },
      (_, index) => `tag-${index}`
    )
    expect(projectValidation.safeParse({ ...baseProject, tags }).success).toBe(
      false
    )
  })

  it('rejects blank, overlong and delimiter-bearing tags', () => {
    for (const tag of ['   ', 'x'.repeat(33), 'a,b', 'a|b']) {
      expect(
        projectValidation.safeParse({ ...baseProject, tags: [tag] }).success
      ).toBe(false)
    }
  })
})
```

`tests/lib/server/project-form-data.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))

vi.mock('@/lib/server/logger', () => ({
  logger: { error: mockLoggerError },
}))

import getProjectFormData from '@/lib/server/form-data/get-project-form-data'

function form(entries: Record<string, string>) {
  const data = new FormData()
  data.set('participants', '[]')
  data.set('contentImages', '[]')
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

describe('getProjectFormData tags', () => {
  it('parses the tags JSON field', () => {
    expect(
      getProjectFormData(form({ tags: '["Next.js","Firebase"]' })).tags
    ).toEqual(['Next.js', 'Firebase'])
  })

  it('treats a missing field as no tags', () => {
    expect(getProjectFormData(form({})).tags).toEqual([])
  })

  it('drops non-string entries and malformed JSON', () => {
    expect(getProjectFormData(form({ tags: '[1, "Go", null]' })).tags).toEqual([
      'Go',
    ])
    expect(getProjectFormData(form({ tags: '{oops' })).tags).toEqual([])
    expect(mockLoggerError).toHaveBeenCalledWith(
      'form-data.project',
      expect.anything(),
      { field: 'tags' }
    )
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/lib/validations/project-tags.test.ts tests/lib/server/project-form-data.test.ts`
Expected:
- `Failed to resolve import "@/lib/validations/project-tags"`
- `tags` is `undefined` in the form-data test

- [ ] **Step 3: Implement**

`lib/validations/project-tags.ts`:

```ts
/*
 * Shared by the Zod schema and the admin chip input. Keep this file free of
 * Zod: the input ships to the browser.
 */
export const MAX_PROJECT_TAGS = 12
export const MAX_TAG_LENGTH = 32

export function dedupeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const tag = raw.trim()
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}
```

In `lib/validations/project.ts`, add the import and a `tags` entry at the end of the object:

```ts
import {
  MAX_PROJECT_TAGS,
  MAX_TAG_LENGTH,
  dedupeTags,
} from '@/lib/validations/project-tags'

const tagName = z
  .string()
  .trim()
  .min(1, 'Tag is required')
  .max(MAX_TAG_LENGTH, `Tags are at most ${MAX_TAG_LENGTH} characters`)
  .refine((tag) => !/[,|]/.test(tag), {
    message: 'Tags cannot contain commas or pipes',
  })
```

```ts
  tags: z
    .array(tagName)
    .default([])
    .transform(dedupeTags)
    .refine((tags) => tags.length <= MAX_PROJECT_TAGS, {
      message: `Up to ${MAX_PROJECT_TAGS} tags`,
    }),
```

In `lib/server/form-data/get-project-form-data.ts`, add a helper above the default export:

```ts
function parseStringList(formData: FormData, key: string): string[] {
  const raw = formData.get(key)
  if (typeof raw !== 'string' || raw === '') {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch (error) {
    logger.error('form-data.project', error, { field: key })
    return []
  }
}
```

Then:
- Add `tags: string[]` to the return type.
- Add `const tags = parseStringList(formData, 'tags')` before the `return`.
- Add `tags,` to the returned object.

- [ ] **Step 4: Run them to verify they pass**

Run: the Step 2 command, plus `pnpm vitest run tests/lib/validations`.
Expected: all pass, including the untouched `project-urls.test.ts` (tags default to `[]`).

- [ ] **Step 5: Checkpoint**

Run: `pnpm test:types`
Expected: clean. Both project actions still type-check, because they ignore `tags` until Task 9.
Stage: `lib/validations/project-tags.ts`, `lib/validations/project.ts`, `lib/server/form-data/get-project-form-data.ts`, `tests/lib/validations/project-tags.test.ts`, `tests/lib/server/project-form-data.test.ts`.

---

### Task 9: Admin tag editing (input, persistence, display)

**Files:**
- Create: `app/components/admin/tags-input.tsx`, `lib/server/services/project-tags.ts`
- Modify:
  - `app/(admin)/admin/projects/create/page.tsx`, `create/actions.ts`
  - `app/(admin)/admin/projects/[projectId]/edit/page.tsx`, `edit/actions.ts`
  - `app/(admin)/admin/projects/[projectId]/page.tsx`
  - `lib/server/fetcher/admin/get-project.ts`
  - `lib/admin-i18n/index.ts`
- Test: `tests/components/admin-tags-input.test.tsx`, `tests/e2e/admin-crud/projects.spec.ts`

**Interfaces:**
- Consumes: `dedupeTags`, `MAX_PROJECT_TAGS`, `MAX_TAG_LENGTH` (Task 8); `replaceRelationRows` (`@/lib/server/actions/admin`); `invalidateProjectPublicCache` (unchanged; it already refreshes list, detail and generation tags).
- Produces:
  - `TagsInput({ defaultValue: string[]; suggestions: string[] })` writes the hidden `tags` JSON field. Its text field is a `combobox` labelled with `t('tags')`.
  - `getTagNames(): Promise<string[]>`
  - `syncProjectTags(projectId: string, names: readonly string[]): Promise<void>`: case-insensitive reuse of existing tags, then replaces the `projects_to_tags` rows.
  - Admin i18n keys `tags`, `tagsSelected`, `tagsPlaceholder`, `tagsHint`, `tagsLimit`, `removeTag`.

- [ ] **Step 1: Write the failing tests**

`tests/components/admin-tags-input.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagsInput from '@/app/components/admin/tags-input'

function hiddenTags(container: HTMLElement): string[] {
  const input = container.querySelector<HTMLInputElement>('input[name="tags"]')
  return JSON.parse(input?.value ?? 'null') as string[]
}

const field = () => screen.getByRole('combobox', { name: 'Tech stack' })

describe('TagsInput', () => {
  it('adds tags on Enter and comma and skips case-insensitive duplicates', async () => {
    const user = userEvent.setup()
    const { container } = render(<TagsInput defaultValue={[]} suggestions={[]} />)

    await user.type(field(), 'Next.js{Enter}firebase,next.js{Enter}')

    expect(hiddenTags(container)).toEqual(['Next.js', 'firebase'])
    expect(
      screen.getByRole('button', { name: 'Remove tag Next.js' })
    ).toBeInTheDocument()
  })

  it('splits a pasted list', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TagsInput defaultValue={['Go']} suggestions={[]} />
    )

    await user.click(field())
    await user.paste('Rust, Zig,,go')

    expect(hiddenTags(container)).toEqual(['Go', 'Rust', 'Zig'])
  })

  it('removes the last tag with Backspace on an empty field, or any tag by its button', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TagsInput defaultValue={['Go', 'Rust', 'Zig']} suggestions={[]} />
    )

    await user.click(field())
    await user.keyboard('{Backspace}')
    expect(hiddenTags(container)).toEqual(['Go', 'Rust'])

    await user.click(screen.getByRole('button', { name: 'Remove tag Go' }))
    expect(hiddenTags(container)).toEqual(['Rust'])
  })

  it('keeps a typed tag when the field loses focus', async () => {
    const user = userEvent.setup()
    const { container } = render(<TagsInput defaultValue={[]} suggestions={[]} />)

    await user.type(field(), 'Svelte')
    await user.tab()

    expect(hiddenTags(container)).toEqual(['Svelte'])
  })

  it('stops at 12 tags and says so', () => {
    const twelve = Array.from({ length: 12 }, (_, index) => `tag-${index}`)
    const { container } = render(
      <TagsInput defaultValue={twelve} suggestions={[]} />
    )

    expect(field()).toBeDisabled()
    expect(screen.getByText('Tag limit reached (12).')).toBeInTheDocument()
    expect(hiddenTags(container)).toHaveLength(12)
  })

  it('suggests existing tags that are not chosen yet', () => {
    const { container } = render(
      <TagsInput defaultValue={['Go']} suggestions={['go', 'Kotlin']} />
    )

    expect(
      [...container.querySelectorAll('datalist option')].map((option) =>
        option.getAttribute('value')
      )
    ).toEqual(['Kotlin'])
  })
})
```

In `tests/e2e/admin-crud/projects.spec.ts`, add these lines to `createProject`, right before `await setHiddenInputValue(page, 'mainImage', …)`:

```ts
  const stack = page.getByRole('combobox', { name: /^(Tech stack|기술 스택)$/ })
  await stack.fill('Next.js')
  await stack.press('Enter')
  await stack.fill('firebase,')
  await page
    .locator('input[name="repoUrl"]')
    .fill('https://github.com/gdg-yonsei/e2e-project')
```

In the test `updates a newly created project`, directly after `await expect(page.getByText(projectName, { exact: true })).toBeVisible()`, add:

```ts
      await expect(page.getByText('Next.js', { exact: true })).toBeVisible()
      await expect(page.getByText('firebase', { exact: true })).toBeVisible()
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/components/admin-tags-input.test.tsx`
Expected: FAIL. `Failed to resolve import "@/app/components/admin/tags-input"`.

Run: `.superpowers/shared/e2e-prod.sh $W/t9-e2e-red.log tests/e2e/admin-crud/projects.spec.ts; tail -5 $W/t9-e2e-red.log`
Expected: `createProject` times out waiting for the `Tech stack` combobox (3 failed, 1 passed).

- [ ] **Step 3: Implement**

`app/components/admin/tags-input.tsx`:

```tsx
'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  MAX_PROJECT_TAGS,
  MAX_TAG_LENGTH,
  dedupeTags,
} from '@/lib/validations/project-tags'

/** Chip input for a project's tech stack; submits a JSON `tags` field. */
export default function TagsInput({
  defaultValue,
  suggestions,
}: {
  defaultValue: string[]
  suggestions: string[]
}) {
  const { t } = useAdminI18n()
  const id = useId()
  const [tags, setTags] = useState(() =>
    dedupeTags(defaultValue).slice(0, MAX_PROJECT_TAGS)
  )
  const [draft, setDraft] = useState('')
  const full = tags.length >= MAX_PROJECT_TAGS
  const chosen = new Set(tags.map((tag) => tag.toLowerCase()))

  function add(raw: string) {
    setDraft('')
    const incoming = raw
      .split(',')
      .map((part) => part.trim().slice(0, MAX_TAG_LENGTH))
      .filter(Boolean)
    if (incoming.length === 0) return
    setTags((current) =>
      dedupeTags([...current, ...incoming]).slice(0, MAX_PROJECT_TAGS)
    )
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(draft)
    } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      setTags((current) => current.slice(0, -1))
    }
  }

  return (
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <label htmlFor={id} className={'admin-field-label'}>
        {t('tags')}
      </label>
      <input hidden readOnly name={'tags'} value={JSON.stringify(tags)} />
      {tags.length > 0 && (
        <ul aria-label={t('tagsSelected')} className={'flex flex-wrap gap-2'}>
          {tags.map((tag) => (
            <li
              key={tag.toLowerCase()}
              className={
                'border-hairline bg-surface text-ink inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm'
              }
            >
              {tag}
              <button
                type={'button'}
                aria-label={`${t('removeTag')} ${tag}`}
                onClick={() =>
                  setTags((current) => current.filter((item) => item !== tag))
                }
                className={'hover:bg-canvas rounded-full p-1'}
              >
                <XMarkIcon aria-hidden={'true'} className={'size-3.5'} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        value={draft}
        list={`${id}-suggestions`}
        disabled={full}
        maxLength={MAX_TAG_LENGTH}
        autoComplete={'off'}
        placeholder={t('tagsPlaceholder')}
        aria-describedby={`${id}-hint`}
        onChange={(event) => {
          const { value } = event.target
          if (value.includes(',')) add(value)
          else setDraft(value)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        className={'admin-input'}
      />
      <datalist id={`${id}-suggestions`}>
        {suggestions
          .filter((suggestion) => !chosen.has(suggestion.toLowerCase()))
          .map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
      </datalist>
      <p id={`${id}-hint`} className={'text-xs opacity-70'}>
        {full ? t('tagsLimit') : t('tagsHint')}
      </p>
    </div>
  )
}
```

`lib/server/services/project-tags.ts`:

```ts
import 'server-only'

import { asc, eq, inArray, sql } from 'drizzle-orm'
import db from '@/db'
import { projectsToTags } from '@/db/schema/projects-to-tags'
import { tags } from '@/db/schema/tags'
import { replaceRelationRows } from '@/lib/server/actions/admin'

/** Every tag name, for the admin chip input's suggestions. */
export async function getTagNames(): Promise<string[]> {
  const rows = await db
    .select({ name: tags.name })
    .from(tags)
    .orderBy(asc(tags.name))
  return rows.map((row) => row.name)
}

const keyOf = (name: string) => name.toLowerCase()

/** Existing tags are matched case-insensitively ("next.js" reuses "Next.js"). */
async function resolveTagIds(names: readonly string[]): Promise<number[]> {
  if (names.length === 0) return []

  const lookup = () =>
    db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(inArray(sql`lower(${tags.name})`, names.map(keyOf)))

  const byKey = new Map((await lookup()).map((tag) => [keyOf(tag.name), tag.id]))
  const missing = names.filter((name) => !byKey.has(keyOf(name)))

  if (missing.length > 0) {
    // A concurrent insert of the same name is fine: conflicts are skipped
    // and the second lookup picks up whichever row won.
    await db
      .insert(tags)
      .values(missing.map((name) => ({ name })))
      .onConflictDoNothing()
    for (const tag of await lookup()) byKey.set(keyOf(tag.name), tag.id)
  }

  return names.flatMap((name) => {
    const id = byKey.get(keyOf(name))
    return id === undefined ? [] : [id]
  })
}

/** Points a project at exactly `names` (already deduped and validated). */
export async function syncProjectTags(
  projectId: string,
  names: readonly string[]
) {
  const tagIds = await resolveTagIds(names)
  await replaceRelationRows({
    deleteRows: () =>
      db.delete(projectsToTags).where(eq(projectsToTags.projectId, projectId)),
    rows: tagIds.map((tagId) => ({ projectId, tagId })),
    insertRows: (rows) => db.insert(projectsToTags).values(rows),
  })
}
```

In `create/actions.ts`:
- Import `syncProjectTags` from `@/lib/server/services/project-tags`.
- Add `tags` to the destructured `parsed.data`.
- Directly after the `insertRowsIfAny(…usersToProjects…)` call, add `await syncProjectTags(createProject.id, tags)`.

In `[projectId]/edit/actions.ts`:
- Same import and destructuring.
- Directly after the `replaceRelationRows(…usersToProjects…)` call, add `await syncProjectTags(projectId, tags)`.

In `lib/server/fetcher/admin/get-project.ts`, extend `with`:

```ts
    with: {
      usersToProjects: {
        with: {
          user: true,
        },
      },
      projectsToTags: {
        with: {
          tag: true,
        },
      },
      generation: true,
    },
```

In `create/page.tsx`:
- Import `TagsInput` from `@/app/components/admin/tags-input` and `getTagNames` from `@/lib/server/services/project-tags`.
- Replace `const membersList = await getMembers(null)` with `const [membersList, tagNames] = await Promise.all([getMembers(null), getTagNames()])`.
- Add `<TagsInput defaultValue={[]} suggestions={tagNames} />` directly after the `Demo URL` `DataInput`.

In `[projectId]/edit/page.tsx`:
- Same imports.
- Extend the second `Promise.all` to `[resolvedScope, membersList, tagNames]`, adding `getTagNames()` as the third entry.
- Add, after the `Demo URL` `DataInput`:

```tsx
        <TagsInput
          defaultValue={projectData.projectsToTags.map(({ tag }) => tag.name)}
          suggestions={tagNames}
        />
```

In `[projectId]/page.tsx`, add after the participants block:

```tsx
        <div className={'admin-form-grid-full'}>
          <div className={'admin-field-label'}>{t.tags}</div>
          <div className={'flex flex-wrap gap-2'}>
            {projectData.projectsToTags.length === 0 ? (
              <div className={'admin-field-value opacity-70'}>—</div>
            ) : (
              projectData.projectsToTags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className={
                    'border-hairline bg-surface rounded-full border px-3 py-1 text-sm'
                  }
                >
                  {tag.name}
                </span>
              ))
            )}
          </div>
        </div>
```

In `lib/admin-i18n/index.ts`, add after `participants` in `en`:

```ts
    tags: 'Tech stack',
    tagsSelected: 'Selected tags',
    tagsPlaceholder: 'Add a technology, e.g. Next.js',
    tagsHint: 'Press Enter or type a comma to add. Up to 12 tags.',
    tagsLimit: 'Tag limit reached (12).',
    removeTag: 'Remove tag',
```

And after `participants` in `ko`:

```ts
    tags: '기술 스택',
    tagsSelected: '선택한 태그',
    tagsPlaceholder: '기술을 입력하세요 (예: Next.js)',
    tagsHint: 'Enter 또는 쉼표로 추가해요. 최대 12개까지 넣을 수 있어요.',
    tagsLimit: '태그는 최대 12개예요.',
    removeTag: '태그 삭제',
```

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run tests/components/admin-tags-input.test.tsx`
Expected: `Tests  6 passed (6)`.

Run: `.superpowers/shared/e2e-prod.sh $W/t9-e2e.log tests/e2e/admin-crud/projects.spec.ts; tail -5 $W/t9-e2e.log`
Expected: `4 passed`.

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t9-test.log 2>&1; tail -4 $W/t9-test.log`
Expected: clean, with no failures.
Stage: `app/components/admin/tags-input.tsx`, `lib/server/services/project-tags.ts`, both project action files, the create, edit and detail pages, `lib/server/fetcher/admin/get-project.ts`, `lib/admin-i18n/index.ts`, `tests/components/admin-tags-input.test.tsx`, `tests/e2e/admin-crud/projects.spec.ts`.

---
### Task 10: Site primitives, content styles, page copy and View Transitions

**Files:**
- Create:
  - `types/react-canary.d.ts`
  - `lib/contents/archive-copy.ts`
  - `app/styles/site-content.css`
  - `app/components/site/{breadcrumbs,page-header,chip,empty-state,generation-strip,generation-pager,session-poster,page-transition,external-link,hub-breadcrumbs}.tsx`
- Modify: `app/globals.css` (import), `vitest.setup.ts`
- Test: `tests/components/site-primitives.test.tsx`

**Interfaces:**
- Consumes: `Hue` (Task 1); `GenerationRef`, `StripGeneration` (Task 3); `BracketPoster` (Plan 1).
- Produces, all server components unless noted:
  - `Breadcrumbs({ label, items: BreadcrumbItem[] })`, where `BreadcrumbItem = { label: string; href?: string }` and the last item is `aria-current="page"`
  - `PageHeader({ tag?, title, description?, meta? })`: the page's only `h1`
  - `Chip({ hue?, children })`
  - `EmptyState({ title, body?, action? })`
  - `GenerationStrip({ basePath: 'session' | 'project', lang, generations: readonly StripGeneration[], current?, label, emptyLabel })`
  - `GenerationPager({ basePath, lang, older, newer, label, olderLabel, newerLabel })`
  - `SessionPoster({ hue, kicker, title, date })`: `aria-hidden`
  - `PageTransition({ children })`: directional `<ViewTransition>`
  - `ExternalLink(props & { href })`: new tab, `rel="noreferrer noopener"`, arrow icon
  - `HubBreadcrumbs({ params, section: 'sessions' | 'projects' })`: async
- Produces from `@/lib/contents/archive-copy`: `archiveCommonCopy`, `sessionArchiveCopy`, `projectArchiveCopy`, with the types `ArchiveCommonCopy`, `SessionArchiveCopy`, `ProjectArchiveCopy`.
- Produces CSS classes used by Tasks 11–16 (all in `site-content.css`):
  - layout: `site-page`, `site-breadcrumbs`, `page-header*`, `site-chip`, `generation-strip`, `generation-pill*`, `generation-pager`
  - filtering: `filter-*`
  - session log: `session-log`, `log-*`
  - releases: `release-*`, `stretched-link`
  - session detail: `session-detail`, `session-head`, `session-commit`, `commit-dot`, `session-title`, `session-when`, `session-facts`, `session-media`, `session-poster*`
  - shared detail: `detail-*`, `site-gallery*`
  - case study: `case-*`, `team-*`
  - misc: `site-prose`, `empty-state*`, `skeleton-bar`, `archive-skeleton`
  - View Transition classes `nav-forward` and `nav-back`

- [ ] **Step 1: Write the failing test**

`tests/components/site-primitives.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import Chip from '@/app/components/site/chip'
import EmptyState from '@/app/components/site/empty-state'
import ExternalLink from '@/app/components/site/external-link'
import GenerationPager from '@/app/components/site/generation-pager'
import GenerationStrip from '@/app/components/site/generation-strip'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import SessionPoster from '@/app/components/site/session-poster'

describe('site primitives', () => {
  it('links every crumb but the current page', () => {
    render(
      <Breadcrumbs
        label="Breadcrumb"
        items={[
          { label: 'Home', href: '/en' },
          { label: 'Sessions', href: '/en/session' },
          { label: 'Sixth T19' },
        ]}
      />
    )
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(within(trail).getAllByRole('listitem')).toHaveLength(3)
    expect(within(trail).getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'href',
      '/en/session'
    )
    expect(within(trail).getByText('Sixth T19')).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(within(trail).queryByRole('link', { name: 'Sixth T19' })).toBeNull()
  })

  it('renders one h1 and keeps the code tag decorative', () => {
    render(
      <PageHeader tag="<log />" title="Session Log" description="Every session" />
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Session Log' })
    ).toBeInTheDocument()
    expect(screen.getByText('<log />')).toHaveAttribute('aria-hidden', 'true')
  })

  it('links generations with records and mutes empty ones', () => {
    render(
      <GenerationStrip
        basePath="session"
        lang="en"
        label="Generations"
        emptyLabel="no public records yet"
        current="25-26"
        generations={[
          { name: '26-27', count: 0 },
          { name: '25-26', count: 12 },
        ]}
      />
    )
    const strip = screen.getByRole('navigation', { name: 'Generations' })
    const current = within(strip).getByRole('link', { name: /25-26/ })

    expect(current).toHaveAttribute('href', '/en/session/25-26')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(within(strip).queryByRole('link', { name: /26-27/ })).toBeNull()
    expect(within(strip).getByText('26-27')).toHaveTextContent(
      'no public records yet'
    )
  })

  it('offers only the neighbouring generations that exist', () => {
    render(
      <GenerationPager
        basePath="project"
        lang="ko"
        label="기수"
        olderLabel="이전 기수"
        newerLabel="다음 기수"
        older={{ name: '24-25', startDate: '2024-03-01' }}
        newer={null}
      />
    )

    expect(screen.getByRole('link', { name: /이전 기수/ })).toHaveAttribute(
      'href',
      '/ko/project/24-25'
    )
    expect(screen.queryByRole('link', { name: /다음 기수/ })).toBeNull()
  })

  it('keeps the generated poster out of the accessibility tree', () => {
    const { container } = render(
      <SessionPoster
        hue="blue"
        kicker="Tech Talk"
        title="Sixth T19"
        date="Nov 4, 2025"
      />
    )

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstElementChild).toHaveAttribute('data-hue', 'blue')
  })

  it('renders chips, empty states and external links inside a transition', () => {
    render(
      <PageTransition>
        <Chip hue="green">Cloud</Chip>
        <EmptyState title="No sessions yet" body="Check back soon." />
        <ExternalLink href="https://github.com/gdg-yonsei">Source</ExternalLink>
      </PageTransition>
    )

    expect(screen.getByText('Cloud')).toHaveAttribute('data-hue', 'green')
    expect(screen.getByText('No sessions yet')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Source' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/components/site-primitives.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`types/react-canary.d.ts`:

```ts
/// <reference types="react/canary" />
```

`vitest.setup.ts`: replace the `NextLinkMockProps` type and the `next/link` mock, then add a `react` mock below them:

```ts
type NextLinkMockProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  href: string | { pathname?: string }
  children?: React.ReactNode
  prefetch?: boolean | null | 'auto'
  replace?: boolean
  scroll?: boolean
  transitionTypes?: string[]
}

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    prefetch,
    replace,
    scroll,
    transitionTypes,
    ...props
  }: NextLinkMockProps) => {
    // Router-only props never reach the DOM.
    void prefetch
    void replace
    void scroll
    void transitionTypes
    return React.createElement(
      'a',
      {
        href: typeof href === 'string' ? href : href?.pathname,
        ...props,
      },
      children
    )
  },
}))

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  // Next.js runs a React canary with <ViewTransition>; the react package
  // Vitest resolves has none, so here it renders its children unchanged.
  const PassThrough = ({ children }: { children?: React.ReactNode }) => children
  return { ...actual, ViewTransition: actual.ViewTransition ?? PassThrough }
})
```

`app/globals.css`: add `@import './styles/site-content.css';` directly after the `site-chrome.css` import.

`lib/contents/archive-copy.ts`:

```ts
import type { Locale } from '@/i18n-config'

/*
 * Copy for the Sessions and Projects pages. Server components read it
 * directly; client islands receive only the strings they need as props
 * (tests/lib/site/client-bundle-guards.test.ts).
 */

export type ArchiveCommonCopy = {
  breadcrumb: string
  home: string
  sessions: string
  projects: string
  generations: string
  noRecords: string
  olderGeneration: string
  newerGeneration: string
  filters: string
  reset: string
}

export const archiveCommonCopy: Record<Locale, ArchiveCommonCopy> = {
  en: {
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    sessions: 'Sessions',
    projects: 'Projects',
    generations: 'Generations',
    noRecords: 'no public records yet',
    olderGeneration: 'Older generation',
    newerGeneration: 'Newer generation',
    filters: 'Filters',
    reset: 'Reset filters',
  },
  ko: {
    breadcrumb: '이동 경로',
    home: '홈',
    sessions: '세션',
    projects: '프로젝트',
    generations: '기수',
    noRecords: '아직 공개된 기록이 없어요',
    olderGeneration: '이전 기수',
    newerGeneration: '다음 기수',
    filters: '필터',
    reset: '필터 초기화',
  },
}

export type SessionArchiveCopy = {
  tag: string
  hubTitle: string
  hubDescription: string
  generationTitle: string
  generationDescription: string
  countOne: string
  countMany: string
  search: string
  searchPlaceholder: string
  resultOne: string
  resultMany: string
  noResults: string
  emptyTitle: string
  emptyBody: string
  tba: string
  facetCategory: string
  facetPart: string
  facetGeneration: string
  commit: string
  date: string
  time: string
  location: string
  locationFallback: string
  generation: string
  part: string
  type: string
  related: string
  chronology: string
  previous: string
  next: string
}

export const sessionArchiveCopy: Record<Locale, SessionArchiveCopy> = {
  en: {
    tag: '<log />',
    hubTitle: 'Session Log',
    hubDescription:
      'Every public GDGoC Yonsei session in one log: tech talks, part sessions, hackathons and demo days where student developers share what they learn and build.',
    generationTitle: '{generation} Sessions',
    generationDescription:
      'Every public session GDGoC Yonsei ran in {generation}, newest first.',
    countOne: '{count} session',
    countMany: '{count} sessions',
    search: 'Search sessions',
    searchPlaceholder: 'Search by title, part or place',
    resultOne: '{count} session shown',
    resultMany: '{count} sessions shown',
    noResults: 'No sessions match these filters.',
    emptyTitle: 'No public sessions yet',
    emptyBody:
      'Sessions from this generation will appear here once they are published.',
    tba: 'Date to be announced',
    facetCategory: 'Type',
    facetPart: 'Part',
    facetGeneration: 'Generation',
    commit: 'commit',
    date: 'Date',
    time: 'Time (KST)',
    location: 'Location',
    locationFallback: 'To be announced',
    generation: 'Generation',
    part: 'Part',
    type: 'Type',
    related: 'Related sessions',
    chronology: 'Session timeline',
    previous: 'Previous session',
    next: 'Next session',
  },
  ko: {
    tag: '<log />',
    hubTitle: '세션 로그',
    hubDescription:
      'GDGoC Yonsei의 모든 공개 세션을 한곳에 모았어요. 기술 세션, 파트 세션, 해커톤과 데모데이에서 학생 개발자들이 배우고 만든 것을 나눕니다.',
    generationTitle: '{generation} 세션',
    generationDescription:
      'GDGoC Yonsei {generation} 기수의 공개 세션을 최신순으로 보여줘요.',
    countOne: '세션 {count}개',
    countMany: '세션 {count}개',
    search: '세션 검색',
    searchPlaceholder: '제목, 파트, 장소로 검색',
    resultOne: '세션 {count}개 표시 중',
    resultMany: '세션 {count}개 표시 중',
    noResults: '조건에 맞는 세션이 없어요.',
    emptyTitle: '아직 공개된 세션이 없어요',
    emptyBody: '이 기수의 세션이 공개되면 여기에 표시돼요.',
    tba: '일정 미정',
    facetCategory: '유형',
    facetPart: '파트',
    facetGeneration: '기수',
    commit: 'commit',
    date: '날짜',
    time: '시간 (KST)',
    location: '장소',
    locationFallback: '추후 공지',
    generation: '기수',
    part: '파트',
    type: '유형',
    related: '관련 세션',
    chronology: '세션 타임라인',
    previous: '이전 세션',
    next: '다음 세션',
  },
}

export type ProjectArchiveCopy = {
  tag: string
  hubTitle: string
  hubDescription: string
  generationTitle: string
  generationDescription: string
  countOne: string
  countMany: string
  search: string
  searchPlaceholder: string
  resultOne: string
  resultMany: string
  noResults: string
  emptyTitle: string
  emptyBody: string
  facetGeneration: string
  facetStack: string
  facetLinks: string
  demo: string
  source: string
  openSource: string
  team: string
  stack: string
  details: string
  allMembers: string
  links: string
  dates: string
  published: string
  updated: string
  gallery: string
  moreFrom: string
  nextProject: string
}

export const projectArchiveCopy: Record<Locale, ProjectArchiveCopy> = {
  en: {
    tag: '<releases />',
    hubTitle: 'Projects',
    hubDescription:
      'What GDGoC Yonsei members have built and shipped. Filter by generation, tech stack, live demos and open-source code.',
    generationTitle: '{generation} Projects',
    generationDescription:
      'Projects GDGoC Yonsei members built in {generation}.',
    countOne: '{count} project',
    countMany: '{count} projects',
    search: 'Search projects',
    searchPlaceholder: 'Search by name, stack or member',
    resultOne: '{count} project shown',
    resultMany: '{count} projects shown',
    noResults: 'No projects match these filters.',
    emptyTitle: 'No public projects yet',
    emptyBody:
      'Projects from this generation will appear here once they are published.',
    facetGeneration: 'Generation',
    facetStack: 'Tech stack',
    facetLinks: 'Links',
    demo: 'Live demo',
    source: 'Source',
    openSource: 'Open source',
    team: 'Team',
    stack: 'Tech stack',
    details: 'Project details',
    allMembers: 'Meet the {generation} members',
    links: 'Links',
    dates: 'Timeline',
    published: 'Published',
    updated: 'Updated',
    gallery: 'Gallery',
    moreFrom: 'More from {generation}',
    nextProject: 'Next project',
  },
  ko: {
    tag: '<releases />',
    hubTitle: '프로젝트',
    hubDescription:
      'GDGoC Yonsei 멤버들이 만들고 선보인 프로젝트예요. 기수, 기술 스택, 라이브 데모와 오픈 소스 여부로 찾아보세요.',
    generationTitle: '{generation} 프로젝트',
    generationDescription:
      'GDGoC Yonsei {generation} 기수 멤버들이 만든 프로젝트예요.',
    countOne: '프로젝트 {count}개',
    countMany: '프로젝트 {count}개',
    search: '프로젝트 검색',
    searchPlaceholder: '이름, 기술 스택, 멤버로 검색',
    resultOne: '프로젝트 {count}개 표시 중',
    resultMany: '프로젝트 {count}개 표시 중',
    noResults: '조건에 맞는 프로젝트가 없어요.',
    emptyTitle: '아직 공개된 프로젝트가 없어요',
    emptyBody: '이 기수의 프로젝트가 공개되면 여기에 표시돼요.',
    facetGeneration: '기수',
    facetStack: '기술 스택',
    facetLinks: '링크',
    demo: '라이브 데모',
    source: '소스 코드',
    openSource: '오픈 소스',
    team: '팀',
    stack: '기술 스택',
    details: '프로젝트 정보',
    allMembers: '{generation} 멤버 보기',
    links: '링크',
    dates: '기록',
    published: '공개',
    updated: '수정',
    gallery: '갤러리',
    moreFrom: '{generation} 기수의 다른 프로젝트',
    nextProject: '다음 프로젝트',
  },
}
```

`app/components/site/breadcrumbs.tsx`:

```tsx
import Link from 'next/link'

export type BreadcrumbItem = { label: string; href?: string }

/** `<nav><ol>` trail; the last item is the current page and isn't a link. */
export default function Breadcrumbs({
  label,
  items,
}: {
  label: string
  items: readonly BreadcrumbItem[]
}) {
  return (
    <nav aria-label={label} className="site-breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={`${index}:${item.label}`}>
              {item.href && !current ? (
                <Link href={item.href} transitionTypes={['nav-back']}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

`app/components/site/page-header.tsx`:

```tsx
import type { ReactNode } from 'react'

export default function PageHeader({
  tag,
  title,
  description,
  meta,
}: {
  tag?: string
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="page-header">
      {tag && (
        <p aria-hidden="true" className="page-header-tag">
          {tag}
        </p>
      )}
      <h1 className="page-header-title">{title}</h1>
      {description && <p className="page-header-description">{description}</p>}
      {meta && <div className="page-header-meta">{meta}</div>}
    </header>
  )
}
```

`app/components/site/chip.tsx`:

```tsx
import type { ReactNode } from 'react'
import type { Hue } from '@/lib/site/labels'

export default function Chip({
  hue = 'neutral',
  children,
}: {
  hue?: Hue
  children: ReactNode
}) {
  return (
    <span className="site-chip" data-hue={hue}>
      {children}
    </span>
  )
}
```

`app/components/site/empty-state.tsx`:

```tsx
import type { ReactNode } from 'react'

export default function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <p aria-hidden="true" className="empty-state-mark">
        {'< />'}
      </p>
      <p className="empty-state-title">{title}</p>
      {body && <p className="empty-state-body">{body}</p>}
      {action}
    </div>
  )
}
```

`app/components/site/generation-strip.tsx`:

```tsx
import Link from 'next/link'
import type { Locale } from '@/i18n-config'
import type { StripGeneration } from '@/lib/site/generations'

/**
 * Every generation as a pill. Ones with public records link to their page
 * (prefetched, so the click is instant); empty ones stay visible but muted.
 */
export default function GenerationStrip({
  basePath,
  lang,
  generations,
  current,
  label,
  emptyLabel,
}: {
  basePath: 'session' | 'project'
  lang: Locale
  generations: readonly StripGeneration[]
  current?: string
  label: string
  emptyLabel: string
}) {
  if (generations.length === 0) return null

  return (
    <nav aria-label={label} className="generation-strip">
      <ul>
        {generations.map(({ name, count }) => (
          <li key={name}>
            {count > 0 ? (
              <Link
                href={`/${lang}/${basePath}/${name}`}
                prefetch={true}
                aria-current={name === current ? 'page' : undefined}
                className="generation-pill"
              >
                {name}
                <span className="generation-pill-count">{count}</span>
              </Link>
            ) : (
              <span className="generation-pill" data-empty="">
                {name}
                <span className="sr-only"> — {emptyLabel}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

`app/components/site/generation-pager.tsx`:

```tsx
import Link from 'next/link'
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import type { GenerationRef } from '@/lib/site/generations'

/* Arrows are SVG icons: arrow glyphs would pull Google Sans Flex's symbols
   subset (see tests/components/common-components.test.tsx). */
export default function GenerationPager({
  basePath,
  lang,
  older,
  newer,
  label,
  olderLabel,
  newerLabel,
}: {
  basePath: 'session' | 'project'
  lang: Locale
  older: GenerationRef | null
  newer: GenerationRef | null
  label: string
  olderLabel: string
  newerLabel: string
}) {
  if (!older && !newer) return null

  return (
    <nav aria-label={label} className="generation-pager">
      {newer && (
        <Link
          href={`/${lang}/${basePath}/${newer.name}`}
          transitionTypes={['nav-back']}
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          {newerLabel} · {newer.name}
        </Link>
      )}
      {older && (
        <Link
          href={`/${lang}/${basePath}/${older.name}`}
          transitionTypes={['nav-forward']}
        >
          {olderLabel} · {older.name}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      )}
    </nav>
  )
}
```

`app/components/site/session-poster.tsx`:

```tsx
import BracketPoster from '@/app/components/site/bracket-poster'
import type { Hue } from '@/lib/site/labels'

/**
 * Stand-in artwork for sessions that only have the stock image: the
 * category colour, the halftone brackets and the title. Decorative — the
 * page's h1 already carries the title.
 */
export default function SessionPoster({
  hue,
  kicker,
  title,
  date,
}: {
  hue: Hue
  kicker: string
  title: string
  date: string
}) {
  return (
    <div aria-hidden="true" className="session-poster" data-hue={hue}>
      <span className="session-poster-bracket">
        <BracketPoster side="left" />
      </span>
      <span className="session-poster-text">
        <span className="session-poster-kicker">{kicker}</span>
        <span className="session-poster-title">{title}</span>
        <span className="session-poster-date">{date}</span>
      </span>
      <span className="session-poster-bracket">
        <BracketPoster side="right" />
      </span>
    </div>
  )
}
```

`app/components/site/page-transition.tsx`:

```tsx
import { ViewTransition, type ReactNode } from 'react'

const DIRECTIONAL = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  default: 'none',
}

/**
 * Slides page content left or right when a Link carries a `nav-forward` or
 * `nav-back` transition type (site-content.css). Layouts persist across
 * navigations, so every page wraps itself.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={DIRECTIONAL} exit={DIRECTIONAL} default="none">
      {children}
    </ViewTransition>
  )
}
```

`app/components/site/external-link.tsx`:

```tsx
import type { AnchorHTMLAttributes } from 'react'
import ArrowUpRightIcon from '@heroicons/react/24/outline/ArrowUpRightIcon'

export default function ExternalLink({
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a {...props} target="_blank" rel="noreferrer noopener">
      {children}
      <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
    </a>
  )
}
```

`app/components/site/hub-breadcrumbs.tsx`:

```tsx
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'

/**
 * "Home / Sessions". It needs `params`, so hubs render it in its own
 * Suspense leaf and keep their shared shell URL-free.
 */
export default async function HubBreadcrumbs({
  params,
  section,
}: {
  params: Promise<{ lang: string }>
  section: 'sessions' | 'projects'
}) {
  const lang = languageParamChecker((await params).lang)
  const copy = archiveCommonCopy[lang]

  return (
    <Breadcrumbs
      label={copy.breadcrumb}
      items={[{ label: copy.home, href: `/${lang}` }, { label: copy[section] }]}
    />
  )
}
```

`app/styles/site-content.css`:

```css
/* Content pages: breadcrumbs, headers, chips, generation strips, the filter
   bar, the session log, release cards, detail pages, the gallery and the
   View Transitions that connect them. */

html.site {
  /* Clearance below the floating header capsule for sticky elements. */
  --site-header-offset: 4.75rem;
}

@media (min-width: 640px) {
  html.site {
    --site-header-offset: 5.5rem;
  }
}

@layer components {
  .site-page {
    margin-inline: auto;
    width: 100%;
    max-width: 72rem;
    padding: 6.5rem 1rem 5rem;
  }

  @media (min-width: 640px) {
    .site-page {
      padding-inline: 1.5rem;
    }
  }

  /* ── Breadcrumbs ───────────────────────────────────────────── */
  .site-breadcrumbs ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.5rem;
    font-family: var(--font-code);
    font-size: 0.75rem;
    color: var(--s-fg-subtle);
  }

  .site-breadcrumbs li {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
  }

  .site-breadcrumbs li + li::before {
    content: '/' / '';
    color: var(--s-rule);
  }

  .site-breadcrumbs a {
    color: var(--s-fg-muted);
    text-decoration-line: underline;
    text-decoration-color: transparent;
    text-underline-offset: 0.25em;
    transition: text-decoration-color var(--dur-fast) var(--ease-out);
  }

  .site-breadcrumbs [aria-current='page'] {
    max-width: 28ch;
    overflow: hidden;
    color: var(--s-fg);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .site-breadcrumbs-skeleton {
    height: 1.125rem;
  }

  /* ── Page header ───────────────────────────────────────────── */
  .page-header {
    margin-top: 1.25rem;
    display: grid;
    gap: 0.75rem;
  }

  .page-header-tag {
    font-family: var(--font-code);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    color: var(--s-fg-subtle);
  }

  .page-header-title {
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 6vw, 4rem);
    font-weight: 700;
    line-height: 1.02;
    letter-spacing: -0.035em;
    font-variation-settings: 'ROND' 100;
    overflow-wrap: anywhere;
  }

  .page-header-description {
    max-width: 44rem;
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--s-fg-muted);
  }

  .page-header-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    font-family: var(--font-code);
    font-size: 0.8125rem;
    color: var(--s-fg-subtle);
  }

  /* ── Chips ─────────────────────────────────────────────────── */
  .site-chip {
    display: inline-flex;
    min-height: 1.5rem;
    max-width: 100%;
    align-items: center;
    border-radius: 9999px;
    background-color: var(--s-sheet-sunken);
    padding: 0.125rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--s-fg-muted);
    overflow-wrap: anywhere;
  }

  .site-chip[data-hue='blue'] {
    background-color: var(--s-blue-soft);
    color: var(--s-blue-ink);
  }

  .site-chip[data-hue='sky'] {
    background-color: var(--s-sky-soft);
    color: var(--s-sky-ink);
  }

  .site-chip[data-hue='red'] {
    background-color: var(--s-red-soft);
    color: var(--s-red-ink);
  }

  .site-chip[data-hue='pink'] {
    background-color: var(--s-pink-soft);
    color: var(--s-pink-ink);
  }

  .site-chip[data-hue='yellow'] {
    background-color: var(--s-yellow-soft);
    color: var(--s-yellow-ink);
  }

  .site-chip[data-hue='green'] {
    background-color: var(--s-green-soft);
    color: var(--s-green-ink);
  }

  /* ── Generation strip and pager ────────────────────────────── */
  .generation-strip {
    margin-top: 2rem;
  }

  .generation-strip ul,
  .generation-pager {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .generation-pill,
  .generation-pager a {
    display: inline-flex;
    min-height: 2.5rem;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid var(--s-rule);
    border-radius: 9999px;
    background-color: var(--s-sheet);
    padding: 0 0.875rem 0 1rem;
    font-family: var(--font-code);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--s-fg);
    transition:
      border-color var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast) var(--ease-out);
  }

  a.generation-pill[aria-current='page'] {
    border-color: var(--s-fg);
    background-color: var(--s-fg);
    color: var(--s-paper);
  }

  .generation-pill[data-empty] {
    border-style: dashed;
    background-color: transparent;
    color: var(--s-fg-subtle);
  }

  .generation-pill-count {
    border-radius: 9999px;
    background-color: var(--s-sheet-sunken);
    padding: 0.0625rem 0.4375rem;
    font-size: 0.6875rem;
    color: var(--s-fg-muted);
  }

  a.generation-pill[aria-current='page'] .generation-pill-count {
    background-color: rgb(255 255 255 / 0.16);
    color: inherit;
  }

  /* ── Filter bar ────────────────────────────────────────────── */
  .filter-bar {
    position: sticky;
    top: var(--site-header-offset);
    z-index: 5;
    margin-block: 1.5rem;
    display: grid;
    gap: 0.75rem;
    border: 1px solid var(--s-rule);
    border-radius: 1.5rem;
    background-color: color-mix(in oklab, var(--s-sheet) 94%, transparent);
    padding: 0.75rem;
    backdrop-filter: blur(10px);
  }

  .filter-search {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.5rem;
    border-radius: 9999px;
    background-color: var(--s-paper);
    padding: 0 1rem;
    color: var(--s-fg-subtle);
  }

  .filter-search:focus-within {
    outline: 2px solid #4285f4;
    outline-offset: 2px;
  }

  .filter-search input {
    min-width: 0;
    flex: 1;
    background: transparent;
    /* 16px keeps iOS from zooming into the field. */
    font-size: 1rem;
    color: var(--s-fg);
    outline: none;
  }

  .filter-facet {
    margin: 0;
    min-width: 0;
    border: 0;
    padding: 0;
  }

  .filter-legend {
    float: left;
    margin-right: 0.5rem;
    padding-top: 0.5rem;
    font-family: var(--font-code);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--s-fg-subtle);
  }

  html.site:lang(ko) .filter-legend {
    letter-spacing: 0.02em;
  }

  .filter-options {
    display: flex;
    gap: 0.375rem;
    overflow-x: auto;
    padding-block: 0.125rem;
    scrollbar-width: none;
  }

  .filter-chip {
    position: relative;
    display: inline-flex;
    min-height: 2.25rem;
    flex: none;
    cursor: pointer;
    align-items: center;
    gap: 0.375rem;
    border: 1px solid var(--s-rule);
    border-radius: 9999px;
    padding: 0 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--s-fg-muted);
    user-select: none;
  }

  .filter-chip:has(input:checked) {
    border-color: var(--s-fg);
    background-color: var(--s-fg);
    color: var(--s-paper);
  }

  .filter-chip:has(input:focus-visible) {
    outline: 2px solid #4285f4;
    outline-offset: 2px;
  }

  .filter-chip-count {
    font-family: var(--font-code);
    font-size: 0.6875rem;
    opacity: 0.7;
  }

  .filter-status {
    display: flex;
    min-height: 2.25rem;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.8125rem;
    color: var(--s-fg-muted);
  }

  .filter-reset {
    display: inline-flex;
    min-height: 2.25rem;
    align-items: center;
    gap: 0.25rem;
    border-radius: 9999px;
    padding: 0 0.75rem;
    font-weight: 600;
    color: var(--s-fg);
  }

  /* ── Session log: a git-log lane, one commit node per session ─ */
  .session-log {
    display: grid;
    gap: 3rem;
  }

  .log-generation-title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    font-variation-settings: 'ROND' 100;
  }

  .log-generation-count {
    font-family: var(--font-code);
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0;
    color: var(--s-fg-subtle);
  }

  .log-month {
    margin-top: 1.25rem;
  }

  .log-month-title {
    font-family: var(--font-code);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--s-fg-subtle);
  }

  .log-rows {
    position: relative;
    margin-top: 0.5rem;
    display: grid;
  }

  .log-rows::before {
    content: '';
    position: absolute;
    top: 0.75rem;
    bottom: 0.75rem;
    left: 0.4375rem;
    width: 2px;
    border-radius: 1px;
    background-color: var(--s-rule);
  }

  .log-entry {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    border-radius: 1.25rem;
    padding: 0.875rem 0.75rem 0.875rem 2rem;
    transition: background-color var(--dur-fast) var(--ease-out);
  }

  .log-entry:has(a:focus-visible) {
    background-color: var(--s-sheet);
    outline: 2px solid #4285f4;
    outline-offset: 2px;
  }

  .log-node {
    position: absolute;
    top: 1.3125rem;
    left: 0.125rem;
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 9999px;
    background-color: var(--s-fg-subtle);
    box-shadow: 0 0 0 3px var(--s-paper);
  }

  .log-node[data-hue='blue'] {
    background-color: #4285f4;
  }

  .log-node[data-hue='sky'] {
    background-color: #57caff;
  }

  .log-node[data-hue='red'] {
    background-color: #ea4335;
  }

  .log-node[data-hue='pink'] {
    background-color: #ff7daf;
  }

  .log-node[data-hue='yellow'] {
    background-color: #f9ab00;
  }

  .log-node[data-hue='green'] {
    background-color: #34a853;
  }

  .log-main {
    display: grid;
    min-width: 0;
    flex: 1;
    gap: 0.375rem;
  }

  .log-stamp {
    font-family: var(--font-code);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    color: var(--s-fg-subtle);
  }

  .log-title {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
  }

  .log-title a {
    outline: none;
  }

  /* Stretched link: the whole row (and the heading) navigates. */
  .log-title a::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  .log-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.5rem;
    font-size: 0.8125rem;
    color: var(--s-fg-muted);
  }

  .log-thumb {
    width: 5.5rem;
    height: 4.125rem;
    flex: none;
    border-radius: 0.875rem;
    background-color: var(--s-sheet-sunken);
    object-fit: cover;
  }

  @media (max-width: 479px) {
    .log-thumb {
      display: none;
    }
  }

  /* ── Release cards ─────────────────────────────────────────── */
  .release-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr));
  }

  @media (min-width: 1024px) {
    .release-item[data-featured] {
      grid-column: span 2;
    }
  }

  .release-card {
    position: relative;
    display: flex;
    height: 100%;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--s-rule);
    border-radius: 1.5rem;
    background-color: var(--s-sheet);
    transition:
      transform var(--dur-base) var(--ease-out),
      box-shadow var(--dur-base) var(--ease-out),
      border-color var(--dur-base) var(--ease-out);
  }

  .release-card:has(.stretched-link:focus-visible) {
    outline: 2px solid #4285f4;
    outline-offset: 3px;
  }

  .release-cover {
    position: relative;
    aspect-ratio: 16 / 10;
    background-color: var(--s-sheet-sunken);
  }

  .release-cover img {
    object-fit: cover;
  }

  .release-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.625rem;
    padding: 1rem 1.125rem 1.125rem;
  }

  .release-generation {
    font-family: var(--font-code);
    font-size: 0.75rem;
    color: var(--s-fg-subtle);
  }

  .release-title {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.015em;
    overflow-wrap: anywhere;
  }

  .release-item[data-featured] .release-title {
    font-size: clamp(1.375rem, 2.5vw, 1.75rem);
  }

  .stretched-link {
    outline: none;
  }

  .stretched-link::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .release-summary {
    display: -webkit-box;
    overflow: hidden;
    font-size: 0.9375rem;
    line-height: 1.55;
    color: var(--s-fg-muted);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .release-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .release-foot {
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }

  .release-team {
    display: flex;
  }

  .release-team li {
    display: grid;
    width: 1.875rem;
    height: 1.875rem;
    margin-left: -0.375rem;
    place-items: center;
    border: 2px solid var(--s-sheet);
    border-radius: 9999px;
    background-color: var(--s-sheet-sunken);
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--s-fg-muted);
  }

  .release-team li:first-child {
    margin-left: 0;
  }

  /* Above the stretched link so both links stay clickable. */
  .release-links {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .release-link {
    display: inline-flex;
    min-height: 2rem;
    align-items: center;
    gap: 0.25rem;
    border: 1px solid var(--s-rule);
    border-radius: 9999px;
    background-color: var(--s-sheet);
    padding: 0 0.625rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--s-fg);
  }

  /* ── Session detail ────────────────────────────────────────── */
  .session-detail {
    --hue: var(--s-fg);
  }

  .session-detail[data-hue='blue'] {
    --hue: #4285f4;
  }

  .session-detail[data-hue='sky'] {
    --hue: #57caff;
  }

  .session-detail[data-hue='red'] {
    --hue: #ea4335;
  }

  .session-detail[data-hue='pink'] {
    --hue: #ff7daf;
  }

  .session-detail[data-hue='yellow'] {
    --hue: #f9ab00;
  }

  .session-detail[data-hue='green'] {
    --hue: #34a853;
  }

  .session-head {
    margin-top: 1.5rem;
    display: grid;
    gap: 0.75rem;
    border-top: 6px solid var(--hue);
    padding-top: 1.25rem;
  }

  .session-commit {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-code);
    font-size: 0.75rem;
    color: var(--s-fg-subtle);
  }

  .commit-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background-color: var(--hue);
  }

  .session-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.03em;
    font-variation-settings: 'ROND' 100;
    overflow-wrap: anywhere;
  }

  .session-when {
    font-size: 1.0625rem;
    color: var(--s-fg-muted);
  }

  .session-facts {
    margin-top: 1.75rem;
    display: grid;
    gap: 1px;
    overflow: hidden;
    border: 1px solid var(--s-rule);
    border-radius: 1.25rem;
    background-color: var(--s-rule);
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 11rem), 1fr));
  }

  .session-facts > div {
    display: grid;
    align-content: start;
    gap: 0.25rem;
    background-color: var(--s-sheet);
    padding: 0.875rem 1rem;
  }

  .session-facts dt {
    font-family: var(--font-code);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--s-fg-subtle);
  }

  html.site:lang(ko) .session-facts dt {
    letter-spacing: 0.02em;
  }

  .session-facts dd {
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .session-facts dd a {
    text-decoration-line: underline;
    text-underline-offset: 0.2em;
  }

  .session-media {
    margin-top: 2rem;
  }

  .session-poster {
    --poster: #1e1e1e;
    position: relative;
    display: flex;
    aspect-ratio: 16 / 9;
    align-items: center;
    justify-content: center;
    gap: clamp(0.75rem, 3vw, 2rem);
    overflow: hidden;
    border-radius: 1.5rem;
    background-color: var(--poster);
    padding: 1.5rem;
    color: var(--s-on-stage);
    font-size: clamp(2.25rem, 7vw, 5rem);
  }

  .session-poster[data-hue='blue'] {
    --poster: color-mix(in oklab, #4285f4 22%, #1e1e1e);
  }

  .session-poster[data-hue='sky'] {
    --poster: color-mix(in oklab, #57caff 18%, #1e1e1e);
  }

  .session-poster[data-hue='red'] {
    --poster: color-mix(in oklab, #ea4335 22%, #1e1e1e);
  }

  .session-poster[data-hue='pink'] {
    --poster: color-mix(in oklab, #ff7daf 18%, #1e1e1e);
  }

  .session-poster[data-hue='yellow'] {
    --poster: color-mix(in oklab, #f9ab00 18%, #1e1e1e);
  }

  .session-poster[data-hue='green'] {
    --poster: color-mix(in oklab, #34a853 22%, #1e1e1e);
  }

  .session-poster-bracket {
    display: block;
    height: 1.25em;
    flex: none;
    aspect-ratio: 219.16 / 265.96;
  }

  .session-poster-text {
    display: grid;
    max-width: 22ch;
    gap: 0.5rem;
    text-align: center;
    font-size: 1rem;
  }

  .session-poster-kicker,
  .session-poster-date {
    font-family: var(--font-code);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--s-on-stage-muted);
  }

  .session-poster-title {
    font-family: var(--font-display);
    font-size: clamp(1.125rem, 3vw, 2rem);
    font-weight: 700;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  @media (max-width: 479px) {
    .session-poster {
      aspect-ratio: 4 / 3;
    }
  }

  /* ── Detail layout shared by sessions and projects ─────────── */
  .detail-columns {
    margin-top: 2.5rem;
    display: grid;
    gap: 2.5rem;
  }

  .detail-aside {
    display: grid;
    align-content: start;
    gap: 1.75rem;
  }

  @media (min-width: 1024px) {
    .detail-columns {
      grid-template-columns: minmax(0, 1fr) 20rem;
    }

    .detail-aside {
      position: sticky;
      top: calc(var(--site-header-offset) + 1rem);
      align-self: start;
    }
  }

  .detail-aside-title {
    margin-bottom: 0.625rem;
    font-family: var(--font-code);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--s-fg-subtle);
  }

  .detail-links,
  .detail-pager {
    display: grid;
    gap: 0.5rem;
  }

  .detail-links a,
  .detail-pager a {
    display: grid;
    gap: 0.25rem;
    border: 1px solid var(--s-rule);
    border-radius: 1rem;
    background-color: var(--s-sheet);
    padding: 0.75rem 1rem;
    transition: border-color var(--dur-fast) var(--ease-out);
  }

  .detail-link-title {
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .detail-link-meta,
  .detail-pager-label {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-family: var(--font-code);
    font-size: 0.6875rem;
    color: var(--s-fg-subtle);
  }

  .detail-dates {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 1rem;
    font-size: 0.875rem;
  }

  .detail-dates dt {
    color: var(--s-fg-subtle);
  }

  .detail-external {
    display: grid;
    gap: 0.5rem;
  }

  .detail-external a,
  .detail-more {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration-line: underline;
    text-underline-offset: 0.2em;
    overflow-wrap: anywhere;
  }

  .detail-more {
    margin-top: 0.75rem;
  }

  /* ── Gallery ───────────────────────────────────────────────── */
  .site-gallery {
    display: grid;
    gap: 0.75rem;
  }

  .site-gallery-track {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    border-radius: 1.5rem;
    background-color: var(--s-sheet-sunken);
    scrollbar-width: none;
  }

  .site-gallery-track:focus-visible {
    outline: 2px solid #4285f4;
    outline-offset: 3px;
  }

  .site-gallery-slide {
    position: relative;
    width: 100%;
    flex: none;
    scroll-snap-align: center;
    aspect-ratio: 4 / 3;
  }

  .site-gallery-slide img {
    object-fit: contain;
  }

  .site-gallery-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .site-gallery-button {
    display: grid;
    width: 2.5rem;
    height: 2.5rem;
    place-items: center;
    border: 1px solid var(--s-rule);
    border-radius: 9999px;
    background-color: var(--s-sheet);
    color: var(--s-fg);
  }

  .site-gallery-button:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .site-gallery-count {
    font-family: var(--font-code);
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
    color: var(--s-fg-subtle);
  }

  .site-gallery-thumbs {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  .site-gallery-thumb {
    flex: none;
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: 0.875rem;
    opacity: 0.6;
    transition:
      opacity var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);
  }

  .site-gallery-thumb[aria-current='true'] {
    border-color: var(--s-fg);
    opacity: 1;
  }

  /* ── Project case study ────────────────────────────────────── */
  .case-header {
    margin-top: 1.5rem;
    display: grid;
    gap: 1rem;
  }

  .case-kicker a {
    font-family: var(--font-code);
    font-size: 0.8125rem;
    color: var(--s-fg-subtle);
  }

  .case-lead {
    max-width: 44rem;
    font-size: 1.1875rem;
    line-height: 1.6;
    color: var(--s-fg-muted);
  }

  .case-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .case-action {
    display: inline-flex;
    min-height: 3rem;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid var(--s-rule);
    border-radius: 9999px;
    background-color: var(--s-sheet);
    padding: 0 1.25rem;
    font-weight: 600;
    color: var(--s-fg);
  }

  .case-action[data-tone='solid'] {
    border-color: var(--s-fg);
    background-color: var(--s-fg);
    color: var(--s-paper);
  }

  .case-cover {
    position: relative;
    margin-top: 2rem;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border: 1px solid var(--s-rule);
    border-radius: 1.75rem;
    background-color: var(--s-sheet-sunken);
  }

  .case-cover img {
    object-fit: cover;
  }

  .case-section {
    margin-top: 3.5rem;
  }

  .case-section-title {
    margin-bottom: 1.25rem;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    font-variation-settings: 'ROND' 100;
  }

  .case-next {
    margin-top: 3rem;
  }

  .team-list {
    display: grid;
    gap: 0.625rem;
  }

  .team-member {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .team-avatar {
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: none;
    place-items: center;
    overflow: hidden;
    border-radius: 9999px;
    background-color: var(--s-sheet-sunken);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--s-fg-muted);
  }

  .team-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .team-github {
    margin-left: auto;
    font-family: var(--font-code);
    font-size: 0.75rem;
    color: var(--s-fg-subtle);
    text-decoration-line: underline;
    text-underline-offset: 0.2em;
  }

  /* ── Prose from the admin's Markdown ───────────────────────── */
  .site-prose {
    --tw-prose-body: var(--s-fg-muted);
    --tw-prose-headings: var(--s-fg);
    --tw-prose-lead: var(--s-fg-muted);
    --tw-prose-links: var(--s-blue-ink);
    --tw-prose-bold: var(--s-fg);
    --tw-prose-counters: var(--s-fg-subtle);
    --tw-prose-bullets: var(--s-fg-subtle);
    --tw-prose-hr: var(--s-rule);
    --tw-prose-quotes: var(--s-fg);
    --tw-prose-quote-borders: var(--s-rule);
    --tw-prose-captions: var(--s-fg-subtle);
    --tw-prose-code: var(--s-fg);
    --tw-prose-pre-code: var(--s-on-stage);
    --tw-prose-pre-bg: var(--s-stage);
    --tw-prose-th-borders: var(--s-rule);
    --tw-prose-td-borders: var(--s-rule);
    overflow-wrap: anywhere;
  }

  /* ── Empty state and skeletons ─────────────────────────────── */
  .empty-state {
    display: grid;
    justify-items: center;
    gap: 0.75rem;
    border: 1px dashed var(--s-rule);
    border-radius: 1.5rem;
    padding: 3rem 1.5rem;
    text-align: center;
  }

  .empty-state-mark {
    font-family: var(--font-code);
    font-size: 1.5rem;
    color: var(--s-fg-subtle);
  }

  .empty-state-title {
    font-size: 1.125rem;
    font-weight: 700;
  }

  .empty-state-body {
    max-width: 36rem;
    color: var(--s-fg-muted);
  }

  .archive-skeleton {
    margin-top: 2rem;
    display: grid;
    gap: 1rem;
  }

  .skeleton-bar {
    display: block;
    border-radius: 0.75rem;
    background-color: var(--s-sheet-sunken);
  }
}

@media (hover: hover) {
  .site-breadcrumbs a:hover,
  .detail-external a:hover {
    text-decoration-color: currentColor;
  }

  a.generation-pill:hover,
  .generation-pager a:hover,
  .filter-chip:hover,
  .detail-links a:hover,
  .detail-pager a:hover {
    border-color: var(--s-fg-subtle);
  }

  .filter-reset:hover {
    background-color: var(--s-sheet-sunken);
  }

  .log-entry:hover {
    background-color: var(--s-sheet);
  }

  .release-link:hover,
  .case-action:hover {
    border-color: var(--s-fg);
  }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  /* "Sticker" lift: GDG's outlined style with a hard offset shadow. */
  .release-card:hover {
    transform: translate(-2px, -2px);
    border-color: var(--s-fg);
    box-shadow: 4px 4px 0 var(--s-fg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .skeleton-bar {
    animation: skeleton-pulse 1.6s var(--ease-in-out) infinite;
  }
}

@keyframes skeleton-pulse {
  50% {
    opacity: 0.55;
  }
}

/* View Transitions — directional slides between lists and detail pages with
   the header anchored (node_modules/next/dist/docs/01-app/02-guides/
   view-transitions.md). */
::view-transition {
  pointer-events: none;
}

::view-transition-group(site-header) {
  animation: none;
  z-index: 100;
}

::view-transition-old(site-header) {
  display: none;
}

::view-transition-new(site-header) {
  animation: none;
}

::view-transition-old(.nav-forward) {
  --slide-offset: -48px;
  animation:
    150ms ease-in both vt-fade reverse,
    400ms var(--ease-in-out) both vt-slide reverse;
}

::view-transition-new(.nav-forward) {
  --slide-offset: 48px;
  animation:
    210ms ease-out 150ms both vt-fade,
    400ms var(--ease-in-out) both vt-slide;
}

::view-transition-old(.nav-back) {
  --slide-offset: 48px;
  animation:
    150ms ease-in both vt-fade reverse,
    400ms var(--ease-in-out) both vt-slide reverse;
}

::view-transition-new(.nav-back) {
  --slide-offset: -48px;
  animation:
    210ms ease-out 150ms both vt-fade,
    400ms var(--ease-in-out) both vt-slide;
}

@keyframes vt-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes vt-slide {
  from {
    translate: var(--slide-offset) 0;
  }
  to {
    translate: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm vitest run tests/components/site-primitives.test.tsx`
Expected: `Tests  6 passed (6)`.

Run: `pnpm test > $W/t10-test.log 2>&1; tail -4 $W/t10-test.log`
Expected: the whole suite still passes, which shows the `react` and `next/link` mock changes are safe.

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types`
Expected: clean. `ViewTransition` resolves through the canary types.
Stage: `types/react-canary.d.ts`, `vitest.setup.ts`, `app/globals.css`, `app/styles/site-content.css`, `lib/contents/archive-copy.ts`, the ten new `app/components/site/*.tsx` files, and `tests/components/site-primitives.test.tsx`.

---

### Task 11: The filter island

**Files:**
- Create: `app/components/site/filter-bar.tsx` (client)
- Modify: `lib/site/filter-state.ts` (add `FilterBarCopy`), `lib/contents/archive-copy.ts` (add the filter-copy builders)
- Test: `tests/components/filter-bar.test.tsx`

**Interfaces:**
- Consumes: everything in `@/lib/site/filter-state` (Task 3); `countLabel` (Task 1).
- Produces:
  - `type FilterBarCopy = { label; search; searchPlaceholder; resultOne; resultMany; noResults; reset }` from `@/lib/site/filter-state`
  - `sessionFilterCopy(locale): FilterBarCopy` and `projectFilterCopy(locale): FilterBarCopy` from `@/lib/contents/archive-copy`
  - `FilterBar({ scope: string; facets: FilterFacet[]; copy: FilterBarCopy; total: number })`, with `type FilterFacet = { key: string; legend: string; mode?: FacetMode; options: FacetOption[] }` exported from the same module

FilterBar DOM contract:
- The list root has `id={scope}`.
- Each row is `[data-filter-item]`, with `data-search` (normalized) and `data-f-<key>` (values joined by `|`).
- Each group is `[data-filter-group]` and hides when no visible item is left inside it.

- [ ] **Step 1: Write the failing test**

`tests/components/filter-bar.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterBar from '@/app/components/site/filter-bar'
import type { FilterBarCopy } from '@/lib/site/filter-state'

const copy: FilterBarCopy = {
  label: 'Filters',
  search: 'Search sessions',
  searchPlaceholder: 'Search by title',
  resultOne: '{count} session shown',
  resultMany: '{count} sessions shown',
  noResults: 'No sessions match these filters.',
  reset: 'Reset filters',
}

function renderLog() {
  return render(
    <>
      <FilterBar
        scope="log"
        total={3}
        copy={copy}
        facets={[
          {
            key: 'category',
            legend: 'Type',
            options: [
              { value: 'tech_talk', label: 'Tech Talk', count: 2 },
              { value: 'hackathon', label: 'Hackathon', count: 1 },
            ],
          },
        ]}
      />
      <div id="log">
        <section data-filter-group="">
          <ol>
            <li data-filter-item="" data-search="sixth t19 cloud" data-f-category="tech_talk">
              Sixth T19
            </li>
            <li data-filter-item="" data-search="seventh t19 ui/ux" data-f-category="tech_talk">
              Seventh T19
            </li>
          </ol>
        </section>
        <section data-filter-group="">
          <ol>
            <li data-filter-item="" data-search="build day" data-f-category="hackathon">
              Build Day
            </li>
          </ol>
        </section>
      </div>
    </>
  )
}

describe('FilterBar', () => {
  afterEach(() => window.history.replaceState(null, '', '/en/session'))

  it('shows every row until a filter is chosen', () => {
    renderLog()

    expect(screen.getByText('3 sessions shown')).toBeInTheDocument()
    expect(screen.getByText('Build Day')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Reset filters' })).toBeNull()
  })

  it('filters rows in place, hides emptied groups and mirrors the URL', async () => {
    const user = userEvent.setup()
    renderLog()

    await user.click(screen.getByText('Hackathon'))

    expect(screen.getByRole('checkbox', { name: /Hackathon/ })).toBeChecked()
    expect(screen.getByText('Build Day')).toBeVisible()
    expect(screen.getByText('Sixth T19')).not.toBeVisible()
    expect(screen.getByText('Sixth T19').closest('section')).toHaveAttribute(
      'hidden'
    )
    expect(screen.getByText('1 session shown')).toBeInTheDocument()
    expect(window.location.search).toBe('?category=hackathon')
  })

  it('says when nothing matches and resets everything', async () => {
    const user = userEvent.setup()
    renderLog()

    await user.type(
      screen.getByRole('searchbox', { name: 'Search sessions' }),
      'nothing here'
    )
    expect(
      screen.getByText('No sessions match these filters.')
    ).toBeInTheDocument()
    expect(window.location.search).toBe('?q=nothing+here')

    await user.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(window.location.search).toBe('')
    expect(screen.getByText('3 sessions shown')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search sessions' })).toHaveValue(
      ''
    )
  })

  it('adopts a shared link and ignores keys it does not know', () => {
    window.history.replaceState(
      null,
      '',
      '/en/session?category=hackathon&foo=bar'
    )
    renderLog()

    expect(screen.getByRole('checkbox', { name: /Hackathon/ })).toBeChecked()
    expect(screen.getByText('Sixth T19')).not.toBeVisible()
    expect(screen.getByText('1 session shown')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/components/filter-bar.test.tsx`
Expected: FAIL. `Failed to resolve import "@/app/components/site/filter-bar"`.

- [ ] **Step 3: Implement**

Append to `lib/site/filter-state.ts`:

```ts
/** Strings the FilterBar island needs; server pages pass them as props. */
export type FilterBarCopy = {
  label: string
  search: string
  searchPlaceholder: string
  resultOne: string
  resultMany: string
  noResults: string
  reset: string
}
```

Append to `lib/contents/archive-copy.ts`:

```ts
import type { FilterBarCopy } from '@/lib/site/filter-state'

export function sessionFilterCopy(locale: Locale): FilterBarCopy {
  const copy = sessionArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  return {
    label: common.filters,
    search: copy.search,
    searchPlaceholder: copy.searchPlaceholder,
    resultOne: copy.resultOne,
    resultMany: copy.resultMany,
    noResults: copy.noResults,
    reset: common.reset,
  }
}

export function projectFilterCopy(locale: Locale): FilterBarCopy {
  const copy = projectArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  return {
    label: common.filters,
    search: copy.search,
    searchPlaceholder: copy.searchPlaceholder,
    resultOne: copy.resultOne,
    resultMany: copy.resultMany,
    noResults: copy.noResults,
    reset: common.reset,
  }
}
```

Move that `import type` line up next to the existing `Locale` import.

`app/components/site/filter-bar.tsx`:

```tsx
'use client'

import { useState, useSyncExternalStore } from 'react'
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import { countLabel } from '@/lib/site/format'
import {
  EMPTY_FILTER,
  isFilterActive,
  matchesFilter,
  parseFilterState,
  readFilterableItem,
  serializeFilterState,
  toggleFacetValue,
  type FacetMode,
  type FacetOption,
  type FilterBarCopy,
  type FilterState,
} from '@/lib/site/filter-state'

export type FilterFacet = {
  key: string
  legend: string
  mode?: FacetMode
  options: FacetOption[]
}

/*
 * The URL is the only state. The server renders every row; after hydration
 * this store applies the query string to the rows (`hidden`) and React reads
 * the result through useSyncExternalStore, so no row data is duplicated into
 * the RSC payload and no state is set inside an effect.
 */
const FILTER_EVENT = 'site:filterchange'

type Snapshot = { search: string; visible: number }

function createFilterStore(
  scope: string,
  keys: readonly string[],
  modes: Readonly<Record<string, FacetMode>>,
  total: number
) {
  const serverSnapshot: Snapshot = { search: '', visible: total }
  let snapshot = serverSnapshot
  const listeners = new Set<() => void>()

  function apply() {
    const search = window.location.search
    const state = parseFilterState(search, keys)
    const root = document.getElementById(scope)
    let visible = root ? 0 : total

    root?.querySelectorAll<HTMLElement>('[data-filter-item]').forEach((item) => {
      const show = matchesFilter(readFilterableItem(item, keys), state, modes)
      item.hidden = !show
      if (show) visible += 1
    })
    root?.querySelectorAll<HTMLElement>('[data-filter-group]').forEach((group) => {
      group.hidden =
        group.querySelector('[data-filter-item]:not([hidden])') === null
    })

    if (search !== snapshot.search || visible !== snapshot.visible) {
      snapshot = { search, visible }
      listeners.forEach((listener) => listener())
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      if (listeners.size === 1) {
        window.addEventListener('popstate', apply)
        window.addEventListener(FILTER_EVENT, apply)
      }
      apply()
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          window.removeEventListener('popstate', apply)
          window.removeEventListener(FILTER_EVENT, apply)
        }
      }
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
  }
}

function commit(state: FilterState, keys: readonly string[]) {
  const { pathname, hash } = window.location
  window.history.replaceState(
    window.history.state,
    '',
    `${pathname}${serializeFilterState(state, keys)}${hash}`
  )
  window.dispatchEvent(new Event(FILTER_EVENT))
}

export default function FilterBar({
  scope,
  facets,
  copy,
  total,
}: {
  scope: string
  facets: FilterFacet[]
  copy: FilterBarCopy
  total: number
}) {
  const keys = facets.map((facet) => facet.key)
  const [store] = useState(() =>
    createFilterStore(
      scope,
      keys,
      Object.fromEntries(facets.map((facet) => [facet.key, facet.mode ?? 'any'])),
      total
    )
  )
  const { search, visible } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  const state = parseFilterState(search, keys)

  return (
    <div role="search" aria-label={copy.label} className="filter-bar">
      <label className="filter-search">
        <MagnifyingGlassIcon aria-hidden="true" className="size-4 flex-none" />
        <span className="sr-only">{copy.search}</span>
        <input
          type="search"
          value={state.q}
          placeholder={copy.searchPlaceholder}
          enterKeyHint="search"
          onChange={(event) =>
            commit({ ...state, q: event.target.value }, keys)
          }
        />
      </label>
      {facets.map((facet) =>
        facet.options.length === 0 ? null : (
          <fieldset key={facet.key} className="filter-facet">
            <legend className="filter-legend">{facet.legend}</legend>
            <div className="filter-options">
              {facet.options.map((option) => (
                <label key={option.value} className="filter-chip">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={
                      state.selected[facet.key]?.includes(option.value) ?? false
                    }
                    onChange={() =>
                      commit(toggleFacetValue(state, facet.key, option.value), keys)
                    }
                  />
                  <span>{option.label}</span>
                  <span aria-hidden="true" className="filter-chip-count">
                    {option.count}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )
      )}
      <div className="filter-status">
        <p aria-live="polite">
          {visible === 0
            ? copy.noResults
            : countLabel(visible, copy.resultOne, copy.resultMany)}
        </p>
        {isFilterActive(state) && (
          <button
            type="button"
            className="filter-reset"
            onClick={() => commit(EMPTY_FILTER, keys)}
          >
            <XMarkIcon aria-hidden="true" className="size-4" />
            {copy.reset}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm vitest run tests/components/filter-bar.test.tsx tests/lib/site/client-bundle-guards.test.ts`
Expected: both pass. The guard confirms the island imports neither `cn` nor a copy dictionary.

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types`
Expected: clean. In particular there is no `react-hooks/set-state-in-effect` error.
Stage: `app/components/site/filter-bar.tsx`, `lib/site/filter-state.ts`, `lib/contents/archive-copy.ts`, `tests/components/filter-bar.test.tsx`.

---
### Task 12: Sessions hub — the Session Log

**Files:**
- Create: `app/components/site/session-log/session-log.tsx`, `app/components/site/session-log/session-row.tsx`
- Rewrite: `app/(home)/[lang]/session/page.tsx`
- Modify: `tests/e2e/instant-navigation.spec.ts` (the "homepage to session index" test), `scripts/verify-instant-navigation.mjs` (session index heading)
- Test: `tests/components/session-log.test.tsx`, `tests/e2e/session-log.spec.ts`

**Interfaces:**
- Consumes:
  - `getSessionArchive` (Task 5)
  - `groupSessionLog`, `sessionFacets`, `sessionTitle`, `sessionLocation`, `sessionSearchText`, `TBA_MONTH` (Task 4)
  - `countByGeneration`, `generationStrip` (Task 3)
  - `collectionPage`, `breadcrumbList` (Task 2)
  - the primitives, copy and `sessionFilterCopy` (Tasks 10–11)
- Produces:
  - `SessionLog({ id, lang, generations: LogGeneration[], copy: SessionArchiveCopy, showGenerations: boolean })`
  - `SessionRow({ session, lang, titleLevel: 3 | 4, tbaLabel })`
  - the hub shell contract: `data-testid="session-log-shell"`, an H1 of `Session Log`/`세션 로그`

- [ ] **Step 1: Write the failing tests**

`tests/components/session-log.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SessionLog from '@/app/components/site/session-log/session-log'
import { sessionArchiveCopy } from '@/lib/contents/archive-copy'
import { groupSessionLog, type LogSession } from '@/lib/site/session-log'

const sixthT19: LogSession = {
  id: 'a',
  name: 'Sixth T19',
  nameKo: '여섯 번째 T19',
  category: 'tech_talk',
  type: 'General Session',
  mainImage: '/session-default.png',
  startAt: new Date('2025-11-04T19:00:00.000Z'),
  endAt: new Date('2025-11-04T21:00:00.000Z'),
  location: 'Engineering Hall B039',
  locationKo: '공학원 B039',
  createdAt: new Date('2025-10-01T00:00:00.000Z'),
  updatedAt: new Date('2025-10-01T00:00:00.000Z'),
  partName: 'Cloud',
  generationName: '25-26',
  generationStartDate: '2025-03-01',
}

const buildDay: LogSession = {
  ...sixthT19,
  id: 'b',
  name: 'Build Day',
  category: 'hackathon',
  startAt: null,
  endAt: null,
  partName: null,
  mainImage: 'https://image.gdgyonsei.moveto.kr/sessions/b.webp',
}

describe('SessionLog', () => {
  it('nests generation sections, month headings and session rows on the hub', () => {
    render(
      <SessionLog
        id="session-log"
        lang="en"
        copy={sessionArchiveCopy.en}
        showGenerations
        generations={groupSessionLog([sixthT19, buildDay])}
      />
    )
    const generation = screen.getByRole('region', { name: /25-26/ })

    expect(
      within(generation).getByRole('heading', { level: 2, name: '25-26 2 sessions' })
    ).toBeInTheDocument()
    expect(
      within(generation).getByRole('heading', { level: 3, name: 'November 2025' })
    ).toBeInTheDocument()
    expect(
      within(generation).getByRole('heading', {
        level: 3,
        name: 'Date to be announced',
      })
    ).toBeInTheDocument()
    expect(
      within(generation).getByRole('heading', { level: 4, name: 'Sixth T19' })
    ).toBeInTheDocument()
  })

  it('writes the facets and search text the filter island reads', () => {
    render(
      <SessionLog
        id="session-log"
        lang="en"
        copy={sessionArchiveCopy.en}
        showGenerations
        generations={groupSessionLog([sixthT19, buildDay])}
      />
    )
    const link = screen.getByRole('link', { name: 'Sixth T19' })
    const row = link.closest('li')

    expect(link).toHaveAttribute('href', '/en/session/25-26/a')
    expect(row).toHaveAttribute('data-f-category', 'tech_talk')
    expect(row).toHaveAttribute('data-f-part', 'Cloud')
    expect(row).toHaveAttribute('data-f-generation', '25-26')
    expect(row?.getAttribute('data-search')).toContain('sixth t19')
    expect(screen.getByText('TUE 2025.11.04 19:00')).toHaveAttribute(
      'datetime',
      '2025-11-04T19:00:00+09:00'
    )
  })

  it('shows thumbnails only for real photos', () => {
    render(
      <SessionLog
        id="session-log"
        lang="en"
        copy={sessionArchiveCopy.en}
        showGenerations
        generations={groupSessionLog([sixthT19, buildDay])}
      />
    )

    expect(
      screen.getByRole('link', { name: 'Sixth T19' }).closest('li')?.querySelector('img')
    ).toBeNull()
    expect(
      screen.getByRole('link', { name: 'Build Day' }).closest('li')?.querySelector('img')
    ).toHaveAttribute('alt', '')
  })

  it('drops the generation level on generation pages, in Korean too', () => {
    render(
      <SessionLog
        id="session-log"
        lang="ko"
        copy={sessionArchiveCopy.ko}
        showGenerations={false}
        generations={groupSessionLog([sixthT19])}
      />
    )

    expect(screen.queryByRole('region')).toBeNull()
    expect(
      screen.getByRole('heading', { level: 2, name: '2025년 11월' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: '여섯 번째 T19' })
    ).toBeInTheDocument()
    expect(screen.getByText('공학원 B039')).toBeInTheDocument()
  })
})
```

`tests/e2e/session-log.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('session log hub', () => {
  test('lists public sessions by generation and filters them in place', async ({
    page,
  }) => {
    const seeded = await readSeededData()
    await page.goto('/en/session', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: 'Session Log' })
    ).toBeVisible()
    const row = page
      .getByRole('region', { name: new RegExp(seeded.generationName) })
      .getByRole('heading', { name: 'E2E Session', exact: true })
    await expect(row).toBeVisible()

    const filters = page.getByRole('search', { name: 'Filters' })
    await filters.getByText('Tech Talk', { exact: true }).click()
    await expect(page).toHaveURL(/\/en\/session\?category=tech_talk$/)
    await expect(row).toBeVisible()

    await filters
      .getByRole('searchbox', { name: 'Search sessions' })
      .fill('no-such-session')
    await expect(page.getByText('No sessions match these filters.')).toBeVisible()
    await expect(row).toBeHidden()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('searchbox', { name: 'Search sessions' })
    ).toHaveValue('no-such-session')
    await expect(
      page.getByRole('heading', { name: 'E2E Session', exact: true })
    ).toBeHidden()

    await page.getByRole('button', { name: 'Reset filters' }).click()
    await expect(page).toHaveURL(/\/en\/session$/)
    await expect(
      page.getByRole('heading', { name: 'E2E Session', exact: true })
    ).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/en/session', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBe(0)
  })
})
```

In `tests/e2e/instant-navigation.spec.ts`, inside `homepage to session index exposes a useful shared shell`, replace the two assertions after the header check with:

```ts
      await expect(
        page.getByRole('heading', { level: 1, name: 'Session Log' })
      ).toBeVisible()
      await expect(page.getByTestId('session-log-shell')).toBeVisible()
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/components/session-log.test.tsx`
Expected: FAIL (module not found).

Run: `.superpowers/shared/e2e-prod.sh $W/t12-e2e-red.log tests/e2e/session-log.spec.ts; tail -6 $W/t12-e2e-red.log`
Expected: the hub test fails because it finds no `Session Log` heading. The 320 px test may already pass.

- [ ] **Step 3: Implement**

`app/components/site/session-log/session-row.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/i18n-config'
import Chip from '@/app/components/site/chip'
import { formatLogStamp, toKstIso } from '@/lib/site/datetime'
import { isPlaceholderImage } from '@/lib/site/images'
import { categoryHue, categoryLabel, partHue } from '@/lib/site/labels'
import {
  sessionLocation,
  sessionSearchText,
  sessionTitle,
  type LogSession,
} from '@/lib/site/session-log'

/** One commit on the log. The title link stretches over the whole row. */
export default function SessionRow({
  session,
  lang,
  titleLevel,
  tbaLabel,
}: {
  session: LogSession
  lang: Locale
  titleLevel: 3 | 4
  tbaLabel: string
}) {
  const Title = titleLevel === 3 ? 'h3' : 'h4'
  const hue = categoryHue(session.category)
  const location = sessionLocation(session, lang)

  return (
    <li
      data-filter-item=""
      data-search={sessionSearchText(session)}
      data-f-category={session.category}
      data-f-part={session.partName ?? ''}
      data-f-generation={session.generationName}
    >
      <article className="log-entry">
        <span aria-hidden="true" className="log-node" data-hue={hue} />
        <div className="log-main">
          <p className="log-stamp">
            {session.startAt ? (
              <time dateTime={toKstIso(session.startAt)}>
                {formatLogStamp(session.startAt, lang)}
              </time>
            ) : (
              tbaLabel
            )}
          </p>
          <Title className="log-title">
            <Link
              href={`/${lang}/session/${session.generationName}/${session.id}`}
              transitionTypes={['nav-forward']}
            >
              {sessionTitle(session, lang)}
            </Link>
          </Title>
          <div className="log-meta">
            <Chip hue={hue}>{categoryLabel(session.category, lang)}</Chip>
            {session.partName && (
              <Chip hue={partHue(session.partName)}>{session.partName}</Chip>
            )}
            {location && <span>{location}</span>}
          </div>
        </div>
        {!isPlaceholderImage(session.mainImage) && (
          <Image
            src={session.mainImage}
            alt=""
            width={112}
            height={84}
            sizes="88px"
            className="log-thumb"
          />
        )}
      </article>
    </li>
  )
}
```

`app/components/site/session-log/session-log.tsx`:

```tsx
import type { Locale } from '@/i18n-config'
import type { SessionArchiveCopy } from '@/lib/contents/archive-copy'
import { formatMonthKey } from '@/lib/site/datetime'
import { countLabel } from '@/lib/site/format'
import {
  TBA_MONTH,
  type LogGeneration,
  type LogMonth,
} from '@/lib/site/session-log'
import SessionRow from './session-row'

function Months({
  months,
  lang,
  copy,
  level,
}: {
  months: LogMonth[]
  lang: Locale
  copy: SessionArchiveCopy
  level: 2 | 3
}) {
  const Heading = level === 2 ? 'h2' : 'h3'

  return months.map((month) => (
    <div key={month.key} data-filter-group="" className="log-month">
      <Heading className="log-month-title">
        {month.key === TBA_MONTH ? copy.tba : formatMonthKey(month.key, lang)}
      </Heading>
      <ol className="log-rows">
        {month.sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            lang={lang}
            titleLevel={level === 2 ? 3 : 4}
            tbaLabel={copy.tba}
          />
        ))}
      </ol>
    </div>
  ))
}

/**
 * The Session Log. Hubs show one section per generation (h2 › h3 month ›
 * h4 session); generation pages drop that level (h2 month › h3 session).
 */
export default function SessionLog({
  id,
  lang,
  generations,
  copy,
  showGenerations,
}: {
  id: string
  lang: Locale
  generations: LogGeneration[]
  copy: SessionArchiveCopy
  showGenerations: boolean
}) {
  return (
    <div id={id} className="session-log">
      {generations.map((generation) =>
        showGenerations ? (
          <section
            key={generation.name}
            data-filter-group=""
            aria-labelledby={`log-${generation.name}`}
          >
            <h2 id={`log-${generation.name}`} className="log-generation-title">
              {generation.name}{' '}
              <span className="log-generation-count">
                {countLabel(generation.count, copy.countOne, copy.countMany)}
              </span>
            </h2>
            <Months months={generation.months} lang={lang} copy={copy} level={3} />
          </section>
        ) : (
          <div key={generation.name}>
            <Months months={generation.months} lang={lang} copy={copy} level={2} />
          </div>
        )
      )}
    </div>
  )
}
```

Replace `app/(home)/[lang]/session/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import LocalizedText from '@/app/components/localized-text'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationStrip from '@/app/components/site/generation-strip'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import SessionLog from '@/app/components/site/session-log/session-log'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
  sessionFilterCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { countByGeneration, generationStrip } from '@/lib/site/generations'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import {
  groupSessionLog,
  sessionFacets,
  sessionTitle,
} from '@/lib/site/session-log'

type Props = { params: Promise<{ lang: string }> }

const en = sessionArchiveCopy.en
const ko = sessionArchiveCopy.ko

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)
  const copy = sessionArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/session',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

/*
 * The shell (header, H1, description) never reads params, so every link to
 * this route shares one instant App Shell; LocalizedText picks the language
 * with CSS. Everything URL- or data-dependent streams in below.
 */
export default function SessionHubPage({ params }: Props) {
  return (
    <PageTransition>
      <div className="site-page" data-testid="session-log-shell">
        <Suspense
          fallback={<div aria-hidden="true" className="site-breadcrumbs-skeleton" />}
        >
          <HubBreadcrumbs params={params} section="sessions" />
        </Suspense>
        <PageHeader
          tag={en.tag}
          title={<LocalizedText en={en.hubTitle} ko={ko.hubTitle} />}
          description={
            <LocalizedText en={en.hubDescription} ko={ko.hubDescription} />
          }
        />
        <Suspense fallback={<SessionHubFallback />}>
          <SessionHubContent params={params} />
        </Suspense>
      </div>
    </PageTransition>
  )
}

function SessionHubFallback() {
  return (
    <div role="status" aria-label="Loading sessions" className="archive-skeleton">
      <span className="skeleton-bar h-10 w-72 max-w-full" />
      <span className="skeleton-bar h-36 w-full rounded-3xl" />
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="skeleton-bar h-20 w-full" />
      ))}
    </div>
  )
}

async function SessionHubContent({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const copy = sessionArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [archive, generations] = await Promise.all([
    getSessionArchive(visibilityBucket),
    getGenerationSummaries(lang),
  ])
  const facets = sessionFacets(archive, lang)
  const url = getLocalizedUrl(lang, '/session')

  return (
    <>
      <JsonLd
        id="session-log-structured-data"
        data={[
          ...collectionPage({
            url,
            name: copy.hubTitle,
            description: copy.hubDescription,
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: archive.map((session) => ({
              name: sessionTitle(session, lang),
              url: getLocalizedUrl(
                lang,
                `/session/${session.generationName}/${session.id}`
              ),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.sessions, url },
          ]),
        ]}
      />
      <GenerationStrip
        basePath="session"
        lang={lang}
        label={common.generations}
        emptyLabel={common.noRecords}
        generations={generationStrip(generations, countByGeneration(archive))}
      />
      {archive.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
        </div>
      ) : (
        <>
          <FilterBar
            scope="session-log"
            total={archive.length}
            copy={sessionFilterCopy(lang)}
            facets={[
              {
                key: 'category',
                legend: copy.facetCategory,
                options: facets.categories,
              },
              { key: 'part', legend: copy.facetPart, options: facets.parts },
              {
                key: 'generation',
                legend: copy.facetGeneration,
                options: facets.generations,
              },
            ]}
          />
          <SessionLog
            id="session-log"
            lang={lang}
            copy={copy}
            showGenerations
            generations={groupSessionLog(archive)}
          />
        </>
      )}
    </>
  )
}
```

In `scripts/verify-instant-navigation.mjs`:
- Replace the `homepage -> session index` shell assertion with `page.getByRole('heading', { level: 1, name: 'Session Log' })`.
- Change its label to `'session index heading'`.
- The generation assertion `getByRole('heading', { name: 'Sessions' })` keeps working, because it matches `25-26 Sessions`.

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run tests/components/session-log.test.tsx`
Expected: `Tests  4 passed (4)`.

Run: `.superpowers/shared/e2e-prod.sh $W/t12-e2e.log tests/e2e/session-log.spec.ts tests/e2e/instant-navigation.spec.ts tests/e2e/public-route-matrix.spec.ts; tail -8 $W/t12-e2e.log`
Expected: all pass. The instant specs run here without the admin-CRUD specs, so the known revalidation issue doesn't apply.

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t12-test.log 2>&1; tail -4 $W/t12-test.log`
Expected: clean.
Stage: `app/components/site/session-log/*`, `app/(home)/[lang]/session/page.tsx`, `scripts/verify-instant-navigation.mjs`, `tests/components/session-log.test.tsx`, `tests/e2e/session-log.spec.ts`, `tests/e2e/instant-navigation.spec.ts`.

---

### Task 13: Session generation pages

**Files:**
- Rewrite: `app/(home)/[lang]/session/[generation]/page.tsx`, `app/(home)/[lang]/session/[generation]/loading.tsx`
- Modify:
  - `lib/server/queries/public/sessions.ts` (remove `getPublishedSessionsByGeneration` and its request cache)
  - `tests/lib/server/fetcher/public-fetchers.test.ts` (remove the `shares published sessions by generation across locales` test)
  - `tests/e2e/instant-navigation.spec.ts` (the "session index to a generation" test)
- Test: `tests/e2e/session-log.spec.ts` (append)

**Interfaces:**
- Consumes: `generationNeighbors` (Task 3); `GenerationPager`, `Breadcrumbs`, `PageHeader`, `EmptyState` (Task 10); `SessionLog` (Task 12); `fillTemplate` (Task 1); `createLocalizedMetadata({ noindex })` (Task 2).
- Produces:
  - an H1 of `{generation} Sessions` / `{generation} 세션`
  - `noindex, follow` when the generation has no public session
  - `role="status"` `Loading sessions` in `loading.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/session-log.spec.ts`:

```ts
test.describe('session generation pages', () => {
  test('show one generation with a trail back to the log', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto(`/en/session/${seeded.generationName}`, {
      waitUntil: 'domcontentloaded',
    })

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `${seeded.generationName} Sessions`,
      })
    ).toBeVisible()
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'Sessions' })
    ).toHaveAttribute('href', '/en/session')
    await expect(
      page.getByRole('heading', { name: 'E2E Session', exact: true })
    ).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow'
    )
  })

  test('keep empty generations reachable but out of the index', async ({
    page,
  }) => {
    const seeded = await readSeededData()
    const response = await page.goto(
      `/en/session/${seeded.secondGenerationName}`,
      { waitUntil: 'domcontentloaded' }
    )

    expect(response?.status()).toBe(200)
    await expect(page.getByText('No public sessions yet')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow'
    )
  })
})
```

The second e2e generation's only session starts in the future, so it has nothing public.

In `tests/e2e/instant-navigation.spec.ts`, inside `session index to a generation is prefetched for a likely navigation`, replace the two assertions after the header check with:

```ts
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: `${seededData.generationName} Sessions`,
        })
      ).toBeVisible()
```

- [ ] **Step 2: Run them to verify they fail**

Run: `.superpowers/shared/e2e-prod.sh $W/t13-e2e-red.log tests/e2e/session-log.spec.ts; tail -6 $W/t13-e2e-red.log`
Expected:
- `show one generation…` fails: the old page's H1 is `Sessions`, not `{generation} Sessions`
- `keep empty generations…` fails: there is no empty-state text and no `noindex`

- [ ] **Step 3: Implement**

Replace `app/(home)/[lang]/session/[generation]/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationPager from '@/app/components/site/generation-pager'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import SessionLog from '@/app/components/site/session-log/session-log'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
  sessionFilterCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { getGenerationStaticParams } from '@/lib/server/queries/public/static-params'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { fillTemplate } from '@/lib/site/format'
import { generationNeighbors } from '@/lib/site/generations'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import {
  groupSessionLog,
  sessionFacets,
  sessionTitle,
} from '@/lib/site/session-log'

type Props = {
  params: Promise<{ lang: string; generation: string }>
}

export async function generateStaticParams({
  params,
}: {
  params: { lang: string }
}) {
  return getGenerationStaticParams(languageParamChecker(params.lang))
}

async function generationSessions(generation: string) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const archive = await getSessionArchive(visibilityBucket)
  return archive.filter((session) => session.generationName === generation)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const [generations, sessions] = await Promise.all([
    getGenerationSummaries(locale),
    generationSessions(generation),
  ])

  if (!generations.some(({ name }) => name === generation)) {
    notFound()
  }

  const copy = sessionArchiveCopy[locale]
  return createLocalizedMetadata({
    locale,
    path: `/session/${generation}`,
    title: fillTemplate(copy.generationTitle, { generation }),
    description: fillTemplate(copy.generationDescription, { generation }),
    // Reachable, linked from nowhere, and not worth an index slot.
    noindex: sessions.length === 0,
  })
}

export default async function SessionGenerationPage({ params }: Props) {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const generations = await getGenerationSummaries(locale)
  const current = generations.find(({ name }) => name === generation)

  if (!current) {
    notFound()
  }

  const copy = sessionArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const { older, newer } = generationNeighbors(generations, generation)

  return (
    <PageTransition>
      <div className="site-page">
        <Breadcrumbs
          label={common.breadcrumb}
          items={[
            { label: common.home, href: `/${locale}` },
            { label: common.sessions, href: `/${locale}/session` },
            { label: generation },
          ]}
        />
        <PageHeader
          tag={copy.tag}
          title={fillTemplate(copy.generationTitle, { generation })}
          description={fillTemplate(copy.generationDescription, { generation })}
          meta={
            <>
              <span>
                {current.startDate}
                {current.endDate ? ` – ${current.endDate}` : ''}
              </span>
              <GenerationPager
                basePath="session"
                lang={locale}
                older={older}
                newer={newer}
                label={common.generations}
                olderLabel={common.olderGeneration}
                newerLabel={common.newerGeneration}
              />
            </>
          }
        />
        <Suspense fallback={<GenerationLogFallback />}>
          <SessionGenerationContent generation={generation} lang={locale} />
        </Suspense>
      </div>
    </PageTransition>
  )
}

function GenerationLogFallback() {
  return (
    <div role="status" aria-label="Loading sessions" className="archive-skeleton">
      <span className="skeleton-bar h-28 w-full rounded-3xl" />
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="skeleton-bar h-20 w-full" />
      ))}
    </div>
  )
}

async function SessionGenerationContent({
  generation,
  lang,
}: {
  generation: string
  lang: Locale
}) {
  const copy = sessionArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const sessions = await generationSessions(generation)

  if (sessions.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
      </div>
    )
  }

  const facets = sessionFacets(sessions, lang)
  const url = getLocalizedUrl(lang, `/session/${generation}`)

  return (
    <>
      <JsonLd
        id="session-generation-structured-data"
        data={[
          ...collectionPage({
            url,
            name: fillTemplate(copy.generationTitle, { generation }),
            description: fillTemplate(copy.generationDescription, { generation }),
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: sessions.map((session) => ({
              name: sessionTitle(session, lang),
              url: getLocalizedUrl(lang, `/session/${generation}/${session.id}`),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.sessions, url: getLocalizedUrl(lang, '/session') },
            { name: generation, url },
          ]),
        ]}
      />
      <FilterBar
        scope="session-log"
        total={sessions.length}
        copy={sessionFilterCopy(lang)}
        facets={[
          { key: 'category', legend: copy.facetCategory, options: facets.categories },
          { key: 'part', legend: copy.facetPart, options: facets.parts },
        ]}
      />
      <SessionLog
        id="session-log"
        lang={lang}
        copy={copy}
        showGenerations={false}
        generations={groupSessionLog(sessions)}
      />
    </>
  )
}
```

Replace `app/(home)/[lang]/session/[generation]/loading.tsx` with:

```tsx
export default function SessionGenerationLoading() {
  return (
    <div role="status" aria-label="Loading sessions" className="site-page">
      <span className="skeleton-bar h-4 w-48" />
      <span className="skeleton-bar mt-6 h-14 w-2/3" />
      <span className="skeleton-bar mt-4 h-5 w-full max-w-xl" />
      <div className="archive-skeleton">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className="skeleton-bar h-20 w-full" />
        ))}
      </div>
      <span className="sr-only">Loading sessions</span>
    </div>
  )
}
```

In `lib/server/queries/public/sessions.ts`, delete `getPublishedSessionsByGenerationForRequest`, `getSharedPublishedSessionsByGeneration` and `getPublishedSessionsByGeneration`. Nothing else uses them; confirm with `rg getPublishedSessionsByGeneration`, which should list only the test you are removing. In `tests/lib/server/fetcher/public-fetchers.test.ts`, delete the `it('shares published sessions by generation across locales', …)` block.

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run tests/lib/server/fetcher/public-fetchers.test.ts`
Expected: pass.

Run: `.superpowers/shared/e2e-prod.sh $W/t13-e2e.log tests/e2e/session-log.spec.ts tests/e2e/instant-navigation.spec.ts tests/e2e/public-route-matrix.spec.ts tests/e2e/sitemap-smoke.spec.ts; tail -8 $W/t13-e2e.log`
Expected: all pass. The sitemap smoke test now skips the empty second generation's session page.

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t13-test.log 2>&1; tail -4 $W/t13-test.log`
Expected: clean.
Stage: both generation route files, `lib/server/queries/public/sessions.ts`, `tests/lib/server/fetcher/public-fetchers.test.ts`, `tests/e2e/session-log.spec.ts`, `tests/e2e/instant-navigation.spec.ts`.

---

### Task 14: Session detail page and gallery

**Files:**
- Create: `app/components/site/session-detail/session-detail-view.tsx`
- Rewrite: `app/(home)/[lang]/session/[generation]/[sessionId]/page.tsx`, `[sessionId]/loading.tsx`
- Modify: `app/components/images-slider-controller.tsx`, `app/components/images-slider.tsx`
- Test: `tests/components/session-detail-view.test.tsx`, `tests/components/image-slider.test.tsx`, `tests/e2e/session-log.spec.ts` (append)

**Interfaces:**
- Consumes:
  - `getSessionById` (Task 5: `type`, `part.name`) and `getSessionArchive`
  - `adjacentSessions`, `relatedSessions`, `sessionTitle`, `sessionLocation` (Task 4)
  - `sessionEvent`, `sessionLearningResource`, `breadcrumbList` (Task 2)
  - the datetime helpers (Task 1)
  - `SessionPoster`, `Chip`, `Breadcrumbs`, `PageTransition` (Task 10)
- Produces:
  - `SessionDetailView({ lang, session: SessionDetail, related, previous, next, copy, common })`, where `SessionDetail = { id; title; category; description: string | null; startAt: Date | null; endAt: Date | null; location: string | null; partName: string | null; generationName; mainImage; images: string[] }`
  - the gallery exposes a `group` named after the title, `Previous image`/`Next image` buttons, a `n / total` counter, and arrow-key support on the focusable track

- [ ] **Step 1: Write the failing tests**

`tests/components/session-detail-view.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SessionDetailView, {
  type SessionDetail,
} from '@/app/components/site/session-detail/session-detail-view'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
} from '@/lib/contents/archive-copy'
import type { LogSession } from '@/lib/site/session-log'

const session: SessionDetail = {
  id: '6bf4a326-52ec-4da5-b204-9a67c7332a0f',
  title: 'Sixth T19',
  category: 'tech_talk',
  description: '## Agenda',
  startAt: new Date('2025-11-04T19:00:00.000Z'),
  endAt: new Date('2025-11-04T21:00:00.000Z'),
  location: 'Engineering Hall B039',
  partName: 'Cloud',
  generationName: '25-26',
  mainImage: '/session-default.png',
  images: [],
}

const neighbour = (id: string, name: string): LogSession => ({
  id,
  name,
  nameKo: name,
  category: 'tech_talk',
  type: null,
  mainImage: '/session-default.png',
  startAt: new Date('2025-11-11T19:00:00.000Z'),
  endAt: null,
  location: null,
  locationKo: null,
  createdAt: new Date('2025-10-01T00:00:00.000Z'),
  updatedAt: new Date('2025-10-01T00:00:00.000Z'),
  partName: 'Cloud',
  generationName: '25-26',
  generationStartDate: '2025-03-01',
})

function renderDetail(overrides: Partial<SessionDetail> = {}) {
  return render(
    <SessionDetailView
      lang="en"
      session={{ ...session, ...overrides }}
      related={[neighbour('r1', 'Cloud Run Workshop')]}
      previous={neighbour('p1', 'Fifth T19')}
      next={null}
      copy={sessionArchiveCopy.en}
      common={archiveCommonCopy.en}
    />
  )
}

describe('SessionDetailView', () => {
  it('names the page, the trail and the facts', () => {
    renderDetail()
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sixth T19' })
    ).toBeInTheDocument()
    expect(within(trail).getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'href',
      '/en/session'
    )
    expect(within(trail).getByRole('link', { name: '25-26' })).toHaveAttribute(
      'href',
      '/en/session/25-26'
    )
    expect(within(trail).getByText('Sixth T19')).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByText('19:00–21:00 KST')).toBeInTheDocument()
    expect(screen.getByText('Tuesday, November 4, 2025')).toHaveAttribute(
      'datetime',
      '2025-11-04T19:00:00+09:00'
    )
    expect(screen.getByText('6bf4a32')).toBeInTheDocument()
  })

  it('draws a poster instead of a stock photo', () => {
    const { container } = renderDetail()

    expect(container.querySelector('.session-poster')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull()
  })

  it('shows the gallery when real photos exist', () => {
    renderDetail({
      mainImage: 'https://image.gdgyonsei.moveto.kr/sessions/1.webp',
      images: ['https://image.gdgyonsei.moveto.kr/sessions/2.webp'],
    })

    expect(screen.getByRole('group', { name: 'Sixth T19' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next image' })).toBeInTheDocument()
  })

  it('says when the schedule is not set yet', () => {
    renderDetail({ startAt: null, endAt: null, location: null })

    expect(screen.getAllByText('Date to be announced').length).toBeGreaterThan(0)
    expect(screen.getByText('To be announced')).toBeInTheDocument()
  })

  it('links related sessions and the previous session', () => {
    renderDetail()

    expect(
      screen.getByRole('link', { name: /Cloud Run Workshop/ })
    ).toHaveAttribute('href', '/en/session/25-26/r1')
    expect(screen.getByRole('link', { name: /Previous session/ })).toHaveAttribute(
      'href',
      '/en/session/25-26/p1'
    )
    expect(screen.queryByRole('link', { name: /Next session/ })).toBeNull()
  })
})
```

`tests/components/image-slider.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageSliderGallery from '@/app/components/images-slider'

describe('ImageSliderGallery', () => {
  it('counts images and moves with buttons, thumbnails and arrow keys', async () => {
    const user = userEvent.setup()
    render(
      <ImageSliderGallery
        images={['/a.webp', '/b.webp', '/c.webp']}
        alt="Sixth T19"
      />
    )
    const gallery = screen.getByRole('group', { name: 'Sixth T19' })

    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous image' })).toBeDisabled()

    gallery.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('2 / 3')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Show Sixth T19 image 3' })
    )
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next image' })).toBeDisabled()
  })

  it('shows a single image without controls', () => {
    render(<ImageSliderGallery images={['/a.webp']} alt="Poster" />)

    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull()
    expect(screen.getByAltText('Poster — image 1 of 1')).toBeInTheDocument()
  })
})
```

Append to `tests/e2e/session-log.spec.ts`:

```ts
test('session pages carry a trail, KST facts and a valid Event', async ({
  page,
}) => {
  const seeded = await readSeededData()
  await page.goto(`/en/session/${seeded.generationName}/${seeded.sessionId}`, {
    waitUntil: 'domcontentloaded',
  })

  await expect(
    page.getByRole('heading', { level: 1, name: 'E2E Session' })
  ).toBeVisible()
  await expect(page).toHaveTitle(
    'E2E Session · Tech Talk · Jun 1, 2025 | GDGoC Yonsei'
  )
  await expect(
    page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: seeded.generationName })
  ).toHaveAttribute('href', `/en/session/${seeded.generationName}`)
  await expect(page.getByText('10:00–12:00 KST')).toBeVisible()

  const data = JSON.parse(
    (await page.locator('#session-structured-data').textContent()) ?? '[]'
  ) as Record<string, unknown>[]
  expect(data[0]).toMatchObject({
    '@type': 'Event',
    startDate: '2025-06-01T10:00:00+09:00',
    eventStatus: 'https://schema.org/EventScheduled',
  })
  expect(data[1]).toMatchObject({ '@type': 'BreadcrumbList' })
})
```

The seeded `E2E Session` is stored as `2025-06-01T10:00Z`–`12:00Z`, which is 10:00–12:00 in Seoul.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/components/session-detail-view.test.tsx tests/components/image-slider.test.tsx`
Expected:
- the view module fails to resolve
- the gallery test fails on `group` and on `1 / 3`

- [ ] **Step 3: Implement**

`app/components/site/session-detail/session-detail-view.tsx`:

```tsx
import Link from 'next/link'
import { ViewTransition } from 'react'
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import ImageSliderGallery from '@/app/components/images-slider'
import SafeMDX from '@/app/components/safe-mdx'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import Chip from '@/app/components/site/chip'
import SessionPoster from '@/app/components/site/session-poster'
import type {
  ArchiveCommonCopy,
  SessionArchiveCopy,
} from '@/lib/contents/archive-copy'
import {
  formatLogStamp,
  formatSessionLongDate,
  formatSessionShortDate,
  formatSessionTime,
  toKstIso,
} from '@/lib/site/datetime'
import { isPlaceholderImage } from '@/lib/site/images'
import { categoryHue, categoryLabel, partHue } from '@/lib/site/labels'
import { sessionTitle, type LogSession } from '@/lib/site/session-log'

export type SessionDetail = {
  id: string
  title: string
  category: string
  description: string | null
  startAt: Date | null
  endAt: Date | null
  location: string | null
  partName: string | null
  generationName: string
  mainImage: string
  images: string[]
}

export default function SessionDetailView({
  lang,
  session,
  related,
  previous,
  next,
  copy,
  common,
}: {
  lang: Locale
  session: SessionDetail
  related: LogSession[]
  previous: LogSession | null
  next: LogSession | null
  copy: SessionArchiveCopy
  common: ArchiveCommonCopy
}) {
  const hue = categoryHue(session.category)
  const category = categoryLabel(session.category, lang)
  const hubHref = `/${lang}/session`
  const generationHref = `${hubHref}/${session.generationName}`
  const hrefOf = (entry: LogSession) =>
    `${hubHref}/${entry.generationName}/${entry.id}`
  const photos = [session.mainImage, ...session.images].filter(
    (image) => !isPlaceholderImage(image)
  )
  const time = session.startAt
    ? `${formatSessionTime(session.startAt)}${
        session.endAt ? `–${formatSessionTime(session.endAt)}` : ''
      } KST`
    : copy.tba

  return (
    <article className="session-detail" data-hue={hue}>
      <Breadcrumbs
        label={common.breadcrumb}
        items={[
          { label: common.home, href: `/${lang}` },
          { label: common.sessions, href: hubHref },
          { label: session.generationName, href: generationHref },
          { label: session.title },
        ]}
      />
      <header className="session-head">
        <p className="session-commit">
          <span aria-hidden="true" className="commit-dot" />
          {copy.commit} <span>{session.id.slice(0, 7)}</span>
        </p>
        <ViewTransition name={`session-title-${session.id}`}>
          <h1 className="session-title">{session.title}</h1>
        </ViewTransition>
        <p className="session-when">
          {session.startAt ? (
            <time dateTime={toKstIso(session.startAt)}>
              {formatSessionLongDate(session.startAt, lang)}
            </time>
          ) : (
            copy.tba
          )}
        </p>
      </header>

      <dl className="session-facts">
        <div>
          <dt>{copy.date}</dt>
          <dd>
            {session.startAt
              ? formatSessionShortDate(session.startAt, lang)
              : copy.tba}
          </dd>
        </div>
        <div>
          <dt>{copy.time}</dt>
          <dd>{time}</dd>
        </div>
        <div>
          <dt>{copy.location}</dt>
          <dd>{session.location ?? copy.locationFallback}</dd>
        </div>
        <div>
          <dt>{copy.generation}</dt>
          <dd>
            <Link href={generationHref} transitionTypes={['nav-back']}>
              {session.generationName}
            </Link>
          </dd>
        </div>
        {session.partName && (
          <div>
            <dt>{copy.part}</dt>
            <dd>
              <Chip hue={partHue(session.partName)}>{session.partName}</Chip>
            </dd>
          </div>
        )}
        <div>
          <dt>{copy.type}</dt>
          <dd>
            <Chip hue={hue}>{category}</Chip>
          </dd>
        </div>
      </dl>

      <div className="session-media">
        {photos.length > 0 ? (
          <ImageSliderGallery images={photos} alt={session.title} />
        ) : (
          <SessionPoster
            hue={hue}
            kicker={category}
            title={session.title}
            date={
              session.startAt
                ? formatSessionShortDate(session.startAt, lang)
                : copy.tba
            }
          />
        )}
      </div>

      <div className="detail-columns">
        <div className="site-prose prose max-w-none">
          <SafeMDX source={session.description} />
        </div>
        <aside className="detail-aside">
          {related.length > 0 && (
            <section>
              <h2 className="detail-aside-title">{copy.related}</h2>
              <ul className="detail-links">
                {related.map((entry) => (
                  <li key={entry.id}>
                    <Link href={hrefOf(entry)} transitionTypes={['nav-forward']}>
                      <span className="detail-link-title">
                        {sessionTitle(entry, lang)}
                      </span>
                      {entry.startAt && (
                        <time
                          dateTime={toKstIso(entry.startAt)}
                          className="detail-link-meta"
                        >
                          {formatLogStamp(entry.startAt, lang)}
                        </time>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(previous || next) && (
            <nav aria-label={copy.chronology} className="detail-pager">
              {previous && (
                <Link
                  href={hrefOf(previous)}
                  rel="prev"
                  transitionTypes={['nav-back']}
                >
                  <span className="detail-pager-label">
                    <ArrowLeftIcon aria-hidden="true" className="size-3" />
                    {copy.previous}
                  </span>
                  <span className="detail-link-title">
                    {sessionTitle(previous, lang)}
                  </span>
                </Link>
              )}
              {next && (
                <Link
                  href={hrefOf(next)}
                  rel="next"
                  transitionTypes={['nav-forward']}
                >
                  <span className="detail-pager-label">
                    {copy.next}
                    <ArrowRightIcon aria-hidden="true" className="size-3" />
                  </span>
                  <span className="detail-link-title">
                    {sessionTitle(next, lang)}
                  </span>
                </Link>
              )}
            </nav>
          )}
        </aside>
      </div>
    </article>
  )
}
```

Replace `app/components/images-slider.tsx` with:

```tsx
import Image from 'next/image'
import ImageSliderController from '@/app/components/images-slider-controller'

export default function ImageSliderGallery({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  return (
    <ImageSliderController
      key={`${images[0] ?? 'empty'}:${images.length}`}
      alt={alt}
      slides={images.map((image, index) => (
        <Image
          key={`${image}:slide:${index}`}
          src={image}
          alt={`${alt} — image ${index + 1} of ${images.length}`}
          fill
          preload={index === 0}
          sizes="(min-width: 1152px) 720px, calc(100vw - 2rem)"
        />
      ))}
      thumbnails={images.map((image, index) => (
        <Image
          key={`${image}:thumbnail:${index}`}
          src={image}
          alt=""
          width={80}
          height={80}
          sizes="80px"
          className="size-20 object-cover"
        />
      ))}
    />
  )
}
```

Replace `app/components/images-slider-controller.tsx` with:

```tsx
'use client'

import type { KeyboardEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import ChevronLeftIcon from '@heroicons/react/24/outline/ChevronLeftIcon'
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon'

export default function ImageSliderController({
  alt,
  slides,
  thumbnails,
}: {
  alt: string
  slides: ReactNode[]
  thumbnails: ReactNode[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = slideRefs.current.findIndex(
            (slide) => slide === entry.target
          )
          if (index >= 0) setCurrentImageIndex(index)
        }
      },
      { root: scrollRef.current, threshold: 0.5 }
    )

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide)
    }

    return () => observer.disconnect()
  }, [slides.length])

  function scrollToImage(index: number) {
    const track = scrollRef.current
    if (!track) return

    setCurrentImageIndex(index)
    track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' })
  }

  function scrollByDirection(direction: -1 | 1) {
    const nextIndex = Math.min(
      slides.length - 1,
      Math.max(0, currentImageIndex + direction)
    )
    if (nextIndex !== currentImageIndex) scrollToImage(nextIndex)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    scrollByDirection(event.key === 'ArrowRight' ? 1 : -1)
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={alt}
      className="site-gallery"
    >
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="site-gallery-track"
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            ref={(element) => {
              slideRefs.current[index] = element
            }}
            className="site-gallery-slide"
          >
            {slide}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <div className="site-gallery-bar">
            <button
              type="button"
              onClick={() => scrollByDirection(-1)}
              disabled={currentImageIndex === 0}
              aria-label="Previous image"
              className="site-gallery-button"
            >
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            <p aria-hidden="true" className="site-gallery-count">
              {currentImageIndex + 1} / {slides.length}
            </p>
            <button
              type="button"
              onClick={() => scrollByDirection(1)}
              disabled={currentImageIndex === slides.length - 1}
              aria-label="Next image"
              className="site-gallery-button"
            >
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="site-gallery-thumbs">
            {thumbnails.map((thumbnail, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show ${alt} image ${index + 1}`}
                aria-current={currentImageIndex === index ? 'true' : undefined}
                onClick={() => scrollToImage(index)}
                className="site-gallery-thumb"
              >
                {thumbnail}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="sr-only" aria-live="polite">
        {`${alt} image ${currentImageIndex + 1} of ${slides.length}`}
      </p>
    </div>
  )
}
```

Replace `app/(home)/[lang]/session/[generation]/[sessionId]/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import PageTransition from '@/app/components/site/page-transition'
import SessionDetailView from '@/app/components/site/session-detail/session-detail-view'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import {
  getSessionArchive,
  getSessionById,
} from '@/lib/server/queries/public/sessions'
import {
  createLocalizedMetadata,
  getAbsoluteUrl,
  getLocalizedUrl,
  getSiteUrl,
  summarizeForMetadata,
} from '@/lib/seo/metadata'
import { formatSessionShortDate } from '@/lib/site/datetime'
import {
  breadcrumbList,
  sessionEvent,
  sessionLearningResource,
} from '@/lib/site/json-ld'
import { categoryLabel } from '@/lib/site/labels'
import {
  adjacentSessions,
  relatedSessions,
  sessionLocation,
  sessionTitle,
} from '@/lib/site/session-log'
import SessionDetailLoading from './loading'

type Props = {
  params: Promise<{ lang: string; generation: string; sessionId: string }>
}

async function loadSession(
  sessionId: string,
  generation: string,
  locale: Locale
) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [session, archive] = await Promise.all([
    getSessionById(sessionId, locale, visibilityBucket),
    getSessionArchive(visibilityBucket),
  ])

  if (!session || session.part?.generation?.name !== generation) {
    return null
  }
  return { session, archive }
}

function fallbackDescription(locale: Locale, title: string, generation: string) {
  return locale === 'ko'
    ? `GDGoC Yonsei ${generation} 기수의 ${title} 세션을 소개합니다.`
    : `Learn from ${title}, a GDGoC Yonsei ${generation} session.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation, sessionId } = await params
  const locale = languageParamChecker(lang)
  const loaded = await loadSession(sessionId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const { session } = loaded
  const title = sessionTitle(session, locale)

  return createLocalizedMetadata({
    locale,
    path: `/session/${generation}/${sessionId}`,
    // "25-26 Sixth T19 · Tech Talk · Nov 4, 2025"
    title: [
      title,
      categoryLabel(session.category, locale),
      ...(session.startAt
        ? [formatSessionShortDate(session.startAt, locale)]
        : []),
    ].join(' · '),
    description: summarizeForMetadata(
      locale === 'ko' ? session.descriptionKo : session.description,
      fallbackDescription(locale, title, generation)
    ),
    generatedSocialImage: true,
  })
}

export default async function SessionDetailPage({ params }: Props) {
  const resolved = await params

  return (
    <Suspense fallback={<SessionDetailLoading />}>
      <SessionDetail {...resolved} />
    </Suspense>
  )
}

async function SessionDetail({
  lang,
  generation,
  sessionId,
}: {
  lang: string
  generation: string
  sessionId: string
}) {
  const locale = languageParamChecker(lang)
  const loaded = await loadSession(sessionId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const { session, archive } = loaded
  const copy = sessionArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const title = sessionTitle(session, locale)
  const description =
    locale === 'ko' ? session.descriptionKo : session.description
  const location = sessionLocation(session, locale)
  const url = getLocalizedUrl(locale, `/session/${generation}/${sessionId}`)
  const summary = summarizeForMetadata(
    description,
    fallbackDescription(locale, title, generation)
  )
  const images = [session.mainImage, ...session.images].map(getAbsoluteUrl)
  const organizationId = `${getSiteUrl()}#organization`
  const entry = archive.find((item) => item.id === session.id)
  const { previous, next } = adjacentSessions(archive, session.id)

  return (
    <PageTransition>
      <div className="site-page">
        <JsonLd
          id="session-structured-data"
          data={[
            session.startAt
              ? sessionEvent({
                  url,
                  name: title,
                  description: summary,
                  images,
                  locale,
                  startAt: session.startAt,
                  endAt: session.endAt,
                  location,
                  organizer: {
                    id: organizationId,
                    name: 'GDGoC Yonsei',
                    url: getLocalizedUrl('en'),
                  },
                })
              : sessionLearningResource({
                  url,
                  name: title,
                  description: summary,
                  images,
                  locale,
                  providerId: organizationId,
                }),
            breadcrumbList([
              { name: common.home, url: getLocalizedUrl(locale) },
              { name: common.sessions, url: getLocalizedUrl(locale, '/session') },
              {
                name: generation,
                url: getLocalizedUrl(locale, `/session/${generation}`),
              },
              { name: title, url },
            ]),
          ]}
        />
        <SessionDetailView
          lang={locale}
          copy={copy}
          common={common}
          session={{
            id: session.id,
            title,
            category: session.category,
            description,
            startAt: session.startAt,
            endAt: session.endAt,
            location,
            partName: session.part?.name ?? null,
            generationName: generation,
            mainImage: session.mainImage,
            images: session.images,
          }}
          related={entry ? relatedSessions(archive, entry) : []}
          previous={previous}
          next={next}
        />
      </div>
    </PageTransition>
  )
}
```

Replace `app/(home)/[lang]/session/[generation]/[sessionId]/loading.tsx` with:

```tsx
export default function SessionDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading session details"
      className="site-page"
    >
      <span className="skeleton-bar h-4 w-64 max-w-full" />
      <div className="border-rule mt-6 grid gap-3 border-t-[6px] pt-5">
        <span className="skeleton-bar h-3 w-32" />
        <span className="skeleton-bar h-12 w-4/5" />
        <span className="skeleton-bar h-5 w-60 max-w-full" />
      </div>
      <span className="skeleton-bar mt-7 h-24 w-full" />
      <span className="skeleton-bar mt-8 aspect-video w-full rounded-3xl" />
      <span className="sr-only">Loading session details</span>
    </div>
  )
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run tests/components/session-detail-view.test.tsx tests/components/image-slider.test.tsx`
Expected: `Tests  7 passed (7)`.

Run: `.superpowers/shared/e2e-prod.sh $W/t14-e2e.log tests/e2e/session-log.spec.ts tests/e2e/instant-navigation.spec.ts tests/e2e/social-images.spec.ts; tail -8 $W/t14-e2e.log`
Expected:
- `session-log.spec.ts` and `instant-navigation.spec.ts` pass
- `social-images.spec.ts` shows only its known pre-existing failures, and the same ones as before

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t14-test.log 2>&1; tail -4 $W/t14-test.log`
Expected: clean.
Stage: `app/components/site/session-detail/session-detail-view.tsx`, `app/components/images-slider.tsx`, `app/components/images-slider-controller.tsx`, both `[sessionId]` route files, `tests/components/session-detail-view.test.tsx`, `tests/components/image-slider.test.tsx`, `tests/e2e/session-log.spec.ts`.

---
### Task 15: Projects hub and generation pages

**Files:**
- Create: `app/components/site/project-grid/project-card.tsx`, `app/components/site/project-grid/project-grid.tsx`
- Rewrite: `app/(home)/[lang]/project/page.tsx`, `[generation]/page.tsx`, `[generation]/loading.tsx`
- Modify:
  - `lib/server/queries/public/projects.ts` (remove `getProjectsByGeneration`)
  - `tests/lib/server/fetcher/public-fetchers.test.ts` (remove the `fetches project list for a generation` test)
  - `tests/e2e/instant-navigation.spec.ts` (the two project tests)
  - `scripts/verify-instant-navigation.mjs` (project index heading)
  - `tests/e2e/admin-crud/projects.spec.ts` (public card assertions)
- Test: `tests/components/project-card.test.tsx`, `tests/e2e/project-showcase.spec.ts`

**Interfaces:**
- Consumes: `getProjectShowcase` and every helper in `@/lib/site/project-showcase` (Task 6); `joinFacetValues` (Task 3); `initials`, `fillTemplate` (Task 1); the primitives, `projectFilterCopy`, `FilterBar` (Tasks 10–11).
- Produces:
  - `ProjectCard({ project, lang, copy, titleLevel: 2 | 3, featured? })`: an `li` with `data-f-generation`, `data-f-tag` and `data-f-links`, and one stretched title link
  - `ProjectGrid({ id, projects, lang, copy })`
  - the hub shell contract: `data-testid="project-showcase-shell"`, an H1 of `Projects`/`프로젝트`
  - generation page H1: `{generation} Projects` / `{generation} 프로젝트`

- [ ] **Step 1: Write the failing tests**

`tests/components/project-card.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import ProjectCard from '@/app/components/site/project-grid/project-card'
import { projectArchiveCopy } from '@/lib/contents/archive-copy'
import type { ShowcaseProject } from '@/lib/site/project-showcase'

const contributor = (id: string, nameEn: string, nameKo: string) => ({
  id,
  nameEn,
  nameKo,
  image: null,
  githubId: null,
})

const project: ShowcaseProject = {
  id: 'p1',
  name: 'Campus Compass',
  nameKo: null,
  description: 'Indoor navigation for Yonsei campus buildings.',
  descriptionKo: null,
  mainImage: '/project-default.png',
  repoUrl: 'https://github.com/gdg-yonsei/campus-compass',
  demoUrl: 'https://campus-compass.example.com',
  createdAt: new Date('2025-03-01T00:00:00.000Z'),
  updatedAt: new Date('2025-04-01T00:00:00.000Z'),
  generationName: '25-26',
  generationStartDate: '2025-03-01',
  tags: ['Firebase', 'Flutter'],
  contributors: [
    contributor('u1', 'Kim Minji', '김민지'),
    contributor('u2', 'Lee Jun', '이준'),
    contributor('u3', 'Park Sora', '박소라'),
    contributor('u4', 'Choi Dan', '최단'),
    contributor('u5', 'Jung Ha', '정하'),
  ],
}

function renderCard(lang: 'en' | 'ko' = 'en') {
  return render(
    <ul>
      <ProjectCard
        project={project}
        lang={lang}
        copy={projectArchiveCopy[lang]}
        titleLevel={2}
      />
    </ul>
  )
}

describe('ProjectCard', () => {
  it('uses one stretched title link and keeps external links separate', () => {
    const { container } = renderCard()
    const title = screen.getByRole('heading', { level: 2, name: 'Campus Compass' })

    expect(within(title).getByRole('link')).toHaveAttribute(
      'href',
      '/en/project/25-26/p1'
    )
    expect(
      screen.getByRole('link', { name: 'Live demo: Campus Compass' })
    ).toHaveAttribute('href', 'https://campus-compass.example.com')
    expect(
      screen.getByRole('link', { name: 'Source: Campus Compass' })
    ).toHaveAttribute('target', '_blank')
    expect(container.querySelectorAll('a a')).toHaveLength(0)
  })

  it('lists the stack and up to four contributors', () => {
    renderCard()
    const team = screen.getByRole('list', { name: 'Team' })

    expect(screen.getByRole('list', { name: 'Tech stack' })).toHaveTextContent(
      'FirebaseFlutter'
    )
    expect(within(team).getAllByRole('listitem')).toHaveLength(5)
    expect(team).toHaveTextContent('Kim Minji')
    expect(team).toHaveTextContent('+1')
  })

  it('writes the facets the filter island reads', () => {
    renderCard()
    const item = screen
      .getByRole('heading', { name: 'Campus Compass' })
      .closest('li[data-filter-item]')

    expect(item).toHaveAttribute('data-f-generation', '25-26')
    expect(item).toHaveAttribute('data-f-tag', 'Firebase|Flutter')
    expect(item).toHaveAttribute('data-f-links', 'demo|source')
    expect(item?.getAttribute('data-search')).toContain('campus compass')
  })

  it('falls back to English text on Korean pages', () => {
    renderCard('ko')

    expect(
      screen.getByRole('heading', { level: 2, name: 'Campus Compass' })
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '팀' })).toHaveTextContent('김민지')
  })
})
```

`tests/e2e/project-showcase.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('project showcase', () => {
  test('lists every generation and filters in place', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto('/en/project', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: 'Projects', exact: true })
    ).toBeVisible()
    const first = page.getByRole('heading', { name: 'E2E Project', exact: true })
    const second = page.getByRole('heading', {
      name: 'E2E Project 2',
      exact: true,
    })
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()

    await page
      .getByRole('search', { name: 'Filters' })
      .getByText(seeded.secondGenerationName, { exact: true })
      .click()
    await expect(page).toHaveURL(
      new RegExp(`/en/project\\?generation=${seeded.secondGenerationName}$`)
    )
    await expect(first).toBeHidden()
    await expect(second).toBeVisible()

    await page.getByRole('button', { name: 'Reset filters' }).click()
    await expect(first).toBeVisible()
  })

  test('generation pages keep a trail back to all projects', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto(`/en/project/${seeded.generationName}`, {
      waitUntil: 'domcontentloaded',
    })

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `${seeded.generationName} Projects`,
      })
    ).toBeVisible()
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'Projects' })
    ).toHaveAttribute('href', '/en/project')
    await expect(
      page.getByRole('heading', { name: 'E2E Project', exact: true })
    ).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/en/project', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBe(0)
  })
})
```

In `tests/e2e/instant-navigation.spec.ts`:
- In `homepage to project index exposes a useful shared shell`, replace the two assertions after the header check with:

```ts
      await expect(
        page.getByRole('heading', { level: 1, name: 'Projects', exact: true })
      ).toBeVisible()
      await expect(page.getByTestId('project-showcase-shell')).toBeVisible()
```

- In `project index to a generation is prefetched for a likely navigation`, replace the heading assertion with:

```ts
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: `${seededData.generationName} Projects`,
        })
      ).toBeVisible()
```

In `tests/e2e/admin-crud/projects.spec.ts`, inside `invalidates localized public caches…`, add directly after the first `/en/project/${seededData.secondGenerationName}` heading assertion:

```ts
      const card = page.getByRole('listitem').filter({
        has: page.getByRole('heading', { name: projectName, exact: true }),
      })
      await expect(card.getByText('Next.js', { exact: true })).toBeVisible()
      await expect(
        card.getByRole('link', { name: `Source: ${projectName}` })
      ).toHaveAttribute('href', 'https://github.com/gdg-yonsei/e2e-project')
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/components/project-card.test.tsx`
Expected: FAIL (module not found).

Run: `.superpowers/shared/e2e-prod.sh $W/t15-e2e-red.log tests/e2e/project-showcase.spec.ts; tail -6 $W/t15-e2e-red.log`
Expected:
- the hub test fails, because the old H1 is `Projects by Generation` and there is no Filters region
- the generation test fails, because the H1 is not `{generation} Projects`

- [ ] **Step 3: Implement**

`app/components/site/project-grid/project-card.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition } from 'react'
import type { Locale } from '@/i18n-config'
import Chip from '@/app/components/site/chip'
import ExternalLink from '@/app/components/site/external-link'
import type { ProjectArchiveCopy } from '@/lib/contents/archive-copy'
import { joinFacetValues } from '@/lib/site/filter-state'
import { initials } from '@/lib/site/format'
import {
  contributorName,
  projectLinkValues,
  projectSearchText,
  projectSummary,
  projectTitle,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'

const COVER_SIZES = '(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw'
const FEATURED_SIZES =
  '(min-width: 1024px) 740px, (min-width: 640px) 50vw, 100vw'

/**
 * A release card. The title link stretches over the card; the demo and
 * source links sit above it, so anchors are never nested.
 */
export default function ProjectCard({
  project,
  lang,
  copy,
  titleLevel,
  featured = false,
}: {
  project: ShowcaseProject
  lang: Locale
  copy: ProjectArchiveCopy
  titleLevel: 2 | 3
  featured?: boolean
}) {
  const Title = titleLevel === 2 ? 'h2' : 'h3'
  const title = projectTitle(project, lang)
  const team = project.contributors.slice(0, 4)
  const hiddenCount = project.contributors.length - team.length

  return (
    <li
      className="release-item"
      data-featured={featured ? '' : undefined}
      data-filter-item=""
      data-search={projectSearchText(project)}
      data-f-generation={project.generationName}
      data-f-tag={joinFacetValues(project.tags)}
      data-f-links={joinFacetValues(projectLinkValues(project))}
    >
      <article className="release-card">
        <div className="release-cover">
          <ViewTransition name={`project-cover-${project.id}`}>
            <Image
              src={project.mainImage}
              alt=""
              fill
              sizes={featured ? FEATURED_SIZES : COVER_SIZES}
            />
          </ViewTransition>
        </div>
        <div className="release-body">
          <p className="release-generation">{project.generationName}</p>
          <Title className="release-title">
            <Link
              href={`/${lang}/project/${project.generationName}/${project.id}`}
              className="stretched-link"
              transitionTypes={['nav-forward']}
            >
              {title}
            </Link>
          </Title>
          <p className="release-summary">{projectSummary(project, lang)}</p>
          {project.tags.length > 0 && (
            <ul aria-label={copy.stack} className="release-tags">
              {project.tags.map((tag) => (
                <li key={tag}>
                  <Chip>{tag}</Chip>
                </li>
              ))}
            </ul>
          )}
          <div className="release-foot">
            {team.length > 0 && (
              <ul aria-label={copy.team} className="release-team">
                {team.map((contributor) => {
                  const name = contributorName(contributor, lang)
                  return (
                    <li key={contributor.id}>
                      <span aria-hidden="true">{initials(name)}</span>
                      <span className="sr-only">{name}</span>
                    </li>
                  )
                })}
                {hiddenCount > 0 && <li>+{hiddenCount}</li>}
              </ul>
            )}
            {(project.demoUrl || project.repoUrl) && (
              <div className="release-links">
                {project.demoUrl && (
                  <ExternalLink href={project.demoUrl} className="release-link">
                    {copy.demo}
                    <span className="sr-only">: {title}</span>
                  </ExternalLink>
                )}
                {project.repoUrl && (
                  <ExternalLink href={project.repoUrl} className="release-link">
                    {copy.source}
                    <span className="sr-only">: {title}</span>
                  </ExternalLink>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </li>
  )
}
```

`app/components/site/project-grid/project-grid.tsx`:

```tsx
import type { Locale } from '@/i18n-config'
import type { ProjectArchiveCopy } from '@/lib/contents/archive-copy'
import type { ShowcaseProject } from '@/lib/site/project-showcase'
import ProjectCard from './project-card'

/** The newest release gets a double-width card once there are enough. */
export default function ProjectGrid({
  id,
  projects,
  lang,
  copy,
}: {
  id: string
  projects: ShowcaseProject[]
  lang: Locale
  copy: ProjectArchiveCopy
}) {
  return (
    <ul id={id} className="release-grid">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          lang={lang}
          copy={copy}
          titleLevel={2}
          featured={index === 0 && projects.length > 2}
        />
      ))}
    </ul>
  )
}
```

Replace `app/(home)/[lang]/project/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import LocalizedText from '@/app/components/localized-text'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationStrip from '@/app/components/site/generation-strip'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import ProjectGrid from '@/app/components/site/project-grid/project-grid'
import {
  archiveCommonCopy,
  projectArchiveCopy,
  projectFilterCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { countByGeneration, generationStrip } from '@/lib/site/generations'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import {
  projectFacets,
  projectTitle,
  sortShowcase,
} from '@/lib/site/project-showcase'

type Props = { params: Promise<{ lang: string }> }

const en = projectArchiveCopy.en
const ko = projectArchiveCopy.ko

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)
  const copy = projectArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/project',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

/* Same shell pattern as the Session Log: nothing above the fold reads params. */
export default function ProjectHubPage({ params }: Props) {
  return (
    <PageTransition>
      <div className="site-page" data-testid="project-showcase-shell">
        <Suspense
          fallback={<div aria-hidden="true" className="site-breadcrumbs-skeleton" />}
        >
          <HubBreadcrumbs params={params} section="projects" />
        </Suspense>
        <PageHeader
          tag={en.tag}
          title={<LocalizedText en={en.hubTitle} ko={ko.hubTitle} />}
          description={
            <LocalizedText en={en.hubDescription} ko={ko.hubDescription} />
          }
        />
        <Suspense fallback={<ProjectGridFallback />}>
          <ProjectHubContent params={params} />
        </Suspense>
      </div>
    </PageTransition>
  )
}

function ProjectGridFallback() {
  return (
    <div role="status" aria-label="Loading projects" className="archive-skeleton">
      <span className="skeleton-bar h-10 w-72 max-w-full" />
      <span className="skeleton-bar h-36 w-full rounded-3xl" />
      <div className="release-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="skeleton-bar aspect-[4/5] rounded-3xl" />
        ))}
      </div>
    </div>
  )
}

async function ProjectHubContent({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const copy = projectArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const [showcase, generations] = await Promise.all([
    getProjectShowcase(),
    getGenerationSummaries(lang),
  ])
  const projects = sortShowcase(showcase)
  const facets = projectFacets(projects)
  const url = getLocalizedUrl(lang, '/project')

  return (
    <>
      <JsonLd
        id="project-showcase-structured-data"
        data={[
          ...collectionPage({
            url,
            name: copy.hubTitle,
            description: copy.hubDescription,
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: projects.map((project) => ({
              name: projectTitle(project, lang),
              url: getLocalizedUrl(
                lang,
                `/project/${project.generationName}/${project.id}`
              ),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.projects, url },
          ]),
        ]}
      />
      <GenerationStrip
        basePath="project"
        lang={lang}
        label={common.generations}
        emptyLabel={common.noRecords}
        generations={generationStrip(generations, countByGeneration(projects))}
      />
      {projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
        </div>
      ) : (
        <>
          <FilterBar
            scope="project-grid"
            total={projects.length}
            copy={projectFilterCopy(lang)}
            facets={[
              {
                key: 'generation',
                legend: copy.facetGeneration,
                options: facets.generations,
              },
              { key: 'tag', legend: copy.facetStack, options: facets.tags },
              {
                key: 'links',
                legend: copy.facetLinks,
                mode: 'all',
                options: [
                  { value: 'demo', label: copy.demo, count: facets.links.demo },
                  {
                    value: 'source',
                    label: copy.openSource,
                    count: facets.links.source,
                  },
                ].filter((option) => option.count > 0),
              },
            ]}
          />
          <ProjectGrid
            id="project-grid"
            lang={lang}
            copy={copy}
            projects={projects}
          />
        </>
      )}
    </>
  )
}
```

Replace `app/(home)/[lang]/project/[generation]/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationPager from '@/app/components/site/generation-pager'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import ProjectGrid from '@/app/components/site/project-grid/project-grid'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  projectArchiveCopy,
  projectFilterCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import { getGenerationStaticParams } from '@/lib/server/queries/public/static-params'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { fillTemplate } from '@/lib/site/format'
import { generationNeighbors } from '@/lib/site/generations'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import {
  projectFacets,
  projectTitle,
  sortShowcase,
} from '@/lib/site/project-showcase'

type Props = {
  params: Promise<{ lang: string; generation: string }>
}

export async function generateStaticParams({
  params,
}: {
  params: { lang: string }
}) {
  return getGenerationStaticParams(languageParamChecker(params.lang))
}

async function generationProjects(generation: string) {
  return sortShowcase(await getProjectShowcase()).filter(
    (project) => project.generationName === generation
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const [generations, projects] = await Promise.all([
    getGenerationSummaries(locale),
    generationProjects(generation),
  ])

  if (!generations.some(({ name }) => name === generation)) {
    notFound()
  }

  const copy = projectArchiveCopy[locale]
  return createLocalizedMetadata({
    locale,
    path: `/project/${generation}`,
    title: fillTemplate(copy.generationTitle, { generation }),
    description: fillTemplate(copy.generationDescription, { generation }),
    noindex: projects.length === 0,
  })
}

export default async function ProjectGenerationPage({ params }: Props) {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const generations = await getGenerationSummaries(locale)
  const current = generations.find(({ name }) => name === generation)

  if (!current) {
    notFound()
  }

  const copy = projectArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const { older, newer } = generationNeighbors(generations, generation)

  return (
    <PageTransition>
      <div className="site-page">
        <Breadcrumbs
          label={common.breadcrumb}
          items={[
            { label: common.home, href: `/${locale}` },
            { label: common.projects, href: `/${locale}/project` },
            { label: generation },
          ]}
        />
        <PageHeader
          tag={copy.tag}
          title={fillTemplate(copy.generationTitle, { generation })}
          description={fillTemplate(copy.generationDescription, { generation })}
          meta={
            <>
              <span>
                {current.startDate}
                {current.endDate ? ` – ${current.endDate}` : ''}
              </span>
              <GenerationPager
                basePath="project"
                lang={locale}
                older={older}
                newer={newer}
                label={common.generations}
                olderLabel={common.olderGeneration}
                newerLabel={common.newerGeneration}
              />
            </>
          }
        />
        <Suspense fallback={<GenerationGridFallback />}>
          <ProjectGenerationContent generation={generation} lang={locale} />
        </Suspense>
      </div>
    </PageTransition>
  )
}

function GenerationGridFallback() {
  return (
    <div role="status" aria-label="Loading projects" className="archive-skeleton">
      <span className="skeleton-bar h-28 w-full rounded-3xl" />
      <div className="release-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="skeleton-bar aspect-[4/5] rounded-3xl" />
        ))}
      </div>
    </div>
  )
}

async function ProjectGenerationContent({
  generation,
  lang,
}: {
  generation: string
  lang: Locale
}) {
  const copy = projectArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const projects = await generationProjects(generation)

  if (projects.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
      </div>
    )
  }

  const facets = projectFacets(projects)
  const url = getLocalizedUrl(lang, `/project/${generation}`)

  return (
    <>
      <JsonLd
        id="project-generation-structured-data"
        data={[
          ...collectionPage({
            url,
            name: fillTemplate(copy.generationTitle, { generation }),
            description: fillTemplate(copy.generationDescription, { generation }),
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: projects.map((project) => ({
              name: projectTitle(project, lang),
              url: getLocalizedUrl(lang, `/project/${generation}/${project.id}`),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.projects, url: getLocalizedUrl(lang, '/project') },
            { name: generation, url },
          ]),
        ]}
      />
      <FilterBar
        scope="project-grid"
        total={projects.length}
        copy={projectFilterCopy(lang)}
        facets={[
          { key: 'tag', legend: copy.facetStack, options: facets.tags },
          {
            key: 'links',
            legend: copy.facetLinks,
            mode: 'all',
            options: [
              { value: 'demo', label: copy.demo, count: facets.links.demo },
              {
                value: 'source',
                label: copy.openSource,
                count: facets.links.source,
              },
            ].filter((option) => option.count > 0),
          },
        ]}
      />
      <ProjectGrid id="project-grid" lang={lang} copy={copy} projects={projects} />
    </>
  )
}
```

Replace `app/(home)/[lang]/project/[generation]/loading.tsx` with:

```tsx
export default function ProjectGenerationLoading() {
  return (
    <div role="status" aria-label="Loading projects" className="site-page">
      <span className="skeleton-bar h-4 w-48" />
      <span className="skeleton-bar mt-6 h-14 w-2/3" />
      <span className="skeleton-bar mt-4 h-5 w-full max-w-xl" />
      <div className="release-grid mt-8">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="skeleton-bar aspect-[4/5] rounded-3xl" />
        ))}
      </div>
      <span className="sr-only">Loading projects</span>
    </div>
  )
}
```

In `lib/server/queries/public/projects.ts`, delete `getProjectsByGenerationForRequest`, `getSharedProjectsByGeneration` and `getProjectsByGeneration`; confirm with `rg getProjectsByGeneration`. Then delete the matching test in `tests/lib/server/fetcher/public-fetchers.test.ts`.

In `scripts/verify-instant-navigation.mjs`, change the `homepage -> project index` assertion to `page.getByRole('heading', { level: 1, name: 'Projects', exact: true })`.

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run tests/components/project-card.test.tsx tests/lib/server/fetcher/public-fetchers.test.ts`
Expected: pass.

Run: `.superpowers/shared/e2e-prod.sh $W/t15-e2e.log tests/e2e/project-showcase.spec.ts tests/e2e/instant-navigation.spec.ts tests/e2e/public-route-matrix.spec.ts tests/e2e/admin-crud/projects.spec.ts; tail -8 $W/t15-e2e.log`
Expected:
- everything passes
- the admin spec's public card shows `Next.js` and a `Source` link
- the admin spec runs after the instant spec here, so revalidation cannot affect the instant specs

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t15-test.log 2>&1; tail -4 $W/t15-test.log`
Expected: clean.
Stage: `app/components/site/project-grid/*`, the three project route files, `lib/server/queries/public/projects.ts`, `scripts/verify-instant-navigation.mjs`, `tests/components/project-card.test.tsx`, `tests/e2e/project-showcase.spec.ts`, `tests/e2e/instant-navigation.spec.ts`, `tests/e2e/admin-crud/projects.spec.ts`, `tests/lib/server/fetcher/public-fetchers.test.ts`.

---

### Task 16: Project case study

**Files:**
- Create: `app/components/site/project-detail/project-detail-view.tsx`
- Rewrite: `app/(home)/[lang]/project/[generation]/[projectId]/page.tsx`, `[projectId]/loading.tsx`
- Delete: `app/components/navigation-button.tsx`
- Modify: `tests/components/common-components.test.tsx` (remove the `NavigationButton` import and the `renders navigation button link` test)
- Test: `tests/components/project-detail-view.test.tsx`, `tests/e2e/project-showcase.spec.ts` (append), `tests/e2e/admin-crud/projects.spec.ts` (public detail assertions)

**Interfaces:**
- Consumes: `getProjectById`, `getProjectShowcase`, `toShowcaseProject`, `sortShowcase`, `nextProject`, `moreFromGeneration`, `projectTitle`, `projectSummary`, `contributorName` (Task 6); `projectWork`, `breadcrumbList` (Task 2); `formatInstantDate`, `toSeoulDateIso` (Task 1); `ProjectCard` (Task 15).
- Produces: `ProjectDetailView({ lang, project: ProjectDetail, more, next, copy, common })`, where `ProjectDetail = ShowcaseProject & { content: string; images: string[] }`. It renders an `aside` named `copy.details`.

- [ ] **Step 1: Write the failing tests**

`tests/components/project-detail-view.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import ProjectDetailView, {
  type ProjectDetail,
} from '@/app/components/site/project-detail/project-detail-view'
import {
  archiveCommonCopy,
  projectArchiveCopy,
} from '@/lib/contents/archive-copy'

const detail: ProjectDetail = {
  id: 'p1',
  name: 'Campus Compass',
  nameKo: '캠퍼스 나침반',
  description: 'Indoor navigation for Yonsei campus buildings.',
  descriptionKo: null,
  mainImage: '/project-default.png',
  repoUrl: 'https://github.com/gdg-yonsei/campus-compass',
  demoUrl: 'https://campus-compass.example.com',
  createdAt: new Date('2025-03-01T00:00:00.000Z'),
  updatedAt: new Date('2025-04-01T00:00:00.000Z'),
  generationName: '25-26',
  generationStartDate: '2025-03-01',
  tags: ['Firebase', 'Flutter'],
  contributors: [
    { id: 'u1', nameEn: 'Kim Minji', nameKo: '김민지', image: null, githubId: '@minji' },
  ],
  content: '## How it works',
  images: [],
}

const sibling = { ...detail, id: 'p2', name: 'Lecture Lens', nameKo: null }

function renderDetail(overrides: Partial<ProjectDetail> = {}, withSibling = false) {
  return render(
    <ProjectDetailView
      lang="en"
      project={{ ...detail, ...overrides }}
      more={withSibling ? [sibling] : []}
      next={withSibling ? sibling : null}
      copy={projectArchiveCopy.en}
      common={archiveCommonCopy.en}
    />
  )
}

describe('ProjectDetailView', () => {
  it('leads with the title, the summary and the outbound links', () => {
    renderDetail()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Campus Compass' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Indoor navigation for Yonsei campus buildings.')
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Live demo/ })[0]).toHaveAttribute(
      'href',
      'https://campus-compass.example.com'
    )
    expect(screen.getAllByRole('link', { name: /^Source/ })[0]).toHaveAttribute(
      'href',
      'https://github.com/gdg-yonsei/campus-compass'
    )
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole(
        'link',
        { name: '25-26' }
      )
    ).toHaveAttribute('href', '/en/project/25-26')
  })

  it('keeps the team, the stack and the dates in the sidebar', () => {
    renderDetail()
    const aside = screen.getByRole('complementary', { name: 'Project details' })

    expect(within(aside).getByText('Kim Minji')).toBeInTheDocument()
    expect(
      within(aside).getByRole('link', { name: 'Kim Minji GitHub' })
    ).toHaveAttribute('href', 'https://github.com/minji')
    expect(
      within(aside).getByRole('link', { name: 'Meet the 25-26 members' })
    ).toHaveAttribute('href', '/en/member/25-26')
    expect(within(aside).getByText('Flutter')).toBeInTheDocument()
    expect(within(aside).getByText('Mar 1, 2025')).toHaveAttribute(
      'datetime',
      '2025-03-01'
    )
  })

  it('links more projects from the generation and the next one', () => {
    renderDetail({}, true)

    expect(
      screen.getByRole('heading', { level: 2, name: 'More from 25-26' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Next project/ })).toHaveAttribute(
      'href',
      '/en/project/25-26/p2'
    )
  })

  it('shows a gallery only for real content images', () => {
    renderDetail({ images: ['/project-default.png'] })
    expect(screen.queryByRole('heading', { name: 'Gallery' })).toBeNull()

    renderDetail({
      images: [
        'https://image.gdgyonsei.moveto.kr/projects/1.webp',
        'https://image.gdgyonsei.moveto.kr/projects/2.webp',
      ],
    })
    expect(screen.getByRole('heading', { name: 'Gallery' })).toBeInTheDocument()
  })
})
```

Append to `tests/e2e/project-showcase.spec.ts`:

```ts
test('project pages carry a trail, the team and a CreativeWork', async ({
  page,
}) => {
  const seeded = await readSeededData()
  await page.goto(`/en/project/${seeded.generationName}/${seeded.projectId}`, {
    waitUntil: 'domcontentloaded',
  })

  await expect(
    page.getByRole('heading', { level: 1, name: 'E2E Project' })
  ).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Projects' })
  ).toHaveAttribute('href', '/en/project')
  await expect(
    page
      .getByRole('complementary', { name: 'Project details' })
      .getByRole('link', { name: `Meet the ${seeded.generationName} members` })
  ).toHaveAttribute('href', `/en/member/${seeded.generationName}`)

  const data = JSON.parse(
    (await page.locator('#project-structured-data').textContent()) ?? '[]'
  ) as Record<string, unknown>[]
  expect(data[0]).toMatchObject({ '@type': 'CreativeWork', name: 'E2E Project' })
  expect(data[1]).toMatchObject({ '@type': 'BreadcrumbList' })
})
```

In `tests/e2e/admin-crud/projects.spec.ts`, directly after the Task 15 card assertions, add:

```ts
      await card.getByRole('heading', { name: projectName, exact: true }).click()
      await expect(
        page.getByRole('heading', { level: 1, name: projectName })
      ).toBeVisible()
      await expect(
        page
          .getByRole('complementary', { name: 'Project details' })
          .getByText('Next.js', { exact: true })
      ).toBeVisible()
```

The test's next `page.goto` continues from there, as before.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/components/project-detail-view.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`app/components/site/project-detail/project-detail-view.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition } from 'react'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import ImageSliderGallery from '@/app/components/images-slider'
import SafeMDX from '@/app/components/safe-mdx'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import Chip from '@/app/components/site/chip'
import ExternalLink from '@/app/components/site/external-link'
import ProjectCard from '@/app/components/site/project-grid/project-card'
import type {
  ArchiveCommonCopy,
  ProjectArchiveCopy,
} from '@/lib/contents/archive-copy'
import { formatInstantDate, toSeoulDateIso } from '@/lib/site/datetime'
import { fillTemplate, initials } from '@/lib/site/format'
import { isPlaceholderImage } from '@/lib/site/images'
import {
  contributorName,
  projectSummary,
  projectTitle,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'

export type ProjectDetail = ShowcaseProject & {
  content: string
  images: string[]
}

export default function ProjectDetailView({
  lang,
  project,
  more,
  next,
  copy,
  common,
}: {
  lang: Locale
  project: ProjectDetail
  more: ShowcaseProject[]
  next: ShowcaseProject | null
  copy: ProjectArchiveCopy
  common: ArchiveCommonCopy
}) {
  const title = projectTitle(project, lang)
  const hubHref = `/${lang}/project`
  const generationHref = `${hubHref}/${project.generationName}`
  const gallery = project.images.filter((image) => !isPlaceholderImage(image))
  const links = [
    ...(project.demoUrl
      ? [{ href: project.demoUrl, label: copy.demo, solid: true }]
      : []),
    ...(project.repoUrl
      ? [{ href: project.repoUrl, label: copy.source, solid: false }]
      : []),
  ]

  return (
    <article>
      <Breadcrumbs
        label={common.breadcrumb}
        items={[
          { label: common.home, href: `/${lang}` },
          { label: common.projects, href: hubHref },
          { label: project.generationName, href: generationHref },
          { label: title },
        ]}
      />
      <header className="case-header">
        <p className="case-kicker">
          <Link href={generationHref} transitionTypes={['nav-back']}>
            {project.generationName}
          </Link>
        </p>
        <h1 className="page-header-title">{title}</h1>
        <p className="case-lead">{projectSummary(project, lang)}</p>
        {links.length > 0 && (
          <div className="case-actions">
            {links.map((link) => (
              <ExternalLink
                key={link.href}
                href={link.href}
                className="case-action"
                data-tone={link.solid ? 'solid' : undefined}
              >
                {link.label}
              </ExternalLink>
            ))}
          </div>
        )}
      </header>

      <figure className="case-cover">
        <ViewTransition name={`project-cover-${project.id}`}>
          <Image
            src={project.mainImage}
            alt={title}
            fill
            preload
            sizes="(min-width: 1152px) 1104px, calc(100vw - 2rem)"
          />
        </ViewTransition>
      </figure>

      <div className="detail-columns">
        <div className="site-prose prose max-w-none">
          <SafeMDX source={project.content} />
        </div>
        <aside aria-label={copy.details} className="detail-aside">
          {project.contributors.length > 0 && (
            <section>
              <h2 className="detail-aside-title">{copy.team}</h2>
              <ul className="team-list">
                {project.contributors.map((contributor) => {
                  const name = contributorName(contributor, lang)
                  return (
                    <li key={contributor.id} className="team-member">
                      <span aria-hidden="true" className="team-avatar">
                        {contributor.image ? (
                          <Image
                            src={contributor.image}
                            alt=""
                            width={32}
                            height={32}
                          />
                        ) : (
                          initials(name)
                        )}
                      </span>
                      <span>{name}</span>
                      {contributor.githubId && (
                        <a
                          href={`https://github.com/${contributor.githubId.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`${name} GitHub`}
                          className="team-github"
                        >
                          GitHub
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
              <Link
                href={`/${lang}/member/${project.generationName}`}
                className="detail-more"
              >
                {fillTemplate(copy.allMembers, {
                  generation: project.generationName,
                })}
              </Link>
            </section>
          )}
          {project.tags.length > 0 && (
            <section>
              <h2 className="detail-aside-title">{copy.stack}</h2>
              <ul className="release-tags">
                {project.tags.map((tag) => (
                  <li key={tag}>
                    <Chip>{tag}</Chip>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {links.length > 0 && (
            <section>
              <h2 className="detail-aside-title">{copy.links}</h2>
              <div className="detail-external">
                {links.map((link) => (
                  <ExternalLink key={link.href} href={link.href}>
                    {link.label}
                  </ExternalLink>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="detail-aside-title">{copy.dates}</h2>
            <dl className="detail-dates">
              <dt>{copy.published}</dt>
              <dd>
                <time dateTime={toSeoulDateIso(project.createdAt)}>
                  {formatInstantDate(project.createdAt, lang)}
                </time>
              </dd>
              <dt>{copy.updated}</dt>
              <dd>
                <time dateTime={toSeoulDateIso(project.updatedAt)}>
                  {formatInstantDate(project.updatedAt, lang)}
                </time>
              </dd>
            </dl>
          </section>
        </aside>
      </div>

      {gallery.length > 0 && (
        <section aria-labelledby="case-gallery" className="case-section">
          <h2 id="case-gallery" className="case-section-title">
            {copy.gallery}
          </h2>
          <ImageSliderGallery images={gallery} alt={title} />
        </section>
      )}

      {more.length > 0 && (
        <section aria-labelledby="case-more" className="case-section">
          <h2 id="case-more" className="case-section-title">
            {fillTemplate(copy.moreFrom, { generation: project.generationName })}
          </h2>
          <ul className="release-grid">
            {more.map((entry) => (
              <ProjectCard
                key={entry.id}
                project={entry}
                lang={lang}
                copy={copy}
                titleLevel={3}
              />
            ))}
          </ul>
        </section>
      )}

      {next && (
        <nav aria-label={copy.nextProject} className="case-next detail-pager">
          <Link
            href={`${hubHref}/${next.generationName}/${next.id}`}
            transitionTypes={['nav-forward']}
          >
            <span className="detail-pager-label">
              {copy.nextProject}
              <ArrowRightIcon aria-hidden="true" className="size-3" />
            </span>
            <span className="detail-link-title">{projectTitle(next, lang)}</span>
          </Link>
        </nav>
      )}
    </article>
  )
}
```

Replace `app/(home)/[lang]/project/[generation]/[projectId]/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import PageTransition from '@/app/components/site/page-transition'
import ProjectDetailView from '@/app/components/site/project-detail/project-detail-view'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  projectArchiveCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import {
  getProjectById,
  getProjectShowcase,
} from '@/lib/server/queries/public/projects'
import {
  createLocalizedMetadata,
  getAbsoluteUrl,
  getLocalizedUrl,
  getSiteUrl,
  summarizeForMetadata,
} from '@/lib/seo/metadata'
import { breadcrumbList, projectWork } from '@/lib/site/json-ld'
import {
  contributorName,
  moreFromGeneration,
  nextProject,
  projectSummary,
  projectTitle,
  sortShowcase,
  toShowcaseProject,
} from '@/lib/site/project-showcase'
import ProjectDetailLoading from './loading'

type Props = {
  params: Promise<{ projectId: string; lang: string; generation: string }>
}

async function loadProject(
  projectId: string,
  generation: string,
  locale: Locale
) {
  const [row, showcase] = await Promise.all([
    getProjectById(projectId, locale),
    getProjectShowcase(),
  ])

  if (!row || row.generation.name !== generation) {
    return null
  }

  return {
    project: {
      ...toShowcaseProject(row),
      content: locale === 'ko' ? row.contentKo || row.content : row.content,
      images: row.images,
    },
    showcase: sortShowcase(showcase),
  }
}

function fallbackDescription(locale: Locale, title: string, generation: string) {
  return locale === 'ko'
    ? `GDGoC Yonsei ${generation} 기수의 ${title} 프로젝트를 소개합니다.`
    : `Explore ${title}, a GDGoC Yonsei ${generation} student project.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation, projectId } = await params
  const locale = languageParamChecker(lang)
  const loaded = await loadProject(projectId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const title = projectTitle(loaded.project, locale)
  return createLocalizedMetadata({
    locale,
    path: `/project/${generation}/${projectId}`,
    title,
    description: summarizeForMetadata(
      projectSummary(loaded.project, locale),
      fallbackDescription(locale, title, generation)
    ),
    generatedSocialImage: true,
  })
}

export default async function ProjectDetailPage({ params }: Props) {
  const resolved = await params

  return (
    <Suspense fallback={<ProjectDetailLoading />}>
      <ProjectDetail {...resolved} />
    </Suspense>
  )
}

async function ProjectDetail({
  lang,
  generation,
  projectId,
}: {
  lang: string
  generation: string
  projectId: string
}) {
  const locale = languageParamChecker(lang)
  const loaded = await loadProject(projectId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const { project, showcase } = loaded
  const copy = projectArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const title = projectTitle(project, locale)
  const url = getLocalizedUrl(locale, `/project/${generation}/${projectId}`)

  return (
    <PageTransition>
      <div className="site-page">
        <JsonLd
          id="project-structured-data"
          data={[
            projectWork({
              url,
              name: title,
              description: summarizeForMetadata(
                projectSummary(project, locale),
                fallbackDescription(locale, title, generation)
              ),
              images: [project.mainImage, ...project.images].map(getAbsoluteUrl),
              locale,
              dateCreated: project.createdAt,
              dateModified: project.updatedAt,
              keywords: project.tags,
              creators: project.contributors.map((contributor) =>
                contributorName(contributor, locale)
              ),
              repoUrl: project.repoUrl,
              publisherId: `${getSiteUrl()}#organization`,
            }),
            breadcrumbList([
              { name: common.home, url: getLocalizedUrl(locale) },
              { name: common.projects, url: getLocalizedUrl(locale, '/project') },
              {
                name: generation,
                url: getLocalizedUrl(locale, `/project/${generation}`),
              },
              { name: title, url },
            ]),
          ]}
        />
        <ProjectDetailView
          lang={locale}
          copy={copy}
          common={common}
          project={project}
          more={moreFromGeneration(showcase, project)}
          next={nextProject(showcase, project.id)}
        />
      </div>
    </PageTransition>
  )
}
```

Replace `app/(home)/[lang]/project/[generation]/[projectId]/loading.tsx` with:

```tsx
export default function ProjectDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading project details"
      className="site-page"
    >
      <span className="skeleton-bar h-4 w-64 max-w-full" />
      <span className="skeleton-bar mt-6 h-4 w-24" />
      <span className="skeleton-bar mt-4 h-14 w-3/4" />
      <span className="skeleton-bar mt-4 h-6 w-full max-w-2xl" />
      <span className="skeleton-bar mt-8 aspect-video w-full rounded-[1.75rem]" />
      <span className="sr-only">Loading project details</span>
    </div>
  )
}
```

Then:
- Delete `app/components/navigation-button.tsx`. After both detail pages are rewritten, `rg "components/navigation-button"` lists only the test.
- In `tests/components/common-components.test.tsx`, remove the import and the `renders navigation button link` test.

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run tests/components/project-detail-view.test.tsx tests/components/common-components.test.tsx`
Expected: pass.

Run: `.superpowers/shared/e2e-prod.sh $W/t16-e2e.log tests/e2e/project-showcase.spec.ts tests/e2e/instant-navigation.spec.ts tests/e2e/admin-crud/projects.spec.ts; tail -8 $W/t16-e2e.log`
Expected: all pass.

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t16-test.log 2>&1; tail -4 $W/t16-test.log`
Expected: clean.
Stage: `app/components/site/project-detail/project-detail-view.tsx`, both `[projectId]` route files, the deleted `app/components/navigation-button.tsx`, `tests/components/project-detail-view.test.tsx`, `tests/components/common-components.test.tsx`, `tests/e2e/project-showcase.spec.ts`, `tests/e2e/admin-crud/projects.spec.ts`.

---

### Task 17: Live hero meta, locale links that keep filters, bundle guard

**Files:**
- Create: `app/(home)/[lang]/_components/home/hero-meta.tsx`, `lib/site/carry-query.ts`
- Modify:
  - `app/(home)/[lang]/_components/home/hero.tsx`
  - `app/(home)/[lang]/page.tsx`
  - `lib/contents/site-copy.ts` (`HeroCopy`)
  - `app/styles/site-hero.css`
  - `app/components/site/locale-switch.tsx`, `app/components/site/footer-locale-switch.tsx`
  - `app/components/header/navigation.tsx`
  - `tests/lib/site/client-bundle-guards.test.ts`
- Test: `tests/components/hero.test.tsx` (append), `tests/components/locale-switch.test.tsx` (append)

**Interfaces:**
- Consumes: `getSessionArchive` (Task 5), `getProjectShowcase` (Task 6), `countLabel` (Task 1).
- Produces:
  - `HeroMetaList({ lang, counts?: HeroCounts })` from `hero.tsx`, with `HeroCounts = { sessions; projects; generations }`
  - `Hero({ lang, meta?: ReactNode })`
  - `HeroMeta({ lang })`: async, in `hero-meta.tsx`
  - `carryQueryString(event)`
  - `LocaleSwitch({ …, onIntent? })`
  - `HeroCopy` replaces the `meta` tuple with `schedule`, `sessionsOne/Many`, `projectsOne/Many` and `generationsOne/Many`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/hero.test.tsx`, and add `HeroMetaList` and `within` to its imports:

```tsx
describe('HeroMetaList', () => {
  it('prints live counts once they arrive', () => {
    render(
      <HeroMetaList
        lang="en"
        counts={{ sessions: 23, projects: 1, generations: 2 }}
      />
    )
    const strip = screen.getByRole('list', { name: 'At a glance' })

    expect(
      within(strip)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['23 sessions', '1 project', '2 generations', 'T19 · Tue 19:00 KST'])
  })

  it('holds fixed-width placeholders while counts load', () => {
    render(<HeroMetaList lang="ko" />)
    const strip = screen.getByRole('list', { name: '한눈에 보기' })

    expect(within(strip).getAllByRole('listitem')).toHaveLength(1)
    expect(within(strip).getByText('T19 · 매주 화 19:00')).toBeInTheDocument()
    expect(strip.querySelectorAll('.hero-meta-skeleton')).toHaveLength(3)
  })
})
```

Append to `tests/components/locale-switch.test.tsx`, and add `fireEvent` and `carryQueryString` to its imports:

```tsx
  it('carries the current query string when a link is about to be used', () => {
    window.history.replaceState(null, '', '/en/session?category=hackathon')
    render(
      <LocaleSwitch
        lang="en"
        pathname="/en/session"
        label="Language"
        onIntent={carryQueryString}
      />
    )
    const korean = screen.getByRole('link', { name: /^KO\b/ })

    expect(korean).toHaveAttribute('href', '/ko/session')
    fireEvent.pointerOver(korean)
    expect(korean).toHaveAttribute('href', '/ko/session?category=hackathon')
    window.history.replaceState(null, '', '/')
  })
```

In `tests/lib/site/client-bundle-guards.test.ts`, add the archive-copy pattern to `FORBIDDEN`:

```ts
const FORBIDDEN = [
  /from ['"]@\/lib\/cn['"]/,
  /from ['"]@\/lib\/contents\/site-copy['"]/,
  /from ['"]@\/lib\/contents\/archive-copy['"]/,
]
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run tests/components/hero.test.tsx tests/components/locale-switch.test.tsx tests/lib/site/client-bundle-guards.test.ts`
Expected:
- `HeroMetaList` is not exported
- `@/lib/site/carry-query` does not resolve
- the guard test passes; it is a regression guard for the island written in Task 11

- [ ] **Step 3: Implement**

In `lib/contents/site-copy.ts`, replace `meta: [string, string, string]` in `HeroCopy` with:

```ts
  schedule: string
  sessionsOne: string
  sessionsMany: string
  projectsOne: string
  projectsMany: string
  generationsOne: string
  generationsMany: string
```

Replace the `meta` values: in `en`,

```ts
    schedule: 'T19 · Tue 19:00 KST',
    sessionsOne: '{count} session',
    sessionsMany: '{count} sessions',
    projectsOne: '{count} project',
    projectsMany: '{count} projects',
    generationsOne: '{count} generation',
    generationsMany: '{count} generations',
```

and in `ko`,

```ts
    schedule: 'T19 · 매주 화 19:00',
    sessionsOne: '세션 {count}개',
    sessionsMany: '세션 {count}개',
    projectsOne: '프로젝트 {count}개',
    projectsMany: '프로젝트 {count}개',
    generationsOne: '{count}개 기수',
    generationsMany: '{count}개 기수',
```

In `app/(home)/[lang]/_components/home/hero.tsx`:
- Import `type ReactNode` from `react` (alongside `CSSProperties`) and `countLabel` from `@/lib/site/format`.
- Add above `Hero`:

```tsx
export type HeroCounts = { sessions: number; projects: number; generations: number }

/** The mono meta strip. Without counts it holds fixed-width placeholders. */
export function HeroMetaList({
  lang,
  counts,
}: {
  lang: Locale
  counts?: HeroCounts
}) {
  const copy = heroCopy[lang]
  const items = counts
    ? [
        countLabel(counts.sessions, copy.sessionsOne, copy.sessionsMany),
        countLabel(counts.projects, copy.projectsOne, copy.projectsMany),
        countLabel(counts.generations, copy.generationsOne, copy.generationsMany),
      ]
    : [null, null, null]

  return (
    <ul className="hero-meta" aria-label={copy.metaLabel}>
      {items.map((item, index) =>
        item ? (
          <li key={index}>{item}</li>
        ) : (
          <li key={index} aria-hidden="true">
            <span className="hero-meta-skeleton" />
          </li>
        )
      )}
      <li>{copy.schedule}</li>
    </ul>
  )
}
```

- Change the signature to `export default function Hero({ lang, meta }: { lang: Locale; meta?: ReactNode })`.
- Replace the `<ul className="hero-meta">…</ul>` block with `{meta ?? <HeroMetaList lang={lang} />}`.

`app/(home)/[lang]/_components/home/hero-meta.tsx`:

```tsx
import type { Locale } from '@/i18n-config'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { HeroMetaList } from './hero'

/** Live counts from the same read models as the hubs. */
export default async function HeroMeta({ lang }: { lang: Locale }) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [sessions, projects] = await Promise.all([
    getSessionArchive(visibilityBucket),
    getProjectShowcase(),
  ])
  const generations = new Set([
    ...sessions.map((session) => session.generationName),
    ...projects.map((project) => project.generationName),
  ]).size

  return (
    <HeroMetaList
      lang={lang}
      counts={{ sessions: sessions.length, projects: projects.length, generations }}
    />
  )
}
```

In `app/(home)/[lang]/page.tsx`:
- Import `Suspense` from `react`, `HeroMeta` from `./_components/home/hero-meta`, and `{ HeroMetaList }` from `./_components/home/hero`.
- Replace `<Hero lang={lang} />` with:

```tsx
        <Hero
          lang={lang}
          meta={
            <Suspense fallback={<HeroMetaList lang={lang} />}>
              <HeroMeta lang={lang} />
            </Suspense>
          }
        />
```

In `app/styles/site-hero.css`, add after the `.hero-meta li:nth-child(3)::before` rule, inside the layer:

```css
  .hero-meta li:nth-child(4)::before {
    background-color: #f9ab00;
  }

  /* Fixed width, so the strip doesn't shift when the counts stream in. */
  .hero-meta-skeleton {
    display: inline-block;
    width: 5.5em;
    height: 0.75em;
    border-radius: 9999px;
    background-color: rgb(255 255 255 / 0.12);
    vertical-align: middle;
  }
```

`lib/site/carry-query.ts`:

```ts
import type { SyntheticEvent } from 'react'

/**
 * Locale links are rendered from the pathname; the Session Log and project
 * hubs keep their filters in the query string. Just before a locale link is
 * used (hover, focus, click), copy the current query onto it so a filtered
 * page stays filtered in the other language.
 */
export function carryQueryString(event: SyntheticEvent<HTMLElement>) {
  const { target } = event
  if (!(target instanceof Element)) return
  const link = target.closest('a[hreflang]')
  if (!(link instanceof HTMLAnchorElement)) return

  const url = new URL(link.getAttribute('href') ?? '/', window.location.origin)
  url.search = window.location.search
  link.setAttribute('href', `${url.pathname}${url.search}`)
}
```

In `app/components/site/locale-switch.tsx`:
- Add `import type { SyntheticEvent } from 'react'`.
- Add the prop `onIntent?: (event: SyntheticEvent<HTMLElement>) => void`, with the doc comment `/** Runs when a link is hovered, focused or clicked, before it navigates. */`.
- Put `onPointerOver={onIntent}`, `onFocus={onIntent}` and `onClick={onIntent}` on the `role="group"` div.

In `app/components/site/footer-locale-switch.tsx`, import `carryQueryString` and pass `onIntent={carryQueryString}`.

In `app/components/header/navigation.tsx`, import `carryQueryString` from `@/lib/site/carry-query` and pass `onIntent={carryQueryString}` to all three `LocaleSwitch` usages: `MobileMenu`, `NavigationFallback` and `NavigationForPath`.

- [ ] **Step 4: Run them to verify they pass**

Run: the Step 2 command.
Expected: all pass. The original Hero tests still pass, because without `meta` the fallback keeps `T19 · 매주 화 19:00`.

- [ ] **Step 5: Checkpoint**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t17-test.log 2>&1; tail -4 $W/t17-test.log`
Expected: clean.
Stage: `app/(home)/[lang]/_components/home/{hero,hero-meta}.tsx`, `app/(home)/[lang]/page.tsx`, `lib/contents/site-copy.ts`, `app/styles/site-hero.css`, `lib/site/carry-query.ts`, `app/components/site/{locale-switch,footer-locale-switch}.tsx`, `app/components/header/navigation.tsx`, `tests/components/hero.test.tsx`, `tests/components/locale-switch.test.tsx`, `tests/lib/site/client-bundle-guards.test.ts`.

---

### Task 18: Verification, docs and polish

**Files:**
- Modify: `docs/architecture/caching.md` (document the read models)
- Test: no new tests. This task runs the whole verification matrix and fixes whatever it finds, with a test first, as usual.

- [ ] **Step 1: Document the read models**

In `docs/architecture/caching.md`, append to `## Public Read Path Rules`:

```markdown
- Two bilingual read models back the Sessions and Projects pages:
  `getSessionArchive(bucket)` (every public session) and
  `getProjectShowcase()` (every project with tags and contributors). Hubs,
  generation pages, the sitemap and the home counters derive from them.
- Because generation pages read those shared entries, each read model calls
  `tagQuery()` after its query with `generation:list:*` and one
  `session|project:generation:<name>:*` tag per generation in the rows, so
  the immediate `updateTag` calls in `invalidation.ts` still refresh them.
```

- [ ] **Step 2: Static checks**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test > $W/t18-test.log 2>&1; tail -4 $W/t18-test.log`
Expected: clean; record the file and test counts in the ledger.

- [ ] **Step 3: Full production e2e**

Run: `.superpowers/shared/e2e-prod.sh $W/t18-e2e.log; grep -E "passed|failed|›" $W/t18-e2e.log | tail -20`
Expected: the only failures are the pre-existing ones listed in Global Constraints (admin parts update, passkey, 2 social-image tests, and instant-navigation cases whose destination an earlier CRUD spec revalidated). Every new spec passes.

Then run the instant contracts in isolation:
`.superpowers/shared/e2e-prod.sh $W/t18-instant.log tests/e2e/instant-navigation.spec.ts`
Expected: `7 passed`.

- [ ] **Step 4: Performance budget on dev data**

```bash
.superpowers/shared/dev-data.sh
AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc pnpm exec next build > $W/t18-build.log 2>&1
(AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc pnpm exec next start -p 3100 > $W/t18-start.log 2>&1 &)
PERF_OUTPUT=$W/perf-plan2.json pnpm perf:measure > $W/t18-perf.log 2>&1
pnpm perf:budget $W/perf-plan2.json .superpowers/shared/perf-baseline.json
pnpm perf:instant
```

Expected:
- `Performance budget passed for 22 route/profile samples.`
- the `perf:instant` script prints `PASS` for all 7 navigations plus the back-navigation check

If the budget fails:
- Read the per-route JS delta against `$W/perf-plan2-start.json`. The filter island is the only new client code on the hubs.
- If there are more than 25 prefetches, set `prefetch={false}` on `SessionRow` links. Those detail routes still get hover prefetch.

- [ ] **Step 5: Browser QA**

With the server from Step 4 still running:
1. Screenshots at 360, 768, 1280 and 1920 px for `/en/session`, `/ko/session`, `/en/session/25-26`, one session detail, `/en/project` and one project detail: `node .superpowers/shared/shot.mjs <url> <w>x<h> $W/qa-<name>.png --wait=1500`, with `--ko-font` for Korean pages. Look at each one. Check:
   - no clipped text
   - the sticky filter bar clears the header capsule
   - posters and cards align
2. At 320 px, `document.documentElement.scrollWidth === clientWidth` on every page from item 1.
3. A keyboard-only pass on `/en/session`:
   - Tab moves through the search field, then each chip (Space toggles it), then Reset.
   - The focus ring is visible on the row cards (`.log-entry:has(a:focus-visible)`).
   - Enter opens a session.
4. Reduced motion (`--reduced`): navigation between the hub and a detail page has no slide.
5. Lighthouse through the chrome-devtools MCP (`lighthouse_audit`) on `/en/session`, `/en/project`, one session detail and one project detail. Expected: accessibility ≥ 95, SEO 100, best practices ≥ 95.
6. `curl -s http://127.0.0.1:3100/sitemap.xml | grep -c '<loc>'`, and confirm that no empty generation page is listed.

- [ ] **Step 6: Checkpoint**

Stage `docs/architecture/caching.md` plus any fix-ups from Steps 2–5, each fix having its own failing test first.
Stop the server by PID.
Ledger the results: suite counts, the e2e failure set against the known list, perf numbers, Lighthouse scores.

---

### Task 19: Pretendard for Korean text (user decision, 2026-09-24)

Runs right after Task 0. It overrides the Plan 1 ruling that kept system Korean fonts, and the Global Constraints identity line: Hangul now uses Pretendard.

**Files:**
- Modify: `app/styles/site-theme.css` (body, `--font-display` and `--font-code` stacks, plus a `.sr-only` rule)
- Modify: `scripts/measure-next-performance.mjs` (record `pretendardRequestCount`), `scripts/check-performance-budget.mjs` (exempt those requests from the +4 request-regression rule only)
- Test: `tests/e2e/fonts.spec.ts`, `tests/scripts/performance-budget.test.ts`

- [ ] **Step 1: Write the failing tests**
  - `tests/e2e/fonts.spec.ts`:
    - `/ko` loads at least one `/fonts/pretendard/` subset, and `document.fonts` reports `Pretendard Variable` loaded.
    - `/en` requests no `/fonts/pretendard/` file. Its only Korean text is the screen-reader-only "한국어", which must not download a web font.
  - `tests/scripts/performance-budget.test.ts` runs `node scripts/check-performance-budget.mjs` on temporary fixture JSONs. Pretendard subset requests don't count toward the request-regression rule, but they do count toward the 75-request absolute cap.
- [ ] **Step 2: RED.** Run the Vitest file, and the e2e spec with `.superpowers/shared/e2e-prod.sh`. Expected: the `/ko` check and the budget exemption fail.
- [ ] **Step 3: Implement.**
  - Insert `'Pretendard Variable'` right after `var(--font-flex)` in the body stack and in `--font-display`, and right after `var(--font-code-mono)` in `--font-code`. Keep the system Korean faces after it as swap-time fallbacks, and update the comment.
  - Add `html.site .sr-only { font-family: ui-sans-serif, system-ui, sans-serif; }`, since invisible text never needs a web font.
  - The measure script counts requests whose path starts with `/fonts/pretendard/`.
  - The budget script subtracts that count, in both the report and the baseline (missing = 0), before the `+4` regression comparison.
- [ ] **Step 4: GREEN.** Both tests pass. Run `perf:measure` on dev data plus `perf:budget` against the pre-redesign baseline. Expected: passes. If the Korean LCP or CLS regresses past its budget, ledger the numbers and rule on it.
- [ ] **Step 5: Checkpoint.** lint, types, full suite.

### Task 20: Fix the issues already present on `main` (user request, 2026-09-24)

Runs after Task 19. Each issue has an existing failing test as its RED; record the root cause and the fix in the ledger.

1. **CI red at the unit-test step.** `tests/lib/seo-metadata.test.ts` asserts `https://gdgoc.yonsei.ac.kr` URLs, but CI exports `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3100`, and `vitest.setup.ts` only fills unset variables.
   - RED: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3100 pnpm vitest run tests/lib/seo-metadata.test.ts` shows 5 failed.
   - Fix: pin `NEXT_PUBLIC_SITE_URL` in `vitest.setup.ts`.
2. **Social images return 500.** `lib/seo/social-image.tsx` reads the Pretendard font with a module-level `readFile` outside any cache scope, so the Cache Components image route throws "used IO that was not cached".
   - RED: the two `social-images.spec.ts` tests.
   - Fix: render the JPEG bytes inside a `'use cache: remote'` function keyed by the content, and build the `Response` outside it. Keep `tests/lib/social-image-renderer.test.ts` green.
3. **Passkey e2e fails.** The WebAuthn RP ID is the host of `BETTER_AUTH_URL`, and `127.0.0.1` is not a valid RP ID; `localhost` is.
   - RED: `auth-flows.spec.ts` passkey lifecycle.
   - Fix: serve e2e from `http://localhost:<port>` in both Playwright configs, the CI env and `.superpowers/shared/e2e-prod.sh`.
4. **Admin parts e2e.** `getByRole('textbox', { name: 'Name' })` also matches the member pickers, whose placeholder "Korean or English name" is their only name.
   - RED: `admin-crud/parts.spec.ts` update test.
   - Fix: give the picker inputs real labels, and make the locator `exact: true`.
5. **Client navigations fall back to full reloads after admin edits.**
   - After `invalidate*PublicCache` calls `revalidatePath`, RSC navigation requests to those routes return 404 with `x-nextjs-postponed: 1` until the process restarts.
   - Debug it with superpowers:systematic-debugging. Repro: build, start, run `admin-crud/projects.spec.ts` against the server, then replay an RSC navigation request for `/en/project`.
   - RED: an e2e spec, `tests/e2e/navigation-after-admin-edit.spec.ts`. After a project update, a client-side navigation to `/en/project` must not reload the document (a `window` marker survives).
   - Fix at the root cause, keeping the admin freshness e2e green.
