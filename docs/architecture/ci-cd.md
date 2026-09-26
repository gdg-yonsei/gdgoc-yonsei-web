# CI/CD

## Flow

```
PR ──► CI (ci.yml) ───────────────────────────► required check "CI passed"
                                                         │ merge
main ──► CD (cd.yml): CI (same workflow) ──► Dokploy deploy ──► smoke test (production)
```

- **CI** runs on every pull request and merge-queue run, and CD runs it again
  on `main` before anything is deployed.
- **CD** triggers Dokploy only after CI passes on the exact commit that is still
  the tip of `main`. Then it waits for the build to finish and smoke-tests
  https://gdgoc.yonsei.ac.kr.
- **CodeQL** (`codeql.yml`) scans JS/TS and the workflows themselves on PRs, on
  `main`, and weekly.
- **Dependabot** (`.github/dependabot.yml`) opens weekly, grouped npm and
  Actions updates.

## CI jobs

| Job                             | What it catches                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck, lint, format, schema | `tsc`, ESLint (0 warnings), and Prettier on files the PR changed. Also a `db/schema` change without a committed migration (Dokploy's `pnpm build` would otherwise generate and apply one, unreviewed), `pnpm-workspace.yaml` overrides that silently pin a different version than `package.json`, and unsafe migrations (below). |
| Unit tests                      | Vitest plus a coverage report (job summary and `coverage` artifact).                                                                                                                                                                                                                                                             |
| Migration upgrade path          | Rebuilds production's shape: it migrates Postgres 18 to the **base** revision, seeds it with the base code, and applies this revision's migrations on top. Then it re-runs them (they must be idempotent) and seeds with the new code.                                                                                           |
| E2E (production build)          | `pnpm test:e2e:prod` against a throwaway Postgres. Traces, videos and the report are uploaded on failure. The same build is then measured against the performance budget, which only reports and never blocks (runner timing is too noisy).                                                                                      |
| Dependency security             | `dependency-review` fails a PR that adds a dependency with a high or critical advisory. `pnpm audit` only reports.                                                                                                                                                                                                               |
| Workflow lint                   | `actionlint` on `.github/workflows`.                                                                                                                                                                                                                                                                                             |
| CI passed                       | Aggregates the jobs above. Mark **only this check** as required in branch protection.                                                                                                                                                                                                                                            |

CI never sees real secrets. Every value in `ci.yml` is a placeholder, and
database writes go to the job's own Postgres service on `127.0.0.1`, which
`scripts/lib/disposable-database.ts` accepts.

## Migration rules (`scripts/ci/check-migrations.mjs`)

Production applies migrations during the Dokploy build, and nothing rolls them
back automatically. The check therefore fails when:

- the journal and the `.sql` files disagree, or a new journal entry's `when`
  is not newer than every earlier entry (drizzle skips it on an up-to-date
  database);
- a migration that already exists on the base branch is edited;
- a new migration drops a table, column or type, truncates, deletes rows, or
  changes a column type. Only if a backup exists, add the PR label
  `migration:destructive-ok`, then re-run the failed CI job (adding a label
  does not start a new run).

Renames, `SET NOT NULL`, constraints without `NOT VALID`, and indexes without
`CONCURRENTLY` on existing tables produce warnings only.

## One-time setup

1. **Dokploy.** Create an API key (Settings → Profile → API). Turn **Auto
   Deploy off** for the `official-website-nextjs` application. Otherwise every
   push still deploys immediately, before CI.
2. **GitHub → Settings → Environments → `production`.**
   - Secret `DOKPLOY_API_KEY`
   - Variables `DOKPLOY_URL` (Dokploy panel origin) and
     `DOKPLOY_APPLICATION_ID` (`FYUWCshUbgtzPlWbQ3cIs`)
   - Optional: required reviewers, so a person approves each deploy.
3. **Branch protection for `main`.** Require pull requests and the status
   check **CI passed**.
4. **Labels.** Create `migration:destructive-ok`, plus `dependencies` and `ci`
   for Dependabot.

Until step 2 is done, CD runs CI and the smoke test but skips the deploy with
a notice.

## Manual runs

- **Actions → CD → Run workflow** with _smoke-only_ checks production without
  deploying.
- `node scripts/ci/smoke-test.mjs https://gdgoc.yonsei.ac.kr` runs the same
  checks locally. It only sends GET requests.
