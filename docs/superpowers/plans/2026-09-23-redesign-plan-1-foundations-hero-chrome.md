# Redesign Plan 1 — Foundations, Signature Hero, Global Chrome

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the "Inside the Brackets" design system (tokens, fonts, motion), the `< GDGoC Yonsei >` hero with its idle-loaded WebGL halftone field, and the new header, mobile menu, footer, and 404/error pages. The home page keeps its old About/Activities/Parts sections below the hero until Plan 3.

**Architecture:**
- Public-only tokens live in `app/styles/*.css` on `html.site`. The admin shell never renders that class, so its `:root` tokens are unaffected.
- The hero is a server-rendered SVG "poster" that draws the real GDG capsule geometry, so LCP is the H1 text and doesn't depend on JS.
- A tiny client island imports a ~5 KB raw WebGL2 module when the browser is idle. The module draws the same capsules as a live halftone field and hides the poster.
- Header and footer stay server components with small client leaves (pathname-aware nav, native `<dialog>` menu, KST clock).

**Tech Stack:** Next.js 16.3 (App Router, `cacheComponents`), React 19 canary (bundled), Tailwind CSS 4 (`@theme inline`), `next/font/google` (Google Sans Flex + Google Sans Code), WebGL2, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-23-inside-the-brackets-redesign-design.md` (sections 1, 3 "Global chrome" and "Landing › Hero", 5 "WebGL hero", 6 phases 0–3).

**Series:** Plan 1 of 3. Plan 2 covers data, admin tags, Sessions and Projects. Plan 3 covers the landing sections, restyles, OG images, ⌘K and final verification.

**Deliberate deviations from the spec** (each confirmed from the codebase):
- **Style location.** Styles live in `app/styles/site-{theme,hero,chrome}.css`, split by responsibility, instead of a single `app/site-theme.css`.
- **Nav order.** Sessions · Projects · **Calendar · Members**, as set by the team in commit `348835e`. The spec listed Members before Calendar.
- **Dark scheme.** It's gated behind `data-color-scheme='auto'`, which Plan 3 sets once every page is restyled.
- **Deferred to first use:**
  - Plan 2: the view-transition CSS, `types/react-canary.d.ts`, `lib/site/labels.ts`, and the breadcrumb, page-header, chip and section-tag primitives.
  - Plan 3: the sticky hero scene where the paper sheet slides over the stage. It needs the manifesto section.

## Global Constraints

- **Performance budgets** (`scripts/check-performance-budget.mjs`):
  - encoded JS ≤ 170,000 B and RSC ≤ 70,000 B per route
  - LCP ≤ 2,500 ms, CLS ≤ 0.05, TBT ≤ 2,500 ms
  - requests ≤ 75, prefetches ≤ 25
  - JS may not regress more than 5% against the baseline
- **No new npm dependencies.** No `motion` import in any file that public pages render.
- **Identity:**
  - Chevron geometry comes only from the capsule measurements of `app/components/svg/gdg-logo.tsx`.
  - Colors come only from the GDG palette: core `#4285F4` `#EA4335` `#F9AB00` `#34A853`; bright `#57CAFF` `#FF7DAF` `#FFD427` `#5CDB6D`; pastel `#C3ECF6` `#F8D8D8` `#FFE7A5` `#CCF6C5`; neutrals `#1E1E1E` `#F0F0F0`.
  - Type: Google Sans Flex and Google Sans Code for Latin, Pretendard Variable for Hangul.
- **Never run `pnpm build`, `pnpm db:*` or `pnpm test:e2e*` locally.** `.env` points at a remote shared database (129.154.50.184): `pnpm build` runs migrations and the e2e setup truncates. Use `pnpm exec next build`, which only reads. E2E runs in CI (`.github/workflows/performance.yml`, disposable Postgres).
- **Keep these contracts:**
  - URLs and the `proxy.ts` 404 behavior (its HTML must still contain `404 Not Found`)
  - the button names `Open navigation menu` / `Close navigation menu` and `탐색 메뉴 열기` / `탐색 메뉴 닫기`
  - the footer link names `Email GDGoC Yonsei`, `GDGoC Yonsei LinkedIn`, `GDGoC Yonsei Instagram`
