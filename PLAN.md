# GDGoC Yonsei Web — Repository-wide Code Quality Refactoring

Repository: `gdg-yonsei/gdgoc-yonsei-web`

## Objective

Refactor this codebase to substantially improve:

* maintainability
* readability
* discoverability
* consistency
* type safety
* testability
* separation of concerns
* ease of understanding for future contributors

This is primarily a **behavior-preserving structural refactor**, not a redesign, feature project, or dependency-upgrade project.

The desired outcome is that another developer can quickly answer:

1. Where should a new piece of code live?
2. Where is a public/admin read implemented?
3. Where is a business mutation implemented?
4. Where is untrusted input validated?
5. Where is authorization performed?
6. Where are cache invalidations defined?
7. What may run on the client versus only on the server?
8. How can a business rule be tested without rendering a Next.js route?

Do not optimize for the smallest number of files or the highest number of abstractions. Optimize for **clear responsibilities and predictable code placement**.

---

# Non-negotiable constraints

## Preserve behavior

Unless an existing behavior is clearly a bug and is covered by evidence/tests, preserve:

* user-visible UI behavior
* URLs and route structure
* public API behavior
* authentication behavior
* authorization behavior
* database schema
* database semantics
* cache semantics
* public page freshness
* admin read-your-own-writes behavior
* i18n behavior
* accessibility behavior
* existing E2E contracts

Do not introduce unrelated product/design changes.

## Do not perform dependency upgrades

Do not upgrade Next.js, React, Better Auth, Drizzle, Zod, Tailwind, Jotai, Playwright, Vitest, TypeScript, or other dependencies as part of this refactor unless an upgrade is strictly necessary to fix an identified issue.

Keep dependency upgrades separate from structural refactoring.

## Protect existing work

Before modifying anything:

```bash
git status --short
git branch --show-current
```

Inspect existing changes.

Never:

* reset user changes
* discard user changes
* overwrite unrelated modifications
* run `git reset --hard`
* run destructive checkout commands
* force push
* commit
* push

unless explicitly requested.

Work with the current working tree.

---

# Important repository context

The current project uses approximately:

* Next.js 16 App Router
* React 19
* TypeScript 5.9
* Better Auth
* Drizzle ORM
* PostgreSQL
* Zod 4
* Tailwind CSS 4
* Jotai
* Motion
* Redis-backed Next.js caching
* Cloudflare R2
* Vitest
* Testing Library
* Playwright

The existing codebase already has meaningful architecture and tests. Do not replace working architecture merely to apply a fashionable pattern.

---

# First: understand the repository before editing

Read at minimum:

```text
package.json
tsconfig.json
eslint.config.mjs
next.config.ts
auth.ts
db/index.ts

docs/architecture/caching.md

lib/server/cache/**
lib/server/permission/**
lib/server/actions/**
lib/server/queries/**
lib/server/fetcher/**
lib/validations/**

app/(admin)/**
app/(home)/**
app/api/**

tests/lib/**
tests/components/**
tests/e2e/**
vitest.config.ts
playwright.config.ts
```

Also inspect:

* all Server Actions
* all Route Handlers
* all `db.insert`, `db.update`, `db.delete`, and `db.execute` usage
* all raw SQL usage
* all `requirePermission` and `handlePermission` usage
* all cache invalidation calls
* all `use client` directives
* all `use server` directives
* all Jotai atoms
* all usages of `as unknown as`
* all FormData parsing code
* multi-step DB mutations

Use repository search instead of assuming locations.

Before moving a module, inspect all references to it.

---

# Phase 0 — Establish the behavioral baseline

Before structural changes, determine whether the current repository passes:

```bash
pnpm lint
pnpm test:types
pnpm test
```

Run relevant Playwright tests where the required local/test environment is available.

Important:

The current `pnpm build` command performs Drizzle migration before `next build`.

Therefore:

**Do not run `pnpm build` against an unknown, shared, staging, or production database.**

First inspect the environment and build script.

