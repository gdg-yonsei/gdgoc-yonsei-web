import 'server-only'

import type { ResourceType } from '@/lib/server/permission/handle-permission'
import { roleCouldEver } from '@/lib/server/services/admin/authorize'
import type { Role, Scope } from '@/lib/server/services/admin/types'

const WRITABLE: ResourceType[] = [
  'members',
  'projects',
  'sessions',
  'parts',
  'generations',
]
const DELETABLE: ResourceType[] = [
  'sessions',
  'projects',
  'parts',
  'generations',
]

/**
 * 동의 화면에서 고를 수 있는 스코프: 그 역할에 실제로 권한이 생기는 것만.
 * 본인 계정 삭제(`delete members`)는 MCP 로 열지 않으므로 admin 판단에서 뺀다.
 */
export function selectableScopesFor(role: Role): Scope[] {
  const scopes: Scope[] = []
  if (roleCouldEver(role, 'get', 'adminPage')) scopes.push('gyms:read')
  if (
    WRITABLE.some(
      (resource) =>
        roleCouldEver(role, 'post', resource) ||
        roleCouldEver(role, 'put', resource)
    )
  ) {
    scopes.push('gyms:write')
  }
  if (
    roleCouldEver(role, 'put', 'membersRole') ||
    DELETABLE.some((resource) => roleCouldEver(role, 'delete', resource))
  ) {
    scopes.push('gyms:admin')
  }
  return scopes
}

export function canConnectMcp(role: Role): boolean {
  return role !== 'UNVERIFIED'
}

/** Next 의 searchParams 객체를 서명 검증에 쓸 쿼리 문자열로 되돌린다. */
export function oauthQueryString(
  params: Record<string, string | string[] | undefined>
): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) query.append(key, item)
    }
  }
  return query.toString()
}

/**
 * 로그인 후 이동할 곳. 인가 서버가 서명해 넘긴 OAuth 요청(client_id + sig)이면
 * authorize 로 되돌아가 흐름을 이어 가고, 아니면 관리자 홈으로 간다.
 *
 * 서명 검증은 여기서 하지 않는다. authorize 가 클라이언트·redirect URI 를 다시 검증하고,
 * 동의 요청(`/oauth2/consent`)이 서버에서 oauth_query 서명을 확인하므로 위조된 쿼리는
 * 그 단계에서 거절된다.
 */
export function postLoginPath(query: string): string {
  const params = new URLSearchParams(query)
  return params.has('client_id') && params.has('sig')
    ? `/api/auth/oauth2/authorize?${query}`
    : '/admin'
}

function hostOf(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return new URL(value).host
  } catch {
    return ''
  }
}

/**
 * 동의 화면에 보여 줄 "돌아갈 곳". 인가 코드는 이번 요청의 redirect_uri 로 가므로
 * 반드시 그 값을 보여 준다. 등록된 목록의 첫 URI 를 보여 주면, 여러 URI 를 등록한
 * 클라이언트가 믿을 만한 호스트를 앞에 두고 다른 호스트로 코드를 받을 수 있다.
 * (redirect_uri 는 authorize 가 등록 목록과 대조해 검증한 뒤 서명해 넘긴다.)
 */
export function consentRedirectHost({
  requestRedirectUri,
  registeredRedirectUris,
  clientId,
}: {
  requestRedirectUri: string | undefined
  registeredRedirectUris: string[]
  clientId: string
}): string {
  if (requestRedirectUri) return hostOf(requestRedirectUri)
  return registeredRedirectUris.length === 1
    ? hostOf(registeredRedirectUris[0])
    : hostOf(clientId)
}