- **Nav order stays** Sessions · Projects · Calendar · Members · GYMS (the team's choice, commit `348835e`).
- **Dark scheme stays off** until Plan 3. Its CSS only applies to `html.site[data-color-scheme='auto']`, and nothing sets that attribute yet, because the old pages below the hero still hard-code light surfaces.
- **Commits:** only when the user asks. Every task ends with a checkpoint that lists the files to stage.

## Review Focus

1. **No WebGL2, or a lost GPU context** (older phones, driver resets). The hero must never go blank: the SVG poster stays or returns. Pinned by Task 4's `mountBracketField` tests (factory returns `null`, and `webglcontextlost` tears down and clears `data-gl`).
2. **Reduced motion or Save-Data.** No WebGL, no bracket parting, and no entrance travel, only static content. Pinned by Task 4's `BracketStage` test, which never schedules the loader.
3. **Switching language on a deep page.** `/en/session/25-26/<id>` must go to `/ko/session/25-26/<id>`, not the KO home page. Pinned by Task 5's `localizedPath` table and the header/footer render assertions.
4. **Mobile menu lifecycle.** Opening it moves focus inside, a link click closes it, and the trigger reflects state. Escape and focus return are browser-native; they're covered by the updated Playwright spec in CI. Pinned by Task 5's dialog test.
5. **Narrow screens (320–390 px).** `< GDGoC Yonsei >` and the header must not cause horizontal scrolling. Pinned by Task 8's browser QA script (`scrollWidth === innerWidth` at 320, 360 and 390 px).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `app/styles/site-theme.css` | create | Scheme tokens on `html.site`, base type, `@theme` utilities |
| `app/styles/site-chrome.css` | create | Header capsule, mobile menu dialog, footer, locale switch |
| `app/styles/site-hero.css` | create | Hero layout, bracket slots, entrance and parting animations |
| `app/globals.css` | modify | Import the three files; later remove the shooting-star and legacy home CSS |
| `app/fonts.ts` | create | `next/font/google` instances shared by the public layout and the root 404 |
| `app/(home)/[lang]/layout.tsx` | modify | `html.site`, fonts, skip link, `#main`, theme color |
| `lib/contents/site-copy.ts` | create | EN/KO strings for chrome and hero |
| `lib/site/bracket-geometry.ts` | create | Capsule model derived from the logo, SVG paths, rect mapping, parting math |
| `lib/site/localized-path.ts` | create | Swap the locale segment of a pathname |
| `app/components/site/bracket-poster.tsx` | create | Server SVG halftone bracket (one side) |
| `app/components/site/button-link.tsx` | create | Capsule CTA link with tones |
| `app/components/site/locale-switch.tsx` | create | EN/KO segmented links (hook-free view) |
| `app/components/site/footer-locale-switch.tsx` | create | Client leaf that feeds `usePathname()` into `LocaleSwitch` |
| `app/components/site/seoul-clock.tsx` | create | Client leaf: live HH:MM KST |
| `app/(home)/[lang]/_components/home/hero.tsx` | create | Hero section |
| `app/(home)/[lang]/_components/home/bracket-stage.tsx` | create | Client island: capability gate, idle-imports the GL module |
| `app/(home)/[lang]/_components/home/bracket-field-gl.ts` | create | WebGL2 program, uniform packing, runtime wiring |
| `app/(home)/[lang]/page.tsx` | modify | Hero replaces `WelcomePage` |
| `app/components/header/index.tsx` | rewrite | Floating stage capsule (server) |
| `app/components/header/navigation.tsx` | rewrite | Desktop nav, locale switch, `<dialog>` mobile menu (client) |
| `app/components/header/navigation-links.ts` | modify | Link list built from `chromeCopy`; GYMS marked as a utility link |
| `app/components/footer.tsx` | rewrite | Stage footer, columns, wordmark, clock, locale switch |
| `app/not-found.tsx` | rewrite | `< 404 >` page |
| `app/(home)/[lang]/error.tsx` | rewrite | Bilingual error boundary in the site system |
| `proxy.ts` | modify | Restyled inline 404 HTML with capsule SVGs |
| `vitest.setup.ts` | modify | jsdom `<dialog>` polyfill |
| `app/(home)/[lang]/welcome-page.tsx`, `home-page-background.tsx` | delete | Replaced by the hero |
| Tests | create or modify | `tests/lib/site/*.test.ts`, `tests/components/hero.test.tsx`, `tests/components/bracket-stage.test.tsx`, `tests/components/header-navigation.test.tsx`, `tests/components/seoul-clock.test.tsx`, `tests/components/common-components.test.tsx`, `tests/e2e/public-flows.spec.ts` |

---

### Task 0: Baseline

**Files:** none changed. The outputs go to the scratchpad.

- [ ] **Step 1: Record the static baseline**

Run: `pnpm lint && pnpm test:types && pnpm test`
Expected: all pass (the repo documents 45 files / 227 tests). Record any failure verbatim as pre-existing.

- [ ] **Step 2: Production build without migrations**

Run: `pnpm exec next build`
Expected: the build completes. It only reads from the `.env` database; no migration runs.

- [ ] **Step 3: Measure the baseline**

Run in the background: `pnpm exec next start -p 3100`
Then run: `PERF_OUTPUT=$SCRATCH/perf-baseline.json pnpm perf:measure`, where `$SCRATCH` is the session scratchpad.
Expected: 22 JSON lines are printed, and `perf-baseline.json` is written. Stop the server afterwards.

---

### Task 1: Design tokens, fonts and the public layout shell

**Files:**
- Create: `app/styles/site-theme.css`, `app/fonts.ts`, `lib/contents/site-copy.ts`
- Modify: `app/globals.css` (imports at the top), `app/(home)/[lang]/layout.tsx`

**Interfaces:**
- Produces:
  - **Utilities:** `bg-stage` `bg-stage-raised` `text-on-stage` `text-on-stage-muted` `bg-paper` `bg-sheet` `bg-sheet-sunken` `text-fg` `text-fg-muted` `text-fg-subtle` `border-rule`, plus `bg-g-{blue|sky|red|pink|yellow|green}`, `bg-g-{hue}-soft`, `text-g-{hue}-ink`, and `font-display` / `font-code`.
  - **CSS variables:** `--ease-out`, `--ease-in-out`, `--ease-spring`, `--dur-fast|base|slow`.
  - **Fonts:** `googleSansFlex` and `googleSansCode` from `@/app/fonts`, exposing `--font-flex` and `--font-code-mono`.
  - **Copy:** `chromeCopy` and `heroCopy` from `@/lib/contents/site-copy`.

- [ ] **Step 1: Create `app/styles/site-theme.css`**

```css
/* ═══════════════════════════════════════════════════════════════
   Public site design system — "Inside the Brackets"
   Spec: docs/superpowers/specs/2026-09-23-inside-the-brackets-redesign-design.md

   Scheme values live on `html.site`, which only the public [lang] layout and
   the root not-found page render. The admin shell keeps its own :root tokens
   (--canvas, --surface, --ink …) and never sees these. `@theme inline`
   exposes them as utilities (bg-paper, text-fg …) that resolve against the
   active scheme.
   ═══════════════════════════════════════════════════════════════ */

@layer base {
  html.site {
    color-scheme: light;

    /* Stage: the GDG-black surface behind the hero, header and footer. */
    --s-stage: #1e1e1e;
    --s-stage-raised: #2b2b2b;
    --s-on-stage: #f0f0f0;
    --s-on-stage-muted: #b4b4b4;

    /* Paper: the readable document surfaces the brackets open onto. */
    --s-paper: #f0f0f0;
    --s-sheet: #ffffff;
    --s-sheet-sunken: #e7e7e5;
    --s-fg: #1e1e1e;
    --s-fg-muted: #555555;
    --s-fg-subtle: #6b6b6b;
    --s-rule: #d4d4d2;

    /* GDG hues. soft = tinted surface, ink = text that passes AA on paper. */
    --s-blue-soft: #d3e3fd;
    --s-blue-ink: #1967d2;
    --s-sky-soft: #c3ecf6;
    --s-sky-ink: #0b6b99;
    --s-red-soft: #fad2cf;
    --s-red-ink: #c5221f;
    --s-pink-soft: #f8d8d8;
    --s-pink-ink: #b8336a;
    --s-yellow-soft: #ffe7a5;
    --s-yellow-ink: #a15c00;
    --s-green-soft: #ccf6c5;
    --s-green-ink: #137333;

    --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
    --ease-spring: linear(
      0,
      0.006,
      0.025 2.8%,
      0.101 6.1%,
      0.539 18.9%,
      0.721 25.3%,
      0.849 31.5%,
      0.937 38.1%,
      0.968 41.8%,
      0.991 45.7%,
      1.006 50.1%,
      1.015 55%,
      1.017 63.9%,
      1.001
    );
    --dur-fast: 150ms;
    --dur-base: 250ms;
    --dur-slow: 400ms;

    background-color: var(--s-paper);
    color: var(--s-fg);
    font-family:
      var(--font-flex), 'Pretendard Variable', ui-sans-serif, system-ui,
      'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Enabled in Plan 3 once every public page is restyled; until then the old
     sections hard-code light surfaces and would break in a dark scheme. */
  @media (prefers-color-scheme: dark) {
    html.site[data-color-scheme='auto'] {
      color-scheme: dark;
      --s-stage: #0f0f0f;
      --s-stage-raised: #1d1d1d;
      --s-paper: #161616;
      --s-sheet: #1f1f1f;
      --s-sheet-sunken: #121212;
      --s-fg: #f0f0f0;
      --s-fg-muted: #b8b8b8;
      --s-fg-subtle: #8f8f8f;
      --s-rule: #333333;
      --s-blue-soft: color-mix(in oklab, #4285f4 24%, #1f1f1f);
      --s-blue-ink: #8ab4f8;
      --s-sky-soft: color-mix(in oklab, #57caff 20%, #1f1f1f);
      --s-sky-ink: #57caff;
      --s-red-soft: color-mix(in oklab, #ea4335 24%, #1f1f1f);
      --s-red-ink: #f28b82;
      --s-pink-soft: color-mix(in oklab, #ff7daf 20%, #1f1f1f);
      --s-pink-ink: #ff7daf;
      --s-yellow-soft: color-mix(in oklab, #f9ab00 22%, #1f1f1f);
      --s-yellow-ink: #ffd427;
      --s-green-soft: color-mix(in oklab, #34a853 24%, #1f1f1f);
      --s-green-ink: #5cdb6d;
    }
  }

  /* A Hangul-first stack keeps mixed Korean/Latin lines on one rhythm;
     brand words opt back into Google Sans Flex with `font-display`. */
  html.site:lang(ko) {
    font-family:
      'Pretendard Variable', var(--font-flex), ui-sans-serif, system-ui,
      'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  }

  html.site :where(h1, h2, h3, h4) {
    text-wrap: balance;
  }

  html.site :where(p, li, dd, figcaption) {
    text-wrap: pretty;
  }

  html.site ::selection {
    background-color: #ffd427;
    color: #1e1e1e;
  }

  html.site :focus-visible {
    outline: 2px solid #4285f4;
    outline-offset: 3px;
  }
}

@theme inline {
  --color-stage: var(--s-stage);
  --color-stage-raised: var(--s-stage-raised);
  --color-on-stage: var(--s-on-stage);
  --color-on-stage-muted: var(--s-on-stage-muted);
  --color-paper: var(--s-paper);
  --color-sheet: var(--s-sheet);
  --color-sheet-sunken: var(--s-sheet-sunken);
  --color-fg: var(--s-fg);
  --color-fg-muted: var(--s-fg-muted);
  --color-fg-subtle: var(--s-fg-subtle);
  --color-rule: var(--s-rule);

  --color-g-blue-soft: var(--s-blue-soft);
  --color-g-blue-ink: var(--s-blue-ink);
  --color-g-sky-soft: var(--s-sky-soft);
  --color-g-sky-ink: var(--s-sky-ink);
  --color-g-red-soft: var(--s-red-soft);
  --color-g-red-ink: var(--s-red-ink);
  --color-g-pink-soft: var(--s-pink-soft);
  --color-g-pink-ink: var(--s-pink-ink);
  --color-g-yellow-soft: var(--s-yellow-soft);
  --color-g-yellow-ink: var(--s-yellow-ink);
  --color-g-green-soft: var(--s-green-soft);
  --color-g-green-ink: var(--s-green-ink);

  --font-display:
    var(--font-flex), 'Pretendard Variable', ui-sans-serif, system-ui,
    sans-serif;
  --font-code:
    var(--font-code-mono), ui-monospace, SFMono-Regular, Menlo, Consolas,
    monospace;
}

@theme {
  /* GDG brand fills — identical in every scheme. */
  --color-g-blue: #4285f4;
  --color-g-sky: #57caff;
  --color-g-red: #ea4335;
  --color-g-pink: #ff7daf;
  --color-g-yellow: #f9ab00;
  --color-g-green: #34a853;
}

@utility skip-link {
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 100;
  border-radius: 9999px;
  background-color: var(--s-on-stage);
  color: var(--s-stage);
  padding: 0.625rem 1.125rem;
  font-weight: 600;
  transform: translateY(-200%);
  transition: transform var(--dur-base) var(--ease-out);

  &:focus {
    transform: none;
  }
}
```

- [ ] **Step 2: Import it from `app/globals.css`**

Add a line directly under `@import './pretendard.css';`:

```css
@import './styles/site-theme.css';
```

- [ ] **Step 3: Create `app/fonts.ts`**

```ts
import { Google_Sans_Code, Google_Sans_Flex } from 'next/font/google'

/**
 * Latin text and display face. The ROND (roundness) axis lets display type
 * echo the capsule strokes of the GDG mark; with weight it is ~71 KB (latin),
 * versus ~52 KB for the old static Google Sans file.
 */
export const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin'],
  axes: ['ROND'],
  display: 'swap',
  variable: '--font-flex',
})

/** Dates, tags and counters. Not preloaded: it only sets small meta text. */
export const googleSansCode = Google_Sans_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-code-mono',
  preload: false,
})
```

- [ ] **Step 4: Create `lib/contents/site-copy.ts`**

```ts
import type { Locale } from '@/i18n-config'

type ChromeCopy = {
  skipToContent: string
  home: string
  primaryNav: string
  mobileNav: string
  menu: string
  openMenu: string
  closeMenu: string
  loadingMenu: string
  language: string
  sessions: string
  projects: string
  calendar: string
  members: string
  footerBlurb: string
  footerExplore: string
  footerConnect: string
  footerSite: string
  chapterPage: string
  privacy: string
  terms: string
  freshmanOt: string
  source: string
  gyms: string
  clockLabel: string
}

export const chromeCopy: Record<Locale, ChromeCopy> = {
  en: {
    skipToContent: 'Skip to content',
    home: 'GDGoC Yonsei home',
    primaryNav: 'Primary navigation',
    mobileNav: 'Mobile primary navigation',
    menu: 'Menu',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    loadingMenu: 'Loading navigation',
    language: 'Language',
    sessions: 'Sessions',
    projects: 'Projects',
    calendar: 'Calendar',
    members: 'Members',
    footerBlurb:
      "GDG on Campus Yonsei — Yonsei University's student developer community in Sinchon, Seoul.",
    footerExplore: 'Explore',
    footerConnect: 'Connect',
    footerSite: 'Site',
    chapterPage: 'Official GDG chapter',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    freshmanOt: '2026 Freshman Orientation',
    source: 'Source code',
    gyms: 'GYMS for members',
    clockLabel: 'Sinchon, Seoul',
  },
  ko: {
    skipToContent: '본문 바로가기',
    home: 'GDGoC Yonsei 홈',
    primaryNav: '주 메뉴',
    mobileNav: '모바일 주 메뉴',
    menu: '메뉴',
    openMenu: '탐색 메뉴 열기',
    closeMenu: '탐색 메뉴 닫기',
    loadingMenu: '탐색 메뉴 로딩 중',
    language: '언어',
    sessions: '세션',
    projects: '프로젝트',
    calendar: '캘린더',
    members: '구성원',
    footerBlurb:
      '연세대학교 신촌캠퍼스의 학생 개발자 커뮤니티, GDG on Campus Yonsei입니다.',
    footerExplore: '둘러보기',
    footerConnect: '연결',
    footerSite: '사이트',
    chapterPage: '공식 GDG 챕터 페이지',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    freshmanOt: '2026 신입생 OT',
    source: '소스 코드',
    gyms: '멤버 전용 GYMS',
    clockLabel: '서울 신촌',
  },
}

type HeroCopy = {
  eyebrow: string
  tagline: string
  primaryCta: string
  secondaryCta: string
  metaLabel: string
  meta: [string, string, string]
  scrollCue: string
}

export const heroCopy: Record<Locale, HeroCopy> = {
  en: {
    eyebrow: 'Google Developer Groups on Campus · Yonsei University',
    tagline:
      "Yonsei University's student developer community. We connect, learn, and grow — then ship what we build.",
    primaryCta: 'Explore sessions',
    secondaryCta: 'See projects',
    metaLabel: 'At a glance',
    meta: ['T19 · Tue 19:00 KST', '6 parts', 'Sinchon, Seoul'],
    scrollCue: 'Scroll to open',
  },
  ko: {
    eyebrow: 'Google Developer Groups on Campus · 연세대학교',
    tagline:
      '연세대학교 학생 개발자 커뮤니티. 함께 연결하고, 배우고, 성장하며 — 만든 것을 세상에 내놓습니다.',
    primaryCta: '세션 둘러보기',
    secondaryCta: '프로젝트 보기',
    metaLabel: '한눈에 보기',
    meta: ['T19 · 매주 화 19:00', '6개 파트', '서울 신촌'],
    scrollCue: '스크롤해서 열기',
  },
}
```

- [ ] **Step 5: Rewrite the root element in `app/(home)/[lang]/layout.tsx`**

Replace the `localFont` import, the `googleSans` constant and the default export with the code below. Keep `generateStaticParams` and `generateMetadata` exactly as they are.

```tsx
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '../../globals.css'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import languageParamChecker from '@/lib/language-param-checker'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { chromeCopy } from '@/lib/contents/site-copy'
import { cn } from '@/lib/cn'

// …LangLayoutProps, generateStaticParams, generateMetadata unchanged…

export const viewport: Viewport = {
  // The header capsule and hero stage are GDG black in every scheme.
  themeColor: '#1e1e1e',
}

export default async function RootLayout({
  children,
  params,
}: LangLayoutProps) {
  const lang = languageParamChecker((await params).lang)

  return (
    <html
      lang={lang}
      className={cn('site', googleSansFlex.variable, googleSansCode.variable)}
      suppressHydrationWarning
    >
      <body>
        <a href="#main" className="skip-link">
          {chromeCopy[lang].skipToContent}
        </a>
        <Header lang={lang} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer lang={lang} />
        <GoogleAnalytics gaId={'G-D77HTXJVT8'} />
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Verify the shell renders**

Run: `pnpm test:types && pnpm lint`
Expected: PASS. (Header and footer are unchanged so far and still compile.)

Run: `pnpm dev`, then `curl -s http://localhost:3000/en | grep -o '<html[^>]*>'`
Expected: the tag includes `class="site ` and both font variable classes, and the page shows a `Skip to content` link when you tab into it.

- [ ] **Step 7: Checkpoint**

Stage: `app/styles/site-theme.css app/globals.css app/fonts.ts lib/contents/site-copy.ts "app/(home)/[lang]/layout.tsx"`. Commit only on request: `feat(site): add Inside-the-Brackets tokens, fonts and layout shell`.

---

### Task 2: Bracket geometry

**Files:**
- Create: `lib/site/bracket-geometry.ts`
- Test: `tests/lib/site/bracket-geometry.test.ts`

**Interfaces:**
- Produces (all pure, client-safe):
  - `BRACKET: { armDx: 113.6; armDy: 80.2; radius: 52.78 }`
  - `BRACKET_VIEWBOX: { width: 219.16; height: 265.96 }`
  - `type CapsuleHue = 'red' | 'blue' | 'green' | 'yellow'`
  - `type Capsule = { hue: CapsuleHue; ax: number; ay: number; bx: number; by: number; r: number }`
  - `type BracketSide = 'left' | 'right'`
  - `type Rect = { left: number; top: number; width: number; height: number }`
  - `bracketCapsulesInViewBox(side: BracketSide): Capsule[]`
  - `capsulePath(capsule: Capsule): string`
  - `capsulesFromBracketRects(left: Rect, right: Rect, offset?: number): Capsule[]` (order: red, blue, yellow, green)
  - `scrollProgress(scrollY: number, heroHeight: number): number`
  - `partingOffset(progress: number, viewportWidth: number): number`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import {
  BRACKET,
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
  capsulesFromBracketRects,
  partingOffset,
  scrollProgress,
} from '@/lib/site/bracket-geometry'

describe('bracket geometry', () => {
  it('sizes a single bracket view box from the logo capsule measurements', () => {
    expect(BRACKET_VIEWBOX.width).toBeCloseTo(BRACKET.armDx + BRACKET.radius * 2)
    expect(BRACKET_VIEWBOX.height).toBeCloseTo(
      BRACKET.armDy * 2 + BRACKET.radius * 2
    )
  })

  it('draws `<` as red over blue meeting at a left apex', () => {
    const [red, blue] = bracketCapsulesInViewBox('left')
    expect(red).toMatchObject({ hue: 'red', ax: 52.78, bx: 166.38 })
    expect(red!.ay).toBeCloseTo(132.98)
    expect(red!.by).toBeCloseTo(52.78)
    expect(blue).toMatchObject({ hue: 'blue', ax: 52.78, bx: 166.38 })
    expect(blue!.by).toBeCloseTo(213.18)
  })

  it('draws `>` as yellow then green meeting at a right apex', () => {
    const [yellow, green] = bracketCapsulesInViewBox('right')
    expect(yellow).toMatchObject({ hue: 'yellow', ax: 52.78, bx: 166.38 })
    expect(yellow!.ay).toBeCloseTo(213.18)
    expect(green).toMatchObject({ hue: 'green' })
    expect(green!.ay).toBeCloseTo(52.78)
    expect(green!.by).toBeCloseTo(132.98)
  })

  it('writes a stadium path whose caps bulge away from the body', () => {
    expect(
      capsulePath({ hue: 'red', ax: 0, ay: 0, bx: 10, by: 0, r: 2 })
    ).toBe('M0 2L10 2A2 2 0 0 0 10 -2L0 -2A2 2 0 0 0 0 2Z')
  })

  it('maps rendered bracket boxes into canvas space and parts them', () => {
    const left = { left: 0, top: 0, width: 219.16, height: 265.96 }
    const right = { left: 400, top: 0, width: 219.16, height: 265.96 }
    const capsules = capsulesFromBracketRects(left, right)
    expect(capsules.map((capsule) => capsule.hue)).toEqual([
      'red',
      'blue',
      'yellow',
      'green',
    ])
    expect(capsules[0]!.ax).toBeCloseTo(52.78)
    expect(capsules[3]!.bx).toBeCloseTo(566.38)

    const doubled = capsulesFromBracketRects(
      { ...left, height: 531.92 },
      { ...right, height: 531.92 }
    )
    expect(doubled[0]!.r).toBeCloseTo(105.56)

    const parted = capsulesFromBracketRects(left, right, 10)
    expect(parted[0]!.ax).toBeCloseTo(42.78)
    expect(parted[3]!.bx).toBeCloseTo(576.38)
  })

  it('clamps scroll progress and eases the parting distance', () => {
    expect(scrollProgress(-20, 800)).toBe(0)
    expect(scrollProgress(400, 800)).toBe(0.5)
    expect(scrollProgress(1200, 800)).toBe(1)
    expect(scrollProgress(100, 0)).toBe(0)
    expect(partingOffset(0, 1000)).toBe(0)
    expect(partingOffset(0.5, 1000)).toBeCloseTo(275)
    expect(partingOffset(1, 1000)).toBeCloseTo(550)
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `pnpm vitest run tests/lib/site/bracket-geometry.test.ts`
Expected: FAIL, because `lib/site/bracket-geometry` can't be resolved.

- [ ] **Step 3: Implement `lib/site/bracket-geometry.ts`**

```ts
/**
 * Geometry of the GDG `< >` mark, measured from the four capsule paths in
 * app/components/svg/gdg-logo.tsx (viewBox 512×321). Each capsule there is a
 * stadium of radius ≈52.78 whose centre line runs from a bracket apex to an
 * arm tip 113.6 units across and ±80.2 units up or down. The hero poster
 * (SVG) and the WebGL field both derive their shapes from these numbers, so
 * the two renderings line up exactly.
 */
export const BRACKET = {
  armDx: 113.6,
  armDy: 80.2,
  radius: 52.78,
} as const

/** One bracket on its own: the capsule caps touch the view box edges. */
export const BRACKET_VIEWBOX = {
  width: BRACKET.armDx + BRACKET.radius * 2,
  height: BRACKET.armDy * 2 + BRACKET.radius * 2,
} as const

export type CapsuleHue = 'red' | 'blue' | 'green' | 'yellow'

export type Capsule = {
  hue: CapsuleHue
  ax: number
  ay: number
  bx: number
  by: number
  r: number
}

export type BracketSide = 'left' | 'right'

export type Rect = { left: number; top: number; width: number; height: number }

/**
 * Capsules of one bracket in its own view box. Later capsules paint over
 * earlier ones, matching the logo: blue over red, green over yellow.
 */
export function bracketCapsulesInViewBox(side: BracketSide): Capsule[] {
  const { armDx, armDy, radius: r } = BRACKET
  const middle = r + armDy
  const near = r
  const far = r + armDx

  if (side === 'left') {
    return [
      { hue: 'red', ax: near, ay: middle, bx: far, by: middle - armDy, r },
      { hue: 'blue', ax: near, ay: middle, bx: far, by: middle + armDy, r },
    ]
  }

  return [
    { hue: 'yellow', ax: near, ay: middle + armDy, bx: far, by: middle, r },
    { hue: 'green', ax: near, ay: middle - armDy, bx: far, by: middle, r },
  ]
}

function round(value: number) {
  // `+0` folds -0 into 0 so paths never contain "-0".
  return Number(value.toFixed(2)) + 0
}

/** SVG path of a stadium between two centres (arcs bulge away from the body). */
export function capsulePath({ ax, ay, bx, by, r }: Capsule): string {
  const length = Math.hypot(bx - ax, by - ay) || 1
  const nx = (-(by - ay) / length) * r
  const ny = ((bx - ax) / length) * r
  const [x1, y1, x2, y2] = [ax + nx, ay + ny, bx + nx, by + ny].map(round)
  const [x3, y3, x4, y4] = [bx - nx, by - ny, ax - nx, ay - ny].map(round)
  const radius = round(r)

  return `M${x1} ${y1}L${x2} ${y2}A${radius} ${radius} 0 0 0 ${x3} ${y3}L${x4} ${y4}A${radius} ${radius} 0 0 0 ${x1} ${y1}Z`
}

/**
 * Maps the two rendered bracket boxes (for example, poster slots measured
 * relative to the canvas) to capsules in that space. `offset` pushes the
 * brackets apart horizontally for the scroll parting.
 */
export function capsulesFromBracketRects(
  left: Rect,
  right: Rect,
  offset = 0
): Capsule[] {
  const place = (rect: Rect, side: BracketSide, shift: number) => {
    const scale = rect.height / BRACKET_VIEWBOX.height

    return bracketCapsulesInViewBox(side).map((capsule) => ({
      hue: capsule.hue,
      ax: rect.left + capsule.ax * scale + shift,
      ay: rect.top + capsule.ay * scale,
      bx: rect.left + capsule.bx * scale + shift,
      by: rect.top + capsule.by * scale,
      r: capsule.r * scale,
    }))
  }

  return [...place(left, 'left', -offset), ...place(right, 'right', offset)]
}

export function scrollProgress(scrollY: number, heroHeight: number): number {
  if (heroHeight <= 0) return 0
  return Math.min(1, Math.max(0, scrollY / heroHeight))
}

/** Smoothstep-eased distance each bracket travels while the hero scrolls. */
export function partingOffset(progress: number, viewportWidth: number): number {
  const t = Math.min(1, Math.max(0, progress))
  return t * t * (3 - 2 * t) * viewportWidth * 0.55
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `pnpm vitest run tests/lib/site/bracket-geometry.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Checkpoint**

Stage: `lib/site/bracket-geometry.ts tests/lib/site/bracket-geometry.test.ts`. Commit only on request: `feat(site): derive bracket capsule geometry from the GDG mark`.

---

### Task 3: Hero section with the SVG poster

**Files:**
- Create: `app/components/site/bracket-poster.tsx`, `app/components/site/button-link.tsx`, `app/styles/site-hero.css`, `app/(home)/[lang]/_components/home/hero.tsx`
- Create (placeholder, completed in Task 4): `app/(home)/[lang]/_components/home/bracket-stage.tsx`
- Modify: `app/globals.css` (import `site-hero.css`), `app/(home)/[lang]/page.tsx`
- Test: `tests/components/hero.test.tsx`

**Interfaces:**
- Consumes: `bracketCapsulesInViewBox`, `capsulePath`, `BRACKET_VIEWBOX`, `BracketSide` (Task 2); `heroCopy` (Task 1).
- Produces:
  - `<BracketPoster side id className? />`
  - `<ButtonLink tone?: 'solid' | 'outline' | 'stageSolid' | 'stageOutline' {...LinkProps} />`
  - `<Hero lang />`
  - DOM contract for Task 4: the hero `section[data-hero]` contains `span[data-bracket="left|right"].bracket-slot > span.bracket-part > svg`, one `h1`, and `canvas.bracket-canvas`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from '@/app/(home)/[lang]/_components/home/hero'

describe('Hero', () => {
  it('names the page after the chapter and links to sessions and projects', () => {
    render(<Hero lang="en" />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'GDGoC Yonsei' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Explore sessions/ })
    ).toHaveAttribute('href', '/en/session')
    expect(screen.getByRole('link', { name: 'See projects' })).toHaveAttribute(
      'href',
      '/en/project'
    )
  })

  it('uses Korean copy and routes on /ko', () => {
    render(<Hero lang="ko" />)

    expect(screen.getByRole('link', { name: /세션 둘러보기/ })).toHaveAttribute(
      'href',
      '/ko/session'
    )
    expect(screen.getByText('T19 · 매주 화 19:00')).toBeInTheDocument()
  })

  it('keeps the bracket artwork out of the accessibility tree', () => {
    const { container } = render(<Hero lang="en" />)
    const posters = container.querySelectorAll('[data-bracket] svg')

    expect(posters).toHaveLength(2)
    posters.forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'))
    expect(container.querySelector('canvas')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `pnpm vitest run tests/components/hero.test.tsx`
Expected: FAIL, because the hero module can't be resolved.

- [ ] **Step 3: Create `app/components/site/bracket-poster.tsx`**

```tsx
import {
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
  type BracketSide,
  type CapsuleHue,
} from '@/lib/site/bracket-geometry'

const HUE_FILL: Record<CapsuleHue, string> = {
  red: '#EA4335',
  blue: '#4285F4',
  yellow: '#F9AB00',
  green: '#34A853',
}

/** Dot pitch in view box units, close to the WebGL cell at hero scale. */
const DOT_PITCH = 9

/**
 * One GDG bracket drawn as a halftone print: a faint tint plus a dot pattern
 * clipped to each capsule. Server-rendered so the hero paints without JS.
 */
export default function BracketPoster({
  side,
  id,
  className,
}: {
  side: BracketSide
  id: string
  className?: string
}) {
  const capsules = bracketCapsulesInViewBox(side)

  return (
    <svg
      viewBox={`0 0 ${BRACKET_VIEWBOX.width} ${BRACKET_VIEWBOX.height}`}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {capsules.map(({ hue }) => (
          <pattern
            key={hue}
            id={`${id}-${hue}`}
            width={DOT_PITCH}
            height={DOT_PITCH}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={DOT_PITCH / 2}
              cy={DOT_PITCH / 2}
              r={DOT_PITCH * 0.36}
              fill={HUE_FILL[hue]}
            />
          </pattern>
        ))}
      </defs>
      {capsules.map((capsule) => {
        const path = capsulePath(capsule)

        return (
          <g key={capsule.hue}>
            <path d={path} fill={HUE_FILL[capsule.hue]} fillOpacity={0.16} />
            <path d={path} fill={`url(#${id}-${capsule.hue})`} />
          </g>
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 4: Create `app/components/site/button-link.tsx`**

```tsx
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const tones = {
  solid: 'bg-fg text-paper hover:bg-fg/85',
  outline: 'border border-rule bg-sheet text-fg hover:border-fg-subtle',
  stageSolid: 'bg-on-stage text-stage hover:bg-white',
  stageOutline:
    'border border-white/20 text-on-stage hover:border-white/40 hover:bg-white/5',
} as const

export type ButtonTone = keyof typeof tones

/** Capsule-shaped call to action; the capsule echoes the GDG mark strokes. */
export default function ButtonLink({
  tone = 'solid',
  className,
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone }) {
  return (
    <Link
      {...props}
      className={cn(
        'pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold',
        tones[tone],
        className
      )}
    />
  )
}
```

- [ ] **Step 5: Create `app/styles/site-hero.css` and import it**

Add `@import './styles/site-hero.css';` under the `site-theme.css` import in `app/globals.css`, then create:

```css
/* Hero — "< GDGoC Yonsei >" */
@layer components {
  .hero {
    position: relative;
    isolation: isolate;
    display: flex;
    min-height: 100svh;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--s-stage);
    color: var(--s-on-stage);
  }

  .bracket-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    transition: opacity 900ms var(--ease-out);
  }

  .hero[data-gl='on'] .bracket-canvas {
    opacity: 1;
  }

  .hero-inner {
    position: relative;
    z-index: 1;
    margin-inline: auto;
    display: flex;
    width: 100%;
    max-width: 80rem;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 7rem 1rem 3rem;
    text-align: center;
  }

  .hero-eyebrow {
    font-family: var(--font-code);
    font-size: 0.75rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--s-on-stage-muted);
  }

  .hero-mark {
    margin-top: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.12em;
    font-size: clamp(3rem, 8.6vw, 9rem);
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: 1em;
    font-weight: 700;
    line-height: 0.92;
    letter-spacing: -0.045em;
    font-variation-settings: 'ROND' 100;
    transition:
      font-variation-settings 700ms var(--ease-spring),
      letter-spacing 700ms var(--ease-spring);
  }

  .bracket-slot {
    display: block;
    flex: none;
    height: 1.12em;
    aspect-ratio: 219.16 / 265.96;
  }

  .bracket-part,
  .bracket-part > svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .bracket-part {
    transition: opacity 700ms var(--ease-out);
  }

  .hero[data-gl='on'] .bracket-part {
    opacity: 0;
  }

  .hero-tagline {
    margin-top: 2rem;
    max-width: 36rem;
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--s-on-stage-muted);
  }

  .hero-actions {
    margin-top: 2.5rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }

  .hero-foot {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 0 1rem 1.75rem;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 1.25rem;
    font-family: var(--font-code);
    font-size: 0.75rem;
    color: var(--s-on-stage-muted);
  }

  .hero-meta li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .hero-meta li::before {
    content: '';
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 9999px;
    background-color: #4285f4;
  }

  .hero-meta li:nth-child(2)::before {
    background-color: #34a853;
  }

  .hero-meta li:nth-child(3)::before {
    background-color: #ea4335;
  }

  .hero-cue {
    font-family: var(--font-code);
    font-size: 0.6875rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgb(240 240 240 / 0.45);
  }

  @media (max-width: 639px) {
    .hero-mark {
      gap: 0.08em;
      font-size: 14vw;
    }

    .hero-title-line {
      display: block;
    }

    .bracket-slot {
      height: 1.62em;
    }
  }
}

@media (hover: hover) {
  .hero-title:hover {
    font-variation-settings: 'ROND' 0;
    letter-spacing: -0.035em;
  }
}

@media (prefers-reduced-motion: no-preference) {
  /* `backwards` so the rest state (and :hover) owns the element afterwards. */
  .hero-title {
    animation: hero-title-in 1400ms var(--ease-spring) backwards;
  }

  .bracket-slot[data-bracket='left'] svg {
    animation: bracket-in-left 1100ms var(--ease-spring) backwards;
  }

  .bracket-slot[data-bracket='right'] svg {
    animation: bracket-in-right 1100ms var(--ease-spring) backwards;
  }

  .hero-rise {
    animation: hero-rise 900ms var(--ease-out) backwards;
    animation-delay: var(--rise-delay, 0ms);
  }

  @supports (animation-timeline: scroll()) {
    .hero:not([data-gl='on']) [data-bracket='left'] .bracket-part {
      animation: bracket-part-left linear both;
      animation-timeline: scroll(root);
      animation-range: 0 100vh;
    }

    .hero:not([data-gl='on']) [data-bracket='right'] .bracket-part {
      animation: bracket-part-right linear both;
      animation-timeline: scroll(root);
      animation-range: 0 100vh;
    }
  }
}

@keyframes hero-title-in {
  from {
    font-variation-settings: 'ROND' 0;
    letter-spacing: 0.02em;
    transform: translateY(0.06em);
  }
}

@keyframes bracket-in-left {
  from {
    opacity: 0;
    transform: translateX(35%) scale(0.86);
  }
}

@keyframes bracket-in-right {
  from {
    opacity: 0;
    transform: translateX(-35%) scale(0.86);
  }
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

@keyframes bracket-part-left {
  to {
    opacity: 0.35;
    transform: translateX(-42vw);
  }
}

@keyframes bracket-part-right {
  to {
    opacity: 0.35;
    transform: translateX(42vw);
  }
}
```

- [ ] **Step 6: Create the placeholder stage and the hero**

`app/(home)/[lang]/_components/home/bracket-stage.tsx`: this placeholder is replaced in Task 4.

```tsx
'use client'

export default function BracketStage() {
  return <canvas aria-hidden="true" className="bracket-canvas" />
}
```

`app/(home)/[lang]/_components/home/hero.tsx`:

```tsx
import type { CSSProperties } from 'react'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import BracketPoster from '@/app/components/site/bracket-poster'
import ButtonLink from '@/app/components/site/button-link'
import { heroCopy } from '@/lib/contents/site-copy'
import BracketStage from './bracket-stage'

const rise = (delayMs: number) =>
  ({ '--rise-delay': `${delayMs}ms` }) as CSSProperties

/**
 * "< GDGoC Yonsei >": the chapter name sits between the two GDG brackets.
 * The SVG posters paint immediately; BracketStage later swaps them for the
 * live halftone field once the browser is idle.
 */
export default function Hero({ lang }: { lang: Locale }) {
  const copy = heroCopy[lang]

  return (
    <section data-hero aria-labelledby="hero-title" className="hero">
      <BracketStage />
      <div className="hero-inner">
        <p className="hero-rise hero-eyebrow" style={rise(60)}>
          {copy.eyebrow}
        </p>
        <div className="hero-mark">
          <span data-bracket="left" className="bracket-slot">
            <span className="bracket-part">
              <BracketPoster side="left" id="hero-left" />
            </span>
          </span>
          <h1 id="hero-title" className="hero-title">
            GDGoC <span className="hero-title-line">Yonsei</span>
          </h1>
          <span data-bracket="right" className="bracket-slot">
            <span className="bracket-part">
              <BracketPoster side="right" id="hero-right" />
            </span>
          </span>
        </div>
        <p className="hero-rise hero-tagline" style={rise(220)}>
          {copy.tagline}
        </p>
        <div className="hero-rise hero-actions" style={rise(320)}>
          <ButtonLink href={`/${lang}/session`} tone="stageSolid">
            {copy.primaryCta}
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </ButtonLink>
          <ButtonLink href={`/${lang}/project`} tone="stageOutline">
            {copy.secondaryCta}
          </ButtonLink>
        </div>
      </div>
      <div className="hero-foot">
        <ul className="hero-meta" aria-label={copy.metaLabel}>
          {copy.meta.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p aria-hidden="true" className="hero-cue">
          {copy.scrollCue}
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Put the hero on the home page**

In `app/(home)/[lang]/page.tsx`, replace `import WelcomePage from '@/app/(home)/[lang]/welcome-page'` with `import Hero from '@/app/(home)/[lang]/_components/home/hero'`. Replace `<WelcomePage lang={lang} />` with `<Hero lang={lang} />`.

- [ ] **Step 8: Run the tests**

Run: `pnpm vitest run tests/components/hero.test.tsx && pnpm test:types && pnpm lint`
Expected: PASS (3 tests).

- [ ] **Step 9: Look at it**

With `pnpm dev` running, open `/en` and `/ko` at 1440×900 and 390×844.
Expected:
- The brackets sit tight around "GDGoC Yonsei", on one line on desktop and two lines on mobile.
- The halftone dots show inside four colored capsules.
- The CTAs and the meta strip are visible above the fold.
- Scrolling (in Chromium) parts the brackets.
- The old About section follows.

Tune only `.hero-mark` / `.bracket-slot` sizes if the composition overflows.

- [ ] **Step 10: Checkpoint**

Stage: the hero files, `bracket-poster.tsx`, `button-link.tsx`, `site-hero.css`, `globals.css`, `page.tsx` and the test. Commit only on request: `feat(home): add < GDGoC Yonsei > hero with halftone bracket poster`.

---

### Task 4: WebGL halftone field (idle-loaded)

**Files:**
- Create: `app/(home)/[lang]/_components/home/bracket-field-gl.ts`
- Replace: `app/(home)/[lang]/_components/home/bracket-stage.tsx`
- Test: `tests/lib/site/bracket-field-gl.test.ts`, `tests/components/bracket-stage.test.tsx`

**Interfaces:**
- Consumes: `capsulesFromBracketRects`, `partingOffset`, `scrollProgress`, `Capsule`, `CapsuleHue`, `Rect` (Task 2); the hero DOM contract (Task 3).
- Produces:
  - `packCapsules(capsules: readonly Capsule[], dpr: number): { positions: Float32Array; colors: Float32Array; radius: number }`
  - `type BracketField = { isReady(): boolean; resize(width: number, height: number, dpr: number): void; draw(frame: FieldFrame): void; dispose(): void }`
  - `createBracketField(canvas: HTMLCanvasElement): BracketField | null`
  - `mountBracketField(canvas: HTMLCanvasElement, hero: HTMLElement, create?: (canvas: HTMLCanvasElement) => BracketField | null): () => void`
  - When the field is live, `hero.dataset.gl === 'on'`.

- [ ] **Step 1: Write the failing tests**

`tests/lib/site/bracket-field-gl.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createBracketField,
  mountBracketField,
  packCapsules,
  type BracketField,
} from '@/app/(home)/[lang]/_components/home/bracket-field-gl'
import type { Capsule } from '@/lib/site/bracket-geometry'

const capsules: Capsule[] = [
  { hue: 'red', ax: 1, ay: 2, bx: 3, by: 4, r: 5 },
  { hue: 'green', ax: 6, ay: 7, bx: 8, by: 9, r: 5 },
]

class ResizeObserverStub {
  observe = vi.fn()
  disconnect = vi.fn()
}

function heroFixture() {
  document.body.innerHTML = `
    <section data-hero>
      <canvas></canvas>
      <span data-bracket="left"></span><h1>GDGoC Yonsei</h1><span data-bracket="right"></span>
    </section>`
  return {
    hero: document.querySelector<HTMLElement>('[data-hero]')!,
    canvas: document.querySelector<HTMLCanvasElement>('canvas')!,
  }
}

function fakeField(): BracketField {
  return {
    isReady: () => true,
    resize: vi.fn(),
    draw: vi.fn(),
    dispose: vi.fn(),
  }
}

describe('packCapsules', () => {
  it('scales centres and radius to device pixels in paint order', () => {
    const packed = packCapsules(capsules, 2)
    expect(Array.from(packed.positions.slice(0, 8))).toEqual([
      2, 4, 6, 8, 12, 14, 16, 18,
    ])
    expect(packed.radius).toBe(10)
    expect(packed.colors[0]).toBeCloseTo(0.918)
    expect(packed.colors[4]).toBeCloseTo(0.659)
  })
})

describe('createBracketField', () => {
  it('returns null when WebGL2 is unavailable', () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    expect(createBracketField(canvas)).toBeNull()
  })
})

describe('mountBracketField', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('leaves the poster alone when no field can be created', () => {
    const { hero, canvas } = heroFixture()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    const teardown = mountBracketField(canvas, hero, () => null)
    expect(hero.dataset.gl).toBeUndefined()
    teardown()
  })

  it('restores the poster when the GPU context is lost', () => {
    const { hero, canvas } = heroFixture()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const field = fakeField()
    mountBracketField(canvas, hero, () => field)
    hero.dataset.gl = 'on'

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))

    expect(hero.dataset.gl).toBeUndefined()
    expect(field.dispose).toHaveBeenCalledTimes(1)
  })
})
```

`tests/components/bracket-stage.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import BracketStage from '@/app/(home)/[lang]/_components/home/bracket-stage'

function renderInHero() {
  return render(
    <section data-hero>
      <BracketStage />
    </section>
  )
}

describe('BracketStage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('never schedules the WebGL field when motion is reduced', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
      }))
    )
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
    renderInHero()
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 1200)
  })

  it('defers the field until the browser is idle otherwise', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: false, media: query }))
    )
    const idle = vi.fn(() => 7)
    vi.stubGlobal('requestIdleCallback', idle)
    vi.stubGlobal('cancelIdleCallback', vi.fn())
    const { unmount } = renderInHero()
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 2500 })
    unmount()
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm vitest run tests/lib/site/bracket-field-gl.test.ts tests/components/bracket-stage.test.tsx`
Expected: FAIL. The GL module is missing, and the placeholder stage never schedules anything.

- [ ] **Step 3: Implement `bracket-field-gl.ts`**

```ts
import {
  capsulesFromBracketRects,
  partingOffset,
  scrollProgress,
  type Capsule,
  type CapsuleHue,
  type Rect,
} from '@/lib/site/bracket-geometry'

