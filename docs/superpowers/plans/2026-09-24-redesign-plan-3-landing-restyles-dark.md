# Redesign Plan 3 — Landing, Restyles, Social Cards and the Dark Scheme

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the public-site redesign: the narrative landing sections (`<about>` through `<join>`), restyled Members, Calendar and policy pages, social cards in the new identity, a refreshed `llms.txt`, Suspense-reveal and crossfade transitions, the deferred robustness and chrome fixes from Plans 1–2, and the system dark scheme.

**Architecture:**
- The landing sections are server components under `app/(home)/[lang]/_components/home/`. Motion is CSS only: scroll-driven animations behind `@supports (animation-timeline: view())`, hover and focus glyph animations, and no new client code.
- The two data sections (latest log, latest releases) read the Plan 2 read models, `getSessionArchive` and `getProjectShowcase`, inside Suspense boundaries whose skeletons slide away through React `<ViewTransition>` (a shared `RevealSuspense`).
- Members, Calendar and the policy pages move onto the Plan 2 primitives (breadcrumbs, `PageHeader`, the generation pager, `EmptyState`) and the `--s-*` scheme tokens. Once no public surface hard-codes a light colour, `html.site` opts into the dark scheme with `data-color-scheme="auto"`.

**Tech Stack:** Next.js 16.3 (App Router, `cacheComponents`, `partialPrefetching`), React 19 canary as bundled by Next (`<ViewTransition>`), Tailwind CSS 4, satori and sharp for social cards, Vitest with Testing Library, and Playwright with `@next/playwright`.

**Spec:** `docs/superpowers/specs/2026-09-23-inside-the-brackets-redesign-design.md`. Relevant sections:
- §1 motion (Suspense reveal, same-route crossfade), dark scheme
- §3 Landing sections 2–7, Other pages
- §4 `llms.txt` and social cards
- §5 files, primitives (`section-tag`, `brackets-mark`) and legacy removals
- §6 phases 8–11
- §7 verification

**Series:** Plan 3 of 3. Plan 1 (foundations, hero, chrome) and Plan 2 (data layer, admin tags, Sessions, Projects) are complete and committed (`f7b531f..6d9bf46` on `new-landing-page`).

**Deliberate deviations from the spec** (each checked against the codebase):
- **⌘K palette (spec Phase 10, optional): not built.** After this plan removes the legacy activities carousel (2.1 KB gzip), home JS sits about 0.1 KB under its cap of 157,246 B. Any header trigger (about 0.5–0.8 KB gzip on every route) would break the budget again. The Session Log and Projects hubs already have search.
- **Generated OG images for the home page and hubs (optional): not built.** The static `app/opengraph-image.png` is the official GDG chapter lockup, which is the brand's own asset.
- **`homeTag`:** the landing's data sections read the shared read models, whose list tags refresh on every session or project write. Plan 2 made the same call for the hero counters.
- **Plan 1 review nits left alone:**
  - **Save-Data CSS motion:** the spec only requires Save-Data to skip WebGL.
  - **A Roboto-metric fallback face for Android:** that needs Roboto's metrics measured from the font file.
  - **`params` read outside Suspense on the home page:** the page is fully static through `generateStaticParams`.
- **Home copy:**
  - The manifesto statement, section intros and join copy are new EN/KO strings in `lib/contents/site-copy.ts`.
  - Everything factual comes from existing content: the T19 schedule, the six parts, program descriptions and Solution Challenge numbers from `lib/contents/*`.
  - Nothing new is invented, such as recruiting dates.

## Global Constraints

- **Performance budgets** (`scripts/check-performance-budget.mjs` against `.superpowers/shared/perf-baseline.json`):
  - encoded JS ≤ 170,000 B per route, and no more than 5% over the pre-redesign baseline (home cap 157,246 B)
  - RSC ≤ 70,000 B
  - LCP ≤ 2,500 ms, CLS ≤ 0.05
  - requests ≤ 75, prefetches ≤ 25
  - Pretendard subsets are exempt from the request-regression rule only.
- **Dependencies:** no new npm dependencies, and no `motion` import in anything public pages render.
- **Identity:**
  - Colours come only from the GDG palette: core `#4285F4` `#EA4335` `#F9AB00` `#34A853`; bright `#57CAFF` `#FF7DAF` `#FFD427` `#5CDB6D`; neutrals `#1E1E1E` `#F0F0F0`.
  - Plus the `--s-*` tokens in `app/styles/site-theme.css`.
  - Latin type is Google Sans Flex/Code; Hangul is Pretendard.
  - No navy "Yonsei blue", no JetBrains Mono, no neon or glass look.
- **Data contracts:**
  - no schema changes and no admin changes
  - URLs unchanged; `proxy.ts` 404 behaviour unchanged
  - cache tags and invalidation unchanged
- **Motion:**
  - every scroll-driven or hover animation sits inside `@media (prefers-reduced-motion: no-preference)`
  - scroll-driven ones also sit inside `@supports (animation-timeline: view())`
  - the static fallback always shows all content
- **Instant-navigation contracts:**
  - The member index links every generation (`a[href="/en/member/<generation>"]`).
  - A member generation page renders its H1 `{generation} Members` / `{generation} 구성원` from params, outside Suspense.
  - Hub shells keep their Plan 2 test ids and H1s.
- **E2E:**
  - The suite stays fully green.
  - `instant-navigation.spec.ts` runs as its own first Playwright project.
  - New specs that edit data go in the default project.
- **Client bundles:** client modules must not reach `lib/cn`, `lib/contents/site-copy` or `lib/contents/archive-copy` (`tests/lib/site/client-bundle-guards.test.ts`).
- **Local builds and e2e:**
  - Never with real `.env` secrets.
  - Use `.superpowers/shared/e2e-prod.sh` (CI's fake env, local Postgres on 5439) and `.superpowers/shared/serve-prod.sh [--no-build|--no-seed]`.
  - Never run `pnpm build`, `pnpm db:*` or `pnpm test:e2e*` against `.env`'s remote database.
- **Lint and types:**
  - `react-hooks/set-state-in-effect` is an error.
  - `lib/**` must not import `@/app/**`.
  - `any` is an error.
  - `noUncheckedIndexedAccess` is on.
- **Commits:** one commit per task, with the attribution trailer. Never push.

## Review Focus

1. **A fresh database with no public sessions or projects.**
   - The home page still renders every section; the log and releases show their empty states.
   - Pinned by the Task 7 empty-state tests.
2. **Members with no photo, no social links, or only a GitHub username** (`name` set, `firstName` null).
   - The card shows initials and no empty link list; the name falls back to the username.
   - Pinned by the Task 9 `memberName` and `MemberCard` tests.
3. **Long names and Korean text at 320 px:** part names, member names, the Korean manifesto (with `word-break: keep-all`) and the program titles never scroll the page sideways.
   - Pinned by the 320 px checks in the Task 8 and Task 9 e2e.
4. **Browsers without scroll timelines, or with reduced motion.**
   - Program cards are a static list; manifesto words have their final colour; the join brackets sit closed.
   - Pinned by the Task 8 reduced-motion e2e.
5. **The dark scheme on every public page** (including the calendar frame and the policy pages).
   - Nothing stays light, and chip text keeps AA contrast on its tint.
   - Pinned by the Task 15 surface guard, the dark contrast test and the dark e2e.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `lib/site/brand.ts` | create | `CAPSULE_HEX`, `hexToUnitRgb` — the one source of the capsule colours |
| `lib/site/channels.ts` | create | Official channel URLs and the contact address |
| `lib/site/members.ts` | create | `memberName`, `memberLinks` |
| `lib/site/session-log.ts` | modify | `latestSessions` |
| `lib/contents/site-copy.ts` | modify | `landingCopy` (EN/KO) |
| `lib/contents/archive-copy.ts` | modify | `members` and `calendar` crumbs, `memberArchiveCopy` |
| `app/components/site/reveal-suspense.tsx` | create | Suspense with slide-down/slide-up View Transitions |
| `app/components/site/section-tag.tsx` | create | Decorative `<about />` style label |
| `app/components/site/social-icons.tsx` | create | GitHub, LinkedIn and Instagram glyphs in `currentColor` |
| `app/components/site/member-card.tsx` | create | One member: avatar or initials, name and links |
| `app/components/site/page-transition.tsx` | modify | `PAGE_TRANSITIONS` incl. `generation-switch` → crossfade |
| `app/components/site/generation-pager.tsx`, `generation-strip.tsx` | modify | Transition types; `member` base path |
| `app/components/site/hub-breadcrumbs.tsx` | modify | `members` and `calendar` sections |
| `app/components/site/button-link.tsx` | modify | `buttonClasses` for anchors that aren't `next/link` |
| `app/components/site/not-found-view.tsx` | modify | Locale-neutral links, `lang="ko"` halves |
| `app/(home)/[lang]/_components/home/{manifesto,pillar-glyph,programs,sc-funnel,parts,part-glyph,latest-log,featured-releases,join}.tsx` | create | Landing sections |
| `app/(home)/[lang]/_components/home/bracket-{field-gl.ts,stage.tsx}` | modify | Tri-state readiness, chunk-failure catch, renderer fallback, buffer reuse |
| `app/(home)/[lang]/page.tsx` | modify | The new landing composition |
| `app/(home)/[lang]/member/page.tsx`, `member/[generation]/{page,loading}.tsx` | rewrite | Members |
| `app/(home)/[lang]/calendar/{page,google-calendar}.tsx` | rewrite | Calendar |
| `app/(home)/[lang]/{privacy-policy,terms-of-service}/page.tsx` | modify | Shared prose styles |
| `app/(home)/[lang]/{session,project}/**/page.tsx` | modify | `RevealSuspense` |
| `app/(home)/[lang]/layout.tsx`, `app/not-found.tsx` | modify | `data-color-scheme="auto"` |
| `app/styles/site-home.css` | create | Landing styles |
| `app/styles/site-content.css` | modify | Reveal and crossfade transitions, members, calendar, policies |
| `app/styles/site-theme.css`, `site-chrome.css`, `site-hero.css` | modify | Overscroll surfaces, wordmark size, dark-scheme comment, sheet overlap |
| `app/globals.css` | modify | Import `site-home.css`; drop legacy home CSS |
| `lib/seo/social-image.tsx` | modify | Stage card with halftone brackets |
| `app/llms.txt/route.ts` | modify | Refreshed site description |
| `proxy.ts`, `app/components/site/bracket-poster.tsx` | modify | Use `CAPSULE_HEX` |
| `app/components/footer.tsx` | modify | Use `CHANNELS` |
| Legacy home sections, `generation-index-page`, `stage-button-group`, `generation-button-group`, `page-title`, `user-profile-card`, dead motion wrappers, `types/modal.d.ts` | delete | Replaced |
| Tests | create/modify | Listed per task |

---

### Task 0: Baseline

**Files:** none changed.

- [ ] **Step 1:** Run `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`. Expected: clean, `Test Files 81 passed`, `Tests 389 passed | 1 skipped`. Record the counts in the ledger.
- [ ] **Step 2:** Copy `.superpowers/sdd/2026-09-23-redesign-plan-2-data-sessions-projects/perf-plan2.json` to this plan's workspace as `perf-plan3-start.json`. Record the home JS (159,233 B), and the hub LCPs, which were over the regression rule.

---

### Task 1: One source for the capsule colours

**Files:**
- Create: `lib/site/brand.ts`
- Modify: `app/components/site/bracket-poster.tsx`, `proxy.ts`, `app/(home)/[lang]/_components/home/bracket-field-gl.ts`
- Test: `tests/lib/site/brand.test.ts`

**Interfaces:**
- Produces from `@/lib/site/brand`:
  - `CAPSULE_HEX: Readonly<Record<CapsuleHue, string>>`
  - `hexToUnitRgb(hex: string): readonly [number, number, number]`

- [ ] **Step 1: Write the failing test** — `tests/lib/site/brand.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CAPSULE_HEX, hexToUnitRgb } from '@/lib/site/brand'

describe('capsule colours', () => {
  it('converts hex to the unit RGB WebGL uniforms take', () => {
    expect(hexToUnitRgb('#EA4335')).toEqual([0.918, 0.263, 0.208])
    expect(hexToUnitRgb('#34A853')).toEqual([0.204, 0.659, 0.325])
  })

  it('matches the GDG palette tokens in the theme', () => {
    const theme = readFileSync('app/styles/site-theme.css', 'utf8').toLowerCase()
    for (const [hue, hex] of Object.entries(CAPSULE_HEX)) {
      expect(theme).toContain(`--color-g-${hue}: ${hex.toLowerCase()};`)
    }
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/lib/site/brand.test.ts` → fails to resolve `@/lib/site/brand`.

- [ ] **Step 3: Implement** — `lib/site/brand.ts`:

```ts
import type { CapsuleHue } from '@/lib/site/bracket-geometry'

/**
 * The four GDG capsule colours as the logo draws them (red + blue = "<",
 * green + yellow = ">"). The one source for the SVG poster, the WebGL field,
 * the proxy's inline 404 page and the social cards.
 */
export const CAPSULE_HEX: Readonly<Record<CapsuleHue, string>> = {
  red: '#EA4335',
  blue: '#4285F4',
  yellow: '#F9AB00',
  green: '#34A853',
}

/** `#EA4335` → `[0.918, 0.263, 0.208]`, rounded to three places. */
export function hexToUnitRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  const unit = (channel: number) => Math.round((channel / 255) * 1000) / 1000
  return [unit((value >> 16) & 255), unit((value >> 8) & 255), unit(value & 255)]
}
```

Then use it everywhere:
- **`bracket-poster.tsx`:** delete the `HUE_FILL` constant, import `CAPSULE_HEX` from `@/lib/site/brand`, and use `fill={CAPSULE_HEX[capsule.hue]}`.
- **`proxy.ts`:** delete the `BRACKET_FILL` constant, add `import { CAPSULE_HEX } from '@/lib/site/brand'` after the `bracket-geometry` import, and use `fill="${CAPSULE_HEX[capsule.hue]}"` in `bracketSvg`.
- **`bracket-field-gl.ts`:** replace the literal `CAPSULE_RGB` table with:

```ts
import { CAPSULE_HEX, hexToUnitRgb } from '@/lib/site/brand'

const CAPSULE_RGB = Object.fromEntries(
  Object.entries(CAPSULE_HEX).map(([hue, hex]) => [hue, hexToUnitRgb(hex)])
) as Record<CapsuleHue, readonly [number, number, number]>
```

- [ ] **Step 4: GREEN.** Run `pnpm vitest run tests/lib/site/brand.test.ts tests/lib/site/bracket-field-gl.test.ts tests/components/bracket-poster.test.tsx tests/proxy.test.ts`. Expected: all pass (the field's packed colours are unchanged: `0.918` and `0.659`).
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "take the capsule colours from one module".

---

### Task 2: Suspense reveals and generation crossfades

**Files:**
- Create: `app/components/site/reveal-suspense.tsx`
- Modify:
  - `app/components/site/page-transition.tsx`
  - `app/components/site/generation-pager.tsx`, `generation-strip.tsx`
  - `app/styles/site-content.css`
  - `vitest.setup.ts` (the Link mock exposes transition types)
  - `app/(home)/[lang]/session/page.tsx`, `project/page.tsx`
  - `session/[generation]/page.tsx`, `project/[generation]/page.tsx`
  - `session/[generation]/[sessionId]/page.tsx`, `project/[generation]/[projectId]/page.tsx`
- Test: `tests/components/reveal-suspense.test.tsx`, `tests/components/site-primitives.test.tsx` (extend)

**Interfaces:**
- Produces:
  - `RevealSuspense({ fallback: ReactNode, children: ReactNode })`
  - `PAGE_TRANSITIONS` from `page-transition.tsx`
  - the transition type `generation-switch`, which pager links carry and which animates as a crossfade
  - hub strip links carry `nav-forward`
  - in tests, `next/link` renders `data-transition-types="<types joined by space>"`

- [ ] **Step 1: Expose transition types in tests.** In `vitest.setup.ts`, inside the `next/link` mock, delete `void transitionTypes` and pass the types into the anchor:

```ts
    // Router-only props never reach the DOM; transition types surface as a
    // data attribute so tests can assert how a navigation animates.
    void prefetch
    void replace
    void scroll
    return React.createElement(
      'a',
      {
        href: typeof href === 'string' ? href : href?.pathname,
        'data-transition-types': transitionTypes?.join(' '),
        ...props,
      },
      children
    )
```

- [ ] **Step 2: Write the failing tests.**

`tests/components/reveal-suspense.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import RevealSuspense from '@/app/components/site/reveal-suspense'

const pending = new Promise<never>(() => {})

function Pending(): never {
  throw pending
}

