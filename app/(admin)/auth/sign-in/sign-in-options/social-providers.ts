/**
 * 소셜 로그인 제공자 목록과 버튼 표시 정보. 서버 폼과 클라이언트 버튼이 함께 쓴다.
 */

/** Better Auth에 설정된 소셜 로그인 제공자(`auth.ts`의 `socialProviders`). */
export type SocialProvider = 'github' | 'google'

/** 제공자별 버튼 문구와 로그인 시작 실패 문구. */
export const SOCIAL_PROVIDERS = {
  github: {
    label: 'Sign in with Github',
    startError: 'Unable to start GitHub login',
  },
  google: {
    label: 'Sign in with Google',
    startError: 'Unable to start Google login',
  },
} as const satisfies Record<
  SocialProvider,
  { label: string; startError: string }
>
