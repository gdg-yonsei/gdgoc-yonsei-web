/**
 * `overrides` in pnpm-workspace.yaml win over package.json. When a direct
 * dependency is bumped in package.json but its override is not, pnpm keeps
 * installing the old version without a word (next stayed on 16.3.2 while
 * package.json said 16.3.6). Fail when the two disagree.
 */
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const direct = { ...pkg.dependencies, ...pkg.devDependencies }

const overrides = {}
let inOverrides = false
for (const line of readFileSync('pnpm-workspace.yaml', 'utf8').split('\n')) {
  if (/^\S/.test(line)) inOverrides = line.startsWith('overrides:')
  if (!inOverrides) continue
  const match = line.match(/^ {2}(['"]?)([^'"#\s:]+)\1:\s*['"]?([^'"#\s]+)/)
  if (match) overrides[match[2]] = match[3]
}

const mismatches = Object.entries(overrides).filter(
  ([name, version]) => name in direct && direct[name] !== version
)

for (const [name, version] of mismatches) {
  console.log(
    `::error file=pnpm-workspace.yaml,title=Override mismatch::${name} is ${direct[name]} in package.json but overridden to ${version}; pnpm installs ${version}. Update both together.`
  )
}
console.log(
  `${Object.keys(overrides).length} overrides checked, ${mismatches.length} mismatched`
)
process.exit(mismatches.length > 0 ? 1 : 0)
