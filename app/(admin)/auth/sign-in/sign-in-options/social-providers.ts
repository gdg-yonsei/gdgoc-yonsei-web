export type SocialProvider = 'github' | 'google'

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