const CAPSULE_RGB: Record<CapsuleHue, readonly [number, number, number]> = {
  red: [0.918, 0.263, 0.208],
  blue: [0.259, 0.522, 0.957],
  yellow: [0.976, 0.671, 0],
  green: [0.204, 0.659, 0.325],
}

export function packCapsules(capsules: readonly Capsule[], dpr: number) {
  const positions = new Float32Array(16)
  const colors = new Float32Array(12)

  capsules.slice(0, 4).forEach((capsule, index) => {
    positions.set(
      [capsule.ax, capsule.ay, capsule.bx, capsule.by].map((v) => v * dpr),
      index * 4
    )
    colors.set(CAPSULE_RGB[capsule.hue], index * 3)
  })

  return { positions, colors, radius: (capsules[0]?.r ?? 0) * dpr }
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`

/* Halftone: every cell draws one dot whose radius comes from the capsule
   signed-distance fields, slow value noise, the pointer lens and the intro
   sweep. Output is premultiplied so the CSS stage colour shows through. */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_cell;
uniform vec3 u_pointer;
uniform float u_lens;
uniform vec4 u_caps[4];
uniform float u_radius;
uniform vec3 u_colors[4];
uniform float u_reveal;
out vec4 outColor;

float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec2 center = (floor(frag / u_cell) + 0.5) * u_cell;

  float nearest = 1e9;
  int hue = -1;
  for (int i = 0; i < 4; i++) {
    float d = sdCapsule(center, u_caps[i].xy, u_caps[i].zw, u_radius);
    if (d < 0.0) hue = i;
    nearest = min(nearest, d);
  }

  float n = noise(center / (u_cell * 9.0) + vec2(u_time * 0.07, u_time * -0.05));
  float lens = u_pointer.z * smoothstep(u_lens, 0.0, distance(center, u_pointer.xy));
  float sweep = clamp(
    u_reveal * 1.6 - distance(center, u_resolution * 0.5) / length(u_resolution * 0.5),
    0.0,
    1.0
  );

  vec3 color;
  float radius;
  float alpha;
  if (hue >= 0) {
    float depth = clamp(-nearest / u_radius, 0.0, 1.0);
    radius = (0.2 + 0.26 * sqrt(depth) + 0.07 * n + 0.1 * lens) * u_cell;
    color = mix(u_colors[hue], vec3(1.0), 0.12 * n + 0.18 * lens);
    alpha = 1.0;
  } else {
    float halo = smoothstep(u_radius * 1.4, 0.0, nearest);
    radius = (0.07 + 0.12 * n * n + 0.2 * lens + 0.08 * halo) * u_cell;
    color = vec3(0.941);
    alpha = 0.09 + 0.3 * lens + 0.12 * halo;
  }

  float mask = 1.0 - smoothstep(radius - 0.75, radius + 0.75, distance(frag, center));
  float a = mask * alpha * sweep;
  outColor = vec4(color * a, a);
}`

export type FieldFrame = {
  time: number
  reveal: number
  pointer: readonly [number, number, number]
  capsules: readonly Capsule[]
  cell: number
  lens: number
}

export type BracketField = {
  isReady(): boolean
  resize(width: number, height: number, dpr: number): void
  draw(frame: FieldFrame): void
  dispose(): void
}

type Uniforms = Record<
  | 'resolution'
  | 'time'
  | 'cell'
  | 'pointer'
  | 'lens'
  | 'caps'
  | 'radius'
  | 'colors'
  | 'reveal',
  WebGLUniformLocation | null
>

export function createBracketField(
  canvas: HTMLCanvasElement
): BracketField | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  })
  if (!gl) return null

  const program = gl.createProgram()
  const vertex = gl.createShader(gl.VERTEX_SHADER)
  const fragment = gl.createShader(gl.FRAGMENT_SHADER)
  if (!program || !vertex || !fragment) return null

  gl.shaderSource(vertex, VERTEX_SHADER)
  gl.shaderSource(fragment, FRAGMENT_SHADER)
  gl.compileShader(vertex)
  gl.compileShader(fragment)
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)

  // Lets the driver compile off the main thread; we poll instead of blocking.
  const parallel = gl.getExtension('KHR_parallel_shader_compile')
  const buffer = gl.createBuffer()
  const vao = gl.createVertexArray()
  let uniforms: Uniforms | null = null
  let dpr = 1
  let failed = false

  const setup = () => {
    gl.useProgram(program)
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    )
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const location = (name: string) => gl.getUniformLocation(program, name)
    uniforms = {
      resolution: location('u_resolution'),
      time: location('u_time'),
      cell: location('u_cell'),
      pointer: location('u_pointer'),
      lens: location('u_lens'),
      caps: location('u_caps'),
      radius: location('u_radius'),
      colors: location('u_colors'),
      reveal: location('u_reveal'),
    }
  }

  return {
    isReady() {
      if (uniforms) return true
      if (failed) return false
      if (
        parallel &&
        !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)
      ) {
        return false
      }
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        failed = true
        return false
      }
      setup()
      return true
    },
    resize(width, height, nextDpr) {
      dpr = nextDpr
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    },
    draw({ time, reveal, pointer, capsules, cell, lens }) {
      if (!uniforms) return
      const packed = packCapsules(capsules, dpr)
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
      gl.uniform1f(uniforms.time, time)
      gl.uniform1f(uniforms.cell, cell * dpr)
      gl.uniform1f(uniforms.lens, lens * dpr)
      gl.uniform3f(uniforms.pointer, pointer[0] * dpr, pointer[1] * dpr, pointer[2])
      gl.uniform4fv(uniforms.caps, packed.positions)
      gl.uniform1f(uniforms.radius, packed.radius)
      gl.uniform3fv(uniforms.colors, packed.colors)
      gl.uniform1f(uniforms.reveal, reveal)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    },
  }
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/**
 * Wires the field to the hero: sizing, bracket anchors, pointer lens, scroll
 * parting, visibility and GPU-context loss. Returns a teardown that restores
 * the SVG poster.
 */
