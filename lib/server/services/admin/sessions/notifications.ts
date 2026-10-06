// 알림 메일은 생성·신청 서비스가 runAfterResponse로 응답 뒤에 보낸다.
import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { users } from '@/db/schema/users'
import { sendEmails } from '@/lib/server/email'

/** 새 세션이 열렸음을 같은 기수의 수신 동의 멤버에게 알린다(이미 참가자로 지정된 사람 제외). */
export async function sendNewSessionEmails({
  sessionId,
  partId,
  participantId,
  name,
  locationKo,
  startAt,
  endAt,
  maxCapacity,
}: {
  sessionId: string
  partId: number
  participantId: string[]
  name: string
  locationKo: string
  startAt: Date
  endAt: Date
  maxCapacity: number
}) {
  const partGeneration = await db.query.parts.findFirst({
    where: eq(parts.id, partId),
    columns: { name: true, generationsId: true },
  })

  if (!partGeneration?.generationsId) {
    return
  }

  const generationUsers = await db.query.generations.findFirst({
    where: eq(generations.id, partGeneration.generationsId),
    columns: { name: true },
    with: {
      parts: {
        columns: {},
        with: {
          usersToParts: {
            columns: { userId: true },
            with: {
              user: { columns: { email: true, sessionNotiEmail: true } },
            },
          },
        },
      },
    },
  })

  const participantIds = new Set(participantId)
  const recipientEmails = new Set<string>()
  for (const part of generationUsers?.parts ?? []) {
    for (const { userId, user } of part.usersToParts) {
      if (!participantIds.has(userId) && user.email && user.sessionNotiEmail) {
        recipientEmails.add(user.email)
      }
    }
  }

  const [{ default: NewSession }, { getSiteEnv }] = await Promise.all([
    import('@/emails/new-session'),
    import('@/lib/server/env'),
  ])
  const siteEnv = getSiteEnv()

  await sendEmails(
    [...recipientEmails].map((email) => ({
      to: email,
      subject: `[GDGoC Yonsei] ${name} 세션 참가 신청`,
      react: NewSession({
        session: {
          name,
          location: locationKo,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          leftCapacity: maxCapacity - participantId.length,
        },
        part: partGeneration.name,
        generation: generationUsers?.name || '',
        registerUrl: `${siteEnv.NEXT_PUBLIC_SITE_URL}/admin/sessions/${sessionId}/register`,
      }),
    }))
  )
}

// 신청 직전 세션을 받으므로 남은 자리는 이번 신청자를 빼고 계산한다.
export async function sendNewParticipantEmail({
  authorEmail,
  participantId,
  session,
}: {
  authorEmail: string
  participantId: string
  session: {
    nameKo: string
    locationKo: string | null
    startAt: Date | null
    endAt: Date | null
    maxCapacity: number | null
    userToSession: readonly unknown[]
  }
}) {
  const { default: NewParticipant } = await import('@/emails/new-participant')
  const participant = await db.query.users.findFirst({
    where: eq(users.id, participantId),
  })

  await sendEmails([
    {
      to: authorEmail,
      subject: `[GDGoC Yonsei] 새로운 참가자가 등록했습니다.`,
      react: NewParticipant({
        session: {
          name: session.nameKo,
          location: session.locationKo!,
          startAt: session.startAt?.toISOString() ?? 'TBD',
          endAt: session.endAt?.toISOString() ?? 'TBD',
          leftCapacity: session.maxCapacity
            ? session.maxCapacity - session.userToSession.length - 1
            : 0,
        },
        participantName: participant?.name ?? '',
      }),
    },
  ])
}
