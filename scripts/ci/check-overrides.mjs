// pnpm-workspace overrides가 package.json보다 우선해 의존성 업데이트가 무시될 수 있으므로 값이 다르면 실패한다.
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

const mismatches = Object.entries(overrides).filter(([name, version]) => {
  const resolved = version.startsWith('$') ? direct[version.slice(1)] : version
  return resolved === undefined || (name in direct && direct[name] !== resolved)
})

for (const [name, version] of mismatches) {
  console.log(
    `::error file=pnpm-workspace.yaml,title=Override mismatch::${name} is ${direct[name]} in package.json but overridden to ${version}; pnpm installs ${version}. Update both together.`
  )
}
console.log(
  `${Object.keys(overrides).length} overrides checked, ${mismatches.length} mismatched`
)
process.exit(mismatches.length > 0 ? 1 : 0)