export function mountBracketField(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  create: (canvas: HTMLCanvasElement) => BracketField | null = createBracketField
): () => void {
  const left = hero.querySelector<HTMLElement>('[data-bracket="left"]')
  const right = hero.querySelector<HTMLElement>('[data-bracket="right"]')
  const field = left && right ? create(canvas) : null
  if (!field || !left || !right) return () => {}

  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const dprCap = coarse ? 1.5 : 2
  const cell = coarse ? 9 : 11
  const lens = coarse ? 150 : 190
  const pointer = { x: 0, y: 0, strength: 0, target: 0 }
  let anchors: { left: Rect; right: Rect } | null = null
  let width = 0
  let progress = scrollProgress(window.scrollY, hero.offsetHeight)
  let visible = true
  let frameHandle = 0
  let startedAt = 0
  let lastFrameAt = 0
  let torn = false

  const relativeTo = (element: HTMLElement, origin: DOMRect): Rect => {
    const rect = element.getBoundingClientRect()
    return {
      left: rect.left - origin.left,
      top: rect.top - origin.top,
      width: rect.width,
      height: rect.height,
    }
  }

  const measure = () => {
    const origin = canvas.getBoundingClientRect()
    width = origin.width
    field.resize(
      origin.width,
      origin.height,
      Math.min(window.devicePixelRatio || 1, dprCap)
    )
    anchors = { left: relativeTo(left, origin), right: relativeTo(right, origin) }
  }

  const running = () =>
    !torn && visible && !document.hidden && progress < 1 && anchors !== null

  const frame = (now: number) => {
    frameHandle = 0
    if (!running() || !anchors) return
    frameHandle = requestAnimationFrame(frame)
    if (coarse && now - lastFrameAt < 32) return
    lastFrameAt = now
    if (!field.isReady()) return
    if (!startedAt) {
      startedAt = now
      hero.dataset.gl = 'on'
    }

    if (coarse) {
      const t = now / 1000
      pointer.x = width * (0.5 + 0.28 * Math.cos(t * 0.21))
      pointer.y = hero.offsetHeight * (0.5 + 0.22 * Math.sin(t * 0.17))
      pointer.strength = 0.6
    } else {
      pointer.strength += (pointer.target - pointer.strength) * 0.1
    }

    field.draw({
      time: now / 1000,
      reveal: easeOutCubic(Math.min(1, (now - startedAt) / 1400)),
      pointer: [pointer.x, pointer.y, pointer.strength],
      capsules: capsulesFromBracketRects(
        anchors.left,
        anchors.right,
        partingOffset(progress, width)
      ),
      cell,
      lens,
    })
  }

  const kick = () => {
    if (!frameHandle && running()) frameHandle = requestAnimationFrame(frame)
  }

  const onScroll = () => {
    progress = scrollProgress(window.scrollY, hero.offsetHeight)
    kick()
  }
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    const origin = canvas.getBoundingClientRect()
    pointer.x = event.clientX - origin.left
    pointer.y = event.clientY - origin.top
    pointer.target = 1
    kick()
  }
  const onPointerLeave = () => {
    pointer.target = 0
  }
  const onContextLost = (event: Event) => {
    event.preventDefault()
    teardown()
  }

  const resizeObserver = new ResizeObserver(() => {
    measure()
    kick()
  })
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    kick()
  })

  function teardown() {
    if (torn) return
    torn = true
    cancelAnimationFrame(frameHandle)
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    window.removeEventListener('scroll', onScroll)
    hero.removeEventListener('pointermove', onPointerMove)
    hero.removeEventListener('pointerleave', onPointerLeave)
    document.removeEventListener('visibilitychange', kick)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    delete hero.dataset.gl
    field.dispose()
  }

  resizeObserver.observe(canvas)
  const title = hero.querySelector('h1')
  if (title) resizeObserver.observe(title)
  intersectionObserver.observe(hero)
  window.addEventListener('scroll', onScroll, { passive: true })
  hero.addEventListener('pointermove', onPointerMove)
  hero.addEventListener('pointerleave', onPointerLeave)
  document.addEventListener('visibilitychange', kick)
  canvas.addEventListener('webglcontextlost', onContextLost)
  void document.fonts?.ready.then(() => {
    if (torn) return
    measure()
    kick()
  })
  measure()
  kick()

  return teardown
}
```

- [ ] **Step 4: Replace `bracket-stage.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean }
}

