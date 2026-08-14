import 'server-only'

import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { forbidden } from 'next/navigation'
import { z } from 'zod'
import { getAuthSession, type AuthSession } from '@/auth'
import handlePermission, {
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/handle-permission'
import r2Client from '@/lib/server/r2-client'
import { getR2BucketEnv } from '@/lib/server/env'
import { normalizeR2ImageObjectKey } from '@/lib/server/r2-object-key'

export async function authorizeAdminAction({
  action,
  resource,
  dataOwnerId,
}: {
  action: ActionType
  resource: ResourceType
  dataOwnerId?: string
}): Promise<
  | {
      ok: true
      session: AuthSession | null
    }
  | {
      ok: false
      response: ReturnType<typeof forbidden>
    }
> {
  const session = await getAuthSession()
  const allowed = await handlePermission(
    session?.user?.id,
    action,
    resource,
    dataOwnerId
  )

  if (!allowed) {
    return {
      ok: false,
      response: forbidden(),
    }
  }

  return {
    ok: true,
    session,
  }
}

/**
 * 서버 액션 입력값을 검증하고, **검증을 통과한 값**을 돌려준다.
 *
 * 이전에는 각 액션이 `schema.parse()` 를 try/catch 로 감싸고 결과를 버린 뒤
 * 원본 폼 값을 그대로 DB 에 넣었다. 스키마에 걸린 `.trim()` 이나 `.transform()` 이
 * 통째로 유실됐고(예: `"  Web  "` 이 공백째로 저장), ZodError 가 아닌 예외는
 * catch 가 삼킨 뒤 `return` 없이 빠져나가 검증되지 않은 값으로 DB 쓰기까지 진행됐다.
 *
 * 검증 결과를 반환값으로 강제해 두 문제를 구조적으로 막는다.
 */
export function parseActionInput<Output>(
  schema: z.ZodType<Output>,
  input: unknown,
  fallback = 'Validation error'
): { ok: true; data: Output } | { ok: false; error: string } {
  const result = schema.safeParse(input)

  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues[0]?.message ?? fallback,
    }
  }

  return { ok: true, data: result.data }
}

export function stripHtmlCharacters(value: string | null | undefined) {
  return value ? value.replaceAll('<', '').replaceAll('>', '') : ''
}

export async function insertRowsIfAny<Row>(
  rows: readonly Row[],
  insertRows: (rows: Row[]) => unknown
) {
  if (rows.length === 0) {
    return
  }

  await insertRows([...rows])
}

export async function replaceRelationRows<Row>({
  deleteRows,
  rows,
  insertRows,
}: {
  deleteRows: () => unknown
  rows: readonly Row[]
  insertRows: (rows: Row[]) => unknown
}) {
  await deleteRows()
  await insertRowsIfAny(rows, insertRows)
}

export async function deleteRemovedR2Images({
  previousImages,
  nextImages,
  previousMainImage,
  nextMainImage,
  prefix,
}: {
  previousImages: readonly string[]
  nextImages: readonly string[]
  previousMainImage?: string | null
  nextMainImage?: string | null
  prefix: 'projects' | 'sessions'
}) {
  const nextImageSet = new Set(nextImages)
  const removedImages = previousImages.filter(
    (image) => !nextImageSet.has(image)
  )

  if (previousMainImage && previousMainImage !== nextMainImage) {
    removedImages.push(previousMainImage)
  }

  const imageKeys = removedImages
    .map((imageUrl) => normalizeR2ImageObjectKey(imageUrl, prefix))
    .filter((imageKey): imageKey is string => Boolean(imageKey))

  if (imageKeys.length === 0) {
    return
  }

  const bucketEnv = getR2BucketEnv()

  await Promise.all(
    imageKeys.map((imageKey) =>
      r2Client.send(
        new DeleteObjectCommand({
          Bucket: bucketEnv.R2_BUCKET_NAME,
          Key: imageKey,
        })
      )
    )
  )
}
