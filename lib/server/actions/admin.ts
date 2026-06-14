import 'server-only'

import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { Session } from 'next-auth'
import { forbidden } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/auth'
import handlePermission, {
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/handle-permission'
import r2Client from '@/lib/server/r2-client'
import { getR2BucketEnv } from '@/lib/server/env'
import { normalizeR2ImageObjectKey } from '@/lib/server/r2-object-key'

type AuthSession = Session | null

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
      session: AuthSession
    }
  | {
      ok: false
      response: ReturnType<typeof forbidden>
    }
> {
  const session = await auth()
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

export function getZodActionError(
  error: unknown,
  fallback = 'Validation error'
) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback
  }

  return null
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