/**
 * Loads the WebGL halftone field once the browser is idle. The server SVG
 * brackets stay (and remain the whole experience) when WebGL2 is missing,
 * motion is reduced, or the visitor asked to save data.
 */
export default function BracketStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = canvas?.closest<HTMLElement>('[data-hero]')
    if (!canvas || !hero) return

    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const saveData =
      (navigator as NavigatorWithConnection).connection?.saveData === true
    if (reducedMotion || saveData) return

    let cancelled = false
    let teardown: (() => void) | undefined

    const start = () => {
      void import('./bracket-field-gl').then(({ mountBracketField }) => {
        if (!cancelled) teardown = mountBracketField(canvas, hero)
      })
    }

    const hasIdle = typeof window.requestIdleCallback === 'function'
    const handle = hasIdle
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1200)

    return () => {
      cancelled = true
      if (hasIdle) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
      teardown?.()
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="bracket-canvas" />
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm vitest run tests/lib/site/bracket-field-gl.test.ts tests/components/bracket-stage.test.tsx tests/components/hero.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Check it in a browser**

With `pnpm dev`, open `/en` in Chromium.
Expected:
- About 1–2 s after load, a radial dot sweep prints the four colored capsules exactly where the SVG brackets were, and the SVG fades out.
- Moving the mouse grows and brightens nearby dots.
- Scrolling moves the brackets apart and the loop stops once the hero has scrolled away (DevTools Performance: no rAF activity while scrolled past).
- Emulating `prefers-reduced-motion: reduce` and reloading leaves only the SVG poster.

- [ ] **Step 7: De-risk the budget before building more**

Run: `pnpm exec next build`, then `pnpm exec next start -p 3100` in the background.
Run: `PERF_OUTPUT=$SCRATCH/perf-hero.json pnpm perf:measure && node scripts/check-performance-budget.mjs $SCRATCH/perf-hero.json $SCRATCH/perf-baseline.json`
Expected: PASS. `/en` and `/ko` stay within 5% JS of the baseline, LCP ≤ 2.5 s and CLS ≤ 0.05.

If this fails, fix it before Task 5: split the chunk, trim the shader, or cut font axes.

- [ ] **Step 8: Checkpoint**

Stage: `bracket-field-gl.ts`, `bracket-stage.tsx` and both tests. Commit only on request: `feat(home): idle-loaded WebGL2 halftone bracket field`.

---

### Task 5: Header, mobile menu and locale switch

**Files:**
- Create: `lib/site/localized-path.ts`, `app/components/site/locale-switch.tsx`, `app/styles/site-chrome.css`
- Rewrite: `app/components/header/index.tsx`, `app/components/header/navigation.tsx`
- Modify: `app/components/header/navigation-links.ts`, `app/globals.css` (import `site-chrome.css`), `vitest.setup.ts`, `tests/e2e/public-flows.spec.ts`
- Test: `tests/lib/site/localized-path.test.ts`, `tests/components/header-navigation.test.tsx`

**Interfaces:**
- Consumes: `chromeCopy` (Task 1).
- Produces:
  - `localizedPath(pathname: string | null, locale: Locale): string`
  - `<LocaleSwitch lang pathname label className? />`, rendered as `role="group"` with the other locale as an `<a hrefLang>`
  - `getHeaderNavigationLinks(lang): Array<{ href: string; label: string; prefetch?: boolean; utility?: boolean }>` in the order Sessions, Projects, Calendar, Members, GYMS (utility)
  - `<HeaderNavigation lang />` (default) and `<NavigationFallback lang />`
  - The dialog is named `Menu` / `메뉴`.

- [ ] **Step 1: Write the failing tests**

`tests/lib/site/localized-path.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { localizedPath } from '@/lib/site/localized-path'

describe('localizedPath', () => {
  it.each([
    ['/en', 'ko', '/ko'],
    ['/en/session/25-26/f8c1fc4a', 'ko', '/ko/session/25-26/f8c1fc4a'],
    ['/ko/project', 'en', '/en/project'],
    [null, 'ko', '/ko'],
    ['/', 'en', '/en'],
    ['/privacy', 'ko', '/ko/privacy'],
  ] as const)('%s → %s', (pathname, locale, expected) => {
    expect(localizedPath(pathname, locale)).toBe(expected)
  })
})
```

`tests/components/header-navigation.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/session/25-26',
}))

import HeaderNavigation from '@/app/components/header/navigation'

describe('HeaderNavigation', () => {
  it('marks the current section and keeps the order', () => {
    render(<HeaderNavigation lang="en" />)
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    const names = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent)

    expect(names).toEqual([
      'Sessions',
      'Projects',
      'Calendar',
      'Members',
      'GYMS',
    ])
    expect(within(nav).getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(
      within(nav).getByRole('link', { name: 'Projects' })
    ).not.toHaveAttribute('aria-current')
  })

  it('switches language without losing the page', () => {
    render(<HeaderNavigation lang="en" />)
    const [group] = screen.getAllByRole('group', { name: 'Language' })

    expect(within(group!).getByRole('link', { name: '한국어' })).toHaveAttribute(
      'href',
      '/ko/session/25-26'
    )
  })

  it('opens the menu dialog and closes it when a link is chosen', async () => {
    const user = userEvent.setup()
    render(<HeaderNavigation lang="en" />)
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' })

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const dialog = screen.getByRole('dialog', { name: 'Menu' })
    expect(
      within(dialog).getByRole('button', { name: 'Close navigation menu' })
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('link', { name: 'Calendar' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm vitest run tests/lib/site/localized-path.test.ts tests/components/header-navigation.test.tsx`
Expected: FAIL. The helper is missing, and the current nav has no Language group and no dialog.

- [ ] **Step 3: Add the jsdom dialog polyfill to `vitest.setup.ts`**

Append:

```ts
// jsdom lacks the modal dialog API used by the mobile menu. Mirror the
// browser contract: `open` attribute plus a `close` event.
const dialogPrototype = (globalThis.HTMLDialogElement ?? globalThis.HTMLElement)
  .prototype as HTMLDialogElement

if (typeof dialogPrototype.showModal !== 'function') {
  dialogPrototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  dialogPrototype.show = dialogPrototype.showModal
  dialogPrototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
```

- [ ] **Step 4: Implement the helper, the links and the locale switch**

`lib/site/localized-path.ts`:

```ts
import { i18n, type Locale } from '@/i18n-config'

/** Swaps (or adds) the locale segment so a language switch keeps the page. */
export function localizedPath(pathname: string | null, locale: Locale): string {
  if (!pathname || pathname === '/') return `/${locale}`

  const segments = pathname.split('/')
  if ((i18n.locales as readonly string[]).includes(segments[1] ?? '')) {
    segments[1] = locale
    return segments.join('/')
  }

  return `/${locale}${pathname}`
}
```

`app/components/header/navigation-links.ts`:

```ts
import type { Locale } from '@/i18n-config'
import { chromeCopy } from '@/lib/contents/site-copy'

export type HeaderNavigationLink = {
  href: string
  label: string
  prefetch?: boolean
  /** Members-only utility (GYMS): rendered quieter and never prefetched. */
  utility?: boolean
}

export function getHeaderNavigationLinks(lang: Locale): HeaderNavigationLink[] {
  const copy = chromeCopy[lang]

  return [
    { href: `/${lang}/session`, label: copy.sessions, prefetch: true },
    { href: `/${lang}/project`, label: copy.projects, prefetch: true },
    { href: `/${lang}/calendar`, label: copy.calendar, prefetch: true },
    { href: `/${lang}/member`, label: copy.members, prefetch: true },
    { href: `/${lang}/admin`, label: 'GYMS', prefetch: false, utility: true },
  ]
}
```

`app/components/site/locale-switch.tsx`:

```tsx
import type { Locale } from '@/i18n-config'
import { cn } from '@/lib/cn'
import { localizedPath } from '@/lib/site/localized-path'

const LOCALES: ReadonlyArray<{ code: Locale; short: string; name: string }> = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'ko', short: 'KO', name: '한국어' },
]

/**
 * Plain anchors on purpose: changing locale swaps the root layout's
 * `<html lang>`, so it is a full document navigation either way.
 */
export default function LocaleSwitch({
  lang,
  pathname,
  label,
  className,
}: {
  lang: Locale
  pathname: string | null
  label: string
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('locale-switch', className)}>
      {LOCALES.map(({ code, short, name }) =>
        code === lang ? (
          <span key={code} className="locale-switch-item" data-current="">
            <span aria-hidden="true">{short}</span>
            <span className="sr-only">{name}</span>
          </span>
        ) : (
          <a
            key={code}
            href={localizedPath(pathname, code)}
            hrefLang={code}
            lang={code}
            className="locale-switch-item"
          >
            <span aria-hidden="true">{short}</span>
            <span className="sr-only">{name}</span>
          </a>
        )
      )}
    </div>
  )
}
```

- [ ] **Step 5: Rewrite the header**

`app/components/header/navigation.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, type CSSProperties } from 'react'
import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Locale } from '@/i18n-config'
import LocaleSwitch from '@/app/components/site/locale-switch'
import { chromeCopy } from '@/lib/contents/site-copy'
import { cn } from '@/lib/cn'
import { getHeaderNavigationLinks } from './navigation-links'

function isCurrentPath(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

function DesktopNavigation({
  lang,
  pathname,
}: {
  lang: Locale
  pathname: string | null
}) {
  return (
    <nav
      aria-label={chromeCopy[lang].primaryNav}
      className="flex items-center gap-0.5 not-md:hidden"
    >
      {getHeaderNavigationLinks(lang).map(({ href, label, prefetch, utility }) => (
        <Link
          key={href}
          href={href}
          prefetch={prefetch}
          aria-current={isCurrentPath(pathname, href) ? 'page' : undefined}
          className={cn('site-nav-link', utility && 'site-nav-utility')}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

function MobileMenu({ lang, pathname }: { lang: Locale; pathname: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const copy = chromeCopy[lang]
  const links = getHeaderNavigationLinks(lang)

  const openMenu = () => {
    dialogRef.current?.showModal()
    setIsOpen(true)
  }
  const closeMenu = () => dialogRef.current?.close()

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="mobile-primary-navigation"
        aria-label={copy.openMenu}
        className="site-icon-button md:hidden"
      >
        <Bars2Icon className="size-6" aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        id="mobile-primary-navigation"
        aria-label={copy.menu}
        onClose={() => setIsOpen(false)}
        className="mobile-menu"
      >
        <div className="flex h-14 items-center justify-between pl-3">
          <span aria-hidden="true" className="font-code text-xs tracking-[0.18em] text-on-stage-muted uppercase">
            {'<menu />'}
          </span>
          <button
            type="button"
            onClick={closeMenu}
            aria-label={copy.closeMenu}
            className="site-icon-button"
          >
            <XMarkIcon className="size-6" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={copy.mobileNav} className="px-3 pt-6">
          <ul>
            {links.map((link, index) => (
              <li
                key={link.href}
                className="mobile-menu-item"
                style={{ '--i': index } as CSSProperties}
              >
                <Link
                  href={link.href}
                  prefetch={link.prefetch}
                  onClick={closeMenu}
                  aria-current={isCurrentPath(pathname, link.href) ? 'page' : undefined}
                  className={cn('mobile-menu-link', link.utility && 'mobile-menu-utility')}
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true" className="font-code text-sm text-on-stage-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div
          className="mobile-menu-item mt-10 px-3"
          style={{ '--i': links.length } as CSSProperties}
        >
          <LocaleSwitch lang={lang} pathname={pathname} label={copy.language} />
        </div>
      </dialog>
    </>
  )
}

export function NavigationFallback({ lang }: { lang: Locale }) {
  const copy = chromeCopy[lang]

  return (
    <div className="flex items-center gap-1">
      <DesktopNavigation lang={lang} pathname={null} />
      <LocaleSwitch lang={lang} pathname={null} label={copy.language} className="not-md:hidden" />
      <button
        type="button"
        disabled
        aria-label={copy.loadingMenu}
        className="site-icon-button md:hidden"
      >
        <Bars2Icon className="size-6" aria-hidden="true" />
      </button>
    </div>
  )
}

function NavigationForPath({ lang, pathname }: { lang: Locale; pathname: string }) {
  const copy = chromeCopy[lang]

  return (
    <div className="flex items-center gap-1">
      <DesktopNavigation lang={lang} pathname={pathname} />
      <LocaleSwitch lang={lang} pathname={pathname} label={copy.language} className="not-md:hidden" />
      <MobileMenu lang={lang} pathname={pathname} />
    </div>
  )
}

export default function HeaderNavigation({ lang }: { lang: Locale }) {
  const pathname = usePathname()

  // Remounting per path closes the menu after any navigation.
  return <NavigationForPath key={pathname} lang={lang} pathname={pathname} />
}
```

`app/components/header/index.tsx`:

```tsx
import { Suspense } from 'react'
import Link from 'next/link'
import GDGLogo from '@/app/components/svg/gdg-logo'
import type { Locale } from '@/i18n-config'
import { chromeCopy } from '@/lib/contents/site-copy'
import HeaderNavigation, { NavigationFallback } from './navigation'

/** Floating GDG-black capsule; legible over the dark stage and paper alike. */
export default function Header({ lang }: { lang: Locale }) {
  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link
          href={`/${lang}`}
          aria-label={chromeCopy[lang].home}
          className="site-header-logo pressable"
        >
          <GDGLogo svgKey="header" aria-hidden="true" className="h-[22px] w-auto" />
          <span className="font-display text-[15px] font-semibold tracking-tight [font-variation-settings:'ROND'_100] max-[359px]:sr-only">
            GDGoC Yonsei
          </span>
        </Link>
        <Suspense fallback={<NavigationFallback lang={lang} />}>
          <HeaderNavigation lang={lang} />
        </Suspense>
      </div>
    </header>
  )
}
```

- [ ] **Step 6: Create `app/styles/site-chrome.css` and import it**

Add `@import './styles/site-chrome.css';` after the hero import in `app/globals.css`, then create:

```css
/* Header capsule, mobile menu, locale switch, footer */
@layer components {
  .site-header {
    position: fixed;
    inset-inline: 0;
    top: 0;
    z-index: 50;
    padding: 0.75rem 0.75rem 0;
    pointer-events: none;
    view-transition-name: site-header;
  }

  .site-header-bar {
    pointer-events: auto;
    margin-inline: auto;
    display: flex;
    height: 3.5rem;
    max-width: 72rem;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 9999px;
    background-color: color-mix(in oklab, var(--s-stage) 86%, transparent);
    padding-inline: 0.375rem 0.5rem;
    color: var(--s-on-stage);
    box-shadow: 0 10px 30px -12px rgb(0 0 0 / 0.35);
    backdrop-filter: blur(14px) saturate(140%);
  }

  .site-header-logo {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    border-radius: 9999px;
    padding: 0.375rem 0.75rem 0.375rem 0.625rem;
  }

  .site-nav-link {
    display: inline-flex;
    min-height: 2.5rem;
    align-items: center;
    gap: 0.5rem;
    border-radius: 9999px;
    padding-inline: 0.875rem;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--s-on-stage-muted);
    transition:
      color var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast) var(--ease-out);
  }

  .site-nav-link[aria-current='page'] {
    color: var(--s-on-stage);
    background-color: rgb(255 255 255 / 0.1);
  }

  .site-nav-link[aria-current='page']::before {
    content: '';
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 9999px;
    background-color: #4285f4;
  }

  .site-nav-utility {
    margin-inline-start: 0.25rem;
    font-family: var(--font-code);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
  }

  .site-icon-button {
    display: inline-flex;
    width: 2.75rem;
    height: 2.75rem;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    color: var(--s-on-stage);
    transition: background-color var(--dur-fast) var(--ease-out);
  }

  .site-icon-button:disabled {
    opacity: 0.5;
  }

  .locale-switch {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 9999px;
    padding: 0.1875rem;
    font-family: var(--font-code);
    font-size: 0.75rem;
  }

  .locale-switch-item {
    display: inline-flex;
    min-width: 2.25rem;
    min-height: 2rem;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    color: var(--s-on-stage-muted);
  }

  .locale-switch-item[data-current] {
    background-color: var(--s-on-stage);
    color: var(--s-stage);
  }

  .mobile-menu {
    position: fixed;
    inset: 0;
    margin: 0;
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: none;
    overflow-y: auto;
    border: 0;
    padding: 0.75rem;
    background-color: var(--s-stage);
    color: var(--s-on-stage);
  }

  .mobile-menu::backdrop {
    background-color: rgb(0 0 0 / 0.4);
  }

  .mobile-menu-link {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid rgb(255 255 255 / 0.1);
    padding-block: 1rem;
    font-family: var(--font-display);
    font-size: clamp(2rem, 9vw, 2.75rem);
    font-weight: 600;
    letter-spacing: -0.03em;
    font-variation-settings: 'ROND' 100;
  }

  .mobile-menu-link[aria-current='page'] {
    color: #57caff;
  }

  .mobile-menu-utility {
    font-size: 1.25rem;
    color: var(--s-on-stage-muted);
  }
}

html:has(.mobile-menu[open]) {
  overflow: hidden;
}

@media (min-width: 640px) {
  .site-header {
    padding: 1rem 1.25rem 0;
  }
}

@media (hover: hover) {
  .site-nav-link:hover,
  .site-icon-button:hover,
  a.locale-switch-item:hover {
    color: var(--s-on-stage);
    background-color: rgb(255 255 255 / 0.08);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .mobile-menu[open] {
    animation: menu-in 420ms var(--ease-out);
  }

  .mobile-menu[open] .mobile-menu-item {
    animation: menu-item-in 560ms var(--ease-spring) backwards;
    animation-delay: calc(80ms + var(--i, 0) * 50ms);
  }
}

@keyframes menu-in {
  from {
    opacity: 0;
    clip-path: inset(0 0 100% 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}

@keyframes menu-item-in {
  from {
    opacity: 0;
    transform: translateY(1.25rem);
  }
}
```

- [ ] **Step 7: Scope the mobile e2e link query to the dialog**

In `tests/e2e/public-flows.spec.ts`, inside `menu button opens navigation and routes to calendar`, replace
`await page.getByRole('link', { name: /^Calendar$/ }).click()`
with:

```ts
await page
  .getByRole('dialog', { name: 'Menu' })
  .getByRole('link', { name: /^Calendar/ })
  .click()
```

The footer now also has a "Calendar" link, and the dialog link's name includes its index badge only through the hidden span, so it still starts with "Calendar".

- [ ] **Step 8: Run the tests**

Run: `pnpm vitest run tests/lib/site/localized-path.test.ts tests/components/header-navigation.test.tsx && pnpm test:types && pnpm lint`
Expected: PASS (9 tests).

- [ ] **Step 9: Checkpoint**

Stage: the header files, `navigation-links.ts`, `locale-switch.tsx`, `localized-path.ts`, `site-chrome.css`, `globals.css`, `vitest.setup.ts`, the e2e spec and the tests. Commit only on request: `feat(chrome): floating capsule header with dialog menu and path-preserving locale switch`.

---

### Task 6: Footer and Seoul clock

**Files:**
- Create: `app/components/site/seoul-clock.tsx`, `app/components/site/footer-locale-switch.tsx`
- Rewrite: `app/components/footer.tsx`
- Modify: `app/styles/site-chrome.css` (footer rules), `tests/components/common-components.test.tsx`
- Test: `tests/components/seoul-clock.test.tsx`

**Interfaces:**
- Consumes: `LocaleSwitch`, `chromeCopy`.
- Produces: `<SeoulClock label />`, `<FooterLocaleSwitch lang label />`, `<Footer lang />`. The footer keeps its link names.

- [ ] **Step 1: Write the failing tests**

`tests/components/seoul-clock.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SeoulClock from '@/app/components/site/seoul-clock'

describe('SeoulClock', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the current time in Seoul regardless of the machine zone', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-23T10:04:00Z'))
    render(<SeoulClock label="Sinchon, Seoul" />)
    expect(screen.getByText('19:04')).toBeInTheDocument()
  })
})
```

In `tests/components/common-components.test.tsx`, add this at the top, after the existing `vi.mock` for reduced motion:

```ts
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/project',
}))
```

At the end of `it('renders footer links', …)`, add:

```ts
expect(
  screen.getAllByRole('link', { name: '한국어' }).at(-1)
).toHaveAttribute('href', '/ko/project')
expect(
  screen.getByRole('link', { name: '2026 Freshman Orientation' })
).toHaveAttribute('href', '/en/2026-freshman-ot')
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm vitest run tests/components/seoul-clock.test.tsx tests/components/common-components.test.tsx`
Expected: FAIL. The clock is missing, and the old footer links to `/ko`, not `/ko/project`.

- [ ] **Step 3: Implement the clock and the footer locale leaf**

`app/components/site/seoul-clock.tsx`:

```tsx
'use client'

import { useSyncExternalStore } from 'react'

const formatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
})

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000)
  return () => window.clearInterval(id)
}

const readSeoulTime = () => formatter.format(new Date())
const readNothing = () => null

/** Server and hydration render "--:--"; the client then ticks in KST. */
export default function SeoulClock({ label }: { label: string }) {
  const time = useSyncExternalStore(subscribe, readSeoulTime, readNothing)

  return (
    <p className="tabular-nums">
      {label} · <time>{time ?? '--:--'}</time> KST
    </p>
  )
}
```

`app/components/site/footer-locale-switch.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import type { Locale } from '@/i18n-config'
import LocaleSwitch from './locale-switch'

export default function FooterLocaleSwitch({
  lang,
  label,
}: {
  lang: Locale
  label: string
}) {
  return <LocaleSwitch lang={lang} pathname={usePathname()} label={label} />
}
```

- [ ] **Step 4: Rewrite `app/components/footer.tsx`**

```tsx
import { Suspense, type ReactNode } from 'react'
import Link from 'next/link'
import type { Locale } from '@/i18n-config'
import GDGLogo from '@/app/components/svg/gdg-logo'
import FooterLocaleSwitch from '@/app/components/site/footer-locale-switch'
import LocaleSwitch from '@/app/components/site/locale-switch'
import SeoulClock from '@/app/components/site/seoul-clock'
import { chromeCopy } from '@/lib/contents/site-copy'

const COPYRIGHT_YEAR = 2026
const EMAIL = 'gdsc.yonsei.univ@gmail.com'
const INSTAGRAM_URL = 'https://www.instagram.com/gdg.yonseiuniv/'
const LINKEDIN_URL = 'https://www.linkedin.com/company/gdsc-yonsei/'
const CHAPTER_URL =
  'https://gdg.community.dev/gdg-on-campus-yonsei-university-sinchon-campus-seoul-south-korea/'
const SOURCE_URL = 'https://github.com/gdg-yonsei/gdgoc-yonsei-web'

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-code text-xs tracking-[0.16em] text-on-stage-muted uppercase">
        {title}
      </h2>
      <ul className="mt-5 flex flex-col gap-3">{children}</ul>
    </div>
  )
}

const External = () => (
  <span aria-hidden="true" className="text-on-stage-muted">
    ↗
  </span>
)

export default function Footer({ lang }: { lang: Locale }) {
  const copy = chromeCopy[lang]

  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-6xl px-5 pt-20 pb-10 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex flex-col gap-5">
            <GDGLogo svgKey="footer" aria-hidden="true" className="h-9 w-auto self-start" />
            <p className="max-w-xs text-sm leading-6 text-on-stage-muted">
              {copy.footerBlurb}
            </p>
          </div>
          <FooterColumn title={copy.footerExplore}>
            <li><Link href={`/${lang}/session`} className="site-footer-link">{copy.sessions}</Link></li>
            <li><Link href={`/${lang}/project`} className="site-footer-link">{copy.projects}</Link></li>
            <li><Link href={`/${lang}/calendar`} className="site-footer-link">{copy.calendar}</Link></li>
            <li><Link href={`/${lang}/member`} className="site-footer-link">{copy.members}</Link></li>
          </FooterColumn>
          <FooterColumn title={copy.footerConnect}>
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer noopener" aria-label="GDGoC Yonsei Instagram" className="site-footer-link">
                Instagram <External />
              </a>
            </li>
            <li>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer noopener" aria-label="GDGoC Yonsei LinkedIn" className="site-footer-link">
                LinkedIn <External />
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} rel="noreferrer noopener" aria-label="Email GDGoC Yonsei" className="site-footer-link">
                Email
              </a>
            </li>
            <li>
              <a href={CHAPTER_URL} target="_blank" rel="noreferrer noopener" className="site-footer-link">
                {copy.chapterPage} <External />
              </a>
            </li>
          </FooterColumn>
          <FooterColumn title={copy.footerSite}>
            <li><Link href={`/${lang}/privacy-policy`} className="site-footer-link">{copy.privacy}</Link></li>
            <li><Link href={`/${lang}/terms-of-service`} className="site-footer-link">{copy.terms}</Link></li>
            <li><Link href={`/${lang}/2026-freshman-ot`} prefetch={false} className="site-footer-link">{copy.freshmanOt}</Link></li>
            <li>
              <a href={SOURCE_URL} target="_blank" rel="noreferrer noopener" className="site-footer-link">
                {copy.source} <External />
              </a>
            </li>
            <li><Link href={`/${lang}/admin`} prefetch={false} className="site-footer-link">{copy.gyms}</Link></li>
          </FooterColumn>
        </div>
        <p aria-hidden="true" className="site-footer-wordmark">
          GDGoC Yonsei
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 pt-6 font-code text-xs text-on-stage-muted">
          <p>© {COPYRIGHT_YEAR} GDG on Campus Yonsei. All rights reserved.</p>
          <SeoulClock label={copy.clockLabel} />
          <Suspense fallback={<LocaleSwitch lang={lang} pathname={null} label={copy.language} />}>
            <FooterLocaleSwitch lang={lang} label={copy.language} />
          </Suspense>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Append the footer rules to `app/styles/site-chrome.css`, inside `@layer components`**

```css
  .site-footer {
    overflow: hidden;
    background-color: var(--s-stage);
    color: var(--s-on-stage);
  }

  .site-footer-link {
    display: inline-flex;
    min-height: 1.75rem;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.9375rem;
    color: var(--s-on-stage);
    text-decoration-color: rgb(255 255 255 / 0.3);
    text-underline-offset: 0.3em;
  }

  .site-footer-wordmark {
    margin-block: 4.5rem 2rem;
    font-family: var(--font-display);
    font-size: clamp(3rem, 11.4vw, 10rem);
    font-weight: 700;
    line-height: 0.8;
    letter-spacing: -0.055em;
    white-space: nowrap;
    user-select: none;
    font-variation-settings: 'ROND' 0;
    transition: font-variation-settings 900ms var(--ease-spring);
  }
```

Then add these to the existing `@media (hover: hover)` block:

```css
  .site-footer-link:hover {
    text-decoration-line: underline;
  }

  .site-footer-wordmark:hover {
    font-variation-settings: 'ROND' 100;
  }
```

- [ ] **Step 6: Run the tests**

Run: `pnpm vitest run tests/components/seoul-clock.test.tsx tests/components/common-components.test.tsx && pnpm test:types && pnpm lint`
Expected: PASS.

- [ ] **Step 7: Checkpoint**

Stage: `footer.tsx`, `seoul-clock.tsx`, `footer-locale-switch.tsx`, `site-chrome.css` and both tests. Commit only on request: `feat(chrome): stage footer with KST clock and wordmark`.

---

### Task 7: 404 and error pages

**Files:**
- Create: `app/components/site/not-found-view.tsx`
- Rewrite: `app/not-found.tsx`, `app/(home)/[lang]/error.tsx`
- Modify: `proxy.ts` (`publicRouteNotFound` HTML only)
- Test: `tests/proxy.test.ts` (existing: must stay green), `tests/components/not-found-view.test.tsx` (new)

**Interfaces:**
- Consumes: `BracketPoster`, `googleSansFlex`, `googleSansCode`, `bracketCapsulesInViewBox`, `capsulePath`, `BRACKET_VIEWBOX`.
- Produces: `<NotFoundView />` (the `<main>` content, without `<html>` or `<body>`).

- [ ] **Step 1: Write the failing test**

`tests/components/not-found-view.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFoundView from '@/app/components/site/not-found-view'

describe('NotFoundView', () => {
  it('shows a single 404 heading between brackets and useful links', () => {
    render(<NotFoundView />)

    expect(
      screen.getByRole('heading', { level: 1, name: '404' })
    ).toBeInTheDocument()
    // The Playwright 404 matrix uses getByText('404'), so it must be unique.
    expect(screen.getAllByText(/404/)).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Sessions/ })).toHaveAttribute(
      'href',
      '/en/session'
    )
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `pnpm vitest run tests/components/not-found-view.test.tsx`
Expected: FAIL, because `not-found-view` can't be resolved.

- [ ] **Step 3: Create the view and slim down `app/not-found.tsx`**

`app/components/site/not-found-view.tsx`:

```tsx
import Link from 'next/link'
import BracketPoster from '@/app/components/site/bracket-poster'

const links = [
  { href: '/', label: 'Home · 홈' },
  { href: '/en/session', label: 'Sessions · 세션' },
  { href: '/en/project', label: 'Projects · 프로젝트' },
]

/** Root 404 content. No locale is known here, so the copy is bilingual. */
export default function NotFoundView() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="flex items-center gap-[0.12em] text-[clamp(4.5rem,18vw,12rem)]">
        <span className="bracket-slot" aria-hidden="true">
          <BracketPoster side="left" id="not-found-left" />
        </span>
        <h1 className="font-display leading-none font-bold tracking-[-0.05em] [font-variation-settings:'ROND'_100]">
          404
        </h1>
        <span className="bracket-slot" aria-hidden="true">
          <BracketPoster side="right" id="not-found-right" />
        </span>
      </div>
      <p className="max-w-md text-on-stage-muted">
        This page slipped out of the brackets.
        <br />
        <span lang="ko">페이지를 찾을 수 없어요.</span>
      </p>
      <nav aria-label="Helpful links" className="flex flex-wrap justify-center gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="pressable inline-flex min-h-12 items-center rounded-full border border-white/20 px-5 font-semibold"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  )
}
```

`app/not-found.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'
import NotFoundView from '@/app/components/site/not-found-view'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  title: '404 Not Found | GDGoC Yonsei',
  description: 'Google Developer Group on Campus Yonsei University',
}

export default function NotFound() {
  return (
    <html
      lang="en"
      className={cn('site', googleSansFlex.variable, googleSansCode.variable)}
    >
      <body className="bg-stage text-on-stage">
        <NotFoundView />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Rewrite `app/(home)/[lang]/error.tsx`**

```tsx
'use client'

import LocalizedText from '@/app/components/localized-text'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error(error)

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 pt-28 pb-20 text-center">
      <p aria-hidden="true" className="font-code text-xs tracking-[0.18em] text-fg-subtle uppercase">
        {'<error />'}
      </p>
      <h2 className="font-display text-4xl font-bold tracking-tight [font-variation-settings:'ROND'_100]">
        <LocalizedText en="Something went wrong" ko="문제가 발생했어요" />
      </h2>
      <p className="max-w-md text-fg-muted">
        <LocalizedText
          en="An unexpected error occurred. Please try again."
          ko="예기치 않은 오류가 발생했어요. 다시 시도해 주세요."
        />
      </p>
      <button
        type="button"
        onClick={reset}
        className="pressable inline-flex min-h-12 items-center rounded-full bg-fg px-6 font-semibold text-paper"
      >
        <LocalizedText en="Try again" ko="다시 시도" />
      </button>
    </section>
  )
}
```

- [ ] **Step 5: Restyle the proxy's inline 404**

In `proxy.ts`, add these imports:

```ts
import {
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
  type BracketSide,
} from '@/lib/site/bracket-geometry'
```

Add module-level helpers above `publicRouteNotFound`:

```ts
const BRACKET_FILL = {
  red: '#EA4335',
  blue: '#4285F4',
  yellow: '#F9AB00',
  green: '#34A853',
} as const