Only run migration-affecting commands when the target is clearly an isolated development/test database.

Record any failures that existed before the refactor so they are not confused with regressions.

For complex behavior that is poorly isolated, add characterization tests before changing implementation.

---

# Architecture principles

Use the following dependency direction as the default:

```text
app
 ↓
lib/server
 ↓
db
```

Shared pure utilities may be consumed where appropriate.

The following dependency directions should not occur:

```text
lib/server → app
db         → app
client     → db
client     → server-only modules
```

Respect and extend the existing ESLint architecture restrictions rather than bypassing them.

---

# Next.js code placement policy

Do not move everything out of `app`.

Route colocation is desirable.

Use this rule:

## Route-specific UI

Keep code used only by one route under that route, such as:

```text
_components/
_lib/
```

## Shared UI

Move genuinely reused UI to:

```text
app/components/
```

## Public database reads

Use:

```text
lib/server/queries/public/
```

Preserve the existing public caching architecture.

## Admin database reads

Standardize toward:

```text
lib/server/queries/admin/
```

The current `lib/server/fetcher/admin` modules should be evaluated and incrementally migrated to `queries/admin` when they are actually DB/read-model queries.

Do not perform a huge mechanical rename unrelated to other changes.

## Business mutations

Move reusable business/write logic toward:

```text
lib/server/mutations/
```

or an equally clear domain-oriented location if repository evidence suggests a better existing convention.

## External input validation

Keep schemas in:

```text
lib/validations/
```

or colocate a schema with a domain module when it is domain-private.

## Storage

R2/S3-specific operations should live in a storage-oriented server module, not a generic admin helper bucket.

---

# Preserve the existing caching architecture

Treat:

```text
docs/architecture/caching.md
```

as an architecture contract.

Do not redesign caching.

Preserve these invariants:

* public read models use the existing cache strategy
* admin reads remain uncached where currently required
* request-specific APIs are not pulled inside cached functions when runtime values can be passed as arguments
* public cache tag construction remains centralized
* mutation invalidation remains centralized
* direct mutations maintain read-your-own-writes behavior
* Redis/shared-cache support remains intact

After modifying any mutation touching public data, verify its cache invalidation behavior.

Do not replace explicit cache rules with implicit behavior.

---

# Server Action policy

Treat every exported Server Action as an untrusted HTTP boundary.

A Server Action should ideally perform only:

```text
untrusted input
    ↓
validation / canonical parsing
    ↓
authentication + authorization
    ↓
domain mutation
    ↓
cache invalidation if needed
    ↓
typed result or redirect
```

Do not put large business rules directly inside route actions when they can be represented and tested independently.

A Server Action should be understandable as orchestration at a glance.

Do not enforce an arbitrary line-count rule.

Judge by responsibility, not lines.

---

# Standardize ActionResult

The repository already contains an `ActionResult<T>` concept.

Audit all Server Actions and eliminate unnecessary competing result shapes where doing so does not break React form APIs.

Establish one consistent error/result model.

Prefer a discriminated structure such as:

```ts
type ActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR'

type ActionResult<T = void> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      code: ActionErrorCode
      message: string
      fieldErrors?: Record<string, string[]>
    }
```

Adapt this shape if existing form APIs require a slightly different contract.

The important properties are:

* success/failure is discriminated
* field validation errors are structured
* expected domain errors are distinguishable
* unexpected implementation exceptions are not exposed to clients

Unexpected errors should be logged internally and mapped to stable public messages.

Do not return raw PostgreSQL, Drizzle, Better Auth, R2, network, or stack error messages directly to clients.

---

# Improve shared action validation

Review:

```text
lib/server/actions/admin.ts
```

It currently mixes multiple responsibilities.

Split it by real responsibility rather than creating arbitrary small files.

Likely concerns include:

```text
actions/validation
actions/result/errors
relations
storage
authorization
```

Remove generic utility-bucket behavior.

Improve Zod error conversion so callers can receive structured `fieldErrors` when useful.

Avoid duplicating the same Zod issue-to-field-error conversion in individual actions.

