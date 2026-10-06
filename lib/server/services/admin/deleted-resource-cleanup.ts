// DB 삭제 커밋 후 정리한다. 캐시 실패도 R2 정리를 막지 않으며 R2 실패는 로그에만 남긴다.
import 'server-only'

import { uniqueStrings } from '@/lib/server/cache/utils'
import { logger } from '@/lib/server/logger'
import { normalizeR2ImageObjectKey } from '@/lib/server/storage/object-key'
import { deleteImages } from '@/lib/server/storage/r2'

export async function cleanupDeletedResource({
  dataType,
  dataId,
  images,
  mainImage,
  invalidateCache,
}: {
  dataType: 'projects' | 'sessions'
  dataId: string
  images: readonly string[]
  mainImage: string
  invalidateCache: () => void
}): Promise<void> {
  try {
    invalidateCache()
  } catch (error) {
    logger.error('admin.delete-resource.cache-invalidation', error, {
      dataType,
      dataId,
      rowDeleted: true,
    })
  }

  const imageKeys = uniqueStrings(
    [...images, mainImage].map((image) =>
      normalizeR2ImageObjectKey(image, dataType)
    )
  )
  if (!(await deleteImages(imageKeys))) {
    logger.warn(
      'admin.delete-resource.r2-cleanup',
      'Row deleted but its images could not be removed from R2',
      { dataType, dataId, imageKeys }
    )
  }
}
