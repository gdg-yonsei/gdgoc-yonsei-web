import { createHash, randomBytes } from 'node:crypto'
import { expect, type Browser } from '@playwright/test'
import postgres from 'postgres'

export const REDIRECT_URI = 'http://127.0.0.1:9999/callback'

type JsonRpcResponse = {
  result?: {
    tools?: { name: string }[]
    isError?: boolean
    structuredContent?: { result?: unknown; error?: { code: string; message: string } }
  }
  error?: { code: number; message: string }
}

export type McpConnection = {
  accessToken: string
  refreshToken: string | undefined
  scope: string
  rawCall: (method: string, params?: object) => Promise<{ status: number; body: JsonRpcResponse | null }>
  toolNames: () => Promise<string[]>
  call: (name: string, args?: object) => Promise<NonNullable<JsonRpcResponse['result']>>
}

function parseRpc(text: string): JsonRpcResponse | null {
  if (!text) return null
  if (text.trimStart().startsWith('{')) return JSON.parse(text) as JsonRpcResponse
  const data = text
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5))
    .join('')
  return data ? (JSON.parse(data) as JsonRpcResponse) : null
}

export async function mcpRequest(
  baseURL: string,
  accessToken: string | null,
  method: string,
  params: object = {}
) {
  const response = await fetch(`${baseURL}/api/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-06-18',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  return {
    status: response.status,
    headers: response.headers,
    body: parseRpc(await response.text()),
  }
}

const registeredClients = new Map<string, Promise<string>>()

/**
 * DCR 은 분당 5회로 제한되므로 스위트 전체가 클라이언트 하나를 같이 쓴다.
 * 같은 사용자가 이미 동의했다면 authorize 가 동의 화면 없이 바로 콜백으로 보낸다.
 */
function registeredClientId(baseURL: string): Promise<string> {
  let pending = registeredClients.get(baseURL)
  if (!pending) {
    pending = (async () => {
      const registration = await fetch(`${baseURL}/api/auth/oauth2/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_name: 'E2E MCP Client',
          redirect_uris: [REDIRECT_URI],
          token_endpoint_auth_method: 'none',
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
        }),
      })
      const client = (await registration.json()) as { client_id?: string }
      if (!client.client_id) {
        throw new Error(`client registration failed: ${JSON.stringify(client)}`)
      }
      return client.client_id
    })()
    registeredClients.set(baseURL, pending)
  }
  return pending
}

/**
 * 역할별 로그인 세션(storage state)으로 실제 OAuth 흐름을 돈다:
 * DCR → authorize → 동의 화면 승인 → PKCE 토큰 교환.
 */
export async function connectAs(
  browser: Browser,
  baseURL: string,
  storageState: string,
  scopes: string[]
): Promise<McpConnection> {
  const client = { client_id: await registeredClientId(baseURL) }

  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const resource = `${baseURL}/api/mcp`
  const authorize = new URL(`${baseURL}/api/auth/oauth2/authorize`)
  for (const [key, value] of Object.entries({
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: REDIRECT_URI,
    scope: [...scopes, 'offline_access'].join(' '),
    state: 'e2e-state',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    resource,
  })) {
    authorize.searchParams.set(key, value)
  }

  const context = await browser.newContext({ storageState })
  const page = await context.newPage()
  let callbackUrl: string | null = null
  // 이미 동의한 클라이언트면 authorize 가 콜백으로 바로 302 한다. 리다이렉트로 도착한
  // 탐색은 route 로 가로챌 수 없으므로 요청 이벤트에서 URL 만 기록한다.
  page.on('request', (request) => {
    if (request.url().startsWith(REDIRECT_URI)) callbackUrl = request.url()
  })
  await page.route('http://127.0.0.1:9999/**', (route) =>
    route.fulfill({ status: 200, body: 'ok' })
  )

  try {
    await page.goto(authorize.toString()).catch((error: unknown) => {
      if (!callbackUrl) throw error
    })

    if (!callbackUrl) {
      const allow = page.getByRole('button', { name: 'Allow' })
      const refused = page.getByRole('heading', { name: 'Cannot connect' })
      await expect(allow.or(refused)).toBeVisible({ timeout: 30_000 })
      if (await refused.isVisible()) {
        const reason = await page
          .locator('p[role="alert"]')
          .filter({ hasText: /\S/ })
          .first()
          .innerText()
        throw new Error(`consent refused: ${reason}`)
      }
      await allow.click()
    }
    // 콜백은 route 가 가로채 기록한다. 탐색 완료 이벤트는 가로채기와 경합하므로 값만 기다린다.
    await expect.poll(() => callbackUrl, { timeout: 30_000 }).not.toBeNull()
  } finally {
    await context.close()
  }

  const callback = new URL(callbackUrl!)
  const code = callback.searchParams.get('code')
  if (!code) throw new Error(`no authorization code: ${callbackUrl}`)

  const tokenResponse = await fetch(`${baseURL}/api/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: client.client_id,
      code_verifier: verifier,
      resource,
    }),
  })
  const tokens = (await tokenResponse.json()) as {
    access_token?: string
    refresh_token?: string
    scope?: string
  }
  if (!tokens.access_token) {
    throw new Error(`token exchange failed: ${JSON.stringify(tokens)}`)
  }

  const accessToken = tokens.access_token
  const rawCall = async (method: string, params: object = {}) => {
    const { status, body } = await mcpRequest(baseURL, accessToken, method, params)
    return { status, body }
  }

  return {
    accessToken,
    refreshToken: tokens.refresh_token,
    scope: tokens.scope ?? '',
    rawCall,
    toolNames: async () =>
      ((await rawCall('tools/list')).body?.result?.tools ?? []).map((tool) => tool.name),
    call: async (name, args = {}) => {
      const { body } = await rawCall('tools/call', { name, arguments: args })
      if (!body?.result) throw new Error(`tools/call ${name} failed: ${JSON.stringify(body)}`)
      return body.result
    },
  }
}

/** 감사 로그와 역할 변경 확인용. 일회용 DB 가드는 Playwright 설정이 이미 통과시켰다. */
export function e2eDatabase() {
  return postgres(process.env.AUTH_DRIZZLE_URL!, { max: 1 })
}