---

# Canonical input boundary

After untrusted data passes validation, downstream mutation code should operate on canonical domain-compatible values.

Avoid patterns such as:

```text
Zod validates string
→ Server Action manually converts string
→ DB write
```

when the conversion can be safely represented in:

* Zod transforms, or
* a clearly named mapper between form input and mutation input.

Examples to audit include:

* entity IDs
* student IDs
* telephone values
* optional/nullable values
* dates/times
* enum values
* arrays from FormData
* image URLs/keys

Use:

```ts
z.input<typeof schema>
z.output<typeof schema>
```

or equivalent inferred types where useful.

Avoid hand-written duplicate interfaces when a schema or Drizzle table can safely infer the type.

---

# Parse route/entity IDs exactly once

Audit patterns such as:

```ts
Number(generationId)
```

inside database operations.

Introduce reusable primitive schemas only where there is genuine reuse, for example:

```ts
z.coerce.number().int().positive()
```

Parse external route/form values at the boundary.

Internal domain functions should receive the canonical ID type.

---

# Separate reads from writes

Maintain a clear distinction:

```text
queries = reads
mutations/services = writes/business operations
```

For public reads, preserve existing cache ownership.

For admin reads, standardize naming and location where useful.

Avoid introducing generic `repository` interfaces for every simple query.

Use repositories only when they create a useful boundary, such as:

* complex data access
* external systems
* independently testable orchestration
* multiple persistence backends
* significant transaction behavior

Do not create abstraction for abstraction's sake.

---

# Transaction audit

Search for all multi-step mutations, especially patterns like:

```text
delete relations
insert relations
```

or:

```text
update parent
update child
update join table
```

For each operation, explicitly determine:

1. Must all statements succeed or fail together?
2. Are all operations against the same PostgreSQL transaction boundary?
3. Are external systems involved?

If multiple PostgreSQL writes must be atomic, use an appropriate Drizzle transaction.

If R2, external services, or another non-transactional system is involved, do not pretend a database transaction can make the entire workflow atomic.

Instead define explicit:

* operation order
* idempotency
* retry strategy
* compensation semantics
* failure behavior

Preserve existing semantics unless tests/evidence establish a bug.

---

# Refactor booking as a dedicated domain

Give special attention to:

```text
lib/server/actions/booking/request-booking.ts
```

It currently combines many concerns including:

* FormData parsing
* validation
* datetime parsing
* Korea timezone policy
* booking lead-time policy
* duration policy
* interval policy
* authentication
* authorization
* raw SQL
* local mirror persistence
* logging
* revalidation
* public errors

First add or review characterization tests for all current booking rules.

Then separate it into coherent responsibilities.

A reasonable target may resemble:

```text
lib/server/booking/
├── schema.ts
├── policy.ts
├── repository.ts
├── mirror-repository.ts
├── service.ts
└── types.ts
```

or the corresponding structure under `lib/server/mutations/booking`.

## Policy

Make booking time/business rules pure when possible.

They should not need Next.js, React, auth, or the database.

Test:

* invalid datetime
* timezone interpretation
* minimum lead date
* end before start
* ten-minute boundaries
* minimum duration
* maximum duration
* past dates

## Persistence

Encapsulate raw SQL and determine its actual role.

Avoid unchecked constructs such as:

```ts
as unknown as SomeType
```

when the result can instead be:

* typed correctly by the database API
* validated at runtime
* mapped through a small type guard/schema

## Dual persistence

The existing flow appears to create one booking record and then persist a local `web_booking_requests` representation.

Determine from schema, migrations, tests, and surrounding code whether these operations are intended to be:

* atomic
* eventually consistent
* best-effort mirror persistence

Do not silently change the consistency model.

Document the resulting contract and test the failure case.

---

# Authorization policy

Preserve existing Better Auth configuration.

Prefer one canonical authorization entry point, such as the existing `requirePermission`, when appropriate.

Audit every Server Action and mutation-capable Route Handler.

