'use client'

/**
 * 브라우저용 Better Auth 클라이언트(로그인, 패스키 등록, MCP 동의 처리).
 */
import { passkeyClient } from '@better-auth/passkey/client'
import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { createAuthClient } from 'better-auth/react'

/** 클라이언트 컴포넌트가 쓰는 인증 클라이언트. */
export const authClient = createAuthClient({
  plugins: [passkeyClient(), oauthProviderClient()],
})
