// 공지는 사용자마다 읽음 여부가 달라 공유 캐시하지 않는다.
import 'server-only'

import { cache } from 'react'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { announcementReads, announcements } from '@/db/schema/announcements'

export type UnreadAnnouncement = {
  id: string
  title: string
  body: string
  ctaLabel: string | null
  ctaHref: string | null
}

/** 아직 닫지 않은 공지 중 가장 최근 것 하나. 여러 개가 쌓여도 한 번에 하나만 띄운다. */
export const getUnreadAnnouncement = cache(
  async (userId: string): Promise<UnreadAnnouncement | null> => {
    const [row] = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        body: announcements.body,
        ctaLabel: announcements.ctaLabel,
        ctaHref: announcements.ctaHref,
      })
      .from(announcements)
      .leftJoin(
        announcementReads,
        and(
          eq(announcementReads.announcementId, announcements.id),
          eq(announcementReads.userId, userId)
        )
      )
      .where(isNull(announcementReads.userId))
      .orderBy(desc(announcements.createdAt))
      .limit(1)
    return row ?? null
  }
)

export type AdminAnnouncementListItem = {
  id: string
  title: string
  body: string
  ctaHref: string | null
  createdAt: Date
  readCount: number
}

/** 리드 관리 화면용. 호출부가 권한을 먼저 확인해야 한다. */
export const getAnnouncements = cache(
  async (): Promise<AdminAnnouncementListItem[]> =>
    db
      .select({
        id: announcements.id,
        title: announcements.title,
        body: announcements.body,
        ctaHref: announcements.ctaHref,
        createdAt: announcements.createdAt,
        readCount: count(announcementReads.userId),
      })
      .from(announcements)
      .leftJoin(
        announcementReads,
        eq(announcementReads.announcementId, announcements.id)
      )
      .groupBy(announcements.id)
      .orderBy(desc(announcements.createdAt))
)
