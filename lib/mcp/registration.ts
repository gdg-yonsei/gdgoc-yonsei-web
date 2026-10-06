import 'server-only'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function isHttpLoopback(uri: unknown): boolean {
  if (typeof uri !== 'string') return false
  try {
    const url = new URL(uri)
    return url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

// application_type이 없고 redirect URI가 모두 HTTP 루프백이면 SEP-837에 따라 native로 채운다.
// 기본 web은 루프백 콜백을 거절하며 일부 MCP 클라이언트는 이 필드를 보내지 않는다.
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
