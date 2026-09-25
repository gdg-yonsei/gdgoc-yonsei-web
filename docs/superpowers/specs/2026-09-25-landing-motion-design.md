- Date: 2026-09-25
- Status: built (plan mode approval; decisions: full anime.js engine on the landing, landing + global chrome, keep the Inside the Brackets identity). See "As built" for deviations.
- Branch: `landing-motion`
- Amends: `docs/superpowers/specs/2026-09-23-inside-the-brackets-redesign-design.md` (animation library allowed on the landing only)

# Landing motion overhaul (anime.js) + Solution Challenge stacking fix

## Context

Two asks:

1. Make the site feel anime.js-grade: sophisticated animation, transitions, scroll-driven and interactive motion that makes visitors say "wow" on arrival, while staying polished and cohesive.
2. Fix the Programs stack: the Solution Challenge (SC) card scrolls away instead of stacking like the other five cards.

Decisions (from Q&A):

- **Full anime.js v4 engine.** Use onScroll, timelines, draggable, SVG and text. We accept a higher JS budget on the home route only.
- **Scope:** landing page plus site-wide chrome.
- **Identity:** keep "Inside the Brackets" (GDG chevrons, halftone, GDG palette, Google Sans Flex).

Kept from `docs/superpowers/specs/2026-09-23-inside-the-brackets-redesign-design.md`:

- LCP text never waits on JS.
- Everything stays readable without JS or scroll timelines.
- Reduced motion = static.
- EN/KO parity.
- CLS ≤ 0.05.
- Every non-home route keeps its JS budget.

The spec's "no animation library on public routes" rule is amended **for the landing only**.

## As built (2026-09-25)

The build follows the design below except where noted here. Each change was made when a test, a frame capture or a trace showed the design would not hold. `docs/performance/nextjs-16.3-performance.md` ("Landing motion") has the measurements.

- **Manifesto cursor.** A single `< >` band sits behind the lit word and cycles through the GDG tints. It replaces the pair of mini chevrons. The statement's word gap is 0.19em and the section clips paint, so chevrons beside a word overlapped its neighbours and got cut off.
- **Pillar hover.** The existing CSS hover effects stay (circles part, caret blinks, bars grow). The scene adds the entrance assembly and the tech chevron → `{ }` morph, so two engines never animate the same property.
- **Parts glyphs.** Shapes pop in on a spring; edge and curve line drawing was dropped. Redrawing 40 paths per frame made the heaviest scroll frames on the page.
- **Funnel bands.** They open through an `--open` variable in their clip-path, because `scaleX` squashed the band text.
- **Entrances.**
  - Scenes ask `belowFold(element)` per block instead of reading one section-level flag. The manifesto's top peeks into view at load, which disabled entrances far below the fold.
  - One-off entrances use `motion/arrival.ts`. Its leave line is out of reach, so jumping straight past a block still plays it. The observer unregisters once it has fired.
