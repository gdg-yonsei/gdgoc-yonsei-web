'use server'

import { invalidateAllPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { requirePermission } from '@/lib/server/permission/require-permission'

/**
 * 공개 사이트의 모든 캐시를 즉시 무효화한다(관리자 대시보드의 새로고침 버튼).
 * DB를 직접 고친 뒤 화면에 반영되지 않을 때 쓰는 비상용 기능이다.
 */
export async function revalidateAllDataAction() {
  await requirePermission('get', 'adminPage')

  logger.info('admin.refresh-all', 'Refreshing public cache surfaces')
  invalidateAllPublicCache()
}
