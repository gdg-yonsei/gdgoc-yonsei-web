import 'server-only'

import { and, count, eq, gt, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { mcpImageUpload } from '@/db/schema/mcp-image-upload'

type UploadKind = 'presigned' | 'import'

// 사용자별 advisory lock 안에서 한도 확인·예약을 함께 해 동시 요청이 같은 잔여 한도를 쓰지 않게 한다.
export async function reserveUpload(upload: {
  userId: string
  kind: UploadKind
  objectKey: string | null
  expiresAt: Date
  limit: number
  windowStart: Date
}): Promise<string | null> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`mcp_image_upload:${upload.userId}`}, 0))`
    )
    const [used] = await tx
      .select({ value: count() })
      .from(mcpImageUpload)
      .where(
        and(
          eq(mcpImageUpload.userId, upload.userId),
          gt(mcpImageUpload.createdAt, upload.windowStart)
        )
      )
    if ((used?.value ?? 0) >= upload.limit) return null

    const [row] = await tx
      .insert(mcpImageUpload)
      .values({
        userId: upload.userId,
        kind: upload.kind,
        objectKey: upload.objectKey,
        expiresAt: upload.expiresAt,
      })
      .returning({ id: mcpImageUpload.id })
    return row?.id ?? null
  })
}

export async function assignUploadKey(id: string, objectKey: string) {
  await db
    .update(mcpImageUpload)
    .set({ objectKey })
    .where(eq(mcpImageUpload.id, id))
}

// 정리에 임대된 객체는 곧 삭제되므로 완료가 false면 URL을 반환하지 않는다.
// 정리의 FOR UPDATE 잠금으로 완료와 정리가 동시에 성공하지 않게 한다.
export async function markUploadCompleted(objectKey: string): Promise<boolean> {
  const updated = await db
    .update(mcpImageUpload)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(mcpImageUpload.objectKey, objectKey),
        isNull(mcpImageUpload.completedAt),
        isNull(mcpImageUpload.rejectedAt),
        isNull(mcpImageUpload.claimedAt)
      )
    )
    .returning({ id: mcpImageUpload.id })
  return updated.length > 0
}

/** 거절된 업로드. 줄은 남겨 시간당 한도에 계속 포함되게 한다. */
export async function markUploadRejected(
  target: { id: string } | { objectKey: string }
) {
  await db
    .update(mcpImageUpload)
    .set({ rejectedAt: new Date() })
    .where(
      'id' in target
        ? eq(mcpImageUpload.id, target.id)
        : eq(mcpImageUpload.objectKey, target.objectKey)
    )
}

// SKIP LOCKED로 최대 limit개를 임대하며 leaseMs가 지난 실패 건은 재시도한다.
// R2 삭제 뒤에만 finishUploadCleanup으로 완료해야 한다.
export async function claimExpiredUploads(
  now: Date,
  limit: number,
  leaseMs: number
): Promise<{ id: string; objectKey: string | null }[]> {
  const claimable = db
    .select({ id: mcpImageUpload.id })
    .from(mcpImageUpload)
    .where(
      and(
        isNull(mcpImageUpload.completedAt),
        isNull(mcpImageUpload.rejectedAt),
        lt(mcpImageUpload.expiresAt, now),
        or(
          isNull(mcpImageUpload.claimedAt),
          lt(mcpImageUpload.claimedAt, new Date(now.getTime() - leaseMs))
        )
      )
    )
    .orderBy(mcpImageUpload.expiresAt)
    .limit(limit)
    .for('update', { skipLocked: true })

  return db
    .update(mcpImageUpload)
    .set({ claimedAt: now })
    .where(sql`${mcpImageUpload.id} in (${claimable})`)
    .returning({ id: mcpImageUpload.id, objectKey: mcpImageUpload.objectKey })
}

// R2 삭제 또는 키 없는 정리 건만 완료한다. 한도 계산에 1시간 더 필요하므로 기록은 나중에 지운다.
export async function finishUploadCleanup(id: string) {
  await db
    .update(mcpImageUpload)
    .set({ rejectedAt: new Date() })
    .where(eq(mcpImageUpload.id, id))
}

export async function pruneSettledUploads(before: Date) {
  await db
    .delete(mcpImageUpload)
    .where(
      and(
        lt(mcpImageUpload.createdAt, before),
        or(
          isNotNull(mcpImageUpload.completedAt),
          isNotNull(mcpImageUpload.rejectedAt)
        )
      )
    )
}

// 거절 객체를 지우지 못하면 거절로 닫지 않고 즉시 만료시켜 정리에서 재시도한다. 한도에는 계속 포함된다.
export async function expireUploadNow(
  target: { id: string } | { objectKey: string }
) {
  await db
    .update(mcpImageUpload)
    .set({ expiresAt: new Date() })
    .where(
      'id' in target
        ? eq(mcpImageUpload.id, target.id)
        : eq(mcpImageUpload.objectKey, target.objectKey)
    )
}
