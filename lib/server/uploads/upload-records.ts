import 'server-only'

import { and, count, eq, gt, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import db from '@/db'
import { mcpImageUpload } from '@/db/schema/mcp-image-upload'

type UploadKind = 'presigned' | 'import'

/**
 * 시간당 한도 안에서 업로드 한 건을 예약한다. 한도에 닿았으면 null.
 *
 * 사용자별 advisory lock 을 트랜잭션 동안 잡고 세기와 삽입을 함께 하므로,
 * 동시에 들어온 요청이 같은 개수를 읽고 모두 통과하는 일이 없다.
 */
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

/** URL 가져오기: 형식을 안 뒤 정해진 객체 키를 예약에 붙인다. */
export async function assignUploadKey(id: string, objectKey: string) {
  await db
    .update(mcpImageUpload)
    .set({ objectKey })
    .where(eq(mcpImageUpload.id, id))
}

/**
 * 검증이 끝난 업로드를 완료로 표시한다. 정리 작업이 이미 가져간(claimed) 업로드면
 * false — 그 객체는 곧 지워지므로 URL 을 돌려주면 안 된다.
 * 정리 작업은 대상 줄을 FOR UPDATE 로 잡으므로 두 쪽이 동시에 이길 수 없다.
 */
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

/**
 * 완료·거절 없이 만료된 업로드를 최대 limit 개 임대한다(한 문장, SKIP LOCKED).
 * 임대가 끝난(leaseMs 지난) 줄은 이전 정리가 실패한 것이므로 다시 가져온다.
 * 호출자는 R2 객체를 지운 뒤에만 finishUploadCleanup 으로 줄을 지운다.
 */
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

/** R2 객체를 지운(또는 키가 없던) 정리 대상 줄을 지운다. */
export async function finishUploadCleanup(id: string) {
  await db.delete(mcpImageUpload).where(eq(mcpImageUpload.id, id))
}

/** 한도 계산에 더 필요 없는 끝난 줄(완료·거절)을 지운다. */
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

/**
 * 거절했지만 R2 객체를 지우지 못한 업로드: 거절로 닫지 않고 지금 만료시켜
 * 정리 작업이 객체 삭제를 다시 시도하게 한다(줄은 그때까지 한도에 포함된다).
 */
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
