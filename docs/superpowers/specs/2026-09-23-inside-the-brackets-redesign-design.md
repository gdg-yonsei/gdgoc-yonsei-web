- Date: 2026-09-23
- Status: approved (direction: Inside the Brackets; July revert reason: wrong identity; admin tag editing in scope)
- Branch: `new-landing-page`

# GDGoC Yonsei — "Inside the Brackets" public-site redesign

## Context

The public site (Next.js 16.3, `cacheComponents`, bilingual `/en` · `/ko`) is being rebuilt visually from scratch so that it *is* a showcase of what the community can build. The current landing (welcome / about / activities carousel / parts) and the generation-first Sessions and Projects flows are replaced. Written content is reused from `lib/contents/*` and the DB.

**Decisions made with you**
- **Direction — Inside the Brackets.** The GDG `< >` chevrons organize everything. The hero is an immersive dark "stage" where the H1 "GDGoC Yonsei" literally sits between the two brackets. Scrolling parts the brackets, and the page opens onto light, readable document sheets. Dark mode follows the system setting.
- **Identity guardrail.** The July redesign was reverted for *wrong identity*. So use only real GDG / Google brand assets:
  - the actual chevron capsule geometry from `app/components/svg/gdg-logo.tsx`
  - the GDG palette already in `app/globals.css` (core `*-300`, bright `*-200`, pastel `*-100`, neutrals `#1E1E1E` / `#F0F0F0`)
  - the GDG halftone-dot motif
  - the Google Sans family: Google Sans Flex and Google Sans Code (both OFL, both in next/font), with Pretendard for Hangul
  - **Not allowed:** a navy "Yonsei blue" anchor, JetBrains Mono, or a neon / glass dev-tool look.
- **Admin gains tech-stack tag editing**, so Projects can be filtered by technology.

**Constraints found in the repo and on production**
- **Performance budgets** (`docs/performance/nextjs-16.3-performance.md`, `scripts/check-performance-budget.mjs`):
  - ≤170 KB encoded JS per route (routes are at 149–162 KB today), ≤70 KB RSC
  - LCP ≤2.5 s at 200 KB/s with 4× CPU slowdown, CLS ≤0.05
  - ≤75 requests, ≤25 prefetches
  - **So:** CSS-first motion, React `<ViewTransition>`, SVG, and a single hand-written WebGL2 shader (~5 KB, loaded when idle). No three.js, GSAP or Lenis, and `motion` stays out of public routes.
  - **Amended 2026-09-25:** anime.js 4.5 is allowed on the landing page (`/en`, `/ko`) only. It loads as an async chunk after idle, never under reduced motion or Save-Data. The home routes get their own JS cap (200 KB). See `2026-09-25-landing-motion-design.md`.
- **Sparse content.** Only 25-26 has public records:
  - about 23 sessions (T19, Cloud / Front / UX part sessions, Demo Day, Onboarding), many using the default image
  - 3 oTP projects
  - The 22-23, 23-24, 24-25 and 26-27 pages are empty.
  - **So:** an archive-first structure, typography-first session design, and graceful empty states.
- **Must be preserved:**
  - every URL
  - the `proxy.ts` true-404 guard
  - cache tags and the invalidation contract (`docs/architecture/caching.md`)
  - instant-navigation shells
  - EN/KO parity
  - no admin changes other than tags, and no schema changes (the `tags` / `projects_to_tags` tables already exist)

---

## 1. Design system

### Identity anchors
| Asset | Source | Where it shows up |
|---|---|---|
| Chevrons: 4 capsules (red + blue = `<`, green + yellow = `>`) | `gdg-logo.tsx`, viewBox 512×321 | hero field, bookend CTA, section tags, 404, small marks |
| Palette | `gdg-*` tokens in `globals.css` | core colors for fills and graphics, bright colors on dark, pastels for chips and tints |
| Halftone dots | GDG brand pattern | WebGL field, SVG poster, textures |
| Type | Google Sans Flex (`wght`, `wdth`, `ROND`), Google Sans Code, Pretendard Variable | Latin display and body, mono meta, Hangul |

