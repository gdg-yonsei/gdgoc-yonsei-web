import 'server-only'

import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import r2Client from '@/lib/server/r2-client'
import { getR2BucketEnv } from '@/lib/server/env'
import { normalizeR2ImageObjectKey } from '@/lib/server/r2-object-key'

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