Authorization must be checked at the server boundary.

Do not rely on:

* hidden UI buttons
* client-side role state
* middleware/proxy alone
* page layout access checks

to protect mutations.

If field-level permissions exist, such as permission to change a member role, preserve and make them explicit.

---

# React refactoring policy

React Server Components should remain the default where no client capabilities are needed.

Audit each `use client` boundary.

A client boundary should have a reason such as:

* state
* event handlers
* browser APIs
* effects
* a client-only dependency

Do not convert Server Components to Client Components for convenience.

Do not aggressively move all client code either; preserve appropriate interactive boundaries.

---

# Effects and memoization

Audit `useEffect`.

Effects should generally represent synchronization with an external system rather than derived render state or ordinary event handling.

Audit `useMemo` and `useCallback`.

Do not add memoization automatically.

For each memoization, determine whether:

* the computation is actually expensive, or
* stable referential identity is required.

Remove unnecessary memoization if doing so makes code easier to read without measurable negative consequences.

Do not wrap every callback in `useCallback`.

---

# Jotai audit

Review:

```text
lib/atoms.ts
```

Determine which atoms are truly global.

Prefer:

```text
local component state
→ feature-local state
→ global Jotai state
```

in that order.

Consider splitting unrelated global state into domain/feature modules.

Be particularly careful with global state that stores callbacks/functions, because it can hide control flow.

Do not remove Jotai merely to replace it with another state library.

No new state-management dependency should be introduced.

---

# Tailwind and styling

Preserve the existing `cn()` abstraction and custom Tailwind merge configuration unless there is a concrete defect.

Do not:

* introduce CVA merely for fashion
* replace the styling system
* rewrite semantic admin utilities
* perform unrelated visual redesign

Extract style/component abstractions only when there is real semantic reuse or repeated variation.

---

# Type safety cleanup

After the structural work is stable, audit:

```text
any
as unknown as
non-null assertions
unvalidated JSON
raw SQL result casts
unchecked indexed access
manual enum casts
```

Do not silence TypeScript with assertions merely to make checks pass.

Prefer:

```text
validation
narrowing
inference
discriminated unions
schema-derived types
```

over casts.

---

# Optional TypeScript hardening

Evaluate, but do not blindly enable:

```text
exactOptionalPropertyTypes
```

The repository's database client currently has explicit undefined/null behavior, so absent properties versus explicit undefined can be semantically important.

If enabling this compiler option:

1. first run a trial
2. inspect all resulting errors
3. fix semantically rather than mechanically
4. ensure DB partial updates retain their current meaning
5. keep the compiler option only if the result improves correctness

Do not mix dozens of unrelated typing changes into earlier behavior-preserving PR-sized batches.

---

# ESLint hardening

The existing ESLint setup is already strict.

After structural cleanup, evaluate type-aware rules such as:

```text
@typescript-eslint/no-floating-promises
@typescript-eslint/no-misused-promises
@typescript-eslint/await-thenable
@typescript-eslint/switch-exhaustiveness-check
@typescript-eslint/consistent-type-imports
```

Do not enable a large strict preset blindly.

First inspect the baseline and false-positive impact.

Only keep rules that expose real classes of mistakes and are maintainable for contributors.

---

# Testing strategy

Do not pursue 100% coverage as a goal by itself.

Prioritize behavioral risk.

## Pure unit tests

Use for:

* schemas
* parsing
* normalization
* booking policies
* cache tag builders
* deterministic permission/domain rules
* utility functions

## Domain/mutation tests

Test:

* success
* validation/domain failure
* authorization
* DB failure mapping
* cache invalidation
* partial/external failure semantics

## DB integration tests

Use where transactions and relational invariants need verification.

## Component tests

Focus on user behavior rather than implementation details.

## Playwright

Preserve and extend critical flows:

* auth
* admin authorization
* generation/member/project/session CRUD
* booking
* public cache invalidation
* public navigation
* locale behavior

Prefer accessible locators:

```text
getByRole
getByLabel
getByText
```