### Tokens: new `app/site-theme.css`, imported by `globals.css` and scoped to `html.site`
- The admin's `:root` tokens (`--canvas`, `--surface`, `--ink`, …) stay untouched. New names are exposed through `@theme inline` so nothing collides: `bg-stage`, `bg-paper`, `bg-sheet`, `text-fg`, `text-fg-muted`, `text-on-stage`, `border-rule`, `bg-g-blue|red|yellow|green`, plus `-bright`, `-pastel` and `-ink` variants. The `-ink` variants are text colors that pass AA contrast.
- **Surfaces:** `stage` #1E1E1E (hero and footer), `paper` (page), `sheet` (cards), `rule` (hairlines). `@media (prefers-color-scheme: dark)` swaps paper, sheet and fg.
- **Color maps, with a single source in `lib/site/labels.ts`:**
  - Categories: `tech_talk`→blue, `part_session`→green, `hackathon`→red, `demo_day`→yellow, `devrel`→bright pink.
  - Parts also map to palette colors.
- **Shape:**
  - Capsule radius for all controls, echoing the logo strokes. 24–28 px radius for sheets.
  - "Sticker" elevation for featured cards: a 1.5 px ink outline plus a hard offset shadow, matching the GDG 2024 outlined style. Everything else uses soft shadows.

### Typography
- **Fonts in the public layout:**
  - Load `Google_Sans_Flex({ subsets: ['latin'], axes: ['wdth','ROND'], display: 'swap', variable })` and `Google_Sans_Code({ subsets: ['latin'] })` through `next/font/google`.
  - Pretendard stays self-hosted in `app/pretendard.css`, and the admin keeps its local Google Sans.
- **Stacks:**
  - EN body: Google Sans Flex, then Pretendard.
  - `:lang(ko)` body: Pretendard first, for an even rhythm across mixed scripts.
  - Latin display (brand words, numerals): always Google Sans Flex.
  - Meta, dates, tags and counters: Google Sans Code with `tabular-nums`.
- **Scale and wrapping:** fluid `clamp()` sizes, with the hero around `clamp(4rem, 13vw, 11.5rem)`. Headings use `text-wrap: balance` and body text uses `pretty`.
- **Kinetic type:** `font-variation-settings` on `wght`, `wdth` and `ROND`, driven by hover or scroll on display words. Off under reduced motion.
- **Font weight check:** measure the Flex Latin woff2 early; the target is about 120 KB. If it's larger, drop `ROND` or `wdth` from the body face and keep them only for display text.

### Motion (CSS first)
- **Easing:** tokens include a spring curve built with CSS `linear()`. Durations are 150, 250 and 400 ms.
- **Scroll-driven effects** (`animation-timeline: view() | scroll()`), all behind `@supports` with static fallbacks that still show everything:
  - reveal on enter
  - word-by-word highlighting in the manifesto
  - the brackets parting in the hero
  - a sticky card stack for programs
- **View Transitions** (React `<ViewTransition>` plus `<Link transitionTypes>`):
  - The header stays anchored (`view-transition-name: site-header`).
  - `nav-forward` / `nav-back` directional slides between lists and detail pages.
  - A Suspense reveal: the skeleton slides down while the content slides up.
  - A crossfade when switching generations on the same route.
  - Shared-element morphs for the session title and the project cover, as an enhancement that only plays when the destination is already prefetched.
  - `::view-transition { pointer-events: none }`.
- **Reduced motion:** no translation or parallax, and a static WebGL frame. Fades only.
- **Types:** add `types/react-canary.d.ts` (`/// <reference types="react/canary" />`). `ViewTransition` ships in the React build bundled with Next, and its types live in `@types/react/canary.d.ts`.

---

## 2. Information architecture (URLs unchanged)

