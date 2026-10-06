import 'server-only'

import type { ResourceType } from '@/lib/server/permission/policy'
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

// 역할에 실제 권한이 생기는 스코프만 고른다. 본인 계정 삭제는 MCP로 열지 않아 admin 판단에서 뺀다.
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

/** MCP 연결이 가능한 역할인지. 가입 승인 전(UNVERIFIED) 사용자만 연결할 수 없다. */
export function canConnectMcp(role: Role): boolean {
  return role !== 'UNVERIFIED'
}

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

// client_id·sig가 있으면 authorize로 복귀한다. authorize가 클라이언트·redirect URI를 다시 검증한다.
// oauth_query 서명 검증은 oauth2/consent가 맡아 위조된 쿼리를 거절한다.
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

// 동의 화면에는 서명된 이번 redirect_uri를 표시해야 한다. 등록 목록 첫 URI는 실제 코드 수신 호스트를 숨길 수 있다.
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
