/**
 * MCP 클라이언트 동적 등록(DCR) 요청 보정. `auth.ts`의 `before` 훅이 쓴다.
 */
import 'server-only'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** URI가 http 루프백(localhost, 127.0.0.1, [::1]) 주소인지. */
function isHttpLoopback(uri: unknown): boolean {
  if (typeof uri !== 'string') return false
  try {
    const url = new URL(uri)
    return url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

/**
 * RFC 7591 등록 요청에 application_type 이 없고 redirect URI 가 모두 http 루프백이면
 * `native` 로 채운다(MCP SEP-837 기본값).
 *
 * OIDC 기본값은 `web` 이라 oauth-provider 가 루프백 콜백을 거절한다. MCP SDK v2 클라이언트는
 * 이 값을 스스로 보내지만 v1 SDK 를 쓰는 클라이언트(로컬 CLI·에디터)는 보내지 않는다.
 */
export function withLoopbackApplicationType<T>(body: T): T {
  if (!body || typeof body !== 'object') return body
  const registration = body as Record<string, unknown>
  const redirectUris = registration.redirect_uris
  if (
    registration.application_type !== undefined ||
    !Array.isArray(redirectUris) ||
    redirectUris.length === 0 ||
    !redirectUris.every(isHttpLoopback)
  ) {
    return body
  }
  return { ...registration, application_type: 'native' } as T
}