| Route | Becomes |
|---|---|
| `/[lang]` | Narrative landing (§3) |
| `/[lang]/session` | **Session Log.** Every public session from all generations, grouped by generation and then month, drawn as git-log lanes, with facet filters and search |
| `/[lang]/session/[generation]` | The same log for one generation, plus a chapter header and previous/next generation links. When empty: a designed empty state and `noindex, follow` |
| `/[lang]/session/[generation]/[id]` | Session page: breadcrumb, a "commit" header, a metadata list, content, a gallery or a generated poster, related sessions, previous/next |
| `/[lang]/project` | **Releases.** A showcase grid of all projects, filtered by generation, tech stack, live demo and open source, plus search |
| `/[lang]/project/[generation]` | The showcase for one generation. `noindex` when empty |
| `/[lang]/project/[generation]/[id]` | Case study: hero, cover, content with a sticky sidebar (team, stack, links), gallery, next project |
| member / calendar / policy pages / 404 | Restyled in the new system |

- **Header navigation:** Sessions · Projects · Calendar · Members (the order set in commit `348835e`), plus EN/KO, a ⌘K search button and a small GYMS link.
- **Language switch** (header and footer): now keeps the current path. It uses a plain `<a hrefLang>`, because changing locale is a root-layout reload.

---

## 3. Pages

### Global chrome
- **Header:** a floating capsule bar that is always dark `stage`, with a hairline border and a small `backdrop-filter`. It stays legible over both the dark hero and the paper pages, so no scroll-state logic is needed.
  - **Mobile:** a full-screen overlay menu with large type.
  - **Kept contract:** the "Open/Close navigation menu" labels, Escape closing the menu and returning focus, and `aria-current`.
- **Footer:**
  - on a stage background, with the brackets as a bookend
  - a huge wordmark whose roundness (`ROND`) morphs on hover
  - a sitemap, the official channels, the language switch and the policy links
  - a live "Sinchon, Seoul · HH:MM KST" clock (a tiny client leaf that renders empty on the server)
  - "View source" pointing to github.com/gdg-yonsei/gdgoc-yonsei-web

### Landing `/[lang]`
1. **Hero `< GDGoC Yonsei >`.**
   - **Text:**
     - H1 "GDGoC Yonsei" between the two chevrons, rendered as an animated halftone field.
     - Eyebrow: "Google Developer Groups on Campus · Yonsei University".
     - A tagline based on the existing intro copy, and two CTAs: Explore sessions and See projects.
     - A live mono meta strip showing session, project and generation counts plus "T19 · Tue 19:00 KST". It sits in a Suspense leaf whose skeleton has a fixed width.
   - **Rendering:**
     - A server-rendered SVG poster draws the same halftone chevrons instantly, so LCP is the H1 text and doesn't depend on JS.
     - The WebGL2 canvas fades in over it once the browser is idle.
   - **Scroll:** the brackets part, and the paper sheet rises over the stage with a capsule-radius top edge.
   - **Draft copy** (for your review):
     - EN tagline: "Yonsei University's student developer community. We connect, learn, and grow — then ship what we build."
     - KO tagline: "연세대학교 학생 개발자 커뮤니티. 함께 연결하고, 배우고, 성장하며 — 만든 것을 세상에 내놓습니다."
2. **`<about>` manifesto.**
   - The GDGoC Yonsei statement set at display size, with each word highlighting as you scroll.
   - A short "What is GDG on Campus?" aside.
   - The three pillars (Community / Tech / Sustainable Growth), each with a small animated glyph.
3. **`<programs>`.**
   - T19, Part Sessions, oTP → Demo Day, Solution Challenge, Yonsei × Korea Demo Day and The Bridge Hackathon, shown as outlined sticker cards in a sticky scroll stack. It becomes a plain grid on mobile and under reduced motion.
   - Solution Challenge 2023 gets a narrowing-brackets funnel: 2,100 teams → 6 from Yonsei → 3 in the Top 100 → 1 Top 10 finalist.
4. **`<parts>`.** Modules for Front-End, Back-End, ML/AI, Cloud, UI/UX and DevRel.
   - Each has a generated CSS/SVG glyph that animates on hover or focus: layout boxes, layers, a node graph, a mesh, a bézier curve, broadcast rings.
   - The descriptions from `parts-section.ts` stay in the HTML.
