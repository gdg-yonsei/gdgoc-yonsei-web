/**
 * 보관 기간이 지난 세션을 지운다(조회·이벤트는 FK cascade). 스케줄러가 없어 수집 API가 응답 뒤에 하루 한 번 부른다.
 * 인스턴스마다 하루 한 번씩 돌아도 결과가 같다.
 */
import 'server-only'

import { inArray, lt } from 'drizzle-orm'
import { db } from '@/db'
import { analyticsSessions } from '@/db/schema/analytics'
import { RETENTION_MONTHS } from '@/lib/analytics/constants'

const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000
// 한 번에 지우는 행을 제한해 긴 잠금을 피한다.
const PRUNE_BATCH_SIZE = 10_000

let lastPrunedAt = Number.NEGATIVE_INFINITY

/** 지금부터 26개월 전 시각. 마지막 활동이 이보다 이전인 세션이 삭제 대상이다. */
export function retentionCutoff(now: Date): Date {
  const cutoff = new Date(now.getTime())
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS)
  return cutoff
}

/** 마지막 정리 후 24시간이 지났으면 자리를 차지하고 true를 돌려준다. */
export function claimPruneSlot(now: Date): boolean {
  if (now.getTime() - lastPrunedAt < PRUNE_INTERVAL_MS) return false
  lastPrunedAt = now.getTime()
  return true
}

/** 지운 세션 수를 돌려준다. */
export async function pruneExpiredAnalytics(now: Date): Promise<number> {
  const cutoff = retentionCutoff(now)
  let total = 0
  for (;;) {
    const expired = db
      .select({ id: analyticsSessions.id })
      .from(analyticsSessions)
      .where(lt(analyticsSessions.lastSeenAt, cutoff))
      .limit(PRUNE_BATCH_SIZE)
    const deleted = await db
      .delete(analyticsSessions)
      .where(inArray(analyticsSessions.id, expired))
      .returning({ id: analyticsSessions.id })
    total += deleted.length
    if (deleted.length < PRUNE_BATCH_SIZE) return total
  }
}
