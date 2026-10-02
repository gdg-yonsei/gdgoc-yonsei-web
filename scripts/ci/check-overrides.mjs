/**
 * pnpm-workspace.yaml의 `overrides`는 package.json보다 우선한다. package.json에서 직접 의존성을 올리고
 * override는 그대로 두면, pnpm은 아무 경고 없이 예전 버전을 계속 설치한다(package.json은 16.3.6인데
 * next가 16.3.2에 머문 적이 있다). 두 값이 다르면 실패시킨다.
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
