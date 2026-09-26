/**
 * CI guard for drizzle migrations.
 *
 * Production applies migrations during `pnpm build` on Dokploy, before the new
 * code serves traffic and with no automatic rollback. This script runs on
 * every PR and fails before that can go wrong:
 *
 * - the journal and the .sql files must match one to one, in order;
 * - migrations that already exist on the base branch must not be edited
 *   (production has applied them, so an edit never runs there);
 * - new migrations that drop or rewrite data need the PR label
 *   `migration:destructive-ok` (passed in as ALLOW_DESTRUCTIVE_MIGRATION=true).
 *
 * Usage: node scripts/ci/check-migrations.mjs <base-git-ref>
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs'

const MIGRATIONS_DIR = 'drizzle'
const JOURNAL = `${MIGRATIONS_DIR}/meta/_journal.json`
const baseRef = process.argv[2]
const allowDestructive = process.env.ALLOW_DESTRUCTIVE_MIGRATION === 'true'

const BLOCKING = [
  [/\bDROP\s+TABLE\b/i, 'drops a table'],
  [/\bDROP\s+COLUMN\b/i, 'drops a column'],
  [/\bDROP\s+TYPE\b/i, 'drops an enum/type'],
  [/\bTRUNCATE\b/i, 'truncates a table'],
  [/\bDELETE\s+FROM\b/i, 'deletes rows'],
  [
    /\bALTER\s+COLUMN\s+"?\w+"?\s+(SET\s+DATA\s+)?TYPE\b/i,
    'changes a column type',
  ],
]

// Checked per statement. Statements on tables created in the same migration
// are skipped: an empty table has nothing to lock or validate.
const WARNINGS = [
  [
    /\bRENAME\b/i,
    'renames an object — the old code keeps serving while the migration runs and will query the old name',
  ],
  [
    /\bSET\s+NOT\s+NULL\b/i,
    'adds NOT NULL — the deploy fails if production has NULL rows',
  ],
  [
    /\bADD\s+CONSTRAINT\b(?![\s\S]*\bNOT\s+VALID\b)/i,
    'adds a constraint without NOT VALID — existing rows are validated under lock',
  ],
  [
    /\bCREATE\s+(UNIQUE\s+)?INDEX\s+(?!CONCURRENTLY)/i,
    'creates an index without CONCURRENTLY — blocks writes while it builds',
  ],
]

const errors = []
const warnings = []
const summary = []

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function stripComments(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}

const mergeBase = baseRef ? git('merge-base', baseRef, 'HEAD') : null

// 1. Journal ↔ files.
const journal = JSON.parse(readFileSync(JOURNAL, 'utf8'))
const journalTags = journal.entries.map((entry) => entry.tag)
const sqlTags = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith('.sql'))
  .map((name) => name.replace(/\.sql$/, ''))
  .sort()

// Entries the base branch already had. Their timestamps are history that
// production has already applied, so problems there are only reported.
let baseEntryCount = journal.entries.length
if (mergeBase) {
  try {
    baseEntryCount = JSON.parse(git('show', `${mergeBase}:${JOURNAL}`)).entries
      .length
  } catch {
    baseEntryCount = 0
  }
}

for (const tag of sqlTags) {
  if (!journalTags.includes(tag)) {
    errors.push([
      `${MIGRATIONS_DIR}/${tag}.sql`,
      'is not listed in meta/_journal.json, so drizzle-kit migrate never applies it',
    ])
  }
}
let newestWhen = -Infinity
let newestTag = null
journal.entries.forEach((entry, index) => {
  if (!existsSync(`${MIGRATIONS_DIR}/${entry.tag}.sql`)) {
    errors.push([
      JOURNAL,
      `lists ${entry.tag} but ${entry.tag}.sql does not exist`,
    ])
  }
  if (entry.idx !== index) {
    errors.push([
      JOURNAL,
      `entry ${entry.tag} has idx ${entry.idx}, expected ${index}`,
    ])
  }
  // drizzle's migrator applies a migration only when its `when` is newer than
  // the newest one recorded in the database, so an older timestamp is
  // silently skipped on any database that is already up to date.
  if (entry.when <= newestWhen) {
    ;(index >= baseEntryCount ? errors : warnings).push([
      JOURNAL,
      `entry ${entry.tag} (when ${entry.when}) is not newer than ${newestTag} (when ${newestWhen}); drizzle-kit migrate skips it on an up-to-date database`,
    ])
  }
  if (entry.when > newestWhen) {
    newestWhen = entry.when
    newestTag = entry.tag
  }
})

// 2. Changes against the base branch.
if (mergeBase) {
  const changed = git(
    'diff',
    '--name-status',
    mergeBase,
    'HEAD',
    '--',
    `${MIGRATIONS_DIR}/*.sql`
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t'))

  for (const [status, file, renamedTo] of changed) {
    if (status === 'A') {
      const sql = stripComments(readFileSync(file, 'utf8'))
      summary.push(`- \`${file}\` (new)`)
      for (const [pattern, message] of BLOCKING) {
        if (pattern.test(sql)) {
          ;(allowDestructive ? warnings : errors).push([
            file,
            `${message}${allowDestructive ? ' (allowed by label)' : '. Add the PR label `migration:destructive-ok` after confirming a backup exists.'}`,
          ])
        }
      }
      const createdTables = new Set(
        [
          ...sql.matchAll(
            /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi
          ),
        ].map((match) => match[1])
      )
      for (const statement of sql.split(';')) {
        const table = statement.match(
          /(?:ALTER\s+TABLE|\bON)\s+(?:"public"\.)?"?(\w+)"?/i
        )?.[1]
        if (table && createdTables.has(table)) continue
        for (const [pattern, message] of WARNINGS) {
          if (pattern.test(statement)) warnings.push([file, message])
        }
      }
    } else {
      const target = renamedTo ?? file
      summary.push(`- \`${target}\` (${status})`)
      ;(allowDestructive ? warnings : errors).push([
        target,
        'changes a migration that already exists on the base branch; production has applied it, so the change would never run there. Generate a new migration instead.',
      ])
    }
  }
}

// 3. Report.
for (const [file, message] of warnings) {
  console.log(`::warning file=${file}::${message}`)
}
for (const [file, message] of errors) {
  console.log(`::error file=${file}::${message}`)
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = ['### Migration check', '']
  lines.push(
    summary.length ? 'Migrations changed in this PR:' : 'No migration changes.'
  )
  lines.push(...summary, '')
  for (const [file, message] of errors)
    lines.push(`- ❌ \`${file}\`: ${message}`)
  for (const [file, message] of warnings)
    lines.push(`- ⚠️ \`${file}\`: ${message}`)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
}

console.log(
  `${sqlTags.length} migrations, ${summary.length} changed, ${errors.length} errors, ${warnings.length} warnings`
)
process.exit(errors.length > 0 ? 1 : 0)
