// 크론 대신 업로드 시작 때 만료 기록을 조금씩 치운다. DB 상태 변경은 uploads/upload-records.ts에 둔다.
import 'server-only'

import { logger } from '@/lib/server/logger'
import { deleteImage } from '@/lib/server/storage/r2'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  claimExpiredUploads,
  expireUploadNow,
  finishUploadCleanup,
  markUploadRejected,
  pruneSettledUploads,
  reserveUpload,
} from '@/lib/server/uploads/upload-records'

/** 사용자당 한 시간에 시작할 수 있는 업로드(직접 업로드 + URL 가져오기) 수. */
export const UPLOADS_PER_HOUR = 100
/** 한 번에 치우는 만료된 미완료 업로드 수. 요청 지연을 짧게 유지한다. */
const CLEANUP_BATCH = 20
/** 정리 임대 시간. 이 안에 R2 삭제가 끝나지 않으면 다음 정리가 다시 시도한다. */
const CLEANUP_LEASE_MS = 10 * 60 * 1000
/** 끝난(완료·거절) 기록을 남겨 두는 기간. 한도는 한 시간만 보면 된다. */
const SETTLED_RETENTION_MS = 2 * 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

// 실패·거절도 포함해 시간당 한도를 원자적으로 예약하고 만료된 미완료 업로드를 조금씩 치운다.
export async function beginUpload(
  actor: Actor,
  upload: {
    kind: 'presigned' | 'import'
    objectKey: string | null
    ttlMs: number
  }
): Promise<ServiceResult<string>> {
  const now = new Date()
  const id = await reserveUpload({
    userId: actor.userId,
    kind: upload.kind,
    objectKey: upload.objectKey,
    expiresAt: new Date(now.getTime() + upload.ttlMs),
    limit: UPLOADS_PER_HOUR,
    windowStart: new Date(now.getTime() - HOUR_MS),
  })
  if (!id) {
    return fail(
      'RATE_LIMITED',
      `Upload limit reached (${UPLOADS_PER_HOUR} per hour). Try again later.`
    )
  }

  await cleanUpAbandonedUploads(now)
  return ok(id)
}

// 임대한 만료 객체는 R2 삭제 뒤에만 완료로 표시한다. 삭제 실패는 임대 종료 뒤 재시도한다.
async function cleanUpAbandonedUploads(now: Date) {
  try {
    const claimed = await claimExpiredUploads(
      now,
      CLEANUP_BATCH,
      CLEANUP_LEASE_MS
    )
    await Promise.all(
      claimed.map(async ({ id, objectKey }) => {
        try {
          if (objectKey) await deleteImage(objectKey)
          await finishUploadCleanup(id)
        } catch (error) {
          logger.error('mcp.images.cleanup', error, { id, objectKey })
        }
      })
    )
    await pruneSettledUploads(new Date(now.getTime() - SETTLED_RETENTION_MS))
  } catch (error) {
    logger.error('mcp.images.cleanup', error)
  }
}

// 검증 실패 객체도 삭제 후 거절로 남겨 한도에 포함한다. 삭제 실패는 즉시 만료시켜 정리에서 재시도한다.
export async function rejectUpload(
  target: { id: string } | { objectKey: string },
  objectKey?: string
) {
  try {
    if (objectKey) {
      try {
        await deleteImage(objectKey)
      } catch (error) {
        logger.error('mcp.images.discard', error, { key: objectKey })
        await expireUploadNow(target)
        return
      }
    }
    await markUploadRejected(target)
  } catch (error) {
    logger.error('mcp.images.reject', error, { ...target })
  }
}
