/**
 * Better Auth 엔드포인트(`/api/auth/*`): 로그인, 로그아웃, 세션, 패스키, OAuth 인가·토큰.
 */
import { auth } from '@/auth'
import { toNextJsHandler } from 'better-auth/next-js'

/** Better Auth 핸들러를 Next.js Route Handler로 연결한다. */
export const { GET, POST } = toNextJsHandler(auth)
