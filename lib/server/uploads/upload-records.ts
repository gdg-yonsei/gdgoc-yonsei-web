import 'server-only'

import { and, count, eq, gt, inArray, isNull, lt } from 'drizzle-orm'
import db from '@/db'
import { mcpImageUpload } from '@/db/schema/mcp-image-upload'

export async function countRecentUploads(
  userId: string,
  since: Date
): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(mcpImageUpload)
    .where(
      and(
        eq(mcpImageUpload.userId, userId),
        gt(mcpImageUpload.createdAt, since)
      )
    )
  return rows[0]?.value ?? 0
}

export async function recordUpload(upload: {
  objectKey: string
  userId: string
  kind: 'presigned' | 'import'
  expiresAt: Date
}) {
  await db.insert(mcpImageUpload).values(upload)
}

export async function markUploadCompleted(objectKey: string) {
  await db
    .update(mcpImageUpload)
    .set({ completedAt: new Date() })
    .where(eq(mcpImageUpload.objectKey, objectKey))
}

export async function forgetUpload(objectKey: string) {
  await db.delete(mcpImageUpload).where(eq(mcpImageUpload.objectKey, objectKey))
}

/**
 * 완료되지 않은 채 만료된 업로드를 최대 limit 개 골라 기록에서 지우고 키를 돌려준다.
 * 호출자는 돌려받은 키의 R2 객체를 지운다.
 */
export async function claimExpiredUploads(
  now: Date,
  limit: number
): Promise<string[]> {
  const expired = await db
    .select({ id: mcpImageUpload.id, objectKey: mcpImageUpload.objectKey })
    .from(mcpImageUpload)
    .where(
      and(isNull(mcpImageUpload.completedAt), lt(mcpImageUpload.expiresAt, now))
    )
    .limit(limit)
  if (expired.length === 0) return []

  await db.delete(mcpImageUpload).where(
    inArray(
      mcpImageUpload.id,
      expired.map((row) => row.id)
    )
  )
  return expired.map((row) => row.objectKey)
}