5. **`<log>`.** The latest 6 sessions, drawn with the same row component as the Session Log, linking to the full log.
6. **`<releases>`.** The latest projects (one featured, two standard) linking to all projects.
7. **`<join>`.** The brackets close around the CTA as a bookend to the hero.
   - Copy: "Recruiting news goes out on Instagram first" (no invented schedule).
   - Links to the channels and the calendar.
- **JSON-LD:** keep the existing Organization, WebSite and WebPage graph.

### Sessions
- **Hub header:** a breadcrumb, the H1, a description and counts. A generation strip shows non-empty generations as pills with counts, linking to the generation pages; empty generations appear muted as "no public records yet".
- **Filter bar** (sticky below the header):
  - Search (title EN and KO, part, location).
  - Checkbox chips inside a `<fieldset>`/`<legend>` for Category, Part and Generation.
  - An `aria-live` result count and a reset button.
  - Filter state is mirrored in the query string with `history.replaceState`, so links are shareable while the canonical URL stays clean.
- **The log:**
  - **Structure:** each generation is a `<section>`, each month an `<h3>`, and the sessions an `<ol>` of `<li><article>`.
  - **Graph:** the lane / commit gutter is decorative CSS/SVG with `aria-hidden`.
  - **Each row:** a mono date and time ("TUE 2025.11.04 19:00"), the title link, category and part chips, the location, and a thumbnail only when `mainImage` isn't the default placeholder.
- **Filtering works on the DOM.** A small client island toggles `hidden` using `data-*` attributes, so no data is duplicated into the RSC payload. Without JS, every row simply shows.
- **Detail page:**
  - **Header:** a breadcrumb, then a header with a category color band, the H1, a playful "commit id" (the UUID prefix) and the weekday date.
  - **Metadata:** a `<dl>` with date, time (KST), location, generation, part and type.
  - **Media:** the restyled gallery (`images-slider-controller`, keyboard support and counts), or a generated poster for sessions that only have the placeholder image (category color, halftone chevrons, title, date).
  - **Body and aside:** prose content, plus an aside with related sessions and chronological previous/next links using directional transitions.
- **Metadata and JSON-LD:**
  - Contextual titles, e.g. "25-26 Sixth T19 · Tech talk · Nov 4, 2025".
  - A **fixed** `Event`: `EventScheduled` replaces the invalid `EventCompleted`, and it adds a `Place` with Yonsei's address, an organizer with a URL, an image and `isAccessibleForFree`. Plus a `BreadcrumbList`.
  - Hub and generation pages get `CollectionPage`, `ItemList` and `BreadcrumbList`.

### Projects
- **Hub:**
  - A breadcrumb, the H1 and counts.
  - Filters for search, Generation, Tech stack (tags), Live demo and Open source.
  - **Release cards:**
    - a 16:10 cover with `next/image` and correct `sizes`
    - the title, a one-line summary, tech chips, a stack of contributor initials and a generation badge
    - Repo and demo are separate links. The card uses the stretched-link pattern, so anchors are never nested.
  - On wide screens the first card is featured.