describe('RevealSuspense', () => {
  it('shows the content once it is ready', () => {
    render(
      <RevealSuspense fallback={<p>Loading</p>}>
        <p>Ready</p>
      </RevealSuspense>
    )
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('shows the skeleton while the content suspends', () => {
    render(
      <RevealSuspense fallback={<p>Loading</p>}>
        <Pending />
      </RevealSuspense>
    )
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
```

In `tests/components/site-primitives.test.tsx`:
- import `PAGE_TRANSITIONS` next to `PageTransition` (`import PageTransition, { PAGE_TRANSITIONS } from '@/app/components/site/page-transition'`)
- extend `offers only the neighbouring generations that exist` with `expect(screen.getByRole('link', { name: /이전 기수/ })).toHaveAttribute('data-transition-types', 'generation-switch')`
- extend `links generations with records and mutes empty ones` with `expect(current).toHaveAttribute('data-transition-types', 'nav-forward')`
- add:

```tsx
  it('crossfades when switching generations', () => {
    expect(PAGE_TRANSITIONS['generation-switch']).toBe('crossfade')
    expect(PAGE_TRANSITIONS.default).toBe('none')
  })
```

- [ ] **Step 3: RED.** `pnpm vitest run tests/components/reveal-suspense.test.tsx tests/components/site-primitives.test.tsx` → the reveal module does not resolve, `PAGE_TRANSITIONS` is undefined, and the pager and strip links carry `nav-back`, `nav-forward` or nothing.

- [ ] **Step 4: Implement.**

`app/components/site/reveal-suspense.tsx`:

```tsx
import { Suspense, ViewTransition, type ReactNode } from 'react'

/**
 * A Suspense boundary whose loading handoff animates: the skeleton slides
 * down and out, then the content slides up and in (site-content.css
 * `.reveal-exit` / `.reveal-enter`). `default="none"` keeps both still during
 * unrelated transitions such as route slides.
 */
export default function RevealSuspense({
  fallback,
  children,
}: {
  fallback: ReactNode
  children: ReactNode
}) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="reveal-exit" default="none">
          {fallback}
        </ViewTransition>
      }
    >
      <ViewTransition enter="reveal-enter" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  )
}
```

Replace `app/components/site/page-transition.tsx` with:

```tsx
import { ViewTransition, type ReactNode } from 'react'

/**
 * Transition types a navigation can carry, and the class each one animates
 * with (site-content.css). Untyped navigations (browser back, refreshes)
 * leave the page still.
 */
export const PAGE_TRANSITIONS = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  'generation-switch': 'crossfade',
  default: 'none',
} as const

/**
 * Slides page content left or right for `nav-forward` / `nav-back` links and
 * crossfades between generations of the same page. Layouts persist across
 * navigations, so every page wraps itself.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={PAGE_TRANSITIONS}
      exit={PAGE_TRANSITIONS}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
```

In `generation-pager.tsx`:
- Replace both `transitionTypes` values with `transitionTypes={['generation-switch']}`.
- Replace the comment above the component with `/* Same page, another generation: links crossfade (PAGE_TRANSITIONS). Arrows are SVG icons, because arrow glyphs would pull Google Sans Flex's symbols subset. */`.
- Widen `basePath` to `'session' | 'project' | 'member'`.

In `generation-strip.tsx`, add `transitionTypes={['nav-forward']}` to the strip `Link` (hub → generation page).

In `app/styles/site-content.css`, directly after the `::view-transition-new(.nav-back)` rule, add:

```css
/* Same page, another generation: a crossfade, not a slide. */
::view-transition-old(.crossfade) {
  animation: 150ms ease-in both vt-fade reverse;
}

::view-transition-new(.crossfade) {
  animation: 210ms ease-out 90ms both vt-fade;
}

/* Suspense reveal: the skeleton sinks away, then the content rises in. */
::view-transition-old(.reveal-exit) {
  animation:
    150ms ease-out both vt-fade reverse,
    150ms ease-out both vt-rise reverse;
}

::view-transition-new(.reveal-enter) {
  animation:
    210ms ease-in 150ms both vt-fade,
    400ms var(--ease-out) both vt-rise;
}

@keyframes vt-rise {
  from {
    translate: 0 10px;
  }
  to {
    translate: 0 0;
  }
}
```

In each of these pages, import `RevealSuspense from '@/app/components/site/reveal-suspense'` and wrap the main content boundary. Keep `Suspense` imported where the breadcrumb skeleton still uses it; remove the import where it no longer does.

| Page | Replace | With |
|---|---|---|
| `session/page.tsx` | `<Suspense fallback={<SessionHubFallback />}>…</Suspense>` | `<RevealSuspense fallback={<SessionHubFallback />}>…</RevealSuspense>` |
| `project/page.tsx` | `<Suspense fallback={<ProjectGridFallback />}>…</Suspense>` | the same with `RevealSuspense` |
| `session/[generation]/page.tsx` | `<Suspense fallback={<GenerationLogFallback />}>…</Suspense>` | the same with `RevealSuspense` |
| `project/[generation]/page.tsx` | `<Suspense fallback={<GenerationGridFallback />}>…</Suspense>` | the same with `RevealSuspense` |
| `session/[generation]/[sessionId]/page.tsx` | `<Suspense fallback={<SessionDetailLoading />}>…</Suspense>` | the same with `RevealSuspense` |
| `project/[generation]/[projectId]/page.tsx` | `<Suspense fallback={<ProjectDetailLoading />}>…</Suspense>` | the same with `RevealSuspense` |

- [ ] **Step 5: GREEN.** The Step 3 command passes. Then run `.superpowers/shared/e2e-prod.sh $W/t2-e2e.log tests/e2e/session-log.spec.ts tests/e2e/project-showcase.spec.ts tests/e2e/public-route-matrix.spec.ts`. Expected: all pass, including the 7 instant-navigation tests that run first.
- [ ] **Step 6: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "reveal streamed content and crossfade between generations".

---

### Task 3: Landing copy, channels and section primitives

**Files:**
- Create:
  - `lib/site/channels.ts`
  - `app/components/site/section-tag.tsx`
  - `app/styles/site-home.css`
- Modify:
  - `lib/contents/site-copy.ts` (append `landingCopy`)
  - `app/components/footer.tsx` (use `CHANNELS`)
  - `app/globals.css` (import `site-home.css`)
- Test: `tests/lib/contents/landing-copy.test.ts`, `tests/components/section-tag.test.tsx`

**Interfaces:**
- Produces from `@/lib/site/channels`: `CHANNELS = { instagram, linkedin, chapter, source, email }`.
- Produces from `@/lib/contents/site-copy`: the types `ProgramKey` and `LandingCopy`, and the value `landingCopy: Record<Locale, LandingCopy>` (shape below).
- Produces `SectionTag({ children: string })`.
- Produces CSS classes: `home-section`, `home-section-head`, `home-head-row`, `home-section-title`, `home-section-intro`, `home-more`, `section-tag`, `reveal`.

- [ ] **Step 1: Write the failing tests.**

`tests/lib/contents/landing-copy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { landingCopy } from '@/lib/contents/site-copy'

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, shape(entry)])
    )
  }
  return typeof value
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(strings)
  }
  return []
}

describe('landing copy', () => {
  it('has the same structure in English and Korean', () => {
    expect(shape(landingCopy.ko)).toEqual(shape(landingCopy.en))
  })

  it('never leaves a string empty', () => {
    for (const text of [
      ...strings(landingCopy.en),
      ...strings(landingCopy.ko),
    ]) {
      expect(text.trim()).not.toBe('')
    }
  })

  it('keeps the Solution Challenge numbers identical across languages', () => {
    expect(landingCopy.ko.funnel.steps.map((step) => step.value)).toEqual(
      landingCopy.en.funnel.steps.map((step) => step.value)
    )
  })
})
```

`tests/components/section-tag.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionTag from '@/app/components/site/section-tag'

describe('SectionTag', () => {
  it('is decorative: the section heading carries the name', () => {
    render(<SectionTag>{'<about />'}</SectionTag>)
    expect(screen.getByText('<about />')).toHaveAttribute('aria-hidden', 'true')
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/lib/contents/landing-copy.test.ts tests/components/section-tag.test.tsx` → `landingCopy` is undefined and the component does not resolve.

- [ ] **Step 3: Implement.**

`lib/site/channels.ts`:

```ts
/** Official channels, shared by the footer, the home page and llms.txt. */
export const CHANNELS = {
  instagram: 'https://www.instagram.com/gdg.yonseiuniv/',
  linkedin: 'https://www.linkedin.com/company/gdsc-yonsei/',
  chapter:
    'https://gdg.community.dev/gdg-on-campus-yonsei-university-sinchon-campus-seoul-south-korea/',
  source: 'https://github.com/gdg-yonsei/gdgoc-yonsei-web',
  email: 'gdsc.yonsei.univ@gmail.com',
} as const
```

In `app/components/footer.tsx`:
- delete the `EMAIL`, `INSTAGRAM_URL`, `LINKEDIN_URL`, `CHAPTER_URL` and `SOURCE_URL` constants
- import `CHANNELS` from `@/lib/site/channels`
- use `CHANNELS.instagram`, `CHANNELS.linkedin`, `mailto:${CHANNELS.email}`, `CHANNELS.chapter` and `CHANNELS.source`

Append to `lib/contents/site-copy.ts`:

```ts
export type ProgramKey =
  | 'T19'
  | 'Part Session'
  | 'oTP'
  | 'Solution Challenge'
  | 'Yonsei X Korea Demo Day'
  | 'The Bridge Hackathon'

export type LandingCopy = {
  manifesto: {
    tag: string
    title: string
    statement: string
    asideTitle: string
    asideLink: string
    pillars: { key: 'community' | 'tech' | 'growth'; title: string }[]
  }
  programs: {
    tag: string
    title: string
    intro: string
    titles: Record<ProgramKey, string>
    kickers: Record<ProgramKey, string>
  }
  funnel: { caption: string; steps: { value: string; label: string }[] }
  parts: { tag: string; title: string; intro: string; partLink: string }
  log: { tag: string; title: string; link: string }
  releases: { tag: string; title: string; link: string }
  join: {
    tag: string
    title: string
    lead: string
    instagram: string
    linkedin: string
    calendar: string
  }
}

/*
 * Landing copy. Facts (the T19 schedule, the six parts, program names and
 * the 2023 Solution Challenge numbers) come from lib/contents/*; nothing
 * here promises dates the chapter hasn't announced.
 */
export const landingCopy: Record<Locale, LandingCopy> = {
  en: {
    manifesto: {
      tag: '<about />',
      title: 'What is GDGoC Yonsei?',
      statement:
        'A student developer community at Yonsei University. We connect, learn and grow together, and turn what we learn into work our community can use.',
      asideTitle: 'What is GDG on Campus?',
      asideLink: 'The official GDG chapter',
      pillars: [
        { key: 'community', title: 'Community' },
        { key: 'tech', title: 'Tech' },
        { key: 'growth', title: 'Sustainable Growth' },
      ],
    },
    programs: {
      tag: '<programs />',
      title: 'Programs',
      intro: 'How members learn, build and share, week after week.',
      titles: {
        T19: 'T19',
        'Part Session': 'Part Sessions',
        oTP: 'oTP → Demo Day',
        'Solution Challenge': 'Solution Challenge',
        'Yonsei X Korea Demo Day': 'Yonsei × Korea Demo Day',
        'The Bridge Hackathon': 'The Bridge Hackathon',
      },
      kickers: {
        T19: 'Every Tuesday · 19:00 KST',
        'Part Session': 'Six parts · studies and workshops',
        oTP: 'Open Tech Project',
        'Solution Challenge': 'Google for Developers',
        'Yonsei X Korea Demo Day': 'With GDGoC Korea',
        'The Bridge Hackathon': 'Yonsei · Korea · Tokyo · Waseda',
      },
    },
    funnel: {
      caption: 'Solution Challenge 2023',
      steps: [
        { value: '2,100', label: 'teams worldwide' },
        { value: '6', label: 'teams from GDG Yonsei' },
        { value: '3', label: 'in the Top 100' },
        { value: '1', label: 'Top 10 finalist' },
      ],
    },
    parts: {
      tag: '<parts />',
      title: 'Six parts',
      intro:
        'Every member joins a part: a small team that studies, runs workshops and builds together.',
      partLink: '{part} sessions',
    },
    log: {
      tag: '<log />',
      title: 'Latest sessions',
      link: 'Open the Session Log',
    },
    releases: {
      tag: '<releases />',
      title: 'Latest projects',
      link: 'See all projects',
    },
    join: {
      tag: '<join />',
      title: 'Build with us',
      lead: 'Recruiting news goes out on Instagram first.',
      instagram: 'Follow on Instagram',
      linkedin: 'LinkedIn',
      calendar: 'See the calendar',
    },
  },
  ko: {
    manifesto: {
      tag: '<about />',
      title: 'GDGoC Yonsei는 어떤 커뮤니티인가요?',
      statement:
        '연세대학교의 학생 개발자 커뮤니티. 함께 연결하고 배우고 성장하며, 배운 것을 우리 공동체가 쓸 수 있는 결과물로 만듭니다.',
      asideTitle: 'GDG on Campus란 무엇인가요?',
      asideLink: '공식 GDG 챕터 페이지',
      pillars: [
        { key: 'community', title: '커뮤니티' },
        { key: 'tech', title: '기술' },
        { key: 'growth', title: '지속 가능한 성장' },
      ],
    },
    programs: {
      tag: '<programs />',
      title: '프로그램',
      intro: '매주 배우고, 만들고, 나누는 방식이에요.',
      titles: {
        T19: 'T19',
        'Part Session': '파트 세션',
        oTP: 'oTP → 데모데이',
        'Solution Challenge': 'Solution Challenge',
        'Yonsei X Korea Demo Day': 'Yonsei × Korea Demo Day',
        'The Bridge Hackathon': 'The Bridge Hackathon',
      },
      kickers: {
        T19: '매주 화요일 · 19:00',
        'Part Session': '6개 파트 · 스터디와 워크숍',
        oTP: 'Open Tech Project',
        'Solution Challenge': 'Google for Developers',
        'Yonsei X Korea Demo Day': 'GDGoC Korea와 함께',
        'The Bridge Hackathon': '연세 · 고려 · 도쿄 · 와세다',
      },
    },
    funnel: {
      caption: 'Solution Challenge 2023',
      steps: [
        { value: '2,100', label: '전 세계 참가 팀' },
        { value: '6', label: 'GDG Yonsei 참가 팀' },
        { value: '3', label: 'Top 100 선정' },
        { value: '1', label: 'Top 10 파이널리스트' },
      ],
    },
    parts: {
      tag: '<parts />',
      title: '6개 파트',
      intro:
        '모든 멤버는 파트에 속해 함께 공부하고, 워크숍을 열고, 만들어요.',
      partLink: '{part} 세션',
    },
    log: {
      tag: '<log />',
      title: '최근 세션',
      link: '세션 로그 열기',
    },
    releases: {
      tag: '<releases />',
      title: '최근 프로젝트',
      link: '모든 프로젝트 보기',
    },
    join: {
      tag: '<join />',
      title: '함께 만들어요',
      lead: '모집 소식은 인스타그램에 가장 먼저 올라와요.',
      instagram: '인스타그램 팔로우',
      linkedin: 'LinkedIn',
      calendar: '캘린더 보기',
    },
  },
}
```

`app/components/site/section-tag.tsx`:

```tsx
/** The code-style section label (`<about />`). Decorative: the section's
    heading carries its name. */
export default function SectionTag({ children }: { children: string }) {
  return (
    <p aria-hidden="true" className="section-tag">
      {children}
    </p>
  )
}
```

`app/styles/site-home.css`:

```css
/* Landing page: section heads, the scroll-driven reveal and (in the tasks
   that add them) each section's own styles. */
@layer components {
  .home-section {
    margin-inline: auto;
    width: 100%;
    max-width: 72rem;
    padding: 5.5rem 1rem;
  }

  @media (min-width: 640px) {
    .home-section {
      padding: 7rem 1.5rem;
    }
  }

  .home-section + .home-section {
    border-top: 1px solid var(--s-rule);
  }

  .section-tag {
    font-family: var(--font-code);
    font-size: 0.8125rem;
    color: var(--s-fg-subtle);
  }

  .home-section-head {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 2.5rem;
  }

  .home-head-row {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 1rem 2rem;
  }

  .home-section-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5.2vw, 3.5rem);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.035em;
    font-variation-settings: 'ROND' 100;
  }

  .home-section-intro {
    max-width: 40rem;
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--s-fg-muted);
  }

  .home-more {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    justify-self: start;
    font-weight: 600;
    color: var(--s-blue-ink);
    text-decoration-line: underline;
    text-decoration-color: transparent;
    text-underline-offset: 0.25em;
    transition: text-decoration-color var(--dur-fast) var(--ease-out);
  }
}

@media (hover: hover) {
  .home-more:hover {
    text-decoration-color: currentColor;
  }
}

/* Blocks fade up as they enter. Without scroll timelines, or with reduced
   motion, everything is simply there. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal-in linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 55%;
    }
  }
}

@keyframes reveal-in {
  from {
    opacity: 0;
    translate: 0 2rem;
  }
}
```

In `app/globals.css`, add `@import './styles/site-home.css';` directly after the `site-content.css` import.

- [ ] **Step 4: GREEN.** The Step 2 command passes, and `pnpm vitest run tests/components/common-components.test.tsx` still passes (the footer links are unchanged).
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "add landing copy, channel links and section primitives".

---

### Task 4: `<about>` manifesto

**Files:**
- Create: `app/(home)/[lang]/_components/home/manifesto.tsx`, `pillar-glyph.tsx`
- Modify: `app/styles/site-home.css`
- Test: `tests/components/manifesto.test.tsx`

**Interfaces:**
- Consumes: `landingCopy[lang].manifesto`, `SectionTag`, `CHANNELS.chapter`, `ExternalLink`, `GDGLogo`, `aboutSectionContents`.
- Produces: `Manifesto({ lang })` — a `section` labelled by `#manifesto-title`.

- [ ] **Step 1: Write the failing test** — `tests/components/manifesto.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Manifesto from '@/app/(home)/[lang]/_components/home/manifesto'
import { landingCopy } from '@/lib/contents/site-copy'

describe('Manifesto', () => {
  it('reads as one statement, with the introduction and the GDG aside', () => {
    const { container } = render(<Manifesto lang="en" />)
    const section = screen.getByRole('region', { name: 'What is GDGoC Yonsei?' })

    expect(
      container.querySelector('.manifesto-statement')?.textContent?.trim()
    ).toBe(landingCopy.en.manifesto.statement)
    expect(
      within(section).getByRole('complementary', {
        name: 'What is GDG on Campus?',
      })
    ).toBeInTheDocument()
    expect(
      within(section).getByRole('link', { name: /The official GDG chapter/ })
    ).toHaveAttribute('rel', 'noreferrer noopener')
  })

  it('lists the three pillars with decorative glyphs', () => {
    render(<Manifesto lang="ko" />)
    const items = screen.getAllByRole('listitem')

    expect(
      items.map(
        (item) => within(item).getByRole('heading', { level: 3 }).textContent
      )
    ).toEqual(['커뮤니티', '기술', '지속 가능한 성장'])
    for (const item of items) {
      expect(item.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/components/manifesto.test.tsx` → the module does not resolve.

- [ ] **Step 3: Implement.**

`app/(home)/[lang]/_components/home/pillar-glyph.tsx`:

```tsx
export type PillarKind = 'community' | 'tech' | 'growth'

/** Small decorative glyph per pillar, animated on hover (site-home.css). */
export default function PillarGlyph({ kind }: { kind: PillarKind }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 40"
      className="pillar-glyph"
    >
      {kind === 'community' && (
        <>
          <circle cx="20" cy="20" r="11" className="glyph-fill-blue" />
          <circle cx="32" cy="20" r="11" className="glyph-fill-red" />
          <circle cx="44" cy="20" r="11" className="glyph-fill-yellow" />
        </>
      )}
      {kind === 'tech' && (
        <>
          <path d="M18 8 6 20l12 12" className="glyph-stroke-blue" />
          <path d="m46 8 12 12-12 12" className="glyph-stroke-green" />
          <rect x="29" y="10" width="5" height="20" rx="2" className="glyph-caret" />
        </>
      )}
      {kind === 'growth' && (
        <>
          <rect x="10" y="24" width="10" height="12" rx="3" className="glyph-bar" />
          <rect x="27" y="16" width="10" height="20" rx="3" className="glyph-bar" />
          <rect x="44" y="6" width="10" height="30" rx="3" className="glyph-bar" />
        </>
      )}
    </svg>
  )
}
```

`app/(home)/[lang]/_components/home/manifesto.tsx`:

```tsx
import type { CSSProperties } from 'react'
import type { Locale } from '@/i18n-config'
import ExternalLink from '@/app/components/site/external-link'
import SectionTag from '@/app/components/site/section-tag'
import GDGLogo from '@/app/components/svg/gdg-logo'
import aboutSectionContents from '@/lib/contents/about-section'
import { landingCopy } from '@/lib/contents/site-copy'
import { CHANNELS } from '@/lib/site/channels'
import PillarGlyph from './pillar-glyph'

const PILLAR_BODY = {
  community: aboutSectionContents.gdgCommunity,
  tech: aboutSectionContents.gdgTech,
  growth: aboutSectionContents.gdgSustainableGrowth,
}

