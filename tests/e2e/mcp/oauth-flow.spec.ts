import { expect, test } from '@playwright/test'
import { readSeededData } from '../helpers/read-seeded-data'
import {
  ADMIN_STORAGE_STATE,
  MEMBER_STORAGE_STATE,
  UNVERIFIED_STORAGE_STATE,
} from '../setup/constants'
import { connectAs, e2eDatabase, mcpRequest } from './helpers'

test.describe.configure({ mode: 'serial' })

const ALL_SCOPES = ['gyms:read', 'gyms:write', 'gyms:admin']

test.describe('GYMS MCP over OAuth', () => {
  test('discovery chain points clients at the authorization server', async ({
    baseURL,
  }) => {
    const unauthenticated = await mcpRequest(baseURL!, null, 'tools/list')
    expect(unauthenticated.status).toBe(401)
    expect(unauthenticated.headers.get('www-authenticate')).toContain(
      `resource_metadata="${baseURL}/.well-known/oauth-protected-resource/api/mcp"`
    )

    const resource = await (
      await fetch(`${baseURL}/.well-known/oauth-protected-resource/api/mcp`)
    ).json()
    expect(resource.resource).toBe(`${baseURL}/api/mcp`)
    expect(resource.scopes_supported).toEqual(
      expect.arrayContaining(ALL_SCOPES)
    )

    const issuer = resource.authorization_servers[0] as string
    const issuerPath = new URL(issuer).pathname
    const metadata = await (
      await fetch(
        `${baseURL}/.well-known/oauth-authorization-server${issuerPath}`
      )
    ).json()
    expect(metadata.issuer).toBe(issuer)
    expect(metadata.code_challenge_methods_supported).toContain('S256')
    expect(metadata.registration_endpoint).toBeTruthy()
    expect(metadata.client_id_metadata_document_supported).toBe(true)
  })

  test('LEAD with full scopes sees admin tools, MEMBER does not', async ({
    browser,
    baseURL,
  }) => {
    const lead = await connectAs(
      browser,
      baseURL!,
      ADMIN_STORAGE_STATE,
      ALL_SCOPES
    )
    const claims = JSON.parse(
      Buffer.from(lead.accessToken.split('.')[1]!, 'base64url').toString('utf8')
    ) as {
      exp: number
      iat: number
      aud: string | string[]
      azp?: string
      client_id?: string
    }
    // gyms:admin 이 든 토큰은 15분, 그 외는 1시간.
    expect(claims.exp - claims.iat).toBe(900)
    expect([claims.aud].flat()).toContain(`${baseURL}/api/mcp`)
    expect(claims.azp ?? claims.client_id).toBeTruthy()
    const leadTools = await lead.toolNames()
    expect(leadTools).toEqual(
      expect.arrayContaining([
        'update_member_role',
        'delete_session',
        'create_generation',
      ])
    )

    const member = await connectAs(browser, baseURL!, MEMBER_STORAGE_STATE, [
      'gyms:read',
      'gyms:write',
    ])
    const memberClaims = JSON.parse(
      Buffer.from(member.accessToken.split('.')[1]!, 'base64url').toString(
        'utf8'
      )
    ) as { exp: number; iat: number }
    expect(memberClaims.exp - memberClaims.iat).toBe(3600)
    const memberTools = await member.toolNames()
    expect(memberTools).toEqual(
      expect.arrayContaining(['create_project', 'register_session', 'whoami'])
    )
    expect(memberTools).not.toContain('delete_session')
    expect(memberTools).not.toContain('list_members')
    expect(member.scope.split(' ')).not.toContain('gyms:admin')
  })

  test('UNVERIFIED users are refused on the consent screen', async ({
    browser,
    baseURL,
  }) => {
    await expect(
      connectAs(browser, baseURL!, UNVERIFIED_STORAGE_STATE, ['gyms:read'])
    ).rejects.toThrow(/admin page access/)
  })

  test('session round trip is audited', async ({ browser, baseURL }) => {
    const seeded = await readSeededData()
    const lead = await connectAs(
      browser,
      baseURL!,
      ADMIN_STORAGE_STATE,
      ALL_SCOPES
    )

    const whoami = await lead.call('whoami')
    expect(whoami.structuredContent?.result).toMatchObject({ role: 'LEAD' })

    const created = await lead.call('create_session', {
      name: 'MCP Session',
      nameKo: 'MCP 세션',
      description: 'Created through MCP',
      descriptionKo: 'MCP 로 만든 세션',
      location: 'Room 1',
      locationKo: '1호',
      startAt: '2027-05-01T19:00',
      endAt: '2027-05-01T21:00',
      maxCapacity: 10,
      // 다른 admin spec 처럼 두 번째 기수에만 쓴다. 테스트 API 가 켜진 prod e2e 는
      // 무효화된 공개 페이지 셸을 다시 만들지 않아 첫 기수 공개 페이지 테스트가 깨진다.
      partId: seeded.secondPartId,
    })
    expect(created.isError).toBeFalsy()
    const sessionId = (created.structuredContent?.result as { id: string }).id

    const updated = await lead.call('update_session', {
      sessionId,
      name: 'MCP Session Renamed',
    })
    expect(updated.isError).toBeFalsy()

    const fetched = await lead.call('get_session', { sessionId })
    expect(fetched.structuredContent?.result).toMatchObject({
      name: 'MCP Session Renamed',
      nameKo: 'MCP 세션',
      startAt: '2027-05-01T19:00:00.000Z',
    })

    const deleted = await lead.call('delete_session', { sessionId })
    expect(deleted.isError).toBeFalsy()

    const sql = e2eDatabase()
    try {
      const rows = await sql<{ tool: string; outcome: string }[]>`
        select tool, outcome from mcp_audit_log
        where "targetId" = ${sessionId} order by "createdAt"`
      expect(rows.map((row) => row.tool)).toEqual([
        'create_session',
        'update_session',
        'delete_session',
      ])
      expect(rows.every((row) => row.outcome === 'ok')).toBe(true)
    } finally {
      await sql.end()
    }
  })

  test('a read-only token cannot call write tools', async ({
    browser,
    baseURL,
  }) => {
    const reader = await connectAs(browser, baseURL!, ADMIN_STORAGE_STATE, [
      'gyms:read',
    ])
    expect(await reader.toolNames()).not.toContain('create_session')
    const { body } = await reader.rawCall('tools/call', {
      name: 'create_session',
      arguments: {},
    })
    expect(body?.error ?? body?.result?.isError).toBeTruthy()
  })

  test('demoting a member revokes MCP access on the next request', async ({
    browser,
    baseURL,
  }) => {
    const seeded = await readSeededData()
    const member = await connectAs(browser, baseURL!, MEMBER_STORAGE_STATE, [
      'gyms:read',
    ])
    expect((await member.rawCall('tools/list')).status).toBe(200)

    const sql = e2eDatabase()
    try {
      await sql`update "user" set role = 'UNVERIFIED' where id = ${seeded.memberUserId}`
      expect((await member.rawCall('tools/list')).status).toBe(401)
    } finally {
      await sql`update "user" set role = 'MEMBER' where id = ${seeded.memberUserId}`
      await sql.end()
    }
  })

  test('disconnecting a client in GYMS rejects its live token at once', async ({
    browser,
    baseURL,
  }) => {
    const member = await connectAs(browser, baseURL!, MEMBER_STORAGE_STATE, [
      'gyms:read',
    ])
    expect((await member.rawCall('tools/list')).status).toBe(200)

    const context = await browser.newContext({
      storageState: MEMBER_STORAGE_STATE,
    })
    try {
      const page = await context.newPage()
      await page.goto(`${baseURL}/admin/profile/mcp`)
      // 스위트 전체가 클라이언트 하나(E2E MCP Client)를 같이 쓰므로 멤버의 연결은 하나다.
      const disconnect = page.getByRole('button', {
        name: 'Disconnect: E2E MCP Client',
      })
      await expect(disconnect).toBeVisible()
      page.once('dialog', (dialog) => void dialog.accept())
      await disconnect.click()
      await expect(page.getByText('No AI tools are connected.')).toBeVisible()
    } finally {
      await context.close()
    }

    // 액세스 토큰(JWT)은 아직 만료되지 않았지만 동의가 사라져 바로 거절된다.
    expect((await member.rawCall('tools/list')).status).toBe(401)
  })
})
