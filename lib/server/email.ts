// 메일과 무관한 요청에 SDK 비용을 더하지 않도록 Resend·환경변수는 발송 시에만 불러온다.
import 'server-only'

import type { ReactElement } from 'react'

/** 모든 메일의 발신자 표기. Resend에 인증된 도메인이어야 한다. */
export const EMAIL_SENDER = 'GDGoC Yonsei <gdgoc.yonsei@moveto.kr>'

export type EmailMessage = {
  to: string
  subject: string
  react: ReactElement
}

// Resend 발송 실패는 응답값이다. 네트워크·설정 예외만 호출부로 전달되며 수신자가 없으면 발송하지 않는다.
export async function sendEmails(
  messages: readonly EmailMessage[]
): Promise<void> {
  if (messages.length === 0) {
    return
  }

  const [{ Resend }, { getResendEnv }] = await Promise.all([
    import('resend'),
    import('@/lib/server/env'),
  ])
  const resend = new Resend(getResendEnv().RESEND_API_KEY)

  await Promise.all(
    messages.map((message) =>
      resend.emails.send({ from: EMAIL_SENDER, ...message })
    )
  )
}
