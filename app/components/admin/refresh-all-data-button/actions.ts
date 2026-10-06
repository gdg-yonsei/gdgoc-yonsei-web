'use server'

import { invalidateAllPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { requirePermission } from '@/lib/server/permission/require-permission'

/** DB 직접 변경 뒤 사용하는 비상 갱신으로, 목록 캐시는 즉시 무효화한다.
 * 세션·프로젝트 상세는 다음 방문 때 백그라운드에서 갱신한다. */
export async function revalidateAllDataAction() {
  await requirePermission('put', 'publicCache')

  logger.info('admin.refresh-all', 'Refreshing public cache surfaces')
  invalidateAllPublicCache()
}