- **Case study:**
  - A breadcrumb, the title, a lead paragraph, badges, and **Live demo ↗** / **Source ↗** buttons.
  - The cover image.
  - Two columns: prose on the left, and a sticky sidebar on the right with Team (linking to that generation's members page), Stack, Links and Published/Updated dates.
  - A gallery, "More from 25-26", and a next-project link.
- **JSON-LD:** `CreativeWork`, plus `SoftwareSourceCode` with `codeRepository` when a repo URL exists. `keywords` come from the tags, creators are `Person` entries, and there's a `BreadcrumbList`.

### Other pages
- **Members:** a generation switcher, part sections using the part colors, refined cards and social links.
- **Calendar:** a page header and a framed iframe.
- **Privacy / Terms:** the shared prose styles.
- **404:** the `< 404 >` chevrons plus useful links. Both `app/not-found.tsx` and the inline 404 HTML in `proxy.ts` get matching colors.
- **Error boundary:** restyled.

---

## 4. SEO and semantics (all pages)
- **Semantics:** one H1 per page, landmarks, and a skip link. Breadcrumbs use `<nav aria-label="Breadcrumb"><ol>`. Use `<time datetime>`, `<dl>` for metadata, and `<figure>`/`<figcaption>`. Alt text comes from titles, and mixed-language snippets carry a `lang` attribute.
- **Metadata:** reuse `createLocalizedMetadata` in `lib/seo/metadata.ts` (canonical, hreflang, x-default). Add a `noindex` option for empty generation pages.
- **Sitemap** (`lib/server/queries/public/sitemap.ts`):
  - drop empty generation pages
  - give hubs a `lastModified` taken from their newest item
  - list `images` for covers that aren't placeholders
- **Internal links:** the home page links to the latest sessions and projects. Detail pages link to related items, previous/next, their generation and the members page. Breadcrumbs appear everywhere.
- **Other:** refresh `app/llms.txt/route.ts`.
- **Social cards:** restyle `lib/seo/social-image.tsx` to the new identity (stage, halftone chevrons, palette; Pretendard stays for Korean). *Optional:* generated OG images for the home page and hubs.

---

## 5. Technical architecture

### Files
- **Styles:** `app/site-theme.css` holds tokens, the dark scheme, motion utilities and view-transition CSS. `app/globals.css` imports it, and the shooting-star and legacy home CSS are removed. Any new root-level public asset must be added to `UNLOCALIZED_PUBLIC_PATHS` in `proxy.ts`.
- **Layout:** `app/(home)/[lang]/layout.tsx` adds the fonts, `html.site`, the skip link, the new header and footer.
- **Landing sections:** `app/(home)/[lang]/_components/home/*`:
  - `hero`, `bracket-poster` (server SVG), `bracket-stage` (client WebGL)
  - `manifesto`, `programs`, `sc-funnel`, `parts`
  - `latest-log`, `featured-releases`, `join`
- **Shared primitives:** `app/components/site/*`:
  - `container`, `section-tag`, `chip`, `button-link`, `breadcrumbs`, `page-header`, `prose`
  - `empty-state`, `generation-strip`, `brackets-mark`, `seoul-clock`, `session-poster`
  - `session-log/` (a server list, the row, and the filter island)
  - `project-grid/` (cards and filter island)
  - `command-palette/` (optional)
- **Header and footer:** `app/components/header/*` and `app/components/footer.tsx` are rewritten in place, keeping their exports and accessibility contracts.
- **Pure, client-safe helpers** in `lib/site/*`, all unit-tested:
  - `bracket-geometry.ts`: the 4 capsules, derived from the logo paths and shared by the SVG and the shader.
  - `labels.ts`: EN/KO labels and color maps.
  - `session-log.ts`: grouping, facets, search text, previous/next, related.
  - `project-showcase.ts`.
  - `datetime.ts`: one formatter.
    - **Check first:** confirm that the known 25-26 Sixth T19 renders 19:00 before switching to `timeZone: 'Asia/Seoul'`.
    - Then pin the chosen behavior in a test.
  - `json-ld.ts`: pure builders; callers pass absolute URLs.
  - `isPlaceholderImage()`: reuses the default paths list from `lib/seo/social-image-data.ts`.
- **Copy:** `lib/contents/site-copy.ts` holds new EN/KO strings; the existing `about-section`, `activity-section` and `parts-section` content is reused.
- **Queries:**
  - **Sessions** (`lib/server/queries/public/sessions.ts`):
    - Add `getSessionArchive(visibilityBucket)`: every public session with its generation and part names, stored as one `use cache: remote` entry tagged `session:list:*`. Generation lists are derived from it.
    - Extend `getSessionById` with the part name and type.
  - **Projects** (`lib/server/queries/public/projects.ts`):
    - Add `getProjectShowcase()`: generation, tags, repo/demo URLs and contributors.
    - Extend `getProjectById` with tags, repo/demo URLs and contributors' GitHub handles and avatars.
  - **Cache tags stay read-your-own-writes.** Because generation pages now derive from the archive and showcase entries, those two cached functions call `cacheTag` *after* the query. They attach the list tag, `session|project:generation:<name>:*` for every generation in the result, and `generation:list:*`. That way the immediate `updateTag` calls in `lib/server/cache/invalidation.ts` still hit them.
  - Home data regions also attach `homeTag`.
- **Removed once their consumers are migrated** (grep before deleting):
  - the old home sections: `welcome-page`, `about-page`, `activities-*`, `activity-card`, `parts-page`, `part-card`, `home-page-background`
  - `generation-index-page`, `stage-button-group`, `generation-button-group`, `page-title`, `navigation-button`
  - `types/modal.d.ts`
  - Admin uses its own `AdminNavigationButton`, which is not affected.

### Client islands and JS budget (target: no more than 15 KB added to any route)
| Island | Where | Est. size |
|---|---|---|
| Header nav (rewritten) | all pages | ~2.5 KB |
| Bracket stage: loader + WebGL2 module (loaded with idle `import()`) | home | ~1 + ~5 KB |
| KST clock | footer | <1 KB |
| Log/grid filter (shared core) | hubs | ~3 KB |
| Gallery controller | detail pages | existing |
| ⌘K palette (optional) | all pages | ~1 KB, plus ~5 KB only when opened |

- **Rendering pattern:** the static shells (headers, hero, static sections) prerender. DB-driven regions sit behind Suspense with fallbacks of matching size, as in the current session and project pages.

### WebGL hero (`bracket-stage.tsx` + `bracket-field-gl.ts`)
- **Shader inputs:** a full-screen-triangle fragment shader. Each halftone cell's dot radius is computed from:
  - signed-distance fields for the 4 logo capsules, passed as uniforms from `bracket-geometry.ts`
  - low-frequency noise that makes the field "breathe"
  - a pointer lens (touch devices get a slow automatic drift)
  - a scroll-progress uniform that moves the brackets apart
- **Colors:** core and bright brand colors inside the capsules, faint paper-colored dots outside.
- **Performance:**
  - DPR capped at 2 (1.5 on mobile), 30 fps on coarse pointers
  - paused by IntersectionObserver and `visibilitychange`
  - `KHR_parallel_shader_compile`, and context-loss recovery
- **Fallback:** the SVG poster stays visible when there's no WebGL2, under `prefers-reduced-motion`, or with `saveData`.
- **SVG poster** (`bracket-poster.tsx`): the same composition, built from an SVG `<pattern>` of dots clipped by the capsule paths, with CSS scroll-driven parting.

### Admin tag editing
- **Validation:** `lib/validations/project.ts` gets `tags: z.array(z.string().trim().min(1).max(32)).max(12)`, plus case-insensitive de-duplication.
- **Form data:** `lib/server/form-data/get-project-form-data.ts` parses a `tags` JSON field, the same way `participants` is parsed.
- **Input component:** new `app/components/admin/tags-input.tsx`, a client component styled with the admin design tokens.
  - A chip input: Enter or comma adds a tag, Backspace removes one, and existing tags are suggested.
  - It writes a hidden `tags` JSON field.
  - It's added to `projects/create/page.tsx` and `[projectId]/edit/page.tsx`, with labels in `lib/admin-i18n`.
- **Create and edit actions:**
  - Upsert tag names into `tags` (`onConflictDoNothing`, then select the ids).
  - Then `replaceRelationRows` from `lib/server/actions/admin.ts` for `projects_to_tags`.
  - `invalidateProjectPublicCache` already covers the affected tags.
- **Admin detail:** the project detail page shows the tags, and `lib/server/fetcher/admin/get-project.ts` now includes `projectsToTags.tag`.

---

## 6. Phases
Each phase ends with lint, types and tests passing. I'll commit checkpoints only if you ask; work continues on `new-landing-page`. Once you approve, I'll save this design as `docs/superpowers/specs/2026-09-23-inside-the-brackets-redesign-design.md`, expand it into a task-level plan, and execute phase by phase.

0. **Baseline.**
   - Run `pnpm lint`, `pnpm test:types` and `pnpm test`.
   - Run a production build and `pnpm perf:measure`, saving the baseline JSON to the scratchpad.
   - Build only against a local or disposable DB, because `pnpm build` runs migrations.
1. **Foundations.** Tokens, fonts, base styles, motion and view-transition CSS, primitives, labels and copy, and the `lib/site` helpers with unit tests.
2. **The signature hero first, to de-risk it.** Build the geometry, the poster and the WebGL stage. Then measure JS, LCP, CLS and TBT on `/en` and `/ko` against the baseline before going further.
3. **Global chrome.** Header, mobile menu, footer, path-preserving language switch, 404 and error pages.
4. **Data and SEO helpers.** Archive and showcase queries, detail extensions, JSON-LD builders, `datetime`, and the sitemap changes, with fetcher tests.
5. **Admin tags.** Validation, form data, the input component, actions, the detail page, and tests.
6. **Sessions.** Hub, generation page and detail page; the poster fallback; metadata; `noindex` on empty pages; transitions.
7. **Projects.** Hub, generation page and detail page; metadata; transitions.
8. **Landing sections 2–7.**
9. **Restyles.** Members, calendar and policy pages, and the social-image template.
10. **Optional: ⌘K search.** A cached bilingual index route under `/api` (already `noindex` and disallowed in robots) plus a palette that loads on demand.
11. **Verification and polish** (§7).

---

## 7. Verification
- **Automated checks:** `pnpm lint --max-warnings=0`, `pnpm test:types`, `pnpm test`.
- **New unit tests** for:
  - `lib/site/*`
  - tag validation, form data and actions
  - the header menu
  - session-log grouping and the filter island
  - project cards and filters
  - the hero fallback when WebGL is missing (jsdom has no WebGL)
- **End-to-end:** `pnpm test:e2e:prod` on a disposable DB.
  - **Remove** the carousel test in `tests/e2e/public-flows.spec.ts`.
  - **Update** the headings and test ids in `tests/e2e/instant-navigation.spec.ts` and `tests/e2e/public-route-matrix.spec.ts`.
  - **Keep** the 404 matrix.
  - **Add** checks for hub filters and detail breadcrumbs.
- **Performance:** `pnpm build && pnpm start`, then `pnpm perf:measure` and `pnpm perf:budget <after.json> <baseline.json>`, plus `pnpm perf:instant`.
- **Browser QA** with the chrome-devtools and Playwright MCP tools:
  - widths 360, 768, 1280 and 1920, in both light and dark schemes
  - reduced motion and the no-WebGL fallback
  - a keyboard-only pass
  - Lighthouse for performance, accessibility, SEO and best practices
  - paint flashing while scrolling the hero
  - view transitions in Chromium and WebKit
- **SEO checks:**
  - JSON-LD through the Schema.org validator and Google's Rich Results Test
  - `sitemap.xml`, canonical and hreflang tags
  - `noindex` on empty generation pages
  - `llms.txt`

## 8. Risks and mitigations
- **Little JS headroom.** Measure the hero in Phase 2, load the shader when idle, and load the palette only on demand.
- **Google Sans Flex file size.** Measure it, trim axes if needed, and rely on next/font's `adjustFontFallback` plus `swap`.
- **`next/font/google` downloads fonts at build time.** CI and nixpacks have network access. If that ever becomes a problem, commit the generated woff2 files and switch to `next/font/local`.
- **Stale generation pages.** Generation pages now read from the archive and showcase cache entries. The tags attached after each query (see §5) keep admin edits visible immediately.
- **Browsers without scroll-driven animations.** Everything sits behind `@supports`, and the fallbacks are complete static layouts.
- **Morphs need a prefetched destination.** Treat them as an enhancement. Directional slides and reveal transitions are the baseline.
- **Session time zone.** Verify it before changing any date formatting.
- **E2E contracts** (button names, headings, test ids). Update them deliberately, in the same phase that changes them.

## 9. Out of scope
- Admin UI beyond tag editing
- The 2026 freshman OT deck and the email templates
- DB schema changes and URL changes
