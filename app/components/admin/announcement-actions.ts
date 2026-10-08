'use server'

import { markAnnouncementRead } from '@/lib/server/services/admin/announcements'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

/** 모달은 결과와 관계없이 바로 닫힌다. 기록에 실패하면 다음 접속 때 다시 뜬다. */
export async function markAnnouncementReadAction(announcementId: string) {
  const actor = await getWebActor()
  if (!actor) return
  await markAnnouncementRead(actor, announcementId)
}
