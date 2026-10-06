import { connection } from 'next/server'
import { auth } from '@/auth'

/** RFC 9728, RFC 8414, OpenID 디스커버리를 Better Auth 핸들러에 위임한다.
 * connection()으로 요청 시점에만 실행해 빌드 사전 렌더링을 막는다. */
export async function GET(request: Request) {
  await connection()
  return auth.handler(request)
}

export const HEAD = GET
