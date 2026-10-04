import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findPart, findGeneration, sendEmails } = vi.hoisted(() => ({
  findPart: vi.fn(),
  findGeneration: vi.fn(),
  sendEmails: vi.fn(),
}))
vi.mock('@/db', () => ({
  db: {
    query: {
      parts: { findFirst: findPart },
      generations: { findFirst: findGeneration },
    },
  },
}))
vi.mock('@/lib/server/email', () => ({ sendEmails }))

import { sendNewSessionEmails } from '@/lib/server/services/admin/sessions/notifications'

const session = {
  sessionId: 'session',
  partId: 1,
  participantId: ['registered'],
  name: 'Talk',
  locationKo: '서울',
  startAt: new Date('2026-10-10T10:00:00Z'),
  endAt: new Date('2026-10-10T11:00:00Z'),
  maxCapacity: 20,
}
const membership = (
  userId: string,
  email: string,
  sessionNotiEmail = true
) => ({
  userId,
  user: { email, sessionNotiEmail },
})

beforeEach(() => {
  vi.clearAllMocks()
  findPart.mockResolvedValue({ name: 'Cloud', generationsId: 1 })
})

describe('new session notifications', () => {
  it('sends one notification per email, excluding participants and opt-outs', async () => {
    const member = membership('member', 'member@example.com')
    findGeneration.mockResolvedValue({
      name: '2026',
      parts: [
        {
          usersToParts: [
            member,
            membership('registered', 'registered@example.com'),
          ],
        },
        {
          usersToParts: [
            member,
            membership('opt-out', 'opt-out@example.com', false),
            membership('empty', ''),
            membership('other', 'other@example.com'),
          ],
        },
      ],
    })
    await sendNewSessionEmails(session)
    expect(sendEmails).toHaveBeenCalledWith([
      expect.objectContaining({ to: 'member@example.com' }),
      expect.objectContaining({ to: 'other@example.com' }),
    ])
  })

  it('does not send notifications for a part without a generation', async () => {
    findPart.mockResolvedValue(undefined)
    await sendNewSessionEmails(session)
    expect(sendEmails).not.toHaveBeenCalled()
  })
})
