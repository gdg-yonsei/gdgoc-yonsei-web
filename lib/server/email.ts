/**
 * 트랜잭션 메일 발송(Resend).
 *
 * 세션 개설 안내, 참가 신청 알림처럼 서비스가 보내는 메일은 모두 이 모듈을 거친다.
 * Resend SDK와 환경변수는 실제로 메일을 보낼 때만 동적으로 불러온다. 메일과 무관한
 * 서버 요청이 SDK 로드 비용을 치르지 않게 하려는 것이다.
 */
import 'server-only'

import type { ReactElement } from 'react'

/** 모든 메일의 발신자 표기. Resend에 인증된 도메인이어야 한다. */
export const EMAIL_SENDER = 'GDGoC Yonsei <gdgoc.yonsei@moveto.kr>'

/** 보낼 메일 한 통. 본문은 `emails/` 디렉터리의 React Email 템플릿으로 만든다. */
export type EmailMessage = {
  to: string
  subject: string
  react: ReactElement
}

/**
 * 메일 여러 통을 병렬로 보낸다.
 *
 * Resend는 발송 실패를 예외가 아니라 응답 값으로 알려 주므로, 네트워크 오류나 설정
 * 누락처럼 예외가 나는 경우만 호출부로 전파된다. 받는 사람이 없으면 아무것도 하지 않는다.
 */
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
