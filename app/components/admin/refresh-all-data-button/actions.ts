'use server'

import { invalidateAllPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function revalidateAllDataAction() {
  await requirePermission('get', 'adminPage')

  logger.info('admin.refresh-all', 'Refreshing public cache surfaces')
  invalidateAllPublicCache()
}