over CSS/XPath or internal component structure.

Do not rewrite stable E2E selectors unless necessary.

Before substantially restructuring legacy logic, ensure a characterization test captures its existing behavior.

---

# Documentation

Create or improve architecture documentation so future contributors do not have to reverse-engineer placement rules.

At minimum consider:

```text
docs/architecture/code-organization.md
docs/architecture/server-mutations.md
docs/architecture/testing.md
```

`code-organization.md` should contain a concise placement decision table:

```text
One-route UI                    → route/_components
One-route helper                → route/_lib
Shared UI                       → app/components
Cached public read              → lib/server/queries/public
Admin read                      → lib/server/queries/admin
Business write/domain mutation  → lib/server/mutations
Authorization                   → lib/server/permission
External input schema           → lib/validations or domain schema
Storage operation               → lib/server/storage
Truly global client state       → lib/state
```

Document architecture decisions that are not obvious from code.

Avoid excessive comments explaining obvious syntax.

Prefer meaningful names and module boundaries.

Comments should primarily explain **why**, not **what**.

---

# Build and migration separation

Inspect the current package script:

```text
build = drizzle generation/migration + next build
```

This means building has a database side effect.

Do not immediately change it if deployment currently depends on this behavior.

First determine how production is deployed.

If safe and appropriate, eventually separate:

```text
build
db:generate
db:migrate
```

so a build can be performed without mutating a database.

Migration should become an explicit deployment step.

Never run a migration against production as part of this refactor without explicit authorization.

---

# CI quality gate

Check whether a repository CI workflow already exists.

If none exists and adding one is consistent with the repository, consider a focused GitHub Actions quality workflow.

A reasonable quality gate is:

```text
install with frozen lockfile
↓
lint
↓
TypeScript typecheck
↓
Vitest
↓
safe build
↓
Playwright where test infrastructure is available
```

Do not make the CI depend on production secrets.

If build still performs DB migration, solve or explicitly isolate that issue before adding build to generic CI.

---

# Recommended implementation order

Perform changes in incremental, independently verifiable batches.

## Batch 1 — Baseline and architecture

* inspect repository
* establish test baseline
* document code placement/dependency rules
* add a composite non-destructive quality check if useful

No feature behavior changes.

## Batch 2 — Action infrastructure

* standardize ActionResult
* standardize expected error codes
* centralize field-error conversion
* cleanly split mixed responsibilities from `lib/server/actions/admin.ts`
* introduce canonical ID/input parsing where useful

Migrate a small domain first.

## Batch 3 — Generation and Part

Use simple CRUD to validate the target mutation architecture.

Make route actions thin.

Move business/persistence logic to appropriate server mutation modules.

Keep cache invalidation behavior identical.

## Batch 4 — Member

Refactor member mutation.

Move input normalization out of the action body.

Preserve field-level permission behavior.

Ensure student ID / telephone / optional values have canonical types before reaching persistence.

## Batch 5 — Project and Session

Refactor write orchestration.

Audit relation replacement.

Add transactions where atomicity is a real invariant.

Preserve R2 cleanup and cache invalidation semantics.

## Batch 6 — Booking

Add characterization coverage first.

Extract booking policy, persistence, orchestration, and action adapter.

Define and test dual-persistence consistency behavior.

Remove unsafe raw error exposure and unnecessary unchecked casts.

## Batch 7 — Client architecture

Audit:

* `use client`
* Jotai
* Effects
* memoization
* duplicated client helpers

Keep UI behavior unchanged.

## Batch 8 — Type/lint/CI/deployment hardening

Only after structural changes stabilize:

* type-aware lint rules
* optional `exactOptionalPropertyTypes`
* remaining unsafe cast cleanup
* CI
* build/migration separation if deployment semantics are understood

---

# Refactoring heuristics

Use these rules while editing.

## Extract when

Extract code when it:

* has a different reason to change
* represents a meaningful business rule
* is independently testable
* is reused
* isolates infrastructure
* significantly reduces cognitive load