- **Scroll-synced timelines.** They are driven through `motion/scrub.ts`. After every resize, anime.js re-measures each observer by seeking what it drives back to the start and forth again. Driving a plain stand-in object instead means re-measuring never re-renders a scene. The Programs observers measure the non-sticky stack (with each card's in-flow offset), never a sticky card.
- **Timelines** are created with `motion/timeline.ts` `sceneTimeline()` (`composition: false`). No two children of a scene's timeline share a property of the same element.
- **Pointer effects.** The Parts spotlight, the release tilt and the Join draggables are created the first time a pointer enters their element, not when the scene arms.
- **Programs shade and Log lane.** Each is an element of its own (`.program-shade` opacity, `.log-lane` `scaleY`). The design animated inherited variables (`--shade`, `--lane`), which restyled the whole card or every row on every frame. The Session Log hub keeps its static lane.
- **Join field.** One canvas (`motion/dot-field.ts`). anime.js's grid stagger gives each dot its turn, and every frame of a wave draws each dot from its turn. As 220 CSS-animated elements, the dots restyled and re-layered on every frame of a wave.
- **Arming.** A section arms in an idle callback (≤300ms) once it is within a screen of the viewport. Arming sets its `content-visibility` to `visible` so the scene can measure it. anime.js's own body `ResizeObserver` keeps the scroll lines current, so rule 7's `<main>` observer was not needed.
- **Budget.** `/en` and `/ko` are capped at 200 KB of JS, with a 37,000 B allowance over the 5% rule. They measure 195.9 KB.
- **Chrome.** The optional halftone page-transition dissolve was not built.

---

## Part A — Solution Challenge stacking (first, independent)

**Root cause (confirmed in code and history)**

- `app/(home)/[lang]/_components/home/programs.tsx:16` flags SC `long: true`, which renders as `data-long`.
- `app/styles/site-home.css:448-451` then forces `.program-card[data-long] { position: relative; top: auto }`.
- Commit `ac96bc6` added this on purpose, because of height:
  - With body and 4-band funnel, the SC card is ~628 px tall at 1366×768.
  - Its sticky slot starts at 176 px (`--site-header-offset` 5.5rem + 1rem + 3 × 1.5rem).
  - A sticky card taller than `viewport − slot` can never show its bottom. It sits below the fold while stuck, then the next card covers it.
  - So the workaround traded stacking for readability. The e2e "every program card can be read in full" guards that readability.
- Secondary cause: with unequal heights, any card taller than the last one gets pushed off the stack early when the stack ends.

**Fix: every card fits its slot, all cards stick**

1. **Remove the exemption.** Drop `long` / `data-long` from `programs.tsx` and the `[data-long]` CSS rule.
2. **Compact SC layout.**
   - Add `.program-stack { container-type: inline-size }`.
   - Under `@container (min-width: 42rem)`, `.program-inner:has(> .sc-funnel)` becomes two columns: kicker/title/body on the left, the funnel on the right (`minmax(0,1fr) minmax(15rem,20rem)`).
   - Funnel bands put the value above the label and still narrow by `--step`.
   - Target: SC ≤ 26rem tall at viewports ≥ 64rem wide, in EN and KO.
3. **Uniform sheets in stack mode.**
   - Add `grid-auto-rows: 1fr` and `.program-inner { height: 100% }`, so every card is as tall as the tallest.
   - The stack then forms and releases in order, and SC behaves exactly like the rest.
   - Shorter cards' spare space holds a large `aria-hidden` index numeral ("01"–"06", outlined in the card's hue), which is animated later.
4. **Fit guard.**
   - `program-stack-fit.tsx` is a tiny client leaf, independent of the motion chunk.
   - A `ResizeObserver` writes `--card-h` on each card.
   - CSS becomes `top: min(<slot>, calc(100svh - var(--card-h, 0px) - 1rem))`.
   - On normal viewports this changes nothing. For odd window sizes or a large default font, a card sticks just high enough to keep its bottom on screen instead of hiding it.
   - Without JS, it falls back to today's slots.

**Tests first (red on current `main`)**

- e2e `tests/e2e/home.spec.ts`, new test "every program card sticks, Solution Challenge included":
  - Viewports: 1366×768, 1366×657 (a real 1366×768 laptop), 1440×789, 1024×700 and 768×1024, plus KO at 1366×657.
  - All six cards compute `position: sticky`.
  - When the last card reaches its slot, every card's top equals its own computed slot (±1 px).
  - Wait for positions to settle between scroll steps.
- Extend "every program card can be read in full" to the same viewports.
- Unit `tests/components/programs.test.tsx`: no `data-long`; numerals are `aria-hidden`. New `tests/components/program-stack-fit.test.tsx` (mocked `ResizeObserver` writes `--card-h`).

---

## Part B — Motion system (landing only)

**Dependency and budget**

- Add `animejs@4.5.0` (MIT, ESM; `sideEffects` covers adapters only, so it tree-shakes).
  - Measured sizes: full library 41 KB gz; animate + stagger + onScroll + timeline 20 KB gz.
- It loads only through one dynamic `import()` from a home-page client leaf. This follows the `bracket-stage.tsx` pattern and the Next 16.3 lazy-loading guide.
  - Result: its own async chunk, with nothing added to shared or layout chunks.
- `scripts/check-performance-budget.mjs`:
  - `/en` and `/ko` get a JS cap of the measured total + ≤5 KB, with a hard ceiling of 215 KB.
  - An approved-delta allowance covers the 5% regression rule, commented like the Pretendard exemption ("anime.js engine on the landing, approved 2026-09-25").
  - Every other route keeps 170 KB and the 5% rule.

**Runtime shape**

- `…/home/home-motion.tsx` is a client leaf rendered once by `app/(home)/[lang]/page.tsx`.
  - It returns early on `prefers-reduced-motion` or Save-Data, so nothing is downloaded.
  - Otherwise: `requestIdleCallback(…, { timeout: 2500 })` → `import('./motion/scenes')` → `mountHomeScenes()`.
  - A failed chunk leaves the static page untouched.
  - It sets `data-home-motion="ready"` on `<html>` for tests.