function bracketSvg(side: BracketSide) {
  const paths = bracketCapsulesInViewBox(side)
    .map((capsule) => `<path d="${capsulePath(capsule)}" fill="${BRACKET_FILL[capsule.hue]}"/>`)
    .join('')
  return `<svg aria-hidden="true" viewBox="0 0 ${BRACKET_VIEWBOX.width} ${BRACKET_VIEWBOX.height}">${paths}</svg>`
}

const NOT_FOUND_BRACKETS = { left: bracketSvg('left'), right: bracketSvg('right') }
```

Inside `publicRouteNotFound`, replace the `<style>` and `<body>` contents of the `html` template, keeping the `<head>` meta and title:

```ts
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; background: #1e1e1e; color: #f0f0f0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
      main { display: flex; min-height: 100vh; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; padding: 1.5rem; text-align: center; }
      h1 { display: flex; align-items: center; gap: 0.12em; margin: 0; font-size: clamp(4rem, 16vw, 9rem); font-weight: 700; letter-spacing: -0.05em; line-height: 1; }
      h1 svg { height: 1.1em; width: auto; }
      p { margin: 0; color: #b4b4b4; }
      a { color: #1e1e1e; background: #f0f0f0; padding: 0.75rem 1.5rem; border-radius: 9999px; font-weight: 600; text-decoration: none; }
      a:focus-visible { outline: 3px solid #4285f4; outline-offset: 4px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${NOT_FOUND_BRACKETS.left}404${NOT_FOUND_BRACKETS.right}</h1>
      <p>${locale === 'ko' ? '페이지를 찾을 수 없어요.' : 'This page slipped out of the brackets.'}</p>
      <a href="/${locale}">${backLabel}</a>
    </main>
  </body>
```

- [ ] **Step 6: Run the tests**

Run: `pnpm vitest run tests/components/not-found-view.test.tsx tests/proxy.test.ts && pnpm test:types && pnpm lint`
Expected: PASS. `proxy.test.ts` still finds `404 Not Found` in the `<title>`.

- [ ] **Step 7: Checkpoint**

Stage: `app/not-found.tsx`, `app/components/site/not-found-view.tsx`, `app/(home)/[lang]/error.tsx`, `proxy.ts` and `tests/components/not-found-view.test.tsx`. Commit only on request: `feat(chrome): bracket 404 and bilingual error boundary`.

---

### Task 8: Legacy cleanup and Plan 1 verification

**Files:**
- Delete: `app/(home)/[lang]/welcome-page.tsx`, `app/(home)/[lang]/home-page-background.tsx`
- Modify: `app/globals.css`: remove `.h-home-screen`, the `/* Home shooting star … */` block through `.shooting-star-br`, and the `.shooting-star` rule inside the trailing `prefers-reduced-motion` block.

- [ ] **Step 1: Delete and check for references**

Run: `grep -rn "shooting-star\|h-home-screen\|welcome-page\|home-page-background" app lib tests`
Expected: no output after the deletions and CSS edits.

- [ ] **Step 2: Run the full static suite**

Run: `pnpm lint --max-warnings=0 && pnpm test:types && pnpm test`
Expected: PASS. Pre-existing failures recorded in Task 0 are the only allowed ones.

- [ ] **Step 3: Production build and perf comparison**

Run: `pnpm exec next build`, then start `pnpm exec next start -p 3100` in the background.
Run: `PERF_OUTPUT=$SCRATCH/perf-plan1.json pnpm perf:measure && node scripts/check-performance-budget.mjs $SCRATCH/perf-plan1.json $SCRATCH/perf-baseline.json`
Expected: `Performance budget passed for 22 route/profile samples.`

If `/en` or `/ko` JS regresses by more than 5%: confirm `bracket-field-gl` is a separate chunk (DevTools Network) and that no `motion` chunk loads on `/`.

- [ ] **Step 4: Browser QA (Playwright MCP or chrome-devtools MCP against `next start`)**

Check each of these:
- Widths 320, 360, 390, 768, 1280 and 1920 on `/en` and `/ko`: `document.documentElement.scrollWidth === window.innerWidth`.
- Tab from the top of the page: the skip link appears, and Enter moves focus to `#main`.
- 390 px: the menu opens, Escape closes it, focus returns to the trigger, and a link navigates and closes the menu.
- Emulated `prefers-reduced-motion: reduce`: no canvas activity (`data-gl` absent), and the brackets are static.
- `/ko/session` → the language switch goes to `/en/session`.
- `/en/project/not-a-generation` → the restyled 404 with HTTP status 404.
- Lighthouse (desktop, `/en`): accessibility ≥ 95 and no contrast failures in the hero, header or footer.

- [ ] **Step 5: Checkpoint**

Stage: the deletions and `app/globals.css`. Commit only on request: `chore(home): remove shooting-star welcome section`.