/**
 * `<about>`: the chapter's statement at display size, lit word by word as it
 * crosses the viewport (site-home.css), the longer introduction, a "What is
 * GDG on Campus?" aside and the three pillars.
 */
export default function Manifesto({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].manifesto
  const words = copy.statement.split(' ')

  return (
    <section aria-labelledby="manifesto-title" className="home-section">
      <div className="home-section-head">
        <SectionTag>{copy.tag}</SectionTag>
        <h2 id="manifesto-title" className="manifesto-kicker">
          {copy.title}
        </h2>
      </div>
      <p
        className="manifesto-statement"
        style={{ '--n': words.length } as CSSProperties}
      >
        {words.map((word, index) => (
          <span
            key={index}
            className="manifesto-word"
            style={{ '--i': index } as CSSProperties}
          >
            {word}{' '}
          </span>
        ))}
      </p>
      <div className="manifesto-body reveal">
        <p className="manifesto-lede">{aboutSectionContents.gdgYonsei[lang]}</p>
        <aside aria-labelledby="gdg-aside-title" className="manifesto-aside">
          <GDGLogo
            svgKey="manifesto"
            aria-hidden="true"
            className="h-7 w-auto self-start"
          />
          <h3 id="gdg-aside-title" className="manifesto-aside-title">
            {copy.asideTitle}
          </h3>
          <p>{aboutSectionContents.gdg[lang]}</p>
          <ExternalLink href={CHANNELS.chapter} className="home-more">
            {copy.asideLink}
          </ExternalLink>
        </aside>
      </div>
      <ul className="pillars reveal">
        {copy.pillars.map((pillar) => (
          <li key={pillar.key} className="pillar">
            <PillarGlyph kind={pillar.key} />
            <h3 className="pillar-title">{pillar.title}</h3>
            <p className="pillar-body">{PILLAR_BODY[pillar.key][lang]}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

Append to `app/styles/site-home.css`:

```css
@layer components {
  .manifesto-kicker {
    font-size: 1rem;
    font-weight: 600;
    color: var(--s-fg-muted);
  }

  .manifesto-statement {
    max-width: 14em;
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 6vw, 4.75rem);
    font-weight: 700;
    line-height: 1.04;
    letter-spacing: -0.035em;
    font-variation-settings: 'ROND' 100;
    view-timeline: --manifesto block;
  }

  .manifesto-body {
    margin-top: 3.5rem;
    display: grid;
    gap: 2rem;
  }

  @media (min-width: 900px) {
    .manifesto-body {
      grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
      align-items: start;
      gap: 3rem;
    }
  }

  .manifesto-lede {
    font-size: 1.0625rem;
    line-height: 1.8;
    color: var(--s-fg-muted);
  }

  .manifesto-aside {
    display: grid;
    gap: 0.75rem;
    border: 1px solid var(--s-rule);
    border-radius: 1.5rem;
    background-color: var(--s-sheet);
    padding: 1.5rem;
  }

  .manifesto-aside-title {
    font-size: 1.125rem;
    font-weight: 700;
  }

  .manifesto-aside p {
    line-height: 1.7;
    color: var(--s-fg-muted);
  }

  .pillars {
    margin-top: 3rem;
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .pillars {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .pillar {
    display: grid;
    align-content: start;
    gap: 0.75rem;
    border: 1px solid var(--s-rule);
    border-radius: 1.5rem;
    background-color: var(--s-sheet);
    padding: 1.5rem;
  }

  .pillar-glyph {
    width: 4rem;
    height: 2.5rem;
    overflow: visible;
  }

  .pillar-glyph circle,
  .pillar-glyph rect {
    transform-box: fill-box;
    transform-origin: center;
  }

  .pillar-title {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    font-variation-settings: 'ROND' 100;
  }

  .pillar-body {
    line-height: 1.65;
    color: var(--s-fg-muted);
  }

  .glyph-fill-blue {
    fill: var(--color-g-blue);
    opacity: 0.88;
  }

  .glyph-fill-red {
    fill: var(--color-g-red);
    opacity: 0.88;
  }

  .glyph-fill-yellow {
    fill: var(--color-g-yellow);
    opacity: 0.88;
  }

  .glyph-stroke-blue,
  .glyph-stroke-green {
    fill: none;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .glyph-stroke-blue {
    stroke: var(--color-g-blue);
  }

  .glyph-stroke-green {
    stroke: var(--color-g-green);
  }

  .glyph-caret {
    fill: var(--s-fg);
  }

  .glyph-bar {
    fill: var(--color-g-green);
    transform-origin: bottom;
  }
}

/* The statement lights up word by word as it crosses the viewport. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .manifesto-word {
      animation: manifesto-word linear both;
      animation-timeline: --manifesto;
      animation-range: cover calc(18% + var(--i) / var(--n) * 32%) cover
        calc(26% + var(--i) / var(--n) * 32%);
    }
  }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .pillar-glyph circle {
    transition: translate var(--dur-slow) var(--ease-spring);
  }

  .pillar:hover .pillar-glyph circle:first-child {
    translate: -5px 0;
  }

  .pillar:hover .pillar-glyph circle:last-child {
    translate: 5px 0;
  }

  .pillar:hover .glyph-caret {
    animation: caret-blink 1s steps(1) infinite;
  }

  .pillar:hover .glyph-bar {
    animation: bar-grow 700ms var(--ease-spring) both;
  }

  .pillar:hover .glyph-bar:nth-child(2) {
    animation-delay: 80ms;
  }

  .pillar:hover .glyph-bar:nth-child(3) {
    animation-delay: 160ms;
  }
}

@keyframes manifesto-word {
  from {
    color: var(--s-fg-subtle);
  }
  to {
    color: var(--s-fg);
  }
}

@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}

@keyframes bar-grow {
  from {
    scale: 1 0.2;
  }
}
```

- [ ] **Step 4: GREEN.** `pnpm vitest run tests/components/manifesto.test.tsx` passes (2 tests).
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "add the <about> manifesto section".

---

### Task 5: `<programs>` sticker stack and the Solution Challenge funnel

**Files:**
- Create: `app/(home)/[lang]/_components/home/programs.tsx`, `sc-funnel.tsx`
- Modify: `app/styles/site-home.css`
- Test: `tests/components/programs.test.tsx`

**Interfaces:**
- Consumes: `landingCopy[lang].programs`, `landingCopy[lang].funnel`, `ProgramKey`, `activitySectionContents`, `Hue`.
- Produces: `Programs({ lang })`, `ScFunnel({ lang })`.

- [ ] **Step 1: Write the failing test** — `tests/components/programs.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Programs from '@/app/(home)/[lang]/_components/home/programs'

describe('Programs', () => {
  it('lists the six programs in order with their descriptions', () => {
    render(<Programs lang="en" />)

    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      'T19',
      'Part Sessions',
      'oTP → Demo Day',
      'Solution Challenge',
      'Yonsei × Korea Demo Day',
      'The Bridge Hackathon',
    ])
    expect(screen.getByText(/Tech at 19:00/)).toBeInTheDocument()
  })

  it('draws the Solution Challenge funnel as an ordered list', () => {
    render(<Programs lang="ko" />)
    const funnel = screen.getByRole('figure', {
      name: 'Solution Challenge 2023',
    })

    expect(
      within(funnel)
        .getAllByRole('listitem')
        .map((step) => step.textContent)
    ).toEqual([
      '2,100전 세계 참가 팀',
      '6GDG Yonsei 참가 팀',
      '3Top 100 선정',
      '1Top 10 파이널리스트',
    ])
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/components/programs.test.tsx` → the module does not resolve.

- [ ] **Step 3: Implement.**

`app/(home)/[lang]/_components/home/sc-funnel.tsx`:

```tsx
import type { CSSProperties } from 'react'
import type { Locale } from '@/i18n-config'
import { landingCopy } from '@/lib/contents/site-copy'

/** The 2023 Solution Challenge as narrowing brackets: every step is a
    `< >`-shaped band a little narrower than the one before. */
export default function ScFunnel({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].funnel

  return (
    <figure className="sc-funnel">
      <figcaption className="sc-funnel-caption">{copy.caption}</figcaption>
      <ol className="sc-funnel-steps">
        {copy.steps.map((step, index) => (
          <li
            key={step.value}
            className="sc-funnel-step"
            style={{ '--step': index } as CSSProperties}
          >
            <span className="sc-funnel-value">{step.value}</span>
            <span className="sc-funnel-label">{step.label}</span>
          </li>
        ))}
      </ol>
    </figure>
  )
}
```

`app/(home)/[lang]/_components/home/programs.tsx`:

```tsx
import type { CSSProperties } from 'react'
import type { Locale } from '@/i18n-config'
import SectionTag from '@/app/components/site/section-tag'
import activitySectionContents from '@/lib/contents/activity-section'
import { landingCopy, type ProgramKey } from '@/lib/contents/site-copy'
import type { Hue } from '@/lib/site/labels'
import ScFunnel from './sc-funnel'

/** Spec order, each program with its GDG hue. */
const PROGRAMS: ReadonlyArray<{ key: ProgramKey; hue: Hue }> = [
  { key: 'T19', hue: 'red' },
  { key: 'Part Session', hue: 'green' },
  { key: 'oTP', hue: 'blue' },
  { key: 'Solution Challenge', hue: 'yellow' },
  { key: 'Yonsei X Korea Demo Day', hue: 'red' },
  { key: 'The Bridge Hackathon', hue: 'green' },
]

const DESCRIPTIONS = new Map(
  activitySectionContents.map((activity) => [activity.key, activity.content])
)

/**
 * `<programs>`: outlined sticker cards that stack as they scroll on wide
 * screens (site-home.css); a plain list on phones and under reduced motion.
 */
export default function Programs({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].programs

  return (
    <section aria-labelledby="programs-title" className="home-section">
      <div className="home-section-head">
        <SectionTag>{copy.tag}</SectionTag>
        <h2 id="programs-title" className="home-section-title">
          {copy.title}
        </h2>
        <p className="home-section-intro">{copy.intro}</p>
      </div>
      <ol className="program-stack">
        {PROGRAMS.map(({ key, hue }, index) => (
          <li
            key={key}
            className="program-card"
            data-hue={hue}
            style={{ '--i': index } as CSSProperties}
          >
            <article className="program-inner">
              <p className="program-kicker">{copy.kickers[key]}</p>
              <h3 className="program-title">{copy.titles[key]}</h3>
              <p className="program-body">{DESCRIPTIONS.get(key)?.[lang]}</p>
              {key === 'Solution Challenge' && <ScFunnel lang={lang} />}
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

Append to `app/styles/site-home.css`:

```css
@layer components {
  .program-stack {
    display: grid;
    gap: 1.25rem;
  }

  .program-card[data-hue='red'] {
    --hue: var(--color-g-red);
  }

  .program-card[data-hue='green'] {
    --hue: var(--color-g-green);
  }

  .program-card[data-hue='blue'] {
    --hue: var(--color-g-blue);
  }

  .program-card[data-hue='yellow'] {
    --hue: var(--color-g-yellow);
  }

  /* "Sticker" elevation: an ink outline, a hard offset shadow and a hue band. */
  .program-inner {
    display: grid;
    gap: 0.75rem;
    border: 1.5px solid var(--s-fg);
    border-top: 0.625rem solid var(--hue);
    border-radius: 1.75rem;
    background-color: var(--s-sheet);
    padding: 1.75rem;
    box-shadow: 6px 6px 0 var(--s-fg);
  }

  .program-kicker {
    font-family: var(--font-code);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--s-fg-subtle);
  }

  html.site:lang(ko) .program-kicker {
    letter-spacing: 0.02em;
  }

  .program-title {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3.4vw, 2.25rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    overflow-wrap: break-word;
    font-variation-settings: 'ROND' 100;
  }

  .program-body {
    max-width: 46rem;
    line-height: 1.7;
    color: var(--s-fg-muted);
  }

  .sc-funnel {
    margin-top: 0.75rem;
    display: grid;
    gap: 0.75rem;
  }

  .sc-funnel-caption {
    font-family: var(--font-code);
    font-size: 0.75rem;
    color: var(--s-fg-subtle);
  }

  .sc-funnel-steps {
    display: grid;
    justify-items: center;
    gap: 0.5rem;
  }

  /* Each step is a `< >` band; bands narrow with every round. */
  .sc-funnel-step {
    --notch: 1.1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem 0.75rem;
    inline-size: max(min(100%, 15rem), calc(100% - var(--step) * 16%));
    min-block-size: 3.25rem;
    padding: 0.625rem calc(var(--notch) + 0.75rem);
    clip-path: polygon(
      var(--notch) 0,
      calc(100% - var(--notch)) 0,
      100% 50%,
      calc(100% - var(--notch)) 100%,
      var(--notch) 100%,
      0 50%
    );
    background-color: var(--s-yellow-soft);
    color: var(--s-yellow-ink);
    text-align: center;
  }

  .sc-funnel-step:last-child {
    background-color: var(--color-g-yellow);
    color: #1e1e1e;
  }

  .sc-funnel-value {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .sc-funnel-label {
    font-size: 0.875rem;
    font-weight: 600;
  }
}

/* Wide screens with motion: each card sticks a little lower than the one
   before, so the stack builds as it scrolls. */
@media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
  .program-stack {
    gap: 2.5rem;
  }

  .program-card {
    position: sticky;
    top: calc(var(--site-header-offset) + 1rem + var(--i) * 1.5rem);
  }
}
```

- [ ] **Step 4: GREEN.** `pnpm vitest run tests/components/programs.test.tsx` passes (2 tests).
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "add the <programs> stack and Solution Challenge funnel".

---

### Task 6: `<parts>` modules with generated glyphs

**Files:**
- Create: `app/(home)/[lang]/_components/home/parts.tsx`, `part-glyph.tsx`
- Modify: `app/styles/site-home.css`
- Test: `tests/components/parts.test.tsx`

**Interfaces:**
- Consumes: `landingCopy[lang].parts`, `partsSectionContent`, `partHue`, `fillTemplate`.
- Produces:
  - `Parts({ lang })`
  - `PartGlyph({ kind: PartGlyphKind })`, with `PartGlyphKind = 'layout' | 'layers' | 'graph' | 'mesh' | 'curve' | 'rings'`

- [ ] **Step 1: Write the failing test** — `tests/components/parts.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Parts from '@/app/(home)/[lang]/_components/home/parts'

describe('Parts', () => {
  it('describes all six parts with a link to their sessions', () => {
    render(<Parts lang="en" />)
    const items = screen.getAllByRole('listitem')

    expect(items).toHaveLength(6)
    expect(screen.getByRole('link', { name: 'ML/AI sessions' })).toHaveAttribute(
      'href',
      '/en/session?part=ML%2FAI'
    )
    expect(
      screen.getByText(/server and infrastructure development/)
    ).toBeInTheDocument()
    for (const item of items) {
      expect(item.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('colours each module with its part hue', () => {
    render(<Parts lang="ko" />)

    expect(
      screen.getAllByRole('listitem').map((item) => item.dataset.hue)
    ).toEqual(['blue', 'green', 'yellow', 'sky', 'pink', 'red'])
    expect(screen.getByRole('link', { name: 'Cloud 세션' })).toHaveAttribute(
      'href',
      '/ko/session?part=Cloud'
    )
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/components/parts.test.tsx` → the module does not resolve.

- [ ] **Step 3: Implement.**

`app/(home)/[lang]/_components/home/part-glyph.tsx`:

```tsx
import type { CSSProperties, ReactNode } from 'react'

export type PartGlyphKind =
  | 'layout'
  | 'layers'
  | 'graph'
  | 'mesh'
  | 'curve'
  | 'rings'

const NODES: ReadonlyArray<readonly [number, number]> = [
  [18, 36],
  [50, 14],
  [50, 58],
  [84, 36],
  [104, 18],
]

const GLYPHS: Record<PartGlyphKind, ReactNode> = {
  layout: (
    <>
      <rect x="6" y="6" width="108" height="12" rx="4" className="pg-soft" />
      <rect x="6" y="24" width="32" height="42" rx="4" className="pg-accent" />
      <rect x="44" y="24" width="70" height="18" rx="4" className="pg-soft pg-swap-a" />
      <rect x="44" y="48" width="70" height="18" rx="4" className="pg-soft pg-swap-b" />
    </>
  ),
  layers: (
    <>
      <path d="M16 48 60 64 104 48" className="pg-line pg-layer-low" />
      <path d="M16 36 60 52 104 36" className="pg-line" />
      <path d="M60 8 104 24 60 40 16 24Z" className="pg-accent pg-layer-top" />
    </>
  ),
  graph: (
    <>
      <path d="M18 36 50 14M18 36 50 58M50 14 84 36M50 58 84 36M84 36 104 18" className="pg-line" />
      {NODES.map(([cx, cy], index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r="6"
          className="pg-accent pg-node"
          style={{ '--n': index } as CSSProperties}
        />
      ))}
    </>
  ),
  mesh: (
    <g className="pg-mesh">
      <path d="M10 14h100M10 36h100M10 58h100M20 6v60M46 6v60M72 6v60M98 6v60" className="pg-line" />
      <circle cx="46" cy="36" r="5" className="pg-accent" />
      <circle cx="72" cy="14" r="5" className="pg-accent" />
      <circle cx="98" cy="58" r="5" className="pg-accent" />
    </g>
  ),
  curve: (
    <>
      <path d="M12 60 40 8M108 12 80 64" className="pg-line" />
      <rect x="36" y="4" width="8" height="8" className="pg-soft" />
      <rect x="76" y="60" width="8" height="8" className="pg-soft" />
      <path d="M12 60C40 8 80 64 108 12" pathLength={1} className="pg-stroke pg-draw" />
      <circle cx="12" cy="60" r="5" className="pg-accent" />
      <circle cx="108" cy="12" r="5" className="pg-accent" />
    </>
  ),
  rings: (
    <>
      <circle cx="60" cy="36" r="7" className="pg-accent" />
      {[16, 25, 34].map((r, index) => (
        <circle
          key={r}
          cx="60"
          cy="36"
          r={r}
          className="pg-ring"
          style={{ '--n': index } as CSSProperties}
        />
      ))}
    </>
  ),
}

/**
 * Generated line art per part: layout boxes, layers, a node graph, a mesh,
 * a bézier curve and broadcast rings. Animated on hover or focus
 * (site-home.css).
 */
export default function PartGlyph({ kind }: { kind: PartGlyphKind }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 72"
      className="part-glyph"
    >
      {GLYPHS[kind]}
    </svg>
  )
}
```

`app/(home)/[lang]/_components/home/parts.tsx`:

```tsx
import Link from 'next/link'
import type { Locale } from '@/i18n-config'
import SectionTag from '@/app/components/site/section-tag'
import partsSectionContent from '@/lib/contents/parts-section'
import { landingCopy } from '@/lib/contents/site-copy'
import { fillTemplate } from '@/lib/site/format'
import { partHue } from '@/lib/site/labels'
import PartGlyph, { type PartGlyphKind } from './part-glyph'

const GLYPHS: Record<string, PartGlyphKind> = {
  'Front-End': 'layout',
  'Back-End': 'layers',
  'ML/AI': 'graph',
  Cloud: 'mesh',
  'UI/UX': 'curve',
  DevRel: 'rings',
}

/**
 * `<parts>`: one module per part with its description in the HTML and a
 * link into the Session Log filtered by that part (no prefetch: six query
 * variants of one route would spend the prefetch budget).
 */
export default function Parts({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].parts

  return (
    <section aria-labelledby="parts-title" className="home-section">
      <div className="home-section-head">
        <SectionTag>{copy.tag}</SectionTag>
        <h2 id="parts-title" className="home-section-title">
          {copy.title}
        </h2>
        <p className="home-section-intro">{copy.intro}</p>
      </div>
      <ul className="part-grid">
        {partsSectionContent.map((part) => (
          <li
            key={part.title}
            className="part-module reveal"
            data-hue={partHue(part.title)}
          >
            <PartGlyph kind={GLYPHS[part.title] ?? 'layout'} />
            <h3 className="part-title">{part.title}</h3>
            <p className="part-body">{part.content[lang]}</p>
            <Link
              href={`/${lang}/session?part=${encodeURIComponent(part.title)}`}
              prefetch={false}
              className="part-link"
            >
              {fillTemplate(copy.partLink, { part: part.title })}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

Append to `app/styles/site-home.css`:

```css
@layer components {
  .part-grid {
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 640px) {
    .part-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .part-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .part-module {
    --hue: var(--s-fg-subtle);
    --hue-soft: var(--s-sheet-sunken);
    display: grid;
    align-content: start;
    gap: 0.75rem;
    min-width: 0;
    border: 1px solid var(--s-rule);
    border-radius: 1.5rem;
    background-color: var(--s-sheet);
    padding: 1.5rem;
    transition: border-color var(--dur-fast) var(--ease-out);
  }

  .part-module[data-hue='blue'] {
    --hue: var(--color-g-blue);
    --hue-soft: var(--s-blue-soft);
  }

  .part-module[data-hue='sky'] {
    --hue: var(--color-g-sky);
    --hue-soft: var(--s-sky-soft);
  }

  .part-module[data-hue='green'] {
    --hue: var(--color-g-green);
    --hue-soft: var(--s-green-soft);
  }

  .part-module[data-hue='yellow'] {
    --hue: var(--color-g-yellow);
    --hue-soft: var(--s-yellow-soft);
  }

  .part-module[data-hue='pink'] {
    --hue: var(--color-g-pink);
    --hue-soft: var(--s-pink-soft);
  }

  .part-module[data-hue='red'] {
    --hue: var(--color-g-red);
    --hue-soft: var(--s-red-soft);
  }

  .part-module:focus-within {
    border-color: var(--hue);
  }

  .part-glyph {
    width: 100%;
    max-width: 10rem;
    height: auto;
    overflow: visible;
  }

  .part-glyph * {
    transform-box: fill-box;
    transform-origin: center;
  }

  .part-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
    font-variation-settings: 'ROND' 100;
  }

  .part-body {
    line-height: 1.65;
    color: var(--s-fg-muted);
  }

  .part-link {
    justify-self: start;
    font-weight: 600;
    text-decoration-line: underline;
    text-decoration-color: var(--hue);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.3em;
  }

  .pg-soft {
    fill: var(--hue-soft);
  }

  .pg-accent {
    fill: var(--hue);
  }

  .pg-line,
  .pg-stroke,
  .pg-ring {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .pg-line {
    stroke: var(--s-fg-subtle);
    stroke-width: 2;
  }

  .pg-stroke {
    stroke: var(--hue);
    stroke-width: 4;
  }

  .pg-ring {
    stroke: var(--hue);
    stroke-width: 2.5;
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .pg-swap-a,
  .pg-swap-b,
  .pg-layer-top,
  .pg-layer-low {
    transition: translate var(--dur-slow) var(--ease-spring);
  }

  .pg-mesh {
    transition: transform var(--dur-slow) var(--ease-spring);
  }

  .part-module:is(:hover, :focus-within) .pg-swap-a {
    translate: 0 24px;
  }

  .part-module:is(:hover, :focus-within) .pg-swap-b {
    translate: 0 -24px;
  }

  .part-module:is(:hover, :focus-within) .pg-layer-top {
    translate: 0 -6px;
  }

  .part-module:is(:hover, :focus-within) .pg-layer-low {
    translate: 0 6px;
  }

  .part-module:is(:hover, :focus-within) .pg-node {
    animation: pg-pulse 900ms var(--ease-spring) calc(var(--n) * 90ms) both;
  }

  .part-module:is(:hover, :focus-within) .pg-mesh {
    transform: skewX(-10deg);
  }

  .part-module:is(:hover, :focus-within) .pg-draw {
    animation: pg-draw 900ms var(--ease-out) both;
  }

  .part-module:is(:hover, :focus-within) .pg-ring {
    animation: pg-ring 1400ms var(--ease-out) calc(var(--n) * 180ms)
      infinite;
  }
}

@keyframes pg-pulse {
  40% {
    scale: 1.45;
  }
}

@keyframes pg-draw {
  from {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
  }
  to {
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
  }
}

@keyframes pg-ring {
  from {
    scale: 0.6;
    opacity: 0.8;
  }
  to {
    scale: 1.25;
    opacity: 0;
  }
}
```

- [ ] **Step 4: GREEN.** `pnpm vitest run tests/components/parts.test.tsx` passes (2 tests).
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "add the <parts> section with generated glyphs".

---

### Task 7: `<log>` and `<releases>` from the read models

**Files:**
- Create: `app/(home)/[lang]/_components/home/latest-log.tsx`, `featured-releases.tsx`
- Modify: `lib/site/session-log.ts` (add `latestSessions`)
- Test: `tests/lib/site/session-log.test.ts` (append), `tests/components/home-data-sections.test.tsx`

**Interfaces:**
- Consumes:
  - `getSessionArchive`, `getCachedSessionVisibilityBucket`, `getProjectShowcase`
  - `sortShowcase`, `SessionRow`, `ProjectCard`, `EmptyState`, `RevealSuspense`, `SectionTag`
- Produces:
  - `latestSessions(sessions, limit): LogSession[]`
  - default `LatestLog({ lang })` and `LatestLogList({ lang })`
  - default `FeaturedReleases({ lang })` and `FeaturedReleasesList({ lang })`

- [ ] **Step 1: Write the failing tests.**

Append to `tests/lib/site/session-log.test.ts` (import `latestSessions` with the others):

```ts
describe('latestSessions', () => {
  it('takes the newest dated sessions', () => {
    const archive = [
      session({ id: 'old', startAt: at('2025-03-04T19:00:00.000Z') }),
      session({ id: 'undated', startAt: null }),
      session({ id: 'new', startAt: at('2025-11-04T19:00:00.000Z') }),
      session({ id: 'mid', startAt: at('2025-06-04T19:00:00.000Z') }),
    ]
    expect(latestSessions(archive, 2).map((entry) => entry.id)).toEqual([
      'new',
      'mid',
    ])
  })
})
```

`tests/components/home-data-sections.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LogSession } from '@/lib/site/session-log'
import type { ShowcaseProject } from '@/lib/site/project-showcase'

const { mockGetSessionArchive, mockGetProjectShowcase } = vi.hoisted(() => ({
  mockGetSessionArchive: vi.fn(),
  mockGetProjectShowcase: vi.fn(),
}))

vi.mock('@/lib/server/queries/public/sessions', () => ({
  getSessionArchive: mockGetSessionArchive,
}))
vi.mock('@/lib/server/queries/public/projects', () => ({
  getProjectShowcase: mockGetProjectShowcase,
}))
vi.mock('@/lib/server/cache/session-visibility', () => ({
  getCachedSessionVisibilityBucket: vi.fn(async () => '2026-01-01T00:00:00.000Z'),
}))

import { LatestLogList } from '@/app/(home)/[lang]/_components/home/latest-log'
import { FeaturedReleasesList } from '@/app/(home)/[lang]/_components/home/featured-releases'

const sessionOn = (id: string, day: number): LogSession => ({
  id,
  name: `Session ${id}`,
  nameKo: `세션 ${id}`,
  category: 'tech_talk',
  type: null,
  mainImage: '/session-default.png',
  startAt: new Date(Date.UTC(2025, 10, day, 19)),
  endAt: null,
  location: null,
  locationKo: null,
  createdAt: new Date('2025-10-01T00:00:00.000Z'),
  updatedAt: new Date('2025-10-01T00:00:00.000Z'),
  partName: 'Cloud',
  generationName: '25-26',
  generationStartDate: '2025-03-01',
})

const projectAt = (id: string, month: number): ShowcaseProject => ({
  id,
  name: `Project ${id}`,
  nameKo: null,
  description: 'desc',
  descriptionKo: null,
  mainImage: '/project-default.png',
  repoUrl: null,
  demoUrl: null,
  createdAt: new Date('2025-03-01T00:00:00.000Z'),
  updatedAt: new Date(Date.UTC(2025, month, 1)),
  generationName: '25-26',
  generationStartDate: '2025-03-01',
  tags: [],
  contributors: [],
})

describe('home data sections', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the six newest sessions, newest first', async () => {
    mockGetSessionArchive.mockResolvedValue(
      [3, 9, 1, 12, 7, 5, 20, 14].map((day) => sessionOn(`d${day}`, day))
    )
    render(await LatestLogList({ lang: 'en' }))

    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      'Session d20',
      'Session d14',
      'Session d12',
      'Session d9',
      'Session d7',
      'Session d5',
    ])
  })

  it('features the most recent of three projects', async () => {
    mockGetProjectShowcase.mockResolvedValue(
      [1, 5, 3, 9].map((month) => projectAt(`m${month}`, month))
    )
    const { container } = render(await FeaturedReleasesList({ lang: 'en' }))

    expect(container.querySelectorAll('li.release-item')).toHaveLength(3)
    expect(
      container.querySelector('li.release-item[data-featured]')?.textContent
    ).toContain('Project m9')
  })

  it('shows empty states on a database with nothing public', async () => {
    mockGetSessionArchive.mockResolvedValue([])
    mockGetProjectShowcase.mockResolvedValue([])
    render(
      <>
        {await LatestLogList({ lang: 'en' })}
        {await FeaturedReleasesList({ lang: 'en' })}
      </>
    )

    expect(screen.getByText('No public sessions yet')).toBeInTheDocument()
    expect(screen.getByText('No public projects yet')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/lib/site/session-log.test.ts tests/components/home-data-sections.test.tsx` → `latestSessions` is not exported and the section modules do not resolve.

- [ ] **Step 3: Implement.**

In `lib/site/session-log.ts`, add below the `startTime` constant:

```ts
/** The newest dated sessions, for the home page's log. */
export function latestSessions(
  sessions: readonly LogSession[],
  limit: number
): LogSession[] {
  return sessions
    .filter((session) => session.startAt)
    .sort((a, b) => startTime(b) - startTime(a))
    .slice(0, limit)
}
```

`app/(home)/[lang]/_components/home/latest-log.tsx`:

```tsx
import Link from 'next/link'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import EmptyState from '@/app/components/site/empty-state'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import SectionTag from '@/app/components/site/section-tag'
import SessionRow from '@/app/components/site/session-log/session-row'
import { sessionArchiveCopy } from '@/lib/contents/archive-copy'
import { landingCopy } from '@/lib/contents/site-copy'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { latestSessions } from '@/lib/site/session-log'

const LATEST_COUNT = 6

/** The six newest public sessions, drawn with the Session Log's row. */
export async function LatestLogList({ lang }: { lang: Locale }) {
  const archive = await getSessionArchive(
    await getCachedSessionVisibilityBucket()
  )
  const sessions = latestSessions(archive, LATEST_COUNT)
  const copy = sessionArchiveCopy[lang]

  // Title only: the archive's empty body talks about "this generation".
  if (sessions.length === 0) {
    return <EmptyState title={copy.emptyTitle} />
  }

  return (
    <ol className="log-rows">
      {sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          lang={lang}
          titleLevel={3}
          tbaLabel={copy.tba}
        />
      ))}
    </ol>
  )
}

function LatestLogSkeleton() {
  return (
    <div role="status" aria-label="Loading sessions" className="archive-skeleton">
      {Array.from({ length: LATEST_COUNT }, (_, index) => (
        <span key={index} className="skeleton-bar h-20 w-full" />
      ))}
    </div>
  )
}

/** `<log>`: a static header; the rows stream in from the session archive. */
export default function LatestLog({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].log

  return (
    <section aria-labelledby="latest-log-title" className="home-section">
      <div className="home-section-head home-head-row">
        <div className="grid gap-3">
          <SectionTag>{copy.tag}</SectionTag>
          <h2 id="latest-log-title" className="home-section-title">
            {copy.title}
          </h2>
        </div>
        <Link
          href={`/${lang}/session`}
          transitionTypes={['nav-forward']}
          className="home-more"
        >
          {copy.link}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <RevealSuspense fallback={<LatestLogSkeleton />}>
        <LatestLogList lang={lang} />
      </RevealSuspense>
    </section>
  )
}
```

`app/(home)/[lang]/_components/home/featured-releases.tsx`:

```tsx
import Link from 'next/link'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import EmptyState from '@/app/components/site/empty-state'
import ProjectCard from '@/app/components/site/project-grid/project-card'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import SectionTag from '@/app/components/site/section-tag'
import { projectArchiveCopy } from '@/lib/contents/archive-copy'
import { landingCopy } from '@/lib/contents/site-copy'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import { sortShowcase } from '@/lib/site/project-showcase'

/** The three most recent releases; the first one is featured. */
export async function FeaturedReleasesList({ lang }: { lang: Locale }) {
  const projects = sortShowcase(await getProjectShowcase()).slice(0, 3)
  const copy = projectArchiveCopy[lang]

  if (projects.length === 0) {
    return <EmptyState title={copy.emptyTitle} />
  }

  return (
    <ul className="release-grid">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          lang={lang}
          copy={copy}
          titleLevel={3}
          featured={index === 0}
        />
      ))}
    </ul>
  )
}

function ReleasesSkeleton() {
  return (
    <div role="status" aria-label="Loading projects" className="archive-skeleton">
      <span className="skeleton-bar aspect-[16/7] w-full rounded-3xl" />
      <span className="skeleton-bar h-64 w-full rounded-3xl" />
    </div>
  )
}

/** `<releases>`: a static header; the cards stream in from the showcase. */
export default function FeaturedReleases({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].releases

  return (
    <section aria-labelledby="releases-title" className="home-section">
      <div className="home-section-head home-head-row">
        <div className="grid gap-3">
          <SectionTag>{copy.tag}</SectionTag>
          <h2 id="releases-title" className="home-section-title">
            {copy.title}
          </h2>
        </div>
        <Link
          href={`/${lang}/project`}
          transitionTypes={['nav-forward']}
          className="home-more"
        >
          {copy.link}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <RevealSuspense fallback={<ReleasesSkeleton />}>
        <FeaturedReleasesList lang={lang} />
      </RevealSuspense>
    </section>
  )
}
```

- [ ] **Step 4: GREEN.** The Step 2 command passes.
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "add the <log> and <releases> home sections".

---

### Task 8: `<join>` bookend and the new landing

**Files:**
- Create: `app/(home)/[lang]/_components/home/join.tsx`, `tests/e2e/home.spec.ts`
- Modify:
  - `app/(home)/[lang]/page.tsx`
  - `app/components/site/button-link.tsx` (export `buttonClasses`)
  - `app/styles/site-home.css`, `app/styles/site-hero.css` (foot padding)
  - `app/globals.css` (drop legacy home CSS)
  - `tests/e2e/public-flows.spec.ts` (drop the carousel test)
- Delete: `app/(home)/[lang]/{about-page,activities-page,activities-list,activities-carousel,activity-card,parts-page,part-card}.tsx`, `types/modal.d.ts`
- Test: `tests/components/join.test.tsx`, `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: all home sections (Tasks 4–7), `BracketPoster`, `ButtonLink`, `ExternalLink`, `CHANNELS`, `landingCopy[lang].join`.
- Produces:
  - `Join({ lang })`
  - `buttonClasses(tone?: ButtonTone): string`
  - the landing order: hero → `.home-sheet` (manifesto, programs, parts, log, releases) → join → footer

- [ ] **Step 1: Write the failing tests.**

`tests/components/join.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Join from '@/app/(home)/[lang]/_components/home/join'

describe('Join', () => {
  it('sends people to Instagram first, then LinkedIn and the calendar', () => {
    render(<Join lang="en" />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Build with us' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Recruiting news goes out on Instagram first.')
    ).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')])
    ).toEqual([
      ['Follow on Instagram', 'https://www.instagram.com/gdg.yonseiuniv/'],
      ['LinkedIn', 'https://www.linkedin.com/company/gdsc-yonsei/'],
      ['See the calendar', '/en/calendar'],
    ])
  })
})
```

`tests/e2e/home.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('home page', () => {
  test('tells the story from the hero to the join bookend', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    for (const name of [
      'What is GDGoC Yonsei?',
      'Programs',
      'Six parts',
      'Latest sessions',
      'Latest projects',
      'Build with us',
    ]) {
      await expect(
        page.getByRole('heading', { level: 2, name, exact: true })
      ).toBeVisible()
    }
    await expect(
      page.getByRole('figure', { name: 'Solution Challenge 2023' })
    ).toBeVisible()
  })

  test('links the latest sessions and projects', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    // Other specs add sessions and projects, so count rather than name them.
    const sessions = page
      .getByRole('region', { name: 'Latest sessions' })
      .locator('a[href^="/en/session/"]')
    const projects = page
      .getByRole('region', { name: 'Latest projects' })
      .locator('li.release-item')

    await expect(sessions.first()).toHaveAttribute(
      'href',
      /^\/en\/session\/[^/]+\/[0-9a-f-]{36}$/
    )
    expect(await sessions.count()).toBeLessThanOrEqual(6)
    await expect(projects.first()).toBeVisible()
    expect(await projects.count()).toBeLessThanOrEqual(3)
  })

  test('part links open the Session Log filtered by that part', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Cloud sessions' }).click()

    await expect(page).toHaveURL(/\/en\/session\?part=Cloud$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Session Log' })
    ).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/ko', { waitUntil: 'load' })
    // Scroll through, so scroll-driven states (joining brackets) settle.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y)
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
    })

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBe(0)
  })

  test('shows every section statically under reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/en', { waitUntil: 'load' })

    expect(
      await page
        .locator('.program-card')
        .first()
        .evaluate((card) => getComputedStyle(card).position)
    ).toBe('static')
    expect(
      await page
        .locator('.manifesto-word')
        .first()
        .evaluate((word) => getComputedStyle(word).animationName)
    ).toBe('none')
  })
})
```

- [ ] **Step 2: RED.** Run `pnpm vitest run tests/components/join.test.tsx` → the module does not resolve. Then run `.superpowers/shared/e2e-prod.sh $W/t8-red.log tests/e2e/home.spec.ts` → the section headings are missing.

- [ ] **Step 3: Implement.**

In `app/components/site/button-link.tsx`, lift the shared classes into a helper and use it:

```tsx
const BASE =
  'pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold'

/** Class names of a capsule button, for anchors that aren't next/link. */
export function buttonClasses(tone: ButtonTone = 'solid') {
  return `${BASE} ${tones[tone]}`
}
```

Inside `ButtonLink`, the class becomes `className={cn(BASE, tones[tone], className)}`.

`app/(home)/[lang]/_components/home/join.tsx`:

```tsx
import type { Locale } from '@/i18n-config'
import BracketPoster from '@/app/components/site/bracket-poster'
import ButtonLink, { buttonClasses } from '@/app/components/site/button-link'
import ExternalLink from '@/app/components/site/external-link'
import SectionTag from '@/app/components/site/section-tag'
import { landingCopy } from '@/lib/contents/site-copy'
import { CHANNELS } from '@/lib/site/channels'

/**
 * `<join>`: the bookend to the hero. The brackets close around the call to
 * action as the section scrolls in (site-home.css); with reduced motion they
 * simply sit closed.
 */
export default function Join({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].join

  return (
    <section aria-labelledby="join-title" className="join">
      <div className="join-inner">
        <span aria-hidden="true" className="join-bracket" data-side="left">
          <BracketPoster side="left" />
        </span>
        <div className="join-body">
          <SectionTag>{copy.tag}</SectionTag>
          <h2 id="join-title" className="join-title">
            {copy.title}
          </h2>
          <p className="join-lead">{copy.lead}</p>
          <ul className="join-actions">
            <li>
              <ExternalLink
                href={CHANNELS.instagram}
                className={buttonClasses('stageSolid')}
              >
                {copy.instagram}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink
                href={CHANNELS.linkedin}
                className={buttonClasses('stageOutline')}
              >
                {copy.linkedin}
              </ExternalLink>
            </li>
            <li>
              <ButtonLink href={`/${lang}/calendar`} tone="stageOutline">
                {copy.calendar}
              </ButtonLink>
            </li>
          </ul>
        </div>
        <span aria-hidden="true" className="join-bracket" data-side="right">
          <BracketPoster side="right" />
        </span>
      </div>
    </section>
  )
}
```

Append to `app/styles/site-home.css`:

```css
@layer components {
  /* The paper sheet rises over the hero stage with a capsule-radius edge. */
  .home-sheet {
    position: relative;
    z-index: 1;
    margin-top: -1.5rem;
    overflow-x: clip;
    border-radius: 1.5rem 1.5rem 0 0;
    background-color: var(--s-paper);
    box-shadow: 0 -1.5rem 3rem -1.5rem rgb(0 0 0 / 0.45);
  }

  @media (min-width: 640px) {
    .home-sheet {
      margin-top: -2rem;
      border-radius: 2rem 2rem 0 0;
    }
  }

  .join {
    overflow: clip;
    background-color: var(--s-stage);
    color: var(--s-on-stage);
  }

  .join-inner {
    margin-inline: auto;
    display: grid;
    max-width: 72rem;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: clamp(0.5rem, 3vw, 2.5rem);
    padding: 6rem 1rem;
  }

  .join-bracket {
    display: block;
    width: clamp(2.25rem, 12vw, 9rem);
    aspect-ratio: 219.16 / 265.96;
    font-size: clamp(2.25rem, 12vw, 9rem);
  }

  .join-body {
    display: grid;
    justify-items: center;
    gap: 1rem;
    text-align: center;
  }

  .join .section-tag {
    color: var(--s-on-stage-muted);
  }

  .join-title {
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 7vw, 5rem);
    font-weight: 700;
    line-height: 0.95;
    letter-spacing: -0.04em;
    font-variation-settings: 'ROND' 100;
  }

  .join-lead {
    max-width: 32rem;
    font-size: 1.0625rem;
    color: var(--s-on-stage-muted);
  }

  .join-actions {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
}

/* The brackets travel in from the edges and close around the call to action. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .join-bracket[data-side='left'] {
      animation: join-close-left linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 50%;
    }

    .join-bracket[data-side='right'] {
      animation: join-close-right linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 50%;
    }
  }
}

@keyframes join-close-left {
  from {
    opacity: 0.35;
    translate: -38vw 0;
  }
}

@keyframes join-close-right {
  from {
    opacity: 0.35;
    translate: 38vw 0;
  }
}
```

In `app/styles/site-hero.css`, change the `.hero-foot` padding from `padding: 0 1rem 1.75rem;` to `padding: 0 1rem 3.5rem;`, so the sheet's overlap never covers the meta strip or the cue.

In `app/(home)/[lang]/page.tsx`:
- Replace the three legacy imports (`AboutPage`, `ActivitiesPage`, `PartsPage`) with:

```tsx
import FeaturedReleases from '@/app/(home)/[lang]/_components/home/featured-releases'
import Join from '@/app/(home)/[lang]/_components/home/join'
import LatestLog from '@/app/(home)/[lang]/_components/home/latest-log'
import Manifesto from '@/app/(home)/[lang]/_components/home/manifesto'
import Parts from '@/app/(home)/[lang]/_components/home/parts'
import Programs from '@/app/(home)/[lang]/_components/home/programs'
```

- Replace everything inside the returned fragment after `<JsonLd … />` with:

```tsx
      <Hero
        lang={lang}
        meta={
          <Suspense fallback={<HeroMetaList lang={lang} />}>
            <HeroMeta lang={lang} />
          </Suspense>
        }
      />
      <div className="home-sheet">
        <Manifesto lang={lang} />
        <Programs lang={lang} />
        <Parts lang={lang} />
        <LatestLog lang={lang} />
        <FeaturedReleases lang={lang} />
      </div>
      <Join lang={lang} />
```

Delete the legacy files:

```bash
git rm "app/(home)/[lang]/about-page.tsx" "app/(home)/[lang]/activities-page.tsx" \
  "app/(home)/[lang]/activities-list.tsx" "app/(home)/[lang]/activities-carousel.tsx" \
  "app/(home)/[lang]/activity-card.tsx" "app/(home)/[lang]/parts-page.tsx" \
  "app/(home)/[lang]/part-card.tsx" types/modal.d.ts
```

Then remove their CSS from `app/globals.css`. For each of `content-auto-screen` and `disclosure-card`, run `grep -rn "<class>" app lib`. When the only hit is `app/globals.css`, delete that rule, together with any `.disclosure-card …` descendant rules and `@media` blocks that only style it.

In `tests/e2e/public-flows.spec.ts`, delete the `activity cards move with the previous and next buttons` test.

- [ ] **Step 4: GREEN.**
  - `pnpm vitest run tests/components/join.test.tsx` passes.
  - Run `.superpowers/shared/e2e-prod.sh $W/t8-e2e.log tests/e2e/home.spec.ts tests/e2e/public-flows.spec.ts tests/e2e/public-route-matrix.spec.ts tests/e2e/site-layout.spec.ts`. Expected: all pass, including the instant-navigation project.
- [ ] **Step 5: Visual QA.**
  - Serve the build with `.superpowers/shared/serve-prod.sh --no-build`.
  - Take `node .superpowers/shared/shot.mjs` screenshots of `/en` and `/ko` (with `--ko-font`) at 1280×900 and 390×844, full page.
  - Check that the sheet overlap sits below the cue, the program stack builds on scroll, the glyphs render and the join brackets close.
  - Stop the server by PID.
- [ ] **Step 6: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "assemble the new landing and remove the old home sections".

---

### Task 9: Members

**Files:**
- Create:
  - `lib/site/members.ts`
  - `app/components/site/social-icons.tsx`, `member-card.tsx`
  - `tests/e2e/member-directory.spec.ts`
- Modify:
  - `lib/contents/archive-copy.ts` (`members` crumb, `memberArchiveCopy`)
  - `app/components/site/hub-breadcrumbs.tsx` (`members` section)
  - `app/styles/site-content.css` (member styles)
  - `tests/e2e/instant-navigation.spec.ts`, `scripts/verify-instant-navigation.mjs` (member H1)
- Rewrite: `app/(home)/[lang]/member/page.tsx`, `member/[generation]/page.tsx`, `member/[generation]/loading.tsx`
- Delete: `app/(home)/[lang]/member/[generation]/user-profile-card.tsx`, `app/(home)/[lang]/generation-index-page.tsx`, `app/components/stage-button-group.tsx`
- Test: `tests/lib/site/members.test.ts`, `tests/components/member-card.test.tsx`

**Interfaces:**
- Consumes:
  - `getMembersByGeneration`, `getGenerationSummaries`
  - `GenerationPager` (base path `member`), `generationNeighbors`
  - `PageHeader`, `Breadcrumbs`, `HubBreadcrumbs`, `RevealSuspense`, `PageTransition`, `EmptyState`, `StaticImage`, `JsonLd`
  - `collectionPage`, `breadcrumbList`, `countLabel`, `fillTemplate`, `initials`, `partHue`
- Produces:
  - `MemberProfile`, `memberName(user, lang)` and `memberLinks(user)` from `@/lib/site/members`
  - `MemberCard({ user, lang, copy, preload? })`
  - `memberArchiveCopy` and `MemberArchiveCopy`
  - `archiveCommonCopy[lang].members`
- The member H1 is `{generation} Members` / `{generation} 구성원`. Part headings carry only the part name; the count sits beside the heading.

- [ ] **Step 1: Write the failing tests.**

`tests/lib/site/members.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { memberLinks, memberName, type MemberProfile } from '@/lib/site/members'

const member = (overrides: Partial<MemberProfile> = {}): MemberProfile => ({
  id: 'u1',
  name: 'minji-kim',
  email: 'minji@example.com',
  image: null,
  firstName: 'Minji',
  firstNameKo: '민지',
  lastName: 'Kim',
  lastNameKo: '김',
  githubId: null,
  instagramId: null,
  linkedInId: null,
  isForeigner: false,
  ...overrides,
})

describe('memberName', () => {
  it('uses the Korean name on Korean pages and falls back to English', () => {
    expect(memberName(member(), 'ko')).toBe('김민지')
    expect(memberName(member({ firstNameKo: null }), 'ko')).toBe('Kim Minji')
    expect(memberName(member(), 'en')).toBe('Kim Minji')
  })

  it('falls back to the username when no real name is set', () => {
    expect(memberName(member({ firstName: null, firstNameKo: null }), 'en')).toBe(
      'minji-kim'
    )
  })
})

describe('memberLinks', () => {
  it('normalises profile links however they were typed', () => {
    expect(
      memberLinks(
        member({
          linkedInId: 'https://www.linkedin.com/in/minji/',
          instagramId: '@minji.codes',
          githubId: '@minji',
        })
      )
    ).toEqual([
      { kind: 'email', href: 'mailto:minji@example.com' },
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/minji' },
      { kind: 'instagram', href: 'https://www.instagram.com/minji.codes' },
      { kind: 'github', href: 'https://github.com/minji' },
    ])
  })
})
```

`tests/components/member-card.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MemberCard from '@/app/components/site/member-card'
import { memberArchiveCopy } from '@/lib/contents/archive-copy'
import type { MemberProfile } from '@/lib/site/members'

const member = (overrides: Partial<MemberProfile> = {}): MemberProfile => ({
  id: 'u1',
  name: 'minji-kim',
  email: 'minji@example.com',
  image: null,
  firstName: 'Minji',
  firstNameKo: '민지',
  lastName: 'Kim',
  lastNameKo: '김',
  githubId: '@minji',
  instagramId: null,
  linkedInId: null,
  isForeigner: false,
  ...overrides,
})

function renderCard(user: MemberProfile, lang: 'en' | 'ko' = 'en') {
  return render(
    <ul>
      <MemberCard user={user} lang={lang} copy={memberArchiveCopy[lang]} />
    </ul>
  )
}

describe('MemberCard', () => {
  it('shows initials without a photo and names every icon link', () => {
    const { container } = renderCard(member())

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('KM')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('link', { name: 'GitHub · Kim Minji' })).toHaveAttribute(
      'rel',
      'noreferrer noopener'
    )
    expect(screen.getByRole('link', { name: 'Email · Kim Minji' })).not.toHaveAttribute(
      'target'
    )
  })

  it('uses a decorative photo next to the Korean name', () => {
    const { container } = renderCard(
      member({ image: 'https://avatars.githubusercontent.com/u/1' }),
      'ko'
    )

    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.getByText('김민지')).toBeInTheDocument()
  })

  it('leaves out the link list when there is nothing to link', () => {
    renderCard(member({ email: '', githubId: null }))
    expect(screen.queryByRole('list', { name: /links/i })).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/lib/site/members.test.ts tests/components/member-card.test.tsx` → the modules do not resolve.

- [ ] **Step 3: Implement the helpers, copy and card.**

`lib/site/members.ts`:

```ts
import type { Locale } from '@/i18n-config'
import formatUserName from '@/lib/format-user-name'

/** The member columns the public directory selects (lib/server/queries/public/members.ts). */
export type MemberProfile = {
  id: string
  name: string
  email: string
  image: string | null
  firstName: string | null
  firstNameKo: string | null
  lastName: string | null
  lastNameKo: string | null
  githubId: string | null
  instagramId: string | null
  linkedInId: string | null
  isForeigner: boolean
}

/** Korean pages use the Korean name (family name first) when one is set. */
export function memberName(user: MemberProfile, lang: Locale): string {
  if (lang === 'ko' && user.firstNameKo) {
    return formatUserName(
      user.name,
      user.firstNameKo,
      user.lastNameKo,
      user.isForeigner,
      true
    )
  }
  return formatUserName(user.name, user.firstName, user.lastName, user.isForeigner)
}

export type MemberLinkKind = 'email' | 'linkedin' | 'instagram' | 'github'

export type MemberLink = { kind: MemberLinkKind; href: string }

/** Profile links in a fixed order, normalised from however they were typed. */
export function memberLinks(user: MemberProfile): MemberLink[] {
  const links: MemberLink[] = []
  if (user.email) {
    links.push({ kind: 'email', href: `mailto:${user.email}` })
  }
  if (user.linkedInId) {
    const handle = user.linkedInId
      .replace(/^https?:\/\//, '')
      .replace(/^(www\.)?linkedin\.com\/in\//, '')
      .replace(/\/+$/, '')
    links.push({ kind: 'linkedin', href: `https://www.linkedin.com/in/${handle}` })
  }
  if (user.instagramId) {
    links.push({
      kind: 'instagram',
      href: `https://www.instagram.com/${user.instagramId.replace(/^@/, '')}`,
    })
  }
  if (user.githubId) {
    links.push({
      kind: 'github',
      href: `https://github.com/${user.githubId.replace(/^@/, '')}`,
    })
  }
  return links
}
```

In `lib/contents/archive-copy.ts`:
- Add `members: string` to `ArchiveCommonCopy`, with the values `members: 'Members'` in `en` and `members: '구성원'` in `ko`.
- Append:

```ts
export type MemberArchiveCopy = {
  tag: string
  hubTitle: string
  hubDescription: string
  generationTitle: string
  generationDescription: string
  countOne: string
  countMany: string
  partEmpty: string
  emptyTitle: string
  emptyBody: string
  present: string
  email: string
  linkedin: string
  instagram: string
  github: string
}

export const memberArchiveCopy: Record<Locale, MemberArchiveCopy> = {
  en: {
    tag: '<team />',
    hubTitle: 'Members',
    hubDescription:
      'Meet GDGoC Yonsei organizers and members by generation and explore the student community building technology together at Yonsei University.',
    generationTitle: '{generation} Members',
    generationDescription:
      "Meet the GDGoC Yonsei {generation} members across each technical and community team, and discover the people building Yonsei's student developer community.",
    countOne: '{count} member',
    countMany: '{count} members',
    partEmpty: 'No members in this part yet.',
    emptyTitle: 'No members published yet',
    emptyBody: 'Members appear here once the generation is published.',
    present: 'Present',
    email: 'Email',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    github: 'GitHub',
  },
  ko: {
    tag: '<team />',
    hubTitle: '구성원',
    hubDescription:
      '기수별 GDGoC Yonsei 운영진과 구성원을 만나고 연세대학교에서 함께 기술을 만드는 학생 개발자 커뮤니티를 확인하세요.',
    generationTitle: '{generation} 구성원',
    generationDescription:
      'GDGoC Yonsei {generation} 기수의 파트별 구성원과 학생 개발자 프로필을 확인하고 연세대학교 개발자 커뮤니티의 활동 분야를 만나보세요.',
    countOne: '{count}명',
    countMany: '{count}명',
    partEmpty: '아직 이 파트에 등록된 구성원이 없어요.',
    emptyTitle: '아직 공개된 구성원이 없어요',
    emptyBody: '기수가 공개되면 구성원이 여기에 표시돼요.',
    present: '현재',
    email: '이메일',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    github: 'GitHub',
  },
}
```

`app/components/site/social-icons.tsx`:

```tsx
import type { SVGProps } from 'react'

/* Brand marks drawn in currentColor, so they follow the colour scheme. */
type IconProps = SVGProps<SVGSVGElement>

export function GithubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" focusable="false" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
```

`app/components/site/member-card.tsx`:

```tsx
import EnvelopeIcon from '@heroicons/react/24/outline/EnvelopeIcon'
import type { Locale } from '@/i18n-config'
import {
  GithubIcon,
  InstagramIcon,
  LinkedInIcon,
} from '@/app/components/site/social-icons'
import StaticImage from '@/app/components/site/static-image'
import type { MemberArchiveCopy } from '@/lib/contents/archive-copy'
import { initials } from '@/lib/site/format'
import {
  memberLinks,
  memberName,
  type MemberLinkKind,
  type MemberProfile,
} from '@/lib/site/members'

function LinkIcon({ kind }: { kind: MemberLinkKind }) {
  switch (kind) {
    case 'email':
      return <EnvelopeIcon aria-hidden="true" className="size-4" />
    case 'linkedin':
      return <LinkedInIcon className="size-4" />
    case 'instagram':
      return <InstagramIcon className="size-4" />
    case 'github':
      return <GithubIcon className="size-4" />
  }
}

/** One member. The photo is decorative: the name sits right next to it. */
export default function MemberCard({
  user,
  lang,
  copy,
  preload = false,
}: {
  user: MemberProfile
  lang: Locale
  copy: MemberArchiveCopy
  preload?: boolean
}) {
  const name = memberName(user, lang)
  const links = memberLinks(user)

  return (
    <li className="member-card">
      <span className="member-avatar">
        {user.image ? (
          <StaticImage
            src={user.image}
            alt=""
            width={112}
            height={112}
            sizes="56px"
            preload={preload}
          />
        ) : (
          <span aria-hidden="true">{initials(name)}</span>
        )}
      </span>
      <div className="member-main">
        <p className="member-name">{name}</p>
        {links.length > 0 && (
          <ul className="member-links">
            {links.map(({ kind, href }) => (
              <li key={kind}>
                <a
                  href={href}
                  aria-label={`${copy[kind]} · ${name}`}
                  className="member-link"
                  {...(kind === 'email'
                    ? {}
                    : { target: '_blank', rel: 'noreferrer noopener' })}
                >
                  <LinkIcon kind={kind} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
```

- [ ] **Step 4: GREEN (units).** The Step 2 command passes.

- [ ] **Step 5: Rebuild the member routes.**

In `app/components/site/hub-breadcrumbs.tsx`, widen `section` to `'sessions' | 'projects' | 'members'`.

Replace `app/(home)/[lang]/member/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import LocalizedText from '@/app/components/localized-text'
import EmptyState from '@/app/components/site/empty-state'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import {
  archiveCommonCopy,
  memberArchiveCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { fillTemplate } from '@/lib/site/format'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'

type Props = { params: Promise<{ lang: string }> }

const en = memberArchiveCopy.en
const ko = memberArchiveCopy.ko

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)
  const copy = memberArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/member',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

/*
 * The shell never reads params, so every link here shares one instant App
 * Shell; LocalizedText picks the language with CSS.
 */
export default function MemberIndex({ params }: Props) {
  return (
    <PageTransition>
      <div className="site-page" data-testid="member-directory-shell">
        <Suspense
          fallback={<div aria-hidden="true" className="site-breadcrumbs-skeleton" />}
        >
          <HubBreadcrumbs params={params} section="members" />
        </Suspense>
        <PageHeader
          tag={en.tag}
          title={<LocalizedText en={en.hubTitle} ko={ko.hubTitle} />}
          description={
            <LocalizedText en={en.hubDescription} ko={ko.hubDescription} />
          }
        />
        <RevealSuspense fallback={<MemberHubSkeleton />}>
          <MemberHubContent params={params} />
        </RevealSuspense>
      </div>
    </PageTransition>
  )
}

function MemberHubSkeleton() {
  return (
    <div role="status" aria-label="Loading generations" className="archive-skeleton">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="skeleton-bar h-28 w-full rounded-3xl" />
      ))}
    </div>
  )
}

async function MemberHubContent({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const copy = memberArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const generations = [...(await getGenerationSummaries(lang))].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  )
  const url = getLocalizedUrl(lang, '/member')

  if (generations.length === 0) {
    return <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
  }

  return (
    <>
      <JsonLd
        id="member-hub-structured-data"
        data={[
          ...collectionPage({
            url,
            name: copy.hubTitle,
            description: copy.hubDescription,
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: generations.map((generation) => ({
              name: fillTemplate(copy.generationTitle, {
                generation: generation.name,
              }),
              url: getLocalizedUrl(lang, `/member/${generation.name}`),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.members, url },
          ]),
        ]}
      />
      <ul className="member-generations">
        {generations.map((generation) => (
          <li key={generation.id}>
            <Link
              href={`/${lang}/member/${generation.name}`}
              prefetch={true}
              transitionTypes={['nav-forward']}
              className="member-generation"
            >
              <span className="member-generation-name">{generation.name}</span>
              <span className="member-generation-dates">
                <time dateTime={generation.startDate}>{generation.startDate}</time>
                <span aria-hidden="true">–</span>
                {generation.endDate ? (
                  <time dateTime={generation.endDate}>{generation.endDate}</time>
                ) : (
                  <span className="member-generation-now">{copy.present}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
```

Replace `app/(home)/[lang]/member/[generation]/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import JsonLd from '@/app/components/json-ld'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import EmptyState from '@/app/components/site/empty-state'
import GenerationPager from '@/app/components/site/generation-pager'
import MemberCard from '@/app/components/site/member-card'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  memberArchiveCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getMembersByGeneration } from '@/lib/server/queries/public/members'
import { getGenerationStaticParams } from '@/lib/server/queries/public/static-params'
import { createLocalizedMetadata, getLocalizedUrl } from '@/lib/seo/metadata'
import { countLabel, fillTemplate } from '@/lib/site/format'
import { generationNeighbors } from '@/lib/site/generations'
import { breadcrumbList } from '@/lib/site/json-ld'
import { partHue } from '@/lib/site/labels'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)

  if (!(await getMembersByGeneration(generation, locale))) {
    notFound()
  }

  const copy = memberArchiveCopy[locale]
  return createLocalizedMetadata({
    locale,
    path: `/member/${generation}`,
    title: fillTemplate(copy.generationTitle, { generation }),
    description: fillTemplate(copy.generationDescription, { generation }),
  })
}

export default async function MembersPage({ params }: Props) {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const generations = await getGenerationSummaries(locale)
  const current = generations.find(({ name }) => name === generation)

  if (!current) {
    notFound()
  }

  const copy = memberArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const { older, newer } = generationNeighbors(generations, generation)

  return (
    <PageTransition>
      <div className="site-page">
        <JsonLd
          id="member-generation-structured-data"
          data={breadcrumbList([
            { name: common.home, url: getLocalizedUrl(locale) },
            { name: common.members, url: getLocalizedUrl(locale, '/member') },
            {
              name: generation,
              url: getLocalizedUrl(locale, `/member/${generation}`),
            },
          ])}
        />
        <Breadcrumbs
          label={common.breadcrumb}
          items={[
            { label: common.home, href: `/${locale}` },
            { label: common.members, href: `/${locale}/member` },
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
                basePath="member"
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
        <RevealSuspense fallback={<MemberDirectorySkeleton />}>
          <MemberDirectory generation={generation} lang={locale} />
        </RevealSuspense>
      </div>
    </PageTransition>
  )
}

function MemberDirectorySkeleton() {
  return (
    <div role="status" aria-label="Loading members" className="archive-skeleton">
      <span className="skeleton-bar h-10 w-56 max-w-full" />
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} className="skeleton-bar h-20 w-full" />
      ))}
    </div>
  )
}

async function MemberDirectory({
  generation,
  lang,
}: {
  generation: string
  lang: Locale
}) {
  const data = await getMembersByGeneration(generation, lang)
  const copy = memberArchiveCopy[lang]
  const parts = data?.parts ?? []

  if (parts.every((part) => part.usersToParts.length === 0)) {
    return (
      <div className="mt-8">
        <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
      </div>
    )
  }

  // The first photo on the page is the likely LCP image.
  const firstPhoto = parts
    .flatMap((part) => part.usersToParts)
    .find(({ user }) => user.image)?.user.id

  return (
    <div className="member-directory">
      {parts.map((part) => (
        <section
          key={part.id}
          aria-labelledby={`part-${part.id}`}
          className="member-part"
          data-hue={partHue(part.name)}
        >
          <div className="member-part-head">
            <h2 id={`part-${part.id}`} className="member-part-title">
              {part.name}
            </h2>
            <span className="member-part-count">
              {countLabel(part.usersToParts.length, copy.countOne, copy.countMany)}
            </span>
          </div>
          {part.usersToParts.length === 0 ? (
            <p className="member-part-empty">{copy.partEmpty}</p>
          ) : (
            <ul className="member-grid">
              {part.usersToParts.map(({ user }) => (
                <MemberCard
                  key={user.id}
                  user={user}
                  lang={lang}
                  copy={copy}
                  preload={user.id === firstPhoto}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
```

Replace `app/(home)/[lang]/member/[generation]/loading.tsx` with:

```tsx
export default function MemberGenerationLoading() {
  return (
    <div role="status" aria-label="Loading members" className="site-page">
      <span className="skeleton-bar h-4 w-48" />
      <span className="skeleton-bar mt-6 h-14 w-2/3" />
      <span className="skeleton-bar mt-4 h-5 w-full max-w-xl" />
      <div className="archive-skeleton">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className="skeleton-bar h-20 w-full" />
        ))}
      </div>
      <span className="sr-only">Loading members</span>
    </div>
  )
}
```

Append to the `@layer components` block of `app/styles/site-content.css`:

```css
  /* ── Members ───────────────────────────────────────────────── */
  .member-generations {
    margin-top: 2rem;
    display: grid;
    gap: 0.75rem;
  }

  @media (min-width: 640px) {
    .member-generations {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .member-generation {
    display: flex;
    min-height: 7rem;
    flex-direction: column;
    justify-content: space-between;
    gap: 1rem;
    border: 1px solid var(--s-rule);
    border-radius: 1.5rem;
    background-color: var(--s-sheet);
    padding: 1.25rem 1.5rem;
    transition: border-color var(--dur-fast) var(--ease-out);
  }

  .member-generation-name {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
    font-variation-settings: 'ROND' 100;
  }

  .member-generation-dates {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    font-family: var(--font-code);
    font-size: 0.8125rem;
    color: var(--s-fg-subtle);
  }

  .member-generation-now {
    border-radius: 9999px;
    background-color: var(--s-green-soft);
    padding: 0.125rem 0.625rem;
    font-weight: 600;
    color: var(--s-green-ink);
  }

  .member-directory {
    margin-top: 2.5rem;
    display: grid;
    gap: 3rem;
  }

  .member-part {
    --hue: var(--s-rule);
  }

  .member-part[data-hue='blue'] {
    --hue: var(--color-g-blue);
  }

  .member-part[data-hue='sky'] {
    --hue: var(--color-g-sky);
  }

  .member-part[data-hue='green'] {
    --hue: var(--color-g-green);
  }

  .member-part[data-hue='yellow'] {
    --hue: var(--color-g-yellow);
  }

  .member-part[data-hue='pink'] {
    --hue: var(--color-g-pink);
  }

  .member-part[data-hue='red'] {
    --hue: var(--color-g-red);
  }

  .member-part-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1rem;
    border-top: 3px solid var(--hue);
    padding-top: 1rem;
  }

  .member-part-title {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
    font-variation-settings: 'ROND' 100;
  }

  .member-part-count {
    font-family: var(--font-code);
    font-size: 0.8125rem;
    color: var(--s-fg-subtle);
  }

  .member-part-empty {
    margin-top: 1rem;
    color: var(--s-fg-muted);
  }

  .member-grid {
    margin-top: 1.25rem;
    display: grid;
    gap: 0.75rem;
  }

  @media (min-width: 640px) {
    .member-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .member-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .member-card {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.875rem;
    border: 1px solid var(--s-rule);
    border-radius: 1.25rem;
    background-color: var(--s-sheet);
    padding: 0.875rem 1rem;
  }

  .member-avatar {
    display: grid;
    width: 3.5rem;
    height: 3.5rem;
    flex: none;
    place-items: center;
    overflow: hidden;
    border-radius: 9999px;
    background-color: var(--s-sheet-sunken);
    font-weight: 700;
    color: var(--s-fg-muted);
  }

  .member-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .member-main {
    display: grid;
    min-width: 0;
    gap: 0.375rem;
  }

  .member-name {
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .member-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .member-link {
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    border-radius: 9999px;
    color: var(--s-fg-muted);
    transition:
      background-color var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);
  }
```

Inside the existing `@media (hover: hover)` block at the end of the file, add:

```css
  a.member-generation:hover {
    border-color: var(--s-fg-subtle);
  }

  .member-link:hover {
    background-color: var(--s-sheet-sunken);
    color: var(--s-fg);
  }
```

Delete the replaced files:

```bash
git rm "app/(home)/[lang]/member/[generation]/user-profile-card.tsx" \
  "app/(home)/[lang]/generation-index-page.tsx" app/components/stage-button-group.tsx
```

Sharpen the member contract in the instant checks:
- In `tests/e2e/instant-navigation.spec.ts`, inside `member index to a generation is prefetched for a likely navigation`, replace `page.getByRole('heading', { name: 'Members' })` with `page.getByRole('heading', { level: 1, name: \`${seededData.generationName} Members\` })`.
- In `scripts/verify-instant-navigation.mjs`, replace the member assertion's locator with `page.getByRole('heading', { level: 1, name: /Members$/ })`.

`tests/e2e/member-directory.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('members', () => {
  test('the hub lists generations and opens one', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto('/en/member', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: 'Members', exact: true })
    ).toBeVisible()
    await page.locator(`a[href="/en/member/${seeded.generationName}"]`).click()
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `${seeded.generationName} Members`,
      })
    ).toBeVisible()
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'Members' })
    ).toHaveAttribute('href', '/en/member')
  })

  test('generation pages group members by part', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto(`/en/member/${seeded.generationName}`, {
      waitUntil: 'domcontentloaded',
    })

    await expect(page.getByRole('region', { name: 'E2E Part' })).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    const seeded = await readSeededData()
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(`/ko/member/${seeded.generationName}`, { waitUntil: 'load' })
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

- [ ] **Step 6: GREEN.**
  - Run `pnpm vitest run tests/lib/site/members.test.ts tests/components/member-card.test.tsx tests/components/site-primitives.test.tsx tests/components/common-components.test.tsx`. Expected: pass. `common-components` loses nothing yet; `GenerationButtonGroup` still exists.
  - Run `.superpowers/shared/e2e-prod.sh $W/t9-e2e.log tests/e2e/member-directory.spec.ts tests/e2e/public-route-matrix.spec.ts`. Expected: all pass, including the 7 instant tests.
- [ ] **Step 7: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "restyle the members hub and generation pages".

---

### Task 10: Calendar, policy pages and the last legacy components

**Files:**
- Rewrite: `app/(home)/[lang]/calendar/page.tsx`, `calendar/google-calendar.tsx`
- Modify:
  - `app/(home)/[lang]/privacy-policy/page.tsx`, `terms-of-service/page.tsx`
  - `lib/contents/archive-copy.ts` (`calendar` crumb)
  - `app/components/site/hub-breadcrumbs.tsx` (`calendar` section)
  - `app/styles/site-content.css`, `app/globals.css`
  - `tests/components/common-components.test.tsx`
- Delete: `app/components/page-title.tsx`, `generation-button-group.tsx`, `opacity-div.tsx`, `pop-up-div.tsx`, `lazy-icon.tsx`, `show-more-content.tsx`
- Test: `tests/components/policy-pages.test.tsx`, `tests/components/calendar-page.test.tsx`

**Interfaces:**
- Produces:
  - `CALENDAR_EMBED_URL` from `google-calendar.tsx`
  - `archiveCommonCopy[lang].calendar`
  - the classes `calendar-frame`, `calendar-embed`, `calendar-open` and `policy-doc`

- [ ] **Step 1: Write the failing tests.**

`tests/components/policy-pages.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyPolicyPage from '@/app/(home)/[lang]/privacy-policy/page'
import TermsOfServicePage from '@/app/(home)/[lang]/terms-of-service/page'

const pages = [
  ['privacy', PrivacyPolicyPage],
  ['terms', TermsOfServicePage],
] as const

describe.each(pages)('%s page', (_, Page) => {
  it.each(['en', 'ko'] as const)(
    '%s: one h1, a breadcrumb and no hard-coded light surfaces',
    async (lang) => {
      const { container } = render(
        await Page({ params: Promise.resolve({ lang }) })
      )

      expect(container.querySelectorAll('h1')).toHaveLength(1)
      expect(
        screen.getByRole('navigation', {
          name: lang === 'ko' ? '이동 경로' : 'Breadcrumb',
        })
      ).toBeInTheDocument()
      expect(container.innerHTML).not.toMatch(
        /bg-white|bg-neutral-|text-neutral-|text-gray-|ring-gray-|border-gray-/
      )
    }
  )
})
```

`tests/components/calendar-page.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CalendarPage from '@/app/(home)/[lang]/calendar/page'
import { CALENDAR_EMBED_URL } from '@/app/(home)/[lang]/calendar/google-calendar'

describe('CalendarPage', () => {
  it('frames the embed and offers the calendar in a new tab', () => {
    render(<CalendarPage params={Promise.resolve({ lang: 'en' })} />)

    expect(
      screen.getByTitle('GDGoC Yonsei Google Calendar')
    ).toHaveAttribute('src', CALENDAR_EMBED_URL)
    expect(
      screen.getByRole('link', { name: /Open in Google Calendar/ })
    ).toHaveAttribute('target', '_blank')
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/components/policy-pages.test.tsx tests/components/calendar-page.test.tsx` → the policy pages have no breadcrumb and still carry `bg-white`; `CALENDAR_EMBED_URL` is not exported.

- [ ] **Step 3: Implement the calendar.**

In `lib/contents/archive-copy.ts`, add `calendar: string` to `ArchiveCommonCopy` (`'Calendar'` / `'캘린더'`). In `hub-breadcrumbs.tsx`, widen `section` to include `'calendar'`.

Replace `app/(home)/[lang]/calendar/google-calendar.tsx` with:

```tsx
export const CALENDAR_EMBED_URL =
  'https://calendar.google.com/calendar/embed?src=677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c%40group.calendar.google.com&ctz=Asia%2FSeoul'

export default function GoogleCalendar() {
  return (
    <iframe
      src={CALENDAR_EMBED_URL}
      title="GDGoC Yonsei Google Calendar"
      loading="lazy"
      className="calendar-embed"
    />
  )
}
```

Replace `app/(home)/[lang]/calendar/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import LocalizedText from '@/app/components/localized-text'
import ExternalLink from '@/app/components/site/external-link'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import GoogleCalendar, {
  CALENDAR_EMBED_URL,
} from '@/app/(home)/[lang]/calendar/google-calendar'
import languageParamChecker from '@/lib/language-param-checker'
import { createLocalizedMetadata } from '@/lib/seo/metadata'

type Props = { params: Promise<{ lang: string }> }

const copy = {
  en: {
    title: 'Calendar',
    description:
      'Sessions, workshops, project events and community activities, straight from the chapter calendar in Seoul time.',
    open: 'Open in Google Calendar',
    metaDescription:
      'Check upcoming GDGoC Yonsei technical sessions, workshops, project events, and community activities on the official chapter calendar.',
  },
  ko: {
    title: '캘린더',
    description:
      '기술 세션, 워크숍, 프로젝트 행사와 커뮤니티 활동 일정을 챕터 캘린더에서 서울 시간으로 확인하세요.',
    open: 'Google 캘린더에서 열기',
    metaDescription:
      'GDGoC Yonsei의 기술 세션, 워크숍, 프로젝트 행사와 커뮤니티 활동 일정을 공식 캘린더에서 확인하세요.',
  },
} as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)

  return createLocalizedMetadata({
    locale,
    path: '/calendar',
    title: copy[locale].title,
    description: copy[locale].metaDescription,
  })
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export default function CalendarPage({ params }: Props) {
  return (
    <PageTransition>
      <div className="site-page">
        <Suspense
          fallback={<div aria-hidden="true" className="site-breadcrumbs-skeleton" />}
        >
          <HubBreadcrumbs params={params} section="calendar" />
        </Suspense>
        <PageHeader
          tag="<calendar />"
          title={<LocalizedText en={copy.en.title} ko={copy.ko.title} />}
          description={
            <LocalizedText en={copy.en.description} ko={copy.ko.description} />
          }
          meta={
            <ExternalLink href={CALENDAR_EMBED_URL} className="calendar-open">
              <LocalizedText en={copy.en.open} ko={copy.ko.open} />
            </ExternalLink>
          }
        />
        <div className="calendar-frame">
          <GoogleCalendar />
        </div>
      </div>
    </PageTransition>
  )
}
```

Append to the components layer of `site-content.css`:

```css
  /* ── Calendar and policies ─────────────────────────────────── */
  .calendar-frame {
    margin-top: 2rem;
    overflow: hidden;
    border: 1px solid var(--s-rule);
    border-radius: 1.75rem;
    background-color: var(--s-sheet);
  }

  .calendar-embed {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    border: 0;
    /* Google's embed is always light; say so, so it isn't inverted. */
    color-scheme: light;
  }

  @media (min-width: 768px) {
    .calendar-embed {
      aspect-ratio: 3 / 2;
    }
  }

  .calendar-open {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-weight: 600;
    color: var(--s-blue-ink);
  }

  .policy-doc {
    max-width: 46rem;
  }

  .policy-doc h1 {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: -0.03em;
    font-variation-settings: 'ROND' 100;
  }

  .policy-doc [id] {
    scroll-margin-top: calc(var(--site-header-offset) + 1rem);
  }
```

- [ ] **Step 4: Restyle the policy pages.** Run this script from the repository root. It asserts every anchor, so a mismatch stops it:

```bash
python3 - <<'PY'
import re
from pathlib import Path

OUTER = '<div className="min-h-screen w-full bg-neutral-50 pt-20 text-neutral-900 antialiased">'
CONTENT = '<div id="content" className="mx-auto max-w-4xl px-6 py-10">'
ARTICLE = '<article className="card rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">'
IMPORTS = """import Breadcrumbs from '@/app/components/site/breadcrumbs'
import PageTransition from '@/app/components/site/page-transition'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import { chromeCopy } from '@/lib/contents/site-copy'
"""

for path, crumb in [
    ('app/(home)/[lang]/privacy-policy/page.tsx', 'privacy'),
    ('app/(home)/[lang]/terms-of-service/page.tsx', 'terms'),
]:
    source = Path(path).read_text()
    for anchor in (OUTER, CONTENT, ARTICLE):
        assert source.count(anchor) == 1, (path, anchor)
    # Inside the article, the shared prose styles replace every utility class.
    start = source.index(ARTICLE) + len(ARTICLE)
    end = source.index('</article>')
    source = source[:start] + re.sub(r'\s+className="[^"]*"', '', source[start:end]) + source[end:]
    source = source.replace(
        OUTER,
        '<PageTransition>\n<div className="site-page">\n<Breadcrumbs label={common.breadcrumb} '
        "items={[{ label: common.home, href: `/${lang}` }, { label: chromeCopy[lang]."
        + crumb + ' }]} />',
    )
    source = source.replace(CONTENT, '<div id="content">')
    source = source.replace(ARTICLE, '<article className="policy-doc site-prose prose max-w-none">')
    tail = '    </div>\n  )\n}\n'
    assert source.endswith(tail), path
    source = source[: -len(tail)] + '    </div>\n    </PageTransition>\n  )\n}\n'
    lang_line = '  const lang = languageParamChecker((await params).lang)\n'
    assert source.count(lang_line) == 1, path
    source = source.replace(lang_line, lang_line + '  const common = archiveCommonCopy[lang]\n')
    source = source.replace("import languageParamChecker", IMPORTS + "import languageParamChecker", 1)
    Path(path).write_text(source)
PY
pnpm exec prettier --write "app/(home)/[lang]/privacy-policy/page.tsx" "app/(home)/[lang]/terms-of-service/page.tsx"
```

- [ ] **Step 5: Remove the last legacy components.**

Confirm that nothing outside tests imports them. Each `grep` below must print nothing:

```bash
for m in components/page-title generation-button-group opacity-div pop-up-div lazy-icon show-more-content; do
  grep -rln -- "$m" app lib | grep -v "^app/components/"
done
git rm app/components/page-title.tsx app/components/generation-button-group.tsx \
  app/components/opacity-div.tsx app/components/pop-up-div.tsx \
  app/components/lazy-icon.tsx app/components/show-more-content.tsx
```

In `tests/components/common-components.test.tsx`, delete the imports of `GenerationButtonGroup`, `PageTitle` and `ShowMoreContent`, and every `it(…)` block that renders them.

In `app/globals.css`, for each of `content-auto-section`, `interactive-card` and `focus-ring`, run `grep -rn "<class>" app lib`. When the only hit is `app/globals.css`, delete that rule.

- [ ] **Step 6: GREEN.**
  - The Step 2 command passes, and so does `pnpm vitest run tests/components`.
  - Run `.superpowers/shared/e2e-prod.sh $W/t10-e2e.log tests/e2e/public-flows.spec.ts tests/e2e/public-route-matrix.spec.ts`. Expected: all pass (the desktop calendar test still finds the `Calendar` heading).
- [ ] **Step 7: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "restyle the calendar and policy pages; drop legacy components".

---

### Task 11: Social cards in the new identity

**Files:**
- Modify: `lib/seo/social-image.tsx`
- Test: `tests/lib/social-image-renderer.test.ts` (append)

**Interfaces:**
- Consumes: `CAPSULE_HEX`, `bracketCapsulesInViewBox`, `capsulePath`, `BRACKET_VIEWBOX`.
- Produces: the same `createSocialImageResponse(content)`, now drawing a stage card:
  - `#1E1E1E` background, with halftone brackets when there's no photo
  - a stage-raised chip with the solid bracket mark
  - stage-tinted overlays on photos

- [ ] **Step 1: Write the failing test.** Append inside `describe('social image renderer')`:

```ts
  it('draws fallback cards on the GDG stage with halftone brackets', async () => {
    const response = await createSocialImageResponse({
      title: 'Stage card',
      generation: '25-26',
      category: 'Tech Talk',
      date: 'Nov 4, 2025',
      representativeImage: null,
      version: 'stage-card',
      locale: 'en',
    })
    const { data, info } = await sharp(Buffer.from(await response.arrayBuffer()))
      .raw()
      .toBuffer({ resolveWithObject: true })
    const pixel = (x: number, y: number) => {
      const index = (y * info.width + x) * info.channels
      return [data[index]!, data[index + 1]!, data[index + 2]!] as const
    }

    // A neutral near-black corner, not the old navy.
    const [r, g, b] = pixel(8, 8)
    expect(Math.max(r, g, b)).toBeLessThan(48)
    expect(Math.abs(b - r)).toBeLessThan(10)

    // Capsule colours show through on the right-hand side.
    let colourful = 0
    for (let x = 700; x < 1190; x += 7) {
      for (let y = 100; y < 560; y += 7) {
        const [pr, pg, pb] = pixel(x, y)
        if (Math.max(pr, pg, pb) - Math.min(pr, pg, pb) > 80) colourful += 1
      }
    }
    expect(colourful).toBeGreaterThan(50)
  })
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/lib/social-image-renderer.test.ts` → the corner is navy (`#10243e`, so `b - r` is about 46).

- [ ] **Step 3: Implement.** In `lib/seo/social-image.tsx`:
- Add the imports `import { BRACKET_VIEWBOX, bracketCapsulesInViewBox, capsulePath } from '@/lib/site/bracket-geometry'` and `import { CAPSULE_HEX } from '@/lib/site/brand'`.
- Delete `GdgMark` and `BrandedFallback`, and add:

```tsx
const STAGE = '#1e1e1e'
const STAGE_RAISED = '#2b2b2b'
const ON_STAGE = '#f0f0f0'
const ON_STAGE_MUTED = '#b4b4b4'

const SIDES = ['left', 'right'] as const

/** Both GDG brackets side by side, `gap` bracket-widths apart. */
function bracketsViewBox(gap: number) {
  const width = BRACKET_VIEWBOX.width * (2 + gap)
  return { width, height: BRACKET_VIEWBOX.height }
}

/** The solid `< >` mark for the chip. */
function BracketsMark({ height }: { height: number }) {
  const box = bracketsViewBox(0.18)
  return (
    <svg
      width={(box.width / box.height) * height}
      height={height}
      viewBox={`0 0 ${box.width} ${box.height}`}
    >
      {SIDES.map((side, index) => (
        <g
          key={side}
          transform={`translate(${index * BRACKET_VIEWBOX.width * 1.18} 0)`}
        >
          {bracketCapsulesInViewBox(side).map((capsule) => (
            <path
              key={capsule.hue}
              d={capsulePath(capsule)}
              fill={CAPSULE_HEX[capsule.hue]}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

/** Cards without a photo: the halftone brackets, as the hero draws them. */
function HalftoneBrackets() {
  const box = bracketsViewBox(0.22)
  const width = 760
  return (
    <svg
      width={width}
      height={(box.height / box.width) * width}
      viewBox={`0 0 ${box.width} ${box.height}`}
      style={{ position: 'absolute', right: -40, top: 96 }}
    >
      <defs>
        {Object.entries(CAPSULE_HEX).map(([hue, hex]) => (
          <pattern
            key={hue}
            id={`dots-${hue}`}
            width="9"
            height="9"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="4.5" cy="4.5" r="3.4" fill={hex} />
          </pattern>
        ))}
      </defs>
      {SIDES.map((side, index) => (
        <g
          key={side}
          transform={`translate(${index * BRACKET_VIEWBOX.width * 1.22} 0)`}
        >
          {bracketCapsulesInViewBox(side).map((capsule) => (
            <g key={capsule.hue}>
              <path
                d={capsulePath(capsule)}
                fill={CAPSULE_HEX[capsule.hue]}
                fillOpacity={0.16}
              />
              <path d={capsulePath(capsule)} fill={`url(#dots-${capsule.hue})`} />
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}
```

In `renderSocialImageJpeg`, change the card:
- Root `div`: `color: ON_STAGE` and `background: STAGE`.
- Replace `<BrandedFallback />` with `<HalftoneBrackets />`.
- The overlay's `background` becomes:

```tsx
            background: representativeImage
              ? 'linear-gradient(180deg, rgba(30, 30, 30, 0.2) 0%, rgba(30, 30, 30, 0.35) 40%, rgba(30, 30, 30, 0.95) 100%)'
              : 'linear-gradient(90deg, rgba(30, 30, 30, 0.96) 0%, rgba(30, 30, 30, 0.82) 45%, rgba(30, 30, 30, 0.1) 100%)',
```

- The chip moves to the top left:

```tsx
      <div
        style={{
          position: 'absolute',
          top: 48,
          left: 58,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 20px',
          borderRadius: 999,
          background: STAGE_RAISED,
          color: ON_STAGE,
          fontSize: 25,
          fontWeight: 700,
        }}
      >
        <BracketsMark height={24} />
        <span>GDGoC Yonsei</span>
      </div>
```

- Meta line colour: `color: ON_STAGE_MUTED`. Title colour: `color: ON_STAGE`.

- [ ] **Step 4: GREEN.** Run `pnpm vitest run tests/lib/social-image-renderer.test.ts`. Expected: pass (4 tests including the skipped integration). Then open a rendered fallback for visual QA: write the Step 1 response to `$W/t11-card.jpg` in a one-off `node` REPL, or reuse the e2e image URL from `social-images.spec.ts` on a served build, and look at it.
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "draw social cards on the stage with halftone brackets".

---

### Task 12: Refresh `llms.txt`

**Files:**
- Modify: `app/llms.txt/route.ts`
- Test: `tests/app/llms-route.test.ts`

**Interfaces:**
- Consumes: `CHANNELS`, `partsSectionContent`, `SESSION_CATEGORIES`, `getSiteUrl`.

- [ ] **Step 1: Write the failing test** — `tests/app/llms-route.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { GET } from '@/app/llms.txt/route'

describe('llms.txt', () => {
  it('describes the site, its hubs, their filters and the official channels', async () => {
    const response = GET()
    const text = await response.text()

    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    for (const expected of [
      'Session Log',
      'https://gdgoc.yonsei.ac.kr/en/session',
      'https://gdgoc.yonsei.ac.kr/ko/project',
      '/en/session/{generation}',
      'category (tech_talk, part_session, hackathon, demo_day, devrel)',
      'tag (tech stack)',
      'Front-End, Back-End, ML/AI, Cloud, UI/UX, DevRel',
      'https://www.instagram.com/gdg.yonseiuniv/',
    ]) {
      expect(text).toContain(expected)
    }
  })
})
```

- [ ] **Step 2: RED.** `pnpm vitest run tests/app/llms-route.test.ts` → it has no `Session Log`, filters or parts.

- [ ] **Step 3: Implement.** Replace `app/llms.txt/route.ts` with:

```ts
import { getSiteUrl } from '@/lib/seo/metadata'
import partsSectionContent from '@/lib/contents/parts-section'
import { CHANNELS } from '@/lib/site/channels'
import { SESSION_CATEGORIES } from '@/lib/site/labels'

export function GET() {
  const url = (path: string) => getSiteUrl(path)
  const lines = [
    '# GDGoC Yonsei',
    '',
    '> Official bilingual website of GDG on Campus Yonsei (GDGoC Yonsei), the student developer community at Yonsei University in Sinchon, Seoul.',
    '',
    'Every page exists in English under /en and in Korean under /ko.',
    '',
    '## Community',
    '- T19 ("Tech at 19:00"): an internal tech-sharing session every Tuesday at 19:00 KST.',
    `- Six parts: ${partsSectionContent.map((part) => part.title).join(', ')}.`,
    '- Programs: part sessions, oTP (Open Tech Project) ending in a demo day, the Google Solution Challenge, Yonsei × Korea Demo Day and The Bridge Hackathon.',
    '',
    '## Sessions',
    `- Session Log, every public session newest first: ${url('/en/session')} · ${url('/ko/session')}`,
    '- One generation: /en/session/{generation} (for example /en/session/25-26). One session: /en/session/{generation}/{sessionId}.',
    `- Hub filters are query parameters, comma-separated: q (text), category (${SESSION_CATEGORIES.join(', ')}), part, generation.`,
    '',
    '## Projects',
    `- Projects showcase: ${url('/en/project')} · ${url('/ko/project')}`,
    '- One generation: /en/project/{generation}. One project: /en/project/{generation}/{projectId}.',
    '- Hub filters: q, generation, tag (tech stack), links (demo, source; every selected link must exist).',
    '',
    '## Members and events',
    `- Members by generation: ${url('/en/member')} · ${url('/ko/member')}`,
    `- Calendar: ${url('/en/calendar')} · ${url('/ko/calendar')}`,
    '',
    '## Machine-readable resources and policies',
    `- Sitemap: ${url('/sitemap.xml')}`,
    `- Robots policy: ${url('/robots.txt')}`,
    '- Session and project pages carry schema.org JSON-LD: Event or LearningResource, CreativeWork or SoftwareSourceCode, and BreadcrumbList.',
    `- Privacy policy: ${url('/en/privacy-policy')} · ${url('/ko/privacy-policy')}`,
    `- Terms of service: ${url('/en/terms-of-service')} · ${url('/ko/terms-of-service')}`,
    '',
    '## Official identity',
    `- GDG chapter: ${CHANNELS.chapter}`,
    `- LinkedIn: ${CHANNELS.linkedin}`,
    `- Instagram (recruiting news is posted here first): ${CHANNELS.instagram}`,
    `- Source code: ${CHANNELS.source}`,
    `- Contact: mailto:${CHANNELS.email}`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
```

- [ ] **Step 4: GREEN.** `pnpm vitest run tests/app/llms-route.test.ts` passes.
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "describe the redesigned site in llms.txt".

---

### Task 13: WebGL field robustness (Plan 1 review minors #4, #5, #6, #13)

**Files:**
- Modify: `app/(home)/[lang]/_components/home/bracket-field-gl.ts`, `bracket-stage.tsx`
- Test: `tests/lib/site/bracket-field-gl.test.ts`, `tests/components/bracket-stage.test.tsx`

**Interfaces:**
- Produces:
  - `FieldStatus = 'pending' | 'ready' | 'failed'`
  - `BracketField.status(): FieldStatus`, replacing `isReady()`
  - `packCapsules(capsules, dpr, into?)`, which reuses `into`'s buffers

- [ ] **Step 1: Write the failing tests.** In `tests/lib/site/bracket-field-gl.test.ts`:
- `fakeField()` returns `status: () => 'ready' as const` instead of `isReady: () => true`.
- In `declines software renderers that still hand out a context`, keep the fake as it is.
- Add:

```ts
describe('packCapsules buffers', () => {
  it('fills the buffers it is given instead of allocating per frame', () => {
    const into = {
      positions: new Float32Array(16),
      colors: new Float32Array(12),
      radius: 0,
    }
    expect(packCapsules(capsules, 2, into)).toBe(into)
    expect(into.positions[4]).toBe(12)
    expect(into.radius).toBe(10)
  })
})

describe('createBracketField renderer check', () => {
  it('falls back to gl.RENDERER when the debug extension is missing', () => {
    const canvas = document.createElement('canvas')
    const loseContext = vi.fn()
    const fakeGl = {
      RENDERER: 0x1f01,
      getExtension: (name: string) =>
        name === 'WEBGL_lose_context' ? { loseContext } : null,
      getParameter: (parameter: number) =>
        parameter === 0x1f01 ? 'llvmpipe (LLVM 17.0.0, 256 bits)' : null,
    }
    vi.spyOn(canvas, 'getContext').mockReturnValue(
      fakeGl as unknown as WebGL2RenderingContext
    )
    expect(createBracketField(canvas)).toBeNull()
    expect(loseContext).toHaveBeenCalledTimes(1)
  })
})
```

Inside `describe('mountBracketField')`, add:

```ts
  it('gives up and restores the poster when the shader fails to link', () => {
    const { hero, canvas } = heroFixture()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => frames.push(callback))
    )
    const field = { ...fakeField(), status: () => 'failed' as const }
    mountBracketField(canvas, hero, () => field)

    frames.shift()!(16)

    expect(field.dispose).toHaveBeenCalledTimes(1)
    expect(frames).toHaveLength(0)
  })
```

In `tests/components/bracket-stage.test.tsx`:
- At the top, add `vi.mock('@/app/(home)/[lang]/_components/home/bracket-field-gl', () => { throw new Error('stale chunk') })`.
- Strengthen the reduced-motion test: also stub `requestIdleCallback` with a `vi.fn()` and assert `expect(idle).not.toHaveBeenCalled()`.
- Add:

```tsx
  it('keeps the poster when the field chunk fails to load', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: false, media: query }))
    )
    let start: (() => void) | undefined
    vi.stubGlobal(
      'requestIdleCallback',
      vi.fn((callback: () => void) => {
        start = callback
        return 1
      })
    )
    vi.stubGlobal('cancelIdleCallback', vi.fn())
    const { container } = renderInHero()

    start?.()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(container.querySelector('[data-hero]')).not.toHaveAttribute('data-gl')
  })
```

- [ ] **Step 2: RED.** Run `pnpm vitest run tests/lib/site/bracket-field-gl.test.ts tests/components/bracket-stage.test.tsx`. Expected:
  - `status` is not a function, so the loop keeps requesting frames
  - `packCapsules` ignores `into`
  - llvmpipe is accepted when the debug extension is missing
  - the chunk failure surfaces as an unhandled rejection

- [ ] **Step 3: Implement.** In `bracket-field-gl.ts`:
- Replace `packCapsules` with:

```ts
export type PackedCapsules = {
  positions: Float32Array
  colors: Float32Array
  radius: number
}

/** Writes the capsules into `into` (allocated when omitted) in device pixels. */
export function packCapsules(
  capsules: readonly Capsule[],
  dpr: number,
  into: PackedCapsules = {
    positions: new Float32Array(16),
    colors: new Float32Array(12),
    radius: 0,
  }
): PackedCapsules {
  into.positions.fill(0)
  into.colors.fill(0)
  for (let index = 0; index < Math.min(4, capsules.length); index += 1) {
    const capsule = capsules[index]!
    const offset = index * 4
    into.positions[offset] = capsule.ax * dpr
    into.positions[offset + 1] = capsule.ay * dpr
    into.positions[offset + 2] = capsule.bx * dpr
    into.positions[offset + 3] = capsule.by * dpr
    into.colors.set(CAPSULE_RGB[capsule.hue], index * 3)
  }
  into.radius = (capsules[0]?.r ?? 0) * dpr
  return into
}
```

- Replace `isSoftwareRenderer` with:

```ts
/** Some browsers hide the unmasked renderer; the plain one still names
    software rasterisers. */
function isSoftwareRenderer(gl: WebGL2RenderingContext) {
  const info = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = gl.getParameter(
    info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER
  )
  return SOFTWARE_RENDERER.test(String(renderer))
}
```

- In the `BracketField` type, replace `isReady(): boolean` with `status(): FieldStatus`, and add `export type FieldStatus = 'pending' | 'ready' | 'failed'`.
- In `createBracketField`:
  - Add `const packed: PackedCapsules = { positions: new Float32Array(16), colors: new Float32Array(12), radius: 0 }` next to `let dpr = 1`.
  - Replace `isReady()` with:

```ts
    status() {
      if (uniforms) return 'ready'
      if (failed) return 'failed'
      if (
        parallel &&
        !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)
      ) {
        return 'pending'
      }
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        failed = true
        return 'failed'
      }
      setup()
      return 'ready'
    },
```

  - In `draw`, replace `const packed = packCapsules(capsules, dpr)` with `packCapsules(capsules, dpr, packed)`.
  - At the end of `dispose()`, add:

```ts
      // Give the full-viewport drawing buffer back, e.g. while the home
      // route sits hidden in <Activity>.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.width = 1
      canvas.height = 1
```

- In `mountBracketField`'s `frame`, replace `if (!field.isReady()) return` with:

```ts
    const status = field.status()
    if (status === 'failed') {
      teardown()
      return
    }
    if (status === 'pending') return
```

In `bracket-stage.tsx`, change `start` to catch a failed chunk load:

```tsx
    const start = () => {
      import('./bracket-field-gl')
        .then(({ mountBracketField }) => {
          if (!cancelled) teardown = mountBracketField(canvas, hero)
        })
        // A stale or blocked chunk only costs the live field; the poster stays.
        .catch(() => {})
    }
```

- [ ] **Step 4: GREEN.** The Step 2 command passes.
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "harden the WebGL field against link failures and stale chunks".

---

### Task 14: Chrome polish and test gaps (Plan 1 review minors #9, #10, #11, #13)

**Files:**
- Modify:
  - `app/components/site/not-found-view.tsx`
  - `app/styles/site-theme.css` (overscroll surfaces), `app/styles/site-chrome.css` (wordmark size)
  - `tests/lib/site/client-bundle-guards.test.ts`
- Test:
  - `tests/components/not-found-view.test.tsx`
  - `tests/e2e/site-layout.spec.ts` (append)
  - `tests/e2e/public-flows.spec.ts` (append to `mobile navigation`)

**Interfaces:**
- Produces:
  - Root 404 links `/`, `/session` and `/project`; the proxy picks the locale.
  - `html.site` paints the stage and `body` paints the paper.

- [ ] **Step 1: Write the failing tests.**

In `tests/components/not-found-view.test.tsx`, add:

```tsx
  it('lets the proxy choose the language for its links', () => {
    render(<NotFoundView />)

    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    ).toEqual(['/', '/session', '/project'])
    expect(screen.getByText('세션')).toHaveAttribute('lang', 'ko')
  })
```

Append to `tests/e2e/site-layout.spec.ts`:

```ts
test('overscroll shows the stage while pages stay on paper', async ({
  page,
}) => {
  await page.goto('/en/session', { waitUntil: 'domcontentloaded' })

  expect(
    await page.evaluate(() => [
      getComputedStyle(document.documentElement).backgroundColor,
      getComputedStyle(document.body).backgroundColor,
    ])
  ).toEqual(['rgb(30, 30, 30)', 'rgb(240, 240, 240)'])
})

test('the footer wordmark fits a 320px screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/en', { waitUntil: 'load' })
  const wordmark = page.locator('.site-footer-wordmark')

  expect(
    await wordmark.evaluate((element) => element.scrollWidth <= element.clientWidth)
  ).toBe(true)
})
```

Append inside `test.describe('mobile navigation')` in `tests/e2e/public-flows.spec.ts`:

```ts
  test('Escape closes the menu and returns focus to its button', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    const trigger = page.getByRole('button', { name: 'Open navigation menu' })

    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
```

Replace the traversal in `tests/lib/site/client-bundle-guards.test.ts`, so it follows relative imports, directory `index` files and `export … from` re-exports, and checks resolved paths instead of import strings:

```ts
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Client components ship to every visitor. The public chrome must not pull
 * tailwind-merge (via `cn`, ~9 KB gz) or a whole bilingual copy dictionary
 * into the browser; server parents pass the few strings they need as props.
 */
const ROOTS = [
  'app/components/site',
  'app/components/header',
  'app/(home)/[lang]/_components',
]
const FORBIDDEN = [
  'lib/cn.ts',
  'lib/contents/site-copy.ts',
  'lib/contents/archive-copy.ts',
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

function resolveImport(from: string, specifier: string): string | null {
  const base = specifier.startsWith('@/')
    ? specifier.slice(2)
    : specifier.startsWith('.')
      ? join(dirname(from), specifier)
      : null
  if (!base) return null
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
  ]) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

/** Value imports, side-effect imports and re-exports inside the repo. */
function dependencies(path: string): string[] {
  const source = readFileSync(path, 'utf8')
  return [
    ...source.matchAll(/^import\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]/gm),
    ...source.matchAll(/^import\s+['"]([^'"]+)['"]/gm),
    ...source.matchAll(/^export\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]/gm),
  ]
    .map((match) => resolveImport(path, match[1]!))
    .filter((resolved): resolved is string => resolved !== null)
}

/** Every module a 'use client' file under ROOTS reaches by value. */
function clientGraph(): Set<string> {
  const queue = ROOTS.flatMap(files).filter(
    (path) =>
      /\.(tsx?|jsx?)$/.test(path) &&
      /^['"]use client['"]/m.test(readFileSync(path, 'utf8'))
  )
  const seen = new Set<string>()
  while (queue.length > 0) {
    const path = queue.pop()!
    if (seen.has(path)) continue
    seen.add(path)
    queue.push(...dependencies(path))
  }
  return seen
}

describe('public client bundles', () => {
  it('finds the client modules it guards', () => {
    expect(clientGraph().size).toBeGreaterThan(0)
  })

  it.each(FORBIDDEN)('never reach %s', (forbidden) => {
    expect([...clientGraph()]).not.toContain(forbidden)
  })

  it('resolves relative and index imports', () => {
    expect(resolveImport('app/components/site/filter-bar.tsx', '../../../lib/site/format')).toBe(
      'lib/site/format.ts'
    )
  })
})
```

- [ ] **Step 2: RED.**
  - Run `pnpm vitest run tests/components/not-found-view.test.tsx` → the links point at `/en/session`, and there is no `lang` span.
  - Run `.superpowers/shared/e2e-prod.sh $W/t14-red.log tests/e2e/site-layout.spec.ts tests/e2e/public-flows.spec.ts`. Expected: the overscroll test fails (`html` is paper) and so does the 320 px wordmark test (clipped by about 6 px). The Escape test already passes; it pins native `<dialog>` behaviour the unit test can't.

- [ ] **Step 3: Implement.**

In `not-found-view.tsx`, replace `links` and the anchor contents:

```tsx
const links = [
  { href: '/', en: 'Home', ko: '홈' },
  { href: '/session', en: 'Sessions', ko: '세션' },
  { href: '/project', en: 'Projects', ko: '프로젝트' },
]
```

```tsx
            {link.en} · <span lang="ko">{link.ko}</span>
```

The component's comment becomes `/** Root 404 content. No locale is known here, so the copy is bilingual and the links let the proxy pick the language. */`. The `key` stays `link.href`.

In `app/styles/site-theme.css`, inside the `html.site` rule, change `background-color: var(--s-paper);` to `background-color: var(--s-stage);`. After that rule, add:

```css
  /* Overscroll past either end shows the stage (the header, hero, footer and
     404 are all stage) while the page itself is paper. */
  html.site > body {
    min-height: 100svh;
    background-color: var(--s-paper);
  }
```

In `app/styles/site-chrome.css`, change the wordmark size to `font-size: clamp(2rem, 11.4vw, 10rem);`.

- [ ] **Step 4: GREEN.**
  - Run `pnpm vitest run tests/components/not-found-view.test.tsx tests/lib/site/client-bundle-guards.test.ts`. Expected: pass.
  - Rerun the Step 2 e2e command. Expected: all pass.
- [ ] **Step 5: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "polish the chrome: locale-neutral 404 links, overscroll surfaces, wordmark size".

---

### Task 15: The dark scheme

**Files:**
- Modify:
  - `app/(home)/[lang]/layout.tsx`, `app/not-found.tsx`
  - `app/styles/site-theme.css` (comment; reflow the `--font-code` stack)
- Test:
  - `tests/lib/site/public-surfaces.test.ts`
  - `tests/lib/site/theme-contrast.test.ts` (extend)
  - `tests/e2e/dark-scheme.spec.ts`

**Interfaces:**
- Produces: `<html data-color-scheme="auto" class="site …">` on every public page, so `site-theme.css` switches tokens with `prefers-color-scheme`.

- [ ] **Step 1: Write the failing tests.**

`tests/e2e/dark-scheme.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('dark scheme', () => {
  test.use({ colorScheme: 'dark' })

  test('public pages switch to dark paper and light text', async ({ page }) => {
    const seeded = await readSeededData()
    for (const path of [
      '/en',
      '/en/session',
      '/en/project',
      '/en/member',
      `/en/member/${seeded.generationName}`,
      '/en/calendar',
      '/en/privacy-policy',
    ]) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(
        await page.evaluate(() => [
          getComputedStyle(document.body).backgroundColor,
          getComputedStyle(document.body).color,
        ]),
        path
      ).toEqual(['rgb(22, 22, 22)', 'rgb(240, 240, 240)'])
    }
  })
})
```

`tests/lib/site/public-surfaces.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Public pages follow the system colour scheme (site-theme.css), so their
 * surfaces and text must come from the scheme tokens (bg-paper, text-fg …).
 * Tailwind's fixed neutrals or a solid white would leave light islands in the
 * dark scheme. White-alpha on stage surfaces is fine: the stage is dark in
 * both schemes, and state variants such as `hover:bg-white` on a stage button
 * are allowed.
 */
const ROOTS = [
  'app/(home)/[lang]',
  'app/components/site',
  'app/components/header',
  'app/components/footer.tsx',
]
const SKIP = /2026-freshman-ot/
const FIXED_NEUTRAL =
  /\b(?:bg|text|border|ring|divide|from|via|to)-(?:neutral|gray|slate|zinc|stone)-\d{2,3}\b/
const SOLID_WHITE = /(?<![\w:-])bg-white(?![\w/-])/

function files(path: string): string[] {
  return statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => files(join(path, name)))
    : [path]
}

const sources = ROOTS.flatMap(files).filter(
  (path) => /\.tsx?$/.test(path) && !SKIP.test(path)
)

describe('public surfaces follow the colour scheme', () => {
  it.each(sources)('%s uses scheme tokens', (path) => {
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(FIXED_NEUTRAL)
    expect(source).not.toMatch(SOLID_WHITE)
  })
})
```

Extend `tests/lib/site/theme-contrast.test.ts` with the dark tints, which are OKLab `color-mix()`es:

```ts
const darkTokens = theme.slice(theme.indexOf('@media (prefers-color-scheme: dark)'))

function darkToken(name: string): string {
  const match = darkTokens.match(new RegExp(`--s-${name}:\\s*(#[0-9a-f]{6})`, 'i'))
  if (!match?.[1]) throw new Error(`missing dark --s-${name}`)
  return match[1]
}

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

function hexToLinear(hex: string): [number, number, number] {
  return [1, 3, 5].map((index) => toLinear(parseInt(hex.slice(index, index + 2), 16) / 255)) as [
    number,
    number,
    number,
  ]
}

function linearToOklab([r, g, b]: [number, number, number]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToLinear([L, a, b]: number[]): [number, number, number] {
  const l = (L! + 0.3963377774 * a! + 0.2158037573 * b!) ** 3
  const m = (L! - 0.1055613458 * a! - 0.0638541728 * b!) ** 3
  const s = (L! - 0.0894841775 * a! - 1.291485548 * b!) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const linearLuminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * Math.min(1, Math.max(0, r)) +
  0.7152 * Math.min(1, Math.max(0, g)) +
  0.0722 * Math.min(1, Math.max(0, b))

/** Luminance of `color-mix(in oklab, <hue> <p>%, <base>)`. */
function mixedLuminance(hue: string, percent: number, base: string) {
  const a = linearToOklab(hexToLinear(hue))
  const b = linearToOklab(hexToLinear(base))
  const p = percent / 100
  return linearLuminance(oklabToLinear(a.map((value, index) => value * p + b[index]! * (1 - p))))
}

describe('dark scheme hue tokens', () => {
  it.each(['blue', 'sky', 'red', 'pink', 'yellow', 'green'])(
    '%s ink passes AA on dark paper and on its dark tint',
    (hue) => {
      const mix = darkTokens.match(
        new RegExp(`--s-${hue}-soft: color-mix\\(in oklab, (#[0-9a-f]{6}) (\\d+)%, (#[0-9a-f]{6})\\)`, 'i')
      )
      if (!mix) throw new Error(`missing dark --s-${hue}-soft`)
      const ink = linearLuminance(hexToLinear(darkToken(`${hue}-ink`)))
      const tint = mixedLuminance(mix[1]!, Number(mix[2]), mix[3]!)
      const paper = linearLuminance(hexToLinear(darkToken('paper')))
      const ratio = (x: number, y: number) =>
        (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)

      expect(ratio(ink, tint)).toBeGreaterThanOrEqual(4.5)
      expect(ratio(ink, paper)).toBeGreaterThanOrEqual(4.5)
    }
  )
})
```

- [ ] **Step 2: RED.**
  - Run `.superpowers/shared/e2e-prod.sh $W/t15-red.log tests/e2e/dark-scheme.spec.ts`. Expected: fails, because body is still `rgb(240, 240, 240)`.
  - Run `pnpm vitest run tests/lib/site/public-surfaces.test.ts tests/lib/site/theme-contrast.test.ts`. Expected: passes. Tasks 8–10 removed every fixed neutral, and the dark inks already pass (lowest ratio 4.97 on the pink tint). Both are regression guards.

- [ ] **Step 3: Implement.**
  - In `app/(home)/[lang]/layout.tsx`, add `data-color-scheme="auto"` to `<html>`.
  - In `app/not-found.tsx`, add the same attribute.
  - In `site-theme.css`, replace the comment above the dark block with `/* The public site follows the system scheme; the layout opts in with data-color-scheme="auto". Stage surfaces stay dark in both schemes. */`.
  - Reflow the `--font-code` value to:

```css
  --font-code:
    var(--font-code-mono), 'Pretendard Variable', 'Apple SD Gothic Neo',
    'Malgun Gothic', 'Noto Sans KR', 'Noto Sans CJK KR', ui-monospace,
    SFMono-Regular, Menlo, Consolas, monospace;
```

- [ ] **Step 4: GREEN.** Rerun the Step 2 commands. Expected: all pass.
- [ ] **Step 5: Visual QA in dark.**
  - Serve the build (`serve-prod.sh --no-build`).
  - Take `shot.mjs … --dark` screenshots at 1280 and 390 of `/en`, `/en/session`, a session detail, `/en/project`, a project detail, `/en/member/<generation>`, `/en/calendar` and `/en/privacy-policy`.
  - Look at each one: no light islands, legible chips, visible glyph lines, and the calendar framed.
  - Fix any issue with a failing test first.
  - Stop the server.
- [ ] **Step 6: Checkpoint.** `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`, then commit: "follow the system colour scheme on public pages".

---

### Task 16: Verification and polish

**Files:** fixes found here, each with its own failing test first.

- [ ] **Step 1: Static checks.** Run `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`. Record the file and test counts.
- [ ] **Step 2: Full production e2e.** Run `.superpowers/shared/e2e-prod.sh $W/t16-e2e.log`. Expected: every test passes.
- [ ] **Step 3: Performance on dev data.**

```bash
.superpowers/shared/dev-data.sh
(.superpowers/shared/serve-prod.sh --no-seed > $W/t16-start.log 2>&1 &)
PERF_OUTPUT=$W/perf-plan3.json pnpm perf:measure > $W/t16-perf.log 2>&1
pnpm perf:budget $W/perf-plan3.json .superpowers/shared/perf-baseline.json
pnpm perf:instant
```

Expected:
- home encoded JS ≤ 157,246 B, now that the legacy carousel is gone
- no route over 170,000 B
- CLS ≤ 0.05
- `perf:instant` prints `PASS` for all 8 checks

Compare the LCPs with `perf-plan3-start.json`. If the budget fails, read the per-route JS delta and fix the cause before continuing. Record every number in the ledger.

- [ ] **Step 4: Browser QA** with the server from Step 3 still running:
  1. Screenshots at 360, 768, 1280 and 1920 px, light and dark, of `/en`, `/ko` (`--ko-font`), `/en/member`, `/en/member/25-26`, `/en/calendar`, `/en/privacy-policy` and `/ko/terms-of-service`.
  2. At 320 px, `scrollWidth === clientWidth` on every page from item 1 (`node .superpowers/shared/overflow.mjs`).
  3. A keyboard-only pass on `/en`:
     - the skip link comes first
     - every part link has a visible focus ring and animates its glyph
     - the join buttons are reachable
  4. Reduced motion (`--reduced`):
     - no sticky stack
     - the manifesto is fully lit
     - the join brackets are closed
  5. Lighthouse through the `lighthouse@12` CLI with Playwright's Chromium (`CHROME_PATH`), on `/en`, `/en/member/25-26`, `/en/calendar` and `/en/privacy-policy`, light and dark. Expected: accessibility 100, SEO 100, best practices ≥ 95.
  6. `curl -s http://localhost:3100/llms.txt` reads correctly. `curl -s http://localhost:3100/sitemap.xml | grep -c '<loc>'` is unchanged from Plan 2 on the same data.
- [ ] **Step 5: Checkpoint.**
  - Stop the server by PID.
  - Ledger the results: suite counts, the e2e total, perf numbers, Lighthouse scores and QA findings.
  - Commit any fix-ups: "fix issues found in the Plan 3 verification pass".