- `…/home/motion/scenes.ts` holds the registry of `[data-scene="…"]` sections.
  - One IntersectionObserver (rootMargin one viewport below the fold) arms each section lazily.
  - Each section gets its own `createScope({ root: section, mediaQueries: MQ })`, so it can be reverted on its own.
- `MQ = { motion: '(prefers-reduced-motion: no-preference)', fine: '(hover: hover) and (pointer: fine)', stack: '(min-width: 768px) and (min-height: 40rem)', wide: '(min-width: 1024px)' }`.
  - anime.js rebuilds a scope whenever one of these flips, so turning on reduced motion mid-visit reverts to static.
- `…/home/motion/scenes/{hero,manifesto,programs,parts,log,releases,join}.ts`: one file per section, each `(scope) => cleanup`.

**Scene rules**

1. **Progressive enhancement.** Server HTML is complete and visible, and anime.js only adds to it.
   - Entrance "from" states go only on elements still off-screen when a scene arms.
   - A section already in view skips its entrance and uses smoothed sync (`sync: 0.x`), so nothing jumps.
2. **Handoff.** An armed section gets `data-motion="js"`. Under it, CSS turns off the matching baseline animation (`.reveal`, `.manifesto-word`, `.join-bracket`, part-glyph hover keyframes). The scene's cleanup removes the attribute.
3. **Cleanup always works.** Create every instance synchronously inside a scope constructor or a scope method (`self.add('name', fn)`).
   - Event callbacks only play, seek or call methods.
   - So `scope.revert()` always restores the DOM on unmount, when `<Activity>` hides the page, or when a media query changes.
   - Decorative nodes a scene creates are `aria-hidden` and removed in its cleanup.
4. **Cheap properties only.** Animate transform, opacity, SVG attributes and CSS custom properties, never layout properties.
   - CSS entrance keyframes switch to the individual `translate`/`scale` properties, so they compose with anime.js `transform` instead of fighting it.
5. **Text.**
   - Words are split on the server, as `.manifesto-word` already is.
   - `splitText` is used only for line reveals on off-screen blocks (`accessible: true`, re-split via `addEffect`), so there's no CLS and no LCP change.
   - The hero H1 is never split per character. That keeps its kerning and its first paint.
6. **Pointer tiers.**
   - Fine pointers get magnetic, tilt, spotlight and drag effects.
   - Touch gets triggered (not scrubbed) entrances and tap ripples.
   - Nothing is draggable on touch, so scrolling is never hijacked.
7. **Keeping scroll positions accurate.** One debounced `ResizeObserver` on `<main>` refreshes the onScroll observers after late layout changes: streamed Suspense content, and `content-visibility` sections rendering.
8. **Loops and counters.**
   - Loops pause off-screen and in hidden tabs. No autonomous loop runs longer than 5 s.
   - Count-ups use a temporary `aria-hidden` overlay; the real number in the DOM never changes.

**One motion language.**

- `lib/motion/springs.ts` names the springs the scenes use (`spring(SPRINGS.snap)`).
- The CSS tokens `--ease-spring`, `--ease-spring-snap` and `--ease-spring-soft` in `site-theme.css` are those springs converted to `linear()` strings with `waapi.convertEase`.
- A parity unit test pins them, so CSS (chrome, fallbacks) and anime.js move identically.

---

## Part C — Landing scenes