## Do not extract when

Do not extract merely because:

* a function is longer than an arbitrary number of lines
* a JSX block looks large
* an abstraction name can be invented
* a helper is used only once and extraction makes control flow harder to follow

## Prefer names over comments

Prefer:

```ts
const canChangeMemberRole = ...
```

over:

```ts
// Check if user can change role
const allowed = ...
```

## Prefer early return for invalid state

Reduce nesting where it improves readability.

## Prefer explicit domain language

Use repository terms such as:

```text
generation
part
member
project
session
booking
```

instead of generic names such as:

```text
data
item
manager
helper
util
processor
```

when a domain-specific term exists.

---

# Explicit anti-goals

Do NOT:

* perform a giant folder rewrite
* introduce Clean Architecture layers mechanically
* create an interface for every repository/service
* add a dependency-injection framework
* change database schema for aesthetics
* redesign the admin/public UI
* upgrade dependencies
* rewrite the existing cache architecture
* replace Better Auth
* replace Drizzle
* replace Jotai
* replace Tailwind
* add memoization everywhere
* enforce arbitrary file/function size limits
* create generic `utils.ts` dumping grounds
* hide errors with unsafe casts
* delete tests because architecture changed
* change user-visible behavior to make refactoring easier
* change existing unrelated files merely for formatting consistency
* commit or push changes

---

# Verification after each meaningful batch

Run the narrowest relevant tests first, then the general quality suite.

At minimum:

```bash
pnpm lint
pnpm test:types
pnpm test
```

Run relevant Playwright tests for behavior touched by the batch.

Use formatting only on touched files or run the project's formatter carefully without introducing huge unrelated diffs.

When a command fails:

1. determine whether the failure existed at baseline
2. determine whether the current change caused it
3. fix regressions rather than weakening checks

Do not silence failures by disabling rules or tests unless the test/rule is demonstrably incorrect.

---

# Final verification

At the end, verify:

* no unrelated user changes were overwritten
* lint passes or remaining baseline failures are documented
* typecheck passes or remaining baseline failures are documented
* Vitest passes or remaining baseline failures are documented
* relevant Playwright tests pass or environment blockers are explicitly documented
* no authorization regression was introduced
* no cache invalidation regression was introduced
* no route/API behavior was unintentionally changed
* no database migration/schema change was introduced unless explicitly justified
* no new dependency was introduced without a compelling reason

---

# Final report

When the refactoring work is complete, provide a detailed report containing:

## 1. Baseline

* starting branch
* pre-existing working-tree changes
* baseline lint/type/test results

## 2. Architectural findings

Identify the highest-value code-quality problems found in the actual repository.

Do not provide generic advice; cite concrete files/modules.

## 3. Changes made

Group by concern:

```text
architecture
actions
validation
queries
mutations
transactions
booking
React/client state
types/lint
tests
documentation
CI/deployment
```

## 4. Before / after architecture

Show the important flow changes, for example:

```text
Before:
route action → validation + permission + DB + domain logic + cache

After:
route action
   → validated canonical input
   → authorization
   → domain mutation
       → persistence
   → centralized invalidation
   → typed result/redirect
```

## 5. Behavior guarantees

Explicitly state which existing behaviors were preserved.

## 6. Tests

List every verification command actually executed and its result.

Never claim a test was run if it was not run.

## 7. Remaining risks

Identify anything that could not be safely refactored without more product or deployment knowledge.

## 8. Deferred improvements

Separate nice-to-have improvements from changes actually required for maintainability.

---

# Decision rule for ambiguity

Do not stop the entire refactor simply because one area is ambiguous.

When ambiguity exists:

1. inspect surrounding code
2. inspect schema/migrations
3. inspect tests
4. inspect call sites
5. infer the narrowest behavior-preserving interpretation
6. preserve current behavior
7. document the uncertainty

Prefer a smaller verified refactor over an ambitious speculative redesign.

The final code should feel simpler because responsibilities are clearer, not because complexity has merely been moved behind more abstractions.
