// Dokploy는 main 최신 커밋을 빌드하므로 cd.yml이 CI가 검증한 커밋인지 먼저 확인해야 한다.
import { appendFileSync } from 'node:fs'

const baseURL = (process.env.DOKPLOY_URL ?? '').replace(/\/+$/, '')
const apiKey = process.env.DOKPLOY_API_KEY
const applicationId = process.env.DOKPLOY_APPLICATION_ID
const timeoutMs = Number(process.env.DEPLOY_TIMEOUT_MINUTES ?? 25) * 60_000
const POLL_MS = 10_000

if (!baseURL || !apiKey || !applicationId) {
  console.error(
    'DOKPLOY_URL, DOKPLOY_API_KEY and DOKPLOY_APPLICATION_ID are required'
  )
  process.exit(2)
}

async function api(method, path, body) {
  const response = await fetch(`${baseURL}/api/${path}`, {
    method,
    headers: {
      'x-api-key': apiKey,
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `${method} ${path} → ${response.status}: ${text.slice(0, 500)}`
    )
  }
  return text ? JSON.parse(text) : null
}

async function listDeployments() {
  const deployments = await api(
    'GET',
    `deployment.all?applicationId=${encodeURIComponent(applicationId)}`
  )
  return Array.isArray(deployments) ? deployments : []
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const known = new Set((await listDeployments()).map((d) => d.deploymentId))
const started = Date.now()

// Dokploy GitHub 자동 배포는 꺼야 push 중복 빌드와 검증 전 운영 배포를 막는다.
const application = await api(
  'GET',
  `application.one?applicationId=${encodeURIComponent(applicationId)}`
)
if (application?.autoDeploy) {
  console.log(
    '::warning title=Dokploy autoDeploy is on::Dokploy also deploys every push to main without waiting for CI. Turn off Auto Deploy for this application so only this workflow deploys.'
  )
}

await api('POST', 'application.deploy', {
  applicationId,
  title: (process.env.DEPLOY_TITLE ?? 'GitHub Actions deploy').slice(0, 200),
  description: process.env.DEPLOY_DESCRIPTION ?? '',
})
console.log('Deployment queued; waiting for Dokploy to pick it up')

let deployment = null
let lastStatus = null
while (Date.now() - started < timeoutMs) {
  await sleep(POLL_MS)
  const deployments = await listDeployments()
  deployment =
    deployments
      .filter((candidate) => !known.has(candidate.deploymentId))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ??
    null
  if (!deployment) continue

  if (deployment.status !== lastStatus) {
    lastStatus = deployment.status
    const elapsed = Math.round((Date.now() - started) / 1000)
    console.log(
      `[${elapsed}s] ${deployment.deploymentId}: ${deployment.status}`
    )
  }
  if (
    deployment.status === 'done' ||
    deployment.status === 'error' ||
    deployment.status === 'cancelled'
  ) {
    break
  }
}

const seconds = Math.round((Date.now() - started) / 1000)
const status = deployment?.status ?? 'not started'
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      '### Dokploy deployment',
      '',
      `- Deployment: \`${deployment?.deploymentId ?? 'n/a'}\``,
      `- Status: **${status}** after ${seconds}s`,
      deployment?.errorMessage ? `- Error: ${deployment.errorMessage}` : '',
      '',
    ].join('\n')
  )
}

if (status !== 'done') {
  console.log(
    `::error title=Deployment ${status}::Dokploy deployment ${deployment?.deploymentId ?? ''} ended as "${status}" after ${seconds}s. ${deployment?.errorMessage ?? 'Check the build log in Dokploy.'}`
  )
  process.exit(1)
}
console.log(`Deployed in ${seconds}s`)