| Section       | Choreography                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | anime.js                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Hero**      | **On load:** the CSS entrance stays (instant, no LCP cost).<br>**Scroll-out timeline:** "GDGoC" and "Yonsei" (wrapped as word spans on the server) part with the brackets, using the same `partingOffset()`. The eyebrow, tagline and CTAs drift up and fade in a stagger; the meta strip dissolves.<br>**Fine pointer:** magnetic CTAs.<br>**Scroll cue:** bounces 3× then rests.<br>**WebGL, in `bracket-field-gl.ts` (no anime.js):** click/tap shockwave rings through the halftone (`u_ripples[3]`), plus slight pointer parallax on the capsules. | createTimeline + onScroll(sync), createAnimatable, stagger                                      |
| **Manifesto** | **Signature effect:** a pair of mini GDG chevrons travels word to word through the statement, enclosing the word being lit as you scroll. Lit words stay lit.<br>**Lede and aside:** line-by-line clip reveals.<br>**Pillars:** cards stagger in and glyphs assemble (circles spring in, `< >` strokes draw, bars grow).<br>**Pillars on hover/focus:** community circles orbit, tech chevrons morph into `{ }`, growth bars re-grow.                                                                                                                   | onScroll(progress), createAnimatable, splitText(lines), svg.createDrawable, svg.morphTo, spring |
| **Programs**  | **Stack mode:** each card lands like a sticker as it reaches its slot (rotation settles, the hard shadow grows). Covered cards recede (scale → 0.94, shade up) as the next one slides over. The index numeral flips in.<br>**SC funnel timeline (plays when SC sticks):** bands open from the centre in sequence, values count up (2,100 → 6 → 3 → 1), and a halftone-dot burst marks "Top 10".<br>**List mode:** staggered entrances plus the same funnel timeline.                                                                                    | onScroll(px thresholds from slots, sync), createTimeline, stagger, utils.random, spring         |
| **Parts**     | **Entrance:** a grid ripple from the centre (`stagger(…, { grid: [rows, cols], from: 'center' })`, with rows and cols per breakpoint).<br>**Glyphs:** assemble on enter. Richer hover/focus timelines: graph edges draw and nodes pulse, the curve draws with a dot riding it, rings ripple while hovered.<br>**Fine pointer:** spotlight in the part's hue.                                                                                                                                                                                            | stagger(grid), svg.createDrawable, svg.createMotionPath, createAnimatable                       |
| **Log**       | **Lane:** the commit lane draws down with scroll. Commit nodes pop in (spring) as the lane reaches them, and rows slide in.<br>**HEAD marker:** a small blue capsule rides the lane.<br>**Streaming:** waits for the streamed rows.<br>**Hub safety:** `--lane` defaults to 1, so the Session Log hub is unchanged.                                                                                                                                                                                                                                     | createTimeline + onScroll(sync), CSS-var tween, spring                                          |
| **Releases**  | **Featured cover:** "prints in" as growing halftone dots (mask `--dot-r` 0 → full, then the mask is removed).<br>**Cards:** rise, then chips pop in sequence.<br>**Fine pointer:** ≤4° tilt with cover parallax. The tilt resets on pointerdown, so the shared cover view transition starts flat.                                                                                                                                                                                                                                                       | createTimeline, stagger, createAnimatable                                                       |
| **Join**      | **Scroll-synced close:** the brackets fly in from the edges, overshoot on a spring and clamp around the title; the title words pop.<br>**Dot field:** a GDG-coloured halftone field behind the CTA waves out from the centre when the brackets close, and ripples from any click or tap (animejs.com's grid-stagger demo).<br>**Fine pointer:** the brackets become draggable and spring back on release.                                                                                                                                               | createTimeline + onScroll, stagger(grid, from index), createDraggable + spring                  |

**Where each animejs.com "toolbox" feature shows up**

- Timeline: hero, funnel, join
- Scroll Observer: every scene
- Advanced staggering: parts, join
- SVG toolset: pillars, parts
- Springs & draggable: join
- Responsive animations: scope `mediaQueries`
- Text splitting: manifesto

---

## Part D — Global chrome (CSS + View Transitions only, zero JS on other routes)

- **Nav links:** hover or focus wraps the label in code-style `<` `>` that slide in on the shared spring. The current-page pill pops in via `@starting-style` after each navigation.
- **Header capsule:** a 2 px four-colour GDG progress line along its bottom edge (`animation-timeline: scroll(root)`), off under reduced motion.
- **Mobile menu:** add an exit animation (`transition-behavior: allow-discrete` on the dialog and its overlay). Items keep the spring stagger.
- **Footer wordmark:** a GDG colour sweep across the letters on hover (`background-clip: text`), alongside the existing ROND morph.
- **Page transitions:**
  - The nav-forward/back slides adopt the shared spring.
  - Optional: a halftone-dot dissolve on the outgoing page, kept only if a 4× CPU trace shows no dropped frames.

---

## Critical files

**Modify**

- `app/(home)/[lang]/_components/home/`: `programs.tsx` (numerals), `hero.tsx` (word spans), `manifesto.tsx`, `parts.tsx`, `latest-log.tsx`, `featured-releases.tsx`, `join.tsx` (each gets `data-scene`), `pillar-glyph.tsx` (hidden `{ }` morph targets), `bracket-field-gl.ts`
- `app/(home)/[lang]/page.tsx`: render `<HomeMotion />`
- `app/styles/`: `site-home.css`, `site-hero.css`, `site-chrome.css`, `site-content.css`, `site-theme.css`
- `app/components/header/navigation.tsx` and `app/components/footer.tsx`: markup hooks only where CSS can't do it alone
- `scripts/check-performance-budget.mjs`, `package.json`, `pnpm-lock.yaml`
- `tests/e2e/home.spec.ts`, `tests/components/{programs,hero,manifesto,parts,join}.test.tsx`

**New**

- `…/home/home-motion.tsx`, `…/home/program-stack-fit.tsx`, `…/home/motion/scenes.ts` and `…/home/motion/scenes/*.ts`
- `lib/motion/{springs,gate,grid}.ts`
- `tests/lib/motion/*.test.ts`, `tests/components/{home-motion,program-stack-fit}.test.tsx`, `tests/e2e/home-motion.spec.ts`
- `docs/superpowers/specs/2026-09-25-landing-motion-design.md` (this design)

**Reuse**

- `partingOffset`, `scrollProgress`, `bracketCapsulesInViewBox` and `capsulePath` from `lib/site/bracket-geometry.ts`
- `CAPSULE_HEX` from `lib/site/brand.ts`
- `BracketPoster`
- The idle-import and failure-handling pattern (and its tests) from `bracket-stage.tsx`

---

## Order of work

**0. Setup and baseline**

- Branch `landing-motion` off `main` and save this design as the spec.
- Read the Next 16.3 guides `lazy-loading.md`, `view-transitions.md` and `use-client.md`, per `AGENTS.md`.
- Start the disposable Postgres on :5439 (podman; needs the sandbox disabled).
- Record the baseline: `.superpowers/shared/dev-data.sh` → `serve-prod.sh --no-seed` → `PERF_OUTPUT=… pnpm perf:measure`.
- Never run `pnpm build`: it migrates the `.env` database.

**1. Part A, red → green.** Visual check at the listed viewports, in light and dark.

**2. Motion foundation.**

- Add the dependency, loader, scene registry, handoff CSS, springs and parity test, and the budget script.
- First spike the uncertain anime.js details in the browser: px thresholds, instances created inside scope methods, and the `splitText` re-split.
- Verify chunk isolation: every other route's JS stays within ±1% of baseline.

**3.** Hero, plus the WebGL ripple and parallax.

**4.** Manifesto and Programs.

**5.** Parts, Log and Releases.

**6.** Join.

**7.** Chrome.

**8. Full verification and docs.**

- Amend the Sept 23 spec's constraint list.
- Add a performance note.

Each step ends with `pnpm lint --max-warnings=0`, `pnpm test:types` and `pnpm test`. Commits only when you ask.

---

## Verification

**Unit**

- Springs parity, gate and grid-shape helpers.
- `HomeMotion` never loads under reduced motion or Save-Data, waits for idle otherwise, and survives a failed chunk.
- `ProgramStackFit` writes `--card-h`.

**E2E** (`.superpowers/shared/e2e-prod.sh`: production build, local DB)

- The stack tests from Part A.
- `home-motion.spec.ts`:
  - `data-home-motion="ready"` appears.
  - Two runs, one walking top → bottom and one jumping straight to the bottom. Both must leave every landing heading and paragraph at opacity 1 with no leftover offset (nothing stuck hidden).
  - Reduced motion: the motion chunk is never requested, and the stack stays static (existing test).
  - 320 px: no sideways scroll with motion armed.
  - CLS < 0.05 over a full scroll-through (PerformanceObserver).

**Perf**

- `pnpm perf:measure` after the change, then `pnpm perf:budget after.json baseline.json`.
- Home stays within the approved cap, every other route is unchanged, and LCP, CLS, TBT and INP stay within budget.

**Browser QA** (Playwright / chrome-devtools MCP)

- Viewport screenshots at several scroll depths. Not full-page: past about 8k px they repeat.
- Widths 390, 768, 1024, 1366×657, 1440 and 1920; light and dark; reduced motion; no WebGL.
- Keyboard-only pass: focus never lands on decorative or draggable elements, and hover effects are mirrored on focus.
- Performance trace of a scroll-through at 4× CPU: no long tasks from scenes, scroll work ≲ 4 ms per frame.
- Lighthouse accessibility score not below today's.

---

## Risks

- **Main-thread scroll work.** Coarse pointers get triggered entrances instead of scrubbed ones, and a performance trace gates each scene.
- **Uncertain anime.js details.** Spiked in the browser before any scene depends on them (step 2).
- **Uniform card heights make short cards taller.** The index numeral fills the space. If the tallest card ever outgrows the budget, the fit guard keeps it readable.
- **Local QA needs podman.** Postgres runs in podman, which needs the sandbox disabled.
