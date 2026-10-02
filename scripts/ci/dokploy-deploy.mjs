/**
 * 운영 앱의 Dokploy 배포를 시작하고 끝날 때까지 기다린다.
 *
 * Dokploy는 `main`의 최신 커밋으로 빌드하므로, 호출하는 쪽(cd.yml)이 먼저 그 커밋이 CI가 방금 검증한
 * 커밋인지 확인한다.
 *
 * 환경 변수: DOKPLOY_URL, DOKPLOY_API_KEY, DOKPLOY_APPLICATION_ID,
 *           DEPLOY_TITLE, DEPLOY_DESCRIPTION(선택),
 *           DEPLOY_TIMEOUT_MINUTES(선택, 기본 25).
 */
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

// Dokploy의 GitHub 자동 배포는 꺼져 있어야 한다. 켜져 있으면 push마다 두 번 빌드하고, 검증되지 않은
// 커밋이 운영에 나간다. push로 이미 배포가 시작됐으면 크게 경고한다.
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
