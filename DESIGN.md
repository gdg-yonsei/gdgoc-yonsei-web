# GDGoC Yonsei design direction

Reading this as: community pages for students and collaborators, using the chapter's GDG bracket identity, ENERGY 3 / RHYTHM 3 / MOTION 3 on the landing page.

The current direction comes from the approved [Inside the Brackets specification](docs/superpowers/specs/2026-09-23-inside-the-brackets-redesign-design.md) and [landing motion specification](docs/superpowers/specs/2026-09-25-landing-motion-design.md). This guide records the implemented system and its accessibility constraints. It does not assert that historical asset permissions or design approvals have been independently audited.

## Dials by page kind

| Page kind                                                    | ENERGY | RHYTHM | MOTION |
| ------------------------------------------------------------ | ------ | ------ | ------ |
| Public landing page                                          | 3      | 3      | 3      |
| Public archives, calendar, profiles, detail and policy pages | 2      | 2      | 2      |
| Admin workspace and authentication                           | 1      | 1      | 2      |

Each page keeps its dials across sections. The landing page's choreography expresses the opening brackets and the community's work. Archives favor scanning and reading. Admin pages prioritize predictable forms and clear state changes. Reduced motion removes spatial movement and repeated animation while keeping content and feedback available.

## Reasons for the visual system

- GDG brackets are the identity motif. Their use in headings, project cover fallbacks and the landing sequence connects the site's pages without copying another product.
- Public stage surfaces stay GDG black in both themes so the header, hero and footer retain the chapter identity. Reading surfaces follow the system theme with separately verified text colors.
- Blue, sky, red, pink, yellow and green form the existing GDG palette. Program categories and identity illustrations explain the extra hues; semantic text uses accessible ink variants rather than raw brand fills.
- Public display typography carries chapter identity. Google Sans and Pretendard keep English and Korean reading and admin controls consistent. Monospace labels distinguish dates, counts and technical metadata.
- Section spacing, mixed landing compositions and one main heading per page establish hierarchy. Archives use rows or content cards according to their data, rather than repeating a marketing grid.
- Pills group filters, generations and language choices. Admin inputs, buttons, cards and containers use the documented 4/8/12/16px radius scale to express function.
- Outline icons communicate actions. Directional arrows identify navigation or external destinations; status badges communicate actual categories, roles or outcomes.
- Bracket fields and program illustrations reference the chapter's existing identity and activities. No new people, logos, testimonials or assets are generated for compliance cleanup.
- Shadows identify elevation or the GDG sticker motif. Blur is limited to at most two simultaneously visible elements; mobile admin bottom navigation and destructive dialog backdrops are solid or translucent without blur.
- Admin blue marks primary actions and focus. Destructive actions use separate danger and on-danger colors in each theme, so the dark theme never relies on white text over pale coral.

## Accessibility and content requirements

- Normal text, instructions, placeholders and small control labels require at least 4.5:1 contrast. Large text requires 3:1; visible input borders require 3:1 against adjoining surfaces.
- Interactive hit areas are at least 44px in both dimensions. Checkbox labels provide the hit area around smaller native checkmarks; compact classes cannot override the admin control floor.
- Every control retains visible keyboard focus. Dialogs support Escape, trap focus and return focus to their trigger. Navigation and filters have real destinations and behavior.
- Loading has a localized status announcement; decorative spinners and skeleton content are hidden from assistive technology. Errors offer a retry path, and empty views explain their state.
- Motion honors reduced-motion preferences, including JavaScript scrolling. Animation may enhance content but cannot be required to discover it.
- Public counts come from the database. Static historical results must have a recorded source in [content provenance](docs/content-provenance.md); unsupported totals or superlatives are removed.
- Missing and private admin values use distinct localized labels. Copy uses natural punctuation without U+2014. Comments explain necessary constraints in one line, or at most two meaningful lines.

## Verification

Use `pnpm test`, `pnpm test:types`, `pnpm lint` and browser checks against an isolated disposable database. Record actual routes, controls, themes, breakpoints and outcomes in the compliance report. Passing representative checks does not prove untested external OAuth providers, hardware authenticators or historical asset permissions.
